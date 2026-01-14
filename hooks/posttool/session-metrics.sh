#!/bin/bash
# Session Metrics - Tracks tool usage statistics
# CC 2.1.7 Compliant: Self-contained hook with stdin reading
# Hook: PostToolUse (*)
set -euo pipefail

# Read stdin BEFORE sourcing common.sh
_HOOK_INPUT=$(cat)
export _HOOK_INPUT

source "$(dirname "$0")/../_lib/common.sh"

TOOL_NAME=$(get_tool_name)
METRICS_FILE="/tmp/claude-session-metrics.json"
LOCKFILE="${METRICS_FILE}.lock"

# Initialize metrics file if needed
if [[ ! -f "$METRICS_FILE" ]] || [[ ! -s "$METRICS_FILE" ]]; then
  echo '{"tools":{},"errors":0,"warnings":0}' > "$METRICS_FILE"
fi

# Use file locking for concurrent access
(
  if command -v flock >/dev/null 2>&1; then
    flock -w 2 200 || exit 0
  fi

  # Re-check file validity inside lock
  if [[ ! -s "$METRICS_FILE" ]] || ! jq empty "$METRICS_FILE" 2>/dev/null; then
    echo '{"tools":{},"errors":0,"warnings":0}' > "$METRICS_FILE"
  fi

  # Increment tool counter using --arg for safety
  CURRENT=$(jq -r --arg t "$TOOL_NAME" '.tools[$t] // 0' "$METRICS_FILE" 2>/dev/null || echo 0)
  CURRENT=${CURRENT:-0}

  if jq --arg t "$TOOL_NAME" --argjson v "$((CURRENT + 1))" '.tools[$t] = $v' "$METRICS_FILE" > "${METRICS_FILE}.tmp" 2>/dev/null; then
    mv "${METRICS_FILE}.tmp" "$METRICS_FILE" 2>/dev/null || true
  fi
) 200>"$LOCKFILE" 2>/dev/null || true

output_silent_success
exit 0