# Multi-Instance Quality Gates

**Version:** 1.0.0  
**Last Updated:** 2026-01-08

## Overview

This system prevents "slop" when multiple Claude Code instances work on the same codebase by enforcing quality gates, detecting duplication, ensuring pattern consistency, and predicting merge conflicts.

## Problems Solved

### 1. Duplicate/Redundant Code
**Problem:** Different instances write similar implementations without knowing about each other.

**Solution:** `duplicate-code-detector.sh` scans for:
- Exact duplicate function/class names across worktrees
- Copy-pasted code blocks (3+ consecutive identical lines)
- Duplicated utility patterns that should be centralized
- Same functionality implemented multiple ways

**Action:** BLOCKS on critical duplicates (date formatters, validation logic), WARNS on potential duplicates.

### 2. Inconsistent Patterns
**Problem:** One instance uses pattern A, another uses pattern B for the same task.

**Solution:** `pattern-consistency-enforcer.sh` enforces:
- Backend: Clean architecture layers, async SQLAlchemy, Pydantic v2, tenant isolation
- Frontend: React 19 APIs, Zod validation, exhaustive types, skeleton loading, date utilities
- Testing: AAA pattern, MSW mocking, pytest fixtures
- All patterns defined in `.claude/context/knowledge/patterns/pattern-registry.json`

**Action:** BLOCKS on critical pattern violations, WARNS on drift.

### 3. Missing Tests
**Problem:** Code split across instances lacks test coverage.

**Solution:** `cross-instance-test-validator.sh` validates:
- Test files exist for implementations
- New functions/classes have corresponding tests
- Integration tests exist for cross-layer code
- Tests are coordinated when implementation spans worktrees

**Action:** BLOCKS on missing test files, WARNS on untested units.

### 4. Merge Conflicts
**Problem:** Overlapping work causes conflicts when merging.

**Solution:** `merge-conflict-predictor.sh` predicts:
- Concurrent modifications to same files in different worktrees
- Overlapping function/class changes
- Branch divergence from base
- API contract changes affecting other branches
- Import/export inconsistencies

**Action:** WARNS early so teams can coordinate.

## Hook Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Multi-Instance Quality Gate              │
│                  (Orchestrates all checks)                   │
└─────────────────────────────────────────────────────────────┘
                                │
                                ├─────────────────────────┐
                                │                         │
                                ▼                         ▼
┌───────────────────────────────────────┐  ┌──────────────────────────────┐
│   duplicate-code-detector.sh          │  │ pattern-consistency-enforcer │
│   - Exact duplicates                  │  │ - Backend patterns           │
│   - Copy-paste detection              │  │ - Frontend patterns          │
│   - Utility duplication               │  │ - Testing patterns           │
│   - Worktree conflicts                │  │ - Pattern registry           │
└───────────────────────────────────────┘  └──────────────────────────────┘
                                │                         │
                                └────────┬────────────────┘
                                         │
                                         ▼
┌───────────────────────────────────────────────────────────────┐
│              cross-instance-test-validator.sh                 │
│              - Test file existence                            │
│              - Unit coverage                                  │
│              - Integration tests                              │
│              - Cross-worktree coordination                    │
└───────────────────────────────────────────────────────────────┘
                                         │
                                         ▼
┌───────────────────────────────────────────────────────────────┐
│              merge-conflict-predictor.sh                      │
│              - Concurrent modifications                       │
│              - API contract changes                           │
│              - Import consistency                             │
│              - Branch divergence                              │
└───────────────────────────────────────────────────────────────┘
```

## Activation

### Automatic (Pre-Commit)

The `multi-instance-quality-gate.sh` hook runs automatically before **any git commit** and executes all quality gates on staged files.

```bash
git add .
git commit -m "feat: Add user authentication"
# Quality gates run automatically ↑
```

### Manual (Merge Readiness)

Before merging a worktree branch, run the comprehensive merge readiness checker:

```bash
# From your feature branch
.claude/hooks/skill/merge-readiness-checker.sh main

# Output shows:
# ✅ Passed checks
# ⚠️  Warnings
# ❌ Blockers
```

## Pattern Registry

All patterns are defined in `.claude/context/knowledge/patterns/pattern-registry.json`.

### Backend Patterns

```json
{
  "layer_separation": {
    "routers": "HTTP only",
    "services": "Business logic",
    "repositories": "Data access"
  },
  "async_database": "All DB ops use AsyncSession",
  "pydantic_v2": "Use @field_validator, @model_validator",
  "tenant_isolation": "All queries filter by tenant_id"
}
```

### Frontend Patterns

```json
{
  "react_19": "useOptimistic, useFormStatus, use()",
  "zod_validation": "All API responses use .parse()",
  "exhaustive_types": "assertNever in switch default",
  "skeleton_loading": "No spinners, use skeletons",
  "date_utilities": "import from @/lib/dates"
}
```

### Testing Patterns

```json
{
  "aaa_pattern": "Arrange-Act-Assert comments",
  "msw_mocking": "Use MSW, not jest.mock",
  "pytest_fixtures": "Use @pytest.fixture, not setUp",
  "coverage_threshold": "70% backend, 70% frontend"
}
```

## Worktree Workflow

### Setup

```bash
# Main repo
git clone https://github.com/org/repo.git
cd repo

