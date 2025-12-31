---
description: Comprehensive feature verification with highest standards
---

# Verify Feature Branch

Complete verification using subagents, skills, MCPs, and latest best practices.

## Step 1: Analyze Scope

```bash
# What changed?
git diff --name-only dev...HEAD
git log --oneline dev..HEAD
```

Identify:
- Libraries used (React, FastAPI, LangGraph, etc.)
- Patterns implemented (API, hooks, workflows)
- Complexity (files changed, lines added)

Create task list with TodoWrite for tracking.

## Step 2: Fetch Latest Best Practices (Today's Date)

### 2a. Web Search for Current Standards

Search for today's best practices (use current date in queries):

```python
# Get today's best practices - not outdated docs!
WebSearch("React 19 best practices December 2025")
WebSearch("FastAPI security patterns 2025")
WebSearch("LangGraph 1.0 state management 2025")
WebSearch("TypeScript 5.7 strict mode patterns 2025")

# Check for recent security issues
WebSearch("Python CVE security vulnerabilities December 2025")
WebSearch("npm security advisories December 2025")
```

### 2b. Context7 for Library Documentation

```python
# React
mcp__context7__resolve-library-id(libraryName="react")
mcp__context7__get-library-docs(context7CompatibleLibraryID="/vercel/react", topic="hooks")

# FastAPI
mcp__context7__resolve-library-id(libraryName="fastapi")
mcp__context7__get-library-docs(context7CompatibleLibraryID="/tiangolo/fastapi", topic="dependencies")

# LangGraph
mcp__context7__resolve-library-id(libraryName="langgraph")
mcp__context7__get-library-docs(context7CompatibleLibraryID="/langchain-ai/langgraph", topic="state")
```

## Step 3: Load Project Coding Standards

Read your standards:
- `.claude/instructions/backend-code-quality-rules.md`
- `.claude/instructions/code-quality-rules.md`
- `CLAUDE.md`

## Step 4: Load Review Skills (Progressive)

```python
# Load only what's needed from each skill
Read(".claude/skills/code-review-playbook/capabilities.json")
Read(".claude/skills/code-review-playbook/checklists/code-review-checklist.md")

Read(".claude/skills/security-checklist/capabilities.json")
Read(".claude/skills/security-checklist/checklists/owasp-top-10-checklist.md")

Read(".claude/skills/testing-strategy-builder/capabilities.json")
Read(".claude/skills/testing-strategy-builder/checklists/test-coverage-checklist.md")

Read(".claude/skills/type-safety-validation/capabilities.json")
Read(".claude/skills/performance-optimization/capabilities.json")
```

## Step 5: Parallel Code Review (3 Subagents)

Launch THREE reviewers simultaneously in ONE message:

```python
# PARALLEL - All three in single message!

Task(
  subagent_type="code-quality-reviewer",
  prompt="""BACKEND CODE REVIEW

  Context: [Include web search results + context7 FastAPI docs]

  Review all backend changes (git diff dev...HEAD -- backend/):

  CHECK AGAINST PROJECT STANDARDS:
  - Ruff format + lint compliance
  - ty type checking passes
  - No bare exceptions (use specific types)
  - Timeout architecture followed
  - Proper error handling patterns

  CHECK AGAINST 2025 BEST PRACTICES:
  - FastAPI dependency injection patterns
  - Pydantic v2 validation
  - Async/await usage
  - API design conventions

  RUN AND REPORT:
  - poetry run ruff format --check app/
  - poetry run ruff check app/
  - poetry run ty check app/ --exclude "app/evaluation/*"

  ANALYZE TEST COVERAGE:
  - poetry run pytest tests/unit/ --cov=app --cov-report=term-missing

  Report findings with conventional comments format.""",
  run_in_background=true
)

Task(
  subagent_type="code-quality-reviewer",
  prompt="""FRONTEND CODE REVIEW

  Context: [Include web search results + context7 React 19 docs]

  Review all frontend changes (git diff dev...HEAD -- frontend/):

  CHECK AGAINST PROJECT STANDARDS:
  - Biome formatting compliance
  - ESLint rules pass
  - TypeScript strict mode (no 'any')
  - Zod validation at boundaries

  CHECK AGAINST REACT 19 BEST PRACTICES (Dec 2025):
  - Using use() instead of useEffect for data fetching
  - Proper Suspense boundaries
  - Server Components where applicable
  - useOptimistic for optimistic updates
  - Proper hook dependencies

  RUN AND REPORT:
  - npm run format:check
  - npm run lint
  - npm run typecheck

  CHECK ACCESSIBILITY:
  - ARIA labels present
  - Keyboard navigation works
  - Color contrast sufficient

  Report findings with conventional comments format.""",
  run_in_background=true
)

Task(
  subagent_type="code-quality-reviewer",
  prompt="""SECURITY AUDIT

  Context: [Include CVE search results]

  Audit all changes for security issues:

  SECRETS SCAN:
  - No hardcoded API keys, passwords, tokens
  - No .env files committed
  - No credentials in comments

  OWASP TOP 10 CHECK:
  - SQL injection (parameterized queries?)
  - XSS (output encoding?)
  - CSRF (tokens present?)
  - Broken authentication
  - Sensitive data exposure
  - Security misconfiguration

  DEPENDENCY AUDIT:
  - cd backend && pip-audit
  - cd frontend && npm audit

  AUTH FLOW REVIEW:
  - JWT handling secure?
  - Session management proper?
  - Rate limiting in place?

  Report ALL findings, even low severity.""",
  run_in_background=true
)
```

