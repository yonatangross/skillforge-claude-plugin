#!/bin/bash
set -euo pipefail
# Auto-Approve Readonly - Automatically approves read-only operations
# Hook: PermissionRequest (Read|Glob|Grep)

source "$(dirname "$0")/../_lib/common.sh"

TOOL_NAME=$(get_tool_name)

log_hook "Auto-approving readonly: $TOOL_NAME"

# Return JSON to allow the operation
echo '{"decision": "allow", "reason": "Read-only operations are auto-approved"}'

exit 0
