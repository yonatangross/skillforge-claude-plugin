# GitHub Issue Labeling Guide

Proper labeling ensures issues are discoverable, prioritized correctly, and assigned to the right teams.

## Label Categories

### 1. Type Labels (REQUIRED - pick one)

| Label | Use When | Examples |
|-------|----------|----------|
| `bug` | Something is broken | Crashes, errors, wrong behavior |
| `enhancement` / `feat` | New functionality | New feature, improvement |
| `documentation` / `docs` | Docs only | README, API docs, guides |
| `refactor` | Code improvement | No behavior change |
| `test` | Test-related | New tests, test fixes |
| `chore` | Maintenance | Deps, CI/CD, tooling |
| `security` | Security-related | Vulnerabilities, auth issues |

**Common Mistakes:**
- Using `bug` for feature requests
- Using `enhancement` for bug fixes
- Forgetting type label entirely

### 2. Priority Labels (REQUIRED - pick one)

| Label | Criteria | Response Time |
|-------|----------|---------------|
| `critical` / `P0` | Production down, security breach, data loss | Immediate |
| `high` / `P1` | Major feature broken, blocking users | This sprint |
| `medium` / `P2` | Important but workaround exists | Next 2-3 sprints |
| `low` / `P3` | Nice to have, minor issue | Backlog |

**Priority Decision Tree:**
```
Is production broken or security at risk?
├── YES → critical
└── NO
    └── Are many users blocked with no workaround?
        ├── YES → high
        └── NO
            └── Is there a reasonable workaround?
                ├── NO → medium
                └── YES → low
```

### 3. Domain Labels (Pick all that apply)

| Label | Scope |
|-------|-------|
| `backend` | Python, FastAPI, APIs, database |
| `frontend` | React, TypeScript, UI components |
| `database` | Schema, migrations, queries |
| `api` | REST/GraphQL endpoints |
| `infra` | Docker, CI/CD, deployment |
| `auth` | Authentication, authorization |
| `ui` / `ux` | Design, user experience |

### 4. Status Labels (Managed during triage)

| Label | Meaning |
|-------|---------|
| `needs-triage` | Awaiting review |
| `needs-info` | Missing information |
| `ready` | Ready for development |
| `in-progress` | Being worked on |
| `blocked` | Waiting on something |
| `wontfix` | Decided not to fix |
| `duplicate` | Duplicate of another issue |

### 5. Size Labels (For estimation)

| Label | Effort |
|-------|--------|
| `size/XS` | < 1 hour |
| `size/S` | 1-4 hours |
| `size/M` | 1-2 days |
| `size/L` | 3-5 days |
| `size/XL` | 1+ weeks (should be split) |

---

## Labeling Checklist

Before submitting an issue, verify:

- [ ] **Type label assigned** (bug, enhancement, docs, etc.)
- [ ] **Priority label assigned** (critical, high, medium, low)
- [ ] **Domain labels assigned** (backend, frontend, etc.)
- [ ] **Labels make sense together** (no contradictions)

### Valid Combinations

```
✅ bug + critical + backend + auth
✅ enhancement + medium + frontend + ui
✅ docs + low + api
✅ refactor + medium + backend + database
✅ chore + low + infra
```

### Invalid Combinations

```
❌ bug + enhancement (pick one type)
❌ critical + low (pick one priority)
❌ security + low (security should be high/critical)
❌ No labels at all
```

---

## Common Mislabeling Mistakes

### 1. Bug vs Enhancement Confusion

| Scenario | Correct Label |
|----------|---------------|
| Feature doesn't work as documented | `bug` |
| Feature works but user wants different behavior | `enhancement` |
| Missing error handling | `bug` (if crashes) or `enhancement` (if just UX) |
| Performance is slow | `bug` (if regression) or `enhancement` (if always slow) |

### 2. Priority Inflation

**Don't:**
- Mark everything as `critical`
- Use `high` for personal preference
- Ignore priority labels

**Do:**
- Reserve `critical` for actual emergencies
- Use `medium` as the default
- Justify priority in issue description

