#!/usr/bin/env bash
# feedback-lib.sh - Helper functions for feedback system
# Part of SkillForge Claude Plugin

set -euo pipefail

# =============================================================================
# CONSTANTS
# =============================================================================

# Feedback directory
FEEDBACK_DIR="${FEEDBACK_DIR:-${CLAUDE_PROJECT_DIR:-.}/.claude/feedback}"

# File paths
METRICS_FILE="${METRICS_FILE:-${FEEDBACK_DIR}/metrics.json}"
PATTERNS_FILE="${PATTERNS_FILE:-${FEEDBACK_DIR}/learned-patterns.json}"
PREFERENCES_FILE="${PREFERENCES_FILE:-${FEEDBACK_DIR}/preferences.json}"

# Learning thresholds
readonly MIN_SAMPLES_FOR_LEARNING=5
readonly MIN_APPROVAL_RATE=0.9

# Security blocklist - NEVER auto-approve these patterns
readonly SECURITY_BLOCKLIST=(
    'rm\s+(-rf|-r\s+-f)'
    'sudo\s'
    'chmod\s+777'
    'chown\s'
    '>\s*/(etc|usr|bin|sbin)/'
    '--force\s'
    '--no-verify'
    'curl\s.*\|\s*(ba)?sh'
    'eval\s'
    '(password|secret|credential|token|api.?key)'
)

# =============================================================================
# INITIALIZATION
# =============================================================================

# Initialize feedback directory and files
init_feedback() {
    mkdir -p "$FEEDBACK_DIR"

    # Create metrics.json if not exists
    if [[ ! -f "$METRICS_FILE" ]]; then
        cat > "$METRICS_FILE" << 'EOF'
{
  "version": "1.0",
  "updated": "",
  "skills": {},
  "hooks": {},
  "agents": {}
}
EOF
    fi

    # Create learned-patterns.json if not exists
    if [[ ! -f "$PATTERNS_FILE" ]]; then
        cat > "$PATTERNS_FILE" << 'EOF'
{
  "version": "1.0",
  "updated": "",
  "permissions": {},
  "codeStyle": {}
}
EOF
    fi

    # Create preferences.json if not exists
    if [[ ! -f "$PREFERENCES_FILE" ]]; then
        cat > "$PREFERENCES_FILE" << 'EOF'
{
  "version": "1.0",
  "enabled": true,
  "learnFromEdits": true,
  "learnFromApprovals": true,
  "learnFromAgentOutcomes": true,
  "shareAnonymized": false,
  "retentionDays": 90,
  "pausedUntil": null
}
EOF
    fi

    # Create .gitkeep
    touch "${FEEDBACK_DIR}/.gitkeep"
}

# =============================================================================
# PREFERENCES
# =============================================================================

# Check if feedback is enabled
is_feedback_enabled() {
    if [[ ! -f "$PREFERENCES_FILE" ]]; then
        return 0  # Default to enabled
    fi

    local enabled
    enabled=$(jq -r 'if has("enabled") then .enabled else true end' "$PREFERENCES_FILE" 2>/dev/null || echo "true")

    if [[ "$enabled" == "false" ]]; then
        return 1
    fi

    # Check if paused
    local paused_until
    paused_until=$(jq -r '.pausedUntil // null' "$PREFERENCES_FILE" 2>/dev/null || echo "null")

    if [[ "$paused_until" != "null" ]]; then
        local now
        now=$(date +%s)
        local pause_ts
        pause_ts=$(date -j -f "%Y-%m-%dT%H:%M:%S" "${paused_until%%.*}" +%s 2>/dev/null || echo "0")

        if [[ $now -lt $pause_ts ]]; then
            return 1
        fi
    fi

    return 0
}

# Get preference value
get_preference() {
    local key="$1"
    local default="${2:-true}"

    if [[ ! -f "$PREFERENCES_FILE" ]]; then
        echo "$default"
        return
    fi

    jq -r ".${key} // \"${default}\"" "$PREFERENCES_FILE" 2>/dev/null || echo "$default"
}

# Set preference value
set_preference() {
    local key="$1"
    local value="$2"

    init_feedback

    local tmp_file
    tmp_file=$(mktemp)
    jq ".${key} = ${value}" "$PREFERENCES_FILE" > "$tmp_file" && mv "$tmp_file" "$PREFERENCES_FILE"
}

# =============================================================================
# SECURITY
# =============================================================================

# Check if command matches security blocklist
is_security_blocked() {
    local command="$1"

    for pattern in "${SECURITY_BLOCKLIST[@]}"; do
        if echo "$command" | grep -qiE -e "$pattern"; then
            return 0  # Blocked
        fi
    done

    return 1  # Not blocked
}

# =============================================================================
# PERMISSION LEARNING
# =============================================================================

