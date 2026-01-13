#!/bin/bash
# Mem0 Pre-Compaction Sync Hook
# Prompts Claude to save important session context to Mem0 before compaction
#
# Version: 1.1.0 - Simplified for robustness

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Simple exit if no decisions to sync
DECISION_LOG="$PLUGIN_ROOT/.claude/coordination/decision-log.json"
if [[ ! -f "$DECISION_LOG" ]]; then
    echo '{"continue":true}'
    exit 0
fi

# Count recent decisions (last 24h would be ideal, but just check if file has content)
DECISION_COUNT=$(jq '.decisions | length' "$DECISION_LOG" 2>/dev/null || echo "0")
if [[ "$DECISION_COUNT" == "0" || "$DECISION_COUNT" == "null" ]]; then
    echo '{"continue":true}'
    exit 0
fi

# Get project name
PROJECT_NAME=$(basename "${CLAUDE_PROJECT_DIR:-$(pwd)}")

# Build simple reminder message
MSG="If significant decisions were made this session, consider saving them to Mem0 using mcp__mem0__add-memory."

# Output valid JSON
printf '{"continue":true,"systemMessage":"%s"}\n' "$MSG"