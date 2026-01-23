#!/bin/bash
# Context Gate - Prevents context overflow by limiting concurrent background agents
# Hook: SubagentStart (Task)
exec node "${CLAUDE_PLUGIN_ROOT:-${CLAUDE_PROJECT_DIR:-.}}/hooks/bin/run-hook.mjs" "subagent-start/context-gate"
