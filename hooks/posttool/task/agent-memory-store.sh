#!/bin/bash
set -euo pipefail
# Agent Memory Store - Post-Tool Hook for Task
# CC 2.1.6 Compliant: includes continue field in all outputs
# Extracts and stores successful patterns after agent completion
#
# Strategy:
# - Parse agent output for decision patterns
# - Extract key architectural choices
# - Store in mem0 with agent_id scope for future retrieval
# - Track agent performance metrics
#
# Version: 1.0.0
# Part of mem0 Semantic Memory Integration (#40, #45)

# Read stdin BEFORE sourcing common.sh to avoid subshell issues
_HOOK_INPUT=$(cat)
export _HOOK_INPUT

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../../_lib/common.sh"
source "$SCRIPT_DIR/../../_lib/mem0.sh"

# Source feedback lib for agent performance tracking
PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-$(cd "$SCRIPT_DIR/../../.." && pwd)}"
FEEDBACK_LIB="${PLUGIN_ROOT}/.claude/scripts/feedback-lib.sh"
if [[ -f "$FEEDBACK_LIB" ]]; then
    source "$FEEDBACK_LIB"
fi

log_hook "Agent memory store hook starting"

# -----------------------------------------------------------------------------
# Configuration
# -----------------------------------------------------------------------------

# Pattern extraction keywords
DECISION_PATTERNS=(
    "decided to"
    "chose"
    "implemented using"
    "selected"
    "opted for"
    "will use"
    "pattern:"
    "approach:"
    "architecture:"
)

# Output patterns log
PATTERNS_LOG="${CLAUDE_PROJECT_DIR:-.}/.claude/logs/agent-patterns.jsonl"
mkdir -p "$(dirname "$PATTERNS_LOG")" 2>/dev/null || true

# -----------------------------------------------------------------------------
# Extract Agent Info from Hook Input
# -----------------------------------------------------------------------------

AGENT_TYPE=""
AGENT_OUTPUT=""
SUCCESS="true"
DURATION="0"

if [[ -n "$_HOOK_INPUT" ]]; then
    # CC 2.1.6 PostToolUse format
    AGENT_TYPE=$(echo "$_HOOK_INPUT" | jq -r '.tool_input.subagent_type // .tool_input.type // ""' 2>/dev/null || echo "")
    AGENT_OUTPUT=$(echo "$_HOOK_INPUT" | jq -r '.tool_result // ""' 2>/dev/null || echo "")

    # Check for error in output
    if echo "$_HOOK_INPUT" | jq -e '.error // false' >/dev/null 2>&1; then
        SUCCESS="false"
    fi

    # Extract duration if available
    DURATION=$(echo "$_HOOK_INPUT" | jq -r '.duration_ms // 0' 2>/dev/null || echo "0")
fi

# If no agent type, silent success
if [[ -z "$AGENT_TYPE" ]]; then
    log_hook "No agent type in input, skipping"
    echo '{"continue": true}'
    exit 0
fi

log_hook "Processing completion for agent: $AGENT_TYPE (success: $SUCCESS)"

# -----------------------------------------------------------------------------
# Track Agent Performance (Feedback System)
# -----------------------------------------------------------------------------

if type log_agent_performance &>/dev/null; then
    log_agent_performance "$AGENT_TYPE" "$SUCCESS" "$DURATION"
    log_hook "Logged agent performance: $AGENT_TYPE"
fi

# -----------------------------------------------------------------------------
# Extract Patterns from Output
# -----------------------------------------------------------------------------

extract_patterns() {
    local output="$1"
    local patterns=()

    # Skip if output is too short or empty
    if [[ ${#output} -lt 50 ]]; then
        return
    fi

    # Extract sentences containing decision patterns
    for pattern in "${DECISION_PATTERNS[@]}"; do
        # Extract lines containing the pattern (case-insensitive)
        while IFS= read -r line; do
            # Clean and truncate the line
            line=$(echo "$line" | sed 's/^[[:space:]]*//' | cut -c1-200)
            if [[ -n "$line" && ${#line} -gt 20 ]]; then
                patterns+=("$line")
            fi
        done < <(echo "$output" | grep -i "$pattern" 2>/dev/null || true)
    done

    # Deduplicate and return
    printf '%s\n' "${patterns[@]}" | sort -u | head -5
}

# Extract patterns (only if successful)
EXTRACTED_PATTERNS=""
if [[ "$SUCCESS" == "true" && -n "$AGENT_OUTPUT" ]]; then
    EXTRACTED_PATTERNS=$(extract_patterns "$AGENT_OUTPUT")
fi

# -----------------------------------------------------------------------------
# Log Patterns for Storage
# -----------------------------------------------------------------------------

if [[ -n "$EXTRACTED_PATTERNS" ]]; then
    PROJECT_ID=$(mem0_get_project_id)
    TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    AGENT_USER_ID=$(mem0_user_id "$MEM0_SCOPE_AGENTS")

    # Log each pattern
    while IFS= read -r pattern; do
        if [[ -n "$pattern" ]]; then
            # Log to patterns file
            jq -n \
                --arg agent "$AGENT_TYPE" \
                --arg pattern "$pattern" \
                --arg project "$PROJECT_ID" \
                --arg timestamp "$TIMESTAMP" \
                --arg user_id "$AGENT_USER_ID" \
                '{
                    agent: $agent,
                    pattern: $pattern,
                    project: $project,
                    timestamp: $timestamp,
                    suggested_user_id: $user_id,
                    pending_sync: true
                }' >> "$PATTERNS_LOG"

            log_hook "Extracted pattern: ${pattern:0:50}..."
        fi
    done <<< "$EXTRACTED_PATTERNS"

    PATTERN_COUNT=$(echo "$EXTRACTED_PATTERNS" | grep -c . || echo "0")
    log_hook "Extracted $PATTERN_COUNT patterns from $AGENT_TYPE output"

    # Build suggestion for Claude to store memories
    SYSTEM_MSG="[Pattern Extraction] $PATTERN_COUNT patterns extracted from $AGENT_TYPE. Use mcp__mem0__add_memory with user_id='$AGENT_USER_ID' to persist for future sessions."

    jq -n \
        --arg msg "$SYSTEM_MSG" \
        '{
            continue: true,
            systemMessage: $msg
        }'
else
    log_hook "No patterns extracted from $AGENT_TYPE output"
    echo '{"continue": true}'
fi

exit 0