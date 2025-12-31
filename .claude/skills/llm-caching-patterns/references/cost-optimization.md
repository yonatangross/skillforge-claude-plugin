# LLM Cost Optimization with Caching

## Baseline: No Caching

```
SkillForge Production Load (estimated):
──────────────────────────────────────
• 1,000 analyses/day
• 8 agents × 2,000 tokens avg = 16,000 input tokens/analysis
• Claude Sonnet 4: $3/MTok input, $15/MTok output
• Avg output: 4,000 tokens/analysis

Daily cost WITHOUT caching:
───────────────────────────
Input:  1,000 × 16,000 × $3/1M  = $48
Output: 1,000 × 4,000 × $15/1M  = $60
TOTAL:  $108/day = $3,240/month = $38,880/year
```

## With Multi-Level Caching

### Scenario 1: Conservative Estimates

```
Assumptions:
───────────
• L1 hit rate: 10%
• L2 hit rate: 25%
• L3 coverage: 90% (of remaining requests)
• L4: 65% (full LLM calls)

Cost breakdown:
───────────────
L1 (10%): 100 requests × $0.00 = $0.00
L2 (25%): 250 requests × $0.00 = $0.00
L3 (58%): 580 requests × $0.0324 = $18.79  (prompt cache benefit)
L4 (65% of 650): 422 requests × $0.108 = $45.58

Daily total: $64.37
Monthly: $1,931
Yearly: $23,175

SAVINGS: 40% ($15,705/year)
```

### Scenario 2: Optimistic (Well-Tuned Cache)

```
Assumptions:
───────────
• L1 hit rate: 15%
• L2 hit rate: 40%
• L3 coverage: 95%
• L4: 45%

Cost breakdown:
───────────────
L1 (15%): 150 requests × $0.00 = $0.00
L2 (40%): 400 requests × $0.00 = $0.00
L3 (43%): 428 requests × $0.0324 = $13.87
L4 (22 requests × $0.108 = $2.38

Daily total: $16.25
Monthly: $488
Yearly: $5,933

SAVINGS: 85% ($32,947/year)
```

## ROI Calculation

### Implementation Costs

```
One-time setup:
──────────────
• Redis infrastructure: $50/month ($600/year)
• Development time: 40 hours × $150/hr = $6,000
• Total year 1: $6,600

Ongoing costs:
─────────────
• Redis hosting: $600/year
• Monitoring/maintenance: 5 hours/month × $150/hr = $9,000/year
• Total annual: $9,600
```

### Net Savings

```
Scenario 1 (Conservative):
─────────────────────────
Savings: $15,705
Costs: $9,600
NET: +$6,105/year
ROI: 63%
Payback: ~19 months

Scenario 2 (Optimistic):
────────────────────────
Savings: $32,947
Costs: $9,600
NET: +$23,347/year
ROI: 243%
Payback: ~4 months
```

## Cost by Cache Layer

```python
@dataclass
class CacheCostMetrics:
    """Track cost savings per cache layer."""

    # Requests
    total_requests: int
    l1_hits: int
    l2_hits: int
    l3_hits: int
    l4_calls: int

    # Costs (per request)
    l1_cost_per_request: float = 0.0
    l2_cost_per_request: float = 0.000002  # Embedding + Redis
    l3_cost_per_request: float = 0.0324    # Prompt cache benefit
    l4_cost_per_request: float = 0.108     # Full LLM

    def calculate_total_cost(self) -> float:
        """Calculate total cost across all layers."""
        return (
            (self.l1_hits * self.l1_cost_per_request) +
            (self.l2_hits * self.l2_cost_per_request) +
            (self.l3_hits * self.l3_cost_per_request) +
            (self.l4_calls * self.l4_cost_per_request)
        )

    def calculate_savings(self) -> float:
        """Calculate savings vs no caching."""
        cost_without_cache = self.total_requests * self.l4_cost_per_request
        actual_cost = self.calculate_total_cost()
        return cost_without_cache - actual_cost

    def savings_percentage(self) -> float:
        cost_without_cache = self.total_requests * self.l4_cost_per_request
        return (self.calculate_savings() / cost_without_cache) * 100
```

## Monitoring Cost Savings

