# Feedback File Locations

All feedback data is stored locally in the project.

## Storage Paths

```
.claude/feedback/
├── preferences.json       # User preferences and settings
├── metrics.json           # Skill and agent usage metrics
├── learned-patterns.json  # Auto-approve patterns and code style
├── satisfaction.json      # Session satisfaction tracking
└── analytics-exports/     # Anonymous analytics exports for review
    └── analytics-export-*.json
```

## File Descriptions

### preferences.json
```json
{
  "version": "1.0",
  "enabled": true,
  "learnFromEdits": true,
  "learnFromApprovals": true,
  "learnFromAgentOutcomes": true,
  "shareAnonymized": false,
  "syncGlobalPatterns": true,
  "retentionDays": 90,
  "pausedUntil": null
}
```

### metrics.json
```json
{
  "version": "1.0",
  "updated": "2026-01-14T10:00:00Z",
  "skills": { ... },
  "hooks": { ... },
  "agents": { ... }
}
```

### learned-patterns.json
```json
{
  "version": "1.0",
  "updated": "2026-01-14T10:00:00Z",
  "permissions": { ... },
  "codeStyle": { ... }
}
```

### analytics-export-*.json

Anonymous analytics exports for user review before sharing.

```json
{
  "timestamp": "2026-01-14",
  "plugin_version": "4.12.0",
  "skill_usage": {
    "<skill-id>": { "uses": 12, "success_rate": 0.92 }
  },
  "agent_performance": {
    "<agent-id>": { "spawns": 8, "success_rate": 0.88 }
  },
  "hook_metrics": {
    "<hook-name>": { "triggered": 45, "blocked": 3 }
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

## Gitignore

All files in `.claude/feedback/` are gitignored by default.

Add to your `.gitignore`:
```
.claude/feedback/
```

## Global Patterns

Cross-project patterns are stored at:
```
~/.claude/global-patterns.json
```

This file is shared across all projects when `syncGlobalPatterns` is enabled.

## Analytics Library

The analytics-lib.sh script provides functions for preparing anonymous analytics:

```
.claude/scripts/analytics-lib.sh
```

Key functions:
- `prepare_anonymous_report()` - Aggregate anonymized data
- `get_shareable_metrics()` - Get only safe-to-share metrics
- `validate_no_pii(data)` - Verify no PII in data
- `export_analytics(filepath)` - Export to file for user review
- `opt_in_analytics()` - Enable anonymous sharing
- `opt_out_analytics()` - Disable anonymous sharing