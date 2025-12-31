# Code Quality Rules - SkillForge Frontend

**Version:** 1.0
**Enforcement:** Pre-commit hooks (errors block commits)
**AI Assistant:** Code Quality Reviewer agent for refactoring help

---

## 📏 Enforced Quality Rules

### File Length Limits

**Rule:** `max-lines: 180`

**Rationale:**

- Forces Single Responsibility Principle
- Easier code reviews (fits in one screen)
- Reduces cognitive load
- Industry best practice (Google, Airbnb style guides)

**When violated:**

```bash
✗ src/features/analysis/AnalyzeResult.tsx: File has 215 lines (max 180)
```

**Refactoring strategy:**

1. Extract nested components to `components/` subfolder
2. Move data fetching logic to custom hooks
3. Extract types to `types.ts`
4. Split large JSX blocks into separate components

---

### Function Complexity

**Rule:** `complexity: 15`

**Rationale:**

- Based on McCabe's Cyclomatic Complexity research
- Complexity > 15 increases bug likelihood exponentially
- Makes code harder to test and maintain
- Indicates need for decomposition

**When violated:**

```bash
✗ src/features/analysis/hooks/useAnalysisData.ts: Complexity 18 (max 15)
```

**Refactoring strategy:**

1. Break down complex conditionals
2. Extract helper functions
3. Use early returns to reduce nesting
4. Replace nested if/else with guard clauses
5. Use lookup tables instead of long switch statements

**Example refactoring:**

**Before (Complexity 18):**

```typescript
function processAnalysis(data: any) {
  if (data.status === 'pending') {
    if (data.type === 'article') {
      if (data.extractionComplete) {
        if (data.agentFindings.length > 0) {
          return 'ready'
        } else {
          return 'analyzing'
        }
      } else {
        return 'extracting'
      }
    } else if (data.type === 'video') {
      // more nested conditions...
    }
  } else if (data.status === 'complete') {
    // more conditions...
  }
}
```

**After (Complexity 8):**

```typescript
function processAnalysis(data: any) {
  if (data.status === 'complete') return 'complete'
  if (data.status !== 'pending') return 'unknown'

  return getProcessingState(data)
}

function getProcessingState(data: any) {
  if (!data.extractionComplete) return 'extracting'
  if (data.agentFindings.length === 0) return 'analyzing'
  return 'ready'
}
```

---

### Function Length

**Rule:** `max-lines-per-function: 50`

**Rationale:**

- Long functions are hard to understand and test
- Encourages functional decomposition
- Improves reusability

**When violated:**

```bash
✗ src/features/tutor/TutorSession.tsx: Function 'handleMessage' has 65 lines (max 50)
```

**Refactoring strategy:**

1. Extract validation logic
2. Extract API calls
3. Extract state updates
4. Extract error handling

---

### Nesting Depth

**Rule:** `max-depth: 4`

**Rationale:**

- Deep nesting is hard to follow
- Indicates complex logic
- Reduces readability

**When violated:**

```bash
✗ Nesting depth of 5 exceeds maximum (max 4)
```

**Refactoring strategy:**

1. Use early returns (guard clauses)
2. Extract nested blocks to functions
3. Use helper functions for conditionals
4. Flatten nested if/else chains

---

### Function Parameters

**Rule:** `max-params: 4`

**Rationale:**

- Too many parameters indicate poor abstraction
- Hard to remember parameter order
- Suggests need for object parameter

**When violated:**

```bash
✗ Function has 6 parameters (max 4)
```

**Refactoring strategy:**

Use object parameters:

**Before:**

```typescript
function createAnalysis(url: string, type: string, userId: string, apiKey: string, options: object) {}
```

**After:**

```typescript
interface CreateAnalysisParams {
  url: string
  type: string
  userId: string
  apiKey: string
  options?: object
}

function createAnalysis(params: CreateAnalysisParams) {}
```

---

## 🤖 AI-Assisted Refactoring

### When Pre-Commit Fails

**Step 1:** Pre-commit hook fails with error:

```bash
✗ src/features/analysis/AnalyzeResult.tsx: File has 215 lines (max 180)
✗ src/features/analysis/hooks/useAnalysisData.ts: Complexity 18 (max 15)
```

**Step 2:** Ask Code Quality Reviewer agent:

```
"Help me refactor src/features/analysis/AnalyzeResult.tsx"
```

**Step 3:** Agent analyzes and suggests:

- Which components to extract
- Where to place extracted code
- How to reduce complexity
- New file structure

**Step 4:** Apply suggestions and commit again

### AI Refactoring Prompts

**For file length violations:**

```
"Help me refactor [filename] - it exceeds 180 lines. Suggest component extractions."
```

**For complexity violations:**

```
"Reduce complexity of [function name] in [filename] - currently complexity 18, need < 15."
```

**For general code quality:**

```
"Review [filename] for code quality issues and suggest improvements."
```

---

## 📋 Import Ordering

**Rule:** `import/order`