Wait for all three to complete, then collect results.

## Step 6: Run Full Test Suite

```bash
# Backend - with coverage enforcement
cd backend
poetry run pytest tests/unit/ -v --tb=short \
  --cov=app --cov-report=term-missing \
  --cov-fail-under=80 \
  2>&1 | tee /tmp/backend_test_results.log

# Frontend - with coverage
cd frontend
npm run test -- --coverage 2>&1 | tee /tmp/frontend_test_results.log
```

Collect evidence: exit codes, coverage percentages, failure details.

## Step 7: E2E Verification (If UI Changes)

Use Playwright MCP for visual verification:

```python
# Start browser and navigate
mcp__playwright__browser_navigate(url="http://localhost:5173")
mcp__playwright__browser_snapshot()  # Get accessibility tree

# Test critical user flows
mcp__playwright__browser_click(element="Submit button", ref="...")
mcp__playwright__browser_wait_for(text="Success")

# Capture evidence
mcp__playwright__browser_take_screenshot(filename="e2e-verification.png")
```

## Step 8: Generate Verification Report

Create comprehensive report:

```markdown
# Feature Verification Report
**Date**: [TODAY'S DATE]
**Branch**: [branch-name]
**Reviewer**: Claude Code with subagents

## Summary
[✅ READY FOR MERGE | ⚠️ NEEDS ATTENTION | ❌ BLOCKED]

## Code Quality
| Check | Status | Details |
|-------|--------|---------|
| Backend Lint (Ruff) | ✅/❌ | [errors] |
| Backend Types (ty) | ✅/❌ | [errors] |
| Frontend Format (Biome) | ✅/❌ | [errors] |
| Frontend Lint (ESLint) | ✅/❌ | [errors] |
| Frontend Types (tsc) | ✅/❌ | [errors] |

## Test Results
| Suite | Passed | Failed | Coverage |
|-------|--------|--------|----------|
| Backend Unit | X | Y | Z% |
| Frontend Unit | X | Y | Z% |
| E2E | X | Y | N/A |

## Security
| Check | Status | Issues |
|-------|--------|--------|
| Secrets Scan | ✅/❌ | [count] |
| npm audit | ✅/❌ | [high/critical] |
| pip-audit | ✅/❌ | [vulnerabilities] |
| OWASP Top 10 | ✅/❌ | [issues] |

## Best Practices Compliance (Dec 2025)
| Library | Status | Notes |
|---------|--------|-------|
| React 19 | ✅/⚠️ | [compliance notes] |
| FastAPI | ✅/⚠️ | [compliance notes] |
| LangGraph | ✅/⚠️ | [compliance notes] |
| TypeScript | ✅/⚠️ | [compliance notes] |

## Suggestions (Non-Blocking)
- [suggestion 1]
- [suggestion 2]

## Blockers (Must Fix)
- [blocker 1 if any]

## Evidence
- Backend tests: /tmp/backend_test_results.log
- Frontend tests: /tmp/frontend_test_results.log
- E2E screenshot: e2e-verification.png
```

## Step 9: Save Context

Save findings to memory for future reference:
```python
mcp__memory__create_entities(entities=[{
  "name": "verification-[date]-[branch]",
  "entityType": "verification-report",
  "observations": ["summary of findings"]
}])
```

---

## Quick Usage

```bash
/verify                    # Verify current branch
/verify issue/123-feature  # Verify specific branch
```

**This command uses:**
- 📚 context7 MCP (library documentation)
- 🔍 WebSearch (today's best practices)
- 🤖 3 parallel subagents (backend, frontend, security)
- 📖 Skills (code-review, security, testing)
- 🎭 Playwright MCP (E2E verification)
- 📝 Evidence collection (logs, screenshots)
