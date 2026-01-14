#!/bin/bash
set -euo pipefail
# Decision Sync Script
# Synchronizes decision-log.json with mem0 cloud storage
#
# Usage:
#   decision-sync.sh status  - Show sync status
#   decision-sync.sh pending - List decisions pending sync
#   decision-sync.sh export  - Export pending decisions in mem0 format
#   decision-sync.sh sync    - Output JSON payloads for Claude to call mcp__mem0__add_memory
#   decision-sync.sh pull    - Instructions for retrieving decisions from mem0
#
# Version: 1.1.0
# Part of mem0 Semantic Memory Integration (#40, #47)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${CLAUDE_PROJECT_DIR:-$(pwd)}"

# Source mem0 library if available
MEM0_LIB="${CLAUDE_PLUGIN_ROOT:-$SCRIPT_DIR/../..}/hooks/_lib/mem0.sh"
if [[ -f "$MEM0_LIB" ]]; then
    source "$MEM0_LIB"
fi

# -----------------------------------------------------------------------------
# Configuration
# -----------------------------------------------------------------------------

DECISION_LOG="$PROJECT_ROOT/.claude/coordination/decision-log.json"
SYNC_STATE="$PROJECT_ROOT/.claude/coordination/.decision-sync-state.json"

# -----------------------------------------------------------------------------
# Helper Functions
# -----------------------------------------------------------------------------

# Initialize sync state file
init_sync_state() {
    if [[ ! -f "$SYNC_STATE" ]]; then
        cat > "$SYNC_STATE" << 'EOF'
{
    "version": "1.0",
    "last_sync": null,
    "synced_decisions": [],
    "pending_count": 0
}
EOF
    fi
}

# Get project ID for mem0 user_id
get_project_id() {
    if type mem0_get_project_id &>/dev/null; then
        mem0_get_project_id
    else
        basename "$PROJECT_ROOT" | tr '[:upper:]' '[:lower:]' | tr ' ' '-'
    fi
}

# Get decisions from local file
get_local_decisions() {
    if [[ ! -f "$DECISION_LOG" ]]; then
        echo '[]'
        return
    fi
    jq '.decisions // []' "$DECISION_LOG" 2>/dev/null || echo '[]'
}

# Get already synced decision IDs
get_synced_ids() {
    if [[ ! -f "$SYNC_STATE" ]]; then
        echo '[]'
        return
    fi
    jq '.synced_decisions // []' "$SYNC_STATE" 2>/dev/null || echo '[]'
}

# Get pending (unsynced) decisions
get_pending_decisions() {
    local decisions
    local synced_ids
    decisions=$(get_local_decisions)
    synced_ids=$(get_synced_ids)

    echo "$decisions" | jq --argjson synced "$synced_ids" '
        [.[] | select(.decision_id as $id | $synced | index($id) | not)]
    '
}