### 3. Domain Overlap

When multiple domains apply:
```bash
# Full-stack feature
--label "enhancement,medium,backend,frontend"

# API affecting database
--label "bug,high,api,database"
```

### 4. Forgetting Security Labels

Security issues should ALWAYS have:
- `security` label
- Priority `high` or `critical`
- Minimal public details

---

## Quick Reference Commands

```bash
# List all labels
gh label list

# Create missing labels
gh label create "critical" --color "B60205" --description "Immediate attention required"
gh label create "high" --color "D93F0B" --description "Important, current sprint"
gh label create "medium" --color "FBCA04" --description "Normal priority"
gh label create "low" --color "0E8A16" --description "Nice to have"

# Add labels to existing issue
gh issue edit 123 --add-label "backend,high"

# Remove labels
gh issue edit 123 --remove-label "low"

# Find mislabeled issues
gh issue list --label "bug,enhancement"  # Should return nothing
gh issue list --label "security" --json number,labels --jq '
  [.[] | select(.labels | map(.name) | any(. == "low"))] |
  if length > 0 then "WARNING: Security issues marked low:" else empty end,
  .[] | "#\(.number)"
'
```

---

## Label Audit Queries

Find issues that might be mislabeled:

```bash
# Issues with no type label
gh issue list --state open --json number,title,labels --jq '
  [.[] | select(.labels | map(.name) |
    any(. == "bug" or . == "enhancement" or . == "docs" or . == "refactor" or . == "chore") | not
  )] | .[] | "#\(.number) \(.title)"
'

# Issues with no priority
gh issue list --state open --json number,title,labels --jq '
  [.[] | select(.labels | map(.name) |
    any(. == "critical" or . == "high" or . == "medium" or . == "low") | not
  )] | .[] | "#\(.number) \(.title)"
'

# Security issues that aren't high priority
gh issue list --label "security" --state open --json number,title,labels --jq '
  [.[] | select(.labels | map(.name) |
    any(. == "critical" or . == "high") | not
  )] | .[] | "⚠️ #\(.number) \(.title)"
'

# Issues with conflicting labels
gh issue list --state open --json number,labels --jq '
  [.[] | select(
    (.labels | map(.name) | (any(. == "bug") and any(. == "enhancement"))) or
    (.labels | map(.name) | (any(. == "critical") and any(. == "low")))
  )] | .[] | "#\(.number) has conflicting labels"
'
```

---

## Standard Label Set

Copy this to set up consistent labels:

```bash
#!/bin/bash
# Standard label setup script

# Type labels
gh label create "bug" --color "d73a4a" --description "Something isn't working" --force
gh label create "enhancement" --color "a2eeef" --description "New feature or request" --force
gh label create "documentation" --color "0075ca" --description "Documentation improvements" --force
gh label create "refactor" --color "cfd3d7" --description "Code improvement, no behavior change" --force
gh label create "chore" --color "fef2c0" --description "Maintenance tasks" --force
gh label create "security" --color "d73a4a" --description "Security-related issues" --force

# Priority labels
gh label create "critical" --color "b60205" --description "Immediate attention required" --force
gh label create "high" --color "d93f0b" --description "Important, current sprint" --force
gh label create "medium" --color "fbca04" --description "Normal priority" --force
gh label create "low" --color "0e8a16" --description "Nice to have" --force

# Domain labels
gh label create "backend" --color "1d76db" --description "Backend/API related" --force
gh label create "frontend" --color "7057ff" --description "Frontend/UI related" --force
gh label create "database" --color "006b75" --description "Database related" --force
gh label create "infra" --color "5319e7" --description "Infrastructure/DevOps" --force

# Status labels
gh label create "needs-triage" --color "ededed" --description "Awaiting review" --force
gh label create "needs-info" --color "d876e3" --description "Missing information" --force
gh label create "ready" --color "0e8a16" --description "Ready for development" --force
gh label create "blocked" --color "b60205" --description "Blocked by dependency" --force

echo "Labels created/updated!"
```
