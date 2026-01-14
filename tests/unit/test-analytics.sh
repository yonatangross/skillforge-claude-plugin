#!/usr/bin/env bash
# ============================================================================
# Analytics Library Unit Tests
# ============================================================================
# Tests for .claude/scripts/analytics-lib.sh
# - Data anonymization
# - PII validation
# - Export format validation
# - Opt-in/opt-out respect
#
# Issue: #59 - Optional Anonymous Analytics
# ============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../fixtures/test-helpers.sh"

ANALYTICS_LIB="$PROJECT_ROOT/.claude/scripts/analytics-lib.sh"

# ============================================================================
# FILE STRUCTURE TESTS
# ============================================================================

describe "Analytics Library: File Structure"

test_analytics_lib_exists() {
    assert_file_exists "$ANALYTICS_LIB"
}

test_analytics_lib_syntax() {
    bash -n "$ANALYTICS_LIB"
}

test_analytics_lib_executable() {
    [[ -x "$ANALYTICS_LIB" ]]
}

test_analytics_lib_safety() {
    grep -q "set -euo pipefail" "$ANALYTICS_LIB"
}

it "exists" test_analytics_lib_exists
it "has valid syntax" test_analytics_lib_syntax
it "is executable" test_analytics_lib_executable
it "uses safety options" test_analytics_lib_safety

# ============================================================================
# PII VALIDATION TESTS
# ============================================================================

describe "Analytics Library: PII Validation"

test_detects_file_paths_unix() {
    source "$ANALYTICS_LIB"

    local test_data='{"path": "/Users/john/projects/secret"}'

    if validate_no_pii "$test_data" 2>/dev/null; then
        fail "Should detect Unix file paths as PII"
    fi
    return 0
}

test_detects_file_paths_windows() {
    source "$ANALYTICS_LIB"

    local test_data='{"path": "C:\\Users\\john\\Documents"}'

    if validate_no_pii "$test_data" 2>/dev/null; then
        fail "Should detect Windows file paths as PII"
    fi
    return 0
}

test_detects_email_addresses() {
    source "$ANALYTICS_LIB"

    local test_data='{"contact": "user@example.com"}'

    if validate_no_pii "$test_data" 2>/dev/null; then
        fail "Should detect email addresses as PII"
    fi
    return 0
}

test_detects_urls() {
    source "$ANALYTICS_LIB"

    local test_data='{"url": "https://private-server.company.com/api"}'

    if validate_no_pii "$test_data" 2>/dev/null; then
        fail "Should detect URLs as PII"
    fi
    return 0
}

test_detects_passwords() {
    source "$ANALYTICS_LIB"

    local test_data='{"password": "secret123"}'

    if validate_no_pii "$test_data" 2>/dev/null; then
        fail "Should detect password references as PII"
    fi
    return 0
}

test_detects_api_keys() {
    source "$ANALYTICS_LIB"

    local test_data='{"api_key": "sk-12345"}'

    if validate_no_pii "$test_data" 2>/dev/null; then
        fail "Should detect API key references as PII"
    fi
    return 0
}

test_detects_tokens() {
    source "$ANALYTICS_LIB"

    local test_data='{"token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"}'

    if validate_no_pii "$test_data" 2>/dev/null; then
        fail "Should detect token references as PII"
    fi
    return 0
}

test_allows_clean_data() {
    source "$ANALYTICS_LIB"

    local clean_data='{"skill_usage": {"api-design": {"uses": 10, "success_rate": 0.95}}}'

    if ! validate_no_pii "$clean_data" 2>/dev/null; then
        fail "Should allow clean analytics data"
    fi
    return 0
}

test_allows_empty_data() {
    source "$ANALYTICS_LIB"

    if ! validate_no_pii "" 2>/dev/null; then
        fail "Should allow empty data"
    fi
    return 0
}

it "detects Unix file paths" test_detects_file_paths_unix
it "detects Windows file paths" test_detects_file_paths_windows
it "detects email addresses" test_detects_email_addresses
it "detects URLs" test_detects_urls
it "detects password references" test_detects_passwords
it "detects API key references" test_detects_api_keys
it "detects token references" test_detects_tokens
it "allows clean data" test_allows_clean_data
it "allows empty data" test_allows_empty_data

