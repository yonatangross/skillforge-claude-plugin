#!/bin/bash
# GitHub Issue Creation Guide - Injects context before gh issue create
# Hook: PreToolUse (Bash)
exec node "${CLAUDE_PLUGIN_ROOT:-${CLAUDE_PROJECT_DIR:-.}}/hooks/bin/run-hook.mjs" "pretool/bash/gh-issue-creation-guide"
