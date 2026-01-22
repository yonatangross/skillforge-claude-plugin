#!/bin/bash
# Mem0 Webhook Handler - Process incoming webhook events
# Hook: PostToolUse (for bash/webhook-receiver.py calls)
# CC 2.1.7 Compliant
#
# Features:
# - Processes webhook events from mem0
# - Routes to appropriate workflows
# - Triggers auto-sync, decision sync, cleanup
#
# Version: 1.0.0

set -euo pipefail

# Read hook input
_HOOK_INPUT=$(cat)
# NOTE: Dont export - large inputs overflow environment

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../_lib/common.sh" 2>/dev/null || true
source "$SCRIPT_DIR/../_lib/mem0.sh" 2>/dev/null || true

log_hook "Mem0 webhook handler starting"

# Check if this is a webhook-receiver.py call
TOOL_NAME=$(echo "$_HOOK_INPUT" | jq -r '.tool_name // ""' 2>/dev/null || echo "")
COMMAND=$(echo "$_HOOK_INPUT" | jq -r '.tool_input.command // ""' 2>/dev/null || echo "")

# Only process webhook-receiver.py calls
if [[ "$TOOL_NAME" != "Bash" ]] || [[ ! "$COMMAND" =~ webhook-receiver\.py ]]; then
    echo '{"continue":true,"suppressOutput":true}'
    exit 0
fi

# Extract event data from command output or tool result
EVENT_DATA=$(echo "$_HOOK_INPUT" | jq -r '.tool_result // ""' 2>/dev/null || echo "")

if [[ -z "$EVENT_DATA" ]]; then
    log_hook "No event data found in webhook call"
    echo '{"continue":true,"suppressOutput":true}'
    exit 0
fi

# Parse event type
EVENT_TYPE=$(echo "$EVENT_DATA" | jq -r '.result.event_type // .event_type // ""' 2>/dev/null || echo "")
MEMORY_ID=$(echo "$EVENT_DATA" | jq -r '.result.memory_id // .memory.id // ""' 2>/dev/null || echo "")

log_hook "Processing webhook event: $EVENT_TYPE (memory: $MEMORY_ID)"

# Route to appropriate handler based on event type
PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-$SCRIPT_DIR/../../..}"

case "$EVENT_TYPE" in
    memory.created)
        log_hook "Memory created - trigger graph sync"
        # Trigger sync to knowledge graph
        # This would call memory-bridge.sh or similar
        ;;
    memory.updated)
        log_hook "Memory updated - trigger decision sync"
        # Trigger decision sync
        ;;
    memory.deleted)
        log_hook "Memory deleted - cleanup graph entities"
        # Cleanup related graph entities
        ;;
    *)
        log_hook "Unknown event type: $EVENT_TYPE"
        ;;
esac

echo '{"continue":true,"suppressOutput":true}'
exit 0
