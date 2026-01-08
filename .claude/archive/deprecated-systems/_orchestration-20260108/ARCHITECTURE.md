# Hook Chain Orchestration Architecture

## System Overview

The Hook Chain Orchestration system enables sequential execution of hooks with sophisticated control flow, timeout handling, retry logic, and inter-hook communication.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     Hook Chain Orchestration System                     │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ Configuration Layer                                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  chain-config.json                                                      │
│  ├── chains                   (chain definitions)                       │
│  ├── hook_metadata            (timeout, retry, critical flags)          │
│  └── execution_settings       (global settings)                         │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ Execution Layer                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  chain-executor.sh                                                      │
│  ├── execute_chain()          (main orchestrator)                       │
│  ├── execute_hook()           (single hook executor)                    │
│  ├── list_chains()            (chain discovery)                         │
│  └── validate()               (config validation)                       │
│                                                                          │
│  Features:                                                              │
│  • Sequential hook execution                                            │
│  • Timeout enforcement (with timeout/gtimeout/perl fallback)            │
│  • Retry logic (configurable per hook)                                  │
│  • Output passing (JSON-based)                                          │
│  • Error handling (critical vs non-critical)                            │
│  • Performance tracking (duration, success/failure counts)              │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ Integration Layer                                                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  common.sh (Hook Library Functions)                                     │
│  ├── execute_chain()          (execute a chain from any hook)           │
│  ├── is_chain_enabled()       (check if chain is active)                │
│  ├── get_chain_config()       (read chain configuration)                │
│  ├── get_chain_status()       (check last execution result)             │
│  ├── pass_output_to_next()    (pass data between hooks)                 │
│  └── list_chains()            (list available chains)                   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ Hook Layer                                                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Individual Hooks (.claude/hooks/skill/*.sh)                            │
│  ├── test-runner.sh           (executes tests)                          │
│  ├── coverage-check.sh        (verifies coverage)                       │
│  ├── evidence-collector.sh    (collects evidence)                       │
│  ├── file-guard.sh            (protects files)                          │
│  ├── redact-secrets.sh        (detects secrets)                         │
│  └── ... (other hooks)                                                  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## Execution Flow

### Chain Execution Lifecycle

```
START
  │
  ├─► Load chain-config.json
  │
  ├─► Validate chain exists & enabled
  │
  ├─► Initialize chain state
  │     ├── current_input = initial_input
  │     ├── hooks_executed = 0
  │     ├── hooks_failed = 0
  │     └── start_time = now()
  │
  ├─► FOR EACH hook IN sequence:
  │     │
  │     ├─► Find hook script (.claude/hooks/*/hook-name.sh)
  │     │
  │     ├─► Load hook metadata
  │     │     ├── timeout_seconds
  │     │     ├── retry_count
  │     │     └── critical flag
  │     │
  │     ├─► Execute hook with timeout & retry
  │     │     │
  │     │     ├─► RETRY LOOP (attempts = 0 to retry_count):
  │     │     │     │
  │     │     │     ├─► Create temp input file
  │     │     │     │
  │     │     │     ├─► Execute: bash hook-script < input_file
  │     │     │     │     (with timeout enforcement)
  │     │     │     │
  │     │     │     ├─► Capture output & exit code
  │     │     │     │
  │     │     │     └─► IF exit_code == 0:
  │     │     │           ├─► Log success
  │     │     │           └─► BREAK retry loop
  │     │     │         ELIF exit_code == 124/142 (timeout):
  │     │     │           ├─► Log timeout
  │     │     │           └─► IF attempts < max: RETRY
  │     │     │         ELSE (other error):
  │     │     │           ├─► Log error
  │     │     │           └─► IF attempts < max: RETRY
  │     │     │
  │     │     └─► Return (exit_code, output)
  │     │
  │     ├─► IF hook failed:
  │     │     ├── hooks_failed++
  │     │     └── IF critical OR stop_on_failure:
  │     │           ├─► Log failure & STOP CHAIN
  │     │           └─► RETURN error
  │     │
  │     └─► IF pass_output_to_next:
  │           └─► current_input = hook_output
  │
  ├─► Calculate duration (end_time - start_time)
  │
  ├─► Log chain completion
  │     ├── Chain name
  │     ├── Hooks executed
  │     ├── Hooks failed
  │     └── Duration
  │
  └─► RETURN (success/failure)
```

## Data Flow

### Input/Output Passing

```
Initial Input (JSON):
{
  "tool_name": "Write",
  "file_path": "/test.py",
  "session_id": "abc-123"
}
                │
                ▼
