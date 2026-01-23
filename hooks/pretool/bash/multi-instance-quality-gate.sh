#!/bin/bash
# Multi-Instance Quality Gate - Quality checks for multi-instance coordination
# Hook: PreToolUse (Bash)
exec node "${CLAUDE_PLUGIN_ROOT:-${CLAUDE_PROJECT_DIR:-.}}/hooks/bin/run-hook.mjs" "pretool/bash/multi-instance-quality-gate"
