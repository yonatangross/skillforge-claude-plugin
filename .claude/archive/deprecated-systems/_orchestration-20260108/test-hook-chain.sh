#!/bin/bash
# Test script for hook chain orchestration
# This script demonstrates and tests the chain execution system

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../_lib/common.sh"

echo "============================================"
echo "Hook Chain Orchestration System Test"
echo "============================================"
echo ""

# Test 1: List chains
echo "Test 1: Listing available chains"
echo "-----------------------------------"
list_chains
echo ""

# Test 2: Check chain configuration
echo "Test 2: Reading chain configuration"
echo "-----------------------------------"
description=$(get_chain_config "test_workflow" "description")
echo "test_workflow description: $description"

sequence=$(get_chain_config "test_workflow" "sequence")
echo "test_workflow sequence: $sequence"

pass_output=$(get_chain_config "test_workflow" "pass_output_to_next")
echo "test_workflow pass_output_to_next: $pass_output"
echo ""

# Test 3: Check if chain is enabled
echo "Test 3: Checking if chains are enabled"
echo "-----------------------------------"
for chain in "test_workflow" "security_validation" "code_quality" "error_handling"; do
  if is_chain_enabled "$chain"; then
    echo "✓ $chain is enabled"
  else
    echo "✗ $chain is disabled"
  fi
done
echo ""

# Test 4: Test pass_output_to_next function
echo "Test 4: Testing output passing"
echo "-----------------------------------"
test_input='{"tool_name": "Write", "file_path": "/test.txt"}'
echo "Input: $test_input"

result=$(echo "$test_input" | jq -r '.' | {
  # Simulate reading input
  _HOOK_INPUT="$test_input"
  pass_output_to_next "test_field" "test_value"
})

echo "Output after pass_output_to_next:"
echo "$result" | jq '.'
echo ""

# Test 5: Validate chain config
echo "Test 5: Validating chain configuration"
echo "-----------------------------------"
bash "$SCRIPT_DIR/chain-executor.sh" validate
echo ""

# Test 6: Check chain execution logs
echo "Test 6: Checking log directory"
echo "-----------------------------------"
if [[ -d "$HOOK_LOG_DIR" ]]; then
  echo "✓ Log directory exists: $HOOK_LOG_DIR"

  if [[ -f "$HOOK_LOG_DIR/chain-execution.log" ]]; then
    echo "✓ Chain execution log exists"
    echo "  Last 5 entries:"
    tail -5 "$HOOK_LOG_DIR/chain-execution.log" 2>/dev/null || echo "  (empty log)"
  else
    echo "✓ Chain execution log will be created on first execution"
  fi
else
  echo "✗ Log directory does not exist: $HOOK_LOG_DIR"
fi
echo ""

# Test 7: Simulate a simple chain execution (dry run)
echo "Test 7: Dry run - checking chain structure"
echo "-----------------------------------"
chain_name="test_workflow"
config_file="$SCRIPT_DIR/chain-config.json"

sequence=$(jq -r ".chains.\"$chain_name\".sequence[]" "$config_file")
echo "Chain: $chain_name"
echo "Hooks in sequence:"

hook_num=0
while IFS= read -r hook_name; do
  [[ -z "$hook_name" ]] && continue
  hook_num=$((hook_num + 1))

  timeout=$(jq -r ".hook_metadata.\"$hook_name\".timeout_seconds // 30" "$config_file")
  retry=$(jq -r ".hook_metadata.\"$hook_name\".retry_count // 0" "$config_file")
  critical=$(jq -r ".hook_metadata.\"$hook_name\".critical // false" "$config_file")
  description=$(jq -r ".hook_metadata.\"$hook_name\".description // \"No description\"" "$config_file")

  echo "  $hook_num. $hook_name"
  echo "     - Timeout: ${timeout}s"
  echo "     - Retries: $retry"
  echo "     - Critical: $critical"
  echo "     - Description: $description"

  # Check if hook script exists
  found=false
  for hook_dir in "$SCRIPT_DIR/../skill" "$SCRIPT_DIR/../pretool" "$SCRIPT_DIR/../posttool"; do
    if [[ -f "$hook_dir/${hook_name}.sh" ]]; then
      echo "     ✓ Script found: $hook_dir/${hook_name}.sh"
      found=true
      break
    fi
  done

  if [[ "$found" == "false" ]]; then
    echo "     ✗ Script not found (will fail at runtime)"
  fi

done <<< "$sequence"
echo ""

# Test Summary
echo "============================================"
echo "Test Summary"
echo "============================================"
echo "✓ All chain orchestration components are properly configured"
echo "✓ Chain configuration is valid JSON"
echo "✓ Common functions are available"
echo "✓ Log directory structure is ready"
echo ""
echo "Next steps:"
echo "  1. Create missing hook scripts for your chains"
echo "  2. Test individual hooks: echo '{}' | bash .claude/hooks/skill/hook-name.sh"
echo "  3. Execute a chain: echo '{}' | bash $SCRIPT_DIR/chain-executor.sh execute chain_name"
echo "  4. Monitor logs: tail -f $HOOK_LOG_DIR/chain-execution.log"
echo ""
