#!/usr/bin/env bash
# ============================================================================
# Memory Commands Unit Tests
# ============================================================================
# Tests for memory/feedback slash commands:
# - /remember (remember.md)
# - /recall (recall.md)
# - /skf:feedback (feedback.md)
# ============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../fixtures/test-helpers.sh"

COMMANDS_DIR="$PROJECT_ROOT/.claude/commands"

# ============================================================================
# /remember COMMAND TESTS
# ============================================================================

describe "Command: /remember"

test_remember_command_exists() {
    assert_file_exists "$COMMANDS_DIR/remember.md"
}

test_remember_has_usage_section() {
    assert_file_contains "$COMMANDS_DIR/remember.md" "## Usage"
}

test_remember_has_categories() {
    local file="$COMMANDS_DIR/remember.md"

    assert_file_contains "$file" "decision"
    assert_file_contains "$file" "architecture"
    assert_file_contains "$file" "pattern"
    assert_file_contains "$file" "blocker"
    assert_file_contains "$file" "constraint"
}

test_remember_references_mem0_tool() {
    assert_file_contains "$COMMANDS_DIR/remember.md" "mcp__mem0__add_memory"
}

test_remember_has_instructions() {
    assert_file_contains "$COMMANDS_DIR/remember.md" "## Instructions"
}

test_remember_has_examples() {
    assert_file_contains "$COMMANDS_DIR/remember.md" "## Examples"
}

test_remember_has_auto_detect_logic() {
    assert_file_contains "$COMMANDS_DIR/remember.md" "Auto-detect"
}

test_remember_specifies_user_id_format() {
    # Should specify the user_id format for mem0
    assert_file_contains "$COMMANDS_DIR/remember.md" "user_id"
}

# ============================================================================
# /recall COMMAND TESTS
# ============================================================================

describe "Command: /recall"

test_recall_command_exists() {
    assert_file_exists "$COMMANDS_DIR/recall.md"
}

test_recall_has_usage_section() {
    assert_file_contains "$COMMANDS_DIR/recall.md" "## Usage"
}

test_recall_has_options() {
    local file="$COMMANDS_DIR/recall.md"

    grep -q "category" "$file" || fail "recall.md should mention category option"
    grep -q "limit" "$file" || fail "recall.md should mention limit option"
}

test_recall_references_mem0_search() {
    assert_file_contains "$COMMANDS_DIR/recall.md" "mcp__mem0__search_memories"
}

test_recall_has_instructions() {
    assert_file_contains "$COMMANDS_DIR/recall.md" "## Instructions"
}

test_recall_has_examples() {
    assert_file_contains "$COMMANDS_DIR/recall.md" "## Examples"
}

test_recall_has_time_formatting() {
    assert_file_contains "$COMMANDS_DIR/recall.md" "Time Formatting"
}

test_recall_has_error_handling() {
    assert_file_contains "$COMMANDS_DIR/recall.md" "Error Handling"
}

# ============================================================================
# /skf:feedback COMMAND TESTS
# ============================================================================

describe "Command: /skf:feedback"

test_feedback_command_exists() {
    assert_file_exists "$COMMANDS_DIR/feedback.md"
}

test_feedback_has_usage_section() {
    assert_file_contains "$COMMANDS_DIR/feedback.md" "## Usage"
}

test_feedback_has_subcommands() {
    local file="$COMMANDS_DIR/feedback.md"

    assert_file_contains "$file" "status"
    assert_file_contains "$file" "pause"
    assert_file_contains "$file" "resume"
    assert_file_contains "$file" "reset"
    assert_file_contains "$file" "export"
    assert_file_contains "$file" "settings"
    assert_file_contains "$file" "opt-in"
    assert_file_contains "$file" "opt-out"
}

test_feedback_has_subcommand_sections() {
    local file="$COMMANDS_DIR/feedback.md"

    assert_file_contains "$file" "### status"
    assert_file_contains "$file" "### pause"
    assert_file_contains "$file" "### reset"
}

test_feedback_has_file_locations() {
    assert_file_contains "$COMMANDS_DIR/feedback.md" "## File Locations"
}

test_feedback_has_security_note() {
    assert_file_contains "$COMMANDS_DIR/feedback.md" "## Security Note"
}

test_feedback_mentions_security_blocklist() {
    local file="$COMMANDS_DIR/feedback.md"

    assert_file_contains "$file" "rm -rf"
    assert_file_contains "$file" "sudo"
    grep -q "no-verify" "$file" || fail "feedback.md should mention no-verify"
}

test_feedback_has_example_outputs() {
    grep -qF "Output:" "$COMMANDS_DIR/feedback.md" || fail "feedback.md should have Output examples"
}

# ============================================================================
# COMMAND FORMAT VALIDATION
# ============================================================================

describe "Commands: Format Validation"

test_all_commands_have_title() {
    for cmd in remember recall feedback; do
        local file="$COMMANDS_DIR/${cmd}.md"
        if [[ -f "$file" ]]; then
            # Should start with # title
            if ! head -1 "$file" | grep -q "^# /"; then
                fail "$cmd.md should start with # /command title"
            fi
        fi
    done
}

test_all_commands_are_readable() {
    for cmd in remember recall feedback; do
        local file="$COMMANDS_DIR/${cmd}.md"
        if [[ -f "$file" ]]; then
            # Should be readable
            if [[ ! -r "$file" ]]; then
                fail "$cmd.md should be readable"
            fi
        fi
    done
}

test_commands_have_reasonable_size() {
    for cmd in remember recall feedback; do
        local file="$COMMANDS_DIR/${cmd}.md"
        if [[ -f "$file" ]]; then
            local size
            size=$(wc -c < "$file" | tr -d ' ')

            # Should be at least 500 bytes (meaningful content)
            if [[ $size -lt 500 ]]; then
                fail "$cmd.md should have meaningful content (>500 bytes)"
            fi

            # Should not be excessively large (context budget)
            if [[ $size -gt 10000 ]]; then
                fail "$cmd.md is too large (>10KB)"
            fi
        fi
    done
}

# ============================================================================
# SCHEMA VALIDATION TESTS
# ============================================================================

describe "Schemas: Memory and Feedback"

test_feedback_schema_exists() {
    assert_file_exists "$PROJECT_ROOT/.claude/schemas/feedback.schema.json"
}

test_feedback_schema_is_valid_json() {
    jq '.' "$PROJECT_ROOT/.claude/schemas/feedback.schema.json" >/dev/null
}

test_memory_schema_exists() {
    assert_file_exists "$PROJECT_ROOT/.claude/schemas/memory.schema.json"
}

test_memory_schema_is_valid_json() {
    jq '.' "$PROJECT_ROOT/.claude/schemas/memory.schema.json" >/dev/null
}

test_feedback_schema_has_required_properties() {
    local schema="$PROJECT_ROOT/.claude/schemas/feedback.schema.json"

    assert_file_contains "$schema" "metrics"
    assert_file_contains "$schema" "learnedPatterns"
    assert_file_contains "$schema" "preferences"
}

test_memory_schema_has_required_properties() {
    local schema="$PROJECT_ROOT/.claude/schemas/memory.schema.json"

    assert_file_contains "$schema" "user_id"
    assert_file_contains "$schema" "category"
    assert_file_contains "$schema" "text"
}

# ============================================================================
# RUN TESTS
# ============================================================================

run_tests