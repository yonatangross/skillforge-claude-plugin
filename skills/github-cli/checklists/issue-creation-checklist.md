# Issue Creation Checklist

Use this checklist BEFORE creating any GitHub issue to avoid duplicates, ensure proper categorization, and follow best practices.

## Pre-Creation Checks

### 1. Search for Duplicates

- [ ] **Search open issues** for similar keywords
  ```bash
  gh issue list --state open --search "keyword1 keyword2"
  ```

- [ ] **Search closed issues** (might be resolved or reopened)
  ```bash
  gh issue list --state closed --search "keyword1"
  ```

- [ ] **Check with different terms** (synonyms, related concepts)
  ```bash
  gh issue list --state all --search "auth OR authentication OR login"
  ```

- [ ] **If duplicate found**: Comment on existing issue instead of creating new

### 2. Review Milestones

- [ ] **List available milestones**
  ```bash
  gh api repos/:owner/:repo/milestones --jq '.[] | "#\(.number) \(.title) [\(.state)] due: \(.due_on // "none" | split("T")[0])"'
  ```

- [ ] **Check milestone progress** (avoid overloading)
  ```bash
  gh api repos/:owner/:repo/milestones --jq '.[] | "\(.title): \(.open_issues) open, \(.closed_issues) closed"'
  ```

- [ ] **Identify appropriate milestone** based on:
  - [ ] Due date alignment
  - [ ] Scope/theme match
  - [ ] Current capacity

### 3. Review Labels

- [ ] **List available labels**
  ```bash
  gh label list
  ```

- [ ] **Identify appropriate labels**:
  - [ ] Type: `bug`, `enhancement`, `documentation`, etc.
  - [ ] Priority: `critical`, `high`, `medium`, `low`
  - [ ] Domain: `backend`, `frontend`, `database`, etc.
  - [ ] Status: `needs-triage`, `ready`, etc.

### 4. Check Related Issues

- [ ] **Find related open issues**
  ```bash
  gh issue list --label "same-domain" --state open
  ```

- [ ] **Check for parent/epic issues** to link to
  ```bash
  gh issue list --search "epic OR parent OR umbrella" --state open
  ```

- [ ] **Note related issue numbers** for cross-references

### 5. Sync Repository State

- [ ] **Fetch latest changes**
  ```bash
  git fetch origin
  git status
  ```

- [ ] **Check recent commits** (issue might be already fixed)
  ```bash
  git log --oneline -20 | grep -i "keyword"
  ```

- [ ] **Check open PRs** (fix might be in progress)
  ```bash
  gh pr list --state open --search "keyword"
  ```

---

## Issue Content Checklist

### Title

- [ ] **Clear and specific** (not "Bug" or "Feature request")
- [ ] **Starts with type** when applicable: `bug:`, `feat:`, `docs:`
- [ ] **Includes component** if relevant: `[auth]`, `[api]`, `[ui]`
- [ ] **Searchable** - uses keywords others would search for
- [ ] **< 80 characters** for readability

**Good examples:**
```
bug: Login fails with special characters in password
feat: Add dark mode toggle to settings page
docs: Add API authentication examples
[api] Rate limiting returns wrong error code
```

**Bad examples:**
```
Bug
It doesn't work
Feature request
Please fix
```

### Description

- [ ] **Problem statement** - What's wrong or what's needed?
- [ ] **Context** - Why is this important? Who is affected?
- [ ] **Current behavior** (for bugs)
- [ ] **Expected behavior**
- [ ] **Steps to reproduce** (for bugs)
- [ ] **Acceptance criteria** (for features)
- [ ] **Technical notes** (if relevant)
- [ ] **Screenshots/logs** (if applicable)

### Metadata

- [ ] **Labels assigned** (at least type + priority)
  - [ ] Type label: `bug`, `enhancement`, `docs`, `refactor`, `chore`
  - [ ] Priority label: `critical`, `high`, `medium`, `low`
  - [ ] Domain labels: `backend`, `frontend`, `database`, etc.
  - [ ] Labels don't conflict (no `bug` + `enhancement`, no `critical` + `low`)
- [ ] **Milestone assigned** (if applicable)
- [ ] **Assignee set** (if known)
- [ ] **Project added** (if using GitHub Projects)

> **See also**: [Labeling Guide](labeling-guide.md) for detailed labeling best practices

---

## Issue Templates

### Bug Report Template
```markdown
## Bug Description
Brief description of the bug.

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. See error

## Expected Behavior
What should happen.

## Actual Behavior
What actually happens.

## Environment
- OS: [e.g., macOS 14.0]
- Browser: [e.g., Chrome 120]
- Version: [e.g., v1.2.3]

## Additional Context
Screenshots, logs, etc.
```

### Feature Request Template
```markdown
## Problem Statement
What problem does this solve?

## Proposed Solution
Describe the desired feature.

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Alternatives Considered
Other approaches you've thought about.

## Additional Context
Mockups, examples, etc.
```

### Task Template
```markdown
## Description
What needs to be done.

## Tasks
- [ ] Task 1
- [ ] Task 2
- [ ] Task 3

## Definition of Done
- [ ] Code complete
- [ ] Tests passing
- [ ] Documentation updated
- [ ] PR approved
```

---

## Quick Commands Reference

```bash
# Search before creating
gh issue list --state all --search "keyword"
gh issue list --state all --search "keyword in:title"
gh issue list --state all --search "keyword in:body"

# Check milestones
gh api repos/:owner/:repo/milestones --jq '.[] | "\(.number): \(.title)"'

# Check labels
gh label list --json name,description --jq '.[] | "\(.name): \(.description)"'

# Check assignees
gh api repos/:owner/:repo/assignees --jq '.[].login'

# Create issue (after checks pass)
gh issue create \
  --title "type: Clear description" \
  --body "$(cat <<'EOF'
## Description
...

## Acceptance Criteria
- [ ] ...
EOF
)" \
  --label "enhancement,backend" \
  --milestone "Sprint 10" \
  --assignee "@me"

# Link to milestone by title
gh issue edit <number> --milestone "Sprint 10"

# Add to project
gh project item-add <project-num> --owner @me --url <issue-url>
```

---

## Anti-Patterns to Avoid

| Don't | Do Instead |
|-------|------------|
| Create without searching | Search open AND closed issues first |
| Vague title like "Bug" | Specific: "Login fails with special chars" |
| No labels | At least type + priority labels |
| Dump error without context | Include steps to reproduce |
| Create during active PR | Comment on the PR instead |
| Multiple issues in one | Create separate focused issues |
| Assign wrong milestone | Check milestone scope and capacity |
| Skip acceptance criteria | Define clear "done" conditions |

---

## Automation Tips

### Use the issue creation script
```bash
source skills/github-cli/templates/issue-scripts.sh
create_issue_interactive  # Guided workflow with all checks
```

### Set up aliases
```bash
# Add to ~/.config/gh/config.yml
aliases:
  issue-search: 'issue list --state all --search'
  issue-dup: '!f() { gh issue list --state all --search "$1" --json number,title,state --jq ".[] | \"#\\(.number) [\\(.state)] \\(.title)\""; }; f'
```

### Pre-commit hook reminder
When creating branches with `issue/` prefix, the hook will verify the issue exists.
