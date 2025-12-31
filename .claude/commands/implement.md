---
description: Full-power feature implementation with parallel subagents, skills, and MCPs
---

# Implement Feature: $ARGUMENTS

Maximum utilization of M4 Max 256GB with parallel subagent execution.

## Phase 1: Discovery & Planning (Sequential-Thinking MCP)

### 1a. Complex Problem Decomposition

Use sequential-thinking MCP for multi-step reasoning:
```python
mcp__sequential-thinking__sequentialthinking(
  thought="Breaking down feature into implementable components...",
  thoughtNumber=1,
  totalThoughts=5,
  nextThoughtNeeded=true
)
```

### 1b. Create Task List (TodoWrite)

Break into small, deliverable, testable tasks:
- Each task completable in one focused session
- Each task MUST include its tests
- Group by domain (frontend, backend, AI, shared)
- Maximum 3-4 hours per task

## Phase 2: Research Current Best Practices

### 2a. Web Search (Today's Date: December 2025)

```python
# PARALLEL - All searches in one message!
WebSearch("React 19 best practices December 2025")
WebSearch("FastAPI async patterns 2025")
WebSearch("TypeScript 5.7 strict mode December 2025")
WebSearch("Pydantic v2 validation patterns 2025")
WebSearch("LangGraph 1.0 state management 2025")
WebSearch("TailwindCSS v4 component patterns 2025")
```

### 2b. Context7 Library Documentation

```python
# PARALLEL - All library lookups in one message!
mcp__context7__get-library-docs(context7CompatibleLibraryID="/facebook/react", topic="hooks")
mcp__context7__get-library-docs(context7CompatibleLibraryID="/tiangolo/fastapi", topic="dependencies")
mcp__context7__get-library-docs(context7CompatibleLibraryID="/langchain-ai/langgraph", topic="state")
mcp__context7__get-library-docs(context7CompatibleLibraryID="/colinhacks/zod", topic="validation")
```

### 2c. Memory MCP - Previous Decisions

```python
# Check what was decided in previous sessions
mcp__memory__search_nodes(query="architecture decisions")
mcp__memory__search_nodes(query="implementation patterns")
```

## Phase 3: Load Skills (Progressive - Capabilities First)

```python
# PARALLEL - Load all capability indexes first (~500 tokens total)
Read(".claude/skills/api-design-framework/capabilities.json")
Read(".claude/skills/react-server-components-framework/capabilities.json")
Read(".claude/skills/type-safety-validation/capabilities.json")
Read(".claude/skills/testing-strategy-builder/capabilities.json")
Read(".claude/skills/streaming-api-patterns/capabilities.json")
Read(".claude/skills/database-schema-designer/capabilities.json")
Read(".claude/skills/ai-native-development/capabilities.json")
Read(".claude/skills/performance-optimization/capabilities.json")
```

Then load ONLY the specific references needed based on feature type.

## Phase 4: Parallel Architecture Design (5 Agents)

Launch FIVE agents simultaneously for comprehensive design:

