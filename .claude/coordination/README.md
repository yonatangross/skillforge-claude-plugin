# Multi-Instance Coordination System

**Version:** 1.0.0
**Status:** Production Ready
**Platform Support:** macOS, Linux

## Overview

This coordination system enables multiple Claude Code instances to work safely on the same codebase without conflicts. It provides file-based locking, work registry, decision logging, and health monitoring.

## Architecture

### Core Components

1. **Work Registry** (`.claude/coordination/work-registry.json`)
   - Tracks all active Claude Code instances
   - Records current task, agent role, and locked files
   - Auto-updates on instance lifecycle events

2. **File Locking** (`.claude/coordination/locks/*.json`)
   - Optimistic locking with conflict detection
   - Auto-expiring locks (5-minute timeout)
   - SHA-1 hash verification for conflict detection

3. **Decision Log** (`.claude/coordination/decision-log.json`)
   - Append-only log of architectural decisions
   - Shared knowledge across instances
   - Queryable by category and timestamp

4. **Heartbeat System** (`.claude/coordination/heartbeats/*.json`)
   - Lightweight liveness detection
   - 5-minute timeout for stale instance detection
   - Auto-cleanup of crashed instances

## File Structure

```
.claude/coordination/
├── lib/
│   └── coordination.sh          # Core library functions
├── bin/
│   ├── coord-status             # CLI: View instance status
│   ├── coord-lock               # CLI: Manage file locks
│   └── coord-decisions          # CLI: Query decision log
├── schemas/
│   ├── work-registry.schema.json
│   ├── file-lock.schema.json
│   ├── decision-log.schema.json
│   └── heartbeat.schema.json
├── locks/                       # Active file locks
├── heartbeats/                  # Instance heartbeat files
├── work-registry.json           # Active instances registry
└── decision-log.json            # Shared decision log
```

## Automatic Integration

The coordination system is automatically integrated via hooks:

### SessionStart Hooks
- `coordination-init.sh` - Registers instance, creates heartbeat

### SessionEnd Hooks
- `coordination-cleanup.sh` - Unregisters instance, releases locks

### PreToolUse Hooks (Write|Edit)
- `file-lock-check.sh` - Checks/acquires locks before file operations

### PostToolUse Hooks (Write|Edit)
- `file-lock-release.sh` - Releases locks after successful operations
- `coordination-heartbeat.sh` - Updates heartbeat after each tool use

## Usage

### CLI Tools

#### 1. View Instance Status

```bash
# Human-readable output
.claude/coordination/bin/coord-status

# JSON output
.claude/coordination/bin/coord-status --json

# Verbose output (shows lock details and recent decisions)
.claude/coordination/bin/coord-status --verbose
```

**Example Output:**
```
======================================
  Claude Code Coordination Status
======================================

Active Instances: 2

Instance: claude-20260108-124532-a3f7b2d1
  Role: backend-system-architect
  Task: Implement user authentication API
  Branch: feature/auth-system
  Status: active
  Files Locked: 3
  Last Heartbeat: 2026-01-08T12:45:53Z
  Locked Files:
    - backend/app/api/routes/auth.py
    - backend/app/services/auth_service.py
    - backend/app/models/user.py

Instance: claude-20260108-130012-f9c4e8a2
  Role: frontend-ui-developer
  Task: Create login component
  Branch: feature/auth-system
  Status: active
  Files Locked: 1
  Last Heartbeat: 2026-01-08T13:00:23Z
  Locked Files:
    - frontend/src/components/Auth/LoginForm.tsx

--------------------------------------
Total File Locks: 4
Total Decisions Logged: 12
======================================
```

#### 2. Manage File Locks

```bash
# Acquire a lock
.claude/coordination/bin/coord-lock acquire backend/app/api/routes.py

# Release a lock
.claude/coordination/bin/coord-lock release backend/app/api/routes.py

# Check if file is locked
.claude/coordination/bin/coord-lock check backend/app/api/routes.py

# List all active locks
.claude/coordination/bin/coord-lock list

# Clean up stale instances and expired locks
.claude/coordination/bin/coord-lock cleanup
```

#### 3. Query Decision Log

```bash
# List recent decisions
.claude/coordination/bin/coord-decisions list

# Filter by category
.claude/coordination/bin/coord-decisions list --category=api-design --limit=5

# Query specific decision
.claude/coordination/bin/coord-decisions query DEC-20260108-0001

# Add a decision
.claude/coordination/bin/coord-decisions add \
  --category=architecture \
  --title="Use microservices pattern" \
  --description="Split monolith into independent services" \
  --scope=system
```

### Programmatic API

The coordination library can be used in custom scripts:

```bash
#!/bin/bash
source ".claude/coordination/lib/coordination.sh"

# Initialize coordination system
coord_init

# Register instance
INSTANCE_ID=$(coord_register_instance "My custom task" "custom-agent")

# Acquire lock
if coord_acquire_lock "path/to/file.py" "Making changes"; then
  echo "Lock acquired"

  # ... do work ...

  # Release lock
  coord_release_lock "path/to/file.py"
else
  echo "Could not acquire lock"
  exit 1
fi

# Update heartbeat
coord_heartbeat

# Log a decision
coord_log_decision "architecture" "Decision title" "Description" "module"

# Unregister on exit
coord_unregister_instance
```

## Key Functions

### Instance Management
- `coord_register_instance <task> <role>` - Register this instance
- `coord_unregister_instance` - Unregister and cleanup
- `coord_heartbeat` - Update heartbeat timestamp
- `coord_cleanup_stale_instances` - Clean up dead instances

