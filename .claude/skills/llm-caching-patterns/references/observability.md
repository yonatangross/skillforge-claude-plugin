# Cache Observability & Monitoring

## Key Metrics

### Cache Performance Metrics

```python
from prometheus_client import Counter, Histogram, Gauge

# Hit rates
cache_hits_total = Counter(
    "cache_hits_total",
    "Total cache hits",
    ["layer", "agent_type"]
)

cache_misses_total = Counter(
    "cache_misses_total",
    "Total cache misses",
    ["layer", "agent_type"]
)

# Latency
cache_latency_seconds = Histogram(
    "cache_latency_seconds",
    "Cache lookup latency",
    ["layer"],
    buckets=[0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1.0, 2.0, 5.0]
)

# Cost savings
cost_saved_usd = Counter(
    "llm_cost_saved_usd_total",
    "Total cost saved via caching",
    ["cache_layer"]
)

# Cache size
cache_size_entries = Gauge(
    "cache_size_entries",
    "Number of entries in cache",
    ["cache_type"]
)

# Similarity distribution
similarity_score = Histogram(
    "cache_similarity_score",
    "Semantic cache similarity scores",
    buckets=[0.80, 0.85, 0.88, 0.90, 0.92, 0.95, 0.98, 1.0]
)
```

## Instrumented Cache Service

```python
import structlog
from contextlib import asynccontextmanager

logger = structlog.get_logger()

class ObservableSemanticCache(SemanticCacheService):
    """Semantic cache with full observability."""

    @asynccontextmanager
    async def _measure_latency(self, layer: str):
        """Measure and record latency."""
        start = time.time()
        try:
            yield
        finally:
            latency = time.time() - start
            cache_latency_seconds.labels(layer=layer).observe(latency)

    async def get(
        self,
        content: str,
        agent_type: str,
        threshold: float = 0.92
    ) -> CacheEntry | None:
        """Get with metrics logging."""

        async with self._measure_latency("L2"):
            result = await super().get(content, agent_type, threshold)

        if result:
            cache_hits_total.labels(layer="L2", agent_type=agent_type).inc()
            similarity_score.observe(1.0 - result.distance)

            # Calculate cost saved
            cost_saved = 0.108  # Full LLM call cost
            cost_saved_usd.labels(cache_layer="L2").inc(cost_saved)

            logger.info(
                "cache_hit",
                layer="L2",
                agent_type=agent_type,
                distance=result.distance,
                similarity=1.0 - result.distance,
                cost_saved_usd=cost_saved
            )
        else:
            cache_misses_total.labels(layer="L2", agent_type=agent_type).inc()

            logger.info(
                "cache_miss",
                layer="L2",
                agent_type=agent_type
            )

        return result

    async def set(self, *args, **kwargs):
        """Set with size tracking."""
        await super().set(*args, **kwargs)

        # Update cache size metric
        size = await self.get_size()
        cache_size_entries.labels(cache_type="semantic").set(size)
```

## RedisInsight Dashboard

Access Redis visualization at `http://localhost:8001`:

### 1. Cache Entries Browser

```
Filter by:
• agent_type:security_auditor
• quality_score:[0.8 TO 1.0]
• created_at:[$(now-24h) TO $(now)]

View:
• Input query preview
• Cached response
• Embedding vector (1536 dimensions)
• Similarity scores
• Hit count
```

### 2. Vector Similarity Visualization

```bash
# RedisInsight > Workbench > Query

FT.SEARCH llm_semantic_cache
  "@agent_type:{security_auditor}"
  RETURN 3 embedding hit_count quality_score
  SORTBY quality_score DESC
  LIMIT 0 100

# Export to CSV for visualization in Python/R
```

### 3. Performance Metrics

```bash
# Cache hit rate by agent
FT.AGGREGATE llm_semantic_cache "*"
  GROUPBY 1 @agent_type
    REDUCE COUNT 0 AS total
    REDUCE SUM 1 @hit_count AS cache_hits
  APPLY "@cache_hits/@total" AS hit_rate
  SORTBY 2 @hit_rate DESC
```

## Grafana Dashboard

### Panel 1: Cache Hit Rates

```promql
# L1 hit rate
rate(cache_hits_total{layer="L1"}[5m])
/
(rate(cache_hits_total{layer="L1"}[5m]) + rate(cache_misses_total{layer="L1"}[5m]))

# L2 hit rate
rate(cache_hits_total{layer="L2"}[5m])
/
(rate(cache_hits_total{layer="L2"}[5m]) + rate(cache_misses_total{layer="L2"}[5m]))

# Combined hit rate
(
  rate(cache_hits_total{layer=~"L1|L2"}[5m])
)
/
(
  rate(cache_hits_total{layer=~"L1|L2|L3|L4"}[5m])
)
```

### Panel 2: Cost Savings

```promql
# Total cost saved (cumulative)
sum(cost_saved_usd_total)

# Cost saved per hour
rate(cost_saved_usd_total[1h]) * 3600

# Savings by cache layer
sum by (cache_layer) (rate(cost_saved_usd_total[1h]) * 3600)
```

### Panel 3: Latency Percentiles

