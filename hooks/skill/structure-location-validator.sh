#!/bin/bash
# =============================================================================
# structure-location-validator.sh
# BLOCKING: Files must be in correct architectural locations
# CC 2.1.7 Compliant: Self-contained hook with stdin reading and self-guard
# =============================================================================
set -euo pipefail

# Read stdin BEFORE sourcing common.sh
_HOOK_INPUT=$(cat)
export _HOOK_INPUT

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../_lib/common.sh"

# Self-guard: Only run for code files
guard_code_files || exit 0

# Get file path
FILE_PATH=$(get_field '.tool_input.file_path')
[[ -z "$FILE_PATH" ]] && { output_silent_success; exit 0; }

ERRORS=()
FILENAME=$(basename "$FILE_PATH")

# =============================================================================
# Rule: Max nesting depth (4 levels from src/ or app/)
# =============================================================================
MAX_DEPTH=4

if [[ "$FILE_PATH" =~ (src/|app/) ]]; then
    if [[ "$FILE_PATH" =~ src/ ]]; then
        RELATIVE_PATH="${FILE_PATH#*src/}"
    else
        RELATIVE_PATH="${FILE_PATH#*app/}"
    fi
    DEPTH=$(echo "$RELATIVE_PATH" | tr '/' '\n' | grep -c . 2>/dev/null || echo "0")
    if [[ $DEPTH -gt $MAX_DEPTH ]]; then
        ERRORS+=("NESTING: Max depth exceeded - $DEPTH levels (max: $MAX_DEPTH)")
    fi
fi

# =============================================================================
# Rule: No barrel files (index.ts that only re-export)
# =============================================================================
if [[ "$FILENAME" == "index.ts" ]] || [[ "$FILENAME" == "index.tsx" ]] || [[ "$FILENAME" == "index.js" ]]; then
    if [[ ! "$FILE_PATH" =~ /app/ ]] && [[ ! "$FILE_PATH" =~ /(node_modules|dist|build)/ ]]; then
        ERRORS+=("BARREL: Barrel files (index.ts) are discouraged - import directly from source")
    fi
fi

# =============================================================================
# React/TypeScript Structure Rules
# =============================================================================
if [[ "$FILE_PATH" =~ \.(tsx|ts|jsx|js)$ ]]; then
    # Rule: React components (PascalCase) must be in components/ or features/
    if [[ "$FILENAME" =~ ^[A-Z][a-zA-Z0-9]*\.(tsx|jsx)$ ]]; then
        if [[ ! "$FILE_PATH" =~ (components/|features/|app/|pages/) ]]; then
            ERRORS+=("COMPONENT: React components must be in components/, features/, or app/")
        fi
    fi

    # Rule: Custom hooks (useX) must be in hooks/ directory
    if [[ "$FILENAME" =~ ^use[A-Z][a-zA-Z0-9]*\.(ts|tsx)$ ]]; then
        if [[ ! "$FILE_PATH" =~ (hooks/|/hooks/) ]]; then
            ERRORS+=("HOOK: Custom hooks must be in hooks/ directory")
        fi
    fi
fi

# =============================================================================
# FastAPI/Python Structure Rules
# =============================================================================
if [[ "$FILE_PATH" =~ \.py$ ]]; then
    DIRNAME=$(dirname "$FILE_PATH")

    # Rule: Router files must be in routers/
    if [[ "$FILENAME" =~ ^(router_|routes_|api_).*\.py$ ]]; then
        if [[ ! "$DIRNAME" =~ routers$ ]] && [[ ! "$DIRNAME" =~ /routers$ ]]; then
            ERRORS+=("ROUTER: Router files must be in routers/ directory")
        fi
    fi

    # Rule: Service files must be in services/
    if [[ "$FILENAME" =~ _service\.py$ ]]; then
        if [[ ! "$DIRNAME" =~ services$ ]] && [[ ! "$DIRNAME" =~ /services$ ]]; then
            ERRORS+=("SERVICE: Service files must be in services/ directory")
        fi
    fi

    # Rule: Repository files must be in repositories/
    if [[ "$FILENAME" =~ _(repository|repo)\.py$ ]]; then
        if [[ ! "$DIRNAME" =~ repositories$ ]] && [[ ! "$DIRNAME" =~ /repositories$ ]]; then
            ERRORS+=("REPOSITORY: Repository files must be in repositories/ directory")
        fi
    fi
fi

# =============================================================================
# Report errors and block
# =============================================================================
if [[ ${#ERRORS[@]} -gt 0 ]]; then
    REASON="Structure violation: ${ERRORS[0]}"
    output_block "$REASON"
    exit 0
fi

output_silent_success
exit 0