┌───────────────────────────────┐
│ Hook 1: test-runner           │
│ - Reads input via stdin       │
│ - Executes tests              │
│ - Outputs results             │
└───────────────────────────────┘
                │
                ▼
Output (JSON):
{
  "tool_name": "Write",
  "file_path": "/test.py",
  "session_id": "abc-123",
  "test_count": 42,
  "tests_passed": 40,
  "tests_failed": 2
}
                │
                ▼ (if pass_output_to_next = true)
┌───────────────────────────────┐
│ Hook 2: coverage-check        │
│ - Reads enriched input        │
│ - Checks coverage             │
│ - Adds coverage data          │
└───────────────────────────────┘
                │
                ▼
Output (JSON):
{
  "tool_name": "Write",
  "file_path": "/test.py",
  "session_id": "abc-123",
  "test_count": 42,
  "tests_passed": 40,
  "tests_failed": 2,
  "coverage_percent": 87.5
}
                │
                ▼
┌───────────────────────────────┐
│ Hook 3: evidence-collector    │
│ - Reads all accumulated data  │
│ - Collects evidence           │
│ - Logs to evidence file       │
└───────────────────────────────┘
                │
                ▼
Final Output
```

## Chain Types

### 1. Validation Chains (Blocking)

**Characteristics:**
- `stop_on_failure: true`
- Critical hooks
- Fast execution (< 10s)
- No output passing needed

**Example: code_quality**
```
test-pattern-validator (5s, critical)
       ↓
import-direction-enforcer (5s, critical)
       ↓
backend-layer-validator (5s, critical)

If ANY fails → STOP chain → BLOCK operation
```

### 2. Workflow Chains (Non-blocking)

**Characteristics:**
- `stop_on_failure: false`
- Non-critical hooks
- Long execution (up to 300s)
- Output passing enabled

**Example: test_workflow**
```
test-runner (300s, retry=1)
       ↓ (passes test results)
coverage-check (30s)
       ↓ (passes coverage data)
evidence-collector (10s)

If ANY fails → LOG warning → CONTINUE to next hook
```

### 3. Reporting Chains (Non-blocking)

**Characteristics:**
- `stop_on_failure: false`
- Non-critical hooks
- Output passing enabled
- Always runs to completion

**Example: error_handling**
```
error-tracker (5s)
       ↓ (passes error data)
audit-logger (3s, retry=1)
       ↓ (passes log reference)
desktop-notification (2s)

Goal: Collect & report all errors, never block
```

## Timeout Handling Strategy

### Timeout Detection

```
┌─────────────────────────────────────────────────────────────┐
│ Platform-specific Timeout Enforcement                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ IF timeout command exists (Linux):                          │
│   timeout ${timeout}s bash hook-script.sh                   │
│   Exit code 124 = timeout                                   │
│                                                              │
│ ELIF gtimeout command exists (macOS with coreutils):        │
│   gtimeout ${timeout}s bash hook-script.sh                  │
│   Exit code 124 = timeout                                   │
│                                                              │
│ ELSE (fallback for macOS):                                  │
│   perl -e "alarm ${timeout}; exec @ARGV" bash hook-script.sh│
│   Exit code 142 = SIGALRM (timeout)                         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Retry Strategy

```
attempt = 1
max_attempts = retry_count + 1

WHILE attempt <= max_attempts:
  Execute hook

  IF success:
    RETURN success

  IF timeout OR error:
    IF attempt < max_attempts:
      Log retry
      attempt++
      CONTINUE
    ELSE:
      RETURN failure
```

## Error Handling Matrix

| Hook Failed | Critical Flag | Stop on Failure | Result |
|-------------|---------------|-----------------|--------|
| Yes         | true          | -               | Stop chain, return error |
| Yes         | false         | true            | Stop chain, return error |
| Yes         | false         | false           | Log warning, continue |
| No          | -             | -               | Continue to next hook |

## Configuration Schema

### Chain Configuration
```json
{
  "chains": {
    "<chain-name>": {
      "description": "string",
      "sequence": ["hook1", "hook2", "..."],
      "pass_output_to_next": boolean,
      "stop_on_failure": boolean,
      "enabled": boolean
    }
  }
}
```

### Hook Metadata
```json
{
  "hook_metadata": {
    "<hook-name>": {
      "timeout_seconds": number,     // Default: 30
      "retry_count": number,          // Default: 0
      "critical": boolean,            // Default: false
      "description": "string"
    }
  }
}
```

