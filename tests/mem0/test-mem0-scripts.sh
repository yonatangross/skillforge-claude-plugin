#!/bin/bash
# test-mem0-scripts.sh - Comprehensive tests for mem0 Python SDK scripts
# Part of SkillForge Claude Plugin test suite
#
# Tests:
# 1. Script structure (all 15 scripts + lib files exist)
# 2. Script execution (--help works, can be executed)
# 3. Import pattern (lib/mem0_client can be imported)
# 4. Script functionality (JSON output, error handling)
# 5. Integration (works from project root, Cursor perspective)

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Export for scripts
export CLAUDE_PROJECT_DIR="$PROJECT_ROOT"

# Scripts directory
SCRIPTS_DIR="$PROJECT_ROOT/skills/mem0-memory/scripts"
LIB_DIR="$SCRIPTS_DIR/lib"

# Test counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Colors
if [[ -t 1 ]]; then
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    BLUE='\033[0;34m'
    CYAN='\033[0;36m'
    NC='\033[0m'
else
    RED='' GREEN='' YELLOW='' BLUE='' CYAN='' NC=''
fi

# Test helpers
test_start() {
    local name="$1"
    echo -n "  ○ $name... "
    TESTS_RUN=$((TESTS_RUN + 1))
}

test_pass() {
    echo -e "${GREEN}PASS${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
}

test_fail() {
    local reason="${1:-}"
    echo -e "${RED}FAIL${NC}"
    [[ -n "$reason" ]] && echo "    └─ $reason"
    TESTS_FAILED=$((TESTS_FAILED + 1))
}

test_skip() {
    local reason="${1:-}"
    echo -e "${YELLOW}SKIP${NC}"
    [[ -n "$reason" ]] && echo "    └─ $reason"
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Mem0 Python Scripts Test Suite"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# =============================================================================
# Test Group 1: Script Structure
# =============================================================================

echo -e "${CYAN}Test Group 1: Script Structure${NC}"
echo "────────────────────────────────────────────────────────────────────────────"

test_scripts_directory_exists() {
    test_start "scripts directory exists"
    if [[ -d "$SCRIPTS_DIR" ]]; then
        test_pass
    else
        test_fail "Scripts directory not found: $SCRIPTS_DIR"
    fi
}

test_lib_directory_exists() {
    test_start "lib directory exists"
    if [[ -d "$LIB_DIR" ]]; then
        test_pass
    else
        test_fail "Lib directory not found: $LIB_DIR"
    fi
}

test_mem0_client_exists() {
    test_start "mem0_client.py exists"
    if [[ -f "$LIB_DIR/mem0_client.py" ]]; then
        test_pass
    else
        test_fail "mem0_client.py not found"
    fi
}

test_lib_init_exists() {
    test_start "lib/__init__.py exists"
    if [[ -f "$LIB_DIR/__init__.py" ]]; then
        test_pass
    else
        test_fail "lib/__init__.py not found"
    fi
}

test_requirements_exists() {
    test_start "requirements.txt exists"
    if [[ -f "$SCRIPTS_DIR/requirements.txt" ]]; then
        test_pass
    else
        test_fail "requirements.txt not found"
    fi
}

test_all_core_scripts_exist() {
    test_start "all 6 core scripts exist"
    local core_scripts=(
        "add-memory.py"
        "search-memories.py"
        "get-memories.py"
        "get-memory.py"
        "update-memory.py"
        "delete-memory.py"
    )
    local missing=()
    for script in "${core_scripts[@]}"; do
        if [[ ! -f "$SCRIPTS_DIR/$script" ]]; then
            missing+=("$script")
        fi
    done
    if [[ ${#missing[@]} -eq 0 ]]; then
        test_pass
    else
        test_fail "Missing scripts: ${missing[*]}"
    fi
}

test_all_advanced_scripts_exist() {
    test_start "all 9 advanced scripts exist"
    local advanced_scripts=(
        "batch-update.py"
        "batch-delete.py"
        "memory-history.py"
        "export-memories.py"
        "get-export.py"
        "memory-summary.py"
        "get-events.py"
        "get-users.py"
        "create-webhook.py"
    )
    local missing=()
    for script in "${advanced_scripts[@]}"; do
        if [[ ! -f "$SCRIPTS_DIR/$script" ]]; then
            missing+=("$script")
        fi
    done
    if [[ ${#missing[@]} -eq 0 ]]; then
        test_pass
    else
        test_fail "Missing scripts: ${missing[*]}"
    fi
}

test_scripts_directory_exists
test_lib_directory_exists
test_mem0_client_exists
test_lib_init_exists
test_requirements_exists
test_all_core_scripts_exist
test_all_advanced_scripts_exist

echo ""

# =============================================================================
# Test Group 2: Script Execution
# =============================================================================

echo -e "${CYAN}Test Group 2: Script Execution${NC}"
echo "────────────────────────────────────────────────────────────────────────────"

test_scripts_are_executable() {
    test_start "all scripts are executable"
    local non_executable=()
    for script in "$SCRIPTS_DIR"/*.py; do
        if [[ -f "$script" ]] && [[ ! -x "$script" ]]; then
            non_executable+=("$(basename "$script")")
        fi
    done
    if [[ ${#non_executable[@]} -eq 0 ]]; then
        test_pass
    else
        test_fail "Non-executable scripts: ${non_executable[*]}"
    fi
}

test_scripts_have_shebang() {
    test_start "all scripts have shebang"
    local missing_shebang=()
    for script in "$SCRIPTS_DIR"/*.py; do
        if [[ -f "$script" ]] && ! head -1 "$script" | grep -q "^#!/usr/bin/env python3"; then
            missing_shebang+=("$(basename "$script")")
        fi
    done
    if [[ ${#missing_shebang[@]} -eq 0 ]]; then
        test_pass
    else
        test_fail "Scripts missing shebang: ${missing_shebang[*]}"
    fi
}

test_core_scripts_show_help() {
    test_start "core scripts show --help"
    local core_scripts=("add-memory.py" "search-memories.py" "get-memories.py" "delete-memory.py")
    local failed=()
    for script in "${core_scripts[@]}"; do
        if ! python3 "$SCRIPTS_DIR/$script" --help >/dev/null 2>&1; then
            failed+=("$script")
        fi
    done
    if [[ ${#failed[@]} -eq 0 ]]; then
        test_pass
    else
        test_fail "Scripts failed --help: ${failed[*]}"
    fi
}

test_advanced_scripts_show_help() {
    test_start "advanced scripts show --help"
    local advanced_scripts=("batch-update.py" "memory-history.py" "export-memories.py")
    local failed=()
    for script in "${advanced_scripts[@]}"; do
        if ! python3 "$SCRIPTS_DIR/$script" --help >/dev/null 2>&1; then
            failed+=("$script")
        fi
    done
    if [[ ${#failed[@]} -eq 0 ]]; then
        test_pass
    else
        test_fail "Scripts failed --help: ${failed[*]}"
    fi
}

test_scripts_are_executable
test_scripts_have_shebang
test_core_scripts_show_help
test_advanced_scripts_show_help

echo ""

# =============================================================================
# Test Group 3: Import Pattern
# =============================================================================

echo -e "${CYAN}Test Group 3: Import Pattern${NC}"
echo "────────────────────────────────────────────────────────────────────────────"

test_import_pattern_in_scripts() {
    test_start "all scripts use correct import pattern"
    local scripts_missing_pattern=()
    for script in "$SCRIPTS_DIR"/*.py; do
        if [[ -f "$script" ]]; then
            if ! grep -q "_SCRIPT_DIR = Path(__file__).parent" "$script" || \
               ! grep -q "_LIB_DIR = _SCRIPT_DIR / \"lib\"" "$script" || \
               ! grep -q "from mem0_client import get_mem0_client" "$script"; then
                scripts_missing_pattern+=("$(basename "$script")")
            fi
        fi
    done
    if [[ ${#scripts_missing_pattern[@]} -eq 0 ]]; then
        test_pass
    else
        test_fail "Scripts missing import pattern: ${scripts_missing_pattern[*]}"
    fi
}

test_type_ignore_comments() {
    test_start "all scripts have type ignore comments"
    local scripts_missing_ignore=()
    for script in "$SCRIPTS_DIR"/*.py; do
        if [[ -f "$script" ]]; then
            if ! grep -q "# type: ignore" "$script"; then
                scripts_missing_ignore+=("$(basename "$script")")
            fi
        fi
    done
    if [[ ${#scripts_missing_ignore[@]} -eq 0 ]]; then
        test_pass
    else
        test_fail "Scripts missing type ignore: ${scripts_missing_ignore[*]}"
    fi
}

test_mem0_client_importable() {
    test_start "mem0_client can be imported (when mem0ai installed)"
    if ! python3 -c "from mem0 import MemoryClient" >/dev/null 2>&1; then
        test_skip "mem0ai not installed"
        return
    fi
    
    # Test import pattern from scripts directory
    local result
    result=$(cd "$SCRIPTS_DIR" && python3 << 'PYEOF'
import sys
from pathlib import Path
_SCRIPT_DIR = Path('.')
_LIB_DIR = _SCRIPT_DIR / 'lib'
if str(_LIB_DIR.resolve()) not in sys.path:
    sys.path.insert(0, str(_LIB_DIR.resolve()))
try:
    from mem0_client import get_mem0_client
    print("SUCCESS")
except Exception as e:
    print(f"FAILED: {e}")
    sys.exit(1)
PYEOF
)
    if echo "$result" | grep -q "SUCCESS"; then
        test_pass
    else
        test_fail "mem0_client import failed: $result"
    fi
}

test_import_pattern_in_scripts
test_type_ignore_comments
test_mem0_client_importable

echo ""

# =============================================================================
# Test Group 4: Script Functionality
# =============================================================================

echo -e "${CYAN}Test Group 4: Script Functionality${NC}"
echo "────────────────────────────────────────────────────────────────────────────"

test_add_memory_requires_args() {
    test_start "add-memory.py requires --text and --user-id"
    local output
    output=$(python3 "$SCRIPTS_DIR/add-memory.py" 2>&1 || true)
    # Check if output contains JSON (either in stdout or stderr)
    if echo "$output" | jq . >/dev/null 2>&1 || echo "$output" | grep -qi "required\|error"; then
        test_pass
    else
        test_fail "Script should output JSON error for missing args. Got: ${output:0:100}"
    fi
}

test_search_memories_requires_query() {
    test_start "search-memories.py requires --query"
    local output
    output=$(python3 "$SCRIPTS_DIR/search-memories.py" 2>&1 || true)
    # Check if output contains JSON or error message
    if echo "$output" | jq . >/dev/null 2>&1 || echo "$output" | grep -qi "required\|error"; then
        test_pass
    else
        test_fail "Script should output JSON error for missing query. Got: ${output:0:100}"
    fi
}

test_scripts_output_json() {
    test_start "scripts output JSON format"
    local scripts_failed=()
    # Test with valid args (should output JSON success or error)
    # add-memory.py
    local output1
    output1=$(python3 "$SCRIPTS_DIR/add-memory.py" --text "test" --user-id "test-user" 2>&1 || true)
    if echo "$output1" | jq . >/dev/null 2>&1; then
        : # Pass
    else
        scripts_failed+=("add-memory.py")
    fi
    
    # search-memories.py (needs user-id for filters)
    local output2
    output2=$(python3 "$SCRIPTS_DIR/search-memories.py" --query "test" --user-id "test-user" 2>&1 || true)
    if echo "$output2" | jq . >/dev/null 2>&1; then
        : # Pass
    else
        scripts_failed+=("search-memories.py")
    fi
    
    if [[ ${#scripts_failed[@]} -eq 0 ]]; then
        test_pass
    else
        test_fail "Scripts not outputting JSON: ${scripts_failed[*]}"
    fi
}

test_scripts_handle_missing_api_key() {
    test_start "scripts handle missing API key gracefully"
    # Unset API key for test
    local old_key="${MEM0_API_KEY:-}"
    unset MEM0_API_KEY
    
    local output
    output=$(python3 "$SCRIPTS_DIR/add-memory.py" --text "test" --user-id "test" 2>&1 || true)
    
    # Restore API key
    [[ -n "$old_key" ]] && export MEM0_API_KEY="$old_key"
    
    if echo "$output" | jq -e '.error' >/dev/null 2>&1 && \
       echo "$output" | grep -qi "MEM0_API_KEY"; then
        test_pass
    else
        test_fail "Script should output JSON error for missing API key"
    fi
}

test_add_memory_requires_args
test_search_memories_requires_query
test_scripts_output_json
test_scripts_handle_missing_api_key

echo ""

# =============================================================================
# Test Group 5: Integration (Project Root Execution)
# =============================================================================

echo -e "${CYAN}Test Group 5: Integration (Project Root)${NC}"
echo "────────────────────────────────────────────────────────────────────────────"

test_scripts_work_from_project_root() {
    test_start "scripts work from project root (Cursor perspective)"
    local script_path="$PROJECT_ROOT/skills/mem0-memory/scripts/add-memory.py"
    if python3 "$script_path" --help >/dev/null 2>&1; then
        test_pass
    else
        test_fail "Script failed from project root"
    fi
}

test_scripts_can_be_called_via_bash() {
    test_start "scripts can be called via bash tool"
    local script_path="$PROJECT_ROOT/skills/mem0-memory/scripts/search-memories.py"
    if bash -c "python3 '$script_path' --help" >/dev/null 2>&1; then
        test_pass
    else
        test_fail "Script failed via bash execution"
    fi
}

test_scripts_work_from_project_root
test_scripts_can_be_called_via_bash

echo ""

# =============================================================================
# Test Group 6: Error Handling
# =============================================================================

echo -e "${CYAN}Test Group 6: Error Handling${NC}"
echo "────────────────────────────────────────────────────────────────────────────"

test_error_output_is_json() {
    test_start "error output is valid JSON"
    # Unset API key to force error
    local old_key="${MEM0_API_KEY:-}"
    unset MEM0_API_KEY
    
    local output
    output=$(python3 "$SCRIPTS_DIR/add-memory.py" --text "test" --user-id "test" 2>&1 || true)
    
    # Restore API key
    [[ -n "$old_key" ]] && export MEM0_API_KEY="$old_key"
    
    # Check if output is JSON (could be in stderr)
    if echo "$output" | jq . >/dev/null 2>&1; then
        test_pass
    else
        test_fail "Error output is not valid JSON. Got: ${output:0:100}"
    fi
}

test_error_has_type_field() {
    test_start "error output includes type field"
    # Unset API key to force error
    local old_key="${MEM0_API_KEY:-}"
    unset MEM0_API_KEY
    
    local output
    output=$(python3 "$SCRIPTS_DIR/add-memory.py" --text "test" --user-id "test" 2>&1 || true)
    
    # Restore API key
    [[ -n "$old_key" ]] && export MEM0_API_KEY="$old_key"
    
    # Extract JSON from output (might be mixed with Python errors)
    local json_part
    json_part=$(echo "$output" | grep -o '{.*}' | head -1 || echo "$output")
    
    if echo "$json_part" | jq -e '.type' >/dev/null 2>&1; then
        test_pass
    else
        test_fail "Error output missing 'type' field. Output: ${output:0:150}"
    fi
}

test_error_output_is_json
test_error_has_type_field

echo ""

# =============================================================================
# Summary
# =============================================================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Test Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "  ${GREEN}Passed:          $TESTS_PASSED${NC}"
echo -e "  ${RED}Failed:          $TESTS_FAILED${NC}"
echo -e "  ${YELLOW}Total:           $TESTS_RUN${NC}"
echo ""

if [[ $TESTS_FAILED -eq 0 ]]; then
    echo -e "${GREEN}SUCCESS: All mem0 script tests passed!${NC}"
    exit 0
else
    echo -e "${RED}FAILED: $TESTS_FAILED test(s) failed${NC}"
    exit 1
fi
