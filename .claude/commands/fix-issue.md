---
description: Fix GitHub issue with parallel analysis and implementation
---

# Fix Issue: #$ARGUMENTS

Systematic issue resolution with 5-7 parallel agents.

## Phase 1: Understand the Issue

```bash
# Get full issue details
gh issue view $ARGUMENTS --json title,body,labels,assignees,comments

# Check related PRs
gh pr list --search "issue:$ARGUMENTS"

# Check if branch exists
git branch -a | grep -i "$ARGUMENTS"
```

## Phase 2: Create Feature Branch

```bash
# Ensure we're on dev and up to date
git checkout dev
git pull origin dev

# Create feature branch
git checkout -b issue/$ARGUMENTS-fix
```

## Phase 3: Memory Check - Previous Context

```python
# Check if this issue was discussed before
mcp__memory__search_nodes(query="issue $ARGUMENTS")
mcp__memory__search_nodes(query="[keywords from issue]")
```

## Phase 4: Parallel Analysis (5 Agents)

Launch FIVE agents to analyze the issue from different angles:

```python
# PARALLEL - All five in ONE message!

Task(
  subagent_type="Explore",
  prompt="""ROOT CAUSE ANALYSIS

  Issue #$ARGUMENTS: [issue title/description]

  Find the root cause:
  1. Search codebase for related code
  2. Trace the code path that causes the issue
  3. Identify affected files
  4. Understand the current behavior
  5. Determine what should happen instead

  Use:
  - Grep for error messages
  - Glob for related files
  - Read to understand context

  Output: Root cause with specific file:line references.""",
  run_in_background=true
)

Task(
  subagent_type="Explore",
  prompt="""IMPACT ANALYSIS

  Issue #$ARGUMENTS

  Analyze impact:
  1. What other code depends on the affected code?
  2. What tests currently cover this area?
  3. Are there related issues or PRs?
  4. What could break if we change this?
  5. Database migrations needed?

  Output: Impact assessment with risk level.""",
  run_in_background=true
)

Task(
  subagent_type="backend-system-architect",
  prompt="""BACKEND FIX DESIGN (if applicable)

  Issue #$ARGUMENTS

  If this is a backend issue:
  1. Analyze the service/API affected
  2. Design the fix approach
  3. Identify edge cases
  4. Plan error handling
  5. Outline tests needed

  Standards:
  - No bare exceptions
  - Proper typing
  - Timeout handling

  Output: Backend fix specification or "N/A - not backend".""",
  run_in_background=true
)

Task(
  subagent_type="frontend-ui-developer",
  prompt="""FRONTEND FIX DESIGN (if applicable)

  Issue #$ARGUMENTS

  If this is a frontend issue:
  1. Analyze the component affected
  2. Design the fix approach
  3. State management implications
  4. UI/UX considerations
  5. Outline tests needed

  React 19 patterns:
  - Proper hook usage
  - TypeScript strict
  - Accessibility

  Output: Frontend fix specification or "N/A - not frontend".""",
  run_in_background=true
)

Task(
  subagent_type="code-quality-reviewer",
  prompt="""TEST REQUIREMENTS

  Issue #$ARGUMENTS

  Define test requirements:
  1. What existing tests need updating?
  2. What new tests are needed?
  3. Edge cases to cover
  4. Integration test needs
  5. How to verify the fix works

  Output: Test specification with examples.""",
  run_in_background=true
)
```

**Wait for all 5 to complete, then synthesize fix plan.**

## Phase 5: Context7 for Patterns

```python
# Get current best practices for the fix
mcp__context7__get-library-docs(context7CompatibleLibraryID="/tiangolo/fastapi", topic="[relevant topic]")
mcp__context7__get-library-docs(context7CompatibleLibraryID="/facebook/react", topic="[relevant topic]")
```

## Phase 6: Implement the Fix (2 Parallel Agents)

```python
# PARALLEL - Both in ONE message!

Task(
  subagent_type="backend-system-architect",  # or frontend-ui-developer
  prompt="""IMPLEMENT FIX

  Based on analysis, implement the fix:

  Root Cause: [from analysis]
  Files to Modify: [from analysis]
  Approach: [from design]

  REQUIREMENTS:
  - Make minimal, focused changes
  - Add proper error handling
  - Include type hints
  - Write inline comments for complex logic

  DO NOT over-engineer. Fix the issue, nothing more.""",
  run_in_background=true
)

Task(
  subagent_type="code-quality-reviewer",
  prompt="""IMPLEMENT TESTS

  Write tests for the fix:

  Test Specification: [from analysis]
  Files to Test: [from analysis]

  Create:
  1. Unit tests for the fix
  2. Edge case tests
  3. Regression tests

  Location:
  - Backend: backend/tests/unit/
  - Frontend: frontend/src/**/__tests__/

  Target: 100% coverage of new/changed code.""",
  run_in_background=true
)
```

## Phase 7: Validation

```bash
# Run all checks
cd backend
poetry run ruff format --check app/
poetry run ruff check app/
poetry run ty check app/ --exclude "app/evaluation/*"
poetry run pytest tests/unit/ -v --tb=short 2>&1 | tee /tmp/fix_tests.log

cd frontend
npm run format:check
npm run lint
npm run typecheck
npm run test 2>&1 | tee /tmp/fix_frontend_tests.log
```

## Phase 8: Commit and PR

```bash
# Stage changes
git add .

# Commit with issue reference
git commit -m "$(cat <<'EOF'
fix(#$ARGUMENTS): [Brief description of fix]

- [Change 1]
- [Change 2]
- [Tests added/updated]

Root cause: [Brief explanation]

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"

# Push and create PR
git push -u origin issue/$ARGUMENTS-fix

gh pr create --base dev --title "fix(#$ARGUMENTS): [Brief description]" --body "$(cat <<'EOF'
## Summary
Fixes #$ARGUMENTS

## Root Cause
[Explanation of what caused the issue]

## Solution
[How the fix addresses the root cause]

## Changes
- [File 1]: [What changed]
- [File 2]: [What changed]

## Tests
- [x] Unit tests added
- [x] Edge cases covered
- [x] All tests pass

## Verification
- [ ] Manually tested the fix
- [ ] No regression in related functionality

---
🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

## Phase 9: Save Context

```python
mcp__memory__create_entities(entities=[{
  "name": "issue-$ARGUMENTS-fix",
  "entityType": "bug-fix",
  "observations": [
    "Issue: [title]",
    "Root cause: [explanation]",
    "Fix: [approach]",
    "PR: [number]"
  ]
}])
```

---

## Summary

**Total Parallel Agents: 7**
- Phase 4 (Analysis): 5 agents
- Phase 6 (Implementation): 2 agents

**Agents Used:**
- 2 Explore (root cause, impact)
- 1 backend-system-architect
- 1 frontend-ui-developer
- 2 code-quality-reviewer

**MCPs Used:**
- 💾 memory (previous context)
- 📚 context7 (best practices)

**Workflow:**
1. Understand issue
2. Create branch
3. Parallel analysis
4. Design fix
5. Implement + test
6. Validate
7. PR with issue reference
