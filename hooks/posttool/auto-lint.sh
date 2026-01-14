#!/bin/bash
# Auto-Lint Hook - PostToolUse hook for Write/Edit
# CC 2.1.7 Compliant: uses decision+reason for feedback visibility
#
# Automatically runs linters after file writes:
# - Python: ruff check + ty (Astral toolchain, 2026 standard)
# - JS/TS: biome check (Rust-based, 20x faster than ESLint)
# - JSON/CSS: biome format
#
# Respects project configs (pyproject.toml, biome.json)
# Skips if linters not installed (graceful degradation)
#
# Performance target: <100ms (skip if no linter available)

set -euo pipefail

# Use exported hook input from dispatcher
TOOL_NAME="${POSTTOOL_TOOL_NAME:-}"
FILE_PATH="${POSTTOOL_FILE_PATH:-}"

# Quick exit if not Write/Edit
if [[ "$TOOL_NAME" != "Write" && "$TOOL_NAME" != "Edit" ]]; then
    echo '{"continue":true,"suppressOutput":true}'
    exit 0
fi

# Quick exit if no file path
if [[ -z "$FILE_PATH" || ! -f "$FILE_PATH" ]]; then
    echo '{"continue":true,"suppressOutput":true}'
    exit 0
fi

# Skip internal/generated files (fast path)
case "$FILE_PATH" in
    */.claude/*|*/node_modules/*|*/dist/*|*/build/*|*/.git/*|*.min.js|*.min.css|*.lock|*-lock.json)
        echo '{"continue":true,"suppressOutput":true}'
        exit 0
        ;;
esac

# Skip if SKIP_AUTO_LINT is set
if [[ "${SKIP_AUTO_LINT:-}" == "1" ]]; then
    echo '{"continue":true,"suppressOutput":true}'
    exit 0
fi

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

# Exit if unsupported language
if [[ -z "$LANG" ]]; then
    echo '{"continue":true,"suppressOutput":true}'
    exit 0
fi

# Find project root (for config detection)
PROJECT_ROOT="${CLAUDE_PROJECT_DIR:-$(pwd)}"

LINT_OUTPUT=""
LINT_ISSUES=0
FIXES_APPLIED=0

# Run linter based on language
case "$LANG" in
    python)
        # Ruff (linting + formatting) - 2026 standard
        if command -v ruff >/dev/null 2>&1; then
            # Check for issues first
            RUFF_CHECK=$(timeout 5s ruff check --output-format=concise "$FILE_PATH" 2>&1) || true
            if [[ -n "$RUFF_CHECK" ]]; then
                LINT_ISSUES=$(echo "$RUFF_CHECK" | wc -l | tr -d ' ')
                # Auto-fix safe issues
                timeout 5s ruff check --fix --unsafe-fixes=false "$FILE_PATH" 2>/dev/null || true
                FIXES_APPLIED=1
            fi
            # Format
            timeout 5s ruff format "$FILE_PATH" 2>/dev/null || true
        fi

        # ty (type checking) - 60x faster than mypy
        if command -v ty >/dev/null 2>&1; then
            TY_CHECK=$(timeout 10s ty check "$FILE_PATH" 2>&1) || true
            if [[ -n "$TY_CHECK" && "$TY_CHECK" != *"0 errors"* ]]; then
                TYPE_ERRORS=$(echo "$TY_CHECK" | grep -c "error" || echo "0")
                if [[ "$TYPE_ERRORS" -gt 0 ]]; then
                    LINT_OUTPUT="$TYPE_ERRORS type error(s)"
                fi
            fi
        fi
        ;;

    typescript|javascript)
        # Biome (linting + formatting) - 20x faster than ESLint+Prettier
        if command -v biome >/dev/null 2>&1; then
            # Check and fix
            BIOME_OUT=$(timeout 5s biome check --write "$FILE_PATH" 2>&1) || true
            if [[ "$BIOME_OUT" == *"Fixed"* ]]; then
                FIXES_APPLIED=1
            fi
            if [[ "$BIOME_OUT" == *"error"* ]]; then
                LINT_ISSUES=$(echo "$BIOME_OUT" | grep -c "error" || echo "0")
            fi
        fi
        ;;

    json|css)
        # Biome format only
        if command -v biome >/dev/null 2>&1; then
            timeout 5s biome format --write "$FILE_PATH" 2>/dev/null || true
            FIXES_APPLIED=1
        fi
        ;;
esac

# Build output message
if [[ "$FIXES_APPLIED" -eq 1 && "$LINT_ISSUES" -gt 0 ]]; then
    MSG="Auto-lint: fixed issues, $LINT_ISSUES remaining in $(basename "$FILE_PATH")"
elif [[ "$FIXES_APPLIED" -eq 1 ]]; then
    MSG="Auto-lint: formatted $(basename "$FILE_PATH")"
elif [[ -n "$LINT_OUTPUT" ]]; then
    MSG="Auto-lint: $LINT_OUTPUT in $(basename "$FILE_PATH")"
else
    # Silent success - no issues, no fixes needed
    echo '{"continue":true,"suppressOutput":true}'
    exit 0
fi

# CC 2.1.7 format: decision+reason for Claude visibility
jq -n --arg r "$MSG" '{decision:"block",reason:$r,continue:true}'
exit 0