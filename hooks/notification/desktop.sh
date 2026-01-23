#!/bin/bash
# Desktop Notifications - Sends desktop notifications for important events
# Hook: Notification
exec node "${CLAUDE_PLUGIN_ROOT:-${CLAUDE_PROJECT_DIR:-.}}/hooks/bin/run-hook.mjs" "notification/desktop"
