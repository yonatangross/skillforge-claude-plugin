#!/bin/bash
# Multi-Instance File Lock Hook
# CC 2.1.7 Compliant: Self-contained hook with proper block format
# Acquires file locks before Write/Edit operations to prevent conflicts

set -euo pipefail

# Read stdin BEFORE any processing
_HOOK_INPUT=$(cat)
export _HOOK_INPUT

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../../_lib/common.sh"

PROJECT_ROOT="${CLAUDE_PROJECT_DIR:-$(cd "$SCRIPT_DIR/../../.." && pwd)}"
INSTANCE_DIR="$PROJECT_ROOT/.instance"
DB_PATH="$PROJECT_ROOT/.claude/coordination/.claude.db"

# Check if coordination is enabled
if [[ ! -f "$DB_PATH" ]]; then
    output_silent_success
    exit 0
fi

# Check if we have instance identity
if [[ ! -f "$INSTANCE_DIR/id.json" ]]; then
    log_hook "WARNING: No instance identity found, passing through"
    output_silent_success
    exit 0
fi

# Get tool name and file path from input
TOOL_NAME=$(get_field '.tool_name // ""')
FILE_PATH=$(get_field '.tool_input.file_path // .file_path // ""')

# Only process Write and Edit tools
guard_tool "Write" "Edit" || exit 0

# Skip if no file path
if [[ -z "$FILE_PATH" ]]; then
    output_silent_success
    exit 0
fi

# Convert to relative path if absolute
if [[ "$FILE_PATH" == "$PROJECT_ROOT"* ]]; then
    FILE_PATH="${FILE_PATH#$PROJECT_ROOT/}"
fi

# Get instance ID
INSTANCE_ID=$(jq -r '.instance_id' "$INSTANCE_DIR/id.json" 2>/dev/null || echo "")
[[ -z "$INSTANCE_ID" ]] && { output_silent_success; exit 0; }

# Generate lock ID
LOCK_ID="lock-$(head -c 8 /dev/urandom | xxd -p 2>/dev/null || openssl rand -hex 8 2>/dev/null || echo "$$")"

# Calculate expiry (60 seconds from now)
if [[ "$(uname)" == "Darwin" ]]; then
    EXPIRES_AT=$(date -u -v+60S +%Y-%m-%dT%H:%M:%SZ)
else
    EXPIRES_AT=$(date -u -d '+60 seconds' +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u +%Y-%m-%dT%H:%M:%SZ)
fi

# Check for existing lock
check_existing_lock() {
    sqlite3 "$DB_PATH" "SELECT instance_id, expires_at, reason FROM file_locks WHERE file_path = '$1' AND expires_at > datetime('now') AND instance_id != '$INSTANCE_ID' LIMIT 1;" 2>/dev/null || echo ""
}

# Acquire lock
acquire_lock() {
    sqlite3 "$DB_PATH" "INSERT OR REPLACE INTO file_locks (lock_id, file_path, lock_type, instance_id, acquired_at, expires_at, extensions, reason) VALUES ('$LOCK_ID', '$1', 'exclusive_write', '$INSTANCE_ID', datetime('now'), '$EXPIRES_AT', 0, '$2');" 2>/dev/null || true
}

# Check for directory lock
check_directory_lock() {
    sqlite3 "$DB_PATH" "SELECT instance_id, file_path FROM file_locks WHERE lock_type = 'directory' AND '$1' LIKE file_path || '%' AND expires_at > datetime('now') AND instance_id != '$INSTANCE_ID' LIMIT 1;" 2>/dev/null || echo ""
}

# Main lock logic
main() {
    # Check for directory lock first
    local dir_lock_info
    dir_lock_info=$(check_directory_lock "$FILE_PATH")
    
    if [[ -n "$dir_lock_info" ]]; then
        local holder_instance locked_dir
        holder_instance=$(echo "$dir_lock_info" | cut -d'|' -f1)
        locked_dir=$(echo "$dir_lock_info" | cut -d'|' -f2)
        log_hook "BLOCKED: Directory $locked_dir is locked by $holder_instance"
        output_block "Directory $locked_dir is locked by another Claude instance ($holder_instance). Wait for lock release."
        exit 0
    fi
    
    # Check for file lock
    local lock_info
    lock_info=$(check_existing_lock "$FILE_PATH")
    
    if [[ -n "$lock_info" ]]; then
        local holder_instance expires_at
        holder_instance=$(echo "$lock_info" | cut -d'|' -f1)
        expires_at=$(echo "$lock_info" | cut -d'|' -f2)
        log_hook "BLOCKED: File $FILE_PATH is locked by $holder_instance until $expires_at"
        output_block "File $FILE_PATH is locked by another Claude instance ($holder_instance). Wait for lock release."
        exit 0
    fi
    
    # No conflicts, acquire lock
    acquire_lock "$FILE_PATH" "Modifying via $TOOL_NAME"
    log_hook "Lock acquired: $FILE_PATH (expires: $EXPIRES_AT)"
    output_silent_success
}

main
