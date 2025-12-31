#!/bin/bash
# Common utilities for Claude Code hooks
# Source this file: source "$(dirname "$0")/../_lib/common.sh"

# Colors for output (only if stderr is a terminal)
if [[ -t 2 ]]; then
  RED='\033[0;31m'
  GREEN='\033[0;32m'
  YELLOW='\033[1;33m'
  BLUE='\033[0;34m'
  CYAN='\033[0;36m'
  NC='\033[0m' # No Color
else
  RED='' GREEN='' YELLOW='' BLUE='' CYAN='' NC=''
fi

# Log directory
HOOK_LOG_DIR="${CLAUDE_PROJECT_DIR:-.}/.claude/logs"
mkdir -p "$HOOK_LOG_DIR" 2>/dev/null

# Read and cache hook input from stdin (with timeout to prevent hanging)
_HOOK_INPUT=""
read_hook_input() {
  if [[ -z "$_HOOK_INPUT" ]]; then
    # Use read with timeout - works on macOS and Linux
    # -t 1 = 1 second timeout, -d '' = read until null (entire input)
    if ! IFS= read -r -t 2 -d '' _HOOK_INPUT 2>/dev/null; then
      # Timeout or EOF reached - that's fine, use what we got
      :
    fi
  fi
  echo "$_HOOK_INPUT"
}

# Extract field from hook input using jq
# Usage: get_field '.tool_input.command'
#
# SECURITY (ME-002): This function passes the first argument directly to jq.
# ONLY pass STATIC filter strings - never pass user-controlled input!
#
# Safe:   get_field '.tool_input.file_path'
# Safe:   get_field '.session_id'
# UNSAFE: get_field "$USER_INPUT"  # NEVER DO THIS - jq filter injection risk
#
get_field() {
  local filter="$1"
  local input=$(read_hook_input)
  echo "$input" | jq -r "$filter // \"\"" 2>/dev/null
}

# Get tool name
get_tool_name() {
  get_field '.tool_name'
}

# Get session ID
get_session_id() {
  get_field '.session_id'
}

# Log to hook log file
# Usage: log_hook "message"
log_hook() {
  local msg="$1"
  local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
  local hook_name=$(basename "${BASH_SOURCE[1]:-$0}" .sh)
  echo "[$timestamp] [$hook_name] $msg" >> "$HOOK_LOG_DIR/hooks.log"
}

# Print info message to stderr
info() {
  echo -e "${BLUE}ℹ${NC} $1" >&2
}

# Print success message to stderr
success() {
  echo -e "${GREEN}✓${NC} $1" >&2
}

# Print warning message to stderr
warn() {
  echo -e "${YELLOW}⚠${NC} $1" >&2
}

# Print error message to stderr
error() {
  echo -e "${RED}✗${NC} $1" >&2
}

# Block with formatted error box
# Usage: block_with_error "Title" "Message"
block_with_error() {
  local title="$1"
  local message="$2"
  cat >&2 << EOF
╔══════════════════════════════════════════════════════════════════════════════╗
║  🚫 BLOCKED: $title
╚══════════════════════════════════════════════════════════════════════════════╝

$message

EOF
  exit 2
}

# Warn with formatted warning box (doesn't block)
# Usage: warn_with_box "Title" "Message"
warn_with_box() {
  local title="$1"
  local message="$2"
  cat >&2 << EOF
╔══════════════════════════════════════════════════════════════════════════════╗
║  ⚠️  WARNING: $title
╚══════════════════════════════════════════════════════════════════════════════╝

$message

EOF
}

# Check if command matches a pattern
# Usage: command_matches "git commit"
command_matches() {
  local pattern="$1"
  local cmd=$(get_field '.tool_input.command')
  [[ "$cmd" =~ $pattern ]]
}

# Get current git branch
get_current_branch() {
  cd "$CLAUDE_PROJECT_DIR" && git branch --show-current 2>/dev/null
}

# Check if on protected branch
is_protected_branch() {
  local branch=$(get_current_branch)
  [[ "$branch" == "dev" || "$branch" == "main" || "$branch" == "master" ]]
}

# Metrics file path
METRICS_FILE="/tmp/claude-session-metrics.json"

# Update metrics counter
# Usage: increment_metric "tool_name"
increment_metric() {
  local tool="$1"
  local session_id=$(get_session_id)

  if [[ ! -f "$METRICS_FILE" ]]; then
    echo '{"tools":{},"sessions":{}}' > "$METRICS_FILE"
  fi

  # Increment tool counter
  local current=$(jq -r ".tools.\"$tool\" // 0" "$METRICS_FILE")
  jq ".tools.\"$tool\" = $((current + 1))" "$METRICS_FILE" > "${METRICS_FILE}.tmp" && mv "${METRICS_FILE}.tmp" "$METRICS_FILE"
}

# Export functions for subshells
export -f read_hook_input get_field get_tool_name get_session_id log_hook info success warn error