# Create worktree for feature A
git worktree add ../repo-feature-a -b feature/user-auth

# Create worktree for feature B
git worktree add ../repo-feature-b -b feature/dashboard

# Now you have 3 directories:
# - repo/ (main branch)
# - repo-feature-a/ (feature/user-auth)
# - repo-feature-b/ (feature/dashboard)
```

### Development

Quality gates run in each worktree independently:

```bash
# In repo-feature-a/
git add src/auth/login.ts
git commit -m "feat: Add login"
# ↑ Quality gates check for:
# - Duplicates in main and repo-feature-b
# - Pattern consistency
# - Test coverage
# - Potential conflicts with repo-feature-b
```

### Merge

Before merging:

```bash
# In repo-feature-a/
.claude/hooks/skill/merge-readiness-checker.sh main

# If ready:
git checkout main
git merge feature/user-auth
```

## Configuration

### Enable/Disable Gates

Edit `.claude/hooks/_orchestration/chain-config.json`:

```json
{
  "chains": {
    "multi_instance_quality": {
      "enabled": true,  // Set to false to disable
      "sequence": [
        "duplicate-code-detector",
        "pattern-consistency-enforcer",
        "cross-instance-test-validator",
        "merge-conflict-predictor"
      ]
    }
  }
}
```

### Adjust Thresholds

Edit `.claude/context/knowledge/patterns/pattern-registry.json`:

```json
{
  "testing": {
    "coverage_threshold": {
      "backend": 70,      // Change to 80 for stricter
      "frontend": 70,     // Change to 60 for looser
      "critical_paths": 90
    }
  }
}
```

### Skip for Specific Commits

Use `--no-verify` to skip pre-commit hooks:

```bash
git commit -m "WIP: Draft implementation" --no-verify
```

**WARNING:** Only use for temporary work. All commits to main must pass gates.

## Slop Detection Heuristics

### Copy-Paste Detection

```bash
# Detects:
awk 'NR > 1 && $0 == prev { 
  count++
  if (count >= 3) print "DUPLICATE"
}'
```

3+ consecutive identical lines = copy-paste

### Utility Duplication

```bash
# Frontend: Check for patterns that should be centralized
- new Date().toLocaleDateString() → Use @/lib/dates
- fetch() → Use centralized API client
- .test() regex → Use Zod schemas

# Backend: Check for patterns that should be centralized
- json.loads() → Centralized JSON handling
- os.getenv() → Settings class
```

### Inconsistent Error Handling

```bash
# Check across files:
- Some use try/catch, some don't
- Different error types for same scenario
- Inconsistent logging patterns
```

### Unused Imports/Variables

```bash
# TypeScript: Use eslint
eslint --rule 'no-unused-vars: error'

# Python: Use ruff
ruff check --select F401,F841
```

## Integration with Existing Hooks

### Chain Configuration

Add to `.claude/hooks/_orchestration/chain-config.json`:

```json
{
  "chains": {
    "multi_instance_quality": {
      "description": "Quality gates for multi-instance development",
      "sequence": [
        "duplicate-code-detector",
        "pattern-consistency-enforcer",
        "cross-instance-test-validator",
        "merge-conflict-predictor"
      ],
      "pass_output_to_next": true,
      "stop_on_failure": true,
      "enabled": true
    }
  },
  "hook_metadata": {
    "duplicate-code-detector": {
      "timeout_seconds": 10,
      "retry_count": 0,
      "critical": true
    },
    "pattern-consistency-enforcer": {
      "timeout_seconds": 5,
      "retry_count": 0,
      "critical": true
    },
    "cross-instance-test-validator": {
      "timeout_seconds": 10,
      "retry_count": 0,
      "critical": true
    },
    "merge-conflict-predictor": {
      "timeout_seconds": 5,
      "retry_count": 0,
      "critical": false
    }
  }
}
```

### Execution

```bash
# Manual execution
echo '{"tool_name":"Write","tool_input":{"file_path":"/path/to/file.ts"}}' | \
  .claude/hooks/_orchestration/chain-executor.sh execute multi_instance_quality

