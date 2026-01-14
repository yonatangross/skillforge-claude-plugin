#!/bin/bash
# Auto-Lint Hook - PostToolUse hook for Write/Edit
# CC 2.1.7 Compliant: Self-contained hook with stdin reading and self-guard
#
# Automatically runs linters after file writes:
# - Python: ruff check + ty (Astral toolchain)
# - JS/TS: biome check (Rust-based)
# - JSON/CSS: biome format
set -euo pipefail

# Read stdin BEFORE sourcing common.sh
_HOOK_INPUT=$(cat)
export _HOOK_INPUT

source "$(dirname "$0")/../_lib/common.sh"

# Self-guard: Only run for Write/Edit
guard_tool "Write" "Edit" || exit 0

# Self-guard: Skip internal files
guard_skip_internal || exit 0

# Get file path
FILE_PATH=$(get_field '.tool_input.file_path')
[[ -z "$FILE_PATH" || ! -f "$FILE_PATH" ]] && { output_silent_success; exit 0; }

# Skip if SKIP_AUTO_LINT is set
[[ "${SKIP_AUTO_LINT:-}" == "1" ]] && { output_silent_success; exit 0; }

# Detect language from extension
get_language() {
    case "$1" in
        *.py) echo "python" ;;
        *.ts|*.tsx) echo "typescript" ;;
        *.js|*.jsx) echo "javascript" ;;
        *.json) echo "json" ;;
        *.css|*.scss) echo "css" ;;
        *) echo "" ;;
    esac
}

LANG=$(get_language "$FILE_PATH")
[[ -z "$LANG" ]] && { output_silent_success; exit 0; }

LINT_ISSUES=0
FIXES_APPLIED=0

# Run linter based on language
case "$LANG" in
    python)
        if command -v ruff >/dev/null 2>&1; then
            RUFF_CHECK=$(timeout 5s ruff check --output-format=concise "$FILE_PATH" 2>&1) || true
            if [[ -n "$RUFF_CHECK" ]]; then
                LINT_ISSUES=$(echo "$RUFF_CHECK" | wc -l | tr -d ' ')
                timeout 5s ruff check --fix --unsafe-fixes=false "$FILE_PATH" 2>/dev/null || true
                FIXES_APPLIED=1
            fi
            timeout 5s ruff format "$FILE_PATH" 2>/dev/null || true
        fi
        ;;

    typescript|javascript)
        if command -v biome >/dev/null 2>&1; then
            BIOME_OUT=$(timeout 5s biome check --write "$FILE_PATH" 2>&1) || true
            [[ "$BIOME_OUT" == *"Fixed"* ]] && FIXES_APPLIED=1
            [[ "$BIOME_OUT" == *"error"* ]] && LINT_ISSUES=$(echo "$BIOME_OUT" | grep -c "error" || echo "0")
        fi
        ;;

    json|css)
        if command -v biome >/dev/null 2>&1; then
            timeout 5s biome format --write "$FILE_PATH" 2>/dev/null || true
            FIXES_APPLIED=1
        fi
        ;;
esac

# Build output message
if [[ "$FIXES_APPLIED" -eq 1 && "$LINT_ISSUES" -gt 0 ]]; then
    MSG="Auto-lint: fixed issues, $LINT_ISSUES remaining in $(basename "$FILE_PATH")"
    output_posttool_feedback "$MSG"
elif [[ "$FIXES_APPLIED" -eq 1 ]]; then
    # Silent success - formatting only
    output_silent_success
else
    output_silent_success
fi
exit 0