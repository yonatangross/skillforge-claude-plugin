#!/bin/bash
# =============================================================================
# test-location-validator.sh
# BLOCKING: Tests must be in correct location
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

FILENAME=$(basename "$FILE_PATH")

# =============================================================================
# Detect if file is a test file
# =============================================================================
IS_TEST_FILE=false

# TypeScript/JavaScript test patterns
if [[ "$FILE_PATH" =~ \.(test|spec)\.(ts|tsx|js|jsx)$ ]]; then
    IS_TEST_FILE=true
fi

# Python test patterns
if [[ "$FILE_PATH" =~ (^|/)test_[^/]*\.py$ ]] || [[ "$FILE_PATH" =~ _test\.py$ ]]; then
    IS_TEST_FILE=true
fi

# =============================================================================
# Rule 1: Test files MUST be in test directories
# =============================================================================
if [[ "$IS_TEST_FILE" == "true" ]]; then
    if [[ ! "$FILE_PATH" =~ (tests/|__tests__/|/test/|test/) ]]; then
        output_block "Test file must be in tests/, __tests__/, or test/ directory: $FILENAME"
        exit 0
    fi
fi

# =============================================================================
# Rule 2: Source files CANNOT be in test directories
# =============================================================================
if [[ "$IS_TEST_FILE" == "false" ]] && [[ "$FILE_PATH" =~ (tests/|__tests__/|/test/) ]]; then
    # Allow certain files in test directories
    if [[ "$FILENAME" =~ ^(conftest|fixtures|factories|mocks|__init__|setup|helpers|utils)\.py$ ]] || \
       [[ "$FILENAME" =~ ^(setup|helpers|utils|mocks|fixtures)\.(ts|js)$ ]] || \
       [[ "$FILE_PATH" =~ /(fixtures|mocks|factories|__mocks__)/ ]]; then
        output_silent_success
        exit 0
    fi

    output_block "Source files cannot be in test directories: $FILENAME"
    exit 0
fi

# =============================================================================
# Rule 3: TypeScript/JavaScript tests must use .test or .spec suffix
# =============================================================================
if [[ "$FILE_PATH" =~ \.(ts|tsx|js|jsx)$ ]] && [[ "$FILE_PATH" =~ (tests/|__tests__/) ]]; then
    # Skip setup/utility files
    if [[ "$FILENAME" =~ ^(setup|jest|vitest|config|helpers|utils|mocks)\. ]]; then
        output_silent_success
        exit 0
    fi

    # Must have .test or .spec suffix
    if [[ ! "$FILENAME" =~ \.(test|spec)\.(ts|tsx|js|jsx)$ ]]; then
        output_block "Test files must use .test.ts or .spec.ts suffix: $FILENAME"
        exit 0
    fi
fi

# =============================================================================
# Rule 4: Python tests must follow naming convention
# =============================================================================
if [[ "$FILE_PATH" =~ \.py$ ]] && [[ "$FILE_PATH" =~ (tests/|/test/) ]]; then
    # Skip utility files
    if [[ "$FILENAME" =~ ^(conftest|__init__|fixtures|factories|mocks|helpers)\.py$ ]]; then
        output_silent_success
        exit 0
    fi

    # Must start with test_ or end with _test.py
    if [[ ! "$FILENAME" =~ ^test_.*\.py$ ]] && [[ ! "$FILENAME" =~ _test\.py$ ]]; then
        output_block "Python test files must be named test_*.py or *_test.py: $FILENAME"
        exit 0
    fi
fi

output_silent_success
exit 0
