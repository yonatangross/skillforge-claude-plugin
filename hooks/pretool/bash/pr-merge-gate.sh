#!/bin/bash
# PR Merge Gate - Triggers merge-readiness check for PR/merge commands
# Hook: PreToolUse (Bash)
exec node "${CLAUDE_PLUGIN_ROOT:-${CLAUDE_PROJECT_DIR:-.}}/hooks/bin/run-hook.mjs" "pretool/bash/pr-merge-gate"
