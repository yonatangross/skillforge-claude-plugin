#!/bin/bash
# Milestone Management Scripts for GitHub CLI
# Add these as gh aliases or use directly

set -euo pipefail

# =============================================================================
# MILESTONE LISTING
# =============================================================================

# List all milestones with progress
milestone_list() {
  gh api repos/:owner/:repo/milestones --jq '
    .[] |
    {
      number,
      title,
      state,
      due: (.due_on // "no due date" | split("T")[0]),
      progress: "\(.closed_issues)/\(.open_issues + .closed_issues)",
      percent: (if (.open_issues + .closed_issues) > 0
                then ((.closed_issues * 100 / (.open_issues + .closed_issues)) | floor)
                else 0 end)
    } |
    "#\(.number) [\(.state)] \(.title) - \(.progress) (\(.percent)%) due: \(.due)"
  '
}

# List milestones with progress bars
milestone_list_fancy() {
  gh api repos/:owner/:repo/milestones --jq '
    .[] |
    {
      n: .number,
      t: .title,
      s: .state,
      o: .open_issues,
      c: .closed_issues,
      d: (.due_on // "" | split("T")[0])
    } |
    "#\(.n) \(.t)\n   [\(.s)] \(.c)/\(.c + .o) issues" +
    (if .d != "" then " | due: \(.d)" else "" end)
  '
}

# =============================================================================
# MILESTONE CREATION
# =============================================================================

# Create milestone with validation
milestone_create() {
  local title="$1"
  local due_date="${2:-}"
  local description="${3:-}"

  if [[ -z "$title" ]]; then
    echo "Usage: milestone_create 'Title' ['YYYY-MM-DD'] ['Description']"
    return 1
  fi

  local args=(-f "title=$title")

  if [[ -n "$due_date" ]]; then
    # Validate date format
    if ! [[ "$due_date" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]]; then
      echo "Error: Due date must be YYYY-MM-DD format"
      return 1
    fi
    args+=(-f "due_on=${due_date}T00:00:00Z")
  fi

  if [[ -n "$description" ]]; then
    args+=(-f "description=$description")
  fi

  local result
  result=$(gh api -X POST repos/:owner/:repo/milestones "${args[@]}")

  local number
  number=$(echo "$result" | jq -r '.number')
  echo "Created milestone #$number: $title"

  if [[ -n "$due_date" ]]; then
    echo "Due: $due_date"
  fi
}

# Create sprint milestone (convenience)
sprint_create() {
  local sprint_num="$1"
  local focus="${2:-}"
  local due_date="${3:-}"

  local title="Sprint $sprint_num"
  if [[ -n "$focus" ]]; then
    title="Sprint $sprint_num: $focus"
  fi

  milestone_create "$title" "$due_date" "Sprint $sprint_num goals and deliverables"
}

# =============================================================================
# MILESTONE MANAGEMENT
# =============================================================================

# Close milestone by number
milestone_close() {
  local number="$1"

  if [[ -z "$number" ]]; then
    echo "Usage: milestone_close <number>"
    return 1
  fi

  gh api -X PATCH "repos/:owner/:repo/milestones/$number" -f state=closed
  echo "Closed milestone #$number"
}

# Reopen milestone
milestone_reopen() {
  local number="$1"
  gh api -X PATCH "repos/:owner/:repo/milestones/$number" -f state=open
  echo "Reopened milestone #$number"
}

# Delete milestone (use with caution!)
milestone_delete() {
  local number="$1"

  if [[ -z "$number" ]]; then
    echo "Usage: milestone_delete <number>"
    return 1
  fi

  read -p "Are you sure you want to delete milestone #$number? (y/N) " confirm
  if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
    echo "Cancelled"
    return 0
  fi

  gh api -X DELETE "repos/:owner/:repo/milestones/$number"
  echo "Deleted milestone #$number"
}

# =============================================================================
# MILESTONE PROGRESS
# =============================================================================

# Get detailed progress for a milestone
milestone_progress() {
  local number="$1"

  if [[ -z "$number" ]]; then
    echo "Usage: milestone_progress <number>"
    return 1
  fi

  local data
  data=$(gh api "repos/:owner/:repo/milestones/$number")

  local title open closed total percent
  title=$(echo "$data" | jq -r '.title')
  open=$(echo "$data" | jq -r '.open_issues')
  closed=$(echo "$data" | jq -r '.closed_issues')
  total=$((open + closed))

  if [[ $total -gt 0 ]]; then
    percent=$((closed * 100 / total))
  else
    percent=0
  fi

  echo "Milestone: $title"
  echo "Progress: $closed/$total ($percent%)"
  echo ""

  # Progress bar
  local bar_width=40
  local filled=$((percent * bar_width / 100))
  local empty=$((bar_width - filled))

  printf "["
  printf "%${filled}s" | tr ' ' '█'
  printf "%${empty}s" | tr ' ' '░'
  printf "] %d%%\n" "$percent"

  echo ""
  echo "Open issues: $open"
  echo "Closed issues: $closed"

  # List open issues
  if [[ $open -gt 0 ]]; then
    echo ""
    echo "Open issues in this milestone:"
    gh issue list --milestone "$title" --state open --json number,title --jq '.[] | "  #\(.number): \(.title)"'
  fi
}

# =============================================================================
# BULK OPERATIONS
# =============================================================================

# Move all issues with a label to a milestone
milestone_bulk_add() {
  local milestone_title="$1"
  local label="$2"

  if [[ -z "$milestone_title" || -z "$label" ]]; then
    echo "Usage: milestone_bulk_add 'Milestone Title' 'label'"
    return 1
  fi

  local issues
  issues=$(gh issue list --label "$label" --state open --json number --jq '.[].number')

  local count=0
  for issue in $issues; do
    gh issue edit "$issue" --milestone "$milestone_title"
    echo "Added #$issue to '$milestone_title'"
    ((count++))
  done

  echo "Added $count issues to milestone"
}

# Close all issues in a milestone
milestone_close_all_issues() {
  local milestone_title="$1"

  if [[ -z "$milestone_title" ]]; then
    echo "Usage: milestone_close_all_issues 'Milestone Title'"
    return 1
  fi

  read -p "Close all issues in '$milestone_title'? (y/N) " confirm
  if [[ "$confirm" != "y" ]]; then
    echo "Cancelled"
    return 0
  fi

  local issues
  issues=$(gh issue list --milestone "$milestone_title" --state open --json number --jq '.[].number')

  for issue in $issues; do
    gh issue close "$issue" --comment "Closing as part of milestone completion"
    echo "Closed #$issue"
  done
}

# =============================================================================
# GH ALIASES SETUP
# =============================================================================

# Install these as gh aliases
setup_milestone_aliases() {
  cat << 'EOF'
# Add these aliases to ~/.config/gh/config.yml under 'aliases:'

aliases:
  ms: api repos/:owner/:repo/milestones --jq '.[] | "#\(.number) [\(.state)] \(.title) - \(.closed_issues)/\(.open_issues + .closed_issues)"'
  ms-create: '!f() { gh api -X POST repos/:owner/:repo/milestones -f title="$1" ${2:+-f due_on="${2}T00:00:00Z"} ${3:+-f description="$3"}; }; f'
  ms-close: '!f() { gh api -X PATCH repos/:owner/:repo/milestones/$1 -f state=closed; }; f'
  ms-open: '!f() { gh api -X PATCH repos/:owner/:repo/milestones/$1 -f state=open; }; f'
  ms-delete: api -X DELETE repos/:owner/:repo/milestones/$1
  ms-progress: '!f() { gh api repos/:owner/:repo/milestones/$1 --jq "\"\\(.title): \\(.closed_issues)/\\(.open_issues + .closed_issues) (\\((.closed_issues * 100 / (.open_issues + .closed_issues)) | floor)%)\""; }; f'

# Usage:
#   gh ms                                    # List all milestones
#   gh ms-create "Sprint 10" "2026-03-15"   # Create with due date
#   gh ms-close 5                           # Close milestone #5
#   gh ms-progress 5                        # Show progress for #5
EOF
}

# Run setup if sourced with 'setup' argument
if [[ "${1:-}" == "setup" ]]; then
  setup_milestone_aliases
fi