# Mark decision as synced
mark_synced() {
    local decision_id="$1"
    local now
    now=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

    init_sync_state

    local tmp_file
    tmp_file=$(mktemp)
    jq --arg id "$decision_id" --arg now "$now" '
        .synced_decisions = (.synced_decisions + [$id] | unique) |
        .last_sync = $now |
        .pending_count = ((.pending_count // 0) - 1 | if . < 0 then 0 else . end)
    ' "$SYNC_STATE" > "$tmp_file" && mv "$tmp_file" "$SYNC_STATE"
}

# Format decision for mem0 storage
format_for_mem0() {
    local decision="$1"
    local project_id
    project_id=$(get_project_id)

    # Extract key fields and format as memory content
    echo "$decision" | jq -r '
        "Decision: " + .decision_id + " (" + .timestamp + ")\n" +
        "Status: " + .status + "\n" +
        "Category: " + (.category // "unknown") + "\n" +
        "Impact: " + (.impact.scope // "unknown") + "\n\n" +
        "Title: " + .title + "\n" +
        "Description: " + (.description // "Not specified") + "\n" +
        (if .made_by.instance_id then "Instance: " + .made_by.instance_id else "" end)
    '
}

# Generate content hash for deduplication
generate_hash() {
    local content="$1"
    echo -n "$content" | md5 2>/dev/null || echo -n "$content" | md5sum | cut -d' ' -f1
}

# -----------------------------------------------------------------------------
# Commands
# -----------------------------------------------------------------------------

cmd_status() {
    init_sync_state

    local total
    local synced
    local pending
    total=$(get_local_decisions | jq 'length')
    synced=$(get_synced_ids | jq 'length')
    pending=$(get_pending_decisions | jq 'length')

    local last_sync
    last_sync=$(jq -r '.last_sync // "never"' "$SYNC_STATE" 2>/dev/null || echo "never")

    local project_id
    project_id=$(get_project_id)
    local user_id="${project_id}-decisions"

    echo "Decision Sync Status"
    echo "===================="
    echo ""
    echo "Project: $project_id"
    echo "User ID: $user_id"
    echo ""
    echo "Local decisions: $total"
    echo "Synced to mem0:  $synced"
    echo "Pending sync:    $pending"
    echo ""
    echo "Last sync: $last_sync"
    echo ""
    echo "Files:"
    echo "  Decision log: $DECISION_LOG"
    echo "  Sync state:   $SYNC_STATE"
}

cmd_pending() {
    local pending
    pending=$(get_pending_decisions)
    local count
    count=$(echo "$pending" | jq 'length')

    if [[ "$count" == "0" ]]; then
        echo "No pending decisions to sync."
        return
    fi

    echo "Pending Decisions ($count)"
    echo "=========================="
    echo ""

    echo "$pending" | jq -r '.[] | "- " + .decision_id + " (" + .timestamp + "): " + (.title | .[0:60]) + "..."'
}

cmd_export() {
    local pending
    pending=$(get_pending_decisions)
    local count
    count=$(echo "$pending" | jq 'length')

    if [[ "$count" == "0" ]]; then
        echo "No pending decisions to export."
        return
    fi

    local project_id
    project_id=$(get_project_id)
    local user_id="${project_id}-decisions"

    echo "Export Format for mem0"
    echo "======================"
    echo ""
    echo "Use mcp__mem0__add_memory with:"
    echo "  user_id: \"$user_id\""
    echo ""

    echo "$pending" | jq -c '.[]' | while read -r decision; do
        local id
        id=$(echo "$decision" | jq -r '.decision_id')
        echo "--- Decision: $id ---"
        format_for_mem0 "$decision"
        echo ""
    done
}

cmd_sync() {
    local pending
    pending=$(get_pending_decisions)
    local count
    count=$(echo "$pending" | jq 'length')

    if [[ "$count" == "0" ]]; then
        echo "No pending decisions to sync."
        return
    fi

    local project_id
    project_id=$(get_project_id)
    local user_id="${project_id}-decisions"

    echo "To sync decisions to mem0, use mcp__mem0__add_memory for each:"
    echo ""

    echo "$pending" | jq -c '.[]' | while read -r decision; do
        local decision_id
        local text_content
        local content_hash

        decision_id=$(echo "$decision" | jq -r '.decision_id')
        text_content=$(format_for_mem0 "$decision")
        content_hash=$(generate_hash "$text_content")

        echo "Decision: $decision_id"
        echo "user_id: \"$user_id\""
        echo "text: \"$(echo "$text_content" | tr '\n' ' ' | sed 's/"/\\"/g')\""
        echo "metadata: {\"category\": \"decision\", \"id\": \"$decision_id\", \"hash\": \"$content_hash\"}"
        echo ""
    done

    echo "After successful mem0 storage, mark decisions as synced by running:"
    echo "  decision-sync.sh mark-synced <decision_id>"
}

cmd_pull() {
    local project_id
    project_id=$(get_project_id)
    local user_id="${project_id}-decisions"

    echo "Retrieving Decisions from mem0"
    echo "==============================="
    echo ""
    echo "To retrieve past decisions from mem0, use:"
    echo ""
    echo "  mcp__mem0__search_memory"
    echo "    user_id: \"$user_id\""
    echo "    query: \"<search terms or decision topic>\""
    echo ""
    echo "Or use the /recall command:"
    echo "  /recall decisions about <topic>"
    echo ""
    echo "Example queries:"
    echo "  - \"architecture decisions\""
    echo "  - \"API design choices\""
    echo "  - \"database schema decisions\""
    echo ""
    echo "The search will return relevant decisions stored in mem0,"
    echo "which can inform current development choices."
}

cmd_mark_synced() {
    local decision_id="${1:-}"

    if [[ -z "$decision_id" ]]; then
        echo "Usage: decision-sync.sh mark-synced <decision_id>"
        exit 1
    fi

    mark_synced "$decision_id"
    echo "Marked $decision_id as synced."
}

cmd_help() {
    echo "Decision Sync - Synchronize decisions with mem0"
    echo ""
    echo "Usage: decision-sync.sh <command>"
    echo ""
    echo "Commands:"
    echo "  status       Show sync status"
    echo "  pending      List decisions pending sync"
    echo "  export       Export pending decisions in mem0 format"
    echo "  sync         Output JSON payloads for mcp__mem0__add_memory calls"
    echo "  pull         Instructions for retrieving decisions from mem0"
    echo "  mark-synced  Mark a decision as synced (after mem0 storage)"
    echo "  help         Show this help"
    echo ""
    echo "Files:"
    echo "  Decision log: .claude/coordination/decision-log.json"
    echo "  Sync state:   .claude/coordination/.decision-sync-state.json"
}

# -----------------------------------------------------------------------------
# Main
# -----------------------------------------------------------------------------

COMMAND="${1:-help}"

case "$COMMAND" in
    status)
        cmd_status
        ;;
    pending)
        cmd_pending
        ;;
    export)
        cmd_export
        ;;
    sync)
        cmd_sync
        ;;
    pull)
        cmd_pull
        ;;
    mark-synced)
        cmd_mark_synced "${2:-}"
        ;;
    help|--help|-h)
        cmd_help
        ;;
    *)
        echo "Unknown command: $COMMAND"
        echo "Run 'decision-sync.sh help' for usage."
        exit 1
        ;;
esac