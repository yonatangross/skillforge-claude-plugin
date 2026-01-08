# Multi-Instance Coordination - Quick Reference

## TL;DR

**What it does:** Lets multiple Claude Code instances work on same codebase without conflicts.

**How it works:** File-based locking + shared decision log + automatic cleanup.

**Setup:** Automatic via hooks (already configured).

## Essential Commands

```bash
# Check what's running
.claude/coordination/bin/coord-status

# List all file locks
.claude/coordination/bin/coord-lock list

# Clean up stale instances
.claude/coordination/bin/coord-lock cleanup

# View recent decisions
.claude/coordination/bin/coord-decisions list
```

## Common Scenarios

### Starting Work
```bash
# Before starting a task
coord-status

# Check if files you need are locked
# If locked, either wait or work on different files
```

### Lock Conflict
```
Claude says: "File is locked by instance claude-20260108-124532-a3f7b2d1"

Options:
1. Wait (lock auto-expires in 5 minutes)
2. Work on different file
3. Check if instance crashed: coord-lock cleanup
```

### Multiple Instances
```bash
# Terminal 1: Backend work
cd /path/to/repo
# Start Claude, work on backend/

# Terminal 2: Frontend work
cd /path/to/repo
# Start Claude, work on frontend/

# No conflicts! Coordination is automatic.
```

### Crashed Instance
```bash
# If instance crashed, clean up
coord-lock cleanup

# This removes stale instances (no heartbeat >5min)
# and releases their locks
```

## File Locations

| What | Where |
|------|-------|
| Work registry | `.claude/coordination/work-registry.json` |
| File locks | `.claude/coordination/locks/*.json` |
| Decision log | `.claude/coordination/decision-log.json` |
| Heartbeats | `.claude/coordination/heartbeats/*.json` |
| CLI tools | `.claude/coordination/bin/coord-*` |

## How It Works (Under the Hood)

1. **Session Start:** Instance registers, gets unique ID
2. **Before Edit:** Hook checks if file is locked
3. **If locked:** Warns you, blocks operation
4. **If not locked:** Acquires lock (stores file hash)
5. **After Edit:** Releases lock
6. **Every tool use:** Updates heartbeat
7. **Session End:** Unregisters, releases all locks

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 10 | Lock held by another instance |
| 11 | Expired lock cleaned (retry) |
| 12 | Conflict detected (file changed) |
| 13 | Stale instance |

## Timeouts

- **Lock expiration:** 5 minutes
- **Heartbeat timeout:** 5 minutes
- **Stale detection:** 5 minutes

## Performance

- Lock check: <10ms
- Heartbeat update: <5ms
- Total overhead: ~15-20ms per Write/Edit

**Negligible impact on user experience.**

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Lock stuck | `coord-lock cleanup` or wait 5 minutes |
| Instance not registering | Run `coordination-init.sh` manually |
| Heartbeat not updating | Check `.claude/.instance_env` exists |
| Decision log too large | Archive old entries (see docs) |

## Best Practices

**Do:**
- Check `coord-status` before major changes
- Let locks expire naturally
- Use descriptive task names
- Clean up stale instances periodically

**Don't:**
- Edit `work-registry.json` manually
- Delete locks while instance is active
- Ignore lock warnings
- Force-remove locks (unless crashed)

## CLI Reference

### coord-status
```bash
coord-status              # Human-readable
coord-status --json       # JSON output
coord-status --verbose    # Detailed view
```

### coord-lock
```bash
coord-lock list                    # List all locks
coord-lock check <file>            # Check if file is locked
coord-lock acquire <file>          # Manual lock
coord-lock release <file>          # Manual unlock
coord-lock cleanup                 # Clean stale instances
```

### coord-decisions
```bash
coord-decisions list                                  # Recent decisions
coord-decisions list --category=api-design --limit=5  # Filtered
coord-decisions query DEC-20260108-0001               # Specific decision
coord-decisions add --category=architecture \
  --title="Title" --description="Desc" --scope=module # Add decision
```

## Example Workflows

### Solo Developer (Multiple Tasks)
```bash
# Terminal 1: Backend API work
cd ~/project && claude-code
# Works on backend/ files

# Terminal 2: Frontend UI work
cd ~/project && claude-code
# Works on frontend/ files

# Coordination prevents conflicts automatically
```

### Team Collaboration (Git Worktrees)
```bash
# Developer 1: Main worktree
cd ~/project
claude-code  # Backend work

# Developer 2: Separate worktree
cd ~/project
git worktree add ../project-frontend feature/ui
cd ../project-frontend
claude-code  # Frontend work

# Both share decision log, prevent file conflicts
```

### After System Crash
```bash
# System crashed, instance didn't clean up
coord-lock cleanup

# Removes stale instance
# Releases all its locks
# Safe to continue
```

## Demo Scripts

```bash
# See it in action
.claude/coordination/examples/multi-instance-demo.sh
.claude/coordination/examples/stale-instance-demo.sh
.claude/coordination/examples/conflict-detection-demo.sh
```

## Architecture Diagram

```
┌─────────────────────────────────────────────┐
│         Multiple Claude Instances           │
├─────────────┬───────────────┬───────────────┤
│  Instance 1 │  Instance 2   │  Instance 3   │
│  (Backend)  │  (Frontend)   │   (Tests)     │
└──────┬──────┴───────┬───────┴───────┬───────┘
       │              │               │
       └──────────────┼───────────────┘
                      │
              ┌───────▼────────┐
              │  Coordination  │
              │     System     │
              └───────┬────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
   ┌────▼────┐  ┌────▼────┐  ┌────▼────┐
   │  Work   │  │  File   │  │Decision │
   │Registry │  │  Locks  │  │   Log   │
   └─────────┘  └─────────┘  └─────────┘
```

## Key Concepts

**Instance:** Single Claude Code session with unique ID

**Lock:** Exclusive write access to a file (5-min expiration)

**Heartbeat:** Timestamp updated every tool use (proves liveness)

**Stale:** Instance with no heartbeat >5 minutes (auto-cleaned)

**Decision:** Architectural choice logged for all instances to see

**Optimistic Locking:** File hash stored, conflict detected on change

## Integration Points

**Automatic (via hooks):**
- SessionStart: Register instance
- PreToolUse (Write|Edit): Check locks
- PostToolUse (Write|Edit): Release locks
- PostToolUse (*): Update heartbeat
- SessionEnd: Unregister instance

**Manual (via CLI):**
- View status: `coord-status`
- Manage locks: `coord-lock`
- Query decisions: `coord-decisions`

## When to Use

**Perfect for:**
- Solo dev with multiple Claude instances
- Team working on same machine
- Git worktree workflows
- Parallel feature development

**Not needed for:**
- Single Claude instance
- Different machines/repos
- Non-overlapping work

## Support

**Read first:**
- `README.md` - Complete documentation
- `INTEGRATION_GUIDE.md` - Usage patterns
- `IMPLEMENTATION_REPORT.json` - Technical details

**Debug:**
- Check `coord-status`
- Review `.claude/logs/hooks.log`
- Run demo scripts

---

**Version:** 1.0.0 | **Updated:** 2026-01-08 | **Status:** Production Ready
