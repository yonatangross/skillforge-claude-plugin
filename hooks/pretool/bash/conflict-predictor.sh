#!/bin/bash
# Conflict Predictor - Warns before git commit if potential conflicts exist
# Hook: PreToolUse (Bash)
exec node "${CLAUDE_PLUGIN_ROOT:-${CLAUDE_PROJECT_DIR:-.}}/hooks/bin/run-hook.mjs" "pretool/bash/conflict-predictor"
