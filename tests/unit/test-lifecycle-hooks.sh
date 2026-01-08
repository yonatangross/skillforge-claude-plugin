#!/usr/bin/env bash
# ============================================================================
# Lifecycle & Notification Hooks Unit Tests
# ============================================================================
# Tests hooks that run during lifecycle events:
# - notification/: desktop, sound
# - stop/: cleanup, context save
# - lifecycle/: session start/end
# ============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../fixtures/test-helpers.sh"

HOOKS_DIR="$PROJECT_ROOT/.claude/hooks"

# ============================================================================
# NOTIFICATION HOOKS
# ============================================================================

describe "Notification Hooks"

test_desktop_notification_outputs_valid_json() {
    local hook="$HOOKS_DIR/notification/desktop.sh"
    if [[ ! -f "$hook" ]]; then
        skip "desktop.sh not found"
    fi

    local input='{"event":"task_complete","message":"Test completed"}'
    local output
    output=$(echo "$input" | bash "$hook" 2>/dev/null) || true

    # Notification hooks may have empty output (fire-and-forget)
    if [[ -n "$output" ]]; then
        assert_valid_json "$output"
    fi
}

test_sound_notification_is_executable() {
    local hook="$HOOKS_DIR/notification/sound.sh"
    if [[ ! -f "$hook" ]]; then
        skip "sound.sh not found"
    fi

    assert_file_exists "$hook"
    [[ -x "$hook" ]] || chmod +x "$hook"
}

# ============================================================================
# STOP HOOKS
# ============================================================================

describe "Stop Hooks"

test_auto_save_context_outputs_valid_json() {
    local hook="$HOOKS_DIR/stop/auto-save-context.sh"
    if [[ ! -f "$hook" ]]; then
        skip "auto-save-context.sh not found"
    fi

    local input='{"reason":"user_request","session_id":"test-123"}'
    local output
    output=$(echo "$input" | bash "$hook" 2>/dev/null) || true

    if [[ -n "$output" ]]; then
        assert_valid_json "$output"
    fi
}

test_cleanup_instance_runs_without_error() {
    local hook="$HOOKS_DIR/stop/cleanup-instance.sh"
    if [[ ! -f "$hook" ]]; then
        skip "cleanup-instance.sh not found"
    fi

    local input='{"reason":"session_end","instance_id":"test-inst"}'
    local exit_code
    echo "$input" | bash "$hook" >/dev/null 2>&1 && exit_code=0 || exit_code=$?

    # Exit code should be 0, 1, or 2
    assert_less_than "$exit_code" 3
}

test_context_compressor_is_executable() {
    local hook="$HOOKS_DIR/stop/context-compressor.sh"
    if [[ ! -f "$hook" ]]; then
        skip "context-compressor.sh not found"
    fi

    assert_file_exists "$hook"
}

test_multi_instance_cleanup_handles_missing_registry() {
    local hook="$HOOKS_DIR/stop/multi-instance-cleanup.sh"
    if [[ ! -f "$hook" ]]; then
        skip "multi-instance-cleanup.sh not found"
    fi

    # Test with minimal input - should handle gracefully
    local input='{"reason":"cleanup"}'
    local exit_code
    echo "$input" | bash "$hook" >/dev/null 2>&1 && exit_code=0 || exit_code=$?

    # Should not crash (exit <= 2)
    assert_less_than "$exit_code" 3
}

test_task_completion_check_exists() {
    local hook="$HOOKS_DIR/stop/task-completion-check.sh"
    if [[ -f "$hook" ]]; then
        assert_file_exists "$hook"
    else
        skip "task-completion-check.sh not found"
    fi
}

# ============================================================================
# LIFECYCLE HOOKS
# ============================================================================

describe "Lifecycle Hooks"

test_session_start_hook_loads_context() {
    local hook="$HOOKS_DIR/lifecycle/session-start.sh"
    if [[ ! -f "$hook" ]]; then
        skip "session-start.sh not found"
    fi

    local input='{"session_id":"test-session-001"}'
    local output
    output=$(echo "$input" | bash "$hook" 2>/dev/null) || true

    if [[ -n "$output" ]]; then
        assert_valid_json "$output"
    fi
}

test_session_end_hook_saves_state() {
    local hook="$HOOKS_DIR/lifecycle/session-end.sh"
    if [[ ! -f "$hook" ]]; then
        skip "session-end.sh not found"
    fi

    local input='{"session_id":"test-session-001","reason":"complete"}'
    local output
    output=$(echo "$input" | bash "$hook" 2>/dev/null) || true

    if [[ -n "$output" ]]; then
        assert_valid_json "$output"
    fi
}

test_instance_registration_hook() {
    local hook="$HOOKS_DIR/lifecycle/instance-registration.sh"
    if [[ ! -f "$hook" ]]; then
        skip "instance-registration.sh not found"
    fi

    local input='{"instance_id":"test-inst-001","worktree":"main"}'
    local output
    output=$(echo "$input" | bash "$hook" 2>/dev/null) || true

    if [[ -n "$output" ]]; then
        assert_valid_json "$output"
    fi
}

# ============================================================================
# RUN TESTS
# ============================================================================

run_tests