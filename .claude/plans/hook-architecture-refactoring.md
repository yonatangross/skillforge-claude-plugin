# Hook Architecture Refactoring Plan (CC 2.1.7)

## Overview

Refactor hook architecture to fully leverage CC 2.1.7 native parallel execution, remove unnecessary dispatchers, and use correct hook events for agent lifecycle.

**Prerequisite**: Mem0 v1.1.0 enhancements ✅ COMPLETE

---

## Phase 1: Remove bash-dispatcher.sh

**Goal**: Replace sequential dispatcher with CC 2.1.7 native parallel execution

### Current State
```
PreToolUse (Bash) → bash-dispatcher.sh → [sequential calls to 6 hooks]
```

### Target State
```
PreToolUse (Bash) → [8 individual hooks - CC runs in parallel]
```

### Files to Create (Extract Inline Logic)

| New File | Source | Lines |
|----------|--------|-------|
| `hooks/pretool/bash/dangerous-command-blocker.sh` | bash-dispatcher.sh:84-105 | Inline pattern check |
| `hooks/pretool/bash/git-branch-protection.sh` | bash-dispatcher.sh:107-118 | Inline branch check |
| `hooks/pretool/bash/default-timeout-setter.sh` | bash-dispatcher.sh:136-147 | Input modifier |

### Files Already Exist (Self-Guard)

| File | Self-Guard Condition |
|------|---------------------|
| `compound-command-validator.sh` | Always runs |
| `error-pattern-warner.sh` | Check `$RULES_FILE` exists |
| `ci-simulation.sh` | Check command contains `git commit` |
| `issue-docs-requirement.sh` | Check command contains `git checkout -b issue/` |
| `multi-instance-quality-gate.sh` | Check `$COORDINATION_DB` exists |

### Delete
- `hooks/pretool/bash-dispatcher.sh`

---

## Phase 2: Move Agent Hooks to Correct Events

**Goal**: Use SubagentStart/SubagentStop instead of PreToolUse/PostToolUse Task

### Why This Matters
- `PreToolUse Task` fires for ALL Task tool uses (explore, plan, etc.)
- `SubagentStart` fires SPECIFICALLY when subagent spawns ← Correct!
- `PostToolUse Task` fires for ALL Task results
- `SubagentStop` fires SPECIFICALLY when subagent completes ← Correct!

### Current State
```
PreToolUse (Task):
  - context-gate.sh
  - subagent-validator.sh
  - agent-memory-inject.sh (enhanced in Mem0 v1.1.0)

SubagentStart:
  - subagent-context-stager.sh

PostToolUse (*) dispatcher:
  - routes Task → agent-memory-store.sh (enhanced in Mem0 v1.1.0)

SubagentStop:
  - agent-dispatcher.sh (calls 6 hooks)
  - completion-tracker.sh
  - quality-gate.sh
```

### Target State
```
PreToolUse (Task):
  [REMOVE - or minimal validation only]

SubagentStart:
  - subagent-context-stager.sh
  - agent-memory-inject.sh (MOVE)
  - subagent-validator.sh (MOVE)
  - context-gate.sh (MOVE)

PostToolUse (*):
  [REMOVE Task routing from dispatcher]

SubagentStop:
  - agent-memory-store.sh (MOVE from dispatcher)
  - output-validator.sh (MOVE from agent-dispatcher)
  - context-publisher.sh (MOVE from agent-dispatcher)
  - handoff-preparer.sh (MOVE from agent-dispatcher)
  - feedback-loop.sh (MOVE from agent-dispatcher)
  - auto-spawn-quality.sh (MOVE from agent-dispatcher)
  - multi-claude-verifier.sh (MOVE from agent-dispatcher)
  - completion-tracker.sh (exists)
  - quality-gate.sh (exists)
```

### Files to Move/Modify

| File | From | To |
|------|------|-----|
| `agent-memory-inject.sh` | pretool/task/ | subagent-start/ |
| `subagent-validator.sh` | pretool/task/ | subagent-start/ |
| `context-gate.sh` | pretool/task/ | subagent-start/ |
| `agent-memory-store.sh` | posttool/task/ | subagent-stop/ |
| `output-validator.sh` | agent/ | subagent-stop/ |
| `context-publisher.sh` | agent/ | subagent-stop/ |
| `handoff-preparer.sh` | agent/ | subagent-stop/ |
| `feedback-loop.sh` | agent/ | subagent-stop/ |
| `auto-spawn-quality.sh` | agent/ | subagent-stop/ |
| `multi-claude-verifier.sh` | agent/ | subagent-stop/ |

