# LLM Caching Implementation Checklist

Use this checklist when implementing multi-level caching for LLM applications.

## Pre-Implementation

### Cache Strategy Selection
- [ ] **Analyze query patterns** - Are queries repetitive or unique?
- [ ] **Estimate similarity** - Do similar queries expect similar responses?
- [ ] **Calculate costs** - Current LLM token spend per month
- [ ] **Define success metrics** - Target hit rate, cost reduction, latency
- [ ] **Choose cache levels** - L1 (LRU), L2 (Redis), L3 (Prompt Cache), or all?

### Redis Infrastructure Setup
- [ ] **Install Redis Stack** - Redis + RedisSearch + RedisJSON
- [ ] **Configure persistence** - RDB or AOF for durability
- [ ] **Set memory limits** - `maxmemory` and eviction policy
- [ ] **Enable RedisSearch** - Module loaded (`redis-server --loadmodule ...`)
- [ ] **Set up RedisInsight** - UI for cache inspection at `localhost:8001`
- [ ] **Plan connection pooling** - Socket keepalive, health checks, retry logic

### Threshold Planning
- [ ] **Define similarity threshold** - Start at 0.92 (cosine), adjust based on precision
- [ ] **Plan quality filtering** - Minimum quality score for cached responses
- [ ] **Set TTL policies** - L1: 5-10min, L2: 1-24hr, L3: 5min (auto-refresh)
- [ ] **Define metadata filters** - agent_type, content_type, difficulty_level
- [ ] **Plan eviction strategy** - LRU, quality-based, or hybrid

### Embedding Model Selection
- [ ] **Choose embedding model** - OpenAI (1536 dims), Voyage AI (1024 dims), etc.
- [ ] **Validate dimensions** - Match vector index dimension config
- [ ] **Test embedding latency** - Measure API call time
- [ ] **Plan caching for embeddings** - Cache query embeddings (LRU)
- [ ] **Budget embedding costs** - Track usage for cache writes

## Implementation

### L1: In-Memory LRU Cache

```python
from cachetools import TTLCache
import hashlib

# Initialize LRU cache (10k entries, 5 min TTL)
lru_cache = TTLCache(maxsize=10_000, ttl=300)

def hash_content(content: str) -> str:
    """Generate stable hash for exact matching."""
    return hashlib.sha256(content.encode()).hexdigest()

async def get_llm_response(query: str, agent_type: str) -> dict:
    """L1 cache lookup."""
    cache_key = f"{agent_type}:{hash_content(query)}"

    # L1: Exact match
    if cache_key in lru_cache:
        logger.info(f"L1 cache hit: {cache_key}")
        return lru_cache[cache_key]  # ~1ms, 100% savings

    # ... continue to L2
```

- [ ] LRU cache initialized with size and TTL limits
- [ ] Hash function generates stable keys
- [ ] Cache key includes agent_type (namespace)
- [ ] Cache hits logged for monitoring
- [ ] Thread-safe implementation (if multi-threaded)

### L2: Redis Semantic Cache

```python
from redisvl.index import SearchIndex
from redisvl.query import VectorQuery
from redis import Redis

# 1. Define index schema
CACHE_INDEX_SCHEMA = {
    "index": {
        "name": "llm_semantic_cache",
        "prefix": "cache:",
    },
    "fields": [
        {"name": "agent_type", "type": "tag"},
        {"name": "content_type", "type": "tag"},
        {"name": "input_hash", "type": "tag"},
        {
            "name": "embedding",
            "type": "vector",
            "attrs": {
                "dims": 1536,  # Match embedding model
                "distance_metric": "cosine",
                "algorithm": "hnsw",
            }
        },
        {"name": "response", "type": "text"},
        {"name": "created_at", "type": "numeric"},
        {"name": "hit_count", "type": "numeric"},
        {"name": "quality_score", "type": "numeric"},
    ]
}

# 2. Initialize Redis + RedisVL
redis_client = Redis.from_url(
    "redis://localhost:6379",
    socket_keepalive=True,
    socket_keepalive_options={
        socket.TCP_KEEPIDLE: 120,
        socket.TCP_KEEPINTVL: 30,
        socket.TCP_KEEPCNT: 3
    }
)

schema = IndexSchema.from_dict(CACHE_INDEX_SCHEMA)
index = SearchIndex(schema, redis_client)
index.create(overwrite=False)

# 3. Semantic cache lookup
async def get_from_semantic_cache(
    query: str,
    agent_type: str,
    threshold: float = 0.92
) -> CacheEntry | None:
    """L2 semantic cache lookup."""

    # Generate embedding
    embedding = await embed_text(query[:2000])

    # Build query with filters
    filter_expr = f"@agent_type:{{{agent_type}}}"

    query = VectorQuery(
        vector=embedding,
        vector_field_name="embedding",
        return_fields=["response", "quality_score", "hit_count"],
        num_results=1,
        filter_expression=filter_expr
    )

    results = index.query(query)

    if results and len(results) > 0:
        result = results[0]
        distance = float(result.get("vector_distance", 1.0))

        # Check similarity threshold
        if distance <= (1 - threshold):
            # Increment hit count
            redis_client.hincrby(result["id"], "hit_count", 1)

            logger.info(f"L2 cache hit: distance={distance:.4f}")
            return CacheEntry(
                response=json.loads(result["response"]),
                quality_score=float(result["quality_score"]),
                distance=distance
            )

    return None
```

