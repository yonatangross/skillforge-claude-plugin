# Hook Chain Orchestration System

A robust system for executing hooks in sequence with output passing, timeout handling, retry logic, and comprehensive error handling.

## Overview

The Hook Chain Orchestration System allows you to define sequences of hooks that execute together as a chain. Each chain can:

- Execute hooks in a specific order
- Pass output from one hook to the next
- Handle timeouts with configurable retry logic
- Stop on failure or continue through errors
- Track execution metrics and performance
- Log all operations for debugging

## Architecture

### Components

1. **chain-config.json**: Configuration file defining chains, hooks, and execution settings
2. **chain-executor.sh**: Bash script that executes chains based on configuration
3. **common.sh**: Library functions for easy chain integration in hooks

### Directory Structure

```
.claude/hooks/
├── _orchestration/
│   ├── chain-config.json      # Chain definitions and hook metadata
│   ├── chain-executor.sh      # Chain execution engine
│   └── README.md              # This file
├── _lib/
│   └── common.sh              # Common utilities with chain functions
└── skill/                      # Individual hook scripts
```

## Configuration

### Chain Definition

Each chain in `chain-config.json` has the following structure:

```json
{
  "chains": {
    "chain_name": {
      "description": "Human-readable description",
      "sequence": ["hook1", "hook2", "hook3"],
      "pass_output_to_next": true,
      "stop_on_failure": false,
      "enabled": true
    }
  }
}
```

**Fields:**
- `description`: What the chain does
- `sequence`: Array of hook names to execute in order
- `pass_output_to_next`: If true, each hook's output becomes the next hook's input
- `stop_on_failure`: If true, stop chain on first failure; if false, continue
- `enabled`: If false, chain execution is skipped

### Hook Metadata

Each hook can have metadata for execution control:

```json
{
  "hook_metadata": {
    "hook_name": {
      "timeout_seconds": 30,
      "retry_count": 1,
      "critical": true,
      "description": "What the hook does"
    }
  }
}
```

**Fields:**
- `timeout_seconds`: Maximum execution time (default: 30)
- `retry_count`: Number of retries on failure (default: 0)
- `critical`: If true, chain stops if this hook fails
- `description`: Human-readable description

## Pre-defined Chains

### 1. error_handling

**Purpose**: Handle errors with logging and notifications

**Sequence**: error-tracker → audit-logger → desktop-notification

**Configuration**:
- Passes output between hooks
- Continues on failure (non-blocking)
- Suitable for error tracking and reporting

### 2. security_validation

**Purpose**: Security validation before file writes

**Sequence**: file-guard → redact-secrets → security-summary

**Configuration**:
- Passes output between hooks
- Stops on failure (blocking)
- Critical security checks

### 3. test_workflow

**Purpose**: Test execution and coverage verification

**Sequence**: test-runner → coverage-check → evidence-collector

**Configuration**:
- Passes output between hooks
- Continues on failure (collects all evidence)
- Long timeout for test-runner (300s)

### 4. code_quality

**Purpose**: Code quality validation

**Sequence**: test-pattern-validator → import-direction-enforcer → backend-layer-validator

**Configuration**:
- Does not pass output between hooks
- Stops on failure (blocking)
- Fast validation checks

### 5. git_workflow

**Purpose**: Git operations with validation

**Sequence**: branch-protector → audit-logger → desktop-notification

**Configuration**:
- Passes output between hooks
- Stops on failure (blocks commits to protected branches)

## Usage

### Command Line

#### Execute a Chain

```bash
# Execute with input from stdin
echo '{"tool_name": "Write", "file_path": "/path/to/file"}' | \
  .claude/hooks/_orchestration/chain-executor.sh execute test_workflow

# Or directly
.claude/hooks/_orchestration/chain-executor.sh execute chain_name < input.json
```

#### List Available Chains

```bash
.claude/hooks/_orchestration/chain-executor.sh list
```

Output:
```
Available chains:
  - error_handling (enabled): Chain for handling errors with logging and notification
  - security_validation (enabled): Chain for security validation before writes
  - test_workflow (enabled): Chain for test execution and coverage
  - code_quality (enabled): Chain for code quality checks
  - git_workflow (enabled): Chain for git operations with validation
```

#### Validate Configuration

```bash
.claude/hooks/_orchestration/chain-executor.sh validate
```

### From Hooks (using common.sh)

