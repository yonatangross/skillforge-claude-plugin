# Hook Chain Orchestration - Quick Reference

## Command Line Usage

```bash
# List all available chains
.claude/hooks/_orchestration/chain-executor.sh list

# Validate configuration
.claude/hooks/_orchestration/chain-executor.sh validate

# Execute a chain (with JSON input via stdin)
echo '{"tool_name": "Write", "file_path": "/test.py"}' | \
  .claude/hooks/_orchestration/chain-executor.sh execute test_workflow
```

## Hook Integration (Bash)

### Basic Setup
```bash
#!/bin/bash
source "$(dirname "$0")/../_lib/common.sh"
```

### Execute a Chain
```bash
# Simple execution
execute_chain "test_workflow"

# With custom input
execute_chain "test_workflow" '{"custom": "data"}'

# With error handling
if ! execute_chain "code_quality"; then
  error "Code quality checks failed"
  exit 1
fi
```

### Check Chain Status
```bash
# Check if chain is enabled
if is_chain_enabled "security_validation"; then
  execute_chain "security_validation"
fi

# Get last execution status
status=$(get_chain_status "test_workflow")
# Returns: "success", "failed", "unknown", or "no_data"
```

### Read Configuration
```bash
# Get chain description
description=$(get_chain_config "test_workflow" "description")

# Get sequence of hooks
sequence=$(get_chain_config "test_workflow" "sequence")

# Get whether chain stops on failure
stop_on_failure=$(get_chain_config "test_workflow" "stop_on_failure")
```

### Pass Output Between Hooks
```bash
# Add a field to pass to next hook
pass_output_to_next "test_count" "42"

# Result: {"tool_name": "...", "test_count": "42"}
```

## Available Chains

| Chain | Description | Blocking |
|-------|-------------|----------|
| `error_handling` | Error tracking with logging and notifications | No |
| `security_validation` | Security checks before writes | Yes |
| `test_workflow` | Test execution and coverage verification | No |
| `code_quality` | Code quality validation checks | Yes |
| `git_workflow` | Git operation validation | Yes |

## Common Patterns

### Pattern 1: Conditional Execution
```bash
file_path=$(get_field '.tool_input.file_path')
if [[ "$file_path" == *test*.py ]]; then
  execute_chain "test_workflow"
fi
```

### Pattern 2: Multiple Chains
```bash
# Run quality checks first, then tests
execute_chain "code_quality" && execute_chain "test_workflow"
```

### Pattern 3: Dynamic Selection
```bash
tool_name=$(get_tool_name)
if [[ "$tool_name" == "Write" ]]; then
  execute_chain "security_validation"
elif [[ "$tool_name" == "Bash" ]]; then
  execute_chain "git_workflow"
fi
```

### Pattern 4: Error Recovery
```bash
if ! execute_chain "test_workflow"; then
  warn "Tests failed, running error handler"
  execute_chain "error_handling" || true
fi
```

## Configuration Structure

### Chain Definition
```json
{
  "chains": {
    "my_chain": {
      "description": "What the chain does",
      "sequence": ["hook1", "hook2", "hook3"],
      "pass_output_to_next": true,
      "stop_on_failure": false,
      "enabled": true
    }
  }
}
```

### Hook Metadata
```json
{
  "hook_metadata": {
    "my_hook": {
      "timeout_seconds": 30,
      "retry_count": 1,
      "critical": false,
      "description": "What the hook does"
    }
  }
}
```

## Exit Codes

- `0` - Success (all hooks passed)
- `1` - Failure (critical hook failed or stop_on_failure triggered)
- `124` - Timeout (hook timeout not recovered by retries)

## Logging

### View Chain Execution Logs
```bash
tail -f .claude/logs/chain-execution.log
```

### Log Format
```
[2026-01-08 20:45:00] [chain-executor] Starting chain: test_workflow
[2026-01-08 20:45:00] [chain-executor] Executing hook: test-runner (attempt 1/2)
[2026-01-08 20:46:30] [chain-executor] Hook test-runner completed successfully
[2026-01-08 20:46:30] [chain-executor] Chain completed: test_workflow - duration: 90s
```

## Troubleshooting

### Chain Not Executing
```bash
# Check if enabled
.claude/hooks/_orchestration/chain-executor.sh list

# Validate config
.claude/hooks/_orchestration/chain-executor.sh validate

# Check logs
tail -20 .claude/logs/chain-execution.log
```

### Hook Timing Out
```bash
# Test hook individually
echo '{}' | bash .claude/hooks/skill/hook-name.sh

# Check timeout in config
jq '.hook_metadata."hook-name".timeout_seconds' \
  .claude/hooks/_orchestration/chain-config.json
```

### Output Not Passing
```bash
# Verify pass_output_to_next is true
jq '.chains.my_chain.pass_output_to_next' \
  .claude/hooks/_orchestration/chain-config.json

# Test output passing
echo '{"test": "data"}' | bash -c '
  source .claude/hooks/_lib/common.sh
  _HOOK_INPUT=$(cat)
  pass_output_to_next "new_field" "value"
'
```

## Best Practices

1. **Timeouts**: Set realistic timeouts (tests: 300s, checks: 5s)
2. **Retries**: Use 1-2 retries for network operations, 0 for validations
3. **Critical Flags**: Mark security/validation hooks as critical
4. **Stop on Failure**: Use `true` for validation chains, `false` for reporting
5. **Output Passing**: Only enable when hooks need to share data

## Testing

Run the test suite:
```bash
bash .claude/hooks/_orchestration/test-hook-chain.sh
```

View integration examples:
```bash
bash .claude/hooks/_orchestration/example-integration-hook.sh
```

## Files

- **Configuration**: `.claude/hooks/_orchestration/chain-config.json`
- **Executor**: `.claude/hooks/_orchestration/chain-executor.sh`
- **Common Functions**: `.claude/hooks/_lib/common.sh`
- **Full Documentation**: `.claude/hooks/_orchestration/README.md`
- **Examples**: `.claude/hooks/_orchestration/example-integration-hook.sh`
- **Tests**: `.claude/hooks/_orchestration/test-hook-chain.sh`

## Support

For detailed documentation, see: `.claude/hooks/_orchestration/README.md`