```python
# PARALLEL - All five in ONE message!

Task(
  subagent_type="Plan",
  prompt="""ARCHITECTURE PLANNING

  Feature: $ARGUMENTS
  Context: [Include web search + context7 results]

  Design comprehensive implementation plan:

  1. COMPONENT BREAKDOWN
     - Frontend components needed
     - Backend services/endpoints
     - Database schema changes
     - AI/ML integrations

  2. DEPENDENCY GRAPH
     - What must be built first?
     - What can be parallelized?
     - Integration points

  3. RISK ASSESSMENT
     - Technical challenges
     - Performance concerns
     - Security considerations

  Output: Detailed implementation roadmap with task dependencies.""",
  run_in_background=true
)

Task(
  subagent_type="backend-system-architect",
  prompt="""BACKEND ARCHITECTURE

  Feature: $ARGUMENTS
  Standards: FastAPI, Pydantic v2, async/await, SQLAlchemy 2.0

  Design:
  1. API endpoints (REST conventions)
  2. Service layer structure
  3. Database schema/migrations
  4. Error handling patterns
  5. Testing strategy (unit + integration)

  Use skills:
  - api-design-framework for REST patterns
  - database-schema-designer for schema
  - type-safety-validation for Pydantic models

  Output: Backend implementation spec with file paths.""",
  run_in_background=true
)

Task(
  subagent_type="frontend-ui-developer",
  prompt="""FRONTEND ARCHITECTURE

  Feature: $ARGUMENTS
  Standards: React 19, TypeScript strict, Zod, TanStack Query

  Design:
  1. Component hierarchy
  2. State management approach
  3. API integration (hooks)
  4. Form handling with Zod
  5. Error boundaries

  Use React 19 patterns:
  - use() for data fetching
  - useOptimistic for updates
  - Suspense boundaries
  - Proper TypeScript generics

  Output: Frontend implementation spec with component tree.""",
  run_in_background=true
)

Task(
  subagent_type="ai-ml-engineer",
  prompt="""AI/ML INTEGRATION ANALYSIS

  Feature: $ARGUMENTS

  Evaluate AI integration needs:
  1. Does this feature need LLM?
  2. Embedding/RAG requirements?
  3. LangGraph workflow needed?
  4. Caching strategy for LLM calls
  5. Cost optimization

  If AI is needed, design:
  - Prompt templates
  - Streaming response handling
  - Fallback strategies
  - Token budget

  Output: AI integration spec or "No AI needed" with justification.""",
  run_in_background=true
)

Task(
  subagent_type="ux-researcher",
  prompt="""UX ANALYSIS

  Feature: $ARGUMENTS

  Analyze user experience:
  1. User journey mapping
  2. Accessibility requirements (WCAG 2.1)
  3. Loading states and feedback
  4. Error messaging
  5. Mobile responsiveness

  Output: UX requirements document.""",
  run_in_background=true
)
```

**Wait for all 5 to complete, then synthesize into unified plan.**

## Phase 5: Parallel Implementation (8 Agents)

Based on the architecture phase, launch implementation agents:

```python
# PARALLEL - All eight in ONE message!

Task(
  subagent_type="backend-system-architect",
  prompt="""IMPLEMENT BACKEND API

  Based on architecture spec, implement:
  - API endpoints in backend/app/api/v1/
  - Pydantic models in backend/app/models/
  - Service layer in backend/app/services/

  Standards:
  - Async/await everywhere
  - Proper error handling (no bare exceptions)
  - Input validation with Pydantic v2
  - Dependency injection

  WRITE TESTS alongside implementation!
  Put tests in backend/tests/unit/""",
  run_in_background=true
)

Task(
  subagent_type="backend-system-architect",
  prompt="""IMPLEMENT DATABASE LAYER

  Based on architecture spec, implement:
  - SQLAlchemy models in backend/app/db/models/
  - Repository pattern in backend/app/db/repositories/
  - Alembic migrations in backend/alembic/versions/

  Standards:
  - Type hints on all methods
  - Async session handling
  - Proper indexing

  WRITE TESTS for repository methods!""",
  run_in_background=true
)

Task(
  subagent_type="frontend-ui-developer",
  prompt="""IMPLEMENT UI COMPONENTS

  Based on architecture spec, implement:
  - Components in frontend/src/features/[feature]/
  - Shared components in frontend/src/components/

  React 19 patterns:
  - use() for data fetching
  - useOptimistic for mutations
  - Proper Suspense boundaries
  - TypeScript strict (no 'any')

  WRITE TESTS for components!""",
  run_in_background=true
)

Task(
  subagent_type="frontend-ui-developer",
  prompt="""IMPLEMENT STATE & API HOOKS

  Based on architecture spec, implement:
  - API hooks in frontend/src/features/[feature]/api/
  - Zod schemas for validation
  - TanStack Query integration
  - Error handling

  Standards:
  - Type-safe API calls
  - Optimistic updates
  - Proper loading/error states

  WRITE TESTS for hooks!""",
  run_in_background=true
)

Task(
  subagent_type="ai-ml-engineer",
  prompt="""IMPLEMENT AI INTEGRATION (if needed)

  If AI integration was specified in architecture:
  - Implement LangGraph workflow
  - Create prompt templates
  - Add streaming support
  - Implement caching

  Use skills:
  - ai-native-development
  - langgraph-workflows
  - llm-caching-patterns

  Skip if "No AI needed" was determined.""",
  run_in_background=true
)

Task(
  subagent_type="rapid-ui-designer",
  prompt="""IMPLEMENT STYLING

  Based on UX requirements, implement:
  - TailwindCSS styling
  - Responsive breakpoints
  - Dark mode support
  - Animation/transitions
  - Design tokens

  Focus on:
  - Accessibility (focus states, contrast)
  - Mobile-first approach
  - Consistent spacing/typography""",
  run_in_background=true
)

Task(
  subagent_type="code-quality-reviewer",
  prompt="""IMPLEMENT TEST SUITE

  Create comprehensive test coverage:
  - Unit tests for all new functions
  - Integration tests for API endpoints
  - Component tests for React
  - Mock strategies for external services

  Use skills:
  - testing-strategy-builder

  Target: 80% coverage minimum""",
  run_in_background=true
)

Task(
  subagent_type="sprint-prioritizer",
  prompt="""TRACK IMPLEMENTATION PROGRESS

  Monitor all implementation agents:
  - Track task completion
  - Identify blockers
  - Update TodoWrite
  - Flag integration issues

  Report status updates as agents complete.""",
  run_in_background=true
)
```

