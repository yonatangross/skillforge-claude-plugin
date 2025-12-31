# Workflow: Secure API Endpoint

> **Composed Workflow** - Combines multiple skills into a single-context execution
> Token Budget: ~800 (vs ~2500 loading full skills)

## Overview

This workflow creates a secure, production-ready API endpoint by composing relevant sections from multiple skills. Instead of loading three full SKILL.md files, it loads only the specific patterns needed.

## When to Use

Trigger this workflow when:
- Creating a new API endpoint
- Adding authentication to an endpoint
- Implementing input validation
- Need both API design and security in one task

## Composed From

```yaml
skills:
  api-design-framework:
    load: references/endpoint-patterns.md
    tokens: ~150
    provides: RESTful patterns, HTTP methods, URL structure

  security-checklist:
    load: SKILL.md#3-injection, SKILL.md#input-validation
    tokens: ~200
    provides: Input validation, SQL injection prevention, XSS

  testing-strategy-builder:
    load: templates/api-test.md
    tokens: ~150
    provides: Integration test template

  type-safety-validation:
    load: references/zod-schemas.md
    tokens: ~100
    provides: Request/response validation schemas
```

## Workflow Steps

### Step 1: Design Endpoint Structure

```
Pattern: RESTful Resource
─────────────────────────
POST   /api/v1/resources     → Create
GET    /api/v1/resources     → List (with pagination)
GET    /api/v1/resources/:id → Get single
PUT    /api/v1/resources/:id → Update
DELETE /api/v1/resources/:id → Delete
```

**Use MCP:**
```
mcp__context7__get-library-docs(/tiangolo/fastapi, topic="routing")
```

### Step 2: Define Input Schema (Zod/Pydantic)

```typescript
// TypeScript + Zod
import { z } from 'zod';

const CreateResourceSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  // Add fields as needed
});

type CreateResourceInput = z.infer<typeof CreateResourceSchema>;
```

```python
# Python + Pydantic
from pydantic import BaseModel, EmailStr, constr

class CreateResourceInput(BaseModel):
    name: constr(min_length=1, max_length=100)
    email: EmailStr
```

### Step 3: Apply Security Patterns

**Input Validation (OWASP #3 - Injection)**
```python
# ✅ Parameterized queries - NEVER string concatenation
async def create_resource(input: CreateResourceInput):
    # Pydantic already validated types
    result = await db.execute(
        "INSERT INTO resources (name, email) VALUES ($1, $2)",
        [input.name, input.email]  # Parameterized
    )
    return result
```

**Authorization Check (OWASP #1 - Broken Access Control)**
```python
@router.post("/resources")
async def create_resource(
    input: CreateResourceInput,
    current_user: User = Depends(get_current_user)  # Auth required
):
    # Check permissions
    if not current_user.can_create_resources:
        raise HTTPException(403, "Insufficient permissions")
    # ... create resource
```

### Step 4: Implement Error Handling

```python
# Structured error response
class APIError(BaseModel):
    error: str
    code: str
    details: Optional[dict] = None

@app.exception_handler(ValidationError)
async def validation_error_handler(request, exc):
    return JSONResponse(
        status_code=422,
        content=APIError(
            error="Validation failed",
            code="VALIDATION_ERROR",
            details=exc.errors()
        ).dict()
    )
```

### Step 5: Write Integration Test

```python
# tests/api/test_resources.py
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_create_resource_success(client: AsyncClient, auth_headers):
    response = await client.post(
        "/api/v1/resources",
        json={"name": "Test", "email": "test@example.com"},
        headers=auth_headers
    )
    assert response.status_code == 201
    assert response.json()["name"] == "Test"

@pytest.mark.asyncio
async def test_create_resource_unauthorized(client: AsyncClient):
    response = await client.post(
        "/api/v1/resources",
        json={"name": "Test", "email": "test@example.com"}
    )
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_create_resource_validation_error(client: AsyncClient, auth_headers):
    response = await client.post(
        "/api/v1/resources",
        json={"name": "", "email": "invalid"},  # Invalid input
        headers=auth_headers
    )
    assert response.status_code == 422
```

## Validation Checklist

Before marking complete, verify:

- [ ] Endpoint follows RESTful conventions
- [ ] Input validated with schema (Zod/Pydantic)
- [ ] Parameterized queries (no SQL injection)
- [ ] Authentication required
- [ ] Authorization checked (user can perform action)
- [ ] Error responses are structured
- [ ] Integration tests written
- [ ] No sensitive data in error messages

## Handoff

After completion, trigger:
```
→ code-quality-reviewer for security scan and lint check
```

## MCP Tools Used

| Tool | Purpose |
|------|---------|
| `context7` | Fetch current FastAPI/Express docs |
| `skillforge-postgres-dev` | Test database queries |
| `playwright` | E2E test if endpoint has UI |

---

**Estimated Tokens:** 800
**Traditional Approach:** 2500+ (loading 3 full skills)
**Savings:** 68%