```python
# Track daily cost savings
async def log_request_cost(cache_layer: str, cost: float):
    await prometheus.histogram(
        "llm_request_cost_usd",
        cost,
        labels={"cache_layer": cache_layer}
    )

# Daily cost report
async def generate_cost_report(date: datetime) -> dict:
    """Generate daily cost savings report."""

    metrics = await db.execute(
        """
        SELECT
            cache_layer,
            COUNT(*) as requests,
            SUM(cost_usd) as total_cost
        FROM llm_request_logs
        WHERE DATE(created_at) = :date
        GROUP BY cache_layer
        """,
        {"date": date}
    )

    total_cost = sum(m["total_cost"] for m in metrics)
    total_requests = sum(m["requests"] for m in metrics)

    # Cost without caching
    baseline_cost = total_requests * 0.108

    return {
        "date": date,
        "total_requests": total_requests,
        "actual_cost_usd": total_cost,
        "baseline_cost_usd": baseline_cost,
        "savings_usd": baseline_cost - total_cost,
        "savings_pct": ((baseline_cost - total_cost) / baseline_cost) * 100,
        "by_layer": {m["cache_layer"]: m for m in metrics}
    }
```

## Budget Alerts

```python
async def check_cost_budget(
    daily_budget_usd: float = 100.0,
    alert_threshold: float = 0.8
):
    """Alert if approaching daily budget."""

    today = datetime.now().date()
    report = await generate_cost_report(today)

    if report["actual_cost_usd"] >= daily_budget_usd * alert_threshold:
        await send_alert(
            severity="warning",
            message=f"LLM costs at {report['actual_cost_usd']:.2f} (80% of ${daily_budget_usd} budget)",
            details=report
        )

    if report["actual_cost_usd"] >= daily_budget_usd:
        await send_alert(
            severity="critical",
            message=f"LLM costs exceeded daily budget: ${report['actual_cost_usd']:.2f}",
            details=report
        )
```

## Cost Optimization Strategies

### 1. Cache Hit Rate Optimization

```python
# Target hit rates for maximum ROI
TARGET_HIT_RATES = {
    "l1": 0.15,  # 15% exact match
    "l2": 0.40,  # 40% semantic match
    "l3": 0.90,  # 90% prompt cache coverage
}

async def optimize_for_cost():
    """Adjust thresholds to maximize cost savings."""

    current_rates = await get_current_hit_rates()

    if current_rates["l2"] < TARGET_HIT_RATES["l2"]:
        # Lower similarity threshold to increase L2 hits
        await adjust_similarity_threshold(direction="down", amount=0.01)

    if current_rates["l1"] < TARGET_HIT_RATES["l1"]:
        # Increase L1 TTL
        await increase_l1_ttl(new_ttl=600)  # 10 minutes
```

### 2. Model Selection

```python
# Use cheaper models when quality allows
MODEL_COSTS = {
    "claude-opus-4": {"input": 15, "output": 75},      # Highest quality
    "claude-sonnet-4": {"input": 3, "output": 15},     # Balanced
    "claude-haiku-3": {"input": 0.25, "output": 1.25}, # Fast/cheap
}

async def select_optimal_model(agent_type: str, complexity: int):
    """Select cheapest model that meets quality requirements."""

    if complexity <= 3 and agent_type in ["summarizer", "comparator"]:
        return "claude-haiku-3"  # 12x cheaper than Sonnet

    return "claude-sonnet-4"  # Default
```

### 3. Token Optimization

```python
async def optimize_prompt_tokens(system_prompt: str, max_tokens: int = 2000):
    """Compress system prompt while maintaining quality."""

    if len(system_prompt) <= max_tokens:
        return system_prompt

    # Use cheap model to compress
    compressed = await llm.generate(
        model="claude-haiku-3",
        prompt=f"Compress this system prompt to < {max_tokens} tokens:\n\n{system_prompt}"
    )

    return compressed
```

## Cost Monitoring Dashboard

```sql
-- Daily cost trends
SELECT
    DATE(created_at) as date,
    COUNT(*) as total_requests,
    SUM(cost_usd) as total_cost,
    AVG(cost_usd) as avg_cost_per_request,
    SUM(CASE WHEN cache_layer = 'L1' THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as l1_hit_rate_pct,
    SUM(CASE WHEN cache_layer = 'L2' THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as l2_hit_rate_pct
FROM llm_request_logs
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Cost by agent type
SELECT
    agent_type,
    COUNT(*) as requests,
    SUM(cost_usd) as total_cost,
    AVG(cost_usd) as avg_cost
FROM llm_request_logs
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY agent_type
ORDER BY total_cost DESC;
```

## References

- [Anthropic Pricing](https://www.anthropic.com/pricing)
- [Claude Prompt Caching](https://docs.anthropic.com/claude/docs/prompt-caching)
- [Redis Cost Calculator](https://redis.com/redis-enterprise-cloud/pricing/)
