# Multi-Instance Coordination - Integration Guide

## Quick Start

### 1. Automatic Integration (Recommended)

The coordination system is automatically enabled via hooks in `.claude/settings.json`. No manual setup required.

**What happens automatically:**
- Instance registration on session start
- File locking before Write/Edit operations
- Lock release after successful operations
- Heartbeat updates after every tool use
- Instance cleanup on session end

### 2. Verify Installation

```bash
# Check coordination system is initialized
ls -la .claude/coordination/

# View your instance status
.claude/coordination/bin/coord-status
```

## Running Multiple Instances

### Scenario 1: Team Collaboration (Same Machine, Different Worktrees)

**Setup:**
```bash
# Main developer
cd /path/to/repo
# Start Claude Code

# Second developer (different worktree)
cd /path/to/repo
git worktree add ../repo-frontend feature/frontend
cd ../repo-frontend
# Start Claude Code
```

Both instances will coordinate automatically. Each will see:
- Other active instances in `coord-status`
- File locks preventing concurrent edits
- Shared decision log

### Scenario 2: Solo Developer (Multiple Tasks)

**Use Case:** Working on backend API while also debugging frontend

**Terminal 1 (Backend):**
```bash
cd /path/to/repo
# Start Claude Code as backend-system-architect
# Tell Claude: "I'm working on user authentication API"
```

**Terminal 2 (Frontend):**
```bash
cd /path/to/repo
# Start Claude Code as frontend-ui-developer
# Tell Claude: "I'm working on login component"
```

**Benefit:**
- Backend instance locks `backend/` files
- Frontend instance locks `frontend/` files
- No conflicts, shared knowledge via decision log

### Scenario 3: Parallel Feature Development

**Use Case:** Two features being developed simultaneously

**Instance 1:**
```
Task: Implement payment processing
Files: backend/app/api/routes/payments.py, backend/app/services/payment_service.py
```

**Instance 2:**
```
Task: Add user notifications
Files: backend/app/api/routes/notifications.py, backend/app/services/notification_service.py
```

**Coordination:**
- No file overlap = no conflicts
- Both can work in parallel
- Shared decision log shows all architectural choices

## Usage Patterns

### Pattern 1: Check Before Starting Work

```bash
# Before starting a new task
.claude/coordination/bin/coord-status

# See what other instances are working on
# Check if any files you need are locked
```

**Example Output:**
```
Active Instances: 1

Instance: claude-20260108-124532-a3f7b2d1
  Role: backend-system-architect
  Task: Implement user authentication API
  Files Locked: 3
  Locked Files:
    - backend/app/api/routes/auth.py
    - backend/app/services/auth_service.py
    - backend/app/models/user.py
```

**Decision:** Avoid working on these files, or wait for lock release.

### Pattern 2: Monitor During Work

```bash
# While working, periodically check status
watch -n 30 '.claude/coordination/bin/coord-status'

# Or set up a notification
while true; do
  INSTANCES=$(.claude/coordination/bin/coord-status --json | jq '.instances | length')
  if [[ $INSTANCES -gt 1 ]]; then
    echo "Multiple instances detected!"
  fi
  sleep 60
done
```

### Pattern 3: Resolve Lock Conflicts

**Scenario:** Claude warns about file lock

```
WARNING: File backend/app/api/routes.py is locked by instance claude-20260108-124532-a3f7b2d1
You may want to wait or check the work registry
```

**Options:**

1. **Wait for lock release** (automatic after 5 minutes or on completion)
2. **Work on different file**
3. **Check instance status:**
   ```bash
   .claude/coordination/bin/coord-status --verbose
   ```
4. **If instance crashed, clean up:**
   ```bash
   .claude/coordination/bin/coord-lock cleanup
   ```

### Pattern 4: Share Decisions Across Instances

**Instance 1 (Backend):**
```bash
# Claude logs decision
.claude/coordination/bin/coord-decisions add \
  --category=api-design \
  --title="Use JWT with 15min expiry" \
  --description="JWT tokens expire after 15 minutes, refresh tokens valid for 7 days" \
  --scope=service
```

**Instance 2 (Frontend):**
```bash
# Claude queries decisions
.claude/coordination/bin/coord-decisions list --category=api-design

# See:
# [DEC-20260108-0001] Use JWT with 15min expiry
#   Category: api-design
#   Made At: 2026-01-08T12:45:32Z
#   Status: accepted
```

**Benefit:** Frontend knows to implement token refresh logic.

## Integration with Git Worktrees

### Setup Multiple Worktrees

```bash
# Main worktree (backend focus)
cd /path/to/repo

# Create worktree for frontend
git worktree add ../repo-frontend feature/frontend-updates

# Create worktree for testing
git worktree add ../repo-test feature/test-improvements
```

### Coordination Behavior

Each worktree gets its own:
- Work registry entry
- Instance ID
- Heartbeat file

All worktrees share:
- Decision log (append-only)
- Lock system (prevents conflicts)

### Recommended Workflow

1. **Main Instance (Backend):**
   - Works on `main` branch or `feature/backend-*`
   - Registers as `backend-system-architect`
   - Locks backend files

2. **Frontend Instance (Frontend):**
   - Works in `../repo-frontend` worktree
   - Registers as `frontend-ui-developer`
   - Locks frontend files

3. **Test Instance (Testing):**
   - Works in `../repo-test` worktree
   - Registers as `test-generator`
   - Reads code, writes tests

## Advanced Usage

### Custom Scripts with Coordination

