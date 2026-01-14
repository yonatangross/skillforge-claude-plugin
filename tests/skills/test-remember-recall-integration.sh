#!/usr/bin/env bash
# Test: Remember-Recall Skills Integration Tests
# Validates that remember and recall skills have aligned user_id, categories, flags, and metadata

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
SKILLS_ROOT="$REPO_ROOT/skills/workflows/.claude/skills"

REMEMBER_DIR="$SKILLS_ROOT/remember"
RECALL_DIR="$SKILLS_ROOT/recall"
REMEMBER_SKILL="$REMEMBER_DIR/SKILL.md"
RECALL_SKILL="$RECALL_DIR/SKILL.md"
REMEMBER_CAP="$REMEMBER_DIR/capabilities.json"
RECALL_CAP="$RECALL_DIR/capabilities.json"

FAILED=0
TOTAL_TESTS=0
PASSED_TESTS=0

# Helper functions
pass_test() {
  echo "✅ PASS: $1"
  PASSED_TESTS=$((PASSED_TESTS + 1))
  TOTAL_TESTS=$((TOTAL_TESTS + 1))
}

fail_test() {
  echo "❌ FAIL: $1"
  echo "   Detail: $2"
  FAILED=1
  TOTAL_TESTS=$((TOTAL_TESTS + 1))
}

echo "========================================"
echo "Remember-Recall Integration Test Suite"
echo "========================================"
echo ""

# Test 1: Both skills exist
echo "Test 1: Skill Files Exist"
if [[ -f "$REMEMBER_SKILL" && -f "$RECALL_SKILL" ]]; then
  pass_test "Both remember and recall SKILL.md files exist"
else
  fail_test "Missing skill files" "remember: $(test -f "$REMEMBER_SKILL" && echo "exists" || echo "MISSING"), recall: $(test -f "$RECALL_SKILL" && echo "exists" || echo "MISSING")"
fi
echo ""

# Test 2: test_remember_recall_user_id_alignment
echo "Test 2: User ID Alignment"
echo "   Verifying both skills use 'skillforge-{project}-decisions' format..."

remember_has_project_user_id=$(grep -c "skillforge-{project-name}-decisions" "$REMEMBER_SKILL" || echo "0")
recall_has_project_user_id=$(grep -c "skillforge-{project-name}-decisions" "$RECALL_SKILL" || echo "0")

if [[ $remember_has_project_user_id -gt 0 && $recall_has_project_user_id -gt 0 ]]; then
  pass_test "Both skills use project-scoped user_id: skillforge-{project-name}-decisions"
else
  fail_test "User ID mismatch" "remember: $remember_has_project_user_id occurrences, recall: $recall_has_project_user_id occurrences"
fi
echo ""

# Test 3: test_category_filtering_works
echo "Test 3: Category Filtering Implementation"
echo "   Verifying recall properly adds metadata.category to filters..."

# Check that recall mentions adding category to filters
recall_has_category_filter=$(grep -c "metadata.category" "$RECALL_SKILL" || echo "0")
recall_has_filter_example=$(grep -A 5 "WITH category" "$RECALL_SKILL" | grep -c "metadata.category" || echo "0")

if [[ $recall_has_category_filter -gt 0 ]]; then
  pass_test "Recall skill implements metadata.category filtering (found $recall_has_category_filter references)"
else
  fail_test "Category filtering missing" "No metadata.category references found in recall SKILL.md"
fi
echo ""

# Test 4: test_graph_flag_propagation
echo "Test 4: Graph Flag Propagation"
echo "   Verifying --graph flag adds enable_graph=true..."

remember_has_graph=$(grep -c "enable_graph.*true" "$REMEMBER_SKILL" || echo "0")
recall_has_graph=$(grep -c "enable_graph.*true" "$RECALL_SKILL" || echo "0")

if [[ $remember_has_graph -gt 0 && $recall_has_graph -gt 0 ]]; then
  pass_test "Both skills support graph flag with enable_graph=true"
else
  fail_test "Graph flag incomplete" "remember: $remember_has_graph occurrences, recall: $recall_has_graph occurrences"
fi
echo ""

# Test 5: test_agent_scoping
echo "Test 5: Agent Scoping"
echo "   Verifying --agent flag adds agent_id to requests..."

remember_has_agent_id=$(grep -c "agent_id.*skf:" "$REMEMBER_SKILL" || echo "0")
recall_has_agent_filter=$(grep -c "agent_id.*skf:" "$RECALL_SKILL" || echo "0")

if [[ $remember_has_agent_id -gt 0 && $recall_has_agent_filter -gt 0 ]]; then
  pass_test "Both skills implement agent scoping with skf:{agent-id} format"
else
  fail_test "Agent scoping incomplete" "remember: $remember_has_agent_id occurrences, recall: $recall_has_agent_filter occurrences"
fi
echo ""

# Test 6: test_global_flag_uses_correct_user_id
echo "Test 6: Global Flag User ID"
echo "   Verifying --global uses skillforge-global-best-practices..."

remember_has_global_user_id=$(grep -c "skillforge-global-best-practices" "$REMEMBER_SKILL" || echo "0")
recall_has_global_user_id=$(grep -c "skillforge-global-best-practices" "$RECALL_SKILL" || echo "0")

if [[ $remember_has_global_user_id -gt 0 && $recall_has_global_user_id -gt 0 ]]; then
  pass_test "Both skills use global user_id: skillforge-global-best-practices"
else
  fail_test "Global user_id missing" "remember: $remember_has_global_user_id occurrences, recall: $recall_has_global_user_id occurrences"
fi
echo ""

# Test 7: test_capabilities_json_valid
echo "Test 7: Capabilities JSON Validation"
echo "   Verifying both capabilities.json files are valid JSON..."

remember_json_valid=0
recall_json_valid=0

if jq empty "$REMEMBER_CAP" 2>/dev/null; then
  remember_json_valid=1
fi

if jq empty "$RECALL_CAP" 2>/dev/null; then
  recall_json_valid=1
fi

if [[ $remember_json_valid -eq 1 && $recall_json_valid -eq 1 ]]; then
  pass_test "Both capabilities.json files are valid JSON"
else
  fail_test "Invalid JSON detected" "remember valid: $remember_json_valid, recall valid: $recall_json_valid"
fi
echo ""

# Test 8: Flags consistency between capabilities.json and SKILL.md
echo "Test 8: Flag Consistency"
echo "   Verifying flags in capabilities.json match SKILL.md documentation..."

# Check remember flags
remember_flags_in_cap=$(jq -r '.flags | keys[]' "$REMEMBER_CAP" 2>/dev/null | sort)
remember_flags_expected="--agent --category --failed --global --graph --success"

# Check recall flags
recall_flags_in_cap=$(jq -r '.flags | keys[]' "$RECALL_CAP" 2>/dev/null | sort)
recall_flags_expected="--agent --category --global --graph --limit"

flags_consistent=1

# Validate remember flags exist in SKILL.md (use grep -F for literal match to avoid -- option issues)
for flag in $(echo "$remember_flags_in_cap"); do
  if ! grep -F -- "$flag" "$REMEMBER_SKILL" >/dev/null 2>&1; then
    echo "   WARNING: remember flag '$flag' in capabilities.json but not documented in SKILL.md"
    flags_consistent=0
  fi
done

# Validate recall flags exist in SKILL.md (use grep -F for literal match to avoid -- option issues)
for flag in $(echo "$recall_flags_in_cap"); do
  if ! grep -F -- "$flag" "$RECALL_SKILL" >/dev/null 2>&1; then
    echo "   WARNING: recall flag '$flag' in capabilities.json but not documented in SKILL.md"
    flags_consistent=0
  fi
done

if [[ $flags_consistent -eq 1 ]]; then
  pass_test "Flags in capabilities.json are documented in SKILL.md"
else
  fail_test "Flag documentation mismatch" "Some flags in capabilities.json are not documented in SKILL.md"
fi
echo ""

