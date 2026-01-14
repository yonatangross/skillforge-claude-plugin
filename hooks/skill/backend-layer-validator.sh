#!/bin/bash
# =============================================================================
# backend-layer-validator.sh
# BLOCKING: Enforce layer separation in FastAPI
# CC 2.1.7 Compliant: Self-contained hook with stdin reading and self-guard
# =============================================================================
set -euo pipefail

# Read stdin BEFORE sourcing common.sh
_HOOK_INPUT=$(cat)
export _HOOK_INPUT

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../_lib/common.sh"

# Self-guard: Only run for Python files
guard_python_files || exit 0

# Get file path and content
FILE_PATH=$(get_field '.tool_input.file_path')
CONTENT=$(get_field '.tool_result // .tool_input.content // ""')

[[ -z "$FILE_PATH" ]] && { output_silent_success; exit 0; }
[[ -z "$CONTENT" ]] && { output_silent_success; exit 0; }

ERRORS=()

# =============================================================================
# ROUTER LAYER VIOLATIONS
# =============================================================================
if [[ "$FILE_PATH" =~ /routers/ ]]; then
    # Rule: No direct database operations in routers
    if echo "$CONTENT" | grep -qE "db\.(add|delete|commit|flush|rollback|refresh|execute|scalar)" 2>/dev/null; then
        ERRORS+=("DATABASE: Direct database operations not allowed in routers")
    fi

    # Rule: No SQLAlchemy imports
    if echo "$CONTENT" | grep -qE "^from sqlalchemy import" 2>/dev/null; then
        ERRORS+=("IMPORT: SQLAlchemy imports not allowed in routers")
    fi
fi

# =============================================================================
# SERVICE LAYER VIOLATIONS
# =============================================================================
if [[ "$FILE_PATH" =~ /services/ ]]; then
    # Rule: No HTTP exception handling
    if echo "$CONTENT" | grep -qE "HTTPException\s*\(" 2>/dev/null; then
        ERRORS+=("HTTP: HTTPException not allowed in services - use domain exceptions")
    fi

    # Rule: No FastAPI Request/Response objects
    if echo "$CONTENT" | grep -qE "from fastapi import.*(Request|Response)" 2>/dev/null; then
        ERRORS+=("HTTP: Request/Response types not allowed in services")
    fi
fi

# =============================================================================
# REPOSITORY LAYER VIOLATIONS
# =============================================================================
if [[ "$FILE_PATH" =~ /repositories/ ]]; then
    # Rule: No HTTP exceptions
    if echo "$CONTENT" | grep -qE "HTTPException" 2>/dev/null; then
        ERRORS+=("HTTP: HTTPException not allowed in repositories")
    fi

    # Rule: No service/router imports
    if echo "$CONTENT" | grep -qE "from.*(services|routers).*import" 2>/dev/null; then
        ERRORS+=("IMPORT: Repositories cannot import from services or routers")
    fi
fi

# =============================================================================
# Report errors
# =============================================================================
if [[ ${#ERRORS[@]} -gt 0 ]]; then
    REASON="Layer violation in $(basename "$FILE_PATH"): ${ERRORS[0]}"
    output_block "$REASON"
    exit 0
fi

output_silent_success
exit 0