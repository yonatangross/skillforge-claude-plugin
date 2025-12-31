# LLM Integration Patterns for SkillForge

**Purpose**: Reusable code patterns for LLM-powered features
**Last Updated**: 2025-12-29
**Max Lines**: 1000 (enforced by policy)

---

## 1. Pydantic Models for LLM Structured Output

### Pattern: LLM Response Schema

```python
from pydantic import BaseModel, Field, model_validator

class LLMOutputSchema(BaseModel):
    """Schema for LLM structured output with validation."""

    result: str = Field(
        ...,
        min_length=10,
        max_length=2000,
        description="The generated content",
    )
    reasoning: str | None = Field(
        default=None,
        description="Brief explanation of generation strategy",
    )

    @model_validator(mode="after")
    def validate_output(self) -> "LLMOutputSchema":
        """Cross-field validation example."""
        if self.result and len(self.result) < 10:
            raise ValueError("Result too short")
        return self
```

### Applied Examples

**QueryDecomposer ConceptExtraction**:
```python
class ConceptExtraction(BaseModel):
    concepts: list[str] = Field(..., min_length=1, max_length=5)
    reasoning: str | None = Field(default=None)
```

**HyDE HypotheticalDocument**:
```python
class HypotheticalDocument(BaseModel):
    document: str = Field(..., min_length=20, max_length=1000)
```

---

## 2. LLM Timeout Protection

### Pattern: Async Timeout with Graceful Fallback

```python
import asyncio
from typing import cast

# Exception types for error handling
LLM_ERRORS = (ValueError, TypeError, RuntimeError, ValidationError, TimeoutError, ConnectionError)

async def _call_llm_with_timeout(self, prompt: str, timeout_seconds: float = 2.0) -> ResultType:
    """Call LLM with timeout protection and fallback."""
    try:
        llm_with_structure = self.llm.with_structured_output(OutputSchema)

        # CRITICAL: Wrap LLM call with timeout
        async with asyncio.timeout(timeout_seconds):
            raw_result = await llm_with_structure.ainvoke(prompt)

        return cast("OutputSchema", raw_result)

    except TimeoutError:
        logger.warning("llm_call_timeout", timeout_seconds=timeout_seconds)
        return self._fallback_result()  # Graceful degradation

    except LLM_ERRORS as e:
        logger.warning("llm_call_failed", error=str(e))
        return self._fallback_result()
```

### Key Settings
- **QueryDecomposer**: 2.0s timeout
- **HyDE**: 3.0s timeout (longer docs)
- **Always return fallback**, never raise to caller

---

## 3. Two-Tier Caching Strategy

### Pattern: L1 In-Memory + L2 Redis

```python
class TwoTierCache:
    """L1: In-memory TTLCache, L2: Redis semantic cache."""

    def __init__(self, l1_maxsize: int = 500, l1_ttl: int = 300):
        self._l1_cache: dict[str, tuple[Any, float]] = {}
        self.l1_maxsize = l1_maxsize
        self.l1_ttl = l1_ttl
        self.last_hit_tier: Literal["l1", "l2", "miss"] = "miss"

    def _cache_key(self, query: str) -> str:
        """Normalize and hash for consistent keys."""
        normalized = query.strip().lower()
        return hashlib.sha256(normalized.encode()).hexdigest()[:16]

    async def get(self, query: str) -> Any | None:
        cache_key = self._cache_key(query)
        current_time = time.time()

        # L1 lookup
        if cache_key in self._l1_cache:
            value, timestamp = self._l1_cache[cache_key]
            if current_time - timestamp < self.l1_ttl:
                self.last_hit_tier = "l1"
                return value
            del self._l1_cache[cache_key]  # Expired

        # L2 Redis lookup would go here
        self.last_hit_tier = "miss"
        return None

    async def set(self, query: str, value: Any) -> None:
        cache_key = self._cache_key(query)
        self._l1_cache[cache_key] = (value, time.time())

        # Evict oldest 10% if over capacity
        if len(self._l1_cache) > self.l1_maxsize:
            sorted_keys = sorted(self._l1_cache.keys(), key=lambda k: self._l1_cache[k][1])
            for key in sorted_keys[: self.l1_maxsize // 10]:
                del self._l1_cache[key]
```

### Cache Settings Matrix

| Feature | L1 Size | L1 TTL | L2 Threshold | L2 TTL |
|---------|---------|--------|--------------|--------|
| QueryDecomposer | 1000 | 5min | 0.92 | 24hr |
| HyDE | 500 | 5min | 0.90 | 1hr |

---

## 4. Structured Logging Pattern

### Pattern: Structlog with Metrics

```python
from app.core.logging import get_logger

logger = get_logger(__name__)

# Log with structured data
logger.info(
    "feature_completed",
    query=query[:100],  # Truncate sensitive data
    latency_ms=latency_ms,
    source=source.value,
    cache_hit=cache_hit,
)

logger.warning(
    "feature_fallback",
    reason="timeout",
    timeout_seconds=timeout_seconds,
)
```

### Key Conventions
- Use snake_case event names
- Truncate user input to 100 chars
- Include latency_ms for performance tracking
- Include source enum for debugging

---

## 5. Service Factory Pattern

### Pattern: Lazy-Loaded LLM Provider

```python
from app.shared.services.llm.factory import get_llm_provider

class FeatureService:
    def __init__(self, embedding_service: EmbeddingService, llm: LLMProvider | None = None):
        self.embedding_service = embedding_service
        self._llm = llm  # Optional injection for testing

    @property
    def llm(self) -> LLMProvider:
        """Lazy-load LLM provider."""
        if self._llm is None:
            self._llm = get_llm_provider(task_type="reasoning")
        return self._llm
```

### Task Types
- `"reasoning"`: GPT-4/Claude for complex tasks
- `"fast"`: GPT-3.5/Haiku for simple classification
- `"embedding"`: Embedding models

---

## 6. Batch Processing Pattern

### Pattern: Parallel Async Execution

```python
async def process_batch(self, items: list[str]) -> list[Result]:
    """Process multiple items in parallel."""
    if not items:
        return []

    # Fan out to concurrent tasks
    results = await asyncio.gather(
        *[self.process_single(item) for item in items],
        return_exceptions=False,
    )

    # Collect stats
    cache_hits = sum(1 for r in results if r.source in (Source.CACHE_L1, Source.CACHE_L2))
    logger.info("batch_complete", count=len(items), cache_hits=cache_hits)

    return results
```

---

## Quick Reference

```
┌──────────────────────────────────────────────────────────────┐
│                    LLM FEATURE CHECKLIST                     │
├──────────────────────────────────────────────────────────────┤
│ [ ] Pydantic schema with Field constraints                   │
│ [ ] @model_validator for cross-field validation              │
│ [ ] asyncio.timeout() wrapper on LLM calls                   │
│ [ ] Graceful fallback on timeout/error                       │
│ [ ] Two-tier cache (L1 in-memory + L2 Redis)                │
│ [ ] Cache key normalization (lowercase, strip, hash)         │
│ [ ] Structured logging with truncated user data              │
│ [ ] Lazy-loaded LLM via factory                              │
│ [ ] Batch processing with asyncio.gather()                   │
└──────────────────────────────────────────────────────────────┘
```

---

*Migrated from: role-comm-review.md (condensed from 1478 to ~200 lines)*
*See: app/shared/services/search/decomposer.py for full implementation*