### Execution Settings
```json
{
  "execution_settings": {
    "max_parallel_chains": number,           // Default: 3 (future feature)
    "default_timeout_seconds": number,       // Default: 30
    "default_retry_count": number,           // Default: 0
    "log_level": "info|warn|error",         // Default: info
    "enable_performance_tracking": boolean,  // Default: true
    "enable_chain_visualization": boolean    // Default: false (future feature)
  }
}
```

## Logging Architecture

### Log Levels

```
INFO    - Chain start/completion, hook execution
WARN    - Non-critical hook failures, timeouts
ERROR   - Critical hook failures, chain failures
```

### Log Format

```
[TIMESTAMP] [chain-executor] MESSAGE

Example:
[2026-01-08 20:45:00] [chain-executor] Starting chain: test_workflow - Chain for test execution
[2026-01-08 20:45:00] [chain-executor] Executing hook: test-runner (attempt 1/2)
[2026-01-08 20:46:30] [chain-executor] Hook test-runner completed successfully
[2026-01-08 20:46:30] [chain-executor] Passing output from test-runner to next hook (1234 bytes)
[2026-01-08 20:46:31] [chain-executor] Executing hook: coverage-check (attempt 1/1)
[2026-01-08 20:46:35] [chain-executor] Hook coverage-check completed successfully
[2026-01-08 20:46:35] [chain-executor] Passing output from coverage-check to next hook (1567 bytes)
[2026-01-08 20:46:36] [chain-executor] Executing hook: evidence-collector (attempt 1/1)
[2026-01-08 20:46:40] [chain-executor] Hook evidence-collector completed successfully
[2026-01-08 20:46:40] [chain-executor] Chain completed: test_workflow - duration: 100s
```

### Log Rotation

- Automatic rotation at 200KB
- Compressed with gzip
- Retention: Last 5 rotated logs
- Location: `.claude/logs/chain-execution.log`

## Performance Characteristics

### Overhead

| Operation | Overhead | Notes |
|-----------|----------|-------|
| Chain initialization | ~5ms | Config loading, validation |
| Hook execution startup | ~2ms | Temp file creation, stdin setup |
| Output passing | ~1ms | JSON parsing with jq |
| Logging | ~0.5ms | Append to log file |
| **Total per hook** | **~8ms** | Negligible for most use cases |

### Scaling

| Metric | Current | Future |
|--------|---------|--------|
| Max hooks per chain | Unlimited | Recommend 3-5 |
| Max parallel chains | 1 (sequential) | 3 (planned) |
| Max chain depth | 1 (no nesting) | 3 (planned) |
| Timeout range | 1s - 600s | Configurable |

## Security Considerations

### Input Validation

- All hook inputs are JSON-validated
- jq used for safe JSON parsing (no shell injection)
- Temporary files created in secure locations
- Proper cleanup of temporary files

### Privilege Separation

- Hooks run with same privileges as caller
- No privilege escalation
- No root requirements

### File System Access

- Chain executor only reads from `.claude/hooks/`
- Hooks control their own file access
- Logs written to `.claude/logs/` (user-writable)

## Extension Points

### Adding New Chains

1. Add chain definition to `chain-config.json`
2. Add hook metadata for new hooks
3. Create hook scripts in `.claude/hooks/skill/`
4. Test with: `echo '{}' | .claude/hooks/_orchestration/chain-executor.sh execute my_chain`

### Adding New Hooks

1. Create hook script in `.claude/hooks/skill/my-hook.sh`
2. Add metadata to `chain-config.json`
3. Add to chain sequence
4. Test individually: `echo '{}' | bash .claude/hooks/skill/my-hook.sh`

### Custom Integration

```bash
#!/bin/bash
source "$(dirname "$0")/../_lib/common.sh"

# Your custom logic
if some_condition; then
  execute_chain "my_custom_chain"
fi
```

## Future Enhancements

1. **Parallel Chain Execution**: Run multiple chains concurrently
2. **Chain Dependencies**: Chain A must complete before Chain B
3. **Conditional Hooks**: if/then/else logic within chains
4. **Dynamic Timeouts**: Adjust timeout based on input size
5. **Chain Visualization**: ASCII art showing execution flow
6. **Metrics Dashboard**: Success rates, p95 latency, failure analysis
7. **Webhook Notifications**: POST results to external systems
8. **Chain Replay**: Re-execute failed chains with same input

## Version History

- **v1.0.0** (2026-01-08): Initial release
  - Sequential hook execution
  - Timeout handling with retries
  - Output passing between hooks
  - Comprehensive logging
  - 5 predefined chains
  - 6 helper functions in common.sh

## License

Part of the SkillForge Claude Plugin. See project LICENSE for details.
