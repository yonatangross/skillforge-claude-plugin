---
name: testing-strategy-builder
description: Use this skill when creating comprehensive testing strategies for applications. Provides test planning templates, coverage targets, test case structures, and guidance for unit, integration, E2E, and performance testing. Ensures robust quality assurance across the development lifecycle.
version: 1.0.0
author: AI Agent Hub
tags: [testing, quality-assurance, test-strategy, automation, coverage]
---

# Testing Strategy Builder

## Overview

This skill provides comprehensive guidance for building effective testing strategies that ensure software quality, reliability, and maintainability. Whether starting from scratch or improving existing test coverage, this framework helps teams design robust testing approaches.

**When to use this skill:**
- Planning testing strategy for new projects or features
- Improving test coverage in existing codebases
- Establishing quality gates and coverage targets
- Designing test automation architecture
- Creating test plans and test cases
- Choosing appropriate testing tools and frameworks
- Implementing continuous testing in CI/CD pipelines

**Bundled Resources:**
- `references/code-examples.md` - Detailed testing code examples
- `templates/test-plan-template.md` - Comprehensive test plan template
- `templates/test-case-template.md` - Test case documentation template
- `checklists/test-coverage-checklist.md` - Coverage verification checklist

## Required Tools

This skill references the following testing tools. Not all are required - the skill will recommend appropriate tools based on your project.

### JavaScript/TypeScript Testing
- **Jest:** Most popular testing framework
  - **Install:** `npm install --save-dev jest @types/jest`
  - **Config:** `npx jest --init`

- **Vitest:** Vite-native testing framework
  - **Install:** `npm install --save-dev vitest`
  - **Config:** Add to vite.config.ts

- **MSW (Mock Service Worker):** Network-level API mocking (2025 STANDARD)
  - **Install:** `npm install --save-dev msw`
  - **Setup:** `npx msw init public/ --save`
  - **Why MSW:** Intercepts at network level, not implementation level

- **Playwright:** End-to-end testing
  - **Install:** `npm install --save-dev @playwright/test`
  - **Setup:** `npx playwright install`

- **k6:** Performance testing
  - **Install (macOS):** `brew install k6`
  - **Install (Linux):** Download from k6.io
  - **Command:** `k6 run script.js`

### Python Testing
- **pytest:** Standard Python testing framework
  - **Install:** `pip install pytest`
  - **Command:** `pytest`

- **pytest-cov:** Coverage reporting
  - **Install:** `pip install pytest-cov`
  - **Command:** `pytest --cov=.`

- **pytest-vcr / VCR.py:** HTTP recording/playback (2025 STANDARD)
  - **Install:** `pip install pytest-vcr vcrpy`
  - **Config:** Add to `conftest.py`
  - **Why VCR:** Record real HTTP responses once, replay deterministically

- **Locust:** Performance testing
  - **Install:** `pip install locust`
  - **Command:** `locust -f locustfile.py`

### Coverage Tools
- **c8:** JavaScript/TypeScript coverage
  - **Install:** `npm install --save-dev c8`
  - **Command:** `c8 npm test`

- **Istanbul/nyc:** Alternative JS coverage
  - **Install:** `npm install --save-dev nyc`
  - **Command:** `nyc npm test`

### Installation Verification
```bash
# JavaScript/TypeScript
jest --version
vitest --version
playwright --version
k6 version

# Python
pytest --version
locust --version

# Coverage
c8 --version
nyc --version
```

**Note:** The skill will guide you to select tools based on your project framework (React, Vue, FastAPI, Django, etc.) and testing needs.

## Testing Philosophy

### The Testing Trophy 🏆

Modern testing follows the "Testing Trophy" model (evolved from the testing pyramid):

```
         🏆
       /    \
      /  E2E  \         ← Few (critical user journeys)
     /----------\
    / Integration\      ← Many (component interactions)
   /--------------\
  /     Unit       \    ← Most (business logic)
 /------------------\
/  Static Analysis   \  ← Foundation (linting, type checking)
```

**Principles:**
1. **Static Analysis**: Catch syntax errors, type issues, and common bugs before runtime
2. **Unit Tests**: Test individual functions and components in isolation
3. **Integration Tests**: Test how components work together
4. **E2E Tests**: Validate critical user workflows end-to-end

