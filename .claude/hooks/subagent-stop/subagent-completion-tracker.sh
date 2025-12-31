#!/bin/bash
set -euo pipefail
# Subagent Completion Tracker - Tracks when subagents complete
# Hook: SubagentStop

source "$(dirname "$0")/../_lib/common.sh"

AGENT_ID=$(get_field '.agent_id')
SUBAGENT_TYPE=$(get_field '.subagent_type')
RESULT=$(get_field '.result' | head -c 200)

log_hook "Subagent completed: $SUBAGENT_TYPE ($AGENT_ID)"

# Track completion for analytics
COMPLETION_LOG="/tmp/claude-subagent-completions.log"
echo "$(date -Iseconds) | $SUBAGENT_TYPE | $AGENT_ID | ${RESULT:0:100}" >> "$COMPLETION_LOG"

exit 0
