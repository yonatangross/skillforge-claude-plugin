---
name: llm-caching-patterns
description: Multi-level caching strategies for LLM applications - semantic caching (Redis), prompt caching (Claude native), cache hierarchies, cost optimization, and Langfuse cost tracking with hierarchical trace rollup for 70-95% cost reduction
version: 1.2.0
author: SkillForge AI Agent Hub
tags: [llm, caching, redis, cost-optimization, semantic-cache, prompt-cache, langfuse, trace-hierarchy, 2025]
---

# LLM Caching Patterns

## Overview

Modern LLM applications can reduce costs by 70-95% through intelligent multi-level caching. This skill covers the **double caching architecture** (2025 best practice): combining Redis semantic caching with provider-native prompt caching for maximum efficiency.

**When to use this skill:**
- High-volume LLM applications with repeated queries
- Cost-sensitive AI features
- Similar query patterns (e.g., analyzing similar content types)
- Applications requiring sub-second response times
- Multi-agent systems with redundant LLM calls

**Expected Impact:**
- **L1 (LRU) Cache**: 10-20% hit rate, ~1ms latency, 100% cost savings
- **L2 (Redis Semantic)**: 30-50% hit rate, ~5-10ms latency, 100% cost savings
- **L3 (Prompt Cache)**: 80-100% coverage, ~2s latency, 90% token cost savings
- **Combined**: 70-95% total cost reduction

## Core Concepts

### Double Caching Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    CACHE HIERARCHY (2025 BEST PRACTICE)         │
└─────────────────────────────────────────────────────────────────┘

Request → L1 (Exact Hash) → L2 (Semantic) → L3 (Prompt) → L4 (Full LLM)
           ↓ Hit: ~1ms      ↓ Hit: ~10ms     ↓ Cached     ↓ Full Cost
         100% savings      100% savings      90% savings   $$$

L1: In-Memory LRU Cache
────────────────────────
• Exact content hash matching
• 1,000-10,000 entry size
• TTL: 5-10 minutes
• Use Case: Duplicate requests within session
• Implementation: Python functools.lru_cache or cachetools

L2: Redis Semantic Cache
─────────────────────────
• Vector similarity search (cosine distance < 0.08)
• Configurable similarity threshold (0.85-0.95)
• TTL: 1-24 hours
• Use Case: Similar but not identical queries
• Implementation: RedisVL SemanticCache + RediSearch

L3: Prompt Caching (Provider Native)
────────────────────────────────────
• Cache identical prompt PREFIXES (system prompts, examples)
• Claude: cache_control ephemeral markers
• GPT: Cached prefix automatically detected
• TTL: 5 minutes (auto-refresh on use)
• Use Case: Same prompts, different user content
• March 2025: Cache reads don't count against rate limits!

L4: Full LLM Call
─────────────────
• No cache hit - full generation required
• Store response in L2 and L1 for future hits
• Full token cost
```

### Cache Decision Flow

```python
async def get_llm_response(query: str, agent_type: str) -> dict:
    """Multi-level cache lookup."""

    # L1: Exact match (in-memory)
    cache_key = hash_content(query)
    if cache_key in lru_cache:
        return lru_cache[cache_key]  # ~1ms, 100% savings

    # L2: Semantic similarity (Redis)
    embedding = await embed_text(query)
    similar = await redis_cache.find_similar(
        embedding=embedding,
        agent_type=agent_type,
        threshold=0.92  # Configurable
    )
    if similar and similar.distance < 0.08:
        lru_cache[cache_key] = similar.response  # Promote to L1
        return similar.response  # ~10ms, 100% savings

    # L3 + L4: Prompt caching + LLM call
    # Prompt cache breakpoints reduce L4 cost by 90%
    response = await llm.generate(
        messages=build_cached_messages(
            system_prompt=AGENT_PROMPT,  # ← Cached
            examples=few_shot_examples,   # ← Cached
            user_content=query            # ← NOT cached
        )
    )

    # Store in L2 and L1
    await redis_cache.set(embedding, response, agent_type)
    lru_cache[cache_key] = response

    return response  # L3: ~2s, 90% savings | L4: ~3s, full cost