### File Locking
- `coord_acquire_lock <file> [intent]` - Acquire write lock
- `coord_release_lock <file>` - Release lock
- `coord_renew_lock <file>` - Extend lock expiration
- `coord_check_lock <file>` - Check lock status
- `coord_detect_conflict <file>` - Detect optimistic lock conflicts

### Decision Logging
- `coord_log_decision <category> <title> <desc> [scope]` - Log decision
- `coord_query_decisions [category] [limit]` - Query decisions

### Registry Queries
- `coord_list_instances` - Get all active instances
- `coord_get_work [instance_id]` - Get work assignment for instance

## Exit Codes

```
0  - EXIT_SUCCESS         - Operation successful
10 - EXIT_LOCK_HELD       - Lock held by another instance
11 - EXIT_LOCK_EXPIRED    - Lock expired and cleaned
12 - EXIT_CONFLICT        - Optimistic lock conflict detected
13 - EXIT_STALE_INSTANCE  - Instance is stale (no heartbeat)
```

## Behavior Details

### Lock Expiration
- Locks auto-expire after **5 minutes** of no renewal
- Heartbeat updates every tool use (automatic renewal)
- Expired locks are automatically cleaned on next lock operation

### Stale Instance Detection
- Instances with no heartbeat for **5 minutes** are marked stale
- Stale instances are auto-cleaned on:
  - New instance registration
  - Lock acquisition attempts
  - Manual `coord-lock cleanup` command

### Conflict Resolution
- Optimistic locking: Files are hashed when locked
- Before write operations, hash is verified
- If hash mismatch detected, conflict warning is issued
- Developers can review changes and resolve conflicts

### Crash Recovery
- Locks are time-bound (5-minute max)
- Crashed instances auto-cleanup after timeout
- No external daemon required
- Graceful degradation: system continues working even with stale data

## Integration with Hooks

### Configuration in .claude/settings.json

Add to `SessionStart` hooks:
```json
{
  "type": "command",
  "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/lifecycle/coordination-init.sh",
  "statusMessage": "Initializing coordination..."
}
```

Add to `SessionEnd` hooks:
```json
{
  "type": "command",
  "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/lifecycle/coordination-cleanup.sh"
}
```

Add to `PreToolUse` hooks (Write|Edit):
```json
{
  "type": "command",
  "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/pretool/write-edit/file-lock-check.sh",
  "statusMessage": "Checking file locks..."
}
```

Add to `PostToolUse` hooks (Write|Edit):
```json
{
  "type": "command",
  "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/posttool/write-edit/file-lock-release.sh"
},
{
  "type": "command",
  "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/posttool/coordination-heartbeat.sh"
}
```

## Performance Characteristics

- **Lock Acquisition:** <10ms (single file operation)
- **Heartbeat Update:** <5ms (JSON update)
- **Registry Query:** <20ms (jq parsing)
- **Stale Cleanup:** <100ms per instance

## Cross-Platform Compatibility

### macOS Support
- Uses `date -j -f` for ISO 8601 parsing
- Uses `date -v` for date arithmetic
- Uses `shasum` for file hashing

### Linux Support
- Uses `date -d` for ISO 8601 parsing
- Uses `date -d +` for date arithmetic
- Uses `sha1sum` for file hashing

### Required Commands
- `jq` - JSON processing
- `flock` - File locking
- `openssl` - Random ID generation
- `base64` - Lock ID encoding

## Security Considerations

1. **No Authentication:** File-based system trusts local filesystem permissions
2. **Process Isolation:** Each instance runs in separate process
3. **Lock Validation:** PIDs and instance IDs prevent unauthorized release
4. **Atomic Operations:** Uses `flock` for atomic registry updates
5. **No Network:** All coordination is local filesystem-based

## Limitations

1. **Single Machine:** Does not coordinate across different machines
2. **Git Worktrees:** Each worktree is treated as separate workspace
3. **Manual Overrides:** Users can delete lock files manually (by design)
4. **No Priority:** First-come-first-served lock acquisition
5. **File Granularity:** Locks entire files, not line ranges

## Troubleshooting

### Issue: Lock stuck after crash

**Solution:**
```bash
# Manual cleanup
.claude/coordination/bin/coord-lock cleanup

# Or wait 5 minutes for auto-expiration
```

### Issue: Instance not registering

**Solution:**
```bash
# Check coordination directory exists
ls -la .claude/coordination/

# Reinitialize
.claude/hooks/lifecycle/coordination-init.sh
```

### Issue: Heartbeat not updating

**Solution:**
```bash
# Check instance env file
cat .claude/.instance_env

# Verify heartbeat file
cat .claude/coordination/heartbeats/claude-*.json
```

### Issue: Decision log growing too large

**Solution:**
```bash
# Archive old decisions
cp .claude/coordination/decision-log.json \
   .claude/coordination/decision-log-archive-$(date +%Y%m%d).json

# Reset log (keep last 100 decisions)
jq '.decisions |= .[-100:]' decision-log.json > decision-log.json.tmp
mv decision-log.json.tmp decision-log.json
```

## Future Enhancements

Potential improvements for future versions:

1. **Git Worktree Detection:** Automatic isolation per worktree
2. **Lock Priority:** Agent role-based lock priority
3. **Merge Strategies:** CRDT-based automatic merge for decision log
4. **Remote Coordination:** Optional Redis backend for multi-machine
5. **Visual Dashboard:** Web UI for coordination status
6. **Metrics Export:** Prometheus metrics for monitoring
7. **Lock Queuing:** Wait queue for lock contention
8. **Partial Locks:** Line-range locking within files

## Related Documentation

- **Hooks:** `.claude/hooks/ (see dispatcher files)`
- **Context System:** `.claude/context/knowledge/index.json`
- **Agent Roles:** `plugin.json agents section`

## License

Part of SkillForge Claude Code Plugin Ecosystem
Version: 4.5.0
