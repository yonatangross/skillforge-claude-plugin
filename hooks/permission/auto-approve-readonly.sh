#!/bin/bash
# Auto-Approve Readonly - Automatically approves read-only operations
# Hook: PermissionRequest (Read|Glob|Grep)
exec node "${CLAUDE_PLUGIN_ROOT:-${CLAUDE_PROJECT_DIR:-.}}/hooks/bin/run-hook.mjs" "permission/auto-approve-readonly"
