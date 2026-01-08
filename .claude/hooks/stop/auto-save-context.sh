#!/bin/bash
set -euo pipefail
# Auto-Save Context - Saves session context before stop
# Hook: Stop
# CC 2.1.1 Compliant - Context Protocol 2.0

source "$(dirname "$0")/../_lib/common.sh"

log_hook "Stop hook - auto-saving context (Protocol 2.0)"

# Context Protocol 2.0 paths
SESSION_STATE="$CLAUDE_PROJECT_DIR/.claude/context/session/state.json"
SESSION_DIR="$CLAUDE_PROJECT_DIR/.claude/context/session"

# Ensure session directory exists
mkdir -p "$SESSION_DIR" 2>/dev/null || true

# Update session state with timestamp
TIMESTAMP=$(date -Iseconds)

if [[ -f "$SESSION_STATE" ]]; then
  # Update existing session state
  jq --arg ts "$TIMESTAMP" '.last_activity = $ts' "$SESSION_STATE" > "${SESSION_STATE}.tmp" 2>/dev/null && \
    mv "${SESSION_STATE}.tmp" "$SESSION_STATE" 2>/dev/null && \
    log_hook "Updated session state timestamp"
else
  # Create minimal session state
  jq -n --arg ts "$TIMESTAMP" '{
    schema_version: "2.0.0",
    session_id: "",
    started_at: $ts,
    last_activity: $ts,
    active_agent: null,
    tasks_pending: [],
    tasks_completed: []
  }' > "$SESSION_STATE" 2>/dev/null && \
    log_hook "Created new session state"
fi

# Output CC 2.1.1 compliant response
echo '{"systemMessage":"Context saved (Protocol 2.0)","continue":true}'
exit 0