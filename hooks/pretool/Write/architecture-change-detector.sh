#!/usr/bin/env bash
# Architecture Change Detector - Detects breaking architectural changes
# CC 2.1.7 Compliant: Self-contained hook with stdin reading and self-guard
set -euo pipefail

# Read stdin BEFORE sourcing common.sh
_HOOK_INPUT=$(cat)
export _HOOK_INPUT

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../../_lib/common.sh"

# Self-guard: Only run for architectural paths
guard_path_pattern "**/api/**" "**/services/**" "**/db/**" "**/models/**" "**/workflows/**" || exit 0

# Get file path
FILE_PATH=$(get_field '.tool_input.file_path')
[[ -z "$FILE_PATH" ]] && { output_silent_success; exit 0; }

# Check if file exists (new file vs modification)
if [[ ! -f "$FILE_PATH" ]]; then
    output_silent_success
    exit 0
fi

# Load known patterns if available
PATTERNS_DIR="${CLAUDE_PROJECT_DIR:-.}/.claude/context/patterns"
HAS_PATTERNS=false
[[ -d "$PATTERNS_DIR" ]] && HAS_PATTERNS=true

# Log the detection
LOG_DIR="${CLAUDE_PROJECT_DIR:-.}/.claude/hooks/logs"
mkdir -p "$LOG_DIR" 2>/dev/null || true

echo "[$(date -Iseconds)] ARCH_DETECT: $FILE_PATH (patterns=$HAS_PATTERNS)" >> "$LOG_DIR/architecture-detector.log" 2>/dev/null || true

output_silent_success
exit 0