- [ ] Redis Stack installed and running
- [ ] Index schema defined with correct dimensions
- [ ] Index created in Redis
- [ ] Vector search returns top-k results
- [ ] Similarity threshold enforced
- [ ] Hit count incremented on cache hit
- [ ] Metadata filters applied (agent_type, content_type)

### L3: Prompt Caching (Provider Native)

```python
class PromptCacheManager:
    """Manage Claude prompt caching with cache breakpoints."""

    def build_cached_messages(
        self,
        system_prompt: str,
        few_shot_examples: str | None = None,
        schema_prompt: str | None = None,
        dynamic_content: str = ""
    ) -> list[dict]:
        """Build messages with cache breakpoints."""

        content_parts = []

        # Breakpoint 1: System prompt (always cached)
        content_parts.append({
            "type": "text",
            "text": system_prompt,
            "cache_control": {"type": "ephemeral"}
        })

        # Breakpoint 2: Few-shot examples (cached per content type)
        if few_shot_examples:
            content_parts.append({
                "type": "text",
                "text": few_shot_examples,
                "cache_control": {"type": "ephemeral"}
            })

        # Breakpoint 3: Schema documentation (always cached)
        if schema_prompt:
            content_parts.append({
                "type": "text",
                "text": schema_prompt,
                "cache_control": {"type": "ephemeral"}
            })

        # Dynamic content (NOT cached)
        content_parts.append({
            "type": "text",
            "text": dynamic_content
        })

        return [{"role": "user", "content": content_parts}]
```

- [ ] `cache_control` markers added to static content
- [ ] Dynamic content placed AFTER cache breakpoints
- [ ] Cached content > 1024 tokens (Claude minimum)
- [ ] Cache breakpoints minimized (max 4 per request)
- [ ] System prompts stable across requests

### Cache Hierarchy Integration

```python
async def get_llm_response_with_caching(
    query: str,
    agent_type: str,
    system_prompt: str,
    few_shot_examples: str | None = None
) -> dict:
    """Multi-level cache lookup with fallback to LLM."""

    # L1: Exact match (in-memory)
    cache_key = f"{agent_type}:{hash_content(query)}"
    if cache_key in lru_cache:
        logger.info("L1 cache hit")
        return lru_cache[cache_key]

    # L2: Semantic similarity (Redis)
    embedding = await embed_text(query)
    similar = await semantic_cache.get(
        query=query,
        agent_type=agent_type,
        threshold=0.92
    )
    if similar and similar.distance < 0.08:
        logger.info(f"L2 cache hit: distance={similar.distance:.4f}")
        lru_cache[cache_key] = similar.response  # Promote to L1
        return similar.response

    # L3 + L4: Prompt caching + LLM call
    logger.info("L3/L4: Calling LLM with prompt cache")
    messages = prompt_cache_manager.build_cached_messages(
        system_prompt=system_prompt,
        few_shot_examples=few_shot_examples,
        dynamic_content=query
    )

    response = await llm.generate(messages=messages)

    # Store in L2 and L1
    await semantic_cache.set(
        content=query,
        response=response,
        agent_type=agent_type,
        quality_score=1.0
    )
    lru_cache[cache_key] = response

    return response
```