```bash
#!/bin/bash
source "$(dirname "$0")/../_lib/common.sh"

# Check if chain is enabled
if is_chain_enabled "test_workflow"; then
  info "Test workflow chain is enabled"
fi

# Execute a chain
execute_chain "test_workflow"

# Get chain configuration
description=$(get_chain_config "test_workflow" "description")
echo "Chain description: $description"

# Get chain execution status
status=$(get_chain_status "test_workflow")
echo "Last execution: $status"

# List all chains
list_chains
```

### Output Passing Between Hooks

Hooks can pass structured data to the next hook in the chain:

```bash
#!/bin/bash
source "$(dirname "$0")/../_lib/common.sh"

# Read input from previous hook
input=$(read_hook_input)

# Do some work
result="processing complete"

# Pass output to next hook
pass_output_to_next "my_result" "$result"
```

This creates/updates a JSON object that the next hook receives:

```json
{
  "tool_name": "Write",
  "file_path": "/path/to/file",
  "my_result": "processing complete"
}
```

## Execution Flow

### Normal Execution

```
1. Chain starts
2. For each hook in sequence:
   a. Load hook metadata (timeout, retries, critical flag)
   b. Execute hook with current input
   c. If pass_output_to_next=true, use hook output as next input
   d. Handle timeouts and retries
   e. Check if should continue based on stop_on_failure
3. Log chain completion
4. Return overall success/failure
```

### Timeout Handling

```
1. Hook execution starts
2. If hook runs longer than timeout_seconds:
   a. Hook is terminated (SIGALRM/124)
   b. If retry_count > 0, retry hook
   c. If all retries exhausted, mark as failed
3. Log timeout event
```

### Error Handling

```
1. Hook returns non-zero exit code
2. Check if hook is critical OR stop_on_failure=true
3. If critical/blocking:
   a. Stop chain immediately
   b. Log failure
   c. Return error to caller
4. If non-critical/non-blocking:
   a. Log warning
   b. Continue to next hook
   c. Track failure count
```

## Logging

### Chain Execution Log

Located at: `.claude/logs/chain-execution.log`

Format:
```
[2026-01-08 12:00:00] [chain-executor] Starting chain: test_workflow - Chain for test execution
[2026-01-08 12:00:00] [chain-executor] Executing hook: test-runner (attempt 1/2)
[2026-01-08 12:01:30] [chain-executor] Hook test-runner completed successfully
[2026-01-08 12:01:30] [chain-executor] Passing output from test-runner to next hook (1234 bytes)
[2026-01-08 12:01:30] [chain-executor] Chain completed: test_workflow - duration: 90s
```

### Log Rotation

Chain execution logs are automatically rotated when they exceed 200KB, with compression and retention of the last 5 rotated logs.

## Performance Tracking

When `enable_performance_tracking` is enabled in `execution_settings`, the chain executor tracks:

- Total execution time per chain
- Number of hooks executed
- Number of hooks failed
- Timeout occurrences
- Retry attempts

## Exit Codes

- **0**: Chain executed successfully (all hooks passed)
- **1**: Chain failed (critical hook failed or stop_on_failure triggered)
- **124**: Chain timed out (hook timeout not recovered by retries)

## Best Practices

### 1. Chain Design

- Keep chains focused on a single purpose
- Use 3-5 hooks per chain (sweet spot for maintainability)
- Order hooks from most critical to least critical
- Use `stop_on_failure=true` for validation chains
- Use `stop_on_failure=false` for reporting chains

### 2. Hook Timeouts

- Set realistic timeouts based on expected execution time
- Test runners: 300s (5 minutes)
- File operations: 5-10s
- Network calls: 30s
- Quick checks: 2-5s

### 3. Retry Logic

- Use retries for network-dependent hooks
- Don't retry for validation failures (they'll fail again)
- Limit retries to 1-2 attempts to avoid long delays

### 4. Output Passing

- Only enable `pass_output_to_next` when hooks need to share data
- Keep passed data small (< 100KB) for performance
- Use JSON format for structured data
- Document expected input/output format for each hook

### 5. Critical Flags

- Mark security hooks as critical
- Mark validation hooks as critical
- Don't mark reporting hooks as critical
- Critical hooks should fail fast

## Examples

### Example 1: Test Workflow Chain

Execute tests, check coverage, and collect evidence:

