# Security-First Development

## Core Principle

> **Security is not a feature. It's a foundation.**
>
> Every feature in SkillForge must be designed with security from the start, not bolted on later.

## The 3 Laws of Secure LLM Systems

```
┌────────────────────────────────────────────────────────────────────────────┐
│                    THE 3 LAWS OF SECURE LLM SYSTEMS                        │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  1. PARAMETERIZATION                                                       │
│     ─────────────────                                                      │
│     IDs flow AROUND the LLM, never THROUGH it.                            │
│     The LLM sees content. Attribution is deterministic.                   │
│                                                                            │
│  2. ISOLATION                                                              │
│     ─────────────                                                          │
│     Every query filters by tenant_id.                                     │
│     User A never sees User B's data.                                      │
│     There is no "global" query.                                           │
│                                                                            │
│  3. VALIDATION                                                             │
│     ────────────                                                           │
│     Input is validated before processing.                                 │
│     Output is validated before use.                                       │
│     Trust nothing from external sources.                                  │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

## Before Writing ANY Code

### Quick Security Check (30 seconds)

```
□ Who can access this?
□ How is tenant isolated?
□ What could an attacker do?
□ What parameters go in prompts? (NONE!)
```

### Use the Skills

1. **Load defense-in-depth** for 8-layer security architecture
2. **Load llm-safety-patterns** for prompt/context separation
3. **Load system-design-interrogation** for comprehensive assessment

## The 8 Security Layers

Every feature must consider all 8 layers:

```
Layer 0: Edge        - WAF, rate limiting, DDoS protection
Layer 1: Gateway     - JWT validation, RequestContext
Layer 2: Input       - Pydantic validation, size limits
Layer 3: AuthZ       - Permission checks, resource ownership
Layer 4: Data        - Tenant filter, parameterized queries
Layer 5: LLM         - No IDs in prompts, context separation
Layer 6: Output      - Schema validation, guardrails
Layer 7: Storage     - Encryption, audit logging
Layer 8: Observability - Sanitized logs, alerting
```

## SkillForge-Specific Requirements

### Multi-Tenant Isolation

**EVERY database query MUST:**
```python
# REQUIRED: tenant_id filter on every query
await db.execute(
    "SELECT * FROM analyses WHERE tenant_id = :tid AND ...",
    {"tid": ctx.tenant_id}  # From RequestContext, not user input
)
```

**NEVER:**
```python
# FORBIDDEN: Query without tenant filter
await db.execute("SELECT * FROM analyses WHERE ...")

# FORBIDDEN: Tenant from request body
tenant_id = request.body["tenant_id"]  # Attacker controls!
```

### LLM Safety

**FORBIDDEN in prompts:**
- user_id
- tenant_id
- analysis_id
- document_id
- artifact_id
- chunk_id
- session_id
- trace_id
- Any UUID
- API keys or tokens

**Required pattern:**
```python
# Pre-LLM: Filter data, extract content, save refs
content, source_refs = await prepare_for_llm(query, ctx)

# LLM: Content only, no IDs
prompt = build_prompt(content)  # Audited for IDs
result = await llm.generate(prompt)

# Post-LLM: Attribute from context, not LLM
await save_with_attribution(result, ctx, source_refs)
```

### RequestContext

Always use `RequestContext` from JWT:

```python
@router.get("/resource/{id}")
async def get_resource(
    id: UUID,
    ctx: RequestContext = Depends(get_request_context),  # ✓ Auth
):
    # ctx.user_id, ctx.tenant_id come from verified JWT
    # NEVER trust request body for these values
```

## Testing Requirements

Every feature must have:

1. **Tenant isolation test** - User A can't see User B's data
2. **Permission test** - Unauthorized users rejected
3. **Input validation test** - Invalid input handled
4. **Error state test** - Errors don't leak sensitive info

Example:
```python
async def test_cross_tenant_blocked(tenant_a_ctx, tenant_b_ctx):
    # Create resource for tenant B
    resource = await create_resource(tenant_id=tenant_b_ctx.tenant_id)

    # Try to access as tenant A
    result = await get_resource(resource.id, ctx=tenant_a_ctx)

    # MUST fail - tenant A can't see tenant B's data
    assert result is None  # or raises 404
```

## Code Review Checklist

Before approving any PR:

```
□ All queries have tenant_id filter
□ tenant_id comes from RequestContext
□ No IDs in LLM prompts
□ Input validated with Pydantic
□ Output validated before use
□ Errors don't leak sensitive info
□ Audit logging in place
□ Tests cover security scenarios
```

## Quick Reference

### Safe Patterns

```python
# ✅ Tenant filter from context
await repo.find_by_id(id, ctx=ctx)

# ✅ Content-only prompt
prompt = f"Analyze: {content}"

# ✅ Attribution from context
artifact.user_id = ctx.user_id
```

### Unsafe Patterns

```python
# ❌ No tenant filter
await db.execute("SELECT * FROM resources")

# ❌ ID in prompt
prompt = f"Analyze document {doc_id}"

# ❌ Trusting user input for IDs
artifact.user_id = request.body["user_id"]
```

## Related Resources

- `.claude/skills/defense-in-depth/` - Full 8-layer architecture
- `.claude/skills/llm-safety-patterns/` - Prompt and context safety
- `.claude/agents/security-layer-auditor.md` - Security review agent
- `.claude/agents/system-design-reviewer.md` - Design review agent

---

**Remember:** Security bugs are the hardest to fix after deployment. Build it right the first time.
