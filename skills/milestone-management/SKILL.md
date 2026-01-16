---
name: milestone-management
description: Manage GitHub milestones via REST API since gh CLI lacks native commands. Create, list, close, delete milestones and track progress.
context: fork
version: 1.0.0
author: SkillForge
tags: [github, milestones, api, project-management, sprints, releases]
user-invocable: false
---

# Milestone Management

GitHub CLI has NO native milestone commands. Use `gh api` REST calls for all milestone operations.

## When to Use

- Creating sprints or release milestones
- Closing completed milestones
- Tracking milestone progress
- Organizing issues by time-based deliverables

## Quick Reference

### List Milestones

```bash
# List all open milestones
gh api repos/:owner/:repo/milestones --jq '.[] | "\(.number): \(.title) [\(.state)]"'

# List with progress
gh api repos/:owner/:repo/milestones --jq '.[] | "\(.title): \(.closed_issues)/\(.open_issues + .closed_issues) done"'

# Include closed milestones
gh api repos/:owner/:repo/milestones?state=all --jq '.[] | "\(.number): \(.title) [\(.state)]"'

# JSON output for scripting
gh api repos/:owner/:repo/milestones --jq '[.[] | {number, title, state, due_on, open: .open_issues, closed: .closed_issues}]'
```

### Create Milestone

```bash
# Basic creation
gh api -X POST repos/:owner/:repo/milestones \
  -f title="Sprint 7"

# With due date and description
gh api -X POST repos/:owner/:repo/milestones \
  -f title="Sprint 7: Performance" \
  -f description="Focus on frontend performance optimization" \
  -f due_on="2026-02-15T00:00:00Z"

# Create and capture number
MILESTONE_NUM=$(gh api -X POST repos/:owner/:repo/milestones \
  -f title="Sprint 8" \
  --jq '.number')
echo "Created milestone #$MILESTONE_NUM"
```

### Update Milestone

```bash
# Update title
gh api -X PATCH repos/:owner/:repo/milestones/5 \
  -f title="Sprint 7: Performance & Security"

# Update due date
gh api -X PATCH repos/:owner/:repo/milestones/5 \
  -f due_on="2026-02-28T00:00:00Z"

# Update description
gh api -X PATCH repos/:owner/:repo/milestones/5 \
  -f description="Updated scope: includes auth improvements"
```

### Close/Reopen Milestone

```bash
# Close milestone
gh api -X PATCH repos/:owner/:repo/milestones/5 -f state=closed

# Reopen milestone
gh api -X PATCH repos/:owner/:repo/milestones/5 -f state=open
```

### Delete Milestone

```bash
# Delete by number (removes from all issues!)
gh api -X DELETE repos/:owner/:repo/milestones/5
```

---

## Milestone vs Epic

| Milestones | Epics |
|------------|-------|
| Time-based (sprints, releases) | Topic-based (features, themes) |
| Has due date | No due date |
| Progress bar | Task list checkbox |
| Native GitHub | Needs workarounds |
| Single repo | Can span repos (via Projects) |

**Rule**: Use milestones for "when", use parent issues for "what".

---

## Workflow Patterns

### Sprint Workflow

```bash
# 1. Create sprint milestone
gh api -X POST repos/:owner/:repo/milestones \
  -f title="Sprint 8: Auth & Performance" \
  -f due_on="2026-02-14T00:00:00Z"

# 2. Assign issues to sprint
gh issue edit 123 124 125 --milestone "Sprint 8: Auth & Performance"

# 3. Check progress mid-sprint
gh api repos/:owner/:repo/milestones --jq '
  .[] | select(.title | contains("Sprint 8")) |
  "Progress: \(.closed_issues)/\(.open_issues + .closed_issues) (\((.closed_issues / (.open_issues + .closed_issues) * 100) | floor)%)"'

# 4. Close sprint when done
MILESTONE_NUM=$(gh api repos/:owner/:repo/milestones --jq '.[] | select(.title | contains("Sprint 8")) | .number')
gh api -X PATCH repos/:owner/:repo/milestones/$MILESTONE_NUM -f state=closed
```

### Release Workflow

```bash
# 1. Create release milestone
gh api -X POST repos/:owner/:repo/milestones \
  -f title="v2.0.0" \
  -f description="Major release: New auth system, performance improvements" \
  -f due_on="2026-03-01T00:00:00Z"

# 2. Tag issues for release
gh issue list --milestone "v2.0.0" --json number,title --jq '.[] | "#\(.number): \(.title)"'

# 3. When ready, close and create release
gh api -X PATCH repos/:owner/:repo/milestones/10 -f state=closed
gh release create v2.0.0 --generate-notes
```

---

## Aliases (Add to ~/.config/gh/config.yml)

```yaml
aliases:
  milestone-list: api repos/:owner/:repo/milestones --jq '.[] | "\(.number): \(.title) [\(.state)] - \(.closed_issues)/\(.open_issues + .closed_issues) done"'
  milestone-create: '!f() { gh api -X POST repos/:owner/:repo/milestones -f title="$1" ${2:+-f due_on="$2"}; }; f'
  milestone-close: '!f() { gh api -X PATCH repos/:owner/:repo/milestones/$1 -f state=closed; }; f'
  milestone-open: '!f() { gh api -X PATCH repos/:owner/:repo/milestones/$1 -f state=open; }; f'
  milestone-delete: api -X DELETE repos/:owner/:repo/milestones/$1
```

Usage after adding aliases:
```bash
gh milestone-list
gh milestone-create "Sprint 9" "2026-03-15T00:00:00Z"
gh milestone-close 5
```

---

## Best Practices

1. **Use ISO 8601 dates** - `YYYY-MM-DDTHH:MM:SSZ` format for due_on
2. **Meaningful titles** - Include sprint number and focus area
3. **Close on time** - Even with open issues, close at deadline
4. **Don't delete** - Close instead to preserve history
5. **Link to Projects** - Use Projects v2 Iteration field for cross-repo

## Related Skills

- github-cli: Full GitHub CLI reference
- release-management: Release workflow patterns
- branch-strategy: Branch and milestone alignment

## References

- [Milestone API Patterns](references/milestone-api.md)
- [Sprint Workflow](references/sprint-workflow.md)
