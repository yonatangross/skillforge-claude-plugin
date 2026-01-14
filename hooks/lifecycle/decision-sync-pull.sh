#!/bin/bash
# Decision Sync Pull - SessionStart Hook
# CC 2.1.6 Compliant: outputs JSON with continue field
# Reminds about retrieving past decisions from mem0 on session start
#
# Part of mem0 Semantic Memory Integration (#47)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Log to hooks log
LOG_DIR="${CLAUDE_PROJECT_DIR:-.}/.claude/logs"
mkdir -p "$LOG_DIR" 2>/dev/null || true
LOG_FILE="$LOG_DIR/hooks.log"

log_hook() {
    local msg="$1"
    echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] [decision-sync-pull] $msg" >> "$LOG_FILE" 2>/dev/null || true
}

# Get project ID for user_id hint
get_project_id() {
    local project_root="${CLAUDE_PROJECT_DIR:-$(pwd)}"
    basename "$project_root" | tr '[:upper:]' '[:lower:]' | tr ' ' '-'
}

project_id=$(get_project_id)
user_id="${project_id}-decisions"

log_hook "Session starting - decision recall available with user_id: $user_id"

# Output reminder for Claude - silent unless decisions are relevant
# This hook is intentionally lightweight to avoid adding noise on every session start
cat << EOF
{
    "continue": true,
    "context": {
        "decision_memory": {
            "user_id": "$user_id",
            "hint": "Use /recall or mcp__mem0__search_memory to retrieve past architectural decisions"
        }
    }
}
EOF

exit 0