# Cache Warming Strategies

## Why Warm the Cache?

**Cold start problem:** New cache has 0% hit rate until populated.

**Solution:** Pre-populate cache with high-quality historical responses for instant hit rates.

## Strategy 1: Golden Dataset Warming

```python
async def warm_cache_from_golden_dataset(
    cache: SemanticCacheService,
    min_quality_score: float = 0.8,
    max_entries: int | None = None
) -> int:
    """Warm cache from golden dataset (98 analyses, 415 chunks)."""

    # Query high-quality analyses
    analyses = await db.execute(
        """
        SELECT a.id, a.url, a.content_preview, f.agent_type, f.output, f.confidence_score
        FROM analyses a
        JOIN findings f ON f.analysis_id = a.id
        WHERE f.confidence_score >= :min_quality
        ORDER BY f.confidence_score DESC, a.created_at DESC
        LIMIT :max_entries
        """,
        {"min_quality": min_quality_score, "max_entries": max_entries or 1000}
    )

    warmed = 0
    for row in analyses:
        # Extract content + response
        content = row["content_preview"]
        response = json.loads(row["output"])

        # Generate embedding
        embedding = await embeddings_service.embed_text(content[:2000])

        # Store in cache
        await cache.set(
            embedding=embedding,
            response=response,
            agent_type=row["agent_type"],
            quality_score=row["confidence_score"]
        )

        warmed += 1

    logger.info("cache_warmed", entries=warmed, source="golden_dataset")
    return warmed
```

## Strategy 2: Query Log Replay

```python
async def warm_cache_from_query_logs(
    cache: SemanticCacheService,
    lookback_days: int = 30,
    min_frequency: int = 5
) -> int:
    """Warm cache from frequently-requested queries."""

    # Find most common queries
    common_queries = await db.execute(
        """
        SELECT query, agent_type, response, COUNT(*) as frequency
        FROM llm_query_logs
        WHERE created_at > NOW() - INTERVAL ':days days'
        GROUP BY query, agent_type, response
        HAVING COUNT(*) >= :min_freq
        ORDER BY frequency DESC
        """,
        {"days": lookback_days, "min_freq": min_frequency}
    )

    warmed = 0
    for row in common_queries:
        embedding = await embeddings_service.embed_text(row["query"])

        await cache.set(
            embedding=embedding,
            response=json.loads(row["response"]),
            agent_type=row["agent_type"],
            quality_score=0.9  # High quality (real production data)
        )

        warmed += 1

    logger.info("cache_warmed", entries=warmed, source="query_logs")
    return warmed
```

## Strategy 3: Synthetic Query Generation

```python
async def warm_cache_with_synthetic_queries(
    cache: SemanticCacheService,
    agent_type: str,
    num_queries: int = 100
) -> int:
    """Generate synthetic variations of common queries."""

    # Base queries for each agent
    BASE_QUERIES = {
        "security_auditor": [
            "Analyze this code for SQL injection vulnerabilities",
            "Check for XSS attack vectors in this implementation",
            "Identify authentication bypass risks",
        ],
        "implementation_planner": [
            "Plan implementation for user authentication",
            "Design database schema for e-commerce cart",
            "Outline REST API architecture",
        ],
        # ... more agents
    }

    base_queries = BASE_QUERIES.get(agent_type, [])
    warmed = 0

    for base_query in base_queries:
        # Generate variations
        variations = await llm.generate(
            f"Generate {num_queries // len(base_queries)} variations of this query:\n{base_query}\n\nVariations:"
        )

        for variant in variations.split("\n"):
            if not variant.strip():
                continue

            # Generate real LLM response
            response = await llm.generate_agent_response(variant, agent_type)

            # Cache it
            embedding = await embeddings_service.embed_text(variant)
            await cache.set(
                embedding=embedding,
                response=response,
                agent_type=agent_type,
                quality_score=0.7  # Synthetic data
            )

            warmed += 1

    logger.info("cache_warmed", entries=warmed, source="synthetic")
    return warmed
```

