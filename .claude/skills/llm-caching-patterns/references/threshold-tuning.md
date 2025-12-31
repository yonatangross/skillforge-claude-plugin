# Similarity Threshold Tuning

## The Threshold Problem

**Question:** How similar is "similar enough" to return a cached response?

**Trade-off:**
- Too high (0.98+): Many cache misses, wasted opportunity
- Too low (< 0.85): False positives, wrong cached responses returned

## Threshold Guidelines

### Cosine Similarity Scale

```
Distance  Similarity  Interpretation           Recommendation
────────  ──────────  ──────────────────────  ──────────────────
0.00-0.02  0.98-1.00  Nearly identical         ✅ Always safe
0.02-0.05  0.95-0.98  Very similar             ✅ Usually safe
0.05-0.08  0.92-0.95  Similar                  ⚠️  Validate quality
0.08-0.15  0.85-0.92  Moderately similar       ❌ Risky
> 0.15     < 0.85     Different                ❌ Never return
```

**Recommended Starting Point:** 0.92 similarity (0.08 distance)

## Agent-Specific Thresholds

Different agents have different tolerance for false positives:

```python
AGENT_THRESHOLDS = {
    "security_auditor": 0.95,      # High precision required
    "implementation_planner": 0.93, # Moderate precision
    "tech_comparator": 0.90,        # More permissive
    "content_summarizer": 0.88,     # Can tolerate variation
}
```

## Tuning Process

### Step 1: Collect Baseline Data

```python
import pandas as pd

cache_logs = []

async def log_cache_decision(
    query: str,
    cached_response: dict,
    distance: float,
    was_correct: bool
):
    """Log whether cached response was appropriate."""
    cache_logs.append({
        "query": query,
        "distance": distance,
        "was_correct": was_correct,
        "agent_type": cached_response["agent_type"],
        "timestamp": datetime.now()
    })

# After 1000 queries
df = pd.DataFrame(cache_logs)
```

### Step 2: Calculate Precision/Recall

```python
def calculate_metrics(df: pd.DataFrame, threshold: float):
    """Calculate precision and recall at threshold."""

    # True Positives: Retrieved and correct
    tp = len(df[(df.distance <= threshold) & (df.was_correct == True)])

    # False Positives: Retrieved but incorrect
    fp = len(df[(df.distance <= threshold) & (df.was_correct == False)])

    # False Negatives: Not retrieved but would've been correct
    fn = len(df[(df.distance > threshold) & (df.was_correct == True)])

    precision = tp / (tp + fp) if (tp + fp) > 0 else 0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0
    f1 = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0

    return {
        "threshold": threshold,
        "precision": precision,
        "recall": recall,
        "f1_score": f1,
        "true_positives": tp,
        "false_positives": fp,
        "false_negatives": fn,
    }

# Test multiple thresholds
thresholds = [0.85, 0.88, 0.90, 0.92, 0.95, 0.98]
results = [calculate_metrics(df, t) for t in thresholds]

# Find optimal threshold (maximize F1)
optimal = max(results, key=lambda x: x["f1_score"])
print(f"Optimal threshold: {optimal['threshold']} (F1: {optimal['f1_score']:.3f})")
```

### Step 3: Monitor False Positive Rate

```python
async def get_with_validation(
    query: str,
    agent_type: str,
    threshold: float = 0.92
):
    """Retrieve with false positive monitoring."""

    cached = await semantic_cache.get(query, agent_type, threshold)

    if cached:
        # Log for later analysis
        await log_cache_retrieval(
            query=query,
            distance=cached.distance,
            threshold=threshold,
            agent_type=agent_type
        )

        # Optional: Use LLM to validate cached response
        if cached.distance > 0.05:  # Borderline case
            is_valid = await validate_cached_response(query, cached.response)
            if not is_valid:
                logger.warn("false_positive", distance=cached.distance)
                return None  # Fall through to LLM

    return cached
```

## Dynamic Threshold Adjustment

```python
class AdaptiveThresholdManager:
    """Automatically adjust threshold based on observed metrics."""

    def __init__(
        self,
        target_precision: float = 0.95,
        target_recall: float = 0.40,
        adjustment_interval: int = 1000  # requests
    ):
        self.target_precision = target_precision
        self.target_recall = target_recall
        self.interval = adjustment_interval

        self.thresholds = defaultdict(lambda: 0.92)
        self.logs = defaultdict(list)

    async def adjust_threshold(self, agent_type: str):
        """Adjust threshold based on recent performance."""

        logs = self.logs[agent_type][-self.interval:]
        if len(logs) < 100:
            return  # Not enough data

        df = pd.DataFrame(logs)
        current = self.thresholds[agent_type]

        # Calculate current metrics
        metrics = calculate_metrics(df, current)

        # Adjust based on targets
        if metrics["precision"] < self.target_precision:
            # Too many false positives → increase threshold (more conservative)
            self.thresholds[agent_type] = min(0.98, current + 0.01)
            logger.info(
                "threshold_increased",
                agent=agent_type,
                old=current,
                new=self.thresholds[agent_type],
                reason="low_precision"
            )

        elif metrics["recall"] < self.target_recall and metrics["precision"] > self.target_precision + 0.05:
            # Good precision but low recall → decrease threshold (more permissive)
            self.thresholds[agent_type] = max(0.85, current - 0.01)
            logger.info(
                "threshold_decreased",
                agent=agent_type,
                old=current,
                new=self.thresholds[agent_type],
                reason="low_recall"
            )
```

## A/B Testing Thresholds

```python
import random

async def get_with_ab_test(query: str, agent_type: str):
    """A/B test two thresholds simultaneously."""

    # 50/50 split
    threshold = 0.90 if random.random() < 0.5 else 0.95
    variant = "A" if threshold == 0.90 else "B"

    cached = await semantic_cache.get(query, agent_type, threshold)

    await log_ab_test(
        variant=variant,
        threshold=threshold,
        cache_hit=cached is not None,
        query=query
    )

    return cached
```

## Monitoring Dashboard Queries

```sql
-- False positive rate by agent type
SELECT
    agent_type,
    COUNT(*) FILTER (WHERE was_correct = false AND distance <= threshold) AS false_positives,
    COUNT(*) AS total_retrievals,
    (COUNT(*) FILTER (WHERE was_correct = false) * 100.0 / COUNT(*)) AS fp_rate_pct
FROM cache_logs
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY agent_type;

-- Optimal threshold per agent
SELECT
    agent_type,
    distance,
    AVG(was_correct::int) AS correctness_rate
FROM cache_logs
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY agent_type, distance
ORDER BY agent_type, distance;
```

## References

- [Redis Semantic Cache Optimization](https://redis.io/blog/10-techniques-for-semantic-cache-optimization/)
- [Precision vs Recall Trade-offs](https://developers.google.com/machine-learning/crash-course/classification/precision-and-recall)
