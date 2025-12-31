---
description: Smart commit with validation and auto-generated message
---

# Create Commit

Simple, validated commit creation. **Run checks locally, no agents needed for standard commits.**

## Phase 1: Pre-Commit Safety Check

```bash
# CRITICAL: Verify we're not on dev/main
BRANCH=$(git branch --show-current)
if [[ "$BRANCH" == "dev" || "$BRANCH" == "main" || "$BRANCH" == "master" ]]; then
  echo "STOP! Cannot commit directly to $BRANCH"
  echo "Create a feature branch: git checkout -b issue/<number>-<description>"
  exit 1
fi
```

## Phase 2: Run ALL Validation Locally

**CRITICAL: Run every check that CI runs.**

```bash
# Backend
cd backend
poetry run ruff format --check app/   # Format check
poetry run ruff check app/            # Lint check
poetry run ty check app/ --exclude "app/evaluation/*"  # Type check

# Frontend (if changed)
cd ../frontend
npm run format:check
npm run lint
npm run typecheck
```

**Fix any failures before proceeding.**

## Phase 3: Review Changes

```bash
git status
git diff --staged   # What will be committed
git diff            # Unstaged changes
```

## Phase 4: Stage and Commit

```bash
# Stage specific files
git add <files>

# Or stage all
git add .

# Commit with conventional format
git commit -m "$(cat <<'EOF'
<type>(#<issue>): <brief description>

- [Change 1]
- [Change 2]

Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"

# Verify
git log -1 --stat
```

## Commit Types

| Type | Use For |
|------|---------|
| `feat` | New feature |
| `fix` | Bug fix |
| `refactor` | Code improvement |
| `docs` | Documentation |
| `test` | Tests only |
| `chore` | Build/deps/CI |

## Rules

1. **Run validation locally** - Don't spawn agents to run lint/test
2. **NO file creation** - Don't create MD files or documentation
3. **One logical change per commit** - Keep commits focused
4. **Reference issues** - Use `#123` format in commit message
5. **Subject line < 72 chars** - Keep it concise

## Quick Commit

For trivial changes (typos, single-line fixes):

```bash
git add . && git commit -m "fix(#123): Fix typo in error message

Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

## Recovery if Committed to Wrong Branch

```bash
git checkout -b issue/<number>-<description>  # Save work
git checkout dev && git reset --hard origin/dev  # Reset dev
git checkout issue/<number>-<description>  # Back to feature
```
