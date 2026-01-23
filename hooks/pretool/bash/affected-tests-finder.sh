#!/bin/bash
# Affected Tests Finder - Identifies tests affected by code changes
# Hook: PreToolUse (Bash)
exec node "${CLAUDE_PLUGIN_ROOT:-${CLAUDE_PROJECT_DIR:-.}}/hooks/bin/run-hook.mjs" "pretool/bash/affected-tests-finder"
