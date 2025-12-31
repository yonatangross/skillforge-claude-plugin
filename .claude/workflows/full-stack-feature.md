# Workflow: Full-Stack Feature

> **Composed Workflow** - Orchestrates backend and frontend agents with type-safe contracts
> Token Budget: ~1200 (vs ~4000 loading full skills separately)

## Overview

This workflow builds a complete feature spanning backend API and frontend UI, ensuring type safety across the boundary. It composes skills from both domains and coordinates the handoff between agents.

## When to Use

Trigger this workflow when:
- Building a new feature end-to-end
- Need both API endpoint and UI component
- Require shared types between frontend and backend
- Full-stack feature development

## Composed From

```yaml
skills:
  api-design-framework:
    load: references/endpoint-patterns.md
    tokens: ~150
    provides: RESTful endpoint design

  type-safety-validation:
    load: references/zod-schemas.md, templates/shared-types.ts
    tokens: ~220
    provides: Shared type definitions, validation schemas

  react-server-components-framework:
    load: references/data-fetching.md
    tokens: ~150
    provides: Data fetching patterns for RSC

  security-checklist:
    load: SKILL.md#input-validation
    tokens: ~150
    provides: Input validation patterns

  testing-strategy-builder:
    load: templates/integration-test.md
    tokens: ~150
    provides: API and component tests
```

## Workflow Phases

### Phase 1: Define Shared Types

**Agent**: backend-system-architect (with frontend-ui-developer review)

```typescript
// shared/types/feature.ts
import { z } from 'zod';

// Request schema
export const CreateFeatureSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  config: z.record(z.unknown()).optional(),
});

export type CreateFeatureInput = z.infer<typeof CreateFeatureSchema>;

// Response schema
export const FeatureSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  config: z.record(z.unknown()).nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Feature = z.infer<typeof FeatureSchema>;

// API Response wrapper
export const FeatureResponseSchema = z.object({
  data: FeatureSchema,
});

export const FeatureListResponseSchema = z.object({
  data: z.array(FeatureSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
  }),
});
```

**Use MCP:**
```
mcp__context7__get-library-docs(/colinhacks/zod, topic="schemas")
```

---

### Phase 2: Build Backend API

**Agent**: backend-system-architect

```python
# backend/app/api/v1/features.py
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
import uuid
from datetime import datetime

router = APIRouter(prefix="/features", tags=["features"])

class CreateFeatureInput(BaseModel):
    name: str
    description: Optional[str] = None
    config: Optional[dict] = None

class Feature(BaseModel):
    id: str
    name: str
    description: Optional[str]
    config: Optional[dict]
    created_at: datetime
    updated_at: datetime

@router.post("/", response_model=Feature, status_code=201)
async def create_feature(
    input: CreateFeatureInput,
    current_user: User = Depends(get_current_user)
):
    """Create a new feature."""
    feature = await feature_service.create(
        name=input.name,
        description=input.description,
        config=input.config,
        created_by=current_user.id
    )
    return feature

@router.get("/", response_model=list[Feature])
async def list_features(
    page: int = 1,
    limit: int = 20,
    current_user: User = Depends(get_current_user)
):
    """List all features with pagination."""
    return await feature_service.list(page=page, limit=limit)

@router.get("/{feature_id}", response_model=Feature)
async def get_feature(
    feature_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get a single feature by ID."""
    feature = await feature_service.get(feature_id)
    if not feature:
        raise HTTPException(404, "Feature not found")
    return feature
```

**Use MCP:**
```
mcp__context7__get-library-docs(/tiangolo/fastapi, topic="dependencies")
mcp__skillforge-postgres-dev__query("SELECT * FROM features LIMIT 1")
```

---

### Phase 3: Build Frontend UI

**Agent**: frontend-ui-developer

```tsx
// frontend/src/features/features/FeatureList.tsx
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Feature, CreateFeatureInput } from '@/shared/types/feature';

async function fetchFeatures(): Promise<Feature[]> {
  const res = await fetch('/api/features');
  if (!res.ok) throw new Error('Failed to fetch features');
  const data = await res.json();
  return data.data;
}

async function createFeature(input: CreateFeatureInput): Promise<Feature> {
  const res = await fetch('/api/features', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error('Failed to create feature');
  const data = await res.json();
  return data.data;
}

export function FeatureList() {
  const queryClient = useQueryClient();

  const { data: features, isLoading, error } = useQuery({
    queryKey: ['features'],
    queryFn: fetchFeatures,
  });

  const createMutation = useMutation({
    mutationFn: createFeature,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['features'] });
    },
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading features</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Features</h2>
      <ul className="divide-y">
        {features?.map((feature) => (
          <li key={feature.id} className="py-2">
            <h3 className="font-medium">{feature.name}</h3>
            {feature.description && (
              <p className="text-gray-600">{feature.description}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

**Use MCP:**
```
mcp__context7__get-library-docs(/tanstack/react-query, topic="mutations")
```

---

### Phase 4: Write Tests

**Agent**: code-quality-reviewer (validates both backend and frontend tests exist)

```python
# backend/tests/api/test_features.py
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_create_feature(client: AsyncClient, auth_headers):
    response = await client.post(
        "/api/v1/features",
        json={"name": "Test Feature", "description": "A test"},
        headers=auth_headers
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Test Feature"
    assert "id" in data

@pytest.mark.asyncio
async def test_list_features(client: AsyncClient, auth_headers):
    response = await client.get("/api/v1/features", headers=auth_headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)
```

```tsx
// frontend/src/features/features/__tests__/FeatureList.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FeatureList } from '../FeatureList';

const mockFeatures = [
  { id: '1', name: 'Feature 1', description: 'Test' },
];

global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ data: mockFeatures }),
  })
) as jest.Mock;

describe('FeatureList', () => {
  it('renders features', async () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <FeatureList />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Feature 1')).toBeInTheDocument();
    });
  });
});
```

---

## Handoff Protocol

```
┌─────────────────────┐
│  Shared Types       │ ← Define first (backend-system-architect)
└──────────┬──────────┘
           │
    ┌──────┴──────┐
    ▼             ▼
┌────────┐   ┌────────┐
│Backend │   │Frontend│  ← Can work in parallel after types defined
│  API   │   │   UI   │
└────┬───┘   └────┬───┘
     │            │
     └──────┬─────┘
            ▼
┌─────────────────────┐
│ code-quality-reviewer│ ← Validates both sides
└─────────────────────┘
```

---

## Validation Checklist

- [ ] Shared types defined with Zod schemas
- [ ] Backend API uses shared types
- [ ] Frontend uses shared types (no `any`)
- [ ] API endpoints tested with integration tests
- [ ] Frontend components tested
- [ ] Types compile without errors
- [ ] Authentication required on protected routes
- [ ] Error handling on both sides

---

## MCP Tools Used

| Tool | Purpose |
|------|---------|
| `context7` | FastAPI, React Query, Zod documentation |
| `skillforge-postgres-dev` | Test database queries |
| `playwright` | E2E testing if needed |

---

**Estimated Tokens:** 1200
**Traditional Approach:** 4000+ (loading 5 full skills)
**Savings:** 70%
