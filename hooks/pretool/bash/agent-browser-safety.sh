#!/bin/bash
# Agent Browser Safety - Validates agent-browser CLI commands for safety
# Hook: PreToolUse (Bash)
exec node "${CLAUDE_PLUGIN_ROOT:-${CLAUDE_PROJECT_DIR:-.}}/hooks/bin/run-hook.mjs" "pretool/bash/agent-browser-safety"
