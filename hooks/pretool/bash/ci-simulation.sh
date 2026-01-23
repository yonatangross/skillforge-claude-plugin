#!/bin/bash
# CI Simulation - Reminds to run CI checks before commits
# Hook: PreToolUse (Bash)
exec node "${CLAUDE_PLUGIN_ROOT:-${CLAUDE_PROJECT_DIR:-.}}/hooks/bin/run-hook.mjs" "pretool/bash/ci-simulation"