# ============================================================================
# STRING SANITIZATION TESTS
# ============================================================================

describe "Analytics Library: String Sanitization"

test_sanitize_removes_file_paths() {
    source "$ANALYTICS_LIB"

    local input="Error in /Users/john/project/file.js"
    local result
    result=$(sanitize_string "$input")

    if [[ "$result" == *"/Users"* ]]; then
        fail "Should remove file paths"
    fi
    return 0
}

test_sanitize_removes_emails() {
    source "$ANALYTICS_LIB"

    local input="Contact: admin@company.com"
    local result
    result=$(sanitize_string "$input")

    if [[ "$result" == *"@"* ]]; then
        fail "Should remove email addresses"
    fi
    return 0
}

test_sanitize_removes_ips() {
    source "$ANALYTICS_LIB"

    local input="Server at 192.168.1.100"
    local result
    result=$(sanitize_string "$input")

    if [[ "$result" == *"192.168"* ]]; then
        fail "Should remove IP addresses"
    fi
    return 0
}

test_sanitize_removes_urls() {
    source "$ANALYTICS_LIB"

    local input="Visit https://example.com/path for details"
    local result
    result=$(sanitize_string "$input")

    if [[ "$result" == *"https://"* ]]; then
        fail "Should remove URLs"
    fi
    return 0
}

it "removes file paths" test_sanitize_removes_file_paths
it "removes emails" test_sanitize_removes_emails
it "removes IP addresses" test_sanitize_removes_ips
it "removes URLs" test_sanitize_removes_urls

# ============================================================================
# METRICS AGGREGATION TESTS
# ============================================================================

describe "Analytics Library: Metrics Aggregation"

test_get_skill_metrics_empty() {
    local test_dir="$TEMP_DIR/test-metrics1"
    mkdir -p "$test_dir/.claude/feedback"

    METRICS_FILE="$test_dir/.claude/feedback/metrics.json"
    export METRICS_FILE

    source "$ANALYTICS_LIB"

    local result
    result=$(get_skill_metrics)

    assert_equals "{}" "$result"
}

test_get_skill_metrics_with_data() {
    local test_dir="$TEMP_DIR/test-metrics2"
    mkdir -p "$test_dir/.claude/feedback"

    cat > "$test_dir/.claude/feedback/metrics.json" << 'EOF'
{
  "version": "1.0",
  "updated": "2026-01-14T10:00:00Z",
  "skills": {
    "api-design": {"uses": 10, "successes": 9, "avgEdits": 2.5},
    "database-schema": {"uses": 5, "successes": 4, "avgEdits": 1.2}
  }
}
EOF

    METRICS_FILE="$test_dir/.claude/feedback/metrics.json"
    export METRICS_FILE

    source "$ANALYTICS_LIB"

    local result
    result=$(get_skill_metrics)

    # Check that we get the expected structure
    local api_uses
    api_uses=$(echo "$result" | jq -r '.["api-design"].uses')
    assert_equals "10" "$api_uses"

    local api_rate
    api_rate=$(echo "$result" | jq -r '.["api-design"].success_rate')
    # 9/10 = 0.9
    [[ "$api_rate" == "0.9" ]]
}

test_get_agent_metrics_with_data() {
    local test_dir="$TEMP_DIR/test-metrics3"
    mkdir -p "$test_dir/.claude/feedback"

    cat > "$test_dir/.claude/feedback/metrics.json" << 'EOF'
{
  "version": "1.0",
  "updated": "2026-01-14T10:00:00Z",
  "agents": {
    "backend-architect": {"spawns": 20, "successes": 18, "avgDuration": 120},
    "test-generator": {"spawns": 15, "successes": 12, "avgDuration": 60}
  }
}
EOF

    METRICS_FILE="$test_dir/.claude/feedback/metrics.json"
    export METRICS_FILE

    source "$ANALYTICS_LIB"

    local result
    result=$(get_agent_metrics)

    local spawns
    spawns=$(echo "$result" | jq -r '.["backend-architect"].spawns')
    assert_equals "20" "$spawns"
}