```

### Similarity Threshold Tuning

**Problem**: How similar is "similar enough" to return a cached response?

**Threshold Guidelines** (cosine similarity):
- **0.98-1.00** (distance 0.00-0.02): Nearly identical - safe to return
- **0.95-0.98** (distance 0.02-0.05): Very similar - usually safe
- **0.92-0.95** (distance 0.05-0.08): Similar - validate with reranking
- **0.85-0.92** (distance 0.08-0.15): Moderately similar - risky
- **< 0.85** (distance > 0.15): Different - do not return

**Recommended Starting Point**: 0.92 (distance < 0.08)

**Tuning Process**:
1. Start at 0.92 threshold
2. Monitor false positives (wrong cached responses)
3. Monitor false negatives (cache misses that should've hit)
4. Adjust threshold based on precision/recall tradeoff
5. Different thresholds per agent type (security=0.95, general=0.90)

### Cache Warming Strategy

Pre-populate cache from golden dataset for instant hit rates:

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

    return warmed
```

## Redis Semantic Cache Implementation

### Schema Design

```python
# RedisVL Index Schema
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
                "dims": 1536,  # OpenAI text-embedding-3-small
                "distance_metric": "cosine",
                "algorithm": "hnsw",  # Fast approximate search
            }
        },
        {"name": "response", "type": "text"},
        {"name": "created_at", "type": "numeric"},
        {"name": "hit_count", "type": "numeric"},
        {"name": "quality_score", "type": "numeric"},
    ]
}
```

### Service Class

```python
from redisvl.index import SearchIndex
from redisvl.query import VectorQuery
from redis import Redis

class SemanticCacheService:
    """Redis semantic cache for LLM responses."""

    def __init__(self, redis_url: str, similarity_threshold: float = 0.92):
        self.client = Redis.from_url(redis_url)
        self.threshold = similarity_threshold
        self.embedding_service = EmbeddingService()

        # Initialize RedisVL index
        schema = IndexSchema.from_dict(CACHE_INDEX_SCHEMA)
        self.index = SearchIndex(schema, self.client)
        self.index.create(overwrite=False)

    async def get(
        self,
        content: str,
        agent_type: str,
        content_type: str | None = None
    ) -> CacheEntry | None:
        """Look up cached response by semantic similarity."""

        # Generate embedding
        embedding = await self.embedding_service.embed_text(content[:2000])

        # Build query with filters
        filter_expr = f"@agent_type:{{{agent_type}}}"
        if content_type:
            filter_expr += f" @content_type:{{{content_type}}}"

        query = VectorQuery(
            vector=embedding,
            vector_field_name="embedding",
            return_fields=["response", "quality_score", "hit_count"],
            num_results=1,
            filter_expression=filter_expr
        )

        results = self.index.query(query)

        if results and len(results) > 0:
            result = results[0]
            distance = float(result.get("vector_distance", 1.0))

            # Check similarity threshold
            if distance <= (1 - self.threshold):
                # Increment hit count
                self.client.hincrby(result["id"], "hit_count", 1)

                return CacheEntry(
                    response=json.loads(result["response"]),
                    quality_score=float(result["quality_score"]),
                    hit_count=int(result["hit_count"]),
                    distance=distance
                )

        return None

    async def set(
        self,
        content: str,
        response: dict,
        agent_type: str,
        content_type: str | None = None,
        quality_score: float = 1.0
    ) -> None:
        """Store response in cache."""
        content_preview = content[:2000]
        embedding = await self.embedding_service.embed_text(content_preview)

        key = f"cache:{agent_type}:{hash_content(content_preview)}"

        data = {
            "agent_type": agent_type,
            "content_type": content_type or "",
            "input_hash": hash_content(content_preview),
            "embedding": embedding,
            "response": json.dumps(response),
            "created_at": time.time(),
            "hit_count": 0,
            "quality_score": quality_score,
        }

        self.client.hset(key, mapping=data)
        self.client.expire(key, ttl=86400)  # 24 hours
```

## Prompt Caching (Claude Native)

