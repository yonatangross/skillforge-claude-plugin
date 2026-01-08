#!/bin/bash
set -euo pipefail
# Session Context Loader - Loads session context at session start
# Hook: SessionStart
# CC 2.1.1 Compliant - Context Protocol 2.0

source "$(dirname "$0")/../_lib/common.sh"

log_hook "Session starting - loading context (Protocol 2.0)"

# Context Protocol 2.0 paths
SESSION_STATE="$CLAUDE_PROJECT_DIR/.claude/context/session/state.json"
IDENTITY_FILE="$CLAUDE_PROJECT_DIR/.claude/context/identity.json"
KNOWLEDGE_INDEX="$CLAUDE_PROJECT_DIR/.claude/context/knowledge/index.json"

CONTEXT_LOADED=0

# Load session state
if [[ -f "$SESSION_STATE" ]]; then
  if jq empty "$SESSION_STATE" 2>/dev/null; then
    log_hook "Session state loaded"
    CONTEXT_LOADED=$((CONTEXT_LOADED + 1))
  fi
fi

# Load identity
if [[ -f "$IDENTITY_FILE" ]]; then
  if jq empty "$IDENTITY_FILE" 2>/dev/null; then
    log_hook "Identity loaded"
    CONTEXT_LOADED=$((CONTEXT_LOADED + 1))
  fi
fi

# Check knowledge index
if [[ -f "$KNOWLEDGE_INDEX" ]]; then
  if jq empty "$KNOWLEDGE_INDEX" 2>/dev/null; then
    log_hook "Knowledge index available"
    CONTEXT_LOADED=$((CONTEXT_LOADED + 1))
  fi
fi

# Load current status docs if they exist
STATUS_FILE="$CLAUDE_PROJECT_DIR/docs/CURRENT_STATUS.md"
if [[ -f "$STATUS_FILE" ]]; then
  log_hook "Current status document exists"
fi

# Output CC 2.1.1 compliant response
if [[ $CONTEXT_LOADED -gt 0 ]]; then
  echo '{"systemMessage":"Session context loaded (Protocol 2.0)","continue":true}'
else
  echo '{"continue":true}'
fi
exit 0
