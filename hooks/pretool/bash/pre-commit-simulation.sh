#!/bin/bash
# Pre-Commit Simulation - Simulates pre-commit hooks before commit
# Hook: PreToolUse (Bash)
exec node "${CLAUDE_PLUGIN_ROOT:-${CLAUDE_PROJECT_DIR:-.}}/hooks/bin/run-hook.mjs" "pretool/bash/pre-commit-simulation"
