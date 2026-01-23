#!/bin/bash
# Issue Documentation Requirement - Ensures docs exist before issue branches
# Hook: PreToolUse (Bash)
exec node "${CLAUDE_PLUGIN_ROOT:-${CLAUDE_PROJECT_DIR:-.}}/hooks/bin/run-hook.mjs" "pretool/bash/issue-docs-requirement"
