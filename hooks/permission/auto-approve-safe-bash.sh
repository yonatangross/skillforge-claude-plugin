#!/bin/bash
# Auto-Approve Safe Bash - Auto-approves safe, read-only bash commands
# Hook: PermissionRequest (Bash)
exec node "${CLAUDE_PLUGIN_ROOT:-${CLAUDE_PROJECT_DIR:-.}}/hooks/bin/run-hook.mjs" "permission/auto-approve-safe-bash"