### Cache Breakpoint Strategy

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
        """Build messages with cache breakpoints.

        Cache structure:
        1. System prompt (always cached)
        2. Few-shot examples (cached per content type)
        3. Schema documentation (always cached)
        ──────────────── CACHE BREAKPOINT ────────────────
        4. Dynamic content (NEVER cached)
        """

        content_parts = []

        # Breakpoint 1: System prompt
        content_parts.append({
            "type": "text",
            "text": system_prompt,
            "cache_control": {"type": "ephemeral"}
        })

        # Breakpoint 2: Few-shot examples (if provided)
        if few_shot_examples:
            content_parts.append({
                "type": "text",
                "text": few_shot_examples,
                "cache_control": {"type": "ephemeral"}
            })

        # Breakpoint 3: Schema documentation (if provided)
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

### Cost Calculation

```
Without Prompt Caching:
─────────────────────────
System prompt:    2,000 tokens @ $3/MTok = $0.006
Few-shot examples: 5,000 tokens @ $3/MTok = $0.015
Schema docs:      1,000 tokens @ $3/MTok = $0.003
User content:    10,000 tokens @ $3/MTok = $0.030
────────────────────────────────────────
Total input:     18,000 tokens           = $0.054 per request

With Prompt Caching (90% hit rate):
───────────────────────────────────
Cached prefix:    8,000 tokens @ $0.30/MTok = $0.0024 (cache read)
User content:    10,000 tokens @ $3/MTok    = $0.0300
────────────────────────────────────────
Total:           18,000 tokens              = $0.0324 per request

Savings: 40% per request

With Semantic Cache (35% hit rate) + Prompt Cache:
──────────────────────────────────────────────────
35% requests: $0.00 (semantic cache hit)
65% requests: $0.0324 (prompt cache benefit)
Average: $0.021 per request

Total Savings: 61% vs no caching
```

## Optimization Techniques

### 1. LLM Reranking (Optional)

For higher precision, rerank top-k semantic cache candidates:

```python
async def get_with_reranking(
    query: str,
    agent_type: str,
    top_k: int = 3
) -> CacheEntry | None:
    """Retrieve with LLM reranking for better precision."""

    # Get top-k candidates
    candidates = await semantic_cache.get_topk(query, agent_type, k=top_k)

    if not candidates:
        return None

    # Use lightweight model to rerank
    rerank_prompt = f"""
    Query: {query}

    Rank these cached responses by relevance (1 = most relevant):
    {format_candidates(candidates)}
    """

    ranking = await lightweight_llm.rank(rerank_prompt)
    best_candidate = candidates[ranking[0]]

    if best_candidate.score > 0.8:  # Rerank threshold
        return best_candidate

    return None
```

### 2. Metadata Filtering

Filter before vector search to improve precision:

```python
# Good: Filter by agent_type + content_type
query = VectorQuery(
    vector=embedding,
    filter_expression="@agent_type:{security_auditor} @content_type:{article}"
)

# Better: Add difficulty level
query = VectorQuery(
    vector=embedding,
    filter_expression="""
        @agent_type:{security_auditor}
        @content_type:{article}
        @difficulty_level:{advanced}
    """
)
```

### 3. Quality-Based Eviction

Prioritize keeping high-quality responses:

```python
async def evict_low_quality_entries(cache: SemanticCache, max_size: int):
    """Evict low-quality entries when cache is full."""

    # Get all entries sorted by quality score
    entries = await cache.get_all_sorted_by_quality()

    if len(entries) > max_size:
        # Keep top N by quality, evict rest
        to_evict = entries[max_size:]
        for entry in to_evict:
            await cache.delete(entry.key)
```

### 4. Dynamic Threshold Adjustment

Adjust similarity threshold based on cache hit rate:

```python
class AdaptiveThresholdManager:
    """Dynamically adjust threshold based on metrics."""

    def __init__(self, target_hit_rate: float = 0.35):
        self.target = target_hit_rate
        self.threshold = 0.92

    async def adjust(self, actual_hit_rate: float):
        """Adjust threshold to reach target hit rate."""

        if actual_hit_rate < self.target - 0.05:
            # Too many misses, lower threshold (more permissive)
            self.threshold = max(0.85, self.threshold - 0.01)
        elif actual_hit_rate > self.target + 0.05:
            # Too many hits (possibly false positives), raise threshold
            self.threshold = min(0.98, self.threshold + 0.01)

        logger.info(f"Adjusted threshold to {self.threshold}")
```

