#!/bin/bash
set -euo pipefail
# Session Cleanup - Cleans up temporary files at session end
# Hook: SessionEnd

source "$(dirname "$0")/../_lib/common.sh"

log_hook "Session cleanup starting"

# Archive metrics if significant
METRICS_FILE="/tmp/claude-session-metrics.json"
ARCHIVE_DIR="$CLAUDE_PROJECT_DIR/.claude/logs/sessions"

if [[ -f "$METRICS_FILE" ]]; then
  TOTAL_TOOLS=$(jq '[.tools | to_entries[].value] | add // 0' "$METRICS_FILE" 2>/dev/null)

  # Only archive if there were tool calls
  if [[ "$TOTAL_TOOLS" -gt 5 ]]; then
    mkdir -p "$ARCHIVE_DIR" 2>/dev/null
    ARCHIVE_NAME="session-$(date +%Y%m%d-%H%M%S).json"
    cp "$METRICS_FILE" "$ARCHIVE_DIR/$ARCHIVE_NAME"
    log_hook "Archived session metrics to $ARCHIVE_NAME"
  fi
fi

# Clean up old session archives (keep last 20)
if [[ -d "$ARCHIVE_DIR" ]]; then
  cd "$ARCHIVE_DIR" && ls -t | tail -n +21 | xargs rm -f 2>/dev/null
fi

exit 0