```bash
#!/bin/bash
source ".claude/coordination/lib/coordination.sh"

# Initialize
coord_init

# Register custom instance
INSTANCE_ID=$(coord_register_instance "Database migration" "db-admin")

# Acquire lock on migration files
if coord_acquire_lock "backend/alembic/versions/001_initial.py" "Running migration"; then
  echo "Lock acquired, running migration..."

  # Run migration
  alembic upgrade head

  # Release lock
  coord_release_lock "backend/alembic/versions/001_initial.py"

  # Log decision
  coord_log_decision "database-schema" \
    "Added users table" \
    "Initial migration with users, roles, and permissions" \
    "system"
else
  echo "Could not acquire lock, another instance is working on migrations"
  exit 1
fi

# Cleanup
coord_unregister_instance
```

### Subagent Coordination

When using Claude Code subagents:

```bash
# In subagent-start hook
source ".claude/coordination/lib/coordination.sh"

# Register subagent with specific role
SUBAGENT_ROLE="${CLAUDE_SUBAGENT_ROLE:-subagent}"
coord_register_instance "Subagent task" "${SUBAGENT_ROLE}"

# Subagent will automatically:
# - Check file locks before edits
# - Update heartbeat
# - Share decision log
```

## Monitoring and Debugging

### Real-Time Dashboard

```bash
# Terminal dashboard (requires watch)
watch -n 10 -c '.claude/coordination/bin/coord-status --verbose'
```

### Log Analysis

```bash
# Check coordination events in hooks log
tail -f .claude/logs/hooks.log | grep -i coordination

# Check for lock conflicts
grep "locked by" .claude/logs/hooks.log
```

### Metrics

```bash
# Count total decisions
jq '.decisions | length' .claude/coordination/decision-log.json

# Count decisions by category
jq '[.decisions[] | .category] | group_by(.) | map({(.[0]): length}) | add' \
  .claude/coordination/decision-log.json

# List files currently locked
ls -1 .claude/coordination/locks/ | wc -l
```

## Troubleshooting

### Issue: Locks not releasing

**Cause:** Instance crashed without cleanup

**Solution:**
```bash
# Auto-cleanup (removes stale instances)
.claude/coordination/bin/coord-lock cleanup

# Manual inspection
.claude/coordination/bin/coord-lock list

# Force remove specific lock (if you're sure it's safe)
rm .claude/coordination/locks/<lock-id>.json
```

### Issue: Multiple instances on same files

**Cause:** Coordination hooks not running

**Solution:**
```bash
# Verify hooks are enabled in .claude/settings.json
jq '.hooks.SessionStart' .claude/settings.json

# Should show coordination-init.sh

# Test hook execution
.claude/hooks/lifecycle/coordination-init.sh
```

### Issue: Decision log too large

**Cause:** Many decisions accumulated

**Solution:**
```bash
# Archive old decisions
cp .claude/coordination/decision-log.json \
   .claude/coordination/decision-log-archive-$(date +%Y%m%d).json

# Keep last 100 decisions
jq '.decisions |= .[-100:]' \
  .claude/coordination/decision-log.json > \
  .claude/coordination/decision-log.json.tmp && \
mv .claude/coordination/decision-log.json.tmp \
   .claude/coordination/decision-log.json
```

### Issue: Instance ID not found

**Cause:** Session started without coordination

**Solution:**
```bash
# Check instance env file
cat .claude/.instance_env

# If missing, reinitialize
.claude/hooks/lifecycle/coordination-init.sh
```

## Best Practices

### Do's
- Check `coord-status` before starting major changes
- Let locks expire naturally (don't force-remove unless crashed)
- Use decision log for architectural choices
- Clean up stale instances periodically
- Use descriptive task names when registering instances

### Don'ts
- Don't manually edit work-registry.json (use CLI tools)
- Don't delete coordination directory while instances are active
- Don't ignore lock warnings from Claude
- Don't run multiple instances on same worktree path
- Don't bypass coordination for critical files

## Performance Impact

The coordination system is designed for minimal overhead:

- **Lock Check:** <10ms per file operation
- **Heartbeat Update:** <5ms (runs after every tool)
- **Registry Query:** <20ms
- **Decision Log:** <15ms append operation

**Total overhead per Write/Edit:** ~15-20ms

This is negligible compared to typical file I/O and tool execution times.

## Security Considerations

**Filesystem-Based Security:**
- Coordination relies on filesystem permissions
- No authentication between instances
- Any process can read coordination files
- Locks can be manually removed (by design for crash recovery)

**Recommended for:**
- Single developer with multiple instances
- Team members on same machine (shared trust)
- Development/local environments

**Not recommended for:**
- Untrusted multi-user systems
- Production deployments
- Remote coordination (different machines)

## Future Extensions

Potential enhancements you can implement:

1. **Slack/Discord Integration:**
   ```bash
   # In coordination-init.sh
   curl -X POST $SLACK_WEBHOOK \
     -d "{\"text\": \"New Claude instance started: $INSTANCE_ID\"}"
   ```

2. **Git Integration:**
   ```bash
   # Auto-commit decisions
   cd .claude/coordination
   git add decision-log.json
   git commit -m "Decision: $(tail -1 decision-log.json)"
   ```

3. **Metrics Export:**
   ```bash
   # Export to Prometheus
   echo "claude_active_instances $(coord_list_instances | jq length)" > /tmp/metrics.prom
   ```

4. **Lock Priority:**
   ```bash
   # Modify coord_acquire_lock to check agent priority
   # backend-system-architect > frontend-ui-developer for backend files
   ```

## Support

For issues or questions:
1. Check this guide first
2. Run demo scripts in `.claude/coordination/examples/`
3. Review logs in `.claude/logs/hooks.log`
4. Check README.md for API reference

## Related Documentation

- **Main README:** `.claude/coordination/README.md`
- **Hook Architecture:** `.claude/hooks/_orchestration/ARCHITECTURE.md`
- **Context System:** `.claude/context/knowledge/index.json`
