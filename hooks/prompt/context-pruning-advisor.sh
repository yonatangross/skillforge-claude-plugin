#!/usr/bin/env bash
# context-pruning-advisor.sh - Context Pruning Advisor Hook
# Issue: #126
# Hook: UserPromptSubmit
#
# This hook analyzes loaded context and recommends pruning candidates when
# context usage exceeds 70%. It scores items by recency, frequency, and
# relevance, then provides recommendations via CC 2.1.9 additionalContext.
#
# ═══════════════════════════════════════════════════════════════════════════════
# SCORING ALGORITHM
# ═══════════════════════════════════════════════════════════════════════════════
#
# Each context item is scored on three dimensions (0-100 scale):
#
# 1. RECENCY SCORE (40% weight)
#    Measures how recently the item was accessed.
#    - Last 5 minutes:   100 points
#    - 5-15 minutes:     75 points
#    - 15-30 minutes:    50 points
#    - 30-60 minutes:    25 points
#    - 60+ minutes:      10 points
#
# 2. FREQUENCY SCORE (30% weight)
#    Measures how often the item was accessed in this session.
#    - 5+ accesses:      100 points
#    - 3-4 accesses:     75 points
#    - 2 accesses:       50 points
#    - 1 access:         25 points
#
# 3. RELEVANCE SCORE (30% weight)
#    Measures how related the item is to current task.
#    - Currently active: 100 points (referenced in last prompt)
#    - Same domain:      50 points (matches tech stack/patterns)
#    - Unrelated:        25 points
#
# FINAL SCORE FORMULA:
#   final_score = (recency * 0.4) + (frequency * 0.3) + (relevance * 0.3)
#
# PRUNING THRESHOLDS:
#   - Score < 35:  HIGH pruning priority (red)
#   - Score 35-55: MEDIUM pruning priority (yellow)
#   - Score >= 55: KEEP (no pruning recommended)
#
# ═══════════════════════════════════════════════════════════════════════════════
# Version: 1.0.0
# CC 2.1.9 Compliant: Uses hookSpecificOutput.additionalContext

set -euo pipefail

# Read stdin BEFORE sourcing common.sh to avoid subshell issues
_HOOK_INPUT=$(cat)
export _HOOK_INPUT

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-$(dirname "$(dirname "$SCRIPT_DIR")")}"

# Source common utilities
if [[ -f "$SCRIPT_DIR/../_lib/common.sh" ]]; then
    source "$SCRIPT_DIR/../_lib/common.sh"
else
    # Minimal fallback if common.sh not available
    log_hook() { echo "[$(date -Iseconds)] $*" >> "${HOOK_LOG_DIR:-/tmp}/context-pruning.log" 2>/dev/null || true; }
    output_silent_success() { echo '{"continue": true, "suppressOutput": true}'; }
fi

# ═══════════════════════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════════

# Context threshold to trigger analysis (70%)
CONTEXT_TRIGGER_THRESHOLD=70

# Token budget (from context-budget-monitor.sh)
BUDGET_TOTAL=2200

# Scoring weights
WEIGHT_RECENCY=40
WEIGHT_FREQUENCY=30
WEIGHT_RELEVANCE=30

# Pruning thresholds
THRESHOLD_HIGH_PRUNE=35
THRESHOLD_MEDIUM_PRUNE=55

# Data source files
CONTEXT_DIR="${CLAUDE_PROJECT_DIR:-.}/.claude/context"
LOG_DIR="${CLAUDE_PROJECT_DIR:-.}/.claude/logs"
METRICS_FILE="/tmp/claude-session-metrics.json"
SKILL_ANALYTICS="${LOG_DIR}/skill-analytics.jsonl"
MCP_STATE_FILE="/tmp/claude-mcp-defer-state-${CLAUDE_SESSION_ID:-unknown}.json"
PRUNING_STATE_FILE="/tmp/claude-context-pruning-${CLAUDE_SESSION_ID:-unknown}.json"

# Ensure directories exist
mkdir -p "$LOG_DIR" 2>/dev/null || true

# ═══════════════════════════════════════════════════════════════════════════════
# UTILITY FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════════

