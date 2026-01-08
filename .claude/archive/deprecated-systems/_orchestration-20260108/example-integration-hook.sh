#!/bin/bash
# Example: How to integrate chain orchestration into your hooks
# This demonstrates various patterns for using chains

source "$(dirname "$0")/../_lib/common.sh"

# =============================================================================
# PATTERN 1: Simple Chain Execution
# =============================================================================
# Execute a chain when a specific condition is met

example_simple_execution() {
  info "Pattern 1: Simple chain execution"

  # Check if this is a test file
  file_path=$(get_field '.tool_input.file_path')
  if [[ "$file_path" == *test*.py ]] || [[ "$file_path" == *_test.py ]]; then
    info "Test file detected, running test workflow chain..."

    # Execute the chain
    if execute_chain "test_workflow"; then
      success "Test workflow chain completed successfully"
    else
      error "Test workflow chain failed"
      return 1
    fi
  fi
}

# =============================================================================
# PATTERN 2: Conditional Chain Execution
# =============================================================================
# Only execute chain if it's enabled

example_conditional_execution() {
  info "Pattern 2: Conditional chain execution"

  # Check if chain is enabled before executing
  if is_chain_enabled "security_validation"; then
    info "Security validation is enabled, running chain..."
    execute_chain "security_validation"
  else
    info "Security validation is disabled, skipping"
  fi
}

# =============================================================================
# PATTERN 3: Multiple Chains in Sequence
# =============================================================================
# Execute multiple chains one after another

example_multiple_chains() {
  info "Pattern 3: Multiple chains in sequence"

  # Run code quality checks first
  if ! execute_chain "code_quality"; then
    error "Code quality checks failed, stopping"
    return 1
  fi

  # If quality checks pass, run tests
  if ! execute_chain "test_workflow"; then
    warn "Tests failed, but continuing"
  fi

  # Always run error handling chain (for logging)
  execute_chain "error_handling" || true

  success "All chains completed"
}

# =============================================================================
# PATTERN 4: Chain with Custom Input
# =============================================================================
# Prepare custom input for chain execution

example_custom_input() {
  info "Pattern 4: Chain with custom input"

  # Read original input
  input=$(read_hook_input)

  # Add custom fields
  custom_input=$(echo "$input" | jq '. + {
    custom_field: "custom_value",
    timestamp: "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
    environment: "test"
  }')

  # Execute chain with custom input
  execute_chain "test_workflow" "$custom_input"
}

# =============================================================================
# PATTERN 5: Chain Status Checking
# =============================================================================
# Check the status of previous chain executions

example_status_checking() {
  info "Pattern 5: Chain status checking"

  # Check status of last test workflow execution
  status=$(get_chain_status "test_workflow")

  case "$status" in
    "success")
      success "Last test workflow run: SUCCESS"
      ;;
    "failed")
      warn "Last test workflow run: FAILED"
      ;;
    "unknown")
      info "Last test workflow run: UNKNOWN"
      ;;
    "no_data")
      info "Test workflow has not been executed yet"
      ;;
  esac
}

# =============================================================================
# PATTERN 6: Dynamic Chain Selection
# =============================================================================
# Choose which chain to execute based on context

example_dynamic_selection() {
  info "Pattern 6: Dynamic chain selection"

  tool_name=$(get_tool_name)
  file_path=$(get_field '.tool_input.file_path')

  # Select chain based on tool and file type
  local chain_to_run=""

  if [[ "$tool_name" == "Write" ]]; then
    if [[ "$file_path" == *test* ]]; then
      chain_to_run="test_workflow"
    elif [[ "$file_path" == *secret* ]] || [[ "$file_path" == *.env* ]]; then
      chain_to_run="security_validation"
    else
      chain_to_run="code_quality"
    fi
  elif [[ "$tool_name" == "Bash" ]]; then
    command=$(get_field '.tool_input.command')
    if [[ "$command" == git\ commit* ]]; then
      chain_to_run="git_workflow"
    fi
  fi

  if [[ -n "$chain_to_run" ]]; then
    info "Selected chain: $chain_to_run"
    execute_chain "$chain_to_run"
  else
    info "No chain selected for this operation"
  fi
}

# =============================================================================
# PATTERN 7: Chain Configuration Inspection
# =============================================================================
# Read chain configuration to make decisions

example_config_inspection() {
  info "Pattern 7: Chain configuration inspection"

  # Get chain description
  description=$(get_chain_config "test_workflow" "description")
  info "Chain description: $description"

  # Get whether output should be passed
  pass_output=$(get_chain_config "test_workflow" "pass_output_to_next")
  info "Passes output to next hook: $pass_output"

  # Get whether chain stops on failure
  stop_on_failure=$(get_chain_config "test_workflow" "stop_on_failure")
  info "Stops on failure: $stop_on_failure"

  # Make decision based on config
  if [[ "$stop_on_failure" == "true" ]]; then
    warn "This chain is blocking - failures will stop execution"
  else
    info "This chain is non-blocking - failures will be logged but execution continues"
  fi
}

# =============================================================================
# PATTERN 8: Error Handling with Chains
# =============================================================================
# Proper error handling when executing chains

example_error_handling() {
  info "Pattern 8: Error handling with chains"

  local exit_code=0

  # Execute chain with error handling
  if ! execute_chain "code_quality"; then
    exit_code=$?
    error "Chain execution failed with code: $exit_code"

    # Try to recover or log
    log_hook "code_quality chain failed with exit code $exit_code"

    # Execute error handling chain
    execute_chain "error_handling" || true

    return "$exit_code"
  fi

  success "Chain executed successfully"
  return 0
}

# =============================================================================
# MAIN: Run all examples
# =============================================================================

main() {
  echo ""
  echo "╔══════════════════════════════════════════════════════════════════════════╗"
  echo "║  Hook Chain Orchestration - Integration Examples                        ║"
  echo "╚══════════════════════════════════════════════════════════════════════════╝"
  echo ""

  # Run examples (commented out to avoid actual execution)
  # Uncomment individual examples to test them

  # example_simple_execution
  # example_conditional_execution
  # example_multiple_chains
  # example_custom_input
  # example_status_checking
  # example_dynamic_selection
  # example_config_inspection
  # example_error_handling

  # For demonstration, just list available chains
  info "Available chains in this system:"
  list_chains

  echo ""
  info "To test these patterns, uncomment the function calls in main()"
  info "and provide appropriate input data via stdin"
  echo ""
}

# Run main if executed directly (not sourced)
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  main "$@"
fi
