#!/bin/bash
set -euo pipefail
# Changelog Generator Hook
# Injects auto-generated changelog before gh release create commands
# CC 2.1.9: Uses additionalContext to provide suggested changelog

INPUT=$(cat)
export _HOOK_INPUT="$INPUT"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/../../_lib/common.sh"

COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // ""')

# Only process gh release create commands
if [[ ! "$COMMAND" =~ ^gh\ release\ create ]]; then
  output_silent_success
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-$(pwd)}"

# Get the last tag
LAST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")

# Get commits since last tag (or all commits if no tags exist)
if [[ -n "$LAST_TAG" ]]; then
  COMMITS=$(git log "${LAST_TAG}..HEAD" --pretty=format:"%s" 2>/dev/null || echo "")
  TAG_INFO="Since tag: $LAST_TAG"
else
  COMMITS=$(git log --pretty=format:"%s" -n 50 2>/dev/null || echo "")
  TAG_INFO="No previous tags found (showing last 50 commits)"
fi

# If no commits found, provide minimal context
if [[ -z "$COMMITS" ]]; then
  CONTEXT="No commits found since last tag. Consider:
- Verifying you have commits to release
- Checking if the tag reference is correct"

  log_permission_feedback "allow" "gh release create - no commits found"
  output_allow_with_context "$CONTEXT"
  exit 0
fi

# Group commits by conventional commit type
declare -A COMMIT_GROUPS
COMMIT_GROUPS["feat"]=""
COMMIT_GROUPS["fix"]=""
COMMIT_GROUPS["docs"]=""
COMMIT_GROUPS["refactor"]=""
COMMIT_GROUPS["test"]=""
COMMIT_GROUPS["chore"]=""
COMMIT_GROUPS["style"]=""
COMMIT_GROUPS["perf"]=""
COMMIT_GROUPS["ci"]=""
COMMIT_GROUPS["build"]=""
COMMIT_GROUPS["other"]=""

while IFS= read -r commit; do
  [[ -z "$commit" ]] && continue

  # Extract type from conventional commit format
  # Pattern stored in variable to avoid bash regex parsing issues
  CONV_COMMIT_PATTERN='^(feat|fix|docs|refactor|test|chore|style|perf|ci|build)(\([^)]+\))?:[[:space:]]+(.+)'
  if [[ "$commit" =~ $CONV_COMMIT_PATTERN ]]; then
    type="${BASH_REMATCH[1]}"
    COMMIT_GROUPS["$type"]+="- $commit"$'\n'
  else
    # Non-conventional commits go to "other"
    COMMIT_GROUPS["other"]+="- $commit"$'\n'
  fi
done <<< "$COMMITS"

# Build the suggested changelog
CHANGELOG="## Suggested Changelog

$TAG_INFO

"

# Map types to human-readable headers
declare -A TYPE_HEADERS
TYPE_HEADERS["feat"]="Features"
TYPE_HEADERS["fix"]="Bug Fixes"
TYPE_HEADERS["docs"]="Documentation"
TYPE_HEADERS["refactor"]="Refactoring"
TYPE_HEADERS["test"]="Tests"
TYPE_HEADERS["chore"]="Chores"
TYPE_HEADERS["style"]="Style"
TYPE_HEADERS["perf"]="Performance"
TYPE_HEADERS["ci"]="CI/CD"
TYPE_HEADERS["build"]="Build"
TYPE_HEADERS["other"]="Other Changes"

# Order for display
DISPLAY_ORDER=("feat" "fix" "perf" "refactor" "docs" "test" "ci" "build" "chore" "style" "other")

for type in "${DISPLAY_ORDER[@]}"; do
  commits="${COMMIT_GROUPS[$type]}"
  if [[ -n "$commits" ]]; then
    header="${TYPE_HEADERS[$type]}"
    CHANGELOG+="### $header
$commits
"
  fi
done

# Add usage hint
CHANGELOG+="---
USAGE: Copy relevant sections to your release notes.
Consider highlighting breaking changes (BREAKING CHANGE:) prominently.
"

# Count total commits for logging
COMMIT_COUNT=$(echo "$COMMITS" | wc -l | tr -d ' ')

log_permission_feedback "allow" "gh release create with changelog ($COMMIT_COUNT commits)"
output_allow_with_context "$CHANGELOG"
exit 0