## Monitoring & Observability

### Key Metrics

```python
@dataclass
class CacheMetrics:
    """Track cache performance."""

    # Hit rates
    l1_hit_rate: float
    l2_hit_rate: float
    l3_hit_rate: float
    combined_hit_rate: float

    # Latency
    l1_avg_latency_ms: float
    l2_avg_latency_ms: float
    l3_avg_latency_ms: float
    l4_avg_latency_ms: float

    # Cost
    estimated_cost_saved_usd: float
    total_requests: int

    # Quality
    false_positive_rate: float  # Wrong cached responses
    false_negative_rate: float  # Missed valid cache hits
```

### Langfuse Cost Tracking (2025 Best Practice)

**Langfuse automatically tracks token usage and costs for all LLM calls.** This eliminates manual cost calculation and provides accurate cost attribution.

#### Automatic Cost Tracking with Custom Trace IDs

```python
from langfuse.decorators import observe, langfuse_context
from uuid import UUID

@observe(as_type="generation")
async def call_llm_with_cache(
    prompt: str,
    agent_type: str,
    analysis_id: UUID | None = None
) -> str:
    """LLM call with automatic cost tracking via Langfuse.

    CRITICAL: Always link to parent trace for cost attribution!
    """

    # Link to parent analysis trace (for cost rollup)
    if analysis_id:
        langfuse_context.update_current_trace(
            name=f"{agent_type}_generation",
            session_id=str(analysis_id),  # Group by analysis
            tags=[agent_type, "cached"],
            metadata={"analysis_id": str(analysis_id)}
        )

    # Langfuse decorator automatically:
    # 1. Captures input/output tokens
    # 2. Calculates costs using model pricing
    # 3. Tags with agent_type for cost attribution
    # 4. Records cache hit/miss status

    # L1: Check exact cache
    cache_key = hash_content(prompt)
    if cache_key in lru_cache:
        # Mark as cache hit (zero cost)
        langfuse_context.update_current_observation(
            metadata={"cache_layer": "L1", "cache_hit": True}
        )
        return lru_cache[cache_key]

    # L2: Check semantic cache
    embedding = await embed_text(prompt)
    similar = await redis_cache.find_similar(embedding, agent_type)
    if similar:
        langfuse_context.update_current_observation(
            metadata={"cache_layer": "L2", "cache_hit": True, "distance": similar.distance}
        )
        return similar.response

    # L3/L4: LLM call with prompt caching
    # Langfuse automatically tracks token usage and cost
    response = await llm.generate(
        messages=build_cached_messages(prompt),
        model="claude-3-5-sonnet-20241022"
    )

    # Langfuse records:
    # - input_tokens (total)
    # - output_tokens
    # - cache_creation_input_tokens (prompt cache breakpoints)
    # - cache_read_input_tokens (cached prefix tokens)
    # - total_cost (calculated from model pricing)

    langfuse_context.update_current_observation(
        metadata={
            "cache_layer": "L3/L4",
            "cache_hit": False,
            "prompt_cache_hit": response.usage.cache_read_input_tokens > 0
        }
    )

    # Store in L2 and L1 for future hits
    await redis_cache.set(embedding, response.content, agent_type)
    lru_cache[cache_key] = response.content

    return response.content
```

#### Trace Hierarchy for Cost Attribution (SkillForge Pattern)

