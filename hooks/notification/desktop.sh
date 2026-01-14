#!/bin/bash
# Desktop Notifications - Sends desktop notifications for important events
# CC 2.1.7 Compliant: Outputs proper JSON with suppressOutput
# Hook: Notification

set -euo pipefail

# Read stdin BEFORE sourcing common.sh
_HOOK_INPUT=$(cat)
export _HOOK_INPUT

source "$(dirname "$0")/../_lib/common.sh"

MESSAGE=$(get_field '.message // ""')
NOTIFICATION_TYPE=$(get_field '.notification_type // ""')

log_hook "Notification: [$NOTIFICATION_TYPE] ${MESSAGE:0:100}"

# Show desktop notifications for permission prompts and idle prompts
if [[ "$NOTIFICATION_TYPE" == "permission_prompt" ]] || [[ "$NOTIFICATION_TYPE" == "idle_prompt" ]]; then
    # Escape message for safe shell interpolation
    SAFE_MESSAGE="${MESSAGE//\\/\\\\}"
    SAFE_MESSAGE="${SAFE_MESSAGE//\"/\\\"}"
    
    # macOS notification
    if command -v osascript &>/dev/null; then
        osascript -e "display notification \"$SAFE_MESSAGE\" with title \"Claude Code\" sound name \"Ping\"" 2>/dev/null || true
    # Linux notification
    elif command -v notify-send &>/dev/null; then
        notify-send -- "Claude Code" "$MESSAGE" 2>/dev/null || true
    fi
fi

# CC 2.1.7 Compliant output with suppressOutput
output_silent_success
exit 0