**Enforced order:**

1. React (always first)
2. External packages (node_modules)
3. Internal aliases (`@/`, `@features/`, etc.)
4. Parent imports (`../`)
5. Sibling imports (`./`)
6. Index imports

**Example:**

```typescript
// 1. React
import { useState, useEffect } from 'react'

// 2. External packages
import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'

// 3. Internal aliases
import { Button } from '@shared/components/ui/Button'
import { useAppStore } from '@store/useAppStore'
import type { Analysis } from '@types/api'

// 4. Relative imports
import { useAnalysisData } from './hooks/useAnalysisData'
import ProgressTracker from './components/ProgressTracker'
```

**Auto-fix:** `npm run lint:fix` will automatically organize imports.

---

## 🚨 Console Usage

**Rule:** `no-console`

**Allowed:**

- `console.warn()` - for warnings
- `console.error()` - for errors

**Forbidden:**

- `console.log()` - use debugger or remove before commit
- `console.info()` - not allowed
- `console.debug()` - not allowed

**Why:** Production code should not have debug logs.

---

## ✅ Pre-Commit Quality Gates

**What runs on `git commit`:**

1. **ESLint** - all rules including complexity/length
2. **Biome** - code formatting
3. **Type check** - TypeScript compilation

**Result:**

- ✅ All checks pass → Commit succeeds
- ❌ Any check fails → Commit blocked with error message

**Override (NOT RECOMMENDED):**

```bash
git commit --no-verify  # Skips pre-commit hooks
```

**Only use** `--no-verify` for:

- Emergency hotfixes
- Work-in-progress commits on feature branches

---

## 🛠️ Quality Commands

```bash
# Check all quality rules
npm run quality:check

# Fix all auto-fixable issues
npm run quality:fix

# Check specific issues
npm run lint               # ESLint only
npm run format:check       # Biome format check
tsc --noEmit              # TypeScript type check
```

---

## 📊 Quality Metrics

**Target metrics:**

- File length: **100% compliance** (all files < 180 lines)
- Complexity: **100% compliance** (all functions < 15)
- Test coverage: **≥70%** (Sprint 2+)
- Type safety: **100%** (no `any` types without justification)

**Monitoring:**

- Pre-commit hooks enforce 100% compliance
- CI/CD pipeline runs quality checks on PRs
- No PR merges allowed with quality violations

---

## 🎯 Best Practices

### Component Design

**Good:**

```typescript
// 45 lines - under limit
export default function AnalyzeResult() {
  const data = useAnalysisData()
  return (
    <div>
      <ProgressTracker progress={data.progress} />
      <AgentFindings findings={data.findings} />
    </div>
  )
}
```

**Bad:**

```typescript
// 250 lines - exceeds limit, everything in one file
export default function AnalyzeResult() {
  // 200 lines of component logic, nested components, hooks, types...
}
```

### Hook Design

**Good:**

```typescript
// 35 lines - focused single responsibility
export function useAnalysisData(id: string) {
  return useQuery({
    queryKey: ['analysis', id],
    queryFn: () => api.getAnalysis(id),
  })
}
```

**Bad:**

```typescript
// 120 lines - too complex, mixed concerns
export function useAnalysisEverything() {
  // fetching, state management, side effects, calculations...
}
```

---

## 📖 Learning Resources

**Cyclomatic Complexity:**

- [McCabe's Complexity Metric](https://en.wikipedia.org/wiki/Cyclomatic_complexity)
- Research shows complexity > 15 dramatically increases bugs

**Clean Code Principles:**

- [Clean Code by Robert C. Martin](https://www.amazon.com/Clean-Code-Handbook-Software-Craftsmanship/dp/0132350882)
- Single Responsibility Principle
- Keep functions small and focused

**Style Guides:**

- [Google JavaScript Style Guide](https://google.github.io/styleguide/jsguide.html)
- [Airbnb React/JSX Style Guide](https://github.com/airbnb/javascript/tree/master/react)

---

## ❓ FAQ

**Q: Why 180 lines instead of 200 or 250?**

A: Based on research and industry practice. Files > 180 lines tend to have multiple responsibilities. This limit is stricter than many style guides (which allow 300-500), but results in more maintainable code.

**Q: What if I have a legitimate reason for a longer file?**

A: First, try to refactor. If truly necessary (e.g., large lookup tables, generated code), discuss with the team. We can add specific file exceptions to `.eslintrc` if justified.

**Q: Does this slow down development?**

A: Initially yes, but pays dividends in:

- Faster debugging (smaller, simpler code)
- Faster code reviews
- Fewer bugs
- Easier onboarding for new developers

**Q: Can I disable rules temporarily?**

A: For specific lines:

```typescript
// eslint-disable-next-line complexity
function complexLegacyCode() {
  // complex logic
}
```

But requires justification in code review.

---

**Remember:** These rules exist to help you write better code. When you hit a limit, it's a signal to refactor, not a punishment. Use the Code Quality Reviewer agent to help!