```bash
# From a pretool hook
#!/bin/bash
source "$(dirname "$0")/../_lib/common.sh"

# Only run on test file writes
file_path=$(get_field '.tool_input.file_path')
if [[ "$file_path" == *test*.py ]] || [[ "$file_path" == *test*.ts ]]; then
  info "Running test workflow chain..."
  execute_chain "test_workflow"
fi
```

### Example 2: Security Validation Chain

Validate security before allowing writes:

```bash
#!/bin/bash
source "$(dirname "$0")/../_lib/common.sh"

# Run security validation before any write
if command_matches "Write"; then
  chain_info "Running security validation..."

  if ! execute_chain "security_validation"; then
    block_with_error "Security Validation Failed" \
      "The security validation chain detected issues. Check logs for details."
  fi
fi
```

### Example 3: Custom Hook with Output Passing

```bash
#!/bin/bash
source "$(dirname "$0")/../_lib/common.sh"

# Read input from previous hook or stdin
input=$(read_hook_input)

# Extract relevant fields
tool_name=$(echo "$input" | jq -r '.tool_name // ""')
file_path=$(echo "$input" | jq -r '.file_path // ""')

# Do work
test_count=42
coverage_percent=87.5

# Pass results to next hook
echo "$input" | jq \
  --arg tests "$test_count" \
  --arg coverage "$coverage_percent" \
  '. + {test_count: $tests, coverage_percent: $coverage}'
```

## Troubleshooting

### Chain Not Executing

1. Check if chain is enabled: `get_chain_config "chain_name" "enabled"`
2. Verify chain exists in config: `.claude/hooks/_orchestration/chain-executor.sh list`
3. Check logs: `cat .claude/logs/chain-execution.log`

### Hook Timing Out

1. Increase timeout in `hook_metadata`
2. Check if hook is hanging (infinite loop, waiting for input)
3. Test hook individually: `echo '{}' | bash .claude/hooks/skill/hook-name.sh`

### Output Not Passing Between Hooks

1. Verify `pass_output_to_next: true` in chain config
2. Check hook output is valid JSON
3. Debug with: `echo '{}' | bash .claude/hooks/_orchestration/chain-executor.sh execute chain_name`

### Chain Stopping Unexpectedly

1. Check if `stop_on_failure: true`
2. Look for critical hooks failing: `grep "Critical hook failed" .claude/logs/chain-execution.log`
3. Review exit codes of individual hooks

## Advanced Configuration

### Parallel Chain Execution

Currently, chains execute sequentially. For parallel execution, set:

```json
{
  "execution_settings": {
    "max_parallel_chains": 3
  }
}
```

Note: Parallel execution is planned for future implementation.

### Custom Timeout Strategies

For hooks that need variable timeouts based on input size:

```bash
# In your hook
input_size=$(echo "$input" | wc -c)
if [[ $input_size -gt 100000 ]]; then
  # Large input, needs more time
  # (Timeout override not yet implemented - use fixed timeout)
fi
```

## Future Enhancements

Planned features:

1. Parallel chain execution
2. Chain dependencies (chain A must complete before chain B)
3. Conditional hook execution (if/then/else logic)
4. Dynamic timeout calculation based on input
5. Chain visualization (ASCII diagram of execution flow)
6. Metrics dashboard (success rates, average duration)
7. Webhook notifications on chain completion
8. Chain replay (re-execute failed chains)

## Contributing

To add a new chain:

1. Define chain in `chain-config.json`:
   ```json
   {
     "chains": {
       "my_chain": {
         "description": "My custom chain",
         "sequence": ["hook1", "hook2"],
         "pass_output_to_next": true,
         "stop_on_failure": false,
         "enabled": true
       }
     }
   }
   ```

2. Add hook metadata:
   ```json
   {
     "hook_metadata": {
       "hook1": {
         "timeout_seconds": 10,
         "retry_count": 1,
         "critical": false,
         "description": "First hook"
       }
     }
   }
   ```

3. Test the chain:
   ```bash
   .claude/hooks/_orchestration/chain-executor.sh validate
   echo '{}' | .claude/hooks/_orchestration/chain-executor.sh execute my_chain
   ```

4. Integrate into hooks:
   ```bash
   source "$(dirname "$0")/../_lib/common.sh"
   execute_chain "my_chain"
   ```

## License

Part of the SkillForge Claude Plugin. See project LICENSE for details.
