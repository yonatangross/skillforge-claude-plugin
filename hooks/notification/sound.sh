#!/bin/bash
# Sound Notifications - Plays sounds for task completion
# Hook: Notification
exec node "${CLAUDE_PLUGIN_ROOT:-${CLAUDE_PROJECT_DIR:-.}}/hooks/bin/run-hook.mjs" "notification/sound"
