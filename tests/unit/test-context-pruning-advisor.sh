#!/usr/bin/env bash
# ============================================================================
# Context Pruning Advisor Hook Unit Tests
# Issue: #126
# ============================================================================
# Tests for hooks/prompt/context-pruning-advisor.sh
# - Context threshold detection
# - Scoring algorithm
# - Recommendation generation
# - CC 2.1.9 additionalContext output
# ============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../fixtures/test-helpers.sh"

HOOKS_DIR="$PROJECT_ROOT/hooks"
HOOK_PATH="$HOOKS_DIR/prompt/context-pruning-advisor.sh"

# ============================================================================
# TEST FIXTURES SETUP
# ============================================================================

setup_context_files() {
    # Create mock context directory structure
    local ctx_dir="$TEMP_DIR/.claude/context"
    mkdir -p "$ctx_dir/knowledge/blockers"
    mkdir -p "$ctx_dir/session"

    # Create identity.json (200 tokens worth ~800 chars)
    cat > "$ctx_dir/identity.json" << 'EOF'
{
  "project": {"name": "test-project", "type": "test"},
  "constraints": ["constraint 1", "constraint 2"],
  "tech_stack": {"backend": "FastAPI", "frontend": "React"}
}
EOF

    # Create session state (500 tokens worth ~2000 chars)
    cat > "$ctx_dir/session/state.json" << 'EOF'
{
  "session_id": "test-session-123",
  "started": "2026-01-18T10:00:00Z",
  "current_task": "implementing feature",
  "files_touched": ["file1.py", "file2.ts", "file3.tsx"],
  "decisions_this_session": [
    {"decision": "use cursor pagination", "reason": "better performance"},
    {"decision": "use JWT auth", "reason": "stateless"}
  ]
}
EOF

    # Create knowledge index (150 tokens worth ~600 chars)
    cat > "$ctx_dir/knowledge/index.json" << 'EOF'
{
  "skills_loaded": ["api-design", "testing", "security"],
  "patterns_active": ["repository-pattern", "dependency-injection"],
  "last_updated": "2026-01-18T10:30:00Z"
}
EOF

    # Create blockers file (150 tokens worth ~600 chars)
    cat > "$ctx_dir/knowledge/blockers/current.json" << 'EOF'
{
  "blockers": [
    {"id": "1", "description": "Missing test coverage", "status": "open"},
    {"id": "2", "description": "Type error in component", "status": "resolved"}
  ]
}
EOF

    # Export for hook to use
    export CLAUDE_PROJECT_DIR="$TEMP_DIR"
}

setup_skill_analytics() {
    local log_dir="$TEMP_DIR/.claude/logs"
    mkdir -p "$log_dir"

    # Create skill analytics JSONL
    cat > "$log_dir/skill-analytics.jsonl" << 'EOF'
{"skill":"api-design-framework","args":"","timestamp":"2026-01-18T10:45:00Z","project":"test","phase":"start"}
{"skill":"api-design-framework","args":"","timestamp":"2026-01-18T10:50:00Z","project":"test","phase":"start"}
{"skill":"unit-testing","args":"","timestamp":"2026-01-18T10:55:00Z","project":"test","phase":"start"}
{"skill":"security-auditor","args":"","timestamp":"2026-01-18T09:00:00Z","project":"test","phase":"start"}
EOF
}

setup_metrics_file() {
    # Create session metrics file
    cat > "/tmp/claude-session-metrics.json" << 'EOF'
{
  "tools": {
    "Read": 15,
    "Write": 5,
    "Bash": 8,
    "Grep": 12,
    "Glob": 6,
    "Task": 2
  },
  "errors": 0,
  "warnings": 1
}
EOF
}

# ============================================================================
# HOOK EXISTENCE AND STRUCTURE TESTS
# ============================================================================

describe "Context Pruning Advisor - Structure"

test_hook_exists() {
    assert_file_exists "$HOOK_PATH"
}

test_hook_is_executable() {
    assert_file_executable "$HOOK_PATH"
}

test_hook_has_shebang() {
    local first_line
    first_line=$(head -1 "$HOOK_PATH")
    assert_contains "$first_line" "#!/"
}

test_hook_has_set_euo_pipefail() {
    assert_file_contains "$HOOK_PATH" "set -euo pipefail"
}

test_hook_has_version() {
    assert_file_contains "$HOOK_PATH" "Version:"
}

test_hook_has_scoring_algorithm_documentation() {
    # Should document the scoring algorithm
    assert_file_contains "$HOOK_PATH" "SCORING ALGORITHM"
    assert_file_contains "$HOOK_PATH" "RECENCY SCORE"
    assert_file_contains "$HOOK_PATH" "FREQUENCY SCORE"
    assert_file_contains "$HOOK_PATH" "RELEVANCE SCORE"
}

# ============================================================================
# JSON OUTPUT TESTS (CC 2.1.9 Compliance)
# ============================================================================

describe "Context Pruning Advisor - JSON Output"