# Get current Unix timestamp
get_now() {
    date +%s
}

# Calculate age in minutes from timestamp
calculate_age_minutes() {
    local timestamp="$1"
    local now
    now=$(get_now)

    # Parse ISO timestamp to epoch (cross-platform)
    local epoch
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS: gdate if available, fallback to date with parsing
        if command -v gdate &>/dev/null; then
            epoch=$(gdate -d "$timestamp" +%s 2>/dev/null || echo "$now")
        else
            # Try to parse ISO format manually or fall back
            epoch=$(date -j -f "%Y-%m-%dT%H:%M:%S" "${timestamp%%Z*}" +%s 2>/dev/null || echo "$now")
        fi
    else
        # Linux: date -d works
        epoch=$(date -d "$timestamp" +%s 2>/dev/null || echo "$now")
    fi

    echo $(( (now - epoch) / 60 ))
}

# Calculate recency score (0-100)
calculate_recency_score() {
    local age_minutes="$1"

    if [[ $age_minutes -lt 5 ]]; then
        echo 100
    elif [[ $age_minutes -lt 15 ]]; then
        echo 75
    elif [[ $age_minutes -lt 30 ]]; then
        echo 50
    elif [[ $age_minutes -lt 60 ]]; then
        echo 25
    else
        echo 10
    fi
}

# Calculate frequency score (0-100)
calculate_frequency_score() {
    local count="$1"

    if [[ $count -ge 5 ]]; then
        echo 100
    elif [[ $count -ge 3 ]]; then
        echo 75
    elif [[ $count -ge 2 ]]; then
        echo 50
    else
        echo 25
    fi
}