```python
from langfuse import Langfuse
from langfuse.decorators import observe, langfuse_context
from uuid import uuid4, UUID

class AnalysisWorkflow:
    """Multi-agent workflow with hierarchical cost tracking."""

    @observe(as_type="trace")
    async def run_analysis(self, url: str, analysis_id: UUID) -> dict:
        """Parent trace - aggregates all child agent costs.

        Trace Hierarchy:
        run_analysis (trace)
        ├── tech_comparator_generation (generation)
        ├── security_auditor_generation (generation)
        ├── implementation_planner_generation (generation)
        └── synthesis_generation (generation)

        Langfuse automatically rolls up costs to parent trace.
        """

        # Set trace metadata for filtering/grouping
        langfuse_context.update_current_trace(
            name="content_analysis",
            session_id=str(analysis_id),
            user_id=url,  # Group by URL for deduplication analysis
            tags=["multi-agent", "production"],
            metadata={
                "analysis_id": str(analysis_id),
                "url": url,
                "agent_count": 8
            }
        )

        # Each agent call creates a child generation
        findings = {}
        for agent in self.agents:
            # Child generation auto-linked to parent trace
            result = await self.run_agent(
                agent=agent,
                content=content,
                analysis_id=analysis_id  # Links to parent
            )
            findings[agent.name] = result

        # Synthesis also tracked as child generation
        synthesis = await self.synthesize_findings(
            findings=findings,
            analysis_id=analysis_id
        )

        # Langfuse dashboard shows:
        # - Total cost for this trace (sum of all child generations)
        # - Token breakdown by agent type
        # - Cache hit rate per agent
        # - Latency per agent

        return {"findings": findings, "synthesis": synthesis}

    @observe(as_type="generation")
    async def run_agent(
        self,
        agent: Agent,
        content: str,
        analysis_id: UUID
    ) -> dict:
        """Child generation - costs roll up to parent trace."""

        langfuse_context.update_current_observation(
            name=f"{agent.name}_generation",
            metadata={
                "agent_type": agent.name,
                "content_length": len(content)
            }
        )

        # LLM call automatically tracked
        response = await agent.analyze(content)

        return response
```

#### Cost Rollup Query Pattern

```python
from langfuse import Langfuse
from datetime import datetime, timedelta

async def get_analysis_costs(analysis_id: UUID) -> dict:
    """Get total cost for an analysis (parent trace + all child generations)."""

    langfuse = Langfuse()

    # Fetch parent trace by session_id
    traces = langfuse.get_traces(
        session_id=str(analysis_id),
        limit=1
    )

    if not traces.data:
        return {"error": "Trace not found"}

    trace = traces.data[0]

    # Langfuse automatically aggregates child costs
    return {
        "trace_id": trace.id,
        "total_cost": trace.total_cost,  # Sum of all child generations
        "input_tokens": trace.usage.input_tokens,
        "output_tokens": trace.usage.output_tokens,
        "cache_read_tokens": trace.usage.cache_read_input_tokens,
        "observations_count": trace.observation_count,  # Number of child LLM calls
        "latency_ms": trace.latency,
        "created_at": trace.timestamp
    }

async def get_daily_costs_by_agent() -> list[dict]:
    """Get cost breakdown by agent type for last 30 days."""

    langfuse = Langfuse()

    # Fetch all generations from last 30 days
    from_date = datetime.now() - timedelta(days=30)
    generations = langfuse.get_generations(
        from_timestamp=from_date,
        limit=10000
    )

    # Group by agent type (from metadata)
    costs_by_agent = {}
    for gen in generations.data:
        agent_type = gen.metadata.get("agent_type", "unknown")
        cost = gen.calculated_total_cost or 0.0

        if agent_type not in costs_by_agent:
            costs_by_agent[agent_type] = {
                "agent_type": agent_type,
                "total_cost": 0.0,
                "call_count": 0,
                "total_input_tokens": 0,
                "total_output_tokens": 0,
                "cache_hits": 0
            }

        costs_by_agent[agent_type]["total_cost"] += cost
        costs_by_agent[agent_type]["call_count"] += 1
        costs_by_agent[agent_type]["total_input_tokens"] += gen.usage.input or 0
        costs_by_agent[agent_type]["total_output_tokens"] += gen.usage.output or 0

        if gen.metadata.get("cache_hit"):
            costs_by_agent[agent_type]["cache_hits"] += 1

    # Calculate averages
    results = []
    for stats in costs_by_agent.values():
        stats["avg_cost_per_call"] = stats["total_cost"] / stats["call_count"]
        stats["cache_hit_rate"] = stats["cache_hits"] / stats["call_count"]
        results.append(stats)

    # Sort by total cost descending
    results.sort(key=lambda x: x["total_cost"], reverse=True)

    return results
```

