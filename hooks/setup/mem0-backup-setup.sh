#!/bin/bash
# Mem0 Backup Setup Hook - Configure scheduled exports
# Hook: Setup (maintenance)
# CC 2.1.7 Compliant
#
# Features:
# - Configures scheduled exports
# - Sets up backup workflow
# - Defines backup retention policy
#
# Version: 1.0.0

set -euo pipefail

_HOOK_INPUT=$(cat 2>/dev/null || true)
export _HOOK_INPUT

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../_lib/common.sh" 2>/dev/null || true
source "$SCRIPT_DIR/../_lib/mem0.sh" 2>/dev/null || true

log_hook "Mem0 backup setup starting"

# Check if mem0 is available
if ! is_mem0_available 2>/dev/null; then
    log_hook "Mem0 not available, skipping backup setup"
    echo '{"continue":true,"suppressOutput":true}'
    exit 0
fi

# Configuration
PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
BACKUP_CONFIG="$PROJECT_DIR/.claude/mem0-backup-config.json"
PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-$SCRIPT_DIR/../..}"
EXPORT_SCRIPT="$PLUGIN_ROOT/skills/mem0-memory/scripts/export-memories.py"

# Backup configuration
BACKUP_SCHEDULE="${MEM0_BACKUP_SCHEDULE:-weekly}"
BACKUP_RETENTION="${MEM0_BACKUP_RETENTION:-30}"  # days

# Create backup config
mkdir -p "$(dirname "$BACKUP_CONFIG")" 2>/dev/null || true
cat > "$BACKUP_CONFIG" <<EOF
{
  "schedule": "$BACKUP_SCHEDULE",
  "retention_days": $BACKUP_RETENTION,
  "enabled": true
}
EOF

log_hook "Mem0 backup configured: schedule=$BACKUP_SCHEDULE, retention=${BACKUP_RETENTION} days"

echo '{"continue":true,"suppressOutput":true}'
exit 0