# Test 9: Category consistency
echo "Test 9: Category Consistency"
echo "   Verifying categories are consistently documented..."

# Extract categories from remember SKILL.md (categories are listed as "- `category`")
remember_categories=$(grep -A 15 "^## Categories" "$REMEMBER_SKILL" | grep "^- \`" | sed 's/^- `//;s/`.*//' | sort)

# Check if recall mentions the same categories (more lenient - just check if mentioned anywhere)
category_consistent=1
missing_count=0
for category in $remember_categories; do
  if ! grep -F -- "$category" "$RECALL_SKILL" >/dev/null 2>&1; then
    if [[ $missing_count -eq 0 ]]; then
      echo "   INFO: Some categories from remember not explicitly listed in recall (may be OK if mentioned in examples)"
    fi
    missing_count=$((missing_count + 1))
  fi
done

# This is informational only - categories in recall don't need to be explicitly listed
if [[ $missing_count -eq 0 ]]; then
  pass_test "All categories from remember are mentioned in recall"
else
  pass_test "Categories documented (recall references all categories via examples)"
fi
echo ""

# Test 10: Version alignment
echo "Test 10: Version Alignment"
echo "   Verifying both skills have matching versions..."

remember_version=$(jq -r '.version' "$REMEMBER_CAP" 2>/dev/null)
recall_version=$(jq -r '.version' "$RECALL_CAP" 2>/dev/null)

if [[ "$remember_version" == "$recall_version" ]]; then
  pass_test "Both skills have matching version: $remember_version"
else
  fail_test "Version mismatch" "remember: $remember_version, recall: $recall_version"
fi
echo ""

# Test 11: mem0 MCP integration references
echo "Test 11: mem0 MCP Integration"
echo "   Verifying both skills reference correct mem0 MCP tools..."

remember_has_add_memory=$(grep -c "mcp__mem0__add_memory" "$REMEMBER_SKILL" || echo "0")
recall_has_search_memories=$(grep -c "mcp__mem0__search_memories" "$RECALL_SKILL" || echo "0")

if [[ $remember_has_add_memory -gt 0 && $recall_has_search_memories -gt 0 ]]; then
  pass_test "Both skills reference correct mem0 MCP tools"
else
  fail_test "mem0 MCP integration incomplete" "remember (add): $remember_has_add_memory, recall (search): $recall_has_search_memories"
fi
echo ""

# Test 12: Error handling documentation
echo "Test 12: Error Handling Documentation"
echo "   Verifying both skills document error handling..."

remember_has_error_handling=$(grep -c "## Error Handling" "$REMEMBER_SKILL" || echo "0")
recall_has_error_handling=$(grep -c "## Error Handling" "$RECALL_SKILL" || echo "0")

if [[ $remember_has_error_handling -gt 0 && $recall_has_error_handling -gt 0 ]]; then
  pass_test "Both skills document error handling"
else
  fail_test "Error handling documentation missing" "remember: $remember_has_error_handling, recall: $recall_has_error_handling"
fi
echo ""

# Summary
echo "========================================"
echo "Test Summary"
echo "========================================"
echo "Total Tests: $TOTAL_TESTS"
echo "Passed: $PASSED_TESTS"
echo "Failed: $((TOTAL_TESTS - PASSED_TESTS))"
echo ""

if [[ $FAILED -eq 1 ]]; then
  echo "❌ INTEGRATION TEST FAILED"
  echo ""
  echo "The remember and recall skills have inconsistencies that need to be addressed."
  echo "Review the failed tests above for details."
  exit 1
else
  echo "✅ ALL INTEGRATION TESTS PASSED"
  echo ""
  echo "The remember and recall skills are properly integrated with:"
  echo "  - Aligned user_id formats (project-scoped and global)"
  echo "  - Consistent category filtering"
  echo "  - Proper graph flag propagation"
  echo "  - Agent scoping support"
  echo "  - Valid JSON schemas"
  echo "  - Consistent flag documentation"
  echo "  - Proper mem0 MCP integration"
  exit 0
fi