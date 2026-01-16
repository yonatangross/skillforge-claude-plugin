# Issue Templates Reference

Ready-to-use templates for common issue types.

## Bug Report

```bash
gh issue create \
  --title "bug: Brief description of the bug" \
  --label "bug,medium" \
  --milestone "Current Sprint" \
  --body "$(cat <<'EOF'
## Bug Description
<!-- Clear, concise description of what's wrong -->

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. Enter '...'
4. See error

## Expected Behavior
<!-- What should happen -->

## Actual Behavior
<!-- What actually happens -->

## Environment
- **OS**: macOS / Windows / Linux
- **Browser**: Chrome / Firefox / Safari (version)
- **App Version**: v1.x.x
- **Node/Python Version**: x.x.x

## Error Messages / Logs
```
Paste any error messages or relevant logs here
```

## Screenshots
<!-- If applicable, add screenshots -->

## Additional Context
<!-- Any other relevant information -->

## Possible Fix
<!-- If you have ideas on how to fix it -->
EOF
)"
```

## Feature Request

```bash
gh issue create \
  --title "feat: Brief description of the feature" \
  --label "enhancement,medium" \
  --milestone "Future Sprint" \
  --body "$(cat <<'EOF'
## Problem Statement
<!-- What problem does this feature solve? Who is affected? -->

## Proposed Solution
<!-- Describe the desired feature in detail -->

## User Stories
As a [type of user], I want [goal] so that [benefit].

## Acceptance Criteria
- [ ] Criterion 1: Specific, measurable requirement
- [ ] Criterion 2: Another specific requirement
- [ ] Criterion 3: Yet another requirement
- [ ] Tests: Unit and/or integration tests pass
- [ ] Docs: Documentation updated if needed

## UI/UX Considerations
<!-- Mockups, wireframes, or description of user interaction -->

## Technical Considerations
<!-- Architecture decisions, dependencies, breaking changes -->

## Alternatives Considered
<!-- Other approaches you've thought about -->

## Priority Justification
<!-- Why this feature, why now? Business impact? -->

## Out of Scope
<!-- What this feature explicitly does NOT include -->
EOF
)"
```

## Task / Chore

```bash
gh issue create \
  --title "chore: Brief description of the task" \
  --label "chore,low" \
  --body "$(cat <<'EOF'
## Description
<!-- What needs to be done and why -->

## Background
<!-- Context that led to this task -->

## Tasks
- [ ] Task 1
- [ ] Task 2
- [ ] Task 3

## Definition of Done
- [ ] All tasks completed
- [ ] Tests pass (if applicable)
- [ ] No new warnings/errors
- [ ] PR reviewed and merged

## Notes
<!-- Any additional information -->
EOF
)"
```

## Documentation

```bash
gh issue create \
  --title "docs: Brief description of documentation needed" \
  --label "documentation,low" \
  --body "$(cat <<'EOF'
## Documentation Needed
<!-- What documentation is missing or needs updating -->

## Location
<!-- Where should this documentation live? -->
- [ ] README.md
- [ ] API docs
- [ ] User guide
- [ ] Code comments
- [ ] Other: ___

## Content Outline
1. Section 1
2. Section 2
3. Section 3

## Audience
<!-- Who is this documentation for? -->
- [ ] Developers
- [ ] End users
- [ ] API consumers
- [ ] DevOps/SRE

## Acceptance Criteria
- [ ] Content is accurate and up-to-date
- [ ] Code examples work
- [ ] Links are valid
- [ ] Reviewed for clarity
EOF
)"
```

## Refactor

```bash
gh issue create \
  --title "refactor: Brief description of refactoring" \
  --label "refactor,medium" \
  --body "$(cat <<'EOF'
## Current State
<!-- Describe current implementation and its problems -->

## Proposed Changes
<!-- What should change and why -->

## Benefits
- [ ] Improved maintainability
- [ ] Better performance
- [ ] Reduced complexity
- [ ] Better testability
- [ ] Other: ___

## Risks
<!-- What could go wrong? How to mitigate? -->

## Affected Areas
<!-- Files, modules, features that will be touched -->

## Testing Plan
<!-- How to verify the refactor doesn't break anything -->

## Rollback Plan
<!-- How to revert if something goes wrong -->

## Acceptance Criteria
- [ ] All existing tests pass
- [ ] No regression in functionality
- [ ] Code review approved
- [ ] Performance metrics unchanged or improved
EOF
)"
```

## Security Issue

```bash
gh issue create \
  --title "security: Brief description (no sensitive details)" \
  --label "security,critical" \
  --body "$(cat <<'EOF'
## ⚠️ SECURITY NOTICE
**Do NOT include sensitive details in public issues.**
For critical vulnerabilities, use private security reporting.

## Severity
- [ ] Critical - Immediate action required
- [ ] High - Needs prompt attention
- [ ] Medium - Should be addressed soon
- [ ] Low - Can be scheduled

## Category
- [ ] Authentication/Authorization
- [ ] Data exposure
- [ ] Injection vulnerability
- [ ] Dependency vulnerability
- [ ] Configuration issue
- [ ] Other: ___

## Impact
<!-- What could an attacker do? What data is at risk? -->

## Affected Components
<!-- Which parts of the system are affected? -->

## Remediation
<!-- High-level fix without exposing vulnerability details -->

## References
<!-- CVE numbers, security advisories, etc. -->
EOF
)"
```

## Epic / Parent Issue

```bash
gh issue create \
  --title "epic: High-level feature or initiative" \
  --label "epic,enhancement" \
  --body "$(cat <<'EOF'
## Epic Overview
<!-- High-level description of this initiative -->

## Goals
- Goal 1
- Goal 2
- Goal 3

## Success Metrics
<!-- How will we measure success? -->

## User Stories
1. As a [user], I want [feature] so that [benefit]
2. As a [user], I want [feature] so that [benefit]

## Child Issues
<!-- Link sub-issues as they're created -->
- [ ] #__ - Sub-task 1
- [ ] #__ - Sub-task 2
- [ ] #__ - Sub-task 3

## Timeline
- **Start**: YYYY-MM-DD
- **Target Completion**: YYYY-MM-DD
- **Milestone**: [Sprint/Release Name]

## Dependencies
<!-- What must be done first? What's blocked by this? -->

## Risks & Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| Risk 1 | High/Med/Low | Mitigation strategy |

## Out of Scope
<!-- What is explicitly NOT part of this epic -->

## Stakeholders
<!-- Who needs to be informed/consulted? -->
EOF
)"
```

## Quick One-Liners

```bash
# Quick bug
gh issue create -t "bug: Brief bug description" -l "bug,high" -b "Description here"

# Quick feature
gh issue create -t "feat: Brief feature description" -l "enhancement" -b "Description here"

# Quick task
gh issue create -t "chore: Brief task" -l "chore" -b "- [ ] Task 1\n- [ ] Task 2"

# From file
gh issue create -t "Title" --body-file ./issue-body.md

# Interactive (opens editor)
gh issue create
```

## Tips

1. **Always search first**: `gh issue list --state all --search "keywords"`
2. **Use templates**: Save these as files in `.github/ISSUE_TEMPLATE/`
3. **Link related issues**: Use `#123` in body to create links
4. **Add to projects**: `gh project item-add <num> --owner @me --url <issue-url>`
5. **Assign milestone**: `--milestone "Sprint 10"` at creation time
6. **Multiple labels**: `--label "bug,critical,backend"`