**Balance:** 70% integration, 20% unit, 10% E2E (adjust based on context)

---

## Testing Strategy Framework

### 1. Coverage Targets

**Recommended Targets:**
- **Overall Code Coverage**: 80% minimum
- **Critical Paths**: 95-100% (payment, auth, data mutations)
- **New Features**: 100% coverage requirement
- **Business Logic**: 90%+ coverage
- **UI Components**: 70%+ coverage

**Coverage Types:**
- **Line Coverage**: Percentage of code lines executed
- **Branch Coverage**: Percentage of decision branches taken
- **Function Coverage**: Percentage of functions called
- **Statement Coverage**: Percentage of statements executed

**Important:** Coverage is a metric, not a goal. 100% coverage ≠ bug-free code.

### 2. Test Classification

#### Static Analysis
**Purpose**: Catch errors before runtime
**Tools**: ESLint, Prettier, TypeScript, Pylint, mypy, Ruff
**When to run:** Pre-commit hooks, CI pipeline

#### Unit Tests
**Purpose**: Test isolated business logic
**Tools**: Jest, Vitest, pytest, JUnit
**Characteristics:**
- Fast execution (< 100ms per test)
- No external dependencies (database, API, filesystem)
- Deterministic (same input = same output)
- Test single responsibility

**Coverage Target:** 90%+ for business logic

See `references/code-examples.md` for detailed unit test examples.

#### Integration Tests
**Purpose**: Test component interactions
**Tools:** Testing Library, Supertest, pytest with fixtures
**Characteristics:**
- Test multiple units working together
- May use test databases or mocked external services
- Moderate execution time (< 1s per test)
- Focus on interfaces and contracts

**Coverage Target:** 70%+ for API endpoints and component interactions

See `references/code-examples.md` for API integration test examples.

#### End-to-End (E2E) Tests
**Purpose**: Validate critical user journeys
**Tools:** Playwright, Cypress, Selenium
**Characteristics:**
- Test entire application flow (frontend + backend + database)
- Slow execution (5-30s per test)
- Run against production-like environment
- Focus on business-critical paths

**Coverage Target:** 5-10 critical user journeys

See `references/code-examples.md` for complete E2E test examples.

#### Performance Tests
**Purpose**: Validate system performance under load
**Tools:** k6, Artillery, JMeter, Locust
**Types:**
- **Load Testing**: System behavior under expected load
- **Stress Testing**: Breaking point identification
- **Spike Testing**: Sudden traffic surge handling
- **Soak Testing**: Sustained load over time (memory leaks)

**Coverage Target:** Test all performance-critical endpoints

See `references/code-examples.md` for k6 load test examples.

---

## Test Planning

### 1. Risk-Based Testing

Prioritize testing based on risk assessment:

**High Risk (100% coverage required):**
- Payment processing
- Authentication and authorization
- Data mutations (create, update, delete)
- Security-critical operations
- Compliance-related features

**Medium Risk (80% coverage):**
- Business logic
- Data transformations
- API integrations
- Email/notification systems

**Low Risk (50% coverage):**
- UI styling
- Static content
- Read-only operations
- Non-critical features

### 2. Test Case Design

**Given-When-Then Pattern:**
```
Given [initial context]
When [action occurs]
Then [expected outcome]
```

This pattern keeps tests clear and focused. See `references/code-examples.md` for implementation examples.

### 3. Test Data Management

**Strategies:**
- **Fixtures**: Pre-defined test data in JSON/YAML files
- **Factories**: Generate test data programmatically
- **Seeders**: Populate test database with known data
- **Faker Libraries**: Generate realistic random data

See `references/code-examples.md` for test factory and fixture examples.

---

## Testing Patterns and Best Practices

### 1. AAA Pattern (Arrange-Act-Assert)

Structure tests in three clear phases:
- **Arrange**: Set up test data and context
- **Act**: Perform the action being tested
- **Assert**: Verify expected outcomes

See `references/code-examples.md` for detailed AAA pattern examples.

### 2. Test Isolation

**Each test should be independent:**
- Use fresh test database for each test
- Clean up resources after each test
- Tests don't depend on execution order

See `references/code-examples.md` for test isolation patterns.

### 3. Mocking vs Real Dependencies

**When to Mock:**
- External APIs (payment gateways, third-party services)
- Slow operations (file I/O, network calls)
- Non-deterministic behavior (current time, random values)
- Hard-to-test scenarios (error conditions, edge cases)

**When to Use Real Dependencies:**
- Fast, deterministic operations
- Critical business logic
- Database operations (use test database)
- Internal service interactions

See `references/code-examples.md` for mocking examples.

### 4. MSW (Mock Service Worker) - 2025 Standard

**MSW is the industry-standard approach for API mocking in frontend tests (Dec 2025).**

MSW intercepts requests at the network level, not by mocking implementation details. This provides several advantages:
- Tests use the **real fetch/axios code** - no implementation mocking
- Handlers work across **all test types** (unit, integration, E2E)
- Easy to simulate **error states, delays, and edge cases**
- Same handlers work in **browser and Node.js** environments

#### Basic MSW Setup (Vitest/Jest)

```typescript
// src/mocks/handlers.ts
import { http, HttpResponse } from 'msw'

export const handlers = [
  // Success response
  http.get('/api/v1/analyze/:id', ({ params }) => {
    return HttpResponse.json({
      id: params.id,
      status: 'completed',
      createdAt: '2025-12-25T00:00:00Z',
    })
  }),

  // Error response
  http.get('/api/v1/analyze/error', () => {
    return HttpResponse.json(
      { error: 'Analysis not found' },
      { status: 404 }
    )
  }),

  // Delayed response (simulates slow network)
  http.get('/api/v1/slow', async () => {
    await delay(2000) // 2 second delay
    return HttpResponse.json({ data: 'slow response' })
  }),
]
```

```typescript
// src/mocks/server.ts (for Vitest/Jest - Node.js)
import { setupServer } from 'msw/node'
import { handlers } from './handlers'

export const server = setupServer(...handlers)
```

```typescript
// src/mocks/browser.ts (for Storybook/browser tests)
import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

export const worker = setupWorker(...handlers)
```

#### Test Setup with MSW

```typescript
// vitest.setup.ts
import { beforeAll, afterEach, afterAll } from 'vitest'
import { server } from './src/mocks/server'

// Start server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

// Reset handlers after each test (removes runtime overrides)
afterEach(() => server.resetHandlers())

// Close server after all tests
afterAll(() => server.close())
```

#### Runtime Handler Overrides

```typescript
import { http, HttpResponse } from 'msw'
import { server } from '../mocks/server'

test('shows error message when API fails', async () => {
  // Override for this specific test
  server.use(
    http.get('/api/v1/analyze/:id', () => {
      return HttpResponse.json(
        { error: 'Server error' },
        { status: 500 }
      )
    })
  )

  render(<AnalysisView id="123" />)

  expect(await screen.findByText('Server error')).toBeInTheDocument()
})

test('shows loading state while fetching', async () => {
  // Delay response to test loading state
  server.use(
    http.get('/api/v1/analyze/:id', async () => {
      await delay(100)
      return HttpResponse.json({ id: '123', status: 'pending' })
    })
  )

  render(<AnalysisView id="123" />)

  // Loading skeleton should be visible
  expect(screen.getByTestId('skeleton')).toBeInTheDocument()

  // Then data appears
  expect(await screen.findByText('pending')).toBeInTheDocument()
})
```

#### MSW with Zod Validation Testing

```typescript
import { z } from 'zod'
import { http, HttpResponse } from 'msw'
import { server } from '../mocks/server'

const AnalysisSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['pending', 'running', 'completed', 'failed']),
})

test('handles invalid API response gracefully', async () => {
  // Return malformed data
  server.use(
    http.get('/api/v1/analyze/:id', () => {
      return HttpResponse.json({
        id: 'not-a-uuid',  // Invalid!
        status: 'unknown', // Invalid enum!
      })
    })
  )

  render(<AnalysisView id="123" />)

  // Should show validation error, not crash
  expect(await screen.findByText(/validation error/i)).toBeInTheDocument()
})
```

#### MSW Anti-Patterns

```typescript
// ❌ NEVER mock fetch/axios directly
jest.spyOn(global, 'fetch').mockResolvedValue(...)  // BAD!
jest.mock('axios')  // BAD!

// ❌ NEVER mock your API service module
jest.mock('../services/api')  // BAD!

// ❌ NEVER test implementation details
expect(fetch).toHaveBeenCalledWith('/api/...')  // BAD!

// ✅ ALWAYS use MSW handlers
import { http, HttpResponse } from 'msw'
server.use(http.get('/api/...', () => HttpResponse.json({...})))

// ✅ ALWAYS test user-visible behavior
expect(await screen.findByText('Success')).toBeInTheDocument()
```

#### MSW Integration Testing Example

```typescript
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { server } from '../mocks/server'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

function renderWithProviders(component: React.ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  )
}

describe('AnalysisForm', () => {
  test('submits analysis and shows result', async () => {
    const user = userEvent.setup()

    // Mock the POST endpoint
    server.use(
      http.post('/api/v1/analyze', async ({ request }) => {
        const body = await request.json()
        return HttpResponse.json({
          analysis_id: 'new-123',
          url: body.url,
          status: 'pending',
        })
      })
    )

    renderWithProviders(<AnalysisForm />)

    // Fill form
    await user.type(screen.getByLabelText('URL'), 'https://example.com')
    await user.click(screen.getByRole('button', { name: /analyze/i }))

    // Verify result
    expect(await screen.findByText(/analysis started/i)).toBeInTheDocument()
    expect(screen.getByText('new-123')).toBeInTheDocument()
  })

  test('shows validation error on invalid URL', async () => {
    const user = userEvent.setup()

    server.use(
      http.post('/api/v1/analyze', () => {
        return HttpResponse.json(
          { detail: 'Invalid URL format' },
          { status: 422 }
        )
      })
    )

    renderWithProviders(<AnalysisForm />)

    await user.type(screen.getByLabelText('URL'), 'not-a-url')
    await user.click(screen.getByRole('button', { name: /analyze/i }))

    expect(await screen.findByText(/invalid url/i)).toBeInTheDocument()
  })
})

### 4. VCR.py - Python HTTP Recording (2025 Standard)

**VCR.py is the gold standard for testing Python code that makes HTTP requests.** It records real HTTP interactions once, then replays them for deterministic tests.

#### Why VCR.py?

| Approach | Problem |
|----------|---------|
| Mocking `requests` | Couples tests to implementation details |
| Live HTTP calls | Slow, flaky, rate-limited, non-deterministic |
| Manual fixtures | Tedious to maintain, drift from reality |
| **VCR.py** | ✅ Records real responses, replays deterministically |

#### Basic Setup

```python
# conftest.py
import pytest
import vcr

# Configure VCR globally
@pytest.fixture(scope="module")
def vcr_config():
    return {
        "cassette_library_dir": "tests/cassettes",
        "record_mode": "once",  # Record once, then replay
        "match_on": ["uri", "method"],
        "filter_headers": ["authorization", "x-api-key"],  # Security!
        "filter_query_parameters": ["api_key", "token"],
    }

# Alternative: pytest-vcr fixture decorator
@pytest.fixture
def vcr_cassette_dir(request):
    return f"tests/cassettes/{request.module.__name__}"
```

#### Basic Usage

```python
import pytest
import vcr

# Method 1: Context manager
def test_fetch_user_data():
    with vcr.use_cassette("tests/cassettes/user_data.yaml"):
        response = requests.get("https://api.example.com/users/1")
        assert response.status_code == 200
        assert response.json()["name"] == "John Doe"

# Method 2: pytest-vcr decorator (recommended)
@pytest.mark.vcr()
def test_fetch_user_data_decorator():
    response = requests.get("https://api.example.com/users/1")
    assert response.status_code == 200
    assert response.json()["name"] == "John Doe"

# Method 3: Custom cassette name
@pytest.mark.vcr("custom_cassette_name.yaml")
def test_with_custom_cassette():
    response = requests.get("https://api.example.com/users/1")
    assert response.status_code == 200
```

#### Async Support (httpx, aiohttp)

```python
import pytest
import vcr
from httpx import AsyncClient

# VCR.py works with async HTTP clients
@pytest.mark.asyncio
@pytest.mark.vcr()
async def test_async_api_call():
    async with AsyncClient() as client:
        response = await client.get("https://api.example.com/data")
        assert response.status_code == 200
        assert "items" in response.json()
```

#### Recording Modes

```python
# conftest.py - configure per environment
@pytest.fixture(scope="module")
def vcr_config():
    import os

    # CI: never record, only replay
    if os.environ.get("CI"):
        record_mode = "none"
    # Dev: record new, keep existing
    else:
        record_mode = "new_episodes"

    return {
        "record_mode": record_mode,
        "cassette_library_dir": "tests/cassettes",
    }
```

| Mode | Behavior | Use Case |
|------|----------|----------|
| `once` | Record if cassette missing, then replay | Default for most tests |
| `new_episodes` | Record new requests, replay existing | Adding to existing tests |
| `none` | Never record, fail on new requests | CI environments |
| `all` | Always record (overwrites) | Refreshing stale cassettes |

#### Filtering Sensitive Data

```python
# conftest.py
@pytest.fixture(scope="module")
def vcr_config():
    return {
        # Remove headers before recording
        "filter_headers": [
            "authorization",
            "x-api-key",
            "cookie",
            "set-cookie",
        ],
        # Remove query parameters
        "filter_query_parameters": [
            "api_key",
            "access_token",
            "client_secret",
        ],
        # Custom body filter
        "before_record_request": filter_request_body,
        "before_record_response": filter_response_body,
    }

def filter_request_body(request):
    """Redact sensitive data from request body."""
    if request.body:
        import json
        try:
            body = json.loads(request.body)
            if "password" in body:
                body["password"] = "REDACTED"
            if "api_key" in body:
                body["api_key"] = "REDACTED"
            request.body = json.dumps(body)
        except json.JSONDecodeError:
            pass
    return request

def filter_response_body(response):
    """Redact sensitive data from response body."""
    # Similar filtering logic
    return response
```

#### Real-World Example: External API Service

```python
# tests/services/test_tavily_service.py
import pytest
from app.services.external.tavily_service import TavilySearchService

@pytest.fixture
def tavily_service():
    return TavilySearchService(api_key="test-key")

@pytest.mark.vcr()
async def test_tavily_search_returns_results(tavily_service):
    """Test Tavily search with recorded HTTP response."""
    results = await tavily_service.search("Python async patterns")

    assert len(results) > 0
    assert all("url" in r for r in results)
    assert all("content" in r for r in results)

@pytest.mark.vcr()
async def test_tavily_search_handles_empty_query(tavily_service):
    """Test graceful handling of empty search."""
    results = await tavily_service.search("")

    assert results == []

@pytest.mark.vcr()
async def test_tavily_rate_limit_error(tavily_service):
    """Test handling of rate limit response (cassette has 429)."""
    with pytest.raises(RateLimitError):
        await tavily_service.search("query that triggers rate limit")
```

#### Cassette File Example

```yaml
# tests/cassettes/test_tavily_search_returns_results.yaml
interactions:
- request:
    body: '{"query": "Python async patterns", "max_results": 10}'
    headers:
      Content-Type: application/json
      # Note: authorization header filtered out
    method: POST
    uri: https://api.tavily.com/search
  response:
    body:
      string: '{"results": [{"url": "https://...", "content": "..."}]}'
    headers:
      Content-Type: application/json
    status:
      code: 200
      message: OK
version: 1
```

#### VCR.py + LLM API Testing

```python
# tests/services/test_llm_service.py
import pytest
import vcr

# Custom matcher for LLM requests (ignore timestamp, request_id)
def llm_request_matcher(r1, r2):
    """Match LLM requests ignoring dynamic fields."""
    import json

    if r1.uri != r2.uri or r1.method != r2.method:
        return False

    body1 = json.loads(r1.body)
    body2 = json.loads(r2.body)

    # Ignore fields that change between runs
    for field in ["request_id", "timestamp", "stream_id"]:
        body1.pop(field, None)
        body2.pop(field, None)

    return body1 == body2

@pytest.fixture(scope="module")
def vcr_config():
    return {
        "cassette_library_dir": "tests/cassettes/llm",
        "match_on": ["method", "uri"],
        "custom_matchers": [llm_request_matcher],
        "filter_headers": ["authorization", "x-api-key"],
    }

@pytest.mark.vcr()
async def test_llm_completion():
    """Test LLM completion with recorded response."""
    response = await llm_client.complete(
        model="claude-3-5-sonnet",
        messages=[{"role": "user", "content": "Say hello"}]
    )

    assert response.content is not None
    assert "hello" in response.content.lower()
```

#### VCR.py Anti-Patterns

```python
# ❌ NEVER: Commit cassettes with real API keys
# Bad cassette file:
# headers:
#   authorization: Bearer sk-real-api-key-12345

# ❌ NEVER: Use "all" mode in CI
# record_mode: "all"  # Will try to make real HTTP calls!

# ❌ NEVER: Skip VCR for "simple" HTTP tests
def test_api_call():
    # This will make REAL HTTP calls in tests!
    response = requests.get("https://api.example.com/data")

# ✅ ALWAYS: Filter sensitive data
# ✅ ALWAYS: Use "none" mode in CI
# ✅ ALWAYS: Wrap all HTTP tests with VCR
```

#### Refreshing Stale Cassettes

```bash
# Delete old cassette to re-record
rm tests/cassettes/test_tavily_search_returns_results.yaml

# Run test to record fresh response
pytest tests/services/test_tavily_service.py::test_tavily_search_returns_results -v

# Or use environment variable to force re-record
VCR_RECORD_MODE=all pytest tests/services/ -v
```

### 5. Snapshot Testing

**Use for:** UI components, API responses, generated code

**Warning:** Snapshots can become brittle. Use for stable components, not rapidly changing UI.

### 6. Parameterized Tests

Test multiple scenarios with same logic using data tables.

See `references/code-examples.md` for parameterized test patterns.

---

## Continuous Testing

### 1. CI/CD Integration

**Pipeline Stages:**
```yaml
# Example: GitHub Actions
name: Test Pipeline

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install dependencies
        run: npm ci
      - name: Lint
        run: npm run lint
      - name: Type check
        run: npm run typecheck
      - name: Unit & Integration Tests
        run: npm test -- --coverage
      - name: Upload coverage
        uses: codecov/codecov-action@v3
      - name: E2E Tests
        run: npm run test:e2e
      - name: Performance Tests (on main branch)
        if: github.ref == 'refs/heads/main'
        run: npm run test:performance
```

### 2. Quality Gates

**Block merges/deployments if:**
- Code coverage drops below threshold (e.g., 80%)
- Any tests fail
- Linting errors exist
- Performance regression detected (> 10% slower)
- Security vulnerabilities found

### 3. Test Execution Strategy

**On Every Commit:**
- Static analysis (lint, type check)
- Unit tests
- Fast integration tests (< 5 min total)

**On Pull Request:**
- All tests (unit + integration + E2E)
- Coverage report
- Performance benchmarks

**On Deploy to Staging:**
- Full E2E suite
- Load testing
- Security scans

**On Deploy to Production:**
- Smoke tests (critical paths only)
- Health checks
- Canary deployments with monitoring

---

## Testing Tools Recommendations

### JavaScript/TypeScript

| Category | Tool | Use Case |
|----------|------|----------|
| **Unit/Integration** | Vitest | Fast, Vite-native, modern |
| **Unit/Integration** | Jest | Mature, extensive ecosystem |
| **E2E** | Playwright | Cross-browser, reliable, fast |
| **E2E** | Cypress | Developer-friendly, visual debugging |
| **Component Testing** | Testing Library | User-centric, framework-agnostic |
| **API Testing** | Supertest | HTTP assertions, Express integration |
| **Performance** | k6 | Load testing, scriptable |

### Python

| Category | Tool | Use Case |
|----------|------|----------|
| **Unit/Integration** | pytest | Powerful, extensible, fixtures |
| **API Testing** | httpx + pytest | Async support, modern |
| **E2E** | Playwright (Python) | Browser automation |
| **Performance** | Locust | Load testing, Python-based |
| **Mocking** | unittest.mock | Standard library, reliable |

---

## Common Testing Anti-Patterns

❌ **Testing Implementation Details**
```typescript
// Bad: Testing internal state
expect(component.state.isLoading).toBe(false);

// Good: Testing user-visible behavior
expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
```

❌ **Tests Too Coupled to Code**
```typescript
// Bad: Test breaks when implementation changes
expect(userService.save).toHaveBeenCalledTimes(1);

// Good: Test behavior, not implementation
const user = await db.users.findOne({ email: 'test@example.com' });
expect(user).toBeTruthy();
```

❌ **Direct Fetch Mocking (2025 Anti-Pattern)**
```typescript
// Bad: Mocks implementation, not network behavior
jest.spyOn(global, 'fetch').mockResolvedValue({
  json: () => Promise.resolve({ data: 'mocked' })
});

jest.mock('axios');
jest.mock('../services/api');

// Good: Use MSW for network-level mocking
import { http, HttpResponse } from 'msw';
server.use(
  http.get('/api/data', () => HttpResponse.json({ data: 'mocked' }))
);
```

❌ **Flaky Tests**
```typescript
// Bad: Non-deterministic timeout
await waitFor(() => {
  expect(screen.getByText('Success')).toBeInTheDocument();
}, { timeout: 1000 }); // Might fail on slow CI

// Good: Use explicit waits with longer timeout
await screen.findByText('Success', {}, { timeout: 5000 });
```

❌ **Giant Test Cases**
```typescript
// Bad: One test does too much
test('user workflow', async () => {
  // 100 lines testing signup, login, profile update, logout...
});

// Good: Focused tests
test('user can sign up', async () => { /* ... */ });
test('user can login', async () => { /* ... */ });
test('user can update profile', async () => { /* ... */ });
```

---

## Integration with Agents

### Code Quality Reviewer
- Reviews test coverage reports
- Suggests missing test cases
- Validates test quality and structure
- Ensures tests follow patterns from this skill

### Backend System Architect
- Uses test strategy templates when designing services
- Ensures APIs are testable (dependency injection, clear interfaces)
- Plans integration test architecture

### Frontend UI Developer
- Applies component testing patterns
- Uses Testing Library best practices
- Implements E2E tests for user flows

### AI/ML Engineer
- Adapts testing patterns for ML models (data validation, model performance tests)
- Uses performance testing for inference endpoints

---

## Quick Start Checklist

When starting a new project or feature:

- [ ] Define coverage targets (overall, critical paths, new code)
- [ ] Choose testing framework (Jest/Vitest, Playwright, etc.)
- [ ] Set up test infrastructure (test database, fixtures, factories)
- [ ] Create test plan (see `templates/test-plan-template.md`)
- [ ] Implement static analysis (ESLint, TypeScript)
- [ ] Write unit tests for business logic (80%+ coverage)
- [ ] Write integration tests for API endpoints (70%+ coverage)
- [ ] Write E2E tests for critical user journeys (5-10 flows)
- [ ] Configure CI/CD pipeline with quality gates
- [ ] Set up coverage reporting (Codecov, Coveralls)
- [ ] Document testing conventions in project README

**For detailed code examples**: See `references/code-examples.md`

---

## AI/LLM Testing Patterns (v1.1.0)

Testing AI applications requires specialized approaches due to their probabilistic nature.

### Async Timeout Testing

```python
import pytest
import asyncio

@pytest.mark.asyncio
async def test_operation_respects_timeout():
    """Test that async operations honor timeout limits."""
    async def slow_operation():
        await asyncio.sleep(10)  # Simulates slow LLM call
        return "result"

    with pytest.raises(asyncio.TimeoutError):
        async with asyncio.timeout(0.1):
            await slow_operation()

@pytest.mark.asyncio
async def test_graceful_degradation_on_timeout():
    """Test fail-open behavior when operation times out."""
    result = await safe_operation_with_fallback(timeout=0.1)
    assert result["status"] == "fallback"
    assert result["error"] == "Operation timed out"
```

### LLM Mock Patterns

```python
from unittest.mock import AsyncMock, patch

@pytest.fixture
def mock_llm_response():
    """Mock LLM to return predictable structured output."""
    mock = AsyncMock()
    mock.return_value = {
        "content": "Mocked response",
        "confidence": 0.85,
        "tokens_used": 150
    }
    return mock

@pytest.mark.asyncio
async def test_synthesis_with_mocked_llm(mock_llm_response):
    """Test synthesis logic without actual LLM calls."""
    with patch("app.core.model_factory.get_model", return_value=mock_llm_response):
        result = await synthesize_findings(sample_findings)

    assert result["executive_summary"] is not None
    assert mock_llm_response.call_count == 1
```

### Pydantic v2 Model Testing

```python
import pytest
from pydantic import ValidationError

def test_quiz_question_validates_correct_answer():
    """Test that correct_answer must be in options."""
    with pytest.raises(ValidationError) as exc_info:
        QuizQuestion(
            question="What is 2+2?",
            options=["3", "4", "5"],
            correct_answer="6",  # Not in options!
            explanation="Basic arithmetic"
        )

    assert "correct_answer" in str(exc_info.value)
    assert "must be one of" in str(exc_info.value)

def test_quiz_question_accepts_valid_answer():
    """Test that valid answers pass validation."""
    q = QuizQuestion(
        question="What is 2+2?",
        options=["3", "4", "5"],
        correct_answer="4",  # Valid!
        explanation="Basic arithmetic"
    )
    assert q.correct_answer == "4"
```

### Template Rendering Tests

```python
from jinja2 import Environment, FileSystemLoader

@pytest.fixture
def jinja_env():
    return Environment(loader=FileSystemLoader("templates/"))

def test_template_handles_empty_tldr(jinja_env):
    """Template renders without crashing when tldr is empty."""
    template = jinja_env.get_template("artifact.j2")
    result = template.render(aggregated_insights={"tldr": {}})
    assert "TL;DR" not in result  # Section skipped gracefully

def test_template_handles_missing_nested_field(jinja_env):
    """Template handles None in nested objects."""
    template = jinja_env.get_template("artifact.j2")
    result = template.render(aggregated_insights={
        "tldr": {"summary": None, "key_takeaways": []}
    })
    # Should not crash, should handle gracefully
    assert isinstance(result, str)
```

### LLM-as-Judge Evaluator Testing

```python
@pytest.mark.asyncio
async def test_quality_evaluator_returns_normalized_score():
    """Quality scores should be normalized 0.0-1.0."""
    evaluator = create_quality_evaluator("relevance")

    # Mock the LLM to return a score
    with patch_evaluator_llm(return_score=8):  # 8/10
        result = await evaluator.aevaluate_strings(
            input="Test input",
            prediction="Test output"
        )

    assert 0.0 <= result["score"] <= 1.0
    assert result["score"] == 0.8  # 8/10 normalized

@pytest.mark.asyncio
async def test_quality_gate_fails_below_threshold():
    """Quality gate should fail when avg score < threshold."""
    with patch_quality_scores({"relevance": 0.5, "depth": 0.4, "coherence": 0.5}):
        result = await quality_gate_node(sample_state)

    assert result["quality_gate_passed"] is False
    assert result["quality_gate_avg_score"] < 0.7
```

### Edge Case Identification Strategy

When testing LLM integrations, always test these edge cases:
- **Empty inputs:** What happens with empty strings or None?
- **Very long inputs:** Does truncation work correctly?
- **Timeout scenarios:** Does fail-open work?
- **Partial responses:** What if LLM returns 90% complete?
- **Invalid structured output:** What if schema validation fails?
- **Division by zero:** What if averaging over empty list?
- **Nested null access:** What if parent object exists but child is None?

---

**Skill Version**: 1.3.0
**Last Updated**: 2025-12-27
**Maintained by**: AI Agent Hub Team

## Changelog

### v1.3.0 (2025-12-27)
- Added VCR.py (pytest-vcr) as 2025 standard for Python HTTP recording/playback
- Added comprehensive VCR.py patterns section with async support
- Added VCR.py + LLM API testing patterns
- Added cassette filtering for sensitive data
- Added recording modes documentation (once, new_episodes, none, all)
- Added VCR.py anti-patterns section

### v1.2.0 (2025-12-25)
- Added MSW (Mock Service Worker) as 2025 standard for API mocking
- Added comprehensive MSW patterns section with Vitest/Jest examples
- Added MSW + Zod validation testing patterns
- Added MSW anti-patterns section
- Flagged direct fetch/axios mocking as anti-pattern
- Added MSW integration testing example with TanStack Query

### v1.1.0 (2025-12-14)
- Added AI/LLM testing patterns (async timeout, mock LLM, Pydantic v2)
