---
description: Comprehensive PR review with parallel code quality agents
---

# Review PR: $ARGUMENTS

Deep code review using 6-8 parallel specialized agents.

## Phase 1: Gather PR Information

```bash
# Get PR details
gh pr view $ARGUMENTS --json title,body,files,additions,deletions,commits,author

# View the diff
gh pr diff $ARGUMENTS

# Check CI status
gh pr checks $ARGUMENTS
```

Identify:
- Total files changed
- Lines added/removed
- Affected domains (frontend, backend, AI)

## Phase 2: Load Review Skills & Standards

```python
# PARALLEL - Load capabilities first
Read(".claude/skills/code-review-playbook/capabilities.json")
Read(".claude/skills/security-checklist/capabilities.json")
Read(".claude/skills/testing-strategy-builder/capabilities.json")
Read(".claude/skills/type-safety-validation/capabilities.json")

# Load project standards
Read(".claude/instructions/code-quality-rules.md")
Read(".claude/instructions/backend-code-quality-rules.md")
```

## Phase 3: Context7 for Latest Patterns

```python
# PARALLEL - Get current best practices for changed files
mcp__context7__get-library-docs(context7CompatibleLibraryID="/facebook/react", topic="hooks")
mcp__context7__get-library-docs(context7CompatibleLibraryID="/tiangolo/fastapi", topic="best-practices")
```

## Phase 4: Parallel Code Review (6 Agents)

Launch SIX specialized reviewers - ALL in ONE message:

```python
# PARALLEL - All six in ONE message!

Task(
  subagent_type="code-quality-reviewer",
  prompt="""CODE QUALITY REVIEW

  PR #$ARGUMENTS

  Review for code quality:
  1. Code readability and clarity
  2. Function/method complexity (no God functions)
  3. Variable naming conventions
  4. Code duplication (DRY violations)
  5. Error handling patterns
  6. Comments and documentation

  Use conventional comments format:
  - praise: [positive feedback]
  - nitpick: [minor suggestion]
  - suggestion: [improvement idea]
  - issue: [must fix]
  - question: [needs clarification]

  Output: Structured review with line-specific comments.""",
  run_in_background=true
)

Task(
  subagent_type="code-quality-reviewer",
  prompt="""TYPE SAFETY REVIEW

  PR #$ARGUMENTS

  Review type safety:

  TYPESCRIPT (Frontend):
  - No 'any' types
  - Proper generics usage
  - Zod schema validation at boundaries
  - Proper null/undefined handling
  - Exhaustive type checking

  PYTHON (Backend):
  - Type hints on all functions
  - Pydantic models for data
  - No typing.Any without justification
  - Proper Optional usage

  Run checks:
  - cd frontend && npm run typecheck
  - cd backend && poetry run ty check app/

  Output: Type issues with fix suggestions.""",
  run_in_background=true
)

Task(
  subagent_type="code-quality-reviewer",
  prompt="""SECURITY REVIEW

  PR #$ARGUMENTS

  CRITICAL SECURITY CHECKS:
  1. No hardcoded secrets (API keys, passwords)
  2. No credentials in comments
  3. Proper input validation
  4. SQL injection prevention (parameterized queries)
  5. XSS prevention (output encoding)
  6. CSRF protection
  7. Proper authentication/authorization

  DEPENDENCY SCAN:
  - cd backend && pip-audit
  - cd frontend && npm audit

  SECRETS SCAN:
  - Search for API keys, tokens, passwords
  - Check .gitignore for sensitive files

  Output: Security findings with severity levels.""",
  run_in_background=true
)

Task(
  subagent_type="code-quality-reviewer",
  prompt="""TEST COVERAGE REVIEW

  PR #$ARGUMENTS

  Review test quality:
  1. Are new functions tested?
  2. Are edge cases covered?
  3. Test naming conventions
  4. Mock usage (appropriate vs excessive)
  5. Integration test coverage

  Run coverage analysis:
  - cd backend && poetry run pytest tests/unit/ --cov=app --cov-report=term-missing
  - cd frontend && npm test -- --coverage

  Check:
  - Coverage % before vs after PR
  - Untested new code paths
  - Test quality (not just quantity)

  Output: Coverage report with gaps identified.""",
  run_in_background=true
)

Task(
  subagent_type="backend-system-architect",
  prompt="""BACKEND ARCHITECTURE REVIEW

  PR #$ARGUMENTS

  Review backend changes for:
  1. API design (REST conventions)
  2. Service layer structure
  3. Database query efficiency
  4. Async/await correctness
  5. Error handling patterns
  6. Dependency injection

  Check standards:
  - No bare exceptions
  - Proper timeout handling
  - Logging for debugging
  - Transaction boundaries

  Output: Architecture feedback.""",
  run_in_background=true
)

Task(
  subagent_type="frontend-ui-developer",
  prompt="""FRONTEND REVIEW

  PR #$ARGUMENTS

  Review frontend changes for:
  1. React 19 patterns (use(), useOptimistic)
  2. Component composition
  3. State management
  4. Hook dependencies (no stale closures)
  5. Performance (memo, useMemo, useCallback)
  6. Accessibility (ARIA, keyboard nav)

  Check:
  - No useEffect for data fetching (use use())
  - Proper Suspense boundaries
  - TypeScript strict compliance

  Output: Frontend-specific feedback.""",
  run_in_background=true
)
```

