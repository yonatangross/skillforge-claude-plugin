#!/bin/bash
set -euo pipefail
# Git Branch Naming Validator Hook
# Enforces branch naming: issue/<num>-<desc>, feature/<desc>, fix/<desc>, hotfix/<desc>
# CC 2.1.9: Injects guidance via additionalContext

INPUT=$(cat)
export _HOOK_INPUT="$INPUT"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/../../_lib/common.sh"

COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // ""')

# Only process git checkout -b or git switch -c (branch creation)
if [[ ! "$COMMAND" =~ git\ (checkout\ -b|switch\ -c|branch)[[:space:]] ]]; then
  output_silent_success
  exit 0
fi

# Extract branch name
BRANCH_NAME=""
if [[ "$COMMAND" =~ (checkout\ -b|switch\ -c|branch)[[:space:]]+([^[:space:]]+) ]]; then
  BRANCH_NAME="${BASH_REMATCH[2]}"
fi

# No branch name found
if [[ -z "$BRANCH_NAME" ]]; then
  output_silent_success
  exit 0
fi

# Skip if checking out existing branch (not creating)
if [[ "$COMMAND" =~ ^git\ checkout[[:space:]]+[^-] ]] && [[ ! "$COMMAND" =~ -b ]]; then
  output_silent_success
  exit 0
fi

# Valid branch patterns
# issue/123-description
# feature/description
# fix/description
# hotfix/description
# chore/description
# docs/description
# refactor/description
# test/description

VALID_PATTERNS=(
  "^issue/[0-9]+-[a-z0-9-]+$"
  "^feature/[a-z0-9-]+$"
  "^fix/[a-z0-9-]+$"
  "^hotfix/[a-z0-9-]+$"
  "^chore/[a-z0-9-]+$"
  "^docs/[a-z0-9-]+$"
  "^refactor/[a-z0-9-]+$"
  "^test/[a-z0-9-]+$"
  "^release/v?[0-9]+\.[0-9]+\.[0-9]+.*$"
)

# Check if branch matches any valid pattern
for pattern in "${VALID_PATTERNS[@]}"; do
  if [[ "$BRANCH_NAME" =~ $pattern ]]; then
    log_permission_feedback "allow" "Valid branch name: $BRANCH_NAME"
    output_silent_success
    exit 0
  fi
done

# Protected branch check
if [[ "$BRANCH_NAME" == "main" || "$BRANCH_NAME" == "master" || "$BRANCH_NAME" == "dev" || "$BRANCH_NAME" == "develop" ]]; then
  ERROR_MSG="Cannot create branch '$BRANCH_NAME' - this is a protected branch name.

Use a feature branch instead:
  git checkout -b issue/<number>-<description>
  git checkout -b feature/<description>
  git checkout -b fix/<description>"

  log_permission_feedback "deny" "Attempted to create protected branch: $BRANCH_NAME"
  jq -n --arg msg "$ERROR_MSG" '{
    systemMessage: $msg,
    continue: false,
    hookSpecificOutput: {
      permissionDecision: "deny",
      permissionDecisionReason: "Protected branch name"
    }
  }'
  exit 0
fi

# Invalid format - provide guidance but allow (soft enforcement)
GUIDANCE="Branch naming suggestion for '$BRANCH_NAME':

Recommended formats:
  issue/<number>-<description>  - For GitHub issues (preferred)
  feature/<description>         - For features without issues
  fix/<description>             - For bug fixes
  hotfix/<description>          - For urgent production fixes
  chore/<description>           - For maintenance tasks
  docs/<description>            - For documentation
  release/v1.2.3                - For release branches

Examples:
  issue/123-add-user-auth
  feature/dark-mode
  fix/login-redirect
  hotfix/security-patch

Consider renaming to follow conventions for better tracking."

log_permission_feedback "allow" "Non-standard branch name (warning): $BRANCH_NAME"
output_allow_with_context "$GUIDANCE"
exit 0