#### Cost Attribution by Agent Type

```python
# Langfuse dashboard query:
# GROUP BY metadata.agent_type
# SUM(total_cost) AS cost_per_agent
#
# Results show:
# - security_auditor: $12.45 (35% cache hit rate)
# - implementation_planner: $8.23 (42% cache hit rate)
# - tech_comparator: $5.67 (58% cache hit rate)
```

#### Cache Effectiveness Analysis

```python
from langfuse import Langfuse

langfuse = Langfuse()

# Query all generations with cache metadata
generations = langfuse.get_generations(
    limit=1000,
    from_timestamp=datetime.now() - timedelta(days=7)
)

cache_hits = 0
cache_misses = 0
total_cost = 0.0
cost_saved = 0.0

for gen in generations:
    metadata = gen.metadata or {}
    is_cache_hit = metadata.get("cache_hit", False)

    if is_cache_hit:
        cache_hits += 1
        # Estimate saved cost (cost of equivalent full LLM call)
        cost_saved += gen.calculated_total_cost or 0  # Would be higher without cache
    else:
        cache_misses += 1
        total_cost += gen.calculated_total_cost or 0

hit_rate = cache_hits / (cache_hits + cache_misses)
print(f"Cache Hit Rate: {hit_rate:.1%}")
print(f"Cost Saved: ${cost_saved:.2f}")
print(f"Total Cost: ${total_cost:.2f}")
print(f"Savings Rate: {(cost_saved / (cost_saved + total_cost)):.1%}")
```

#### Model Pricing Registry

```python
from dataclasses import dataclass

@dataclass
class ModelInfo:
    """Model configuration with pricing."""

    model_id: str
    display_name: str
    max_tokens: int
    input_cost_per_1m: float  # USD per 1M input tokens
    output_cost_per_1m: float  # USD per 1M output tokens

    def calculate_cost(self, input_tokens: int, output_tokens: int) -> float:
        """Calculate total cost for token usage."""
        input_cost = (input_tokens / 1_000_000) * self.input_cost_per_1m
        output_cost = (output_tokens / 1_000_000) * self.output_cost_per_1m
        return input_cost + output_cost

# Claude 3.5 Sonnet (Updated March 2025)
MODEL_REGISTRY = {
    "claude-3-5-sonnet-20241022": ModelInfo(
        model_id="claude-3-5-sonnet-20241022",
        display_name="Claude 3.5 Sonnet (New)",
        max_tokens=8192,
        input_cost_per_1m=3.00,  # $3 per 1M tokens
        output_cost_per_1m=15.00,  # $15 per 1M tokens
    ),
    "gpt-4-turbo-2024-04-09": ModelInfo(
        model_id="gpt-4-turbo-2024-04-09",
        display_name="GPT-4 Turbo",
        max_tokens=4096,
        input_cost_per_1m=10.00,
        output_cost_per_1m=30.00,
    ),
}
```

#### Langfuse Dashboard Views

Access cost insights at `http://localhost:3000`:

**Cost Dashboard**:
- Total cost by day/week/month
- Cost breakdown by model
- Cost attribution by agent type
- Cache hit rate impact on costs
- Top 10 most expensive traces

**Cache Effectiveness**:
- L1/L2/L3 hit rates over time
- Cost savings from semantic cache
- Cost savings from prompt cache
- False positive rate (wrong cache hits)

**Agent Performance**:
- Average cost per agent invocation
- Token usage distribution
- Cache hit rate by agent type
- Quality score vs. cost correlation

### RedisInsight Dashboard

Access Redis cache visualization at `http://localhost:8001`:

- View cache entries
- Monitor vector similarity distributions
- Track hit/miss rates by agent type
- Analyze quality score distributions
- Identify hot keys

## Local Model Considerations (Ollama)

When using local models via Ollama, the caching calculus changes:

**Cost Impact:**
| Provider | Caching Value | Reason |
|----------|--------------|--------|
| Cloud APIs | **Critical** | $3-15 per MTok |
| Ollama Local | **Optional** | FREE per token |

