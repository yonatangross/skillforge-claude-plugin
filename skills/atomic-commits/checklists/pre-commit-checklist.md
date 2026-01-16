# Pre-Commit Checklist

Use this checklist before every commit to ensure atomic, high-quality commits.

## Before Staging

- [ ] **Review all changes**: `git diff`
- [ ] **Identify logical units**: Can changes be split into separate commits?
- [ ] **Check for mixed concerns**:
  - [ ] No formatting mixed with logic changes
  - [ ] No refactoring mixed with new features
  - [ ] No tests mixed with implementation (unless TDD single unit)

## During Staging

- [ ] **Use interactive staging**: `git add -p`
- [ ] **Stage related changes only**: One logical change per commit
- [ ] **Split hunks when needed**: Use `s` in git add -p
- [ ] **Review staged vs unstaged**: `git diff --staged` vs `git diff`

## Commit Message

- [ ] **Format**: `type(#issue): description`
- [ ] **Type is correct**:
  - `feat` - New feature
  - `fix` - Bug fix
  - `refactor` - Code restructuring
  - `docs` - Documentation only
  - `test` - Adding/updating tests
  - `chore` - Build, deps, CI
  - `style` - Formatting, whitespace
  - `perf` - Performance improvement
- [ ] **Issue reference included** (if applicable)
- [ ] **Title < 72 characters**
- [ ] **No "and" in title** (sign of non-atomic commit)
- [ ] **Body explains "why"** (not "what" - code shows what)

## Before Push

- [ ] **Tests pass**: Run relevant test suite
- [ ] **Linting passes**: Check code style
- [ ] **Review commit**: `git log -1 --stat`
- [ ] **Check commit size**:
  - [ ] < 10 files (ideally < 5)
  - [ ] < 400 lines changed (ideally < 200)

## Quick Commands

```bash
# Review changes
git diff                    # Unstaged changes
git diff --staged           # Staged changes
git diff --stat             # Summary

# Interactive staging
git add -p                  # Stage interactively
git add -p file.ts          # Stage specific file

# Commit
git commit -m "type(#123): description"

# Review before push
git log -1 --stat           # Last commit with stats
git log --oneline -5        # Recent commits

# Fix mistakes
git reset --soft HEAD~1     # Undo commit, keep changes staged
git reset HEAD              # Unstage all
git checkout -- file        # Discard changes to file
```

## Red Flags - Stop and Reconsider

- [ ] Commit message needs "and" or ","
- [ ] More than 10 files changed
- [ ] More than 400 lines changed
- [ ] Mix of unrelated file types
- [ ] Can't explain change in one sentence
- [ ] Tempted to say "various fixes" or "updates"

## Atomic Commit Benefits Reminder

| Benefit | Why It Matters |
|---------|----------------|
| Easy revert | `git revert <sha>` undoes exactly one thing |
| Better bisect | `git bisect` finds bugs in minutes |
| Clear history | Future you understands what happened |
| Easier review | Reviewers follow logic step-by-step |
| Fewer conflicts | Small changes = fewer merge conflicts |
