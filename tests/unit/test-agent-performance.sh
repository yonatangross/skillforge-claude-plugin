#!/usr/bin/env bash
# ============================================================================
# Agent Performance Tracking Unit Tests (#55)
# ============================================================================
# Tests for agent performance tracking and improvement suggestions
# - Edit pattern logging
# - Trend calculation
# - Performance report generation
# - Suggestion generation
# ============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../fixtures/test-helpers.sh"

FEEDBACK_LIB="$PROJECT_ROOT/.claude/scripts/feedback-lib.sh"

# ============================================================================
# SETUP
# ============================================================================

setup_agent_test_env() {
    # Create unique test directory for each test
    local unique_id
    unique_id=$(date +%s%N)
    TEST_FEEDBACK_DIR="$TEMP_DIR/.claude/feedback-$unique_id"
    mkdir -p "$TEST_FEEDBACK_DIR"

    export CLAUDE_PROJECT_DIR="$TEMP_DIR"

    # Source the library
    source "$FEEDBACK_LIB"

    # Override feedback directory paths
    FEEDBACK_DIR="$TEST_FEEDBACK_DIR"
    METRICS_FILE="$TEST_FEEDBACK_DIR/metrics.json"
    PATTERNS_FILE="$TEST_FEEDBACK_DIR/learned-patterns.json"
    PREFERENCES_FILE="$TEST_FEEDBACK_DIR/preferences.json"
    SATISFACTION_FILE="$TEST_FEEDBACK_DIR/satisfaction.json"

    # Initialize with enabled feedback
    cat > "$PREFERENCES_FILE" << 'EOF'
{
  "version": "1.0",
  "enabled": true,
  "learnFromEdits": true,
  "learnFromApprovals": true,
  "learnFromAgentOutcomes": true,
  "shareAnonymized": false,
  "syncGlobalPatterns": true,
  "retentionDays": 90,
  "pausedUntil": null
}
EOF
}

create_test_agent_metrics() {
    local agent_id="${1:-test-agent}"
    local spawns="${2:-5}"
    local successes="${3:-4}"

    cat > "$METRICS_FILE" << EOF
{
  "version": "1.0",
  "updated": "2026-01-14T10:00:00Z",
  "skills": {},
  "hooks": {},
  "agents": {
    "$agent_id": {
      "spawns": $spawns,
      "successes": $successes,
      "totalDuration": 100,
      "avgDuration": 20,
      "editPatterns": {},
      "recentResults": []
    }
  }
}
EOF
}

# ============================================================================
# EDIT PATTERN TESTS
# ============================================================================

describe "Agent Performance: Edit Pattern Logging"

test_log_edit_pattern_creates_entry() {
    setup_agent_test_env
    init_feedback

    log_agent_edit_pattern "pattern-agent" "add_types"

    local patterns
    patterns=$(jq -r '.agents["pattern-agent"].editPatterns.add_types // 0' "$METRICS_FILE" 2>/dev/null)

    assert_equals "1" "$patterns"
}

test_log_edit_pattern_increments() {
    setup_agent_test_env
    init_feedback

    log_agent_edit_pattern "increment-agent" "add_types"
    log_agent_edit_pattern "increment-agent" "add_types"
    log_agent_edit_pattern "increment-agent" "add_types"

    local patterns
    patterns=$(jq -r '.agents["increment-agent"].editPatterns.add_types // 0' "$METRICS_FILE" 2>/dev/null)

    assert_equals "3" "$patterns"
}

test_log_multiple_edit_patterns() {
    setup_agent_test_env
    init_feedback

    log_agent_edit_pattern "multi-agent" "add_types"
    log_agent_edit_pattern "multi-agent" "add_error_handling"
    log_agent_edit_pattern "multi-agent" "add_types"

    local add_types
    local add_error
    add_types=$(jq -r '.agents["multi-agent"].editPatterns.add_types // 0' "$METRICS_FILE" 2>/dev/null)
    add_error=$(jq -r '.agents["multi-agent"].editPatterns.add_error_handling // 0' "$METRICS_FILE" 2>/dev/null)

    assert_equals "2" "$add_types"
    assert_equals "1" "$add_error"
}

