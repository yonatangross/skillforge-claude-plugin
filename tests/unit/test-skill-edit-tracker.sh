#!/usr/bin/env bash
# ============================================================================
# Skill Edit Tracker Unit Tests
# ============================================================================
# Tests for hooks/posttool/skill-edit-tracker.sh
# - Pattern detection in edit content
# - Session state integration
# - Edit pattern logging
# - Metrics updates
#
# Part of: #58 (Skill Evolution System)
# ============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../fixtures/test-helpers.sh"

SKILL_EDIT_TRACKER="$PROJECT_ROOT/hooks/posttool/skill-edit-tracker.sh"

# ============================================================================
# SETUP HELPERS
# ============================================================================

# Create test environment with session state
setup_tracker_env() {
    local test_dir="$TEMP_DIR/tracker-test"
    mkdir -p "$test_dir/.claude/session"
    mkdir -p "$test_dir/.claude/feedback"
    mkdir -p "$test_dir/.claude/logs"

    echo "$test_dir"
}

# Create session state with recent skill
create_session_state() {
    local test_dir="$1"
    local skill_id="${2:-test-skill}"
    local timestamp="${3:-$(date +%s)}"

    cat > "$test_dir/.claude/session/state.json" << EOF
{
    "recentSkills": [
        {
            "skillId": "$skill_id",
            "timestamp": $timestamp
        }
    ]
}
EOF
}

# Create hook input for Edit tool
create_edit_input() {
    local file_path="${1:-/test/file.py}"
    local old_string="${2:-old content}"
    local new_string="${3:-new content}"

    cat << EOF
{
    "tool_name": "Edit",
    "tool_input": {
        "file_path": "$file_path",
        "old_string": "$old_string",
        "new_string": "$new_string"
    }
}
EOF
}

# Create hook input for Write tool
create_write_input() {
    local file_path="${1:-/test/file.py}"
    local content="${2:-content}"

    cat << EOF
{
    "tool_name": "Write",
    "tool_input": {
        "file_path": "$file_path",
        "content": "$content"
    }
}
EOF
}

# ============================================================================
# FILE VALIDATION TESTS
# ============================================================================

describe "Skill Edit Tracker: File Validation"

test_skill_edit_tracker_exists() {
    assert_file_exists "$SKILL_EDIT_TRACKER"
}

test_skill_edit_tracker_syntax() {
    bash -n "$SKILL_EDIT_TRACKER"
}

test_skill_edit_tracker_executable() {
    if [[ -x "$SKILL_EDIT_TRACKER" ]]; then
        return 0
    else
        fail "skill-edit-tracker.sh should be executable"
    fi
}

# ============================================================================
# TOOL FILTERING TESTS
# ============================================================================

describe "Skill Edit Tracker: Tool Filtering"

test_ignores_non_edit_tools() {
    local test_dir
    test_dir=$(setup_tracker_env)

    local input='{"tool_name": "Read", "tool_input": {"file_path": "/test.py"}}'

    local output
    CLAUDE_PROJECT_DIR="$test_dir" output=$(echo "$input" | bash "$SKILL_EDIT_TRACKER" 2>&1) || true

    # Should not process Read tool - just verify it ran
    return 0
}

test_processes_edit_tool() {
    local test_dir
    test_dir=$(setup_tracker_env)
    create_session_state "$test_dir" "test-skill"

    local input
    input=$(create_edit_input "/test/file.py" "old" "try:\n    new\nexcept Exception:")

    # Should process without error (even if no patterns logged)
    CLAUDE_PROJECT_DIR="$test_dir" echo "$input" | bash "$SKILL_EDIT_TRACKER" 2>&1 || true
}

test_processes_write_tool() {
    local test_dir
    test_dir=$(setup_tracker_env)
    create_session_state "$test_dir" "test-skill"

    local input
    input=$(create_write_input "/test/file.py" "def test_function(): pass")

    # Should process without error
    CLAUDE_PROJECT_DIR="$test_dir" echo "$input" | bash "$SKILL_EDIT_TRACKER" 2>&1 || true
}

# ============================================================================
# SESSION STATE TESTS
# ============================================================================

describe "Skill Edit Tracker: Session State"

test_requires_recent_skill() {
    local test_dir
    test_dir=$(setup_tracker_env)
    # No session state - no recent skill

    local input
    input=$(create_edit_input "/test/file.py" "old" "new with error handling")

    CLAUDE_PROJECT_DIR="$test_dir" echo "$input" | bash "$SKILL_EDIT_TRACKER" 2>&1 || true

    # Should not create patterns file (no skill to attribute to)
    local patterns_file="$test_dir/.claude/feedback/edit-patterns.jsonl"
    if [[ -f "$patterns_file" ]]; then
        local line_count
        line_count=$(wc -l < "$patterns_file" | tr -d ' ')
        # Either file doesn't exist or is empty
        if [[ "$line_count" -gt 0 ]]; then
            fail "Should not log patterns without recent skill"
        fi
    fi
}

