#!/bin/bash
# ============================================================================
# CI Environment Setup Script
# ============================================================================
# Standardized setup for GitHub Actions runners
# Handles unreliable third-party package mirrors gracefully
#
# Usage: ./bin/ci-setup.sh [--with-shellcheck]
#
# Industry best practices (2026):
# - Remove unused third-party repos before apt-get update
# - Fail gracefully on mirror issues
# - Centralize dependency installation
# ============================================================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[CI-SETUP]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[CI-SETUP]${NC} $1"; }
log_error() { echo -e "${RED}[CI-SETUP]${NC} $1"; }

# ============================================================================
# MAIN SETUP
# ============================================================================

main() {
    local with_shellcheck=false

    # Parse arguments
    for arg in "$@"; do
        case $arg in
            --with-shellcheck)
                with_shellcheck=true
                ;;
        esac
    done

    log_info "Starting CI environment setup..."

    # Only run apt-get on Linux
    if [[ "$(uname)" == "Linux" ]]; then
        setup_linux "$with_shellcheck"
    elif [[ "$(uname)" == "Darwin" ]]; then
        setup_macos "$with_shellcheck"
    else
        log_warn "Unknown OS: $(uname), skipping package setup"
    fi

    log_info "CI environment setup complete!"
}

# ============================================================================
# LINUX SETUP (Ubuntu GitHub Runners)
# ============================================================================

setup_linux() {
    local with_shellcheck="$1"

    log_info "Configuring Linux environment..."

    # Remove unreliable third-party repos we don't need
    # These come pre-installed on GitHub runners and can cause 403 errors
    log_info "Removing unused third-party package sources..."

    local repos_to_remove=(
        "/etc/apt/sources.list.d/microsoft-prod.list"
        "/etc/apt/sources.list.d/azure-cli.list"
        "/etc/apt/sources.list.d/github_git-lfs.list"
        "/etc/apt/sources.list.d/mono-official-stable.list"
    )

    for repo in "${repos_to_remove[@]}"; do
        if [[ -f "$repo" ]]; then
            sudo rm -f "$repo" && log_info "Removed: $repo"
        fi
    done

    # Update package lists (Ubuntu official repos only now)
    log_info "Updating package lists..."
    if ! sudo apt-get update -qq; then
        log_warn "apt-get update had issues, continuing anyway..."
    fi

    # Install required dependencies
    log_info "Installing dependencies..."
    local packages=("jq")

    if [[ "$with_shellcheck" == "true" ]]; then
        packages+=("shellcheck")
    fi

    sudo apt-get install -y -qq "${packages[@]}"

    log_info "Linux setup complete"
}

# ============================================================================
# MACOS SETUP
# ============================================================================

setup_macos() {
    local with_shellcheck="$1"

    log_info "Configuring macOS environment..."

    # Check if Homebrew is available
    if ! command -v brew &> /dev/null; then
        log_error "Homebrew not found. Please install Homebrew first."
        exit 1
    fi

    # Install dependencies
    log_info "Installing dependencies via Homebrew..."
    brew install jq

    if [[ "$with_shellcheck" == "true" ]]; then
        brew install shellcheck
    fi

    log_info "macOS setup complete"
}

# Run main
main "$@"
