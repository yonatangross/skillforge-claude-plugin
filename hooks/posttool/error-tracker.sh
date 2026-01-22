#!/bin/bash
# Error Tracker - Tracks and logs tool errors
# CC 2.1.7 Compliant: Self-contained hook with stdin reading and self-guard
# Hook: PostToolUse (Bash)
set -euo pipefail

# Read stdin BEFORE sourcing common.sh
_HOOK_INPUT=$(cat)
# NOTE: Dont export - large inputs overflow environment

source "$(dirname "$0")/../_lib/common.sh"

# Self-guard: Only run for non-trivial bash commands
guard_nontrivial_bash || exit 0

TOOL_NAME=$(get_tool_name)
TOOL_ERROR=$(get_field '.tool_error // ""')
EXIT_CODE=$(get_field '.exit_code // ""')

# Check if there was an error
if [[ -n "$TOOL_ERROR" ]] || [[ "$EXIT_CODE" != "0" && "$EXIT_CODE" != "" && "$EXIT_CODE" != "null" ]]; then
  log_hook "ERROR: $TOOL_NAME failed (exit: $EXIT_CODE)"

  # Track error count
  METRICS_FILE="/tmp/claude-session-metrics.json"
  if [[ -f "$METRICS_FILE" ]]; then
    ERRORS=$(jq -r '.errors // 0' "$METRICS_FILE" 2>/dev/null || echo "0")
    jq ".errors = $((ERRORS + 1))" "$METRICS_FILE" > "${METRICS_FILE}.tmp" 2>/dev/null && \
      mv "${METRICS_FILE}.tmp" "$METRICS_FILE" 2>/dev/null || true
  fi

  # Log error details
  ERROR_LOG="${CLAUDE_PROJECT_DIR:-.}/.claude/logs/errors.log"
  mkdir -p "$(dirname "$ERROR_LOG")" 2>/dev/null || true
  TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
  echo "[$TIMESTAMP] $TOOL_NAME | exit: $EXIT_CODE | ${TOOL_ERROR:0:200}" >> "$ERROR_LOG" 2>/dev/null || true
fi

output_silent_success
exit 0