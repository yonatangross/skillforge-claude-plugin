#!/bin/bash
# =============================================================================
# backend-file-naming.sh
# BLOCKING: Backend files must follow naming conventions
# CC 2.1.7 Compliant: Self-contained hook with stdin reading and self-guard
# =============================================================================
set -euo pipefail

# Read stdin BEFORE sourcing common.sh
_HOOK_INPUT=$(cat)
# Dont export - large inputs overflow environment

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../_lib/common.sh"

# Self-guard: Only run for Python files
guard_python_files || exit 0

# Get file path
FILE_PATH=$(get_field '.tool_input.file_path')
[[ -z "$FILE_PATH" ]] && { output_silent_success; exit 0; }

# Skip if not in an app/ or backend/ directory
if [[ ! "$FILE_PATH" =~ /app/ ]] && [[ ! "$FILE_PATH" =~ /backend/ ]]; then
    output_silent_success
    exit 0
fi

FILENAME=$(basename "$FILE_PATH")
DIRNAME=$(dirname "$FILE_PATH")
ERRORS=()

# Skip __init__.py files
[[ "$FILENAME" == "__init__.py" ]] && { output_silent_success; exit 0; }

# =============================================================================
# Router naming conventions
# =============================================================================
if [[ "$DIRNAME" =~ /routers$ ]] || [[ "$DIRNAME" =~ /routers/ ]]; then
    if [[ ! "$FILENAME" =~ ^(router_|routes_|api_).*\.py$ ]] && \
       [[ ! "$FILENAME" =~ ^(deps|dependencies|utils|helpers|base)\.py$ ]]; then
        ERRORS+=("ROUTER NAMING: Files in routers/ must be prefixed")
        ERRORS+=("  Got: $FILENAME")
        ERRORS+=("  Expected: router_*.py, routes_*.py, api_*.py, deps.py")
    fi
fi

# =============================================================================
# Service naming conventions
# =============================================================================
if [[ "$DIRNAME" =~ /services$ ]] || [[ "$DIRNAME" =~ /services/ ]]; then
    if [[ ! "$FILENAME" =~ _service\.py$ ]] && \
       [[ ! "$FILENAME" =~ ^(base|utils|helpers|abstract)\.py$ ]]; then
        ERRORS+=("SERVICE NAMING: Files in services/ must end with _service.py")
        ERRORS+=("  Got: $FILENAME")
        ERRORS+=("  Expected: *_service.py, base.py, utils.py")
    fi
fi

# =============================================================================
# Repository naming conventions
# =============================================================================
if [[ "$DIRNAME" =~ /repositories$ ]] || [[ "$DIRNAME" =~ /repositories/ ]]; then
    if [[ ! "$FILENAME" =~ _(repository|repo)\.py$ ]] && \
       [[ ! "$FILENAME" =~ ^(base|abstract|utils)\.py$ ]]; then
        ERRORS+=("REPOSITORY NAMING: Files in repositories/ must end with _repository.py")
        ERRORS+=("  Got: $FILENAME")
        ERRORS+=("  Expected: *_repository.py, *_repo.py, base.py")
    fi
fi

# =============================================================================
# Schema naming conventions
# =============================================================================
if [[ "$DIRNAME" =~ /schemas$ ]] || [[ "$DIRNAME" =~ /schemas/ ]]; then
    if [[ ! "$FILENAME" =~ _(schema|dto|request|response)\.py$ ]] && \
       [[ ! "$FILENAME" =~ ^(base|common|shared|utils)\.py$ ]]; then
        ERRORS+=("SCHEMA NAMING: Files in schemas/ must use proper suffix")
        ERRORS+=("  Got: $FILENAME")
        ERRORS+=("  Expected: *_schema.py, *_dto.py, *_request.py, *_response.py")
    fi
fi

# =============================================================================
# Model naming conventions
# =============================================================================
if [[ "$DIRNAME" =~ /models$ ]] || [[ "$DIRNAME" =~ /models/ ]]; then
    if [[ ! "$FILENAME" =~ _(model|entity|orm)\.py$ ]] && \
       [[ ! "$FILENAME" =~ ^(base|abstract|mixins)\.py$ ]]; then
        ERRORS+=("MODEL NAMING: Files in models/ must use proper suffix")
        ERRORS+=("  Got: $FILENAME")
        ERRORS+=("  Expected: *_model.py, *_entity.py, *_orm.py, base.py")
    fi
fi

# =============================================================================
# General Python naming conventions - PascalCase check
# =============================================================================
if [[ "$FILENAME" =~ ^[A-Z][a-zA-Z]+\.py$ ]]; then
    ERRORS+=("NAMING: Python files should use snake_case, not PascalCase")
    ERRORS+=("  Got: $FILENAME")
fi

# =============================================================================
# Report errors and block
# =============================================================================
if [[ ${#ERRORS[@]} -gt 0 ]]; then
    REASON="Backend naming violation in $FILENAME: ${ERRORS[0]}"
    output_block "$REASON"
    exit 0
fi

output_silent_success
exit 0