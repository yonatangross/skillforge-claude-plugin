#!/bin/bash
# Stop Dispatcher - Runs all stop hooks and outputs combined status
# Consolidates: task-completion-check, auto-save-context
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RESULTS=()

# ANSI colors
GREEN='\033[32m'
CYAN='\033[36m'
RESET='\033[0m'

# Helper to run a hook
run_hook() {
  local name="$1"
  local script="$2"

  if [[ ! -f "$script" ]]; then
    return 0
  fi

  # Run hook, capture stderr for logs, ignore stdout systemMessage
  if bash "$script" >/dev/null 2>&1; then
    RESULTS+=("$name")
  fi

  return 0
}

# Run stop hooks in order
run_hook "Tasks" "$SCRIPT_DIR/task-completion-check.sh"
run_hook "Context" "$SCRIPT_DIR/auto-save-context.sh"

# Build combined output
if [[ ${#RESULTS[@]} -gt 0 ]]; then
  # Format: Stop: ✓ Check1 | ✓ Check2
  MSG="${CYAN}Stop:${RESET}"
  for i in "${!RESULTS[@]}"; do
    if [[ $i -gt 0 ]]; then
      MSG="$MSG |"
    fi
    MSG="$MSG ${GREEN}✓${RESET} ${RESULTS[$i]}"
  done
  echo "{\"systemMessage\": \"$MSG\"}"
fi

exit 0