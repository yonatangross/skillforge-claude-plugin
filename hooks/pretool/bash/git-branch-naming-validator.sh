#!/bin/bash
# Git Branch Naming Validator - Enforces branch naming conventions
# Hook: PreToolUse (Bash)
exec node "${CLAUDE_PLUGIN_ROOT:-${CLAUDE_PROJECT_DIR:-.}}/hooks/bin/run-hook.mjs" "pretool/bash/git-branch-naming-validator"
