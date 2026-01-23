#!/bin/bash
# Git Atomic Commit Checker - Warns about potentially non-atomic commits
# Hook: PreToolUse (Bash)
exec node "${CLAUDE_PLUGIN_ROOT:-${CLAUDE_PROJECT_DIR:-.}}/hooks/bin/run-hook.mjs" "pretool/bash/git-atomic-commit-checker"
