# Milestone API Reference

Complete `gh api` commands for milestone management.

## API Endpoints

| Operation | Method | Endpoint |
|-----------|--------|----------|
| List | GET | `/repos/:owner/:repo/milestones` |
| Get | GET | `/repos/:owner/:repo/milestones/:number` |
| Create | POST | `/repos/:owner/:repo/milestones` |
| Update | PATCH | `/repos/:owner/:repo/milestones/:number` |
| Delete | DELETE | `/repos/:owner/:repo/milestones/:number` |

## Create Milestone

```bash
# Minimal
gh api -X POST repos/:owner/:repo/milestones \
  -f title="Sprint 10"

# Full options
gh api -X POST repos/:owner/:repo/milestones \
  -f title="Sprint 10: Performance" \
  -f state="open" \
  -f description="Focus on frontend performance optimization" \
  -f due_on="2026-03-15T00:00:00Z"
```

## List Milestones

```bash
# All open (default)
gh api repos/:owner/:repo/milestones

# All milestones (including closed)
gh api "repos/:owner/:repo/milestones?state=all"

# Closed only
gh api "repos/:owner/:repo/milestones?state=closed"

# Sorted by due date
gh api "repos/:owner/:repo/milestones?sort=due_on&direction=asc"

# With jq formatting
gh api repos/:owner/:repo/milestones --jq '
  .[] | {
    number,
    title,
    state,
    due: .due_on,
    progress: "\(.closed_issues)/\(.open_issues + .closed_issues)"
  }'
```

## Get Single Milestone

```bash
gh api repos/:owner/:repo/milestones/1
```

## Update Milestone

```bash
# Change title
gh api -X PATCH repos/:owner/:repo/milestones/1 \
  -f title="New Title"

# Close milestone
gh api -X PATCH repos/:owner/:repo/milestones/1 \
  -f state="closed"

# Update due date
gh api -X PATCH repos/:owner/:repo/milestones/1 \
  -f due_on="2026-04-01T00:00:00Z"
```

## Delete Milestone

```bash
# Warning: removes milestone from all issues!
gh api -X DELETE repos/:owner/:repo/milestones/1
```

## Useful Aliases

Add to `~/.config/gh/config.yml`:

```yaml
aliases:
  ms: api repos/:owner/:repo/milestones --jq '.[] | "#\(.number) \(.title) [\(.state)] \(.closed_issues)/\(.open_issues+.closed_issues)"'
  ms-create: '!f() { gh api -X POST repos/:owner/:repo/milestones -f title="$1" ${2:+-f due_on="$2"} ${3:+-f description="$3"}; }; f'
  ms-close: '!f() { gh api -X PATCH repos/:owner/:repo/milestones/$1 -f state=closed; }; f'
  ms-progress: '!f() { gh api repos/:owner/:repo/milestones/$1 --jq "\"Progress: \\(.closed_issues)/\\(.open_issues + .closed_issues) (\\((.closed_issues * 100 / (.open_issues + .closed_issues)) | floor)%)\""; }; f'
```

Usage:
```bash
gh ms                              # List all
gh ms-create "Sprint 11"           # Create
gh ms-create "v2.0" "2026-04-01"   # With due date
gh ms-close 5                      # Close
gh ms-progress 1                   # Check progress
```