# Calculate relevance score based on prompt content (0-100)
calculate_relevance_score() {
    local item_name="$1"
    local prompt="$2"
    local prompt_lower
    prompt_lower=$(echo "$prompt" | tr '[:upper:]' '[:lower:]')
    local item_lower
    item_lower=$(echo "$item_name" | tr '[:upper:]' '[:lower:]' | tr '-' ' ' | tr '_' ' ')

    # Check if item is mentioned in prompt
    if [[ "$prompt_lower" == *"$item_lower"* ]]; then
        echo 100
    else
        # Extract keywords from item name and check partial matches
        local has_match=false
        for word in $item_lower; do
            if [[ ${#word} -gt 3 && "$prompt_lower" == *"$word"* ]]; then
                has_match=true
                break
            fi
        done

        if [[ "$has_match" == "true" ]]; then
            echo 50
        else
            echo 25
        fi
    fi
}

# Calculate final weighted score
calculate_final_score() {
    local recency="$1"
    local frequency="$2"
    local relevance="$3"

    local score
    score=$(echo "scale=0; ($recency * $WEIGHT_RECENCY + $frequency * $WEIGHT_FREQUENCY + $relevance * $WEIGHT_RELEVANCE) / 100" | bc)
    echo "$score"
}

# ═══════════════════════════════════════════════════════════════════════════════
# CONTEXT ANALYSIS FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════════

# Estimate current context usage (from context files)
estimate_context_usage() {
    local total=0

    # Check context files (same logic as context-budget-monitor.sh)
    for file in "$CONTEXT_DIR/identity.json" \
                "$CONTEXT_DIR/session/state.json" \
                "$CONTEXT_DIR/knowledge/index.json" \
                "$CONTEXT_DIR/knowledge/blockers/current.json"; do
        if [[ -f "$file" ]]; then
            local chars
            chars=$(wc -c < "$file" 2>/dev/null | tr -d ' ' || echo 0)
            total=$((total + chars / 4))  # ~4 chars per token
        fi
    done

    echo "$total"
}

# Get context usage percentage
get_context_percentage() {
    local current_tokens
    current_tokens=$(estimate_context_usage)

    if [[ $BUDGET_TOTAL -eq 0 ]]; then
        echo 0
        return
    fi

    echo "scale=0; $current_tokens * 100 / $BUDGET_TOTAL" | bc
}

# Analyze loaded skills from skill-analytics.jsonl
analyze_skills() {
    local prompt="$1"
    local skills_json="[]"

    if [[ ! -f "$SKILL_ANALYTICS" ]]; then
        echo "$skills_json"
        return
    fi

    # Get recent skill invocations (last 100 entries to limit processing)
    local entries
    entries=$(tail -100 "$SKILL_ANALYTICS" 2>/dev/null || echo "")

    if [[ -z "$entries" ]]; then
        echo "$skills_json"
        return
    fi

    # Aggregate skill usage
    local skill_data
    skill_data=$(echo "$entries" | jq -s '
        group_by(.skill) |
        map({
            name: .[0].skill,
            count: length,
            last_used: (sort_by(.timestamp) | last | .timestamp)
        }) |
        sort_by(.count) | reverse
    ' 2>/dev/null || echo "[]")

    # Score each skill
    local scored_skills="[]"
    local now
    now=$(get_now)

    while IFS= read -r skill_entry; do
        local name count last_used
        name=$(echo "$skill_entry" | jq -r '.name // ""')
        count=$(echo "$skill_entry" | jq -r '.count // 1')
        last_used=$(echo "$skill_entry" | jq -r '.last_used // ""')

        [[ -z "$name" ]] && continue

        local age_minutes=60
        if [[ -n "$last_used" ]]; then
            age_minutes=$(calculate_age_minutes "$last_used")
        fi

        local recency_score frequency_score relevance_score final_score
        recency_score=$(calculate_recency_score "$age_minutes")
        frequency_score=$(calculate_frequency_score "$count")
        relevance_score=$(calculate_relevance_score "$name" "$prompt")
        final_score=$(calculate_final_score "$recency_score" "$frequency_score" "$relevance_score")

        scored_skills=$(echo "$scored_skills" | jq \
            --arg name "$name" \
            --argjson recency "$recency_score" \
            --argjson frequency "$frequency_score" \
            --argjson relevance "$relevance_score" \
            --argjson final "$final_score" \
            --argjson count "$count" \
            --argjson age "$age_minutes" \
            '. + [{
                type: "skill",
                name: $name,
                scores: {recency: $recency, frequency: $frequency, relevance: $relevance},
                final_score: $final,
                access_count: $count,
                age_minutes: $age
            }]')
    done < <(echo "$skill_data" | jq -c '.[]' 2>/dev/null)

    echo "$scored_skills"
}

# Analyze tool usage from session metrics
analyze_tools() {
    local prompt="$1"
    local tools_json="[]"

    if [[ ! -f "$METRICS_FILE" ]]; then
        echo "$tools_json"
        return
    fi

    local tool_data
    tool_data=$(jq -r '.tools // {}' "$METRICS_FILE" 2>/dev/null || echo "{}")

    if [[ "$tool_data" == "{}" ]]; then
        echo "$tools_json"
        return
    fi

    while IFS= read -r tool_entry; do
        local name count
        name=$(echo "$tool_entry" | jq -r '.key // ""')
        count=$(echo "$tool_entry" | jq -r '.value // 1')

        [[ -z "$name" || "$name" == "null" ]] && continue

        # Tools don't have timestamps, estimate based on session length
        local recency_score frequency_score relevance_score final_score
        recency_score=50  # Default to middle
        frequency_score=$(calculate_frequency_score "$count")
        relevance_score=$(calculate_relevance_score "$name" "$prompt")
        final_score=$(calculate_final_score "$recency_score" "$frequency_score" "$relevance_score")

        tools_json=$(echo "$tools_json" | jq \
            --arg name "$name" \
            --argjson recency "$recency_score" \
            --argjson frequency "$frequency_score" \
            --argjson relevance "$relevance_score" \
            --argjson final "$final_score" \
            --argjson count "$count" \
            '. + [{
                type: "tool",
                name: $name,
                scores: {recency: $recency, frequency: $frequency, relevance: $relevance},
                final_score: $final,
                access_count: $count
            }]')
    done < <(echo "$tool_data" | jq -c 'to_entries[] | {key: .key, value: .value}' 2>/dev/null)

    echo "$tools_json"
}

# Analyze context files
analyze_context_files() {
    local prompt="$1"
    local files_json="[]"

    [[ ! -d "$CONTEXT_DIR" ]] && { echo "$files_json"; return; }

    # Analyze each context file
    local context_files=()
    while IFS= read -r -d '' file; do
        context_files+=("$file")
    done < <(find "$CONTEXT_DIR" -name "*.json" -type f -print0 2>/dev/null)

    for file in "${context_files[@]}"; do
        local filename
        filename=$(basename "$file" .json)
        local rel_path="${file#$CONTEXT_DIR/}"

        # Get file modification time
        local mtime age_minutes
        if [[ "$OSTYPE" == "darwin"* ]]; then
            mtime=$(stat -f %m "$file" 2>/dev/null || echo "$(get_now)")
        else
            mtime=$(stat -c %Y "$file" 2>/dev/null || echo "$(get_now)")
        fi
        local now
        now=$(get_now)
        age_minutes=$(( (now - mtime) / 60 ))

        # Get file size in tokens (estimate)
        local chars tokens
        chars=$(wc -c < "$file" 2>/dev/null | tr -d ' ' || echo 0)
        tokens=$((chars / 4))

        local recency_score frequency_score relevance_score final_score
        recency_score=$(calculate_recency_score "$age_minutes")
        frequency_score=50  # Default for files
        relevance_score=$(calculate_relevance_score "$filename" "$prompt")
        final_score=$(calculate_final_score "$recency_score" "$frequency_score" "$relevance_score")

        files_json=$(echo "$files_json" | jq \
            --arg name "$rel_path" \
            --argjson recency "$recency_score" \
            --argjson frequency "$frequency_score" \
            --argjson relevance "$relevance_score" \
            --argjson final "$final_score" \
            --argjson tokens "$tokens" \
            --argjson age "$age_minutes" \
            '. + [{
                type: "context_file",
                name: $name,
                scores: {recency: $recency, frequency: $frequency, relevance: $relevance},
                final_score: $final,
                estimated_tokens: $tokens,
                age_minutes: $age
            }]')
    done

    echo "$files_json"
}

# ═══════════════════════════════════════════════════════════════════════════════
# RECOMMENDATION GENERATION
# ═══════════════════════════════════════════════════════════════════════════════

# Generate pruning recommendations
generate_recommendations() {
    local all_items="$1"
    local context_percent="$2"

    # Sort items by score (ascending - lowest scores first for pruning)
    local sorted_items
    sorted_items=$(echo "$all_items" | jq 'sort_by(.final_score)')

    # Categorize items
    local high_prune medium_prune keep
    high_prune=$(echo "$sorted_items" | jq --argjson t "$THRESHOLD_HIGH_PRUNE" '[.[] | select(.final_score < $t)]')
    medium_prune=$(echo "$sorted_items" | jq --argjson t1 "$THRESHOLD_HIGH_PRUNE" --argjson t2 "$THRESHOLD_MEDIUM_PRUNE" '[.[] | select(.final_score >= $t1 and .final_score < $t2)]')
    keep=$(echo "$sorted_items" | jq --argjson t "$THRESHOLD_MEDIUM_PRUNE" '[.[] | select(.final_score >= $t)]')

    # Build recommendation message
    local recommendation=""

    recommendation+="## Context Pruning Advisor\n\n"
    recommendation+="**Context Usage**: ${context_percent}% (threshold: ${CONTEXT_TRIGGER_THRESHOLD}%)\n\n"

    # High priority pruning
    local high_count
    high_count=$(echo "$high_prune" | jq 'length')
    if [[ $high_count -gt 0 ]]; then
        recommendation+="### High Priority - Recommend Pruning\n"
        while IFS= read -r item; do
            local name score item_type
            name=$(echo "$item" | jq -r '.name // "unknown"')
            score=$(echo "$item" | jq -r '.final_score // 0')
            item_type=$(echo "$item" | jq -r '.type // "unknown"')
            recommendation+="- **$name** ($item_type, score: $score)\n"
        done < <(echo "$high_prune" | jq -c '.[]' 2>/dev/null)
        recommendation+="\n"
    fi

    # Medium priority pruning
    local medium_count
    medium_count=$(echo "$medium_prune" | jq 'length')
    if [[ $medium_count -gt 0 ]]; then
        recommendation+="### Consider Pruning (Optional)\n"
        while IFS= read -r item; do
            local name score item_type
            name=$(echo "$item" | jq -r '.name // "unknown"')
            score=$(echo "$item" | jq -r '.final_score // 0')
            item_type=$(echo "$item" | jq -r '.type // "unknown"')
            recommendation+="- **$name** ($item_type, score: $score)\n"
        done < <(echo "$medium_prune" | jq -c '.[]' 2>/dev/null)
        recommendation+="\n"
    fi

    # Items to keep
    local keep_count
    keep_count=$(echo "$keep" | jq 'length')
    if [[ $keep_count -gt 0 && $keep_count -le 5 ]]; then
        recommendation+="### Keep (High Value)\n"
        while IFS= read -r item; do
            local name score item_type
            name=$(echo "$item" | jq -r '.name // "unknown"')
            score=$(echo "$item" | jq -r '.final_score // 0')
            item_type=$(echo "$item" | jq -r '.type // "unknown"')
            recommendation+="- **$name** ($item_type, score: $score)\n"
        done < <(echo "$keep" | jq -c '.[]' 2>/dev/null | head -5)
        recommendation+="\n"
    fi

    # Suggested actions
    if [[ $high_count -gt 0 || $medium_count -gt 0 ]]; then
        recommendation+="### Suggested Actions\n"
        recommendation+="1. Use \`/skf:context-compression\` skill for automated compaction\n"
        recommendation+="2. Archive old session state with context-budget-monitor\n"
        recommendation+="3. Clear unused skill context by closing skill-related subtasks\n"
    fi

    echo -e "$recommendation"
}

# ═══════════════════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════════════════

main() {
    # Get user prompt
    local prompt=""
    prompt=$(get_field '.prompt // ""' 2>/dev/null || echo "")

    if [[ -z "$prompt" ]]; then
        echo '{"continue": true, "suppressOutput": true}'
        exit 0
    fi

    # Check context usage percentage
    local context_percent
    context_percent=$(get_context_percentage)

    log_hook "Context usage: ${context_percent}% (threshold: ${CONTEXT_TRIGGER_THRESHOLD}%)"

    # Only trigger if above threshold
    if [[ $context_percent -lt $CONTEXT_TRIGGER_THRESHOLD ]]; then
        log_hook "Context below threshold, skipping analysis"
        echo '{"continue": true, "suppressOutput": true}'
        exit 0
    fi

    log_hook "Context above threshold, analyzing loaded context..."

    # Analyze all context sources
    local skills_analysis tools_analysis files_analysis
    skills_analysis=$(analyze_skills "$prompt")
    tools_analysis=$(analyze_tools "$prompt")
    files_analysis=$(analyze_context_files "$prompt")

    # Combine all items
    local all_items
    all_items=$(jq -n \
        --argjson skills "$skills_analysis" \
        --argjson tools "$tools_analysis" \
        --argjson files "$files_analysis" \
        '$skills + $tools + $files')

    local item_count
    item_count=$(echo "$all_items" | jq 'length')
    log_hook "Analyzed $item_count context items"

    if [[ $item_count -eq 0 ]]; then
        log_hook "No context items to analyze"
        echo '{"continue": true, "suppressOutput": true}'
        exit 0
    fi

    # Generate recommendations
    local recommendations
    recommendations=$(generate_recommendations "$all_items" "$context_percent")

    # Save state for debugging
    jq -n \
        --argjson items "$all_items" \
        --argjson percent "$context_percent" \
        --arg timestamp "$(date -Iseconds)" \
        '{
            timestamp: $timestamp,
            context_percent: $percent,
            items: $items
        }' > "$PRUNING_STATE_FILE" 2>/dev/null || true

    log_hook "Generated pruning recommendations"

    # Output via additionalContext (CC 2.1.9)
    jq -n \
        --arg ctx "$recommendations" \
        '{
            "continue": true,
            "hookSpecificOutput": {
                "additionalContext": $ctx
            }
        }'
}

main "$@"
