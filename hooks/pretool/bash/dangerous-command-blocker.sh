#!/bin/bash
# Dangerous Command Blocker - Blocks dangerous shell commands
# Hook: PreToolUse (Bash)
exec node "${CLAUDE_PLUGIN_ROOT:-${CLAUDE_PROJECT_DIR:-.}}/hooks/bin/run-hook.mjs" "pretool/bash/dangerous-command-blocker"