**Wait for all 6 to complete.**

## Phase 5: AI Code Review (If AI Changes)

If PR includes AI/ML code:

```python
Task(
  subagent_type="ai-ml-engineer",
  prompt="""AI/ML CODE REVIEW

  PR #$ARGUMENTS

  If AI code present, review:
  1. Prompt engineering quality
  2. LangGraph workflow correctness
  3. Token usage optimization
  4. Caching strategy
  5. Error handling for API failures
  6. Cost implications

  Check:
  - Prompt templates versioned
  - Streaming handled correctly
  - Fallback strategies present

  Output: AI-specific recommendations."""
)
```

## Phase 6: Run All Checks

```bash
# Backend validation
cd backend
poetry run ruff format --check app/
poetry run ruff check app/
poetry run ty check app/ --exclude "app/evaluation/*"
poetry run pytest tests/unit/ -v --tb=short 2>&1 | tee /tmp/pr_backend_tests.log

# Frontend validation
cd frontend
npm run format:check
npm run lint
npm run typecheck
npm run test 2>&1 | tee /tmp/pr_frontend_tests.log
```

## Phase 7: Synthesize Review

Combine all agent feedback into structured report:

```markdown
# PR Review: #$ARGUMENTS
**Title**: [PR Title]
**Author**: [Author]
**Files Changed**: X | **Lines**: +Y / -Z

## Summary
[1-2 sentence overview of changes]

## ✅ Strengths
- [What's done well - from praise comments]
- [Good patterns observed]

## 🔍 Code Quality
| Area | Status | Notes |
|------|--------|-------|
| Readability | ✅/⚠️/❌ | [notes] |
| Type Safety | ✅/⚠️/❌ | [notes] |
| Test Coverage | ✅/⚠️/❌ | [X% coverage] |
| Error Handling | ✅/⚠️/❌ | [notes] |

## 🔒 Security
| Check | Status | Issues |
|-------|--------|--------|
| Secrets Scan | ✅/❌ | [count] |
| Input Validation | ✅/❌ | [issues] |
| Dependencies | ✅/❌ | [vulnerabilities] |

## ⚠️ Suggestions (Non-Blocking)
- [suggestion 1 with file:line reference]
- [suggestion 2]

## 🔴 Blockers (Must Fix Before Merge)
- [blocker 1 if any]
- [blocker 2 if any]

## 📋 CI Status
- Backend Lint: ✅/❌
- Backend Types: ✅/❌
- Backend Tests: ✅/❌
- Frontend Format: ✅/❌
- Frontend Lint: ✅/❌
- Frontend Types: ✅/❌
- Frontend Tests: ✅/❌
```

## Phase 8: Submit Review

```bash
# If approved
gh pr review $ARGUMENTS --approve -b "$(cat <<'EOF'
## ✅ Approved

Great work! Code quality is solid, tests pass, and security looks good.

### Highlights
- [specific positive feedback]

### Minor Suggestions (Non-Blocking)
- [optional improvements]

🤖 Reviewed with Claude Code (6 parallel agents)
EOF
)"

# If changes needed
gh pr review $ARGUMENTS --request-changes -b "$(cat <<'EOF'
## 🔄 Changes Requested

Good progress, but a few items need addressing before merge.

### Must Fix
1. [blocker 1]
2. [blocker 2]

### Suggestions
- [optional improvements]

🤖 Reviewed with Claude Code (6 parallel agents)
EOF
)"
```

---

## Summary

**Total Parallel Agents: 6-7**
- 4 code-quality-reviewers (quality, types, security, tests)
- 1 backend-system-architect
- 1 frontend-ui-developer
- 1 ai-ml-engineer (conditional)

**Skills Used:**
- code-review-playbook
- security-checklist
- testing-strategy-builder
- type-safety-validation

**MCPs Used:**
- 📚 context7 (current best practices)

**Output:**
- Comprehensive structured review
- Line-specific comments
- CI validation results
- Approve/Request Changes action