- [ ] Cache levels checked in order (L1 → L2 → L3 → L4)
- [ ] L2 hits promoted to L1 (hot cache)
- [ ] LLM responses stored in L2 and L1
- [ ] Logging distinguishes cache levels
- [ ] Error handling for each cache layer

### Cache Warming (Optional)

```python
async def warm_cache_from_golden_dataset(
    cache: SemanticCache,
    min_quality: float = 0.8
) -> int:
    """Warm cache with high-quality historical responses."""

    # Load golden dataset analyses
    analyses = await db.query(
        "SELECT * FROM analyses WHERE confidence_score >= ?",
        (min_quality,)
    )

    warmed = 0
    for analysis in analyses:
        # Extract agent findings
        for finding in analysis.findings:
            await cache.set(
                content=analysis.content,
                response=finding.output,
                agent_type=finding.agent_type,
                quality_score=finding.confidence_score
            )
            warmed += 1

    logger.info(f"Warmed cache with {warmed} entries")
    return warmed
```

- [ ] Golden dataset available
- [ ] Quality threshold set (0.8+)
- [ ] Cache warmed on startup
- [ ] Warming progress logged
- [ ] Failures handled gracefully

## Verification

### Cache Hit Rate Monitoring

```python
@dataclass
class CacheMetrics:
    """Track cache performance."""

    # Hit rates
    l1_hits: int = 0
    l2_hits: int = 0
    l3_hits: int = 0
    l4_hits: int = 0
    total_requests: int = 0

    @property
    def l1_hit_rate(self) -> float:
        return self.l1_hits / self.total_requests if self.total_requests > 0 else 0.0

    @property
    def l2_hit_rate(self) -> float:
        return self.l2_hits / self.total_requests if self.total_requests > 0 else 0.0

    @property
    def combined_hit_rate(self) -> float:
        return (self.l1_hits + self.l2_hits) / self.total_requests if self.total_requests > 0 else 0.0
```

- [ ] **L1 hit rate** - Target: 10-20%
- [ ] **L2 hit rate** - Target: 30-50%
- [ ] **L3 cache read tokens** - Track via API response headers
- [ ] **Combined hit rate** - Target: 40-70%
- [ ] **Metrics exposed** - Prometheus, Langfuse, or logs

### Cost Tracking

```python
async def track_cache_savings(metrics: CacheMetrics):
    """Calculate cost savings from caching."""

    # Assume average request = 18k tokens @ $3/MTok
    COST_PER_REQUEST = 0.054
    PROMPT_CACHE_SAVINGS = 0.40  # 40% savings

    # L1 + L2: 100% savings
    full_cache_savings = (metrics.l1_hits + metrics.l2_hits) * COST_PER_REQUEST

    # L3: 40% savings (prompt cache benefit)
    prompt_cache_savings = metrics.l3_hits * COST_PER_REQUEST * PROMPT_CACHE_SAVINGS

    # L4: No savings
    total_cost = metrics.l4_hits * COST_PER_REQUEST

    total_savings = full_cache_savings + prompt_cache_savings
    savings_percentage = total_savings / (total_savings + total_cost) * 100

    logger.info(f"Estimated savings: ${total_savings:.2f} ({savings_percentage:.1f}%)")
```

- [ ] **Cost per request measured** - Token usage tracked
- [ ] **Savings calculated** - L1+L2: 100%, L3: 40-90%
- [ ] **Total cost reduction** - Target: 70-95%
- [ ] **Trended over time** - Daily/weekly reports
- [ ] **ROI validated** - Cache infrastructure cost < savings

### Quality Validation

```python
@pytest.mark.asyncio
async def test_semantic_cache_quality():
    """Validate semantic cache returns relevant responses."""

    test_cases = [
        {
            "query": "How to implement binary search in Python?",
            "cached_query": "Python binary search implementation",
            "should_match": True  # Very similar
        },
        {
            "query": "Explain quantum computing",
            "cached_query": "How to implement binary search?",
            "should_match": False  # Completely different
        }
    ]

    for case in test_cases:
        # Store cached response
        await cache.set(
            content=case["cached_query"],
            response={"answer": "cached response"},
            agent_type="test"
        )

        # Query with similar/different query
        result = await cache.get(
            content=case["query"],
            agent_type="test",
            threshold=0.92
        )

        if case["should_match"]:
            assert result is not None, f"Should match: {case['query']}"
        else:
            assert result is None, f"Should NOT match: {case['query']}"
```

