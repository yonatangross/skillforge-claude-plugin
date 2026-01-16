---
name: atomic-commits
description: Create small, focused, revertable commits. Master git add -p for interactive staging and keep commits meaningful.
context: inherit
version: 1.0.0
author: SkillForge
tags: [git, commits, best-practices, version-control, atomic]
user-invocable: false
---

# Atomic Commits

An atomic commit is the smallest possible meaningful change. It does ONE thing and leaves the codebase in a working state.

## When to Use

- Before committing any changes
- When reviewing your own staged changes
- When commits feel "too big"
- When commit message needs "and"

## The Atomic Commit Checklist

```
[ ] Does ONE logical thing
[ ] Leaves codebase working (tests pass)
[ ] Message doesn't need "and" in title
[ ] Can be reverted independently
[ ] Title < 50 chars, body wraps at 72
```

## Quick Reference

### Interactive Staging (Key Technique)

```bash
# Stage changes hunk-by-hunk
git add -p

# Options when prompted:
# y - stage this hunk
# n - skip this hunk
# s - split into smaller hunks
# e - manually edit the hunk
# q - quit (staged hunks remain staged)

# Stage specific file interactively
git add -p src/auth/login.ts

# Review what's staged vs unstaged
git diff --staged    # What will be committed
git diff             # What won't be committed
```

### Commit Size Guidelines

```
ATOMIC (Good)                    MONOLITHIC (Bad)
-----------------------------------------
feat: Add User model             feat: Add auth system with
                                 tests, fix bug, update deps,
Files: 2                         and refactor utils
Lines: +45 -0
                                 Files: 47
                                 Lines: +2,341 -892
```

### Detecting Non-Atomic Commits

Your commit is NOT atomic if:
- Message title needs "and" or ","
- Message describes multiple effects
- Includes unrelated formatting changes
- Mixes feature code with test code
- Combines refactoring with new features

---

## Workflow: Breaking Up Work

### After Coding (Recommended)

```bash
# 1. See all changes
git status
git diff

# 2. Stage related changes only
git add -p

# 3. Commit one logical change
git commit -m "feat(#123): Add User model with validation"

# 4. Repeat for remaining changes
git add -p
git commit -m "test(#123): Add User model unit tests"

git add -p
git commit -m "docs(#123): Add User model API documentation"
```

### During Development (Advanced)

```bash
# Commit frequently as you go
# Each save point = potential commit

# Work on feature
# ... make changes ...
git add -p && git commit -m "feat: Add login form UI"

# ... make more changes ...
git add -p && git commit -m "feat: Add login validation"

# ... make more changes ...
git add -p && git commit -m "feat: Connect login to auth API"
```

---

## Common Patterns

### Separate Formatting from Logic

```bash
# BAD: One commit with both
git commit -m "feat: Add auth and fix formatting"

# GOOD: Two commits
git add -p  # Stage only formatting
git commit -m "style: Fix indentation in auth module"

git add -p  # Stage only logic
git commit -m "feat(#123): Add JWT token validation"
```

### Separate Refactoring from Features

```bash
# BAD: Refactor + feature together
git commit -m "feat: Add caching and refactor database layer"

# GOOD: Refactor first, then feature
git commit -m "refactor: Extract database connection pool"
git commit -m "feat(#456): Add query result caching"
```

### Separate Tests from Implementation

```bash
# Option A: Implementation first
git commit -m "feat(#789): Add password strength validator"
git commit -m "test(#789): Add password validator tests"

# Option B: Tests first (TDD)
git commit -m "test(#789): Add failing password validator tests"
git commit -m "feat(#789): Implement password strength validator"
```

---

## Recovery: Splitting Bad Commits

### Before Pushing

```bash
# Undo last commit, keep changes
git reset --soft HEAD~1

# Now re-commit atomically
git add -p
git commit -m "feat: First logical change"
git add -p
git commit -m "feat: Second logical change"
```

### After Pushing (Use with caution)

```bash
# Interactive rebase to split
git rebase -i HEAD~3

# Mark commit as 'edit'
# When stopped at commit:
git reset HEAD~1
git add -p && git commit -m "First part"
git add -p && git commit -m "Second part"
git rebase --continue

# Force push (only on feature branches!)
git push --force-with-lease
```

---

## Benefits of Atomic Commits

| Benefit | Why It Matters |
|---------|----------------|
| **Easy revert** | `git revert <sha>` undoes exactly one thing |
| **Better bisect** | `git bisect` finds bugs faster |
| **Clear history** | Future you understands what happened |
| **Easier review** | Reviewers can follow logic step-by-step |
| **AI-friendly** | AI tools understand focused changes better |
| **Conflict resolution** | Smaller changes = fewer conflicts |

---

## When to Deviate

Atomic commits are ideal, but some exceptions:

- **Initial project setup** - First commit can be larger
- **Emergency hotfix** - Speed over perfection
- **Generated code** - Migrations, lockfiles, etc.
- **Vendor updates** - Package-lock.json, etc.

Even then, try to keep commit messages clear about what's included.

---

## Tooling

### Git Config for Better Diffs

```bash
# Better diff algorithm
git config --global diff.algorithm histogram

# Show moved lines
git config --global diff.colorMoved zebra

# Ignore whitespace in diffs
git diff -w
```

### VS Code Integration

```json
// settings.json
{
  "git.enableSmartCommit": false,
  "git.suggestSmartCommit": false,
  "git.promptToSaveFilesBeforeCommit": "always"
}
```

---

## Best Practices Summary

1. **Stage interactively** - Always use `git add -p`
2. **One thing per commit** - If you say "and", split it
3. **Tests pass** - Never commit broken code
4. **Clear messages** - Subject < 50, body at 72
5. **Commit often** - Small and frequent beats large and rare
6. **Review before push** - `git log --oneline -10`

## Related Skills

- commit: Conventional commit format
- git-recovery: Fix commit mistakes
- branch-strategy: Commit workflow in branches

## References

- [Interactive Staging](references/interactive-staging.md)
- [Splitting Commits](references/splitting-commits.md)
