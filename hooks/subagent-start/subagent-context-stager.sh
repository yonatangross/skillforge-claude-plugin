#!/bin/bash
# Subagent Context Stager - Stages relevant context files for subagent
# Hook: SubagentStart (Task)
exec node "${CLAUDE_PLUGIN_ROOT:-${CLAUDE_PROJECT_DIR:-.}}/hooks/bin/run-hook.mjs" "subagent-start/subagent-context-stager"