# Automatic via pre-commit hook
# Already integrated in multi-instance-quality-gate.sh
```

## Performance

| Hook | Avg Time | Max Time | Blocking |
|------|----------|----------|----------|
| duplicate-code-detector | 200ms | 2s | Yes |
| pattern-consistency-enforcer | 100ms | 1s | Yes |
| cross-instance-test-validator | 150ms | 2s | Yes |
| merge-conflict-predictor | 300ms | 3s | No |
| **Total per file** | **750ms** | **8s** | - |

For 10 files: ~7.5s overhead per commit (acceptable).

## Troubleshooting

### False Positives

**Problem:** Hook flags valid code as duplicate.

**Solution:**
1. Check if code can be refactored into shared utility
2. If intentionally different, rename to be more specific
3. Add comment explaining why duplication is necessary

### Pattern Mismatch

**Problem:** Hook blocks pattern that should be allowed.

**Solution:**
1. Check `.claude/context/knowledge/patterns/pattern-registry.json`
2. Update pattern if codebase conventions changed
3. File issue if pattern is incorrect

### Slow Performance

**Problem:** Quality gates take too long.

**Solution:**
1. Check file size (gates run on entire file content)
2. Split large files into smaller modules
3. Adjust timeout in chain-config.json
4. Use `--no-verify` for WIP commits (but fix before final commit)

### Worktree Not Detected

**Problem:** Hooks don't see other worktrees.

**Solution:**
1. Verify worktrees: `git worktree list`
2. Check paths are correct (absolute paths)
3. Ensure all worktrees are in sibling directories

## Examples

### Example 1: Duplicate Detection

```typescript
// File: src/utils/dates-feature-a.ts (worktree A)
export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US');
}

// File: src/utils/dates-feature-b.ts (worktree B)
export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US');
}

// ❌ BLOCKED: Duplicate function 'formatDate'
// Action: Extract to shared @/lib/dates
```

### Example 2: Pattern Consistency

```typescript
// File: src/components/UserProfile.tsx (worktree A)
export const UserProfile: React.FC<Props> = (props) => { ... }

// ❌ BLOCKED: Using React.FC instead of explicit Props
// Fix: function UserProfile(props: Props): React.ReactNode
```

### Example 3: Missing Tests

```python
# File: backend/services/user_service.py (worktree A)
class UserService:
    async def get_user_by_id(self, user_id: int) -> User:
        ...
    
    async def create_user(self, data: UserCreate) -> User:
        ...

# ❌ BLOCKED: No test file found
# Expected: backend/tests/test_user_service.py
# Found 2 testable units: get_user_by_id, create_user
```

### Example 4: Merge Conflict Prediction

```typescript
// File: src/api/users.ts
// Worktree A: Modified lines 45-60
// Worktree B: Modified lines 50-65

// ⚠️  WARNING: Overlapping changes in branch feature/dashboard
// Both branches modify function getUserProfile()
// Coordinate changes before merging
```

## Best Practices

### 1. Coordinate Work Upfront
- Assign different features to different worktrees
- Avoid modifying same files in parallel
- Use pattern registry as single source of truth

### 2. Run Merge Readiness Early
```bash
# Check daily, not just before merge
.claude/hooks/skill/merge-readiness-checker.sh main
```

### 3. Keep Branches Short-Lived
- Merge within 2-3 days to avoid divergence
- Rebase frequently on main

### 4. Communicate API Changes
- If modifying exports/interfaces, notify other instances
- Use merge-conflict-predictor.sh to find affected code

### 5. Centralize Utilities Early
- Don't let duplicates accumulate
- Extract shared logic immediately when detected

## Metrics & Monitoring

Track quality gate effectiveness:

```bash
# Log to file
.claude/logs/multi-instance-gates.log

# Format:
[2026-01-08 10:30:00] BLOCKED: duplicate-code-detector - formatDate in 2 files
[2026-01-08 10:35:00] PASSED: All gates for src/auth/login.ts
[2026-01-08 10:40:00] WARNING: pattern-consistency-enforcer - React.FC usage
```

Analyze:
```bash
# Blocked commits
grep "BLOCKED" .claude/logs/multi-instance-gates.log | wc -l

# Most common violations
grep "BLOCKED" .claude/logs/multi-instance-gates.log | \
  awk '{print $4}' | sort | uniq -c | sort -rn
```

## Future Enhancements

1. **Real-time Coordination:** WebSocket notifications when another instance modifies same file
2. **Automated Refactoring:** Auto-extract duplicated code to shared utilities
3. **ML-based Similarity:** Detect semantic duplication, not just exact matches
4. **Visual Diff Tool:** Show overlapping changes in UI
5. **Merge Preview:** Simulate merge and show potential conflicts before commit

## Support

For issues or questions:
1. Check troubleshooting section above
2. Review `.claude/logs/multi-instance-gates.log`
3. File issue with log excerpt and reproduction steps

---

**Maintained by:** SkillForge Plugin Team  
**License:** MIT  
**Documentation Version:** 1.0.0
