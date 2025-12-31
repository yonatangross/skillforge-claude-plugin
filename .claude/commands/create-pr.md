---
description: Create PR with parallel validation and auto-generated description
---

# Create Pull Request

Comprehensive PR creation with parallel validation agents. **NO file creation** - all output goes directly to GitHub PR.

## Phase 1: Pre-Flight Checks

```bash
# Verify branch
BRANCH=$(git branch --show-current)
if [[ "$BRANCH" == "dev" || "$BRANCH" == "main" ]]; then
  echo "Cannot create PR from dev/main. Create a feature branch first."
  exit 1
fi

# Check for uncommitted changes
if [[ -n $(git status --porcelain) ]]; then
  echo "Uncommitted changes detected. Commit or stash first."
  exit 1
fi

# Check if branch is pushed
git fetch origin
if ! git rev-parse --verify origin/$BRANCH &>/dev/null; then
  echo "Pushing branch..."
  git push -u origin $BRANCH
fi
```

## Phase 2: Run Local Validation FIRST

**CRITICAL: Run ALL checks locally before launching agents.**

```bash
# Backend validation
cd backend
poetry run ruff format --check app/
poetry run ruff check app/
poetry run ty check app/ --exclude "app/evaluation/*"
poetry run pytest tests/unit/ -v --tb=short -x

# Frontend validation (if applicable)
cd ../frontend
npm run format:check
npm run lint
npm run typecheck
```

**If any check fails, fix it before proceeding.**

## Phase 3: Gather Context (No Agents Needed)

```bash
# Get branch info
BRANCH=$(git branch --show-current)
ISSUE=$(echo $BRANCH | grep -oE '[0-9]+' | head -1)

# Get commits and changes
git log --oneline dev..HEAD
git diff dev...HEAD --stat
```

## Phase 4: Create PR Directly

Use `gh pr create` with inline content. **Do NOT spawn agents to generate files.**

```bash
# Extract type from branch/commits
TYPE="feat"  # Determine from changes: feat/fix/refactor/docs/test/chore

gh pr create --base dev \
  --title "$TYPE(#$ISSUE): Brief description" \
  --body "$(cat <<'EOF'
## Summary
[1-2 sentence description of what this PR does]

## Changes
- [Change 1]
- [Change 2]

## Type
- [ ] Feature | [ ] Bug fix | [ ] Refactor | [ ] Docs | [ ] Test | [ ] Chore

## Breaking Changes
- [ ] None
- [ ] Yes: [describe migration steps]

## Related Issues
- Closes #ISSUE

## Test Plan
- [x] Unit tests pass
- [x] Lint/type checks pass
- [ ] Manual testing: [describe]

---
Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

## Phase 5: Verify and Report

```bash
PR_NUMBER=$(gh pr view --json number -q .number)
PR_URL=$(gh pr view --json url -q .url)

echo "PR #$PR_NUMBER created: $PR_URL"
gh pr view --web
```

## Phase 6 (Optional): Create Issue Documentation

For significant features, create a folder in `docs/issues/`:

```bash
# Create issue folder
ISSUE_DIR="docs/issues/${ISSUE}-$(echo $BRANCH | sed 's/issue\/[0-9]*-//' | sed 's/feature\///')"
mkdir -p "$ISSUE_DIR"

# Create README.md in the folder
cat > "$ISSUE_DIR/README.md" << EOF
# Issue #$ISSUE: [Title]

**Status:** In Progress
**PR:** [#$PR_NUMBER]($PR_URL)
**Branch:** \`$BRANCH\`

## Summary
[What this issue addresses]

## Changes
### New Files
- \`path/to/file.py\` - Description

### Modified Files
- \`path/to/file.py\` - What changed

## Testing
\`\`\`bash
# How to test
\`\`\`

## Notes
[Any decisions, lessons learned]
EOF

# Update docs/issues/README.md index with link to folder
```

---

## Rules

1. **NO junk files** - Don't create files in repo root
2. **NO parallel agents for PR description** - Use git log/diff directly
3. **Run validation locally** - Don't spawn agents just to run lint/test
4. **All content goes to GitHub** - PR body via `gh pr create --body`
5. **Keep it simple** - One command to create PR, no elaborate pipelines

## When to Use Agents

Only use Task agents for:
- Complex code analysis that requires reading multiple files
- Security review of sensitive changes
- Architecture review for large refactors

For standard PRs, direct `gh pr create` is sufficient.
