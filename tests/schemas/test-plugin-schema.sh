#!/usr/bin/env bash
# test-plugin-schema.sh - Validate plugin.json schema compliance
# Ensures plugin.json conforms to Claude Code's expected schema
#
# Based on official CC plugin format:
# - Required fields: name, version, description
# - Optional fields: author, homepage, repository, license, hooks, lspServers, keywords
# - Invalid fields: engine, agents (as string), skills (as string)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="${SCRIPT_DIR}/../.."
PLUGIN_FILE="${ROOT_DIR}/.claude-plugin/plugin.json"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

errors=0
warnings=0

log_error() {
    echo -e "${RED}ERROR:${NC} $*"
    errors=$((errors + 1))
}

log_warning() {
    echo -e "${YELLOW}WARNING:${NC} $*"
    warnings=$((warnings + 1))
}

log_success() {
    echo -e "${GREEN}OK:${NC} $*"
}

log_info() {
    echo "INFO: $*"
}

# Check if plugin.json exists
if [[ ! -f "$PLUGIN_FILE" ]]; then
    log_info "No plugin.json found at $PLUGIN_FILE - skipping"
    exit 0
fi

echo "========================================"
echo "  Plugin.json Schema Validation"
echo "========================================"
echo ""

# 1. Validate JSON syntax
echo "1. Validating JSON syntax..."
if ! jq empty "$PLUGIN_FILE" 2>/dev/null; then
    log_error "plugin.json is not valid JSON"
    exit 1
fi
log_success "JSON syntax is valid"

# 2. Check required fields
echo ""
echo "2. Checking required fields..."
required_fields=("name" "version" "description")
for field in "${required_fields[@]}"; do
    value=$(jq -r ".$field // empty" "$PLUGIN_FILE")
    if [[ -z "$value" ]]; then
        log_error "Missing required field: $field"
    else
        log_success "Field '$field' present"
    fi
done

# 3. Validate version format (semver)
echo ""
echo "3. Validating version format..."
version=$(jq -r '.version // ""' "$PLUGIN_FILE")
if [[ ! "$version" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.]+)?(\+[a-zA-Z0-9.]+)?$ ]]; then
    log_error "Invalid version format: '$version' (expected semver like 1.0.0)"
else
    log_success "Version '$version' is valid semver"
fi

# 4. Check for INVALID fields (cause CC schema errors)
echo ""
echo "4. Checking for invalid fields..."

# engine is NOT allowed in plugin.json (only in marketplace.json)
if jq -e '.engine' "$PLUGIN_FILE" >/dev/null 2>&1; then
    log_error "'engine' field is not allowed in plugin.json (use marketplace.json instead)"
fi

# agents as string is invalid
agents_type=$(jq -r '.agents | type' "$PLUGIN_FILE" 2>/dev/null || echo "null")
if [[ "$agents_type" == "string" ]]; then
    log_error "'agents' field as string is invalid (should be array or omitted for auto-discovery)"
fi

# skills as string is invalid
skills_type=$(jq -r '.skills | type' "$PLUGIN_FILE" 2>/dev/null || echo "null")
if [[ "$skills_type" == "string" ]]; then
    log_error "'skills' field as string is invalid (should be array or omitted for auto-discovery)"
fi

if [[ $errors -eq 0 ]]; then
    log_success "No invalid fields found"
fi

# 5. Validate hooks structure (if present)
echo ""
echo "5. Validating hooks structure..."
if jq -e '.hooks' "$PLUGIN_FILE" >/dev/null 2>&1; then
    hooks_type=$(jq -r '.hooks | type' "$PLUGIN_FILE")
    if [[ "$hooks_type" != "object" ]]; then
        log_error "'hooks' should be an object, got $hooks_type"
    else
        # Check that hook events are valid
        valid_events='["PreToolUse", "PostToolUse", "PermissionRequest", "UserPromptSubmit", "SessionStart", "SessionEnd", "Stop", "SubagentStart", "SubagentStop", "Notification", "Setup"]'
        invalid_events=$(jq -r --argjson valid "$valid_events" '.hooks | keys | map(select(. as $k | $valid | index($k) | not)) | .[]' "$PLUGIN_FILE" 2>/dev/null || true)
        if [[ -n "$invalid_events" ]]; then
            while IFS= read -r event; do
                log_warning "Unknown hook event: '$event'"
            done <<< "$invalid_events"
        else
            log_success "All hook events are valid"
        fi
    fi
else
    log_info "No hooks defined (optional)"
fi

# 6. Validate author structure (if present)
echo ""
echo "6. Validating author structure..."
if jq -e '.author' "$PLUGIN_FILE" >/dev/null 2>&1; then
    author_type=$(jq -r '.author | type' "$PLUGIN_FILE")
    if [[ "$author_type" == "object" ]]; then
        # Check for name field
        author_name=$(jq -r '.author.name // empty' "$PLUGIN_FILE")
        if [[ -z "$author_name" ]]; then
            log_warning "author.name is recommended"
        else
            log_success "Author structure is valid"
        fi
    elif [[ "$author_type" == "string" ]]; then
        log_success "Author is a string (valid)"
    else
        log_warning "Author has unexpected type: $author_type"
    fi
else
    log_info "No author defined (optional)"
fi

# 7. Summary
echo ""
echo "========================================"
echo "  Validation Summary"
echo "========================================"
echo ""
echo "Errors: $errors"
echo "Warnings: $warnings"
echo ""

if [[ $errors -gt 0 ]]; then
    echo -e "${RED}FAILED: $errors errors found${NC}"
    exit 1
fi

if [[ $warnings -gt 0 ]]; then
    echo -e "${YELLOW}PASSED with $warnings warnings${NC}"
else
    echo -e "${GREEN}PASSED: All validations successful${NC}"
fi

exit 0
