#!/bin/bash
# Changelog Generator - Injects auto-generated changelog before releases
# Hook: PreToolUse (Bash)
exec node "${CLAUDE_PLUGIN_ROOT:-${CLAUDE_PROJECT_DIR:-.}}/hooks/bin/run-hook.mjs" "pretool/bash/changelog-generator"
