#!/bin/bash
# Agent Memory Inject - Injects actionable memory load instructions before agent spawn
# Hook: SubagentStart (Task)
exec node "${CLAUDE_PLUGIN_ROOT:-${CLAUDE_PROJECT_DIR:-.}}/hooks/bin/run-hook.mjs" "subagent-start/agent-memory-inject"