## Strategy 4: Progressive Warming

```python
class ProgressiveCacheWarmer:
    """Warm cache gradually during off-peak hours."""

    def __init__(
        self,
        cache: SemanticCacheService,
        rate_limit: int = 10  # entries per minute
    ):
        self.cache = cache
        self.rate_limit = rate_limit
        self.warmed_count = 0

    async def warm_progressively(
        self,
        entries: list[dict],
        off_peak_hours: tuple[int, int] = (22, 6)  # 10pm - 6am
    ):
        """Warm cache during off-peak hours only."""

        for entry in entries:
            # Check if we're in off-peak hours
            current_hour = datetime.now().hour
            if not (off_peak_hours[0] <= current_hour or current_hour < off_peak_hours[1]):
                logger.info("pausing_warming", reason="peak_hours")
                await asyncio.sleep(3600)  # Wait 1 hour
                continue

            # Warm entry
            embedding = await embeddings_service.embed_text(entry["query"])
            await self.cache.set(
                embedding=embedding,
                response=entry["response"],
                agent_type=entry["agent_type"],
                quality_score=entry.get("quality_score", 0.8)
            )

            self.warmed_count += 1

            # Rate limiting
            await asyncio.sleep(60 / self.rate_limit)

        logger.info("progressive_warming_complete", total=self.warmed_count)
```

## Warming Script

```python
# scripts/warm_semantic_cache.py
import asyncio
from backend.app.shared.services.cache import SemanticCacheService

async def main():
    cache = SemanticCacheService()

    print("🔥 Warming semantic cache...")

    # Strategy 1: Golden dataset (high quality)
    golden_count = await warm_cache_from_golden_dataset(
        cache,
        min_quality_score=0.8,
        max_entries=500
    )

    # Strategy 2: Query logs (real production data)
    logs_count = await warm_cache_from_query_logs(
        cache,
        lookback_days=30,
        min_frequency=5
    )

    total = golden_count + logs_count

    print(f"✅ Cache warmed with {total} entries")
    print(f"   - {golden_count} from golden dataset")
    print(f"   - {logs_count} from query logs")

    # Verify
    stats = await cache.get_stats()
    print(f"📊 Cache size: {stats.total_entries}")

if __name__ == "__main__":
    asyncio.run(main())
```

## Run Warming

```bash
# One-time warming
cd backend
poetry run python scripts/warm_semantic_cache.py

# Automated daily warming (cron)
0 2 * * * cd /app/backend && poetry run python scripts/warm_semantic_cache.py
```

## Monitoring Warm Cache Effectiveness

```python
# Track hit rate before/after warming
async def measure_warming_impact():
    # Before warming
    stats_before = await cache.get_stats()

    # Warm cache
    await warm_cache_from_golden_dataset(cache)

    # After warming (wait for some queries)
    await asyncio.sleep(3600)  # 1 hour
    stats_after = await cache.get_stats()

    improvement = stats_after.hit_rate - stats_before.hit_rate

    print(f"Hit rate improvement: +{improvement*100:.1f}%")
```

## Best Practices

1. **Start with golden dataset** (highest quality)
2. **Supplement with query logs** (real usage patterns)
3. **Avoid over-warming** (quality > quantity)
4. **Monitor false positive rate** after warming
5. **Re-warm periodically** (weekly or monthly) to refresh stale entries

## Cost Optimization

Warming requires embedding generation:

```
Cost of warming 1,000 entries:
─────────────────────────────
Embedding API: 1,000 × 2,000 tokens avg × $0.00002/1K = $0.04
Time: ~5 minutes (rate limits apply)

ROI:
─────────────────────────────
If warming improves hit rate by 10%:
10% × 10,000 requests/day × $0.03/request = $30/day savings

Payback period: < 1 day
```