- [ ] **False positives** - Wrong cached responses < 5%
- [ ] **False negatives** - Missed valid hits < 10%
- [ ] **Threshold tuned** - Adjusted based on precision/recall
- [ ] **Quality scores validated** - Only high-quality responses cached
- [ ] **Manual spot checks** - Review 10-20 cache hits

### Latency Testing

```python
@pytest.mark.asyncio
async def test_cache_latency():
    """Measure cache lookup latency."""

    import time

    # L1: In-memory
    start = time.perf_counter()
    result = lru_cache.get(key)
    l1_latency = (time.perf_counter() - start) * 1000
    assert l1_latency < 5, f"L1 latency {l1_latency:.2f}ms > 5ms"

    # L2: Redis semantic
    start = time.perf_counter()
    result = await semantic_cache.get(query, agent_type)
    l2_latency = (time.perf_counter() - start) * 1000
    assert l2_latency < 20, f"L2 latency {l2_latency:.2f}ms > 20ms"
```

- [ ] **L1 latency** - < 5ms (target: 1ms)
- [ ] **L2 latency** - < 20ms (target: 5-10ms)
- [ ] **L3 latency** - < 3s (prompt cache benefit)
- [ ] **L4 latency** - < 5s (full LLM generation)
- [ ] **P95 tracked** - 95th percentile latency acceptable

## Post-Implementation

### Production Monitoring
- [ ] **Cache hit rate dashboard** - Real-time metrics
- [ ] **Cost savings report** - Daily/weekly aggregates
- [ ] **False positive alerts** - User feedback on wrong responses
- [ ] **Redis memory usage** - Alert at 80% capacity
- [ ] **Cache eviction rate** - Track evicted entries

### Optimization Opportunities
- [ ] **Dynamic threshold adjustment** - Adapt based on hit rate
- [ ] **Quality-based eviction** - Keep high-quality responses
- [ ] **LLM reranking** - Rerank top-k candidates for precision
- [ ] **Metadata filtering** - Add more filters (difficulty, tags)
- [ ] **Multi-query retrieval** - Generate query variations

### Cache Maintenance
- [ ] **Cleanup stale entries** - Remove entries with 0 hit count after 24hr
- [ ] **Prune low-quality** - Evict responses with quality < 0.6
- [ ] **Checkpoint warm cache** - Export/import for disaster recovery
- [ ] **Monitor Redis health** - Memory fragmentation, command latency
- [ ] **Update embeddings** - Re-embed if model changes

## Troubleshooting

| Issue | Check |
|-------|-------|
| Low hit rate | Lower threshold, add cache warming, check query distribution |
| High false positives | Raise threshold, add quality filtering, use reranking |
| Redis connection errors | Check connection pooling, socket keepalive, firewall |
| Slow L2 lookups | Verify HNSW index, check Redis memory, reduce vector dims |
| Cache not persisting | Enable Redis AOF/RDB, check disk space |
| Prompt cache not working | Verify content > 1024 tokens, check API response headers |

## SkillForge Integration

```python
# Example: Multi-level caching for content analysis
from app.shared.services.cache.llm_cache import get_llm_response_with_caching

response = await get_llm_response_with_caching(
    query=content,
    agent_type="security_auditor",
    system_prompt=SECURITY_PROMPT,
    few_shot_examples=SECURITY_EXAMPLES
)

# Monitor cache metrics at http://localhost:8001 (RedisInsight)
# Track costs in Langfuse at http://localhost:3000
```

- [ ] Cache integrated with LangGraph workflow nodes
- [ ] Cache metrics exposed to Langfuse
- [ ] Cost savings tracked per agent type
- [ ] Cache warming runs on deployment

## References

- **Redis Blog**: https://redis.io/blog/prompt-caching-vs-semantic-caching/
- **RedisVL Docs**: https://redis.io/docs/latest/develop/ai/redisvl/
- **Templates**: `.claude/skills/llm-caching-patterns/templates/`
- **Related Skill**: `.claude/skills/langfuse-observability/`
