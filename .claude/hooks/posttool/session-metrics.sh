#!/bin/bash
set -euo pipefail
# Session Metrics - Tracks tool usage statistics
# Hook: PostToolUse (*)

source "$(dirname "$0")/../_lib/common.sh"

TOOL_NAME=$(get_tool_name)
METRICS_FILE="/tmp/claude-session-metrics.json"

# Initialize metrics file if needed
if [[ ! -f "$METRICS_FILE" ]]; then
  echo '{"tools":{},"errors":0,"warnings":0}' > "$METRICS_FILE"
fi

# Increment tool counter
CURRENT=$(jq -r ".tools.\"$TOOL_NAME\" // 0" "$METRICS_FILE" 2>/dev/null)
jq ".tools.\"$TOOL_NAME\" = $((CURRENT + 1))" "$METRICS_FILE" > "${METRICS_FILE}.tmp" 2>/dev/null
mv "${METRICS_FILE}.tmp" "$METRICS_FILE" 2>/dev/null

exit 0
