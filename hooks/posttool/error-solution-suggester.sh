#!/usr/bin/env bash
# error-solution-suggester.sh - PostToolUse hook for error remediation
# Issue #124: Suggests fixes and skills when Bash errors occur
#
# This hook analyzes error output from Bash commands and injects contextual
# solution suggestions via CC 2.1.9 additionalContext.
#
# CC 2.1.9 Compliant: Uses hookSpecificOutput.additionalContext for suggestions
# Version: 1.0.0

set -euo pipefail

# Read stdin BEFORE sourcing common.sh to avoid subshell issues
_HOOK_INPUT=$(cat)
export _HOOK_INPUT

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-$(dirname "$(dirname "$SCRIPT_DIR")")}"

# Source common library
if [[ -f "${SCRIPT_DIR}/../_lib/common.sh" ]]; then
    source "${SCRIPT_DIR}/../_lib/common.sh"
fi

# -----------------------------------------------------------------------------
# Configuration
# -----------------------------------------------------------------------------

SOLUTIONS_FILE="${PLUGIN_ROOT}/.claude/rules/error_solutions.json"
SKILLS_DIR="${PLUGIN_ROOT}/skills"
SESSION_ID="${CLAUDE_SESSION_ID:-unknown}"
DEDUP_FILE="/tmp/claude-error-suggestions-${SESSION_ID}.json"
LOG_FILE="${HOOK_LOG_DIR:-${CLAUDE_PROJECT_DIR:-.}/.claude/logs}/error-solution-suggester.log"

# Limits
MAX_CONTEXT_CHARS=2000
DEDUP_PROMPT_THRESHOLD=10
MAX_SKILLS=3

# Ensure directories exist
mkdir -p "$(dirname "$LOG_FILE")" 2>/dev/null || true
mkdir -p "$(dirname "$DEDUP_FILE")" 2>/dev/null || true

# Local logging function
log() {
    local timestamp
    timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [error-solution-suggester] $*" >> "$LOG_FILE" 2>/dev/null || true
}

# -----------------------------------------------------------------------------
# Self-Guards
# -----------------------------------------------------------------------------

# Only run for Bash tool
guard_bash_tool() {
    local tool_name
    tool_name=$(get_field '.tool_name // ""')
    [[ "$tool_name" == "Bash" ]]
}

# Check if this was an error
is_error_output() {
    local exit_code
    local tool_error
    local tool_output

    exit_code=$(get_field '.exit_code // 0')
    tool_error=$(get_field '.tool_error // .error // ""')
    tool_output=$(get_field '.tool_output // .output // ""')

    # Check exit code
    [[ "$exit_code" != "0" && -n "$exit_code" && "$exit_code" != "null" ]] && return 0

    # Check tool_error field
    [[ -n "$tool_error" ]] && return 0

    # Check output for error patterns
    echo "$tool_output" | grep -qiE "(error:|ERROR|FATAL|exception|failed|denied|not found|does not exist|connection refused|ENOENT|EACCES|EPERM)" && return 0

    return 1
}

# -----------------------------------------------------------------------------
# Pattern Matching
# -----------------------------------------------------------------------------

# Match error text against patterns in solutions file
# Returns matched pattern JSON or empty string
match_error_pattern() {
    local error_text="$1"

    if [[ ! -f "$SOLUTIONS_FILE" ]]; then
        log "Solutions file not found: $SOLUTIONS_FILE"
        return 1
    fi

    # Convert error text to lowercase for matching
    local error_lower
    error_lower=$(echo "$error_text" | tr '[:upper:]' '[:lower:]')

    # Read patterns and check each one
    local pattern_count
    pattern_count=$(jq -r '.patterns | length' "$SOLUTIONS_FILE" 2>/dev/null || echo "0")

    for ((i=0; i<pattern_count; i++)); do
        local pattern_json
        pattern_json=$(jq -c ".patterns[$i]" "$SOLUTIONS_FILE" 2>/dev/null)

        local regex
        regex=$(echo "$pattern_json" | jq -r '.regex // ""')

        if [[ -n "$regex" ]]; then
            # Check if error matches this pattern (case-insensitive)
            if echo "$error_lower" | grep -qiE "$regex" 2>/dev/null; then
                echo "$pattern_json"
                return 0
            fi
        fi
    done

    return 1
}

