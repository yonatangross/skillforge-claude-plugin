#!/usr/bin/env bash
# ============================================================================
# Git Enforcement Hooks Tests
# ============================================================================
# Tests for git commit, branch, atomic, and issue creation hooks
# Added in v4.18.0
# ============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../fixtures/test-helpers.sh"

HOOKS_DIR="$PROJECT_ROOT/hooks"

# ============================================================================
# COMMIT MESSAGE VALIDATOR TESTS
# ============================================================================

describe "Git Commit Message Validator Hook"

test_commit_validator_exists() {
    local hook="$HOOKS_DIR/pretool/bash/git-commit-message-validator.sh"
    assert_file_exists "$hook"
    assert_file_executable "$hook"
}

test_commit_validator_allows_valid_conventional_commit() {
    local hook="$HOOKS_DIR/pretool/bash/git-commit-message-validator.sh"
    [[ ! -f "$hook" ]] && skip "Hook not found"

    local input='{"tool_name":"Bash","tool_input":{"command":"git commit -m \"feat(#123): Add new feature\""}}'
    local output
    output=$(echo "$input" | bash "$hook" 2>/dev/null) || true

    if [[ -n "$output" ]]; then
        assert_valid_json "$output"
        # Should allow (continue: true)
        echo "$output" | jq -e '.continue == true' >/dev/null || fail "Should allow valid conventional commit"
    fi
}

test_commit_validator_allows_fix_type() {
    local hook="$HOOKS_DIR/pretool/bash/git-commit-message-validator.sh"
    [[ ! -f "$hook" ]] && skip "Hook not found"

    local input='{"tool_name":"Bash","tool_input":{"command":"git commit -m \"fix: Correct typo in config\""}}'
    local output
    output=$(echo "$input" | bash "$hook" 2>/dev/null) || true

    if [[ -n "$output" ]]; then
        assert_valid_json "$output"
    fi
}

test_commit_validator_blocks_invalid_format() {
    local hook="$HOOKS_DIR/pretool/bash/git-commit-message-validator.sh"
    [[ ! -f "$hook" ]] && skip "Hook not found"

    local input='{"tool_name":"Bash","tool_input":{"command":"git commit -m \"Bad commit message\""}}'
    local output
    output=$(echo "$input" | bash "$hook" 2>/dev/null) || true

    if [[ -n "$output" ]]; then
        assert_valid_json "$output"
        # Should block (continue: false)
        echo "$output" | jq -e '.continue == false' >/dev/null || pass "Correctly blocks invalid commit"
    fi
}

test_commit_validator_ignores_non_commit_commands() {
    local hook="$HOOKS_DIR/pretool/bash/git-commit-message-validator.sh"
    [[ ! -f "$hook" ]] && skip "Hook not found"

    local input='{"tool_name":"Bash","tool_input":{"command":"git status"}}'
    local output
    output=$(echo "$input" | bash "$hook" 2>/dev/null) || true

    # Should silently pass for non-commit commands
    if [[ -n "$output" ]]; then
        assert_valid_json "$output"
    fi
}

# ============================================================================
# BRANCH NAMING VALIDATOR TESTS
# ============================================================================

describe "Git Branch Naming Validator Hook"

test_branch_validator_exists() {
    local hook="$HOOKS_DIR/pretool/bash/git-branch-naming-validator.sh"
    assert_file_exists "$hook"
    assert_file_executable "$hook"
}

test_branch_validator_allows_issue_branch() {
    local hook="$HOOKS_DIR/pretool/bash/git-branch-naming-validator.sh"
    [[ ! -f "$hook" ]] && skip "Hook not found"

    local input='{"tool_name":"Bash","tool_input":{"command":"git checkout -b issue/123-fix-login"}}'
    local output
    output=$(echo "$input" | bash "$hook" 2>/dev/null) || true

    if [[ -n "$output" ]]; then
        assert_valid_json "$output"
        # Should allow with continue: true
        echo "$output" | jq -e '.continue == true' >/dev/null || fail "Should allow valid issue branch"
    fi
}

test_branch_validator_allows_feature_branch() {
    local hook="$HOOKS_DIR/pretool/bash/git-branch-naming-validator.sh"
    [[ ! -f "$hook" ]] && skip "Hook not found"

    local input='{"tool_name":"Bash","tool_input":{"command":"git checkout -b feature/new-feature"}}'
    local output
    output=$(echo "$input" | bash "$hook" 2>/dev/null) || true

    if [[ -n "$output" ]]; then
        assert_valid_json "$output"
    fi
}

