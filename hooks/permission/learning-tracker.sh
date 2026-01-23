#!/bin/bash
# Permission Learning Tracker - Learns from user approval patterns
# Hook: PermissionRequest (Post-approval tracking)
exec node "${CLAUDE_PLUGIN_ROOT:-${CLAUDE_PROJECT_DIR:-.}}/hooks/bin/run-hook.mjs" "permission/learning-tracker"