**When to still cache with Ollama:**
- **Latency reduction**: Cache provides ~1-10ms vs ~50-200ms for local inference
- **Memory pressure**: Avoid loading multiple models for repeated queries
- **Batch CI runs**: Same queries across test runs benefit from L1 cache

**Simplified Cache Strategy for Local:**
```python
# With Ollama, L1 (LRU) cache is usually sufficient
# Skip L2 (Redis semantic) unless latency-critical

async def get_local_llm_response(query: str) -> str:
    # L1: Exact match only (sufficient for local)
    cache_key = hash_content(query)
    if cache_key in lru_cache:
        return lru_cache[cache_key]  # ~1ms

    # Direct local inference (FREE, fast enough)
    response = await ollama_provider.ainvoke(query)  # ~50-200ms

    # Store in L1 only
    lru_cache[cache_key] = response.content
    return response.content
```

**Best Practice:** Use factory pattern to apply full caching hierarchy only for cloud APIs:

```python
if settings.OLLAMA_ENABLED:
    # Minimal caching for local models
    return LocalCacheStrategy(l1_only=True)
else:
    # Full L1/L2/L3 caching for cloud APIs
    return CloudCacheStrategy(l1=True, l2=True, l3=True)
```

See **ai-native-development** skill section "10. Local LLM Inference with Ollama" for provider setup.

---

## References

- **Redis Blog**: [Prompt Caching vs Semantic Caching](https://redis.io/blog/prompt-caching-vs-semantic-caching/) (Dec 2025)
- **Redis Blog**: [10 Techniques for Semantic Cache Optimization](https://redis.io/blog/10-techniques-for-semantic-cache-optimization/)
- **RedisVL Docs**: [SemanticCache Guide](https://redis.io/docs/latest/develop/ai/redisvl/user_guide/llmcache/)
- **LangChain**: [RedisSemanticCache](https://python.langchain.com/api_reference/redis/cache/langchain_redis.cache.RedisSemanticCache.html)
- **Anthropic**: [Prompt Caching Guide](https://docs.anthropic.com/claude/docs/prompt-caching) (March 2025: cache reads free!)

## Integration Examples

See:
- `references/redis-setup.md` - Docker Compose + RedisVL setup
- `references/cache-hierarchy.md` - Multi-level cache implementation
- `references/cost-optimization.md` - ROI calculations and benchmarks
- `templates/semantic-cache-service.py` - Production-ready service
- `templates/prompt-cache-wrapper.py` - Claude caching wrapper
- `examples/skillforge-integration.md` - SkillForge specific patterns

---

**Skill Version**: 1.3.0
**Last Updated**: 2025-12-28
**Maintained by**: SkillForge AI Agent Hub

## Changelog

### v1.3.0 (2025-12-28)
- Added "Local Model Considerations (Ollama)" section
- Added cost comparison table for cloud vs local caching value
- Added simplified caching strategy for local models
- Added factory pattern example for adaptive caching
- Cross-referenced ai-native-development skill for Ollama setup

### v1.2.0 (2025-12-27)
- Added hierarchical trace pattern for multi-agent cost rollup
- Added `session_id` linking pattern for cost attribution to parent analysis
- Added cost rollup query patterns with Langfuse API
- Added daily cost breakdown by agent type example
- Updated automatic cost tracking with custom trace ID support
- Added SkillForge-specific multi-agent workflow cost tracking pattern

### v1.1.0 (2025-12-27)
- Added comprehensive Langfuse cost tracking section
- Added automatic cost tracking with `@observe` decorator
- Added cost attribution by agent type patterns
- Added cache effectiveness analysis with Langfuse API
- Added model pricing registry with `calculate_cost()` method
- Added Langfuse dashboard views for cost insights
- Updated monitoring section with cost tracking best practices

### v1.0.0 (2025-12-14)
- Initial skill with double caching architecture (L1/L2/L3/L4)
- Redis semantic cache implementation with RedisVL
- Claude prompt caching patterns
- Cache warming strategies
- Similarity threshold tuning guidelines
- Optimization techniques (reranking, metadata filtering, quality-based eviction)