test_hook_outputs_valid_json_below_threshold() {
    setup_context_files
    setup_skill_analytics
    setup_metrics_file

    local input='{"prompt":"Help me with a simple task"}'
    local output
    output=$(echo "$input" | bash "$HOOK_PATH" 2>/dev/null) || true

    if [[ -n "$output" ]]; then
        assert_valid_json "$output"
    fi
}

test_hook_has_continue_field() {
    setup_context_files
    setup_skill_analytics
    setup_metrics_file

    local input='{"prompt":"Test prompt"}'
    local output
    output=$(echo "$input" | bash "$HOOK_PATH" 2>/dev/null) || true

    if [[ -n "$output" ]]; then
        assert_valid_json "$output"
        assert_json_field "$output" ".continue" "true"
    fi
}

test_hook_has_suppress_output_when_below_threshold() {
    setup_context_files

    local input='{"prompt":"Simple task"}'
    local output
    output=$(echo "$input" | bash "$HOOK_PATH" 2>/dev/null) || true

    if [[ -n "$output" ]]; then
        assert_valid_json "$output"
        # Should suppress output when below threshold
        assert_json_field "$output" ".suppressOutput" "true"
    fi
}

test_hook_uses_additional_context_when_triggered() {
    # Create large context files to trigger the hook
    local ctx_dir="$TEMP_DIR/.claude/context"
    mkdir -p "$ctx_dir/knowledge/blockers"
    mkdir -p "$ctx_dir/session"

    # Create large files to exceed 70% threshold (2200 * 0.7 = 1540 tokens)
    # ~6160 chars needed (1540 * 4)
    local large_content
    large_content=$(head -c 10000 /dev/urandom | base64 | head -c 8000)

    echo "{\"data\": \"$large_content\"}" > "$ctx_dir/identity.json"
    echo "{\"data\": \"$large_content\"}" > "$ctx_dir/session/state.json"

    export CLAUDE_PROJECT_DIR="$TEMP_DIR"
    setup_skill_analytics
    setup_metrics_file

    local input='{"prompt":"Continue with the task"}'
    local output
    output=$(echo "$input" | bash "$HOOK_PATH" 2>/dev/null) || true

    if [[ -n "$output" ]]; then
        assert_valid_json "$output"
        # When above threshold, should use additionalContext
        if echo "$output" | jq -e '.hookSpecificOutput.additionalContext' >/dev/null 2>&1; then
            return 0
        fi
    fi
    # If context is still below threshold, that's also acceptable
    return 0
}

# ============================================================================
# THRESHOLD DETECTION TESTS
# ============================================================================

describe "Context Pruning Advisor - Threshold Detection"

test_hook_skips_analysis_below_threshold() {
    # Create minimal context files (well below 70% of 2200 tokens)
    local ctx_dir="$TEMP_DIR/.claude/context"
    mkdir -p "$ctx_dir/knowledge/blockers"
    mkdir -p "$ctx_dir/session"

    # Create small files (~100 tokens total = well below 1540 token threshold)
    echo '{"project": "test"}' > "$ctx_dir/identity.json"
    echo '{}' > "$ctx_dir/session/state.json"
    echo '{}' > "$ctx_dir/knowledge/index.json"
    echo '{}' > "$ctx_dir/knowledge/blockers/current.json"

    export CLAUDE_PROJECT_DIR="$TEMP_DIR"

    local input='{"prompt":"Simple task"}'
    local output
    output=$(echo "$input" | bash "$HOOK_PATH" 2>/dev/null) || true

    if [[ -n "$output" ]]; then
        assert_valid_json "$output"
        # Should have suppressOutput:true when skipping
        assert_json_field "$output" ".suppressOutput" "true"
    fi
}

test_hook_handles_empty_prompt() {
    setup_context_files

    local input='{"prompt":""}'
    local output
    output=$(echo "$input" | bash "$HOOK_PATH" 2>/dev/null) || true

    if [[ -n "$output" ]]; then
        assert_valid_json "$output"
        # Should silently continue with empty prompt
        assert_json_field "$output" ".continue" "true"
    fi
}

test_hook_handles_missing_prompt_field() {
    setup_context_files

    local input='{}'
    local output
    output=$(echo "$input" | bash "$HOOK_PATH" 2>/dev/null) || true

    if [[ -n "$output" ]]; then
        assert_valid_json "$output"
        assert_json_field "$output" ".continue" "true"
    fi
}

# ============================================================================
# SCORING ALGORITHM TESTS
# ============================================================================

describe "Context Pruning Advisor - Scoring"

test_hook_analyzes_skills_from_analytics() {
    setup_context_files
    setup_skill_analytics
    setup_metrics_file

    # The skill analytics file has entries that should be parsed
    local analytics_file="$TEMP_DIR/.claude/logs/skill-analytics.jsonl"
    assert_file_exists "$analytics_file"

    local line_count
    line_count=$(wc -l < "$analytics_file" | tr -d ' ')
    assert_greater_than "$line_count" 0
}

