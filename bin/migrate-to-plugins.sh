#!/usr/bin/env bash
# Migrates from monolithic ork to modular plugins

set -e

echo "Migrating from ork (monolithic) to modular plugins..."
echo "This will install all 33 core plugins"
echo ""

# Check if ork is installed
if [ -d "$HOME/.claude/plugins/ork" ]; then
    echo "Found existing ork installation"
    read -p "Do you want to uninstall the monolithic ork plugin? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Uninstalling monolithic ork..."
        # Note: Actual uninstall would be done via Claude Code CLI
        echo "Please run: /plugin uninstall ork"
    fi
fi

echo ""
echo "Installing all 33 OrchestKit plugins..."
echo ""
echo "Core Infrastructure:"
echo "  - ork-core (required)"
echo "  - ork-context"
echo "  - ork-memory"
echo ""
echo "AI/LLM Domain:"
echo "  - ork-rag"
echo "  - ork-rag-advanced"
echo "  - ork-langgraph-core"
echo "  - ork-langgraph-advanced"
echo "  - ork-llm-core"
echo "  - ork-llm-advanced"
echo "  - ork-ai-observability"
echo ""
echo "Data & Evaluation:"
echo "  - ork-data-engineering"
echo "  - ork-evaluation"
echo "  - ork-product"
echo ""
echo "Backend Domain:"
echo "  - ork-fastapi"
echo "  - ork-database"
echo "  - ork-async"
echo "  - ork-architecture"
echo "  - ork-backend-advanced"
echo ""
echo "Frontend Domain:"
echo "  - ork-react-core"
echo "  - ork-ui-design"
echo "  - ork-frontend-performance"
echo "  - ork-frontend-advanced"
echo ""
echo "Testing Domain:"
echo "  - ork-testing-core"
echo "  - ork-testing-e2e"
echo ""
echo "Other:"
echo "  - ork-security"
echo "  - ork-cicd"
echo "  - ork-infrastructure"
echo "  - ork-git"
echo "  - ork-accessibility"
echo "  - ork-workflows-core"
echo "  - ork-workflows-advanced"
echo "  - ork-mcp"
echo "  - ork-graphql"
echo ""
echo "To install, run:"
echo "  /plugin install ork-core ork-context ork-memory ork-rag ork-rag-advanced ork-langgraph-core ork-langgraph-advanced ork-llm-core ork-llm-advanced ork-ai-observability ork-data-engineering ork-evaluation ork-product ork-fastapi ork-database ork-async ork-architecture ork-backend-advanced ork-react-core ork-ui-design ork-frontend-performance ork-frontend-advanced ork-testing-core ork-testing-e2e ork-security ork-cicd ork-infrastructure ork-git ork-accessibility ork-workflows-core ork-workflows-advanced ork-mcp ork-graphql"
echo ""
echo "Or install minimal set:"
echo "  /plugin install ork-core ork-backend ork-frontend ork-testing"
echo ""
