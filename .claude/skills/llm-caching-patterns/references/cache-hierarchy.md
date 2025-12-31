# Multi-Level Cache Hierarchy

## The Four-Tier Architecture

```
Request Flow:
─────────────

User Query
    ↓
L1: In-Memory LRU (exact match)
    ↓ Miss (~1ms)
L2: Redis Semantic (similarity)
    ↓ Miss (~10ms)
L3: Prompt Cache (prefix match)
    ↓ Miss (~2s, 90% savings)
L4: Full LLM Call
    ↓ (~3s, full cost)
Response
```

## Implementation

```python
from functools import lru_cache
from cachetools import TTLCache
import hashlib

class MultiLevelCacheManager:
    """Four-tier caching: L1 (LRU) → L2 (Redis) → L3 (Prompt) → L4 (LLM)."""

    def __init__(
        self,
        semantic_cache: SemanticCacheService,
        llm_client: LLMClient,
        l1_size: int = 10000,
        l1_ttl: int = 300  # 5 minutes
    ):
        self.semantic_cache = semantic_cache
        self.llm_client = llm_client

        # L1: In-memory LRU cache
        self.l1_cache = TTLCache(maxsize=l1_size, ttl=l1_ttl)

    def _hash_key(self, query: str, agent_type: str) -> str:
        """Generate cache key."""
        return hashlib.sha256(f"{agent_type}:{query}".encode()).hexdigest()

    async def get_response(
        self,
        query: str,
        agent_type: str,
        force_refresh: bool = False
    ) -> dict:
        """Get LLM response with multi-level caching."""

        if force_refresh:
            return await self._l4_full_llm_call(query, agent_type)

        # L1: Exact match (in-memory)
        cache_key = self._hash_key(query, agent_type)
        if cache_key in self.l1_cache:
            logger.info("cache_hit", level="L1", latency_ms=1)
            return self.l1_cache[cache_key]

        # L2: Semantic similarity (Redis)
        embedding = await self.embed_text(query)
        similar = await self.semantic_cache.find_similar(
            embedding=embedding,
            agent_type=agent_type,
            threshold=0.92
        )

        if similar and similar.distance < 0.08:
            logger.info("cache_hit", level="L2", latency_ms=10, distance=similar.distance)
            # Promote to L1
            self.l1_cache[cache_key] = similar.response
            return similar.response

        # L3 + L4: Prompt caching + LLM call
        response = await self._l3_l4_llm_with_prompt_cache(query, agent_type)

        # Store in L2 and L1
        await self.semantic_cache.set(embedding, response, agent_type)
        self.l1_cache[cache_key] = response

        return response

    async def _l3_l4_llm_with_prompt_cache(
        self,
        query: str,
        agent_type: str
    ) -> dict:
        """L3: Use prompt caching, L4: Full LLM if no prompt cache."""

        messages = build_cached_messages(
            system_prompt=AGENT_PROMPTS[agent_type],
            few_shot_examples=FEW_SHOT_EXAMPLES.get(agent_type),
            user_content=query
        )

        response = await self.llm_client.generate(messages)

        # Log cache performance
        if response.usage.cache_read_input_tokens > 0:
            logger.info("cache_hit", level="L3", latency_ms=2000)
        else:
            logger.info("cache_miss", level="L4", latency_ms=3000)

        return response.content[0].text
```

## Cache Decision Tree

```
┌─────────────────────────────────────────┐
│ Is query IDENTICAL to recent request?  │
│ (last 5 mins)                          │
└────┬────────────────────────────────────┘
     │
     ├─ YES ──→ L1 Cache (LRU) ──→ Return (~1ms, 100% savings)
     │
     └─ NO
         │
         ┌──────────────────────────────────────────┐
         │ Is query SIMILAR to any cached query?   │
         │ (cosine similarity > 0.92)              │
         └────┬─────────────────────────────────────┘
              │
              ├─ YES ──→ L2 Cache (Redis) ──→ Promote to L1 ──→ Return (~10ms, 100% savings)
              │
              └─ NO
                  │
                  ┌──────────────────────────────────────────┐
                  │ Is prompt PREFIX cached?                │
                  │ (system prompt, examples)               │
                  └────┬─────────────────────────────────────┘
                       │
                       ├─ YES ──→ L3 LLM (Prompt Cache) ──→ Store L2+L1 ──→ Return (~2s, 90% savings)
                       │
                       └─ NO ──→ L4 LLM (Full Call) ──→ Store L3+L2+L1 ──→ Return (~3s, full cost)
```

## Performance Metrics

```python
@dataclass
class CachePerformanceMetrics:
    """Track cache hierarchy performance."""

    # Hit rates
    l1_hit_rate: float  # Target: 10-20%
    l2_hit_rate: float  # Target: 30-50%
    l3_hit_rate: float  # Target: 80-100% (of L4 calls)
    l4_hit_rate: float  # Actually miss rate

    # Latencies
    l1_p50_ms: float  # ~1ms
    l2_p50_ms: float  # ~10ms
    l3_p50_ms: float  # ~2000ms
    l4_p50_ms: float  # ~3000ms

    # Cost savings
    total_requests: int
    total_cost_usd: float
    cost_without_cache_usd: float
    savings_percentage: float

    def calculate_effective_hit_rate(self) -> float:
        """Calculate combined cache effectiveness."""
        return self.l1_hit_rate + self.l2_hit_rate + (self.l3_hit_rate * 0.1)
```

## Tuning Guidelines

| Metric | Poor | Good | Excellent |
|--------|------|------|-----------|
| L1 Hit Rate | < 5% | 10-15% | > 20% |
| L2 Hit Rate | < 20% | 30-40% | > 50% |
| L3 Coverage | < 50% | 70-90% | > 95% |
| Combined Savings | < 40% | 60-80% | > 85% |

**Tuning Actions:**
- Low L1 → Increase TTL or cache size
- Low L2 → Lower similarity threshold or improve embeddings
- Low L3 → Add more cache breakpoints or larger static prompts
- High L4 → All above strategies failing, review query patterns
