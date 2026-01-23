#!/bin/bash
# Git Branch Protection - Blocks direct commits to protected branches
# Hook: PreToolUse (Bash)
# CC 2.1.9: Uses additionalContext for proactive guidance
exec node "${CLAUDE_PLUGIN_ROOT:-${CLAUDE_PROJECT_DIR:-.}}/hooks/bin/run-hook.mjs" "pretool/bash/git-branch-protection"
