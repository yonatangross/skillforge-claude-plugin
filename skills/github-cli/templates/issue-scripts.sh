#!/bin/bash
# GitHub Issue Creation Scripts
# Comprehensive workflow for creating well-structured issues

set -euo pipefail

# =============================================================================
# PRE-CREATION CHECKS
# =============================================================================

# Search for potential duplicate issues
check_duplicates() {
  local search_terms="$1"

  echo "=== Searching for Duplicates ==="
  echo "Search: $search_terms"
  echo ""

  # Search open issues
  echo "Open issues:"
  local open_results
  open_results=$(gh issue list --state open --search "$search_terms" --json number,title,labels --jq '
    .[] | "#\(.number) \(.title) [\(.labels | map(.name) | join(", "))]"
  ' 2>/dev/null || echo "")

  if [[ -n "$open_results" ]]; then
    echo "$open_results"
  else
    echo "  (none found)"
  fi

  echo ""

  # Search closed issues
  echo "Closed issues (might be related):"
  local closed_results
  closed_results=$(gh issue list --state closed --search "$search_terms" --limit 5 --json number,title --jq '
    .[] | "#\(.number) \(.title)"
  ' 2>/dev/null || echo "")

  if [[ -n "$closed_results" ]]; then
    echo "$closed_results"
  else
    echo "  (none found)"
  fi

  echo ""

  # Check open PRs
  echo "Related open PRs:"
  local pr_results
  pr_results=$(gh pr list --state open --search "$search_terms" --json number,title --jq '
    .[] | "PR #\(.number) \(.title)"
  ' 2>/dev/null || echo "")

  if [[ -n "$pr_results" ]]; then
    echo "$pr_results"
  else
    echo "  (none found)"
  fi
}

# List available milestones with progress
list_milestones() {
  echo "=== Available Milestones ==="
  echo ""

  gh api repos/:owner/:repo/milestones --jq '
    .[] |
    {
      num: .number,
      title: .title,
      state: .state,
      due: (.due_on // "no due date" | split("T")[0]),
      open: .open_issues,
      closed: .closed_issues,
      total: (.open_issues + .closed_issues)
    } |
    "#\(.num) \(.title)
    State: \(.state) | Due: \(.due)
    Progress: \(.closed)/\(.total) issues (\(if .total > 0 then ((.closed * 100 / .total) | floor) else 0 end)%)
"
  ' 2>/dev/null || echo "No milestones found"
}

# List available labels by category
list_labels() {
  echo "=== Available Labels ==="
  echo ""

  # Get all labels
  local labels
  labels=$(gh label list --json name,description,color --jq 'sort_by(.name)' 2>/dev/null)

  if [[ -z "$labels" || "$labels" == "[]" ]]; then
    echo "No labels found"
    return
  fi

  # Categorize and display
  echo "Type labels:"
  echo "$labels" | jq -r '.[] | select(.name | test("bug|feat|enhancement|doc|refactor|test|chore"; "i")) | "  \(.name): \(.description // "no description")"'

  echo ""
  echo "Priority labels:"
  echo "$labels" | jq -r '.[] | select(.name | test("critical|high|medium|low|priority"; "i")) | "  \(.name): \(.description // "no description")"'

  echo ""
  echo "Domain labels:"
  echo "$labels" | jq -r '.[] | select(.name | test("backend|frontend|database|api|ui|infra"; "i")) | "  \(.name): \(.description // "no description")"'

  echo ""
  echo "Other labels:"
  echo "$labels" | jq -r '.[] | select(.name | test("bug|feat|enhancement|doc|refactor|test|chore|critical|high|medium|low|priority|backend|frontend|database|api|ui|infra"; "i") | not) | "  \(.name)"'
}

# Check recent commits for related changes
check_recent_commits() {
  local keyword="$1"

  echo "=== Recent Commits Mentioning '$keyword' ==="
  echo ""

  git log --oneline -50 --all | grep -i "$keyword" | head -10 || echo "No matching commits found"
}

# Full pre-creation check
pre_creation_check() {
  local search_terms="$1"

  echo "╔══════════════════════════════════════════════════════════════════════════════╗"
  echo "║                    ISSUE PRE-CREATION CHECKS                                 ║"
  echo "╚══════════════════════════════════════════════════════════════════════════════╝"
  echo ""

  check_duplicates "$search_terms"
  echo ""
  echo "─────────────────────────────────────────────────────────────────────────────────"
  echo ""
  list_milestones
  echo ""
  echo "─────────────────────────────────────────────────────────────────────────────────"
  echo ""
  check_recent_commits "$search_terms"
  echo ""
  echo "─────────────────────────────────────────────────────────────────────────────────"
  echo ""

  read -p "Continue with issue creation? (y/N) " continue_choice
  if [[ "$continue_choice" != "y" && "$continue_choice" != "Y" ]]; then
    echo "Issue creation cancelled."
    return 1
  fi

  return 0
}

# =============================================================================
# ISSUE CREATION
# =============================================================================

# Interactive issue creation with all checks
create_issue_interactive() {
  echo "╔══════════════════════════════════════════════════════════════════════════════╗"
  echo "║                    INTERACTIVE ISSUE CREATION                                ║"
  echo "╚══════════════════════════════════════════════════════════════════════════════╝"
  echo ""

  # Step 1: Get basic info for duplicate check
  read -p "Brief description (for duplicate search): " search_desc

  if [[ -z "$search_desc" ]]; then
    echo "Description required"
    return 1
  fi

  echo ""

  # Step 2: Run pre-creation checks
  if ! pre_creation_check "$search_desc"; then
    return 1
  fi

  echo ""
  echo "=== Issue Details ==="
  echo ""

  # Step 3: Issue type
  echo "Issue type:"
  echo "  1) bug       - Something isn't working"
  echo "  2) feat      - New feature request"
  echo "  3) docs      - Documentation improvement"
  echo "  4) refactor  - Code improvement"
  echo "  5) test      - Test-related"
  echo "  6) chore     - Maintenance task"
  echo ""
  read -p "Select type [1-6]: " type_choice

  local issue_type=""
  case "$type_choice" in
    1) issue_type="bug" ;;
    2) issue_type="feat" ;;
    3) issue_type="docs" ;;
    4) issue_type="refactor" ;;
    5) issue_type="test" ;;
    6) issue_type="chore" ;;
    *) issue_type="enhancement" ;;
  esac

  # Step 4: Title
  echo ""
  read -p "Issue title: " title
  local full_title="${issue_type}: ${title}"
  echo "Full title: $full_title"

  # Step 5: Priority
  echo ""
  echo "Priority:"
  echo "  1) critical - Blocking, needs immediate attention"
  echo "  2) high     - Important, current sprint"
  echo "  3) medium   - Normal priority"
  echo "  4) low      - Nice to have"
  echo ""
  read -p "Select priority [1-4]: " priority_choice

  local priority=""
  case "$priority_choice" in
    1) priority="critical" ;;
    2) priority="high" ;;
    3) priority="medium" ;;
    4) priority="low" ;;
    *) priority="medium" ;;
  esac

  # Step 6: Labels
  echo ""
  list_labels
  echo ""
  read -p "Additional labels (comma-separated, or Enter for none): " extra_labels

  local labels="${issue_type}"
  if [[ -n "$priority" ]]; then
    labels="${labels},${priority}"
  fi
  if [[ -n "$extra_labels" ]]; then
    labels="${labels},${extra_labels}"
  fi

  # Step 7: Milestone
  echo ""
  list_milestones
  echo ""
  read -p "Milestone title (or Enter for none): " milestone

  # Step 8: Description
  echo ""
  echo "Issue body (enter description, end with Ctrl+D or empty line):"
  echo "─────────────────────────────────────────────────────────────"

  local body=""
  local template=""

  case "$issue_type" in
    bug)
      template="## Bug Description
$search_desc

## Steps to Reproduce
1.
2.
3.

## Expected Behavior


## Actual Behavior


## Environment
- OS:
- Version:

## Additional Context
"
      ;;
    feat)
      template="## Problem Statement
$search_desc

## Proposed Solution


## Acceptance Criteria
- [ ]
- [ ]
- [ ]

## Additional Context
"
      ;;
    *)
      template="## Description
$search_desc

## Tasks
- [ ]
- [ ]

## Acceptance Criteria
- [ ]
"
      ;;
  esac

  echo ""
  echo "Template (you can edit after creation):"
  echo "$template"
  echo ""
  read -p "Use this template? (Y/n) " use_template

  if [[ "$use_template" == "n" || "$use_template" == "N" ]]; then
    echo "Enter custom body (Ctrl+D when done):"
    body=$(cat)
  else
    body="$template"
  fi

  # Step 9: Assignee
  echo ""
  read -p "Assign to (username or @me, or Enter for none): " assignee

  # Step 10: Confirm and create
  echo ""
  echo "═══════════════════════════════════════════════════════════════════════════════"
  echo "REVIEW ISSUE"
  echo "═══════════════════════════════════════════════════════════════════════════════"
  echo ""
  echo "Title: $full_title"
  echo "Labels: $labels"
  echo "Milestone: ${milestone:-none}"
  echo "Assignee: ${assignee:-none}"
  echo ""
  echo "Body:"
  echo "$body" | head -10
  if [[ $(echo "$body" | wc -l) -gt 10 ]]; then
    echo "... (truncated)"
  fi
  echo ""

  read -p "Create this issue? (y/N) " create_confirm
  if [[ "$create_confirm" != "y" && "$create_confirm" != "Y" ]]; then
    echo "Issue creation cancelled."
    return 1
  fi

  # Build gh issue create command
  local gh_args=(
    "--title" "$full_title"
    "--body" "$body"
    "--label" "$labels"
  )

  if [[ -n "$milestone" ]]; then
    gh_args+=("--milestone" "$milestone")
  fi

  if [[ -n "$assignee" ]]; then
    gh_args+=("--assignee" "$assignee")
  fi

  # Create the issue
  echo ""
  echo "Creating issue..."
  local result
  result=$(gh issue create "${gh_args[@]}" 2>&1)

  echo ""
  echo "✅ Issue created!"
  echo "$result"

  # Extract issue number for follow-up
  local issue_url="$result"
  local issue_num
  issue_num=$(echo "$issue_url" | grep -oE '[0-9]+$' || echo "")

  if [[ -n "$issue_num" ]]; then
    echo ""
    echo "Next steps:"
    echo "  1. Create branch: git checkout -b issue/${issue_num}-$(echo "$title" | tr ' ' '-' | tr '[:upper:]' '[:lower:]' | cut -c1-30)"
    echo "  2. View issue: gh issue view $issue_num"
    echo "  3. Edit issue: gh issue edit $issue_num"
  fi
}

# Quick issue creation (fewer prompts)
create_issue_quick() {
  local title="$1"
  local body="${2:-}"
  local labels="${3:-enhancement}"
  local milestone="${4:-}"

  if [[ -z "$title" ]]; then
    echo "Usage: create_issue_quick 'title' ['body'] ['labels'] ['milestone']"
    return 1
  fi

  # Quick duplicate check
  echo "Checking for duplicates..."
  local dups
  dups=$(gh issue list --state open --search "$title" --json number,title --jq 'length')

  if [[ "$dups" -gt 0 ]]; then
    echo "⚠️  Found $dups potential duplicates:"
    gh issue list --state open --search "$title" --json number,title --jq '.[] | "#\(.number) \(.title)"'
    echo ""
    read -p "Continue anyway? (y/N) " confirm
    if [[ "$confirm" != "y" ]]; then
      return 1
    fi
  fi

  local gh_args=(
    "--title" "$title"
    "--label" "$labels"
  )

  if [[ -n "$body" ]]; then
    gh_args+=("--body" "$body")
  fi

  if [[ -n "$milestone" ]]; then
    gh_args+=("--milestone" "$milestone")
  fi

  gh issue create "${gh_args[@]}"
}

# =============================================================================
# ISSUE MANAGEMENT
# =============================================================================

# Triage helper - find issues needing attention
triage_issues() {
  echo "=== Issues Needing Triage ==="
  echo ""

  echo "No labels:"
  gh issue list --state open --json number,title,labels --jq '
    [.[] | select(.labels | length == 0)] |
    if length > 0 then .[] | "#\(.number) \(.title)"
    else "  (none)"
    end
  '

  echo ""
  echo "No milestone:"
  gh issue list --state open --json number,title,milestone --jq '
    [.[] | select(.milestone == null)] |
    if length > 0 then .[] | "#\(.number) \(.title)"
    else "  (none)"
    end
  ' | head -10

  echo ""
  echo "No assignee:"
  gh issue list --state open --json number,title,assignees --jq '
    [.[] | select(.assignees | length == 0)] |
    if length > 0 then .[] | "#\(.number) \(.title)"
    else "  (none)"
    end
  ' | head -10

  echo ""
  echo "Stale (no activity 30+ days):"
  local thirty_days_ago
  thirty_days_ago=$(date -v-30d +%Y-%m-%d 2>/dev/null || date -d "30 days ago" +%Y-%m-%d)
  gh issue list --state open --json number,title,updatedAt --jq "
    [.[] | select(.updatedAt < \"${thirty_days_ago}\")] |
    if length > 0 then .[] | \"#\(.number) \(.title) (updated: \(.updatedAt | split(\"T\")[0]))\"
    else \"  (none)\"
    end
  " | head -10
}

# Issue statistics
issue_stats() {
  echo "=== Issue Statistics ==="
  echo ""

  local total_open total_closed
  total_open=$(gh issue list --state open --json number --jq 'length')
  total_closed=$(gh issue list --state closed --limit 1000 --json number --jq 'length')

  echo "Total: $((total_open + total_closed)) issues"
  echo "  Open: $total_open"
  echo "  Closed: $total_closed"
  echo ""

  echo "By label (top 10):"
  gh issue list --state all --limit 500 --json labels --jq '
    [.[].labels[].name] | group_by(.) | map({label: .[0], count: length}) |
    sort_by(-.count) | .[:10][] | "  \(.label): \(.count)"
  '

  echo ""
  echo "By milestone:"
  gh api repos/:owner/:repo/milestones?state=all --jq '
    .[] | "  \(.title): \(.closed_issues)/\(.open_issues + .closed_issues)"
  '
}

# =============================================================================
# GH ALIASES SETUP
# =============================================================================

setup_issue_aliases() {
  cat << 'EOF'
# Add these aliases to ~/.config/gh/config.yml under 'aliases:'

aliases:
  # Search
  issue-search: 'issue list --state all --search'
  issue-dup: '!f() { gh issue list --state all --search "$1" --json number,title,state --jq ".[] | \"#\\(.number) [\\(.state)] \\(.title)\""; }; f'

  # Triage
  issue-unlabeled: 'issue list --state open --json number,title,labels --jq "[.[] | select(.labels | length == 0)] | .[] | \"#\\(.number) \\(.title)\""'
  issue-unassigned: 'issue list --state open --json number,title,assignees --jq "[.[] | select(.assignees | length == 0)] | .[] | \"#\\(.number) \\(.title)\""'

  # Quick create
  issue-bug: '!f() { gh issue create --title "bug: $1" --label "bug" --body "${2:-Bug description}"; }; f'
  issue-feat: '!f() { gh issue create --title "feat: $1" --label "enhancement" --body "${2:-Feature description}"; }; f'

# Usage:
#   gh issue-search "authentication"
#   gh issue-dup "login bug"
#   gh issue-unlabeled
#   gh issue-bug "Login fails" "Steps to reproduce..."
EOF
}

# =============================================================================
# USAGE
# =============================================================================

usage() {
  cat << 'EOF'
GitHub Issue Creation Scripts

Pre-Creation Checks:
  check_duplicates "keywords"    Search for duplicate issues
  list_milestones                Show available milestones with progress
  list_labels                    Show available labels by category
  check_recent_commits "keyword" Check if already addressed in commits
  pre_creation_check "keywords"  Run all pre-creation checks

Issue Creation:
  create_issue_interactive       Full guided issue creation
  create_issue_quick TITLE       Quick issue with minimal prompts

Issue Management:
  triage_issues                  Find issues needing attention
  issue_stats                    Show issue statistics

Setup:
  setup_issue_aliases            Show gh aliases to add

Examples:
  source issue-scripts.sh

  # Full workflow
  create_issue_interactive

  # Quick creation
  create_issue_quick "feat: Add dark mode" "" "enhancement,frontend" "Sprint 10"

  # Check before creating
  pre_creation_check "authentication login"
EOF
}

# Show usage if run directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  usage
fi
