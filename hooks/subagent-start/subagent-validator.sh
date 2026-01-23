#!/bin/bash
# Subagent Validator - Source of truth for subagent tracking
# Hook: SubagentStart (Task)
exec node "${CLAUDE_PLUGIN_ROOT:-${CLAUDE_PROJECT_DIR:-.}}/hooks/bin/run-hook.mjs" "subagent-start/subagent-validator"