# Log a permission decision
log_permission() {
    local command="$1"
    local approved="$2"  # true or false

    if ! is_feedback_enabled; then
        return
    fi

    if [[ "$(get_preference 'learnFromApprovals')" != "true" ]]; then
        return
    fi

    init_feedback

    local now
    now=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

    # Normalize command for pattern matching
    local normalized
    normalized=$(echo "$command" | sed 's/[0-9]\+/N/g' | sed 's/"[^"]*"/"..."/g')

    local tmp_file
    tmp_file=$(mktemp)

    # Update patterns file
    jq --arg cmd "$normalized" --arg approved "$approved" --arg now "$now" '
        .updated = $now |
        .permissions[$cmd] = (
            .permissions[$cmd] // { "autoApprove": false, "confidence": 0, "samples": 0, "approvals": 0 }
        ) |
        .permissions[$cmd].samples += 1 |
        .permissions[$cmd].approvals += (if $approved == "true" then 1 else 0 end) |
        .permissions[$cmd].confidence = (.permissions[$cmd].approvals / .permissions[$cmd].samples) |
        .permissions[$cmd].lastSeen = $now |
        if .permissions[$cmd].samples >= 5 and .permissions[$cmd].confidence >= 0.9
        then .permissions[$cmd].autoApprove = true
        else .permissions[$cmd].autoApprove = false
        end
    ' "$PATTERNS_FILE" > "$tmp_file" && mv "$tmp_file" "$PATTERNS_FILE"
}

# Check if command should be auto-approved
should_auto_approve() {
    local command="$1"

    # Never auto-approve security-blocked commands
    if is_security_blocked "$command"; then
        return 1
    fi

    if ! is_feedback_enabled; then
        return 1
    fi

    if [[ ! -f "$PATTERNS_FILE" ]]; then
        return 1
    fi

    # Normalize command
    local normalized
    normalized=$(echo "$command" | sed 's/[0-9]\+/N/g' | sed 's/"[^"]*"/"..."/g')

    local auto_approve
    auto_approve=$(jq -r --arg cmd "$normalized" '.permissions[$cmd].autoApprove // false' "$PATTERNS_FILE" 2>/dev/null || echo "false")

    [[ "$auto_approve" == "true" ]]
}

# =============================================================================
# METRICS
# =============================================================================

# Log skill usage
log_skill_usage() {
    local skill_id="$1"
    local success="${2:-true}"
    local edits="${3:-0}"

    if ! is_feedback_enabled; then
        return
    fi

    init_feedback

    local now
    now=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    local today
    today=$(date +"%Y-%m-%d")

    local tmp_file
    tmp_file=$(mktemp)

    jq --arg skill "$skill_id" --arg success "$success" --arg edits "$edits" --arg now "$now" --arg today "$today" '
        .updated = $now |
        .skills[$skill] = (
            .skills[$skill] // { "uses": 0, "successes": 0, "totalEdits": 0, "avgEdits": 0 }
        ) |
        .skills[$skill].uses += 1 |
        .skills[$skill].successes += (if $success == "true" then 1 else 0 end) |
        .skills[$skill].totalEdits += ($edits | tonumber) |
        .skills[$skill].avgEdits = (.skills[$skill].totalEdits / .skills[$skill].uses) |
        .skills[$skill].lastUsed = $today
    ' "$METRICS_FILE" > "$tmp_file" && mv "$tmp_file" "$METRICS_FILE"
}

# Log agent performance
log_agent_performance() {
    local agent_id="$1"
    local success="${2:-true}"
    local duration="${3:-0}"

    if ! is_feedback_enabled; then
        return
    fi

    init_feedback

    local now
    now=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

    local tmp_file
    tmp_file=$(mktemp)

    jq --arg agent "$agent_id" --arg success "$success" --arg duration "$duration" --arg now "$now" '
        .updated = $now |
        .agents[$agent] = (
            .agents[$agent] // { "spawns": 0, "successes": 0, "totalDuration": 0, "avgDuration": 0 }
        ) |
        .agents[$agent].spawns += 1 |
        .agents[$agent].successes += (if $success == "true" then 1 else 0 end) |
        .agents[$agent].totalDuration += ($duration | tonumber) |
        .agents[$agent].avgDuration = (.agents[$agent].totalDuration / .agents[$agent].spawns)
    ' "$METRICS_FILE" > "$tmp_file" && mv "$tmp_file" "$METRICS_FILE"
}

# =============================================================================
# REPORTING
# =============================================================================

# Get feedback status summary
get_feedback_status() {
    init_feedback

    local enabled
    enabled=$(get_preference "enabled" "true")
    local sharing
    sharing=$(get_preference "shareAnonymized" "false")
    local retention
    retention=$(get_preference "retentionDays" "90")

    local learned_count=0
    if [[ -f "$PATTERNS_FILE" ]]; then
        learned_count=$(jq '[.permissions | to_entries[] | select(.value.autoApprove == true)] | length' "$PATTERNS_FILE" 2>/dev/null || echo "0")
    fi

    local skill_count=0
    local agent_count=0
    if [[ -f "$METRICS_FILE" ]]; then
        skill_count=$(jq '.skills | length' "$METRICS_FILE" 2>/dev/null || echo "0")
        agent_count=$(jq '.agents | length' "$METRICS_FILE" 2>/dev/null || echo "0")
    fi

    cat << EOF
📊 Feedback System Status
────────────────────────────
Learning: $([ "$enabled" == "true" ] && echo "Enabled" || echo "Disabled")
Anonymous sharing: $([ "$sharing" == "true" ] && echo "Enabled" || echo "Disabled")
Data retention: ${retention} days

Learned Patterns: ${learned_count} auto-approve rules
Skills tracked: ${skill_count}
Agents tracked: ${agent_count}

Storage: ${FEEDBACK_DIR}
EOF
}

# =============================================================================
# EXPORTS
# =============================================================================

export -f init_feedback
export -f is_feedback_enabled
export -f get_preference
export -f set_preference
export -f is_security_blocked
export -f log_permission
export -f should_auto_approve
export -f log_skill_usage
export -f log_agent_performance
export -f get_feedback_status