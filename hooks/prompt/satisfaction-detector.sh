#!/bin/bash
set -euo pipefail
# Satisfaction Detector - UserPromptSubmit Hook
# CC 2.1.6 Compliant: includes continue field in all outputs
# Detects user satisfaction signals from conversation patterns
#
# Strategy:
# - Analyze user prompt for positive/negative signals
# - Track satisfaction per session
# - Log to feedback system for reporting
#
# Version: 1.0.0
# Part of Feedback System (#57)

# Read stdin BEFORE sourcing common.sh to avoid subshell issues
_HOOK_INPUT=$(cat)
export _HOOK_INPUT

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../_lib/common.sh" 2>/dev/null || true

# Source feedback library
FEEDBACK_LIB="${CLAUDE_PROJECT_DIR:-.}/.claude/scripts/feedback-lib.sh"
if [[ -f "$FEEDBACK_LIB" ]]; then
    source "$FEEDBACK_LIB"
else
    # Fallback: check plugin root
    PLUGIN_FEEDBACK_LIB="${CLAUDE_PLUGIN_ROOT:-}/.claude/scripts/feedback-lib.sh"
    if [[ -f "$PLUGIN_FEEDBACK_LIB" ]]; then
        source "$PLUGIN_FEEDBACK_LIB"
    else
        # feedback-lib not available - silent pass
        echo '{"continue": true}'
        exit 0
    fi
fi

log_hook "Satisfaction detector hook starting" 2>/dev/null || true

# -----------------------------------------------------------------------------
# Configuration
# -----------------------------------------------------------------------------

# Minimum prompt length to analyze (skip very short messages)
MIN_PROMPT_LENGTH=2

# Session ID for tracking
SESSION_ID="${CLAUDE_SESSION_ID:-unknown-session}"

# -----------------------------------------------------------------------------
# Extract User Prompt
# -----------------------------------------------------------------------------

USER_PROMPT=""
if [[ -n "$_HOOK_INPUT" ]]; then
    USER_PROMPT=$(echo "$_HOOK_INPUT" | jq -r '.prompt // ""' 2>/dev/null || echo "")
fi

# Skip empty prompts
if [[ -z "$USER_PROMPT" ]]; then
    echo '{"continue": true}'
    exit 0
fi

# Skip very short prompts (likely commands)
if [[ ${#USER_PROMPT} -lt $MIN_PROMPT_LENGTH ]]; then
    echo '{"continue": true}'
    exit 0
fi

# Skip prompts that look like commands (start with /)
if [[ "$USER_PROMPT" == /* ]]; then
    echo '{"continue": true}'
    exit 0
fi

# -----------------------------------------------------------------------------
# Detect Satisfaction
# -----------------------------------------------------------------------------

# Run detection
SENTIMENT=$(detect_satisfaction "$USER_PROMPT")

# Only log non-neutral signals to avoid noise
if [[ "$SENTIMENT" != "neutral" ]]; then
    # Extract first 50 chars of prompt as context (truncate)
    CONTEXT="${USER_PROMPT:0:50}"
    if [[ ${#USER_PROMPT} -gt 50 ]]; then
        CONTEXT="${CONTEXT}..."
    fi

    # Log the satisfaction signal
    log_satisfaction "$SESSION_ID" "$SENTIMENT" "$CONTEXT"

    log_hook "Detected $SENTIMENT satisfaction signal" 2>/dev/null || true
fi

# Output CC 2.1.6 compliant JSON (silent success)
echo '{"continue": true}'
exit 0