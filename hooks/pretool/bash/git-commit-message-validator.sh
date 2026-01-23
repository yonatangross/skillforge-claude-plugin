#!/bin/bash
# Git Commit Message Validator - Enforces conventional commit format
# Hook: PreToolUse (Bash)
exec node "${CLAUDE_PLUGIN_ROOT:-${CLAUDE_PROJECT_DIR:-.}}/hooks/bin/run-hook.mjs" "pretool/bash/git-commit-message-validator"
