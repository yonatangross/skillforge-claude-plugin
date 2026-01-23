#!/bin/bash
# File Guard - Protects sensitive files from modification
# Hook: PreToolUse (Write|Edit)
exec node "${CLAUDE_PLUGIN_ROOT:-${CLAUDE_PROJECT_DIR:-.}}/hooks/bin/run-hook.mjs" "pretool/write-edit/file-guard"