```promql
# P50 latency by layer
histogram_quantile(0.50, rate(cache_latency_seconds_bucket[5m]))

# P95 latency by layer
histogram_quantile(0.95, rate(cache_latency_seconds_bucket[5m]))

# P99 latency by layer
histogram_quantile(0.99, rate(cache_latency_seconds_bucket[5m]))
```

### Panel 4: Cache Size

```promql
# Total entries
cache_size_entries

# Growth rate
rate(cache_size_entries[1h]) * 3600
```

## Structured Logging

```python
import structlog

logger = structlog.get_logger()

# Cache hit
logger.info(
    "cache_hit",
    layer="L2",
    agent_type="security_auditor",
    distance=0.052,
    similarity=0.948,
    query_preview=query[:100],
    cached_at="2025-01-15T10:30:00Z",
    hit_count=15,
    quality_score=0.92,
    cost_saved_usd=0.108,
    latency_ms=8.5
)

# Cache miss
logger.info(
    "cache_miss",
    layer="L2",
    agent_type="implementation_planner",
    reason="no_similar_entries",
    threshold=0.92,
    closest_distance=0.15,
    query_preview=query[:100],
    latency_ms=12.3
)

# Cache warming
logger.info(
    "cache_warmed",
    source="golden_dataset",
    entries_added=415,
    agent_types=["security", "implementation", "tech_comparison"],
    quality_threshold=0.8,
    duration_seconds=125.7
)
```

## Alerts

```yaml
# alerts/cache.yml
groups:
  - name: cache_alerts
    interval: 1m
    rules:
      # Low L2 hit rate
      - alert: LowSemanticCacheHitRate
        expr: |
          rate(cache_hits_total{layer="L2"}[5m])
          /
          (rate(cache_hits_total{layer="L2"}[5m]) + rate(cache_misses_total{layer="L2"}[5m]))
          < 0.25
        for: 15m
        labels:
          severity: warning
        annotations:
          summary: "Semantic cache hit rate below 25%"
          description: "L2 hit rate: {{ $value | humanizePercentage }}"

      # High cache latency
      - alert: HighCacheLatency
        expr: |
          histogram_quantile(0.95, rate(cache_latency_seconds_bucket{layer="L2"}[5m])) > 0.1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Cache P95 latency > 100ms"

      # Cache size approaching limit
      - alert: CacheSizeNearLimit
        expr: cache_size_entries{cache_type="semantic"} > 90000
        for: 10m
        labels:
          severity: info
        annotations:
          summary: "Cache size approaching 100K entry limit"
          description: "Current size: {{ $value }} entries"

      # Cost budget exceeded
      - alert: DailyCostBudgetExceeded
        expr: |
          sum(increase(llm_cost_total_usd[1d])) > 100
        labels:
          severity: critical
        annotations:
          summary: "Daily LLM cost exceeded $100 budget"
          description: "Actual cost: ${{ $value }}"
```

## Cache Health Check

```python
async def cache_health_check() -> dict:
    """Comprehensive cache health status."""

    # L1 metrics
    l1_size = len(l1_cache)
    l1_max_size = l1_cache.maxsize

    # L2 metrics
    l2_size = await semantic_cache.get_size()
    l2_avg_quality = await semantic_cache.get_avg_quality()

    # Hit rates (last hour)
    l1_hit_rate = await get_hit_rate("L1", window="1h")
    l2_hit_rate = await get_hit_rate("L2", window="1h")

    # Latencies
    l1_p95 = await get_latency_percentile("L1", percentile=0.95)
    l2_p95 = await get_latency_percentile("L2", percentile=0.95)

    return {
        "status": "healthy",
        "l1": {
            "size": l1_size,
            "capacity": l1_max_size,
            "utilization_pct": (l1_size / l1_max_size) * 100,
            "hit_rate": l1_hit_rate,
            "p95_latency_ms": l1_p95 * 1000,
        },
        "l2": {
            "size": l2_size,
            "avg_quality_score": l2_avg_quality,
            "hit_rate": l2_hit_rate,
            "p95_latency_ms": l2_p95 * 1000,
        },
        "cost_savings": {
            "last_hour_usd": await get_cost_saved_last_hour(),
            "today_usd": await get_cost_saved_today(),
        }
    }

# Health check endpoint
@router.get("/health/cache")
async def cache_health():
    return await cache_health_check()
```

## Sample Grafana JSON

```json
{
  "dashboard": {
    "title": "LLM Cache Performance",
    "panels": [
      {
        "title": "Hit Rate by Layer",
        "targets": [
          {
            "expr": "rate(cache_hits_total{layer=\"L1\"}[5m]) / (rate(cache_hits_total{layer=\"L1\"}[5m]) + rate(cache_misses_total{layer=\"L1\"}[5m]))",
            "legendFormat": "L1 (In-Memory)"
          },
          {
            "expr": "rate(cache_hits_total{layer=\"L2\"}[5m]) / (rate(cache_hits_total{layer=\"L2\"}[5m]) + rate(cache_misses_total{layer=\"L2\"}[5m]))",
            "legendFormat": "L2 (Semantic)"
          }
        ],
        "type": "graph",
        "yaxes": [{ "format": "percentunit", "max": 1 }]
      }
    ]
  }
}
```
