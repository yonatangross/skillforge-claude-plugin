---
name: feedback
description: Manage the SkillForge feedback system that learns from your usage
context: inherit
version: 1.1.0
author: SkillForge
tags: [feedback, learning, patterns, metrics, privacy, analytics]
---

# Feedback - Manage Learning System

View and manage the SkillForge feedback system that learns from your usage.

## When to Use

- Checking feedback system status
- Pausing/resuming learning
- Resetting learned patterns
- Exporting feedback data
- Managing privacy settings
- Exporting anonymous analytics for review

## Usage

```
/feedback                    # Same as status
/feedback status             # Show current state
/feedback pause              # Pause learning
/feedback resume             # Resume learning
/feedback reset              # Clear learned patterns
/feedback export             # Export feedback data
/feedback settings           # Show/edit settings
/feedback opt-in             # Enable anonymous sharing
/feedback opt-out            # Disable anonymous sharing
/feedback export-analytics   # Export anonymous analytics for review
```

## Subcommands

### status (default)

Show the current feedback system state.

**Output:**
```
Feedback System Status
-----------------------------
Learning: Enabled
Anonymous sharing: Disabled
Data retention: 90 days

Learned Patterns:
- Auto-approves: npm install, npm test, git push (3 commands)
- Code style: async/await preferred, TypeScript strict mode

Agent Performance:
- backend-architect: 94% success (28 spawns) [improving]
- test-generator: 72% success (18 spawns) [declining]

Context Savings: ~8k tokens/session (estimated)

Storage: .claude/feedback/ (45 KB)
```

### pause

Temporarily pause all learning without clearing data.

**Action:**
1. Set `pausedUntil` in preferences to a far future date
2. Confirm to user

**Output:**
```
Feedback learning paused

Your existing patterns are preserved.
Resume with: /feedback resume
```

### resume

Resume paused learning.

**Action:**
1. Clear `pausedUntil` in preferences
2. Confirm to user

**Output:**
```
Feedback learning resumed

The system will continue learning from your usage.
```

### reset

Clear all learned patterns (requires confirmation).

**Action:**
1. Show what will be deleted
2. Ask for confirmation (user must type "RESET")
3. If confirmed, clear patterns file but keep preferences

**Output (before confirmation):**
```
WARNING: This will clear all learned patterns:

- 5 auto-approve permission rules
- 3 code style preferences
- Agent performance history

Your preferences (enabled, sharing, retention) will be kept.

To confirm, respond with exactly: RESET
To cancel, respond with anything else.
```

**Output (after confirmation):**
```
Feedback data reset

- Cleared 5 permission patterns
- Cleared 3 style preferences
- Cleared agent metrics

Learning will start fresh from now.
```

### export

Export all feedback data to a JSON file.

**Action:**
1. Read all feedback files
2. Combine into single export
3. Write to `.claude/feedback/export-{date}.json`

**Output:**
```
Exported feedback data to:
   .claude/feedback/export-2026-01-14.json

Contains:
- 5 learned permission patterns
- 3 code style preferences
- 8 skill usage metrics
- 4 agent performance records

File size: 12 KB
```

### settings

Show current settings with option to change.

**Output:**
```
Feedback Settings
-----------------------------
enabled:              true   (master switch)
learnFromEdits:       true   (learn from code edits)
learnFromApprovals:   true   (learn from permissions)
learnFromAgentOutcomes: true (track agent success)
shareAnonymized:      false  (share anonymous stats)
retentionDays:        90     (data retention period)

To change a setting, use:
  /feedback settings <key> <value>

Example:
  /feedback settings retentionDays 30
```

### opt-in / opt-out

Enable or disable anonymous analytics sharing.

**opt-in Output:**
```
Anonymous analytics sharing enabled.

What we share (anonymized):
  - Skill usage counts and success rates
  - Agent performance metrics
  - Hook trigger counts

What we NEVER share:
  - Your code or file contents
  - Project names or paths
  - Personal information
  - mem0 memory data

Disable anytime: /feedback opt-out
```

**opt-out Output:**
```
Anonymous analytics sharing disabled.

Your feedback data stays completely local.
No usage data is shared.

Re-enable anytime: /feedback opt-in
```

### export-analytics

Export anonymous analytics data to a file for review before sharing.

**Usage:**
```
/feedback export-analytics [path]
```

If no path is provided, exports to `.claude/feedback/analytics-exports/` with a timestamp.

**Output:**
```
Analytics exported to: .claude/feedback/analytics-exports/analytics-export-20260114-120000.json

Contents preview:
-----------------
Date: 2026-01-14
Plugin Version: 4.12.0

Summary:
  Skills used: 8
  Skill invocations: 45
  Agents used: 3
  Agent spawns: 12
  Hooks configured: 5

Please review the exported file before sharing.
```

**Export Format:**
```json
{
  "timestamp": "2026-01-14",
  "plugin_version": "4.12.0",
  "skill_usage": {
    "api-design-framework": { "uses": 12, "success_rate": 0.92 }
  },
  "agent_performance": {
    "backend-system-architect": { "spawns": 8, "success_rate": 0.88 }
  },
  "hook_metrics": {
    "git-branch-protection": { "triggered": 45, "blocked": 3 }
  },
  "summary": {
    "unique_skills_used": 8,
    "unique_agents_used": 3,
    "hooks_configured": 5,
    "total_skill_invocations": 45,
    "total_agent_spawns": 12
  },
  "metadata": {
    "exported_at": "2026-01-14T12:00:00Z",
    "format_version": "1.0",
    "note": "Review before sharing"
  }
}
```

## What We Share (When Opted In)

Anonymous analytics include only aggregated, non-identifiable data:

| Data Type | What's Included | What's NOT Included |
|-----------|-----------------|---------------------|
| Skills | Usage counts, success rates | File paths, code content |
| Agents | Spawn counts, success rates | Project names, decisions |
| Hooks | Trigger/block counts | Command content, paths |

## What We NEVER Share

The following are **blocked by design** and never included in analytics:

- Project names, paths, or directory structure
- File contents, code, or diffs
- Decision content or context
- User identity, email, or credentials
- mem0 memory data
- URLs, IP addresses, or hostnames
- Any strings that could identify the project or user

## Security Note

The following commands are NEVER auto-approved regardless of learning:
- `rm -rf`, `sudo`, `chmod 777`
- Commands with `--force` or `--no-verify`
- Commands involving passwords, secrets, or credentials

## File Locations

See `references/file-locations.md` for storage details.

### Analytics Files

```
.claude/feedback/
├── preferences.json           # User preferences including shareAnonymized
├── metrics.json              # Source data for analytics
└── analytics-exports/        # Exported analytics for review
    └── analytics-export-*.json
```