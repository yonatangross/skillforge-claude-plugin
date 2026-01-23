#!/bin/bash
# Default Timeout Setter - Sets default timeouts for long-running commands
# Hook: PreToolUse (Bash)
exec node "${CLAUDE_PLUGIN_ROOT:-${CLAUDE_PROJECT_DIR:-.}}/hooks/bin/run-hook.mjs" "pretool/bash/default-timeout-setter"
