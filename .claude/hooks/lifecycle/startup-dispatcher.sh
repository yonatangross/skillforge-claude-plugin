#!/bin/bash
# SessionStart Dispatcher - Runs all startup hooks and outputs combined status
# CC 2.1.1 Compliant: silent on success, visible on failure
# Consolidates: coordination-init, session-context-loader, session-env-setup
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WARNINGS=()

# ANSI colors
YELLOW=$'\033[33m'
RESET=$'\033[0m'

# Helper to run a hook
run_hook() {
  local name="$1"
  local script="$2"

  if [[ ! -f "$script" ]]; then
    return 0
  fi

  local output
  local exit_code
  output=$(bash "$script" 2>&1) && exit_code=0 || exit_code=$?

  if [[ $exit_code -ne 0 ]]; then
    WARNINGS+=("$name: failed")
  elif [[ "$output" == *"warning"* ]] || [[ "$output" == *"Warning"* ]]; then
    local warn_msg=$(echo "$output" | grep -i "warning" | head -1 | sed 's/.*warning[: ]*//')
    [[ -n "$warn_msg" ]] && WARNINGS+=("$name: $warn_msg")
  fi

  return 0
}

# Run startup hooks in order
run_hook "Coordination" "$SCRIPT_DIR/coordination-init.sh"
run_hook "Context" "$SCRIPT_DIR/session-context-loader.sh"
run_hook "Environment" "$SCRIPT_DIR/session-env-setup.sh"

# Output: silent on success, show warnings if any
if [[ ${#WARNINGS[@]} -gt 0 ]]; then
  WARN_MSG=$(IFS="; "; echo "${WARNINGS[*]}")
  echo "{\"systemMessage\": \"${YELLOW}⚠ ${WARN_MSG}${RESET}\", \"continue\": true}"
else
  # Silent success - no systemMessage
  echo "{\"continue\": true}"
fi

exit 0