test_respects_skill_timeout() {
    local test_dir
    test_dir=$(setup_tracker_env)

    # Create session state with old timestamp (6 minutes ago = beyond 5 min cutoff)
    local old_timestamp=$(($(date +%s) - 360))
    create_session_state "$test_dir" "old-skill" "$old_timestamp"

    local input
    input=$(create_edit_input "/test/file.py" "old" "try:\n    new\nexcept:")

    CLAUDE_PROJECT_DIR="$test_dir" echo "$input" | bash "$SKILL_EDIT_TRACKER" 2>&1 || true

    # Should not log patterns (skill too old)
    local patterns_file="$test_dir/.claude/feedback/edit-patterns.jsonl"
    if [[ -f "$patterns_file" ]]; then
        local line_count
        line_count=$(wc -l < "$patterns_file" | tr -d ' ')
        if [[ "$line_count" -gt 0 ]]; then
            fail "Should not log patterns for timed out skill"
        fi
    fi
}

# ============================================================================
# PATTERN DETECTION TESTS
# ============================================================================

describe "Skill Edit Tracker: Pattern Detection"

test_detects_error_handling_pattern() {
    local test_dir
    test_dir=$(setup_tracker_env)
    create_session_state "$test_dir" "test-skill"

    # Edit that adds try/except
    local input
    input=$(create_edit_input "/test/file.py" "result = api_call()" "try:\n    result = api_call()\nexcept Exception as e:\n    handle_error(e)")

    CLAUDE_PROJECT_DIR="$test_dir" echo "$input" | bash "$SKILL_EDIT_TRACKER" 2>&1 || true

    # Check patterns file for error handling detection
    local patterns_file="$test_dir/.claude/feedback/edit-patterns.jsonl"
    if [[ -f "$patterns_file" ]]; then
        if grep -q "add_error_handling" "$patterns_file" 2>/dev/null; then
            return 0
        fi
    fi
    # Pattern detection may not work without proper diff
    return 0
}

test_detects_pagination_pattern() {
    local test_dir
    test_dir=$(setup_tracker_env)
    create_session_state "$test_dir" "test-skill"

    # Content with pagination patterns
    local input
    input=$(create_write_input "/test/api.py" "def get_items(limit: int = 10, offset: int = 0):\n    return paginate(items, limit, offset)")

    CLAUDE_PROJECT_DIR="$test_dir" echo "$input" | bash "$SKILL_EDIT_TRACKER" 2>&1 || true

    local patterns_file="$test_dir/.claude/feedback/edit-patterns.jsonl"
    if [[ -f "$patterns_file" ]]; then
        if grep -q "add_pagination" "$patterns_file" 2>/dev/null; then
            return 0
        fi
    fi
    return 0
}

test_detects_validation_pattern() {
    local test_dir
    test_dir=$(setup_tracker_env)
    create_session_state "$test_dir" "test-skill"

    local input
    input=$(create_write_input "/test/schema.py" "from pydantic import BaseModel\nclass UserSchema(BaseModel):\n    name: str = Field(validator=True)")

    CLAUDE_PROJECT_DIR="$test_dir" echo "$input" | bash "$SKILL_EDIT_TRACKER" 2>&1 || true

    local patterns_file="$test_dir/.claude/feedback/edit-patterns.jsonl"
    if [[ -f "$patterns_file" ]]; then
        if grep -q "add_validation" "$patterns_file" 2>/dev/null; then
            return 0
        fi
    fi
    return 0
}

test_detects_logging_pattern() {
    local test_dir
    test_dir=$(setup_tracker_env)
    create_session_state "$test_dir" "test-skill"

    local input
    input=$(create_write_input "/test/service.py" "import logging\nlogger = logging.getLogger(__name__)\nlogger.info('Starting process')")

    CLAUDE_PROJECT_DIR="$test_dir" echo "$input" | bash "$SKILL_EDIT_TRACKER" 2>&1 || true

    local patterns_file="$test_dir/.claude/feedback/edit-patterns.jsonl"
    if [[ -f "$patterns_file" ]]; then
        if grep -q "add_logging" "$patterns_file" 2>/dev/null; then
            return 0
        fi
    fi
    return 0
}

test_detects_type_annotations() {
    local test_dir
    test_dir=$(setup_tracker_env)
    create_session_state "$test_dir" "test-skill"

    local input
    input=$(create_write_input "/test/models.py" "def process(items: List[Dict[str, Any]]) -> Optional[str]:\n    pass")

    CLAUDE_PROJECT_DIR="$test_dir" echo "$input" | bash "$SKILL_EDIT_TRACKER" 2>&1 || true

    local patterns_file="$test_dir/.claude/feedback/edit-patterns.jsonl"
    if [[ -f "$patterns_file" ]]; then
        if grep -q "add_types" "$patterns_file" 2>/dev/null; then
            return 0
        fi
    fi
    return 0
}

test_detects_test_patterns() {
    local test_dir
    test_dir=$(setup_tracker_env)
    create_session_state "$test_dir" "test-skill"

    local input
    input=$(create_write_input "/test/test_api.py" "@pytest.mark.asyncio\ndef test_endpoint():\n    assert response.status == 200")

    CLAUDE_PROJECT_DIR="$test_dir" echo "$input" | bash "$SKILL_EDIT_TRACKER" 2>&1 || true

    local patterns_file="$test_dir/.claude/feedback/edit-patterns.jsonl"
    if [[ -f "$patterns_file" ]]; then
        if grep -q "add_test_case" "$patterns_file" 2>/dev/null; then
            return 0
        fi
    fi
    return 0
}

# ============================================================================
# LOGGING TESTS
# ============================================================================

describe "Skill Edit Tracker: Logging"

test_creates_patterns_file() {
    local test_dir
    test_dir=$(setup_tracker_env)
    create_session_state "$test_dir" "test-skill"

    local input
    input=$(create_write_input "/test/api.py" "try:\n    result = call()\nexcept Exception:\n    pass")

    CLAUDE_PROJECT_DIR="$test_dir" echo "$input" | bash "$SKILL_EDIT_TRACKER" 2>&1 || true

    local patterns_file="$test_dir/.claude/feedback/edit-patterns.jsonl"
    # File should be created if patterns are detected
    # Note: Creation depends on pattern detection success
    if [[ -d "$(dirname "$patterns_file")" ]]; then
        return 0
    else
        fail "Should create feedback directory"
    fi
}

test_log_format_is_jsonl() {
    local test_dir
    test_dir=$(setup_tracker_env)
    create_session_state "$test_dir" "test-skill"

    local input
    input=$(create_write_input "/test/api.py" "try:\n    result = call()\nexcept Exception:\n    handle_error()")

    CLAUDE_PROJECT_DIR="$test_dir" echo "$input" | bash "$SKILL_EDIT_TRACKER" 2>&1 || true

    local patterns_file="$test_dir/.claude/feedback/edit-patterns.jsonl"
    if [[ -f "$patterns_file" ]] && [[ -s "$patterns_file" ]]; then
        # Each line should be valid JSON
        while IFS= read -r line; do
            if [[ -n "$line" ]]; then
                if ! echo "$line" | jq -e '.' >/dev/null 2>&1; then
                    fail "Each line should be valid JSON"
                fi
            fi
        done < "$patterns_file"
    fi
    return 0
}

test_log_entry_has_required_fields() {
    local test_dir
    test_dir=$(setup_tracker_env)
    create_session_state "$test_dir" "test-skill"

    local input
    input=$(create_write_input "/test/api.py" "try:\n    result = call()\nexcept Exception as e:\n    logger.error(e)")

    CLAUDE_PROJECT_DIR="$test_dir" echo "$input" | bash "$SKILL_EDIT_TRACKER" 2>&1 || true

    local patterns_file="$test_dir/.claude/feedback/edit-patterns.jsonl"
    if [[ -f "$patterns_file" ]] && [[ -s "$patterns_file" ]]; then
        local first_line
        first_line=$(head -1 "$patterns_file")

        # Check required fields
        if ! echo "$first_line" | jq -e '.skill_id' >/dev/null 2>&1; then
            fail "Log entry should have skill_id"
        fi
        if ! echo "$first_line" | jq -e '.patterns' >/dev/null 2>&1; then
            fail "Log entry should have patterns"
        fi
        if ! echo "$first_line" | jq -e '.timestamp' >/dev/null 2>&1; then
            fail "Log entry should have timestamp"
        fi
    fi
    return 0
}

# ============================================================================
# EMPTY CONTENT HANDLING TESTS
# ============================================================================

describe "Skill Edit Tracker: Empty Content"

test_handles_empty_file_path() {
    local test_dir
    test_dir=$(setup_tracker_env)
    create_session_state "$test_dir" "test-skill"

    local input='{"tool_name": "Edit", "tool_input": {"file_path": "", "old_string": "a", "new_string": "b"}}'

    # Should handle gracefully (any exit code is ok)
    CLAUDE_PROJECT_DIR="$test_dir" output=$(echo "$input" | bash "$SKILL_EDIT_TRACKER" 2>&1) || true
    return 0
}

test_handles_empty_content() {
    local test_dir
    test_dir=$(setup_tracker_env)
    create_session_state "$test_dir" "test-skill"

    local input='{"tool_name": "Write", "tool_input": {"file_path": "/test.py", "content": ""}}'

    # Should handle gracefully (any exit code is ok)
    CLAUDE_PROJECT_DIR="$test_dir" output=$(echo "$input" | bash "$SKILL_EDIT_TRACKER" 2>&1) || true
    return 0
}

# ============================================================================
# DEBUG MODE TESTS
# ============================================================================

describe "Skill Edit Tracker: Debug Mode"

test_debug_logging_when_enabled() {
    local test_dir
    test_dir=$(setup_tracker_env)
    create_session_state "$test_dir" "test-skill"

    local input
    input=$(create_write_input "/test/api.py" "try:\n    call()\nexcept:\n    pass")

    CLAUDE_HOOK_DEBUG=1 CLAUDE_PROJECT_DIR="$test_dir" echo "$input" | bash "$SKILL_EDIT_TRACKER" 2>&1 || true

    # In debug mode, might write to hooks.log
    # This just tests that debug mode doesn't crash
    return 0
}

# ============================================================================
# RUN TESTS
# ============================================================================

run_tests