test_log_edit_pattern_preserves_existing_agent_data() {
    setup_agent_test_env
    create_test_agent_metrics "preserve-agent" 5 4

    log_agent_edit_pattern "preserve-agent" "add_types"

    local spawns
    spawns=$(jq -r '.agents["preserve-agent"].spawns // 0' "$METRICS_FILE" 2>/dev/null)

    assert_equals "5" "$spawns"
}

# ============================================================================
# TREND CALCULATION TESTS
# ============================================================================

describe "Agent Performance: Trend Calculation"

test_trend_stable_with_few_spawns() {
    setup_agent_test_env
    create_test_agent_metrics "trend-agent" 3 2

    local trend
    trend=$(calculate_agent_trend "trend-agent")

    assert_equals "stable" "$trend"
}

test_trend_stable_when_no_recent_results() {
    setup_agent_test_env
    create_test_agent_metrics "no-recent-agent" 10 8

    local trend
    trend=$(calculate_agent_trend "no-recent-agent")

    assert_equals "stable" "$trend"
}

test_trend_stable_for_unknown_agent() {
    setup_agent_test_env
    init_feedback

    local trend
    trend=$(calculate_agent_trend "unknown-agent")

    assert_equals "stable" "$trend"
}

test_trend_stable_when_no_metrics_file() {
    setup_agent_test_env
    rm -f "$METRICS_FILE"

    local trend
    trend=$(calculate_agent_trend "any-agent")

    assert_equals "stable" "$trend"
}

# ============================================================================
# PERFORMANCE REPORT TESTS
# ============================================================================

describe "Agent Performance: Performance Report"

test_report_is_valid_json() {
    setup_agent_test_env
    create_test_agent_metrics "report-agent" 5 4

    local report
    report=$(get_agent_performance_report)

    assert_valid_json "$report"
}

test_report_includes_generated_timestamp() {
    setup_agent_test_env
    create_test_agent_metrics "timestamp-agent" 5 4

    local report
    report=$(get_agent_performance_report)

    local generated
    generated=$(echo "$report" | jq -r '.generated')

    [[ "$generated" != "null" ]] || fail "Report should include generated timestamp"
}

test_report_includes_agent_stats() {
    setup_agent_test_env
    create_test_agent_metrics "stats-agent" 10 8

    local report
    report=$(get_agent_performance_report)

    local spawns
    spawns=$(echo "$report" | jq -r '.agents["stats-agent"].spawns')

    assert_equals "10" "$spawns"
}

test_report_calculates_success_rate() {
    setup_agent_test_env
    create_test_agent_metrics "rate-agent" 10 8

    local report
    report=$(get_agent_performance_report)

    local rate
    rate=$(echo "$report" | jq -r '.agents["rate-agent"].successRate')

    assert_equals "0.8" "$rate"
}

test_report_includes_summary() {
    setup_agent_test_env
    create_test_agent_metrics "summary-agent" 5 4

    local report
    report=$(get_agent_performance_report)

    local total_agents
    total_agents=$(echo "$report" | jq -r '.summary.totalAgents')

    assert_equals "1" "$total_agents"
}

test_report_empty_when_no_metrics() {
    setup_agent_test_env
    rm -f "$METRICS_FILE"

    local report
    report=$(get_agent_performance_report)

    assert_valid_json "$report"

    local agents
    agents=$(echo "$report" | jq -r '.agents | length')

    assert_equals "0" "$agents"
}

# ============================================================================
# SUGGESTION GENERATION TESTS
# ============================================================================

describe "Agent Performance: Suggestion Generation"

test_suggestions_empty_for_few_spawns() {
    setup_agent_test_env

    # Create agent with only 2 spawns
    cat > "$METRICS_FILE" << 'EOF'
{
  "version": "1.0",
  "agents": {
    "few-spawns-agent": {
      "spawns": 2,
      "successes": 2,
      "editPatterns": { "add_types": 2 }
    }
  }
}
EOF

    local suggestions
    suggestions=$(generate_agent_suggestions "few-spawns-agent")

    assert_valid_json "$suggestions"

    local count
    count=$(echo "$suggestions" | jq 'length')

    assert_equals "0" "$count"
}

test_suggestions_for_frequent_pattern() {
    setup_agent_test_env

    # Create agent with 5 spawns, 4 with add_types (80%)
    cat > "$METRICS_FILE" << 'EOF'
{
  "version": "1.0",
  "agents": {
    "frequent-agent": {
      "spawns": 5,
      "successes": 4,
      "editPatterns": { "add_types": 4 }
    }
  }
}
EOF

    local suggestions
    suggestions=$(generate_agent_suggestions "frequent-agent")

    assert_valid_json "$suggestions"

    local count
    count=$(echo "$suggestions" | jq 'length')

    assert_greater_than "$count" 0
}

test_suggestions_include_pattern_name() {
    setup_agent_test_env

    cat > "$METRICS_FILE" << 'EOF'
{
  "version": "1.0",
  "agents": {
    "name-agent": {
      "spawns": 5,
      "successes": 4,
      "editPatterns": { "add_types": 4 }
    }
  }
}
EOF

    local suggestions
    suggestions=$(generate_agent_suggestions "name-agent")

    local pattern
    pattern=$(echo "$suggestions" | jq -r '.[0].pattern // ""')

    assert_equals "add_types" "$pattern"
}

test_suggestions_include_frequency() {
    setup_agent_test_env

    cat > "$METRICS_FILE" << 'EOF'
{
  "version": "1.0",
  "agents": {
    "freq-agent": {
      "spawns": 5,
      "successes": 4,
      "editPatterns": { "add_types": 4 }
    }
  }
}
EOF

    local suggestions
    suggestions=$(generate_agent_suggestions "freq-agent")

    local freq
    freq=$(echo "$suggestions" | jq -r '.[0].frequency // 0')

    # 4/5 = 0.8
    assert_equals "0.8" "$freq"
}

test_suggestions_empty_for_unknown_agent() {
    setup_agent_test_env
    init_feedback

    local suggestions
    suggestions=$(generate_agent_suggestions "nonexistent-agent")

    assert_valid_json "$suggestions"

    local count
    count=$(echo "$suggestions" | jq 'length')

    assert_equals "0" "$count"
}

test_suggestions_skip_low_frequency_patterns() {
    setup_agent_test_env

    # Create agent with 10 spawns, only 2 with add_types (20%)
    cat > "$METRICS_FILE" << 'EOF'
{
  "version": "1.0",
  "agents": {
    "low-freq-agent": {
      "spawns": 10,
      "successes": 8,
      "editPatterns": { "add_types": 2 }
    }
  }
}
EOF

    local suggestions
    suggestions=$(generate_agent_suggestions "low-freq-agent")

    local count
    count=$(echo "$suggestions" | jq 'length')

    assert_equals "0" "$count"
}

# ============================================================================
# INTEGRATION TESTS
# ============================================================================

describe "Agent Performance: Integration"

test_log_performance_and_pattern_together() {
    setup_agent_test_env
    init_feedback

    # Log performance
    log_agent_performance "integration-agent" "true" "25"

    # Log edit patterns
    log_agent_edit_pattern "integration-agent" "add_types"
    log_agent_edit_pattern "integration-agent" "add_error_handling"

    # Verify both are tracked
    local spawns
    local add_types
    spawns=$(jq -r '.agents["integration-agent"].spawns // 0' "$METRICS_FILE" 2>/dev/null)
    add_types=$(jq -r '.agents["integration-agent"].editPatterns.add_types // 0' "$METRICS_FILE" 2>/dev/null)

    assert_equals "1" "$spawns"
    assert_equals "1" "$add_types"
}

test_report_includes_edit_patterns() {
    setup_agent_test_env

    cat > "$METRICS_FILE" << 'EOF'
{
  "version": "1.0",
  "agents": {
    "edit-pattern-agent": {
      "spawns": 5,
      "successes": 4,
      "editPatterns": { "add_types": 3, "add_error_handling": 2 }
    }
  }
}
EOF

    local report
    report=$(get_agent_performance_report)

    local add_types
    add_types=$(echo "$report" | jq -r '.agents["edit-pattern-agent"].editPatterns.add_types')

    assert_equals "3" "$add_types"
}

# ============================================================================
# RUN ALL TESTS
# ============================================================================

run_tests