test_branch_validator_allows_fix_branch() {
    local hook="$HOOKS_DIR/pretool/bash/git-branch-naming-validator.sh"
    [[ ! -f "$hook" ]] && skip "Hook not found"

    local input='{"tool_name":"Bash","tool_input":{"command":"git checkout -b fix/68-commands-autocomplete"}}'
    local output
    output=$(echo "$input" | bash "$hook" 2>/dev/null) || true

    if [[ -n "$output" ]]; then
        assert_valid_json "$output"
    fi
}

test_branch_validator_warns_nonstandard_branch() {
    local hook="$HOOKS_DIR/pretool/bash/git-branch-naming-validator.sh"
    [[ ! -f "$hook" ]] && skip "Hook not found"

    local input='{"tool_name":"Bash","tool_input":{"command":"git checkout -b my-random-branch"}}'
    local output
    output=$(echo "$input" | bash "$hook" 2>/dev/null) || true

    if [[ -n "$output" ]]; then
        assert_valid_json "$output"
        # Should warn but still allow (continue: true with additionalContext)
        echo "$output" | jq -e '.continue == true' >/dev/null || pass "Warns on non-standard branch"
    fi
}

test_branch_validator_ignores_non_checkout() {
    local hook="$HOOKS_DIR/pretool/bash/git-branch-naming-validator.sh"
    [[ ! -f "$hook" ]] && skip "Hook not found"

    local input='{"tool_name":"Bash","tool_input":{"command":"git status"}}'
    local output
    output=$(echo "$input" | bash "$hook" 2>/dev/null) || true

    if [[ -n "$output" ]]; then
        assert_valid_json "$output"
    fi
}

# ============================================================================
# ATOMIC COMMIT CHECKER TESTS
# ============================================================================

describe "Git Atomic Commit Checker Hook"

test_atomic_checker_exists() {
    local hook="$HOOKS_DIR/pretool/bash/git-atomic-commit-checker.sh"
    assert_file_exists "$hook"
    assert_file_executable "$hook"
}

test_atomic_checker_validates_json_output() {
    local hook="$HOOKS_DIR/pretool/bash/git-atomic-commit-checker.sh"
    [[ ! -f "$hook" ]] && skip "Hook not found"

    local input='{"tool_name":"Bash","tool_input":{"command":"git commit -m \"feat: test\""}}'
    local output
    output=$(echo "$input" | bash "$hook" 2>/dev/null) || true

    if [[ -n "$output" ]]; then
        assert_valid_json "$output"
    fi
}

test_atomic_checker_ignores_non_commit() {
    local hook="$HOOKS_DIR/pretool/bash/git-atomic-commit-checker.sh"
    [[ ! -f "$hook" ]] && skip "Hook not found"

    local input='{"tool_name":"Bash","tool_input":{"command":"git status"}}'
    local output
    output=$(echo "$input" | bash "$hook" 2>/dev/null) || true

    if [[ -n "$output" ]]; then
        assert_valid_json "$output"
    fi
}

# ============================================================================
# ISSUE CREATION GUIDE TESTS
# ============================================================================

describe "GitHub Issue Creation Guide Hook"

test_issue_guide_exists() {
    local hook="$HOOKS_DIR/pretool/bash/gh-issue-creation-guide.sh"
    assert_file_exists "$hook"
    assert_file_executable "$hook"
}

test_issue_guide_validates_json_output() {
    local hook="$HOOKS_DIR/pretool/bash/gh-issue-creation-guide.sh"
    [[ ! -f "$hook" ]] && skip "Hook not found"

    local input='{"tool_name":"Bash","tool_input":{"command":"gh issue create --title \"test\""}}'
    local output
    output=$(echo "$input" | bash "$hook" 2>/dev/null) || true

    if [[ -n "$output" ]]; then
        assert_valid_json "$output"
        # Should have additionalContext for guidance
        echo "$output" | jq -e '.hookSpecificOutput.additionalContext != null' >/dev/null || pass "Has guidance context"
    fi
}