test_get_hook_metrics_with_data() {
    local test_dir="$TEMP_DIR/test-metrics4"
    mkdir -p "$test_dir/.claude/feedback"

    cat > "$test_dir/.claude/feedback/metrics.json" << 'EOF'
{
  "version": "1.0",
  "updated": "2026-01-14T10:00:00Z",
  "hooks": {
    "git-branch-protection": {"triggered": 50, "blocked": 5},
    "file-guard": {"triggered": 100, "blocked": 2}
  }
}
EOF

    METRICS_FILE="$test_dir/.claude/feedback/metrics.json"
    export METRICS_FILE

    source "$ANALYTICS_LIB"

    local result
    result=$(get_hook_metrics)

    local triggered
    triggered=$(echo "$result" | jq -r '.["git-branch-protection"].triggered')
    assert_equals "50" "$triggered"
}

it "returns empty object when no metrics" test_get_skill_metrics_empty
it "extracts skill metrics correctly" test_get_skill_metrics_with_data
it "extracts agent metrics correctly" test_get_agent_metrics_with_data
it "extracts hook metrics correctly" test_get_hook_metrics_with_data

# ============================================================================
# EXPORT FORMAT TESTS
# ============================================================================

describe "Analytics Library: Export Format"

test_shareable_metrics_has_timestamp() {
    local test_dir="$TEMP_DIR/test-export1"
    mkdir -p "$test_dir/.claude/feedback"
    echo '{"version":"1.0","updated":"","skills":{},"agents":{},"hooks":{}}' > "$test_dir/.claude/feedback/metrics.json"

    METRICS_FILE="$test_dir/.claude/feedback/metrics.json"
    PROJECT_ROOT="$test_dir"
    export METRICS_FILE PROJECT_ROOT

    source "$ANALYTICS_LIB"

    local result
    result=$(get_shareable_metrics)

    local timestamp
    timestamp=$(echo "$result" | jq -r '.timestamp')

    # Should be today's date in YYYY-MM-DD format
    [[ "$timestamp" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]]
}

test_shareable_metrics_has_version() {
    local test_dir="$TEMP_DIR/test-export2"
    mkdir -p "$test_dir/.claude/feedback"
    echo '{"version":"1.0","updated":"","skills":{},"agents":{},"hooks":{}}' > "$test_dir/.claude/feedback/metrics.json"

    METRICS_FILE="$test_dir/.claude/feedback/metrics.json"
    PROJECT_ROOT="$test_dir"
    export METRICS_FILE PROJECT_ROOT

    source "$ANALYTICS_LIB"

    local result
    result=$(get_shareable_metrics)

    local version
    version=$(echo "$result" | jq -r '.plugin_version')

    # Should have a version string
    [[ -n "$version" && "$version" != "null" ]]
}

test_shareable_metrics_structure() {
    local test_dir="$TEMP_DIR/test-export3"
    mkdir -p "$test_dir/.claude/feedback"
    echo '{"version":"1.0","updated":"","skills":{},"agents":{},"hooks":{}}' > "$test_dir/.claude/feedback/metrics.json"

    METRICS_FILE="$test_dir/.claude/feedback/metrics.json"
    PROJECT_ROOT="$test_dir"
    export METRICS_FILE PROJECT_ROOT

    source "$ANALYTICS_LIB"

    local result
    result=$(get_shareable_metrics)

    # Check required fields exist
    echo "$result" | jq -e '.timestamp' >/dev/null
    echo "$result" | jq -e '.plugin_version' >/dev/null
    echo "$result" | jq -e '.skill_usage' >/dev/null
    echo "$result" | jq -e '.agent_performance' >/dev/null
    echo "$result" | jq -e '.hook_metrics' >/dev/null
}

test_prepare_report_adds_summary() {
    local test_dir="$TEMP_DIR/test-export4"
    mkdir -p "$test_dir/.claude/feedback"

    cat > "$test_dir/.claude/feedback/metrics.json" << 'EOF'
{
  "version": "1.0",
  "updated": "2026-01-14T10:00:00Z",
  "skills": {
    "skill-a": {"uses": 10, "successes": 9},
    "skill-b": {"uses": 5, "successes": 5}
  },
  "agents": {
    "agent-x": {"spawns": 8, "successes": 7}
  },
  "hooks": {
    "hook-1": {"triggered": 20, "blocked": 1}
  }
}
EOF

    METRICS_FILE="$test_dir/.claude/feedback/metrics.json"
    PROJECT_ROOT="$test_dir"
    export METRICS_FILE PROJECT_ROOT

    source "$ANALYTICS_LIB"

    local result
    result=$(prepare_anonymous_report)

    # Check summary is added
    local skill_count
    skill_count=$(echo "$result" | jq -r '.summary.unique_skills_used')
    assert_equals "2" "$skill_count"

    local total_uses
    total_uses=$(echo "$result" | jq -r '.summary.total_skill_invocations')
    assert_equals "15" "$total_uses"
}

it "has timestamp in shareable metrics" test_shareable_metrics_has_timestamp
it "has version in shareable metrics" test_shareable_metrics_has_version
it "has correct structure" test_shareable_metrics_structure
it "adds summary to prepared report" test_prepare_report_adds_summary

# ============================================================================
# REPORT VALIDATION TESTS
# ============================================================================

describe "Analytics Library: Report Validation"

test_report_contains_no_pii() {
    local test_dir="$TEMP_DIR/test-validate1"
    mkdir -p "$test_dir/.claude/feedback"

    cat > "$test_dir/.claude/feedback/metrics.json" << 'EOF'
{
  "version": "1.0",
  "updated": "2026-01-14T10:00:00Z",
  "skills": {
    "api-design": {"uses": 10, "successes": 9}
  },
  "agents": {},
  "hooks": {}
}
EOF

    METRICS_FILE="$test_dir/.claude/feedback/metrics.json"
    PROJECT_ROOT="$test_dir"
    export METRICS_FILE PROJECT_ROOT

    source "$ANALYTICS_LIB"

    local report
    report=$(prepare_anonymous_report)

    # Report should pass PII validation
    if ! validate_no_pii "$report"; then
        fail "Prepared report should not contain PII"
    fi
    return 0
}

test_report_valid_json() {
    local test_dir="$TEMP_DIR/test-validate2"
    mkdir -p "$test_dir/.claude/feedback"
    echo '{"version":"1.0","updated":"","skills":{},"agents":{},"hooks":{}}' > "$test_dir/.claude/feedback/metrics.json"

    METRICS_FILE="$test_dir/.claude/feedback/metrics.json"
    PROJECT_ROOT="$test_dir"
    export METRICS_FILE PROJECT_ROOT

    source "$ANALYTICS_LIB"

    local report
    report=$(prepare_anonymous_report)

    # Should be valid JSON
    echo "$report" | jq -e '.' >/dev/null
}

it "prepared report contains no PII" test_report_contains_no_pii
it "prepared report is valid JSON" test_report_valid_json

# ============================================================================
# OPT-IN/OPT-OUT TESTS
# ============================================================================

describe "Analytics Library: Opt-in/Opt-out"

test_sharing_disabled_by_default() {
    local test_dir="$TEMP_DIR/test-optin1"
    mkdir -p "$test_dir/.claude/feedback"

    # No preferences file - should default to disabled
    PREFERENCES_FILE="$test_dir/.claude/feedback/preferences.json"
    export PREFERENCES_FILE

    source "$ANALYTICS_LIB"

    if is_sharing_enabled; then
        fail "Sharing should be disabled by default"
    fi
    return 0
}

test_sharing_disabled_when_false() {
    local test_dir="$TEMP_DIR/test-optin2"
    mkdir -p "$test_dir/.claude/feedback"

    echo '{"version":"1.0","enabled":true,"shareAnonymized":false}' > "$test_dir/.claude/feedback/preferences.json"

    PREFERENCES_FILE="$test_dir/.claude/feedback/preferences.json"
    export PREFERENCES_FILE

    source "$ANALYTICS_LIB"

    if is_sharing_enabled; then
        fail "Sharing should be disabled when shareAnonymized is false"
    fi
    return 0
}

