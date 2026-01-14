#!/usr/bin/env bash
# Test: Validates agents have all required Stop hooks
# All agents must have output-validator, context-publisher, and handoff-preparer

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
AGENTS_DIR="$REPO_ROOT/agents"

REQUIRED_HOOKS=(
  "output-validator.sh"
  "context-publisher.sh"
  "handoff-preparer.sh"
)

FAILED=0

echo "=== Agent Required Hooks Test ==="
echo ""

for agent_file in "$AGENTS_DIR"/*.md; do
  agent_name=$(basename "$agent_file" .md)
  agent_failed=0

  for hook in "${REQUIRED_HOOKS[@]}"; do
    if ! grep -q "$hook" "$agent_file"; then
      echo "FAIL: $agent_name missing required hook: $hook"
      agent_failed=1
      FAILED=1
    fi
  done

  if [[ $agent_failed -eq 0 ]]; then
    echo "PASS: $agent_name has all required hooks"
  fi
done

echo ""

if [[ $FAILED -eq 1 ]]; then
  echo "❌ Agent required hooks test FAILED"
  exit 1
else
  echo "✅ All agents have required hooks"
  exit 0
fi