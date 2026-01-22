#!/bin/bash
# =============================================================================
# import-direction-enforcer.sh
# BLOCKING: Imports must follow unidirectional architecture
# CC 2.1.7 Compliant: Self-contained hook with stdin reading and self-guard
# =============================================================================
set -euo pipefail

# Read stdin BEFORE sourcing common.sh
_HOOK_INPUT=$(cat)
# Dont export - large inputs overflow environment

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../_lib/common.sh"

# Self-guard: Only run for code files
guard_code_files || exit 0

# Get inputs
FILE_PATH=$(get_field '.tool_input.file_path')
CONTENT=$(get_field '.tool_result // .tool_input.content // ""')

[[ -z "$FILE_PATH" ]] && { output_silent_success; exit 0; }
[[ -z "$CONTENT" ]] && { output_silent_success; exit 0; }

ERRORS=()

# =============================================================================
# Determine current layer
# =============================================================================
LAYER=""

# TypeScript/JavaScript layers
if [[ "$FILE_PATH" =~ /shared/ ]]; then LAYER="shared"
elif [[ "$FILE_PATH" =~ /lib/ ]]; then LAYER="lib"
elif [[ "$FILE_PATH" =~ /utils/ ]]; then LAYER="utils"
elif [[ "$FILE_PATH" =~ /components/ ]] && [[ ! "$FILE_PATH" =~ /features/ ]]; then LAYER="components"
elif [[ "$FILE_PATH" =~ /hooks/ ]] && [[ ! "$FILE_PATH" =~ /features/ ]]; then LAYER="hooks"
elif [[ "$FILE_PATH" =~ /features/ ]]; then LAYER="features"
elif [[ "$FILE_PATH" =~ /app/ ]] || [[ "$FILE_PATH" =~ /pages/ ]]; then LAYER="app"
fi

# Python layers
if [[ "$FILE_PATH" =~ /repositories/ ]]; then LAYER="repositories"
elif [[ "$FILE_PATH" =~ /services/ ]] && [[ "$FILE_PATH" =~ \.py$ ]]; then LAYER="services"
elif [[ "$FILE_PATH" =~ /routers/ ]]; then LAYER="routers"
fi

# Skip if not in a recognized layer
[[ -z "$LAYER" ]] && { output_silent_success; exit 0; }

# =============================================================================
# TypeScript/JavaScript Import Rules
# =============================================================================
if [[ "$FILE_PATH" =~ \.(ts|tsx|js|jsx)$ ]]; then
    case $LAYER in
        "shared"|"lib"|"utils")
            if echo "$CONTENT" | grep -qE "from ['\"](@/|\.\./)*(features|app)/" 2>/dev/null; then
                ERRORS+=("$LAYER/ cannot import from features/ or app/")
            fi
            ;;
        "components"|"hooks")
            if echo "$CONTENT" | grep -qE "from ['\"](@/|\.\./)*(features|app)/" 2>/dev/null; then
                ERRORS+=("$LAYER/ cannot import from features/ or app/")
            fi
            ;;
        "features")
            if echo "$CONTENT" | grep -qE "from ['\"](@/|\.\./)*app/" 2>/dev/null; then
                ERRORS+=("features/ cannot import from app/")
            fi
            ;;
    esac
fi

# =============================================================================
# Python Import Rules
# =============================================================================
if [[ "$FILE_PATH" =~ \.py$ ]]; then
    case $LAYER in
        "repositories")
            if echo "$CONTENT" | grep -qE "from (app\.)?(services|routers)" 2>/dev/null; then
                ERRORS+=("repositories/ cannot import from services/ or routers/")
            fi
            ;;
        "services")
            if echo "$CONTENT" | grep -qE "from (app\.)?routers\.[a-z]" 2>/dev/null; then
                if ! echo "$CONTENT" | grep -qE "from (app\.)?routers\.(deps|dependencies)" 2>/dev/null; then
                    ERRORS+=("services/ cannot import from routers/")
                fi
            fi
            ;;
    esac
fi

# =============================================================================
# Report errors
# =============================================================================
if [[ ${#ERRORS[@]} -gt 0 ]]; then
    REASON="Import direction violation in $(basename "$FILE_PATH"): ${ERRORS[0]}"
    output_block "$REASON"
    exit 0
fi

output_silent_success
exit 0