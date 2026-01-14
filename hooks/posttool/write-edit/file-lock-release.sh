#!/bin/bash
# File Lock Release - Release locks after successful Write/Edit
# CC 2.1.7 Compliant: Self-contained hook with stdin reading and self-guard
# Hook: PostToolUse (Write|Edit)
set -euo pipefail

# Read stdin BEFORE sourcing common.sh
_HOOK_INPUT=$(cat)
export _HOOK_INPUT

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../../_lib/common.sh"

# Self-guard: Only run for Write/Edit
guard_tool "Write" "Edit" || exit 0

# Self-guard: Only run if multi-instance coordination is enabled
guard_multi_instance || exit 0

# Source coordination lib
COORD_LIB="${SCRIPT_DIR}/../../../coordination/lib/coordination.sh"
if [[ ! -f "$COORD_LIB" ]]; then
    output_silent_success
    exit 0
fi
source "$COORD_LIB" 2>/dev/null || { output_silent_success; exit 0; }

# Load instance ID
if [[ -f "${CLAUDE_PROJECT_DIR}/.claude/.instance_env" ]]; then
  source "${CLAUDE_PROJECT_DIR}/.claude/.instance_env"
  export INSTANCE_ID="${CLAUDE_INSTANCE_ID:-}"
fi

# Get file path
FILE_PATH=$(get_field '.tool_input.file_path')
[[ -z "$FILE_PATH" ]] && { output_silent_success; exit 0; }

# Skip coordination directory files
[[ "$FILE_PATH" =~ /.claude/coordination/ ]] && { output_silent_success; exit 0; }

# Check for errors in tool result
TOOL_RESULT=$(get_field '.tool_result // ""')
if [[ "$TOOL_RESULT" == *"error"* ]] || [[ "$TOOL_RESULT" == *"Error"* ]]; then
    # Keep lock on error, will auto-expire
    output_silent_success
    exit 0
fi

# Release lock
coord_release_lock "$FILE_PATH" 2>/dev/null || true

output_silent_success
exit 0