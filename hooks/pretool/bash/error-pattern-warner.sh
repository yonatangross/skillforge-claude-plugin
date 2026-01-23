#!/bin/bash
# Error Pattern Warner - Warns about known error patterns in commands
# Hook: PreToolUse (Bash)
exec node "${CLAUDE_PLUGIN_ROOT:-${CLAUDE_PROJECT_DIR:-.}}/hooks/bin/run-hook.mjs" "pretool/bash/error-pattern-warner"
