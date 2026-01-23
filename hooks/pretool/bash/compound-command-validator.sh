#!/bin/bash
# Compound Command Validator - Validates multi-command sequences for security
# Hook: PreToolUse (Bash)
exec node "${CLAUDE_PLUGIN_ROOT:-${CLAUDE_PROJECT_DIR:-.}}/hooks/bin/run-hook.mjs" "pretool/bash/compound-command-validator"