**Wait for all 8 to complete, then move to integration.**

## Phase 6: Integration & Validation (4 Agents)

```python
# PARALLEL - All four in ONE message!

Task(
  subagent_type="backend-system-architect",
  prompt="""INTEGRATION: BACKEND + DATABASE

  Verify integration:
  - API endpoints use correct services
  - Services use correct repositories
  - Migrations run cleanly
  - All imports resolved

  Run:
  - poetry run alembic upgrade head (dry-run)
  - poetry run ruff check app/
  - poetry run ty check app/""",
  run_in_background=true
)

Task(
  subagent_type="frontend-ui-developer",
  prompt="""INTEGRATION: FRONTEND + API

  Verify integration:
  - Components use correct hooks
  - API types match backend
  - Error handling works E2E
  - Loading states correct

  Run:
  - npm run typecheck
  - npm run lint
  - npm run build""",
  run_in_background=true
)

Task(
  subagent_type="code-quality-reviewer",
  prompt="""FULL TEST SUITE

  Run all tests with coverage:

  Backend:
  - cd backend && poetry run pytest tests/unit/ -v --cov=app --cov-report=term-missing

  Frontend:
  - cd frontend && npm test -- --coverage

  Report: Pass/fail counts, coverage percentage, failing tests.""",
  run_in_background=true
)

Task(
  subagent_type="code-quality-reviewer",
  prompt="""SECURITY & QUALITY AUDIT

  Final checks:
  - No hardcoded secrets
  - SQL injection prevention
  - XSS prevention
  - Proper input validation
  - npm audit / pip-audit

  Report all issues with severity.""",
  run_in_background=true
)
```

## Phase 7: E2E Verification (Playwright MCP)

If UI changes, verify with browser:

```python
# Navigate and test
mcp__playwright__browser_navigate(url="http://localhost:5173")
mcp__playwright__browser_snapshot()

# Test the new feature
mcp__playwright__browser_click(element="...", ref="...")
mcp__playwright__browser_type(element="...", ref="...", text="...")
mcp__playwright__browser_wait_for(text="Success")

# Screenshot evidence
mcp__playwright__browser_take_screenshot(filename="feature-implementation.png")
```

## Phase 8: Documentation & Context

```python
# Save to memory MCP
mcp__memory__create_entities(entities=[{
  "name": "implementation-[feature]-[date]",
  "entityType": "feature-implementation",
  "observations": [
    "Components created: ...",
    "API endpoints: ...",
    "Test coverage: ...%",
    "Decisions made: ..."
  ]
}])
```

Update TodoWrite to mark all tasks complete.

---

## Summary

**Total Parallel Agents: 17 across 4 phases**
- Phase 4 (Design): 5 agents
- Phase 5 (Implementation): 8 agents
- Phase 6 (Integration): 4 agents

**MCPs Used:**
- 🧠 sequential-thinking (complex reasoning)
- 📚 context7 (library documentation)
- 💾 memory (decision persistence)
- 🎭 playwright (E2E verification)
- 🔍 WebSearch (today's best practices)

**Skills Loaded:**
- api-design-framework
- react-server-components-framework
- type-safety-validation
- testing-strategy-builder
- streaming-api-patterns
- database-schema-designer
- ai-native-development
- performance-optimization

**Key Principles:**
- Tests are NOT optional
- Parallel when independent
- Progressive skill loading
- Evidence-based completion