# -----------------------------------------------------------------------------
# Deduplication
# -----------------------------------------------------------------------------

# Initialize dedup file if needed
init_dedup_file() {
    if [[ ! -f "$DEDUP_FILE" ]]; then
        echo '{"suggestions":{},"prompt_count":0}' > "$DEDUP_FILE"
    fi
}

# Check if we should suggest for this pattern
# Returns 0 if should suggest, 1 if should skip (already suggested recently)
should_suggest() {
    local pattern_id="$1"
    local error_context="$2"

    init_dedup_file

    # Create hash of pattern ID + first 100 chars of error
    local suggestion_hash
    suggestion_hash=$(echo "${pattern_id}|${error_context:0:100}" | md5sum 2>/dev/null | cut -d' ' -f1 || echo "$pattern_id")

    # Increment prompt count
    local current_count
    current_count=$(jq -r '.prompt_count // 0' "$DEDUP_FILE" 2>/dev/null || echo "0")
    current_count=$((current_count + 1))

    # Get last suggested prompt count for this hash
    local last_suggested_at
    last_suggested_at=$(jq -r --arg h "$suggestion_hash" '.suggestions[$h].prompt_count // 0' "$DEDUP_FILE" 2>/dev/null || echo "0")

    # Update prompt count
    jq --argjson c "$current_count" '.prompt_count = $c' "$DEDUP_FILE" > "${DEDUP_FILE}.tmp" 2>/dev/null && \
        mv "${DEDUP_FILE}.tmp" "$DEDUP_FILE" 2>/dev/null || true

    # Allow if never suggested or more than threshold prompts ago
    if [[ "$last_suggested_at" -eq 0 ]] || [[ $((current_count - last_suggested_at)) -ge $DEDUP_PROMPT_THRESHOLD ]]; then
        # Record this suggestion
        jq --arg h "$suggestion_hash" --arg id "$pattern_id" --argjson c "$current_count" \
            '.suggestions[$h] = {pattern_id: $id, prompt_count: $c}' "$DEDUP_FILE" > "${DEDUP_FILE}.tmp" 2>/dev/null && \
            mv "${DEDUP_FILE}.tmp" "$DEDUP_FILE" 2>/dev/null || true
        return 0
    fi

    return 1
}

# -----------------------------------------------------------------------------
# Skill Lookup
# -----------------------------------------------------------------------------

# Get skill description from SKILL.md frontmatter
get_skill_description() {
    local skill_name="$1"
    local skill_file="${SKILLS_DIR}/${skill_name}/SKILL.md"

    if [[ -f "$skill_file" ]]; then
        # Extract description from YAML frontmatter
        sed -n '/^---$/,/^---$/p' "$skill_file" 2>/dev/null | \
            grep -E "^description:" | \
            sed 's/^description: *//' | \
            head -1
    fi
}

# Build skills section for message
build_skills_section() {
    local pattern_json="$1"
    local category

    category=$(echo "$pattern_json" | jq -r '.category // ""')

    # Get skills from pattern
    local pattern_skills
    pattern_skills=$(echo "$pattern_json" | jq -r '.skills // [] | .[]' 2>/dev/null)

    # Get skills from category
    local category_skills=""
    if [[ -n "$category" && -f "$SOLUTIONS_FILE" ]]; then
        category_skills=$(jq -r --arg c "$category" '.categories[$c].related_skills // [] | .[]' "$SOLUTIONS_FILE" 2>/dev/null)
    fi

    # Combine and dedupe skills
    local all_skills
    all_skills=$(printf "%s\n%s" "$pattern_skills" "$category_skills" | grep -v '^$' | sort -u | head -n "$MAX_SKILLS")

    if [[ -z "$all_skills" ]]; then
        return
    fi

    local section="### Related Skills\n\n"

    while IFS= read -r skill; do
        if [[ -n "$skill" ]]; then
            local desc
            desc=$(get_skill_description "$skill")
            if [[ -n "$desc" ]]; then
                section+="- **${skill}**: ${desc}\n"
            else
                section+="- **${skill}**\n"
            fi
        fi
    done <<< "$all_skills"

    section+="\nUse \`/skf:<skill-name>\` or \`Read skills/<skill-name>/SKILL.md\`"

    printf "%b" "$section"
}

# -----------------------------------------------------------------------------
# Message Builder
# -----------------------------------------------------------------------------

# Build the suggestion message
build_suggestion_message() {
    local pattern_json="$1"
    local error_text="$2"

    local pattern_id
    local brief
    local steps
    local severity

    pattern_id=$(echo "$pattern_json" | jq -r '.id // "unknown"')
    brief=$(echo "$pattern_json" | jq -r '.solution.brief // "An error was detected."')
    severity=$(echo "$pattern_json" | jq -r '.severity // "medium"')

    # Build steps list
    steps=$(echo "$pattern_json" | jq -r '.solution.steps // [] | to_entries | map("  \(.key + 1). \(.value)") | join("\n")' 2>/dev/null)

    # Build message
    local msg="## Error Solution\n\n"
    msg+="**${brief}**\n\n"

    if [[ -n "$steps" ]]; then
        msg+="### Quick Fixes\n\n"
        msg+="${steps}\n\n"
    fi

    # Add skills section
    local skills_section
    skills_section=$(build_skills_section "$pattern_json")
    if [[ -n "$skills_section" ]]; then
        msg+="$skills_section"
    fi

    # Truncate if too long
    if [[ ${#msg} -gt $MAX_CONTEXT_CHARS ]]; then
        msg="${msg:0:$((MAX_CONTEXT_CHARS - 20))}...\n\n(truncated)"
    fi

    printf "%b" "$msg"
}

# -----------------------------------------------------------------------------
# Main
# -----------------------------------------------------------------------------

main() {
    # Wrap everything in error handling to always output valid JSON
    {
        # Self-guard: Only run for Bash tool
        if ! guard_bash_tool; then
            output_silent_success
            exit 0
        fi

        # Self-guard: Only run if there was an error
        if ! is_error_output; then
            output_silent_success
            exit 0
        fi

        log "Error detected, analyzing for solutions..."

        # Get error content
        local tool_output
        local tool_error
        local error_text

        tool_output=$(get_field '.tool_output // .output // ""')
        tool_error=$(get_field '.tool_error // .error // ""')

        # Combine error sources (prefer explicit error, then output)
        if [[ -n "$tool_error" ]]; then
            error_text="$tool_error"
        else
            error_text="$tool_output"
        fi

        # Truncate for matching (keep first 2000 chars)
        error_text="${error_text:0:2000}"

        if [[ -z "$error_text" ]]; then
            log "No error text found"
            output_silent_success
            exit 0
        fi

        # Match against patterns
        local matched_pattern
        matched_pattern=$(match_error_pattern "$error_text") || {
            log "No matching pattern found"
            output_silent_success
            exit 0
        }

        local pattern_id
        pattern_id=$(echo "$matched_pattern" | jq -r '.id // "unknown"')
        log "Matched pattern: $pattern_id"

        # Check deduplication
        if ! should_suggest "$pattern_id" "$error_text"; then
            log "Skipping duplicate suggestion for pattern: $pattern_id"
            output_silent_success
            exit 0
        fi

        # Build suggestion message
        local suggestion_message
        suggestion_message=$(build_suggestion_message "$matched_pattern" "$error_text")

        if [[ -n "$suggestion_message" ]]; then
            log "Injecting solution suggestion via additionalContext"

            # Output with CC 2.1.9 additionalContext
            jq -n \
                --arg suggestion "$suggestion_message" \
                '{
                    "continue": true,
                    "hookSpecificOutput": {
                        "additionalContext": $suggestion
                    }
                }'
        else
            output_silent_success
        fi
    } || {
        # If anything fails, output silent success to not block
        output_silent_success
    }
}

main "$@"