---

## Phase 3: Remove agent-dispatcher.sh

**Goal**: Register 6 agent hooks directly for CC parallel execution

### Delete
- `hooks/agent/agent-dispatcher.sh`

### Keep (Move to subagent-stop/)
- All 6 hooks it calls (see Phase 2)

---

## Phase 4: Slim Routing Dispatchers

**Goal**: Keep only file-path/file-type routing that CC can't do natively

### write-dispatcher.sh

**Extract to Individual Hooks:**
- File guard → `hooks/pretool/write/file-guard.sh`
- Path normalization → `hooks/pretool/write/path-normalizer.sh`

**Keep in Dispatcher:**
- File-path based validator routing (CC matcher doesn't support path patterns)

### posttool/dispatcher.sh

**Extract to Individual Hooks:**
- `session-metrics.sh` → Always runs, register directly
- `audit-logger.sh` → Always runs, register directly

**Remove:**
- Task routing (moved to SubagentStop)

**Keep in Dispatcher:**
- File-type routing (*.py → python validators, *.ts → typescript validators)

---

## Phase 5: Update plugin.json

### New Hook Structure

```json
{
  "PreToolUse": [
    {
      "matcher": "Bash",
      "hooks": [
        {"type": "command", "command": "${CLAUDE_PLUGIN_ROOT}/hooks/pretool/bash/dangerous-command-blocker.sh"},
        {"type": "command", "command": "${CLAUDE_PLUGIN_ROOT}/hooks/pretool/bash/git-branch-protection.sh"},
        {"type": "command", "command": "${CLAUDE_PLUGIN_ROOT}/hooks/pretool/bash/compound-command-validator.sh"},
        {"type": "command", "command": "${CLAUDE_PLUGIN_ROOT}/hooks/pretool/bash/error-pattern-warner.sh"},
        {"type": "command", "command": "${CLAUDE_PLUGIN_ROOT}/hooks/pretool/bash/ci-simulation.sh"},
        {"type": "command", "command": "${CLAUDE_PLUGIN_ROOT}/hooks/pretool/bash/issue-docs-requirement.sh"},
        {"type": "command", "command": "${CLAUDE_PLUGIN_ROOT}/hooks/pretool/bash/multi-instance-quality-gate.sh"},
        {"type": "command", "command": "${CLAUDE_PLUGIN_ROOT}/hooks/pretool/bash/default-timeout-setter.sh"}
      ]
    },
    {
      "matcher": "Write|Edit",
      "hooks": [
        {"type": "command", "command": "${CLAUDE_PLUGIN_ROOT}/hooks/pretool/write/file-guard.sh"},
        {"type": "command", "command": "${CLAUDE_PLUGIN_ROOT}/hooks/pretool/write/path-normalizer.sh"},
        {"type": "command", "command": "${CLAUDE_PLUGIN_ROOT}/hooks/pretool/write/validator-dispatcher.sh"}
      ]
    },
    {
      "matcher": "Skill",
      "hooks": [
        {"type": "command", "command": "${CLAUDE_PLUGIN_ROOT}/hooks/pretool/skill/skill-tracker.sh"}
      ]
    }
  ],

  "PostToolUse": [
    {
      "matcher": "Write|Edit|Bash",
      "hooks": [
        {"type": "command", "command": "${CLAUDE_PLUGIN_ROOT}/hooks/posttool/session-metrics.sh"},
        {"type": "command", "command": "${CLAUDE_PLUGIN_ROOT}/hooks/posttool/audit-logger.sh"},
        {"type": "command", "command": "${CLAUDE_PLUGIN_ROOT}/hooks/posttool/filetype-dispatcher.sh"}
      ]
    }
  ],

  "SubagentStart": [
    {
      "hooks": [
        {"type": "command", "command": "${CLAUDE_PLUGIN_ROOT}/hooks/subagent-start/subagent-context-stager.sh"},
        {"type": "command", "command": "${CLAUDE_PLUGIN_ROOT}/hooks/subagent-start/agent-memory-inject.sh"},
        {"type": "command", "command": "${CLAUDE_PLUGIN_ROOT}/hooks/subagent-start/subagent-validator.sh"},
        {"type": "command", "command": "${CLAUDE_PLUGIN_ROOT}/hooks/subagent-start/context-gate.sh"}
      ]
    }
  ],

  "SubagentStop": [
    {
      "hooks": [
        {"type": "command", "command": "${CLAUDE_PLUGIN_ROOT}/hooks/subagent-stop/agent-memory-store.sh"},
        {"type": "command", "command": "${CLAUDE_PLUGIN_ROOT}/hooks/subagent-stop/output-validator.sh"},
        {"type": "command", "command": "${CLAUDE_PLUGIN_ROOT}/hooks/subagent-stop/context-publisher.sh"},
        {"type": "command", "command": "${CLAUDE_PLUGIN_ROOT}/hooks/subagent-stop/handoff-preparer.sh"},
        {"type": "command", "command": "${CLAUDE_PLUGIN_ROOT}/hooks/subagent-stop/feedback-loop.sh"},
        {"type": "command", "command": "${CLAUDE_PLUGIN_ROOT}/hooks/subagent-stop/auto-spawn-quality.sh"},
        {"type": "command", "command": "${CLAUDE_PLUGIN_ROOT}/hooks/subagent-stop/multi-claude-verifier.sh"},
        {"type": "command", "command": "${CLAUDE_PLUGIN_ROOT}/hooks/subagent-stop/subagent-completion-tracker.sh"},
        {"type": "command", "command": "${CLAUDE_PLUGIN_ROOT}/hooks/subagent-stop/subagent-quality-gate.sh"}
      ]
    }
  ]
}
```

---

## Phase 6: Update Tests and Documentation

### Tests to Update
- `tests/hooks/test-bash-hooks.sh` - Test individual bash hooks
- `tests/hooks/test-agent-hooks.sh` - Test SubagentStart/Stop hooks
- `tests/mem0/test-mem0-integration.sh` - Update hook paths

### Documentation to Update
- `README.md` - Update hook counts
- `CLAUDE.md` - Update hook architecture section
- `plugin.json` description - Update hook counts

---

## Implementation Order

| Step | Phase | Files | Priority |
|------|-------|-------|----------|
| 1 | 1 | Extract bash inline logic | HIGH |
| 2 | 1 | Add self-guards to existing bash hooks | HIGH |
| 3 | 1 | Delete bash-dispatcher.sh | HIGH |
| 4 | 2 | Move PreToolUse Task hooks to SubagentStart | HIGH |
| 5 | 2 | Move agent hooks to SubagentStop | HIGH |
| 6 | 3 | Delete agent-dispatcher.sh | HIGH |
| 7 | 4 | Slim write-dispatcher.sh | MEDIUM |
| 8 | 4 | Slim posttool/dispatcher.sh | MEDIUM |
| 9 | 5 | Update plugin.json | HIGH |
| 10 | 6 | Update tests | MEDIUM |
| 11 | 6 | Update documentation | LOW |

---

## Expected Results

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Dispatchers | 4 | 2 (slim) | -50% |
| Bash hook overhead | Sequential 6 | Parallel 8 | ~30ms saved |
| Agent hooks in wrong event | 4 | 0 | Correct semantics |
| SubagentStart hooks | 1 | 4 | Proper agent setup |
| SubagentStop hooks | 3 (+6 via dispatcher) | 9 direct | CC parallel |
| Total direct registrations | 32 | ~50 | More granular |

---

## Verification Plan

```bash
# 1. Test bash hooks in parallel
./tests/hooks/test-bash-hooks.sh

# 2. Test agent lifecycle
./tests/hooks/test-agent-hooks.sh

# 3. Run full test suite
./tests/run-all-tests.sh

# 4. Manual verification
# Spawn a subagent and verify SubagentStart/Stop hooks fire
```

---

## Rollback Plan

If issues discovered:
1. Revert plugin.json changes
2. Restore deleted dispatchers from git
3. Hooks remain in both locations temporarily

---

**Last Updated**: 2026-01-14
**Status**: Ready for Implementation
**Dependencies**: Mem0 v1.1.0 ✅ COMPLETE