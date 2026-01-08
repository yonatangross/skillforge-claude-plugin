# Multi-Instance Quality Gates - Quick Reference

## 🚀 Quick Start

```bash
# Automatic: Hooks run on every commit
git add .
git commit -m "Your message"
# ↑ Quality gates run automatically

# Manual: Check before merge
.claude/hooks/skill/merge-readiness-checker.sh main
```

## 🔍 What Gets Checked

| Gate | What It Checks | Blocking? |
|------|----------------|-----------|
| **Duplicate Code** | Exact duplicates, copy-paste, utility duplication | ✅ Yes |
| **Pattern Consistency** | Backend/frontend/test patterns from registry | ✅ Yes |
| **Test Coverage** | Test files exist, units tested, integration tests | ✅ Yes |
| **Merge Conflicts** | Concurrent mods, API changes, branch divergence | ⚠️  Warns |

## 📋 Common Failures & Fixes

### ❌ "BLOCKED: Duplicate function 'formatDate'"

**Problem:** Same function exists in multiple places

**Fix:**
```typescript
// Move to shared location
// ✅ Good: src/lib/dates.ts
export function formatDate(date: Date): string { ... }

// Import everywhere
import { formatDate } from '@/lib/dates';
```

### ❌ "BLOCKED: Using React.FC instead of explicit Props"

**Problem:** Wrong React pattern

**Fix:**
```typescript
// ❌ Bad
export const Component: React.FC<Props> = (props) => { ... }

// ✅ Good
export function Component(props: Props): React.ReactNode { ... }
```

### ❌ "BLOCKED: API call without Zod validation"

**Problem:** Missing runtime validation

**Fix:**
```typescript
// ❌ Bad
const data = await response.json();

// ✅ Good
import { z } from 'zod';
const ResponseSchema = z.object({ id: z.number(), name: z.string() });
const data = ResponseSchema.parse(await response.json());
```

### ❌ "BLOCKED: No test file found"

**Problem:** Missing tests

**Fix:**
```typescript
// Implementation: src/utils/auth.ts
export function validateToken(token: string): boolean { ... }

// Create test: src/utils/auth.test.ts
import { validateToken } from './auth';
test('should validate token', () => { ... });
```

### ⚠️  "WARNING: Concurrent modifications in branch feature/dashboard"

**Problem:** Same file modified in multiple worktrees

**Fix:**
1. Coordinate with other instance
2. Split work to different files
3. Merge one branch first, then rebase other

## 🎯 Pattern Registry Cheat Sheet

### Backend

```python
# ✅ Layer separation
routers/ → services/ → repositories/ → models/

# ✅ Async database
from sqlalchemy.ext.asyncio import AsyncSession

# ✅ Pydantic v2
@field_validator('email')
@model_validator(mode='after')

# ✅ Tenant isolation
.where(Model.tenant_id == tenant_id)
```

### Frontend

```typescript
// ✅ React 19
function Component(props: Props): React.ReactNode
useOptimistic() // for mutations
useFormStatus() // for forms
use() // for suspense

// ✅ Zod validation
const data = ResponseSchema.parse(await response.json());

// ✅ Exhaustive types
default: return assertNever(value);

// ✅ Date formatting
import { formatDate } from '@/lib/dates';

// ✅ Skeleton loading
<ComponentSkeleton /> // not <Spinner />
```

### Testing

```typescript
// ✅ AAA pattern
// Arrange
const user = { id: 1, name: 'Test' };
// Act
const result = getUserName(user);
// Assert
expect(result).toBe('Test');

// ✅ MSW mocking
import { http, HttpResponse } from 'msw';
// NOT jest.mock('fetch')

// ✅ Pytest fixtures
@pytest.fixture
def user_data():
    return {"id": 1, "name": "Test"}
```

## 🛠️ Commands

```bash
# Check single file
export TOOL_INPUT_FILE_PATH="/path/to/file.ts"
export TOOL_OUTPUT_CONTENT="$(cat file.ts)"
.claude/hooks/skill/duplicate-code-detector.sh

# Check all staged files (automatic)
git commit -m "Message"

# Merge readiness (manual)
.claude/hooks/skill/merge-readiness-checker.sh main

# Skip hooks (emergency only)
git commit -m "WIP" --no-verify

# View hook logs
tail -f .claude/logs/multi-instance-gates.log
```

## 🌳 Worktree Setup

```bash
# Create worktrees
git worktree add ../repo-feature-a -b feature/auth
git worktree add ../repo-feature-b -b feature/dashboard

# List worktrees
git worktree list

# Quality gates automatically check all worktrees
```

## ⚙️ Configuration

### Disable/Enable

```json
// .claude/hooks/_orchestration/chain-config.json
{
  "chains": {
    "multi_instance_quality": {
      "enabled": false  // Set to true to enable
    }
  }
}
```

### Adjust Patterns

```json
// .claude/context/knowledge/patterns/pattern-registry.json
{
  "testing": {
    "coverage_threshold": {
      "backend": 70,   // Change thresholds here
      "frontend": 70
    }
  }
}
```

## 📊 Exit Codes

| Code | Meaning | Action |
|------|---------|--------|
| 0 | All checks passed | Commit allowed |
| 1 | Blocking failure | Fix errors, retry |
| 2 | Warning only | Review, then commit |

## 🆘 Emergency Override

```bash
# ONLY use for temporary work
git commit -m "WIP: Draft" --no-verify

# Before pushing to main, ensure all gates pass:
git add .
git commit --amend --no-edit
# ↑ This time WITHOUT --no-verify
```

## 📈 Performance

- **Per file:** ~750ms
- **10 files:** ~7.5s
- **Impact:** Minimal, runs in background

## 🔗 Resources

- Full documentation: `.claude/docs/MULTI_INSTANCE_QUALITY_GATES.md`
- Pattern registry: `.claude/context/knowledge/patterns/pattern-registry.json`
- Hook logs: `.claude/logs/multi-instance-gates.log`

## 💡 Tips

1. **Run merge-readiness-checker daily** - Don't wait until merge time
2. **Keep branches short-lived** - Merge within 2-3 days
3. **Centralize utilities immediately** - Don't accumulate duplicates
4. **Communicate API changes** - Notify other instances before modifying exports
5. **Check logs regularly** - `tail -f .claude/logs/multi-instance-gates.log`

---

**Need help?** Check `.claude/docs/MULTI_INSTANCE_QUALITY_GATES.md` for detailed troubleshooting.
