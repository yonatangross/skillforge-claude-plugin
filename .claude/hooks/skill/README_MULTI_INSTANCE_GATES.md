# Multi-Instance Quality Gate Hooks

This directory contains hooks that prevent "slop" when multiple Claude Code instances work on the same codebase.

## Hook Files

### 1. duplicate-code-detector.sh
**Purpose:** Detect duplicate/redundant code across worktrees  
**Blocking:** Yes (for critical duplicates)  
**Checks:**
- Exact duplicate function/class names
- Copy-pasted code blocks (3+ consecutive lines)
- Duplicated utility patterns
- Worktree conflicts

**Example:**
```bash
export TOOL_INPUT_FILE_PATH="/path/to/file.ts"
export TOOL_OUTPUT_CONTENT="$(cat file.ts)"
./duplicate-code-detector.sh
```

### 2. pattern-consistency-enforcer.sh
**Purpose:** Enforce consistent patterns from registry  
**Blocking:** Yes (for pattern violations)  
**Checks:**
- Backend: Layer separation, async DB, Pydantic v2, tenant isolation
- Frontend: React 19, Zod validation, exhaustive types, skeleton loading
- Testing: AAA pattern, MSW mocking, pytest fixtures
- Pattern registry: `.claude/context/knowledge/patterns/pattern-registry.json`

**Example:**
```bash
export TOOL_INPUT_FILE_PATH="/path/to/component.tsx"
export TOOL_OUTPUT_CONTENT="$(cat component.tsx)"
./pattern-consistency-enforcer.sh
```

### 3. cross-instance-test-validator.sh
**Purpose:** Ensure test coverage when code is split across instances  
**Blocking:** Yes (for missing test files)  
**Checks:**
- Test files exist for implementations
- New functions/classes have tests
- Integration tests for cross-layer code
- Test coordination across worktrees

**Example:**
```bash
export TOOL_INPUT_FILE_PATH="/path/to/service.py"
export TOOL_OUTPUT_CONTENT="$(cat service.py)"
./cross-instance-test-validator.sh
```

### 4. merge-conflict-predictor.sh
**Purpose:** Predict merge conflicts before commit  
**Blocking:** No (warning only)  
**Checks:**
- Concurrent modifications in worktrees
- Overlapping changes
- Branch divergence
- API contract changes
- Import/export consistency

**Example:**
```bash
export TOOL_INPUT_FILE_PATH="/path/to/api.ts"
export TOOL_OUTPUT_CONTENT="$(cat api.ts)"
./merge-conflict-predictor.sh
```

### 5. merge-readiness-checker.sh
**Purpose:** Comprehensive merge readiness validation  
**Blocking:** Yes (for merge blockers)  
**Checks:**
- Uncommitted changes
- Branch divergence
- Merge conflicts
- Quality gates
- Test suite
- Linting
- Type checking
- Worktree conflicts

**Example:**
```bash
# Run before merging branch
./merge-readiness-checker.sh main
```

## Orchestrator

### multi-instance-quality-gate.sh
**Location:** `.claude/hooks/pretool/bash/`  
**Purpose:** Pre-commit orchestrator that runs all gates  
**Activation:** Automatic on `git commit`  
**Checks:** All staged files through all 4 quality gates

## Integration

### Chain Execution
Add to `.claude/hooks/_orchestration/chain-config.json`:

```json
{
  "chains": {
    "multi_instance_quality": {
      "sequence": [
        "duplicate-code-detector",
        "pattern-consistency-enforcer",
        "cross-instance-test-validator",
        "merge-conflict-predictor"
      ],
      "stop_on_failure": true,
      "enabled": true
    }
  }
}
```

### Manual Execution
```bash
# Execute chain
echo '{"tool_name":"Write","tool_input":{"file_path":"/path/to/file.ts"}}' | \
  .claude/hooks/_orchestration/chain-executor.sh execute multi_instance_quality
```

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | All checks passed |
| 1 | Blocking failure (fix required) |
| 2 | Warning only (review recommended) |

## Environment Variables

All hooks expect these environment variables:

```bash
export TOOL_INPUT_FILE_PATH="/absolute/path/to/file"
export TOOL_OUTPUT_CONTENT="file contents here"
```

## Testing

Run integration tests:

```bash
./tests/integration/test-multi-instance-gates.sh
```

## Documentation

- **Full Guide:** `.claude/docs/MULTI_INSTANCE_QUALITY_GATES.md`
- **Quick Reference:** `.claude/docs/QUALITY_GATES_QUICK_REFERENCE.md`
- **Pattern Registry:** `.claude/context/knowledge/patterns/pattern-registry.json`

## Performance

| Hook | Avg Time | Max Time |
|------|----------|----------|
| duplicate-code-detector | 200ms | 2s |
| pattern-consistency-enforcer | 100ms | 1s |
| cross-instance-test-validator | 150ms | 2s |
| merge-conflict-predictor | 300ms | 3s |
| **Total per file** | **750ms** | **8s** |

## Maintenance

### Update Patterns
Edit `.claude/context/knowledge/patterns/pattern-registry.json`

### Adjust Thresholds
Edit `.claude/hooks/_orchestration/chain-config.json`

### View Logs
```bash
tail -f .claude/logs/multi-instance-gates.log
```

## Support

For issues:
1. Check `.claude/docs/MULTI_INSTANCE_QUALITY_GATES.md` troubleshooting
2. Review `.claude/logs/multi-instance-gates.log`
3. File issue with reproduction steps

---

**Version:** 1.0.0  
**Last Updated:** 2026-01-08
