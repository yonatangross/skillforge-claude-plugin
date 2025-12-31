#!/bin/bash
set -euo pipefail
# Skill Tracker - Logs Skill tool invocations
# Hook: PreToolUse (Skill)

source "$(dirname "$0")/../../_lib/common.sh"

SKILL_NAME=$(get_field '.tool_input.skill')
SKILL_ARGS=$(get_field '.tool_input.args')

log_hook "Skill invocation: $SKILL_NAME ${SKILL_ARGS:+(args: $SKILL_ARGS)}"

# Log skill usage for analytics
USAGE_LOG="/tmp/claude-skill-usage.log"
echo "$(date -Iseconds) | $SKILL_NAME | ${SKILL_ARGS:-no args}" >> "$USAGE_LOG"

# Info message
info "Invoking skill: $SKILL_NAME"

exit 0