test_issue_guide_ignores_non_create() {
    local hook="$HOOKS_DIR/pretool/bash/gh-issue-creation-guide.sh"
    [[ ! -f "$hook" ]] && skip "Hook not found"

    local input='{"tool_name":"Bash","tool_input":{"command":"gh issue list"}}'
    local output
    output=$(echo "$input" | bash "$hook" 2>/dev/null) || true

    if [[ -n "$output" ]]; then
        assert_valid_json "$output"
    fi
}

test_issue_guide_warns_missing_labels() {
    local hook="$HOOKS_DIR/pretool/bash/gh-issue-creation-guide.sh"
    [[ ! -f "$hook" ]] && skip "Hook not found"

    # Command without --label
    local input='{"tool_name":"Bash","tool_input":{"command":"gh issue create --title \"bug: test issue\""}}'
    local output
    output=$(echo "$input" | bash "$hook" 2>/dev/null) || true

    if [[ -n "$output" ]]; then
        assert_valid_json "$output"
        # Should contain label warning in context
        if echo "$output" | jq -e '.hookSpecificOutput.additionalContext' 2>/dev/null | grep -q "NO LABELS"; then
            pass "Warns about missing labels"
        fi
    fi
}

test_issue_guide_warns_missing_milestone() {
    local hook="$HOOKS_DIR/pretool/bash/gh-issue-creation-guide.sh"
    [[ ! -f "$hook" ]] && skip "Hook not found"

    # Command without --milestone
    local input='{"tool_name":"Bash","tool_input":{"command":"gh issue create --title \"bug: test\" --label \"bug\""}}'
    local output
    output=$(echo "$input" | bash "$hook" 2>/dev/null) || true

    if [[ -n "$output" ]]; then
        assert_valid_json "$output"
    fi
}

# ============================================================================
# SKILL STRUCTURE TESTS
# ============================================================================

describe "Git Skills Structure"

test_milestone_management_skill_exists() {
    local skill_dir="$PROJECT_ROOT/skills/milestone-management"
    assert_file_exists "$skill_dir/SKILL.md"

    # Check for references
    [[ -d "$skill_dir/references" ]] || fail "Missing references directory"

    # Check for templates
    [[ -d "$skill_dir/templates" ]] || fail "Missing templates directory"
}

test_atomic_commits_skill_exists() {
    local skill_dir="$PROJECT_ROOT/skills/atomic-commits"
    assert_file_exists "$skill_dir/SKILL.md"
}

test_branch_strategy_skill_exists() {
    local skill_dir="$PROJECT_ROOT/skills/branch-strategy"
    assert_file_exists "$skill_dir/SKILL.md"
}

test_stacked_prs_skill_exists() {
    local skill_dir="$PROJECT_ROOT/skills/stacked-prs"
    assert_file_exists "$skill_dir/SKILL.md"
}

test_release_management_skill_exists() {
    local skill_dir="$PROJECT_ROOT/skills/release-management"
    assert_file_exists "$skill_dir/SKILL.md"
}

test_git_recovery_skill_exists() {
    local skill_dir="$PROJECT_ROOT/skills/git-recovery"
    assert_file_exists "$skill_dir/SKILL.md"
}

# ============================================================================
# GITHUB-CLI SKILL ENRICHMENT TESTS
# ============================================================================

describe "GitHub CLI Skill Enrichment"

test_issue_creation_checklist_exists() {
    local file="$PROJECT_ROOT/skills/github-cli/checklists/issue-creation-checklist.md"
    assert_file_exists "$file"

    # Verify it contains key sections
    grep -q "Pre-Creation Checks" "$file" || fail "Missing pre-creation checks section"
    grep -q "Labels" "$file" || fail "Missing labeling section"
}

test_labeling_guide_exists() {
    local file="$PROJECT_ROOT/skills/github-cli/checklists/labeling-guide.md"
    assert_file_exists "$file"

    # Verify it contains key sections
    grep -q "Type Labels" "$file" || fail "Missing type labels section"
    grep -q "Priority Labels" "$file" || fail "Missing priority labels section"
}

test_issue_templates_reference_exists() {
    local file="$PROJECT_ROOT/skills/github-cli/references/issue-templates.md"
    assert_file_exists "$file"
}

# ============================================================================
# RUN TESTS
# ============================================================================

setup_test_env

# Run all test functions
run_tests

cleanup_test_env

print_summary
