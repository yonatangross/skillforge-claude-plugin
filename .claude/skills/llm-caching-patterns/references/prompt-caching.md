# Prompt Caching (Claude Native)

## Overview

Claude's native prompt caching reduces costs by 90% for repeated prompt prefixes by caching system prompts, examples, and context that don't change between requests.

**Key Benefits:**
- 90% cost reduction on cached input tokens
- 5-minute TTL (auto-refreshes on use)
- **March 2025**: Cache reads don't count against rate limits!

## Cache Breakpoint Strategy

```python
from anthropic import Anthropic

client = Anthropic()

def build_cached_messages(
    system_prompt: str,
    few_shot_examples: str | None = None,
    schema_docs: str | None = None,
    user_content: str = ""
) -> list[dict]:
    """Build messages with cache breakpoints.

    Structure:
    1. System prompt (always cached)
    2. Few-shot examples (cached per content type)
    3. Schema documentation (cached)
    ──────── CACHE BREAKPOINT ────────
    4. User content (NEVER cached)
    """

    content_parts = []

    # Breakpoint 1: System prompt
    content_parts.append({
        "type": "text",
        "text": system_prompt,
        "cache_control": {"type": "ephemeral"}
    })

    # Breakpoint 2: Few-shot examples
    if few_shot_examples:
        content_parts.append({
            "type": "text",
            "text": few_shot_examples,
            "cache_control": {"type": "ephemeral"}
        })

    # Breakpoint 3: Schema docs
    if schema_docs:
        content_parts.append({
            "type": "text",
            "text": schema_docs,
            "cache_control": {"type": "ephemeral"}
        })

    # User content (NOT cached)
    content_parts.append({
        "type": "text",
        "text": user_content
    })

    return [{"role": "user", "content": content_parts}]
```

## Usage Example

```python
response = client.messages.create(
    model="claude-sonnet-4-20250514",
    max_tokens=4096,
    messages=build_cached_messages(
        system_prompt=SECURITY_AUDITOR_PROMPT,  # 2000 tokens - cached
        few_shot_examples=SECURITY_EXAMPLES,     # 5000 tokens - cached
        schema_docs=FINDING_SCHEMA,              # 1000 tokens - cached
        user_content=article_content             # 10000 tokens - NOT cached
    )
)

# First request: Full cost
# Subsequent requests: 90% savings on 8000 cached tokens
```

## Cost Calculation

```
WITHOUT Prompt Caching:
────────────────────────
System:   2,000 tokens @ $3.00/MTok = $0.006
Examples: 5,000 tokens @ $3.00/MTok = $0.015
Schema:   1,000 tokens @ $3.00/MTok = $0.003
User:    10,000 tokens @ $3.00/MTok = $0.030
─────────────────────────────────────────────
Total:   18,000 tokens              = $0.054 per request

WITH Prompt Caching (90% hit rate):
────────────────────────────────────
Cached:   8,000 tokens @ $0.30/MTok = $0.0024 (cache read)
User:    10,000 tokens @ $3.00/MTok = $0.0300
─────────────────────────────────────────────
Total:   18,000 tokens              = $0.0324 per request

SAVINGS: 40% per request
```

## Best Practices

1. **Place longest static content first** (system prompts, examples)
2. **Use up to 4 cache breakpoints** (more = diminishing returns)
3. **Minimum 1024 tokens per cached block** (smaller blocks not cost-effective)
4. **Monitor cache hit rates** via API response headers:
   ```python
   print(response.usage.cache_creation_input_tokens)  # First request
   print(response.usage.cache_read_input_tokens)      # Subsequent requests
   ```

## Combining with Semantic Cache

```python
async def get_llm_response_with_double_caching(query: str, agent_type: str):
    """L2 Semantic + L3 Prompt caching."""

    # L2: Check semantic cache (Redis)
    cached = await semantic_cache.get(query, agent_type)
    if cached:
        return cached.response  # 100% cost savings

    # L3: Use prompt caching (Claude native)
    response = await client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=4096,
        messages=build_cached_messages(
            system_prompt=AGENT_PROMPTS[agent_type],
            user_content=query
        )
    )

    # Store in semantic cache for future similar queries
    await semantic_cache.set(query, response, agent_type)

    return response  # 90% cost savings (prompt cache)
```

## SkillForge Prompt Resolution (Issue #414)

SkillForge's PromptManager provides 4-level prompt caching:

```
L1 → In-Memory LRU (5min TTL)     # Fastest
L2 → Redis Cache (15min TTL)      # Distributed
L3 → Langfuse API                 # Cloud-managed, version controlled
L4 → Jinja2 Templates             # Local fallback (uses {{ var }} syntax)
```

The system prompts are fetched once via PromptManager, then Claude's native prompt caching applies for repeated LLM calls:

```python
from app.shared.services.prompts.prompt_manager import get_prompt_manager

# Prompt caching strategy:
# 1. PromptManager resolves system prompt (L1→L2→L3→L4)
# 2. Claude's native prompt caching caches the LLM call prefix

prompt_manager = get_prompt_manager()
system_prompt = await prompt_manager.get_prompt(
    name="analysis-agent-security-auditor",
    variables={},
    label="production"
)

# Claude native caching kicks in for repeated LLM calls
response = await client.messages.create(
    model="claude-sonnet-4-20250514",
    messages=build_cached_messages(
        system_prompt=system_prompt,  # From L1-L4 resolution
        user_content=user_query
    )
)
```

## References

- [Claude Prompt Caching](https://docs.anthropic.com/claude/docs/prompt-caching)
- [March 2025 Update](https://www.anthropic.com/news/prompt-caching-update) - Cache reads free!
