#!/bin/bash
# Mem0 Cleanup Hook - Bulk cleanup of old memories
# Hook: Setup (maintenance)
# CC 2.1.7 Compliant
#
# Features:
# - Uses batch-delete.py for efficient bulk cleanup
# - Removes stale memories based on age criteria
# - Queries memories via get-memories.py and filters by age
#
# Version: 2.0.0 - Implemented real batch deletion

set -euo pipefail

_HOOK_INPUT=$(cat 2>/dev/null || true)
# Dont export - large inputs overflow environment

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../_lib/common.sh" 2>/dev/null || true
source "$SCRIPT_DIR/../_lib/mem0.sh" 2>/dev/null || true

log_hook "Mem0 cleanup starting"

# Check if mem0 is available
if ! is_mem0_available 2>/dev/null; then
    log_hook "Mem0 not available, skipping cleanup"
    echo '{"continue":true,"suppressOutput":true}'
    exit 0
fi

# Configuration
PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-$SCRIPT_DIR/../..}"
SCRIPTS_DIR="$PLUGIN_ROOT/skills/mem0-memory/scripts"
BATCH_DELETE_SCRIPT="$SCRIPTS_DIR/batch/batch-delete.py"
GET_MEMORIES_SCRIPT="$SCRIPTS_DIR/crud/get-memories.py"

# Age threshold (days) - memories older than this may be cleaned up
AGE_THRESHOLD="${MEM0_CLEANUP_AGE_DAYS:-90}"

# Check if required scripts exist
if [[ ! -f "$BATCH_DELETE_SCRIPT" ]]; then
    log_hook "Batch delete script not found at $BATCH_DELETE_SCRIPT, skipping cleanup"
    echo '{"continue":true,"suppressOutput":true}'
    exit 0
fi

if [[ ! -f "$GET_MEMORIES_SCRIPT" ]]; then
    log_hook "Get memories script not found at $GET_MEMORIES_SCRIPT, skipping cleanup"
    echo '{"continue":true,"suppressOutput":true}'
    exit 0
fi

# Check if MEM0_API_KEY is available
if [[ -z "${MEM0_API_KEY:-}" ]]; then
    log_hook "MEM0_API_KEY not set, skipping cleanup"
    echo '{"continue":true,"suppressOutput":true}'
    exit 0
fi

LOG_FILE="${CLAUDE_PROJECT_DIR:-.}/.claude/logs/mem0-cleanup.log"
mkdir -p "$(dirname "$LOG_FILE")" 2>/dev/null || true

# Calculate cutoff date (days ago)
CUTOFF_DATE=$(date -v-${AGE_THRESHOLD}d +%Y-%m-%d 2>/dev/null || date -d "${AGE_THRESHOLD} days ago" +%Y-%m-%d 2>/dev/null || echo "")

if [[ -z "$CUTOFF_DATE" ]]; then
    log_hook "Could not calculate cutoff date, skipping cleanup"
    echo '{"continue":true,"suppressOutput":true}'
    exit 0
fi

log_hook "Querying memories older than $CUTOFF_DATE (${AGE_THRESHOLD} days)"
echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Cleanup started - threshold: $CUTOFF_DATE" >> "$LOG_FILE"

# Get all memories and filter by date
MEMORIES_JSON=$(python3 "$GET_MEMORIES_SCRIPT" 2>/dev/null || echo '{"memories":[]}')

# Extract memory IDs older than threshold
# Memory format: {"memories": [{"id": "mem_xxx", "created_at": "2025-01-01T...", ...}]}
STALE_IDS=$(echo "$MEMORIES_JSON" | jq -r --arg cutoff "$CUTOFF_DATE" '
    .memories // [] |
    map(select(
        (.created_at // "" | split("T")[0]) < $cutoff and
        (.metadata.protected // false) == false
    )) |
    .[].id // empty
' 2>/dev/null | head -100)  # Limit to 100 per run

if [[ -z "$STALE_IDS" ]]; then
    log_hook "No stale memories found older than $CUTOFF_DATE"
    echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] No stale memories found" >> "$LOG_FILE"
    echo '{"continue":true,"suppressOutput":true}'
    exit 0
fi

# Convert to JSON array
IDS_ARRAY=$(echo "$STALE_IDS" | jq -R -s 'split("\n") | map(select(length > 0))')
STALE_COUNT=$(echo "$IDS_ARRAY" | jq 'length')

log_hook "Found $STALE_COUNT stale memories to delete"
echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Found $STALE_COUNT stale memories" >> "$LOG_FILE"

# Execute batch delete
RESULT=$(python3 "$BATCH_DELETE_SCRIPT" --memory-ids "$IDS_ARRAY" 2>&1)
DELETE_STATUS=$?

if [[ $DELETE_STATUS -eq 0 ]]; then
    log_hook "Successfully deleted $STALE_COUNT stale memories"
    echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Deleted $STALE_COUNT memories successfully" >> "$LOG_FILE"
else
    log_hook "Batch delete failed: $RESULT"
    echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Delete failed: $RESULT" >> "$LOG_FILE"
fi

log_hook "Mem0 cleanup complete (age threshold: ${AGE_THRESHOLD} days)"

echo '{"continue":true,"suppressOutput":true}'
exit 0
