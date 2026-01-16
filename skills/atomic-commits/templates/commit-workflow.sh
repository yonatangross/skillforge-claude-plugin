#!/bin/bash
# Atomic Commit Workflow Scripts
# Helpers for creating focused, atomic commits

set -euo pipefail

# =============================================================================
# INTERACTIVE STAGING HELPERS
# =============================================================================

# Stage changes interactively with preview
stage_interactive() {
  echo "=== Unstaged Changes ==="
  git diff --stat
  echo ""
  echo "Starting interactive staging (git add -p)..."
  echo "Commands: y=stage, n=skip, s=split, e=edit, q=quit"
  echo ""
  git add -p
}

# Stage only specific file types
stage_by_type() {
  local type="$1"

  case "$type" in
    python|py)
      git add -p -- '*.py'
      ;;
    typescript|ts)
      git add -p -- '*.ts' '*.tsx'
      ;;
    javascript|js)
      git add -p -- '*.js' '*.jsx'
      ;;
    styles|css)
      git add -p -- '*.css' '*.scss' '*.less'
      ;;
    tests)
      git add -p -- '*test*' '*spec*' '*Test*'
      ;;
    docs)
      git add -p -- '*.md' '*.rst' '*.txt'
      ;;
    *)
      echo "Unknown type: $type"
      echo "Available: python, typescript, javascript, styles, tests, docs"
      return 1
      ;;
  esac
}

# =============================================================================
# COMMIT SIZE ANALYSIS
# =============================================================================

# Analyze staged changes before commit
analyze_staged() {
  echo "=== Staged Changes Analysis ==="
  echo ""

  # File count
  local file_count
  file_count=$(git diff --cached --name-only | wc -l | tr -d ' ')
  echo "Files staged: $file_count"

  # Line stats
  local stats
  stats=$(git diff --cached --shortstat)
  echo "Changes: $stats"

  # Extract numbers
  local insertions=0 deletions=0
  if [[ "$stats" =~ ([0-9]+)\ insertion ]]; then
    insertions="${BASH_REMATCH[1]}"
  fi
  if [[ "$stats" =~ ([0-9]+)\ deletion ]]; then
    deletions="${BASH_REMATCH[1]}"
  fi
  local total=$((insertions + deletions))

  echo ""

  # Warnings
  if [[ $file_count -gt 10 ]]; then
    echo "⚠️  WARNING: Many files ($file_count). Consider splitting commit."
  fi
  if [[ $total -gt 400 ]]; then
    echo "⚠️  WARNING: Large change ($total lines). Consider splitting commit."
  fi

  # File list
  echo ""
  echo "=== Files to be committed ==="
  git diff --cached --name-status

  # Check for mixed concerns
  echo ""
  echo "=== Quick Review ==="

  local has_tests=false has_impl=false has_style=false has_docs=false
  while IFS= read -r file; do
    case "$file" in
      *test*|*spec*|*Test*) has_tests=true ;;
      *.md|*.rst|*.txt) has_docs=true ;;
      *.css|*.scss) has_style=true ;;
      *) has_impl=true ;;
    esac
  done < <(git diff --cached --name-only)

  local concerns=0
  [[ "$has_impl" == "true" ]] && ((concerns++)) && echo "- Implementation changes"
  [[ "$has_tests" == "true" ]] && ((concerns++)) && echo "- Test changes"
  [[ "$has_style" == "true" ]] && ((concerns++)) && echo "- Style changes"
  [[ "$has_docs" == "true" ]] && ((concerns++)) && echo "- Documentation changes"

  if [[ $concerns -gt 1 ]]; then
    echo ""
    echo "⚠️  Multiple concerns detected. Consider separate commits for:"
    [[ "$has_impl" == "true" ]] && echo "   - feat/fix: Implementation"
    [[ "$has_tests" == "true" ]] && echo "   - test: Tests"
    [[ "$has_style" == "true" ]] && echo "   - style: Styling"
    [[ "$has_docs" == "true" ]] && echo "   - docs: Documentation"
  fi
}

# =============================================================================
# COMMIT MESSAGE HELPERS
# =============================================================================

# Generate commit message from staged diff (requires description)
suggest_commit_type() {
  local files
  files=$(git diff --cached --name-only)

  local type="feat"

  # Detect type from files
  if echo "$files" | grep -qE '(test|spec|Test)'; then
    type="test"
  elif echo "$files" | grep -qE '\.(md|rst|txt)$'; then
    type="docs"
  elif echo "$files" | grep -qE '\.(css|scss|less)$'; then
    type="style"
  elif echo "$files" | grep -qE '(package|pyproject|Cargo|go\.mod)'; then
    type="chore"
  fi

  echo "$type"
}

# Validate commit message format
validate_commit_message() {
  local msg="$1"
  local valid_types="feat|fix|refactor|docs|test|chore|style|perf|ci|build"

  # Check format
  if [[ ! "$msg" =~ ^($valid_types)(\([^)]+\))?: ]]; then
    echo "❌ Invalid format. Expected: type(scope): description"
    echo ""
    echo "Valid types: $valid_types"
    echo "Examples:"
    echo "  feat(#123): Add user authentication"
    echo "  fix: Resolve login redirect loop"
    echo "  refactor(auth): Extract validation helpers"
    return 1
  fi

  # Check title length
  local title="${msg%%$'\n'*}"
  if [[ ${#title} -gt 72 ]]; then
    echo "⚠️  Title too long (${#title} chars). Recommended: <72"
  fi

  echo "✅ Valid commit message format"
  return 0
}

# =============================================================================
# COMMIT WORKFLOW
# =============================================================================

# Full atomic commit workflow
atomic_commit() {
  echo "=== Atomic Commit Workflow ==="
  echo ""

  # Step 1: Analyze
  analyze_staged

  echo ""
  read -p "Continue with commit? (y/N) " confirm
  if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
    echo "Commit cancelled. Use 'git add -p' to adjust staging."
    return 0
  fi

  # Step 2: Suggest type
  local suggested_type
  suggested_type=$(suggest_commit_type)
  echo ""
  echo "Suggested type: $suggested_type"

  # Step 3: Get message
  read -p "Commit type [$suggested_type]: " type
  type="${type:-$suggested_type}"

  read -p "Issue number (or empty): " issue
  read -p "Description: " desc

  local msg
  if [[ -n "$issue" ]]; then
    msg="${type}(#${issue}): ${desc}"
  else
    msg="${type}: ${desc}"
  fi

  # Step 4: Validate
  if ! validate_commit_message "$msg"; then
    return 1
  fi

  # Step 5: Commit
  echo ""
  echo "Committing: $msg"
  git commit -m "$msg

Co-Authored-By: Claude <noreply@anthropic.com>"

  echo ""
  echo "✅ Commit created successfully"
  git log -1 --oneline
}

# =============================================================================
# SPLITTING COMMITS
# =============================================================================

# Split last commit into multiple
split_last_commit() {
  echo "=== Splitting Last Commit ==="
  echo ""
  echo "This will:"
  echo "1. Undo the last commit (keeping changes)"
  echo "2. Let you re-stage and commit in parts"
  echo ""

  git log -1 --oneline
  echo ""

  read -p "Split this commit? (y/N) " confirm
  if [[ "$confirm" != "y" ]]; then
    echo "Cancelled"
    return 0
  fi

  # Undo commit, keep changes staged
  git reset --soft HEAD~1

  # Unstage all
  git reset HEAD

  echo ""
  echo "Changes are now unstaged. Use these commands:"
  echo ""
  echo "  git add -p           # Stage interactively"
  echo "  git commit -m '...'  # Commit first part"
  echo "  # Repeat for each logical change"
  echo ""
  echo "Current status:"
  git status --short
}

# =============================================================================
# USAGE
# =============================================================================

usage() {
  cat << 'EOF'
Atomic Commit Workflow Scripts

Commands:
  stage_interactive       Start interactive staging (git add -p)
  stage_by_type TYPE      Stage only specific file types
  analyze_staged          Analyze staged changes before commit
  suggest_commit_type     Suggest commit type from staged files
  validate_commit_message Validate commit message format
  atomic_commit           Full atomic commit workflow
  split_last_commit       Split last commit into multiple

Types for stage_by_type:
  python, typescript, javascript, styles, tests, docs

Examples:
  source commit-workflow.sh
  stage_by_type typescript
  analyze_staged
  atomic_commit
EOF
}

# Show usage if run directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  usage
fi