test_sharing_enabled_when_true() {
    local test_dir="$TEMP_DIR/test-optin3"
    mkdir -p "$test_dir/.claude/feedback"

    echo '{"version":"1.0","enabled":true,"shareAnonymized":true}' > "$test_dir/.claude/feedback/preferences.json"

    PREFERENCES_FILE="$test_dir/.claude/feedback/preferences.json"
    export PREFERENCES_FILE

    source "$ANALYTICS_LIB"

    if ! is_sharing_enabled; then
        fail "Sharing should be enabled when shareAnonymized is true"
    fi
    return 0
}

test_opt_in_sets_preference() {
    local test_dir="$TEMP_DIR/test-optin4"
    mkdir -p "$test_dir/.claude/feedback"

    echo '{"version":"1.0","enabled":true,"shareAnonymized":false}' > "$test_dir/.claude/feedback/preferences.json"

    PREFERENCES_FILE="$test_dir/.claude/feedback/preferences.json"
    FEEDBACK_DIR="$test_dir/.claude/feedback"
    export PREFERENCES_FILE FEEDBACK_DIR

    source "$ANALYTICS_LIB"

    # Capture output but ignore it
    opt_in_analytics >/dev/null

    # Check preference was set
    local sharing
    sharing=$(jq -r '.shareAnonymized' "$PREFERENCES_FILE")
    assert_equals "true" "$sharing"
}

test_opt_out_sets_preference() {
    local test_dir="$TEMP_DIR/test-optin5"
    mkdir -p "$test_dir/.claude/feedback"

    echo '{"version":"1.0","enabled":true,"shareAnonymized":true}' > "$test_dir/.claude/feedback/preferences.json"

    PREFERENCES_FILE="$test_dir/.claude/feedback/preferences.json"
    FEEDBACK_DIR="$test_dir/.claude/feedback"
    export PREFERENCES_FILE FEEDBACK_DIR

    source "$ANALYTICS_LIB"

    # Capture output but ignore it
    opt_out_analytics >/dev/null

    # Check preference was set
    local sharing
    sharing=$(jq -r '.shareAnonymized' "$PREFERENCES_FILE")
    assert_equals "false" "$sharing"
}

it "sharing disabled by default" test_sharing_disabled_by_default
it "sharing disabled when false" test_sharing_disabled_when_false
it "sharing enabled when true" test_sharing_enabled_when_true
it "opt-in sets preference" test_opt_in_sets_preference
it "opt-out sets preference" test_opt_out_sets_preference

# ============================================================================
# EXPORT FUNCTION TESTS
# ============================================================================

describe "Analytics Library: Export Function"

test_export_creates_file() {
    local test_dir="$TEMP_DIR/test-export-func1"
    mkdir -p "$test_dir/.claude/feedback"
    echo '{"version":"1.0","updated":"","skills":{},"agents":{},"hooks":{}}' > "$test_dir/.claude/feedback/metrics.json"

    METRICS_FILE="$test_dir/.claude/feedback/metrics.json"
    PROJECT_ROOT="$test_dir"
    FEEDBACK_DIR="$test_dir/.claude/feedback"
    ANALYTICS_EXPORT_DIR="$test_dir/.claude/feedback/analytics-exports"
    export METRICS_FILE PROJECT_ROOT FEEDBACK_DIR ANALYTICS_EXPORT_DIR

    source "$ANALYTICS_LIB"

    local export_path="$test_dir/test-export.json"
    export_analytics "$export_path" >/dev/null

    assert_file_exists "$export_path"
}

test_export_has_metadata() {
    local test_dir="$TEMP_DIR/test-export-func2"
    mkdir -p "$test_dir/.claude/feedback"
    echo '{"version":"1.0","updated":"","skills":{},"agents":{},"hooks":{}}' > "$test_dir/.claude/feedback/metrics.json"

    METRICS_FILE="$test_dir/.claude/feedback/metrics.json"
    PROJECT_ROOT="$test_dir"
    FEEDBACK_DIR="$test_dir/.claude/feedback"
    ANALYTICS_EXPORT_DIR="$test_dir/.claude/feedback/analytics-exports"
    export METRICS_FILE PROJECT_ROOT FEEDBACK_DIR ANALYTICS_EXPORT_DIR

    source "$ANALYTICS_LIB"

    local export_path="$test_dir/test-export.json"
    export_analytics "$export_path" >/dev/null

    # Check metadata exists
    local exported_at
    exported_at=$(jq -r '.metadata.exported_at' "$export_path")
    [[ -n "$exported_at" && "$exported_at" != "null" ]]
}