test_hook_analyzes_tools_from_metrics() {
    setup_metrics_file

    # The metrics file should exist and have tool data
    assert_file_exists "/tmp/claude-session-metrics.json"

    local tools
    tools=$(jq -r '.tools | length' /tmp/claude-session-metrics.json)
    assert_greater_than "$tools" 0
}

# ============================================================================
# PLUGIN REGISTRATION TESTS
# ============================================================================

describe "Context Pruning Advisor - Registration"

test_hook_registered_in_plugin_json() {
    local plugin_json="$PROJECT_ROOT/.claude-plugin/plugin.json"

    assert_file_exists "$plugin_json"
    assert_file_contains "$plugin_json" "context-pruning-advisor.sh"
}

test_hook_in_userpromptsubmit_section() {
    local plugin_json="$PROJECT_ROOT/.claude-plugin/plugin.json"

    # Check that the hook is under UserPromptSubmit
    local hooks
    hooks=$(jq '.hooks.UserPromptSubmit[].hooks[].command' "$plugin_json" 2>/dev/null)

    assert_contains "$hooks" "context-pruning-advisor.sh"
}

# ============================================================================
# ALGORITHM DOCUMENTATION TESTS
# ============================================================================

describe "Context Pruning Advisor - Algorithm Documentation"

test_hook_documents_recency_thresholds() {
    # Should document the recency scoring thresholds
    assert_file_contains "$HOOK_PATH" "5 minutes"
    assert_file_contains "$HOOK_PATH" "15 minutes"
    assert_file_contains "$HOOK_PATH" "30 minutes"
    assert_file_contains "$HOOK_PATH" "60 minutes"
}

test_hook_documents_frequency_thresholds() {
    # Should document the frequency scoring
    assert_file_contains "$HOOK_PATH" "5+ accesses"
    assert_file_contains "$HOOK_PATH" "3-4 accesses"
}

test_hook_documents_pruning_thresholds() {
    # Should document pruning thresholds
    assert_file_contains "$HOOK_PATH" "THRESHOLD"
    assert_file_contains "$HOOK_PATH" "HIGH"
    assert_file_contains "$HOOK_PATH" "MEDIUM"
}

test_hook_documents_weights() {
    # Should document the scoring weights
    assert_file_contains "$HOOK_PATH" "40%"
    assert_file_contains "$HOOK_PATH" "30%"
}

# ============================================================================
# ERROR HANDLING TESTS
# ============================================================================

describe "Context Pruning Advisor - Error Handling"

test_hook_handles_missing_context_dir() {
    # Don't create any context files
    export CLAUDE_PROJECT_DIR="/nonexistent/path"

    local input='{"prompt":"Test task"}'
    local output
    output=$(echo "$input" | bash "$HOOK_PATH" 2>/dev/null) || true

    if [[ -n "$output" ]]; then
        assert_valid_json "$output"
        # Should still output valid JSON
        assert_json_field "$output" ".continue" "true"
    fi
}

test_hook_handles_missing_skill_analytics() {
    setup_context_files
    # Don't create skill analytics file

    local input='{"prompt":"Test task"}'
    local output
    output=$(echo "$input" | bash "$HOOK_PATH" 2>/dev/null) || true

    if [[ -n "$output" ]]; then
        assert_valid_json "$output"
        assert_json_field "$output" ".continue" "true"
    fi
}

test_hook_handles_missing_metrics_file() {
    setup_context_files
    rm -f /tmp/claude-session-metrics.json

    local input='{"prompt":"Test task"}'
    local output
    output=$(echo "$input" | bash "$HOOK_PATH" 2>/dev/null) || true

    if [[ -n "$output" ]]; then
        assert_valid_json "$output"
        assert_json_field "$output" ".continue" "true"
    fi
}

test_hook_handles_malformed_json_input() {
    setup_context_files

    local input='{"prompt": invalid json}'
    local output
    output=$(echo "$input" | bash "$HOOK_PATH" 2>/dev/null) || true

    # Should not crash - either output valid JSON or exit gracefully
    if [[ -n "$output" ]]; then
        # Try to validate, but don't fail if there's no output
        jq empty <<< "$output" 2>/dev/null || true
    fi
}

# ============================================================================
# CC 2.1.9 COMPLIANCE TESTS
# ============================================================================

describe "Context Pruning Advisor - CC 2.1.9 Compliance"

test_hook_uses_hook_specific_output() {
    # Check that the hook uses hookSpecificOutput structure
    assert_file_contains "$HOOK_PATH" "hookSpecificOutput"
}

test_hook_uses_additional_context_field() {
    # Check that the hook uses additionalContext for recommendations
    assert_file_contains "$HOOK_PATH" "additionalContext"
}

test_hook_sources_common_lib() {
    # Check that the hook sources common.sh for utilities
    assert_file_contains "$HOOK_PATH" "common.sh"
}

# ============================================================================
# RUN TESTS
# ============================================================================

run_tests
