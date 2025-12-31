# Caching Architecture Patterns

**Purpose**: Two-tier caching decisions for LLM features
**Last Updated**: 2025-12-29
**Source**: Issue #601 Query Decomposition architecture

---

## Decision Summary

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| **Cache Storage** | Hybrid L1+L2 | Leverage existing Redis infra |
| **L1** | In-memory TTLCache | <1ms lookup, session-scoped |
| **L2** | Redis semantic cache | Cross-instance sharing |
| **Cache Key** | SHA256(normalized) | Fast, collision-resistant |
| **L2 Similarity** | 0.92 threshold | Catch paraphrases safely |
| **TTL Strategy** | L1: 5min, L2: 24hr | Session vs long-term |

---

## Cache Flow

```
User Query
  │
  ▼
Normalize (lowercase, strip) [<1ms]
  │
  ▼
L1 Lookup (in-memory) [<1ms]
  ├─ HIT (30-50%) → Return cached
  └─ MISS
      │
      ▼
  L2 Lookup (Redis semantic) [~10ms]
      ├─ HIT (20-40%) → Update L1 → Return
      └─ MISS
          │
          ▼
      LLM Call [~150ms]
          │
          ▼
      Store L1+L2 → Return
```

---

## Performance Expectations

| Metric | Baseline | With Cache | Improvement |
|--------|----------|------------|-------------|
| P50 Latency | 150ms | 47ms | 69% faster |
| P95 Latency | 250ms | 130ms | 48% faster |
| L1 Hit Rate | N/A | 30-50% | |
| L2 Hit Rate | N/A | 20-40% | |
| Combined Hit | N/A | 50-70% | |
| Cost/10K queries | $0.26 | $0.10 | 60% reduction |

---

## Implementation Files

```
backend/app/shared/services/cache/
├── llm_cache_service.py  # Existing 2-tier cache
└── semantic_cache.py     # Redis vector similarity

backend/app/shared/services/search/
├── decomposer.py         # QueryDecomposer with cache
└── hyde.py               # HyDE with cache
```

---

## Key Insight

> Query patterns show **30% exact duplicates + 15% semantic equivalents = 45% baseline hit rate**. With L2 semantic matching at 0.92 threshold, expect **50-70% combined hit rate**.

---

*Migrated from: role-comm-backend.md (condensed from 260 to ~100 lines)*