test_export_valid_json() {
    local test_dir="$TEMP_DIR/test-export-func3"
    mkdir -p "$test_dir/.claude/feedback"
    echo '{"version":"1.0","updated":"","skills":{},"agents":{},"hooks":{}}' > "$test_dir/.claude/feedback/metrics.json"

    METRICS_FILE="$test_dir/.claude/feedback/metrics.json"
    PROJECT_ROOT="$test_dir"
    FEEDBACK_DIR="$test_dir/.claude/feedback"
    ANALYTICS_EXPORT_DIR="$test_dir/.claude/feedback/analytics-exports"
    export METRICS_FILE PROJECT_ROOT FEEDBACK_DIR ANALYTICS_EXPORT_DIR

    source "$ANALYTICS_LIB"

    local export_path="$test_dir/test-export.json"
    export_analytics "$export_path" >/dev/null

    # Should be valid JSON
    jq -e '.' "$export_path" >/dev/null
}

it "creates export file" test_export_creates_file
it "export has metadata" test_export_has_metadata
it "export is valid JSON" test_export_valid_json

# ============================================================================
# SECURITY TESTS
# ============================================================================

describe "Analytics Library: Security"

test_no_project_paths_in_output() {
    local test_dir="$TEMP_DIR/test-security1"
    mkdir -p "$test_dir/.claude/feedback"

    cat > "$test_dir/.claude/feedback/metrics.json" << 'EOF'
{
  "version": "1.0",
  "updated": "2026-01-14T10:00:00Z",
  "skills": {
    "skill-a": {"uses": 10, "successes": 9}
  },
  "agents": {},
  "hooks": {}
}
EOF

    METRICS_FILE="$test_dir/.claude/feedback/metrics.json"
    PROJECT_ROOT="$test_dir"
    export METRICS_FILE PROJECT_ROOT

    source "$ANALYTICS_LIB"

    local report
    report=$(prepare_anonymous_report)

    # Report should not contain any file paths
    if [[ "$report" == *"/Users/"* ]] || [[ "$report" == *"/home/"* ]] || [[ "$report" == *"$test_dir"* ]]; then
        fail "Report should not contain file paths"
    fi
    return 0
}

test_no_sensitive_fields_leaked() {
    local test_dir="$TEMP_DIR/test-security2"
    mkdir -p "$test_dir/.claude/feedback"

    # Create metrics with some extra fields that shouldn't be exposed
    cat > "$test_dir/.claude/feedback/metrics.json" << 'EOF'
{
  "version": "1.0",
  "updated": "2026-01-14T10:00:00Z",
  "skills": {
    "skill-a": {
      "uses": 10,
      "successes": 9,
      "totalEdits": 50,
      "avgEdits": 5,
      "lastUsed": "2026-01-14"
    }
  },
  "agents": {},
  "hooks": {}
}
EOF

    METRICS_FILE="$test_dir/.claude/feedback/metrics.json"
    PROJECT_ROOT="$test_dir"
    export METRICS_FILE PROJECT_ROOT

    source "$ANALYTICS_LIB"

    local result
    result=$(get_skill_metrics)

    # Should only have uses and success_rate, not avgEdits or lastUsed
    if echo "$result" | jq -e '.["skill-a"].avgEdits' 2>/dev/null; then
        fail "Should not expose avgEdits field"
    fi

    if echo "$result" | jq -e '.["skill-a"].lastUsed' 2>/dev/null; then
        fail "Should not expose lastUsed field"
    fi
    return 0
}

it "no project paths in output" test_no_project_paths_in_output
it "no sensitive fields leaked" test_no_sensitive_fields_leaked

# ============================================================================
# RUN TESTS
# ============================================================================

print_summary