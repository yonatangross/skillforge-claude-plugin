---
description: Comprehensive test execution with parallel analysis
---

# Run Tests: $ARGUMENTS

Test execution with parallel analysis agents for failures.

## Phase 1: Determine Test Scope

Interpret $ARGUMENTS:
- Empty/`all` → Run all tests
- `backend` → Backend tests only
- `frontend` → Frontend tests only
- `path/to/test.py` → Specific test file
- `test_name` → Specific test by name

## Phase 2: Execute Tests (Parallel Backend + Frontend)

```bash
# PARALLEL - Run both in background if testing all

# Backend tests with coverage
cd backend
poetry run pytest tests/unit/ -v --tb=short \
  --cov=app --cov-report=term-missing \
  2>&1 | tee /tmp/backend_test_results.log &

# Frontend tests with coverage
cd frontend
npm run test -- --coverage 2>&1 | tee /tmp/frontend_test_results.log &

# Wait for both
wait
```

### Specific Test Commands

```bash
# Backend - specific file
poetry run pytest tests/unit/$ARGUMENTS -v --tb=short

# Backend - specific test name
poetry run pytest tests/unit/ -k "$ARGUMENTS" -v --tb=short

# Backend - with markers
poetry run pytest tests/unit/ -m "not slow and not external" -v --tb=short

# Frontend - specific pattern
npm run test -- --testPathPattern="$ARGUMENTS"

# Quick summary (fast)
poetry run pytest tests/unit/ --tb=no -q 2>&1 | tail -20
```

## Phase 3: Parallel Failure Analysis (If Tests Fail)

If tests fail, launch 3 agents to analyze:

```python
# PARALLEL - All three in ONE message!

Task(
  subagent_type="code-quality-reviewer",
  prompt="""BACKEND FAILURE ANALYSIS

  Test Results: [from /tmp/backend_test_results.log]

  For each failing test:
  1. What is the test trying to verify?
  2. What's the actual vs expected result?
  3. Root cause of failure
  4. Is this a test bug or code bug?
  5. Suggested fix

  Read the failing test files and the code they test.

  Output: Analysis with fix suggestions for each failure.""",
  run_in_background=true
)

Task(
  subagent_type="code-quality-reviewer",
  prompt="""FRONTEND FAILURE ANALYSIS

  Test Results: [from /tmp/frontend_test_results.log]

  For each failing test:
  1. Component/hook being tested
  2. What assertion failed?
  3. Is it a mock issue or real bug?
  4. React 19 compatibility check
  5. Suggested fix

  Output: Analysis with fix suggestions for each failure.""",
  run_in_background=true
)

Task(
  subagent_type="Explore",
  prompt="""COVERAGE GAP ANALYSIS

  Coverage Reports: [from test output]

  Identify:
  1. Files with <80% coverage
  2. Uncovered critical paths
  3. Missing edge case tests
  4. Functions without any tests

  Output: Priority list of coverage improvements needed.""",
  run_in_background=true
)
```

## Phase 4: Generate Test Report

```markdown
# Test Results Report
**Date**: [timestamp]
**Scope**: $ARGUMENTS

## Summary
| Suite | Total | Passed | Failed | Skipped | Coverage |
|-------|-------|--------|--------|---------|----------|
| Backend | X | Y | Z | W | XX% |
| Frontend | X | Y | Z | W | XX% |

## Status: [✅ ALL PASS | ⚠️ SOME FAILURES | ❌ CRITICAL FAILURES]

## Backend Results
```
[Output from backend tests - last 50 lines]
```

### Coverage by Module
| Module | Coverage | Status |
|--------|----------|--------|
| app/api/ | XX% | ✅/⚠️ |
| app/services/ | XX% | ✅/⚠️ |
| app/workflows/ | XX% | ✅/⚠️ |

### Failures (if any)
| Test | Error | Root Cause | Fix |
|------|-------|------------|-----|
| test_name | AssertionError | [analysis] | [suggestion] |

## Frontend Results
```
[Output from frontend tests - last 50 lines]
```

### Coverage by Feature
| Feature | Coverage | Status |
|---------|----------|--------|
| analysis/ | XX% | ✅/⚠️ |
| dashboard/ | XX% | ✅/⚠️ |
| shared/ | XX% | ✅/⚠️ |

### Failures (if any)
| Test | Error | Root Cause | Fix |
|------|-------|------------|-----|
| ComponentName.test | expect(...) | [analysis] | [suggestion] |

## Recommendations
1. [Priority fix 1]
2. [Priority fix 2]
3. [Coverage improvement]

## Evidence
- Backend log: /tmp/backend_test_results.log
- Frontend log: /tmp/frontend_test_results.log
```

## Phase 5: Quick Fix Mode (Optional)

If user wants to fix failures:

```python
Task(
  subagent_type="code-quality-reviewer",
  prompt="""AUTO-FIX TEST FAILURES

  Failures to fix: [from analysis]

  For each failure:
  1. Determine if test or code needs fixing
  2. Make minimal fix
  3. Verify fix doesn't break other tests

  Output: Summary of fixes applied."""
)
```

Then re-run tests to verify.

---

## Summary

**Parallel Execution:**
- Backend + Frontend tests run simultaneously
- 3 analysis agents if failures occur

**Test Commands Quick Reference:**

```bash
# All backend tests
cd backend && poetry run pytest tests/unit/ -v --tb=short

# Backend with coverage
poetry run pytest tests/unit/ --cov=app --cov-report=term-missing

# Quick backend (no tracebacks)
poetry run pytest tests/unit/ --tb=no -q

# Specific backend test
poetry run pytest tests/unit/ -k "test_name" -v

# All frontend tests
cd frontend && npm run test

# Frontend with coverage
npm run test -- --coverage

# Specific frontend test
npm run test -- --testPathPattern="ComponentName"

# Watch mode (frontend)
npm run test -- --watch
```

**Key Options:**
- `--maxfail=3` - Stop after 3 failures
- `-x` - Stop on first failure
- `--lf` - Run only last failed tests
- `-v` - Verbose output
- `--tb=short` - Shorter tracebacks
