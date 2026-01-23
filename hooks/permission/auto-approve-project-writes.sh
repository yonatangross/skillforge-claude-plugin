#!/bin/bash
# Auto-Approve Project Writes - Auto-approves writes within project directory
# Hook: PermissionRequest (Write|Edit)
exec node "${CLAUDE_PLUGIN_ROOT:-${CLAUDE_PROJECT_DIR:-.}}/hooks/bin/run-hook.mjs" "permission/auto-approve-project-writes"
