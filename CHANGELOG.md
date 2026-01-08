# Changelog

All notable changes to the SkillForge Claude Code Plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [4.5.0] - 2026-01-08

### Added

#### Claude Code 2.1.1 Full Feature Utilization

This release fully leverages Claude Code 2.1.1 capabilities, upgrading the plugin from 6.5/10 to 9.5/10 maturity.

**Engine Requirement**
- Plugin now requires Claude Code `>=2.1.0`

**SubagentStart Hooks** (NEW hook type)
- `subagent-resource-allocator.sh` - Pre-allocates context resources before subagent spawn
- `subagent-context-stager.sh` - Stages relevant context based on task type

**SubagentStop Hooks** (NEW hook type)
- `subagent-completion-tracker.sh` - Tracks subagent completion metrics
- `subagent-quality-gate.sh` - Validates subagent output quality
- `coverage-threshold-gate.sh` - Enforces test coverage thresholds

**Input Modification Hooks** (NEW hook capability)
- `path-normalizer.sh` - Normalizes file paths to absolute paths for Read/Write/Edit/Glob/Grep
- `bash-defaults.sh` - Adds default timeout and prevents dangerous bash commands
- `write-headers.sh` - Adds standard file headers to new files

**Hook Chain Orchestration**
- `chain-config.json` - Centralized configuration for hook sequences
- `chain-executor.sh` - Sequential execution with timeout/retry support
- 4 predefined chains: error_handling, security_validation, test_workflow, code_quality

**Agent-Level Hooks** (all 20 agents)
- `output-validator.sh` - Validates agent output quality and completeness
- `context-publisher.sh` - Publishes agent decisions to shared context
- `handoff-preparer.sh` - Prepares context for next agent in pipeline (10 pipeline agents)

**Skill-Level Hooks** (all 68 skills)
- Testing skills: `test-runner.sh`, `coverage-check.sh`
- Security skills: `security-summary.sh`, `redact-secrets.sh`
- Code review skills: `review-summary-generator.sh`
- Architecture skills: `design-decision-saver.sh`
- Database skills: `migration-validator.sh`
- LLM/AI skills: `eval-metrics-collector.sh`
- Evidence skills: `evidence-collector.sh`

**MCP Tool Annotations**
- Added metadata for 6 tool patterns with safety, cost, and category flags
- Wildcard permission syntax: `mcp__server__*` for bulk tool approval
- Auto-approve and require-confirmation lists
- Fallback configuration for context7 and sequential-thinking
- Notification settings with refresh intervals

**Model Fallback Chains**
- 15+ complex skills now have `model-alternatives` for resilience
- Primary: opus → Fallback: sonnet → Last resort: haiku

**Workflow Auto-Triggers** (all 5 workflows)
- Keyword detection with 0.8 confidence threshold
- Auto-launch capability for matching patterns
- Keywords for: frontend-2025-compliance, api-design-compliance, security-audit-workflow, data-pipeline-workflow, ai-integration-workflow

**Dependency Graph**
- 42 skill-to-agent mappings across 8 domains
- 8 agent pipeline sequences defined:
  - product-thinking: market-intelligence → product-strategist → prioritization-analyst
  - full-stack-feature: requirements → backend → database → frontend → test → review
  - security-audit: security-auditor → code-quality-reviewer
  - ai-integration: llm-integrator → workflow-architect → data-pipeline-engineer
  - database-feature: database-engineer → backend-system-architect
  - ui-feature: rapid-ui-designer → frontend-ui-developer
  - bug-investigation: debug-investigator → test-generator
  - system-review: backend-system-architect → metrics-architect

**Security Manifest**
- Required permissions: read_project, write_project, execute_bash, call_llm
- Denied operations: delete_outside_project, execute_system_commands, network_without_approval
- 11 sensitive file patterns protected (*.env, *.pem, *.key, *credentials*, etc.)

**Tool Restrictions** (8 security-critical skills)
- `security-scanning`: Read, Grep, Glob, Bash (controlled)
- `owasp-top-10`: Read, Grep, Glob (read-only)
- `input-validation`: Read, Grep, Glob, Write, Edit
- `defense-in-depth`: Read, Grep, Glob (read-only)
- `auth-patterns`: Read, Grep, Glob, Write, Edit, Bash (full)
- `golden-dataset-management`: Read, Grep, Glob, Bash
- `golden-dataset-validation`: Read, Grep, Glob (read-only)
- `evidence-verification`: Read, Grep, Glob, Bash

### Changed

- `plugin.json` version bumped to 4.5.0
- Engine requirement updated from `>=1.0.0` to `>=2.1.0`
- All workflows now have `auto_trigger` configuration
- All agents now have Stop hooks for validation and context publishing
- All skills now have PostToolUse and Stop event hooks

### Fixed

- Agent pipeline sequencing now properly chains 10 pipeline agents
- MCP tool permissions now use proper wildcard syntax
- Hook execution order guaranteed through chain orchestration

---

## [4.4.1] - 2026-01-08

### Fixed

#### Version Consistency
- Updated `plugin.json` version from 1.0.0 to 4.4.1
- Updated `marketplace.json` version from 1.0.0 to 4.4.1
- Renamed `motion-animation-patterns/skill.md` to `SKILL.md` for consistency with other skills

#### Missing Metadata
- Added `capabilities.json` for `motion-animation-patterns` skill
- Added `capabilities.json` for `langgraph-human-in-loop` skill

### Added

#### MCP Configuration
- Added `.mcp.json` for MCP project-scope server configuration (Claude Code 2025+ feature)
- Pre-configured servers: context7, sequential-thinking, memory, playwright

---

## [4.4.0] - 2026-01-06

### Added

#### New Skills
- `motion-animation-patterns` - Motion (Framer Motion) animations, page transitions, modal effects, stagger lists, RTL support
- `i18n-date-patterns` - Internationalization, date formatting with dayjs, useFormatting hook, ICU MessageFormat, Trans component

#### Enhanced Skills (expanded with capabilities.json, checklists, examples)
- `e2e-testing` - Full Playwright 1.57+ patterns with AI-assisted test generation
- `auth-patterns` - JWT, OAuth, session management, password security
- `llm-testing` - LLM application testing, mocking, async timeouts
- `embeddings` - Embedding models, chunking strategies, similarity search
- `function-calling` - Tool use patterns for OpenAI, Anthropic, Ollama
- `input-validation` - Zod v4, sanitization, injection prevention
- `msw-mocking` - Mock Service Worker patterns for React testing
- `vcr-http-recording` - VCR.py for Python HTTP recording
- `langgraph-checkpoints` - Fault-tolerant checkpointing and recovery
- `langgraph-state` - State management and persistence
- `langgraph-parallel` - Fan-out/fan-in parallel execution
- `langgraph-routing` - Semantic routing and conditional branching
- `langgraph-supervisor` - Supervisor-worker orchestration
- `langgraph-human-in-loop` - Human approval and intervention
- `llm-evaluation` - Quality scoring, LLM-as-judge patterns
- `llm-streaming` - Token streaming, SSE patterns
- `multi-agent-orchestration` - Agent coordination and synthesis
- `test-data-management` - Test fixtures and factories
- `performance-testing` - k6 and Locust load testing
- `cache-cost-tracking` - LLM cost tracking and optimization
- `llm-safety-patterns` - Safety checklists and context separation

### Changed

#### Agent Updates
- `frontend-ui-developer` - Added Motion animations, i18n date patterns, Tailwind @theme utilities
- `rapid-ui-designer` - Added animation specs with Motion presets
- `code-quality-reviewer` - Added i18n date pattern checking (v3.8.0)
- `design-system-starter` - Added animation-tokens to provides

#### Workflow Updates
- `frontend-2025-compliance` - Added Motion and i18n skills, updated checklist with skeleton pulse, AnimatePresence, i18n dates

#### Pattern Updates
- New `frontend-animation-patterns.md` context pattern

### Fixed
- Removed project-specific references, now uses generic "SkillForge Team" branding

---

## [1.0.0] - 2025-01-01

### Initial Release

The first public release of the SkillForge plugin for Claude Code, providing comprehensive AI-native development capabilities.

### Added

#### Skills (33 total)

**AI Development**
- `ai-native-development` - RAG pipelines, embeddings, vector databases, agentic workflows
- `langgraph-workflows` - Multi-agent workflows with LangGraph 1.0
- `llm-caching-patterns` - Multi-level caching strategies for LLM applications
- `llm-safety-patterns` - Secure LLM integration patterns
- `langfuse-observability` - LLM observability with self-hosted Langfuse
- `pgvector-search` - Production hybrid search with PGVector + BM25
- `golden-dataset-curation` - Quality criteria for golden dataset entries
- `golden-dataset-management` - Backup, restore, and validate golden datasets
- `golden-dataset-validation` - Validation rules and schema checks

**Backend Development**
- `api-design-framework` - REST, GraphQL, and gRPC API design patterns
- `database-schema-designer` - Database schema design for SQL and NoSQL
- `streaming-api-patterns` - Real-time data streaming with SSE and WebSockets
- `type-safety-validation` - End-to-end type safety with Zod, tRPC, Prisma

**Frontend Development**
- `react-server-components-framework` - React Server Components with Next.js 15
- `design-system-starter` - Design systems with tokens and accessibility
- `performance-optimization` - Full-stack performance analysis and optimization

**DevOps & Infrastructure**
- `devops-deployment` - CI/CD pipelines, containerization, Kubernetes
- `edge-computing-patterns` - Edge runtime deployment patterns
- `observability-monitoring` - Structured logging, metrics, distributed tracing

**Security**
- `security-checklist` - OWASP Top 10 mitigations and security audits
- `defense-in-depth` - Multi-layer security architecture for AI systems

**Architecture & Design**
- `architecture-decision-record` - ADR templates following Nygard format
- `system-design-interrogation` - Systematic questioning for system design
- `brainstorming` - Structured Socratic questioning for idea development

**Testing & Quality**
- `testing-strategy-builder` - Comprehensive testing strategies
- `code-review-playbook` - Structured review processes and checklists
- `webapp-testing` - Playwright testing with autonomous test agents

**Workflow & Tools**
- `github-cli` - GitHub CLI mastery for issues, PRs, and automation
- `ascii-visualizer` - ASCII art visualizations for architectures
- `browser-content-capture` - Capture content from JS-rendered pages

#### Commands (10 total)

- `/implement` - Full-power feature implementation with parallel subagents
- `/brainstorm` - Multi-perspective idea exploration
- `/explore` - Deep codebase exploration with specialized agents
- `/run-tests` - Comprehensive test execution with parallel analysis
- `/verify` - Feature verification with highest standards
- `/fix-issue` - Fix GitHub issues with parallel analysis
- `/review-pr` - Comprehensive PR review with code quality agents
- `/create-pr` - Create PR with validation and auto-generated description
- `/commit` - Smart commit with validation and auto-generated message
- `/add-golden` - Curate and add documents to golden dataset

#### Agents (14 total)

- `implementation-agent` - Feature implementation specialist
- `testing-agent` - Test creation and execution
- `review-agent` - Code review and quality analysis
- `security-agent` - Security vulnerability detection
- `performance-agent` - Performance optimization analysis
- `documentation-agent` - Documentation generation
- `refactoring-agent` - Code refactoring specialist
- `debugging-agent` - Bug investigation and resolution
- `architecture-agent` - System design and architecture
- `database-agent` - Database schema and query optimization
- `frontend-agent` - React and UI development
- `backend-agent` - API and service development
- `devops-agent` - CI/CD and infrastructure
- `observability-agent` - Logging, metrics, and tracing

### Security

- All hook scripts hardened with `set -euo pipefail`
- No use of `eval` or dynamic code execution
- No network calls in hooks
- All user input properly escaped and validated
- Common utilities extracted to `common.sh` for consistent security patterns

### Documentation

- Comprehensive README with installation and usage instructions
- CONTRIBUTING.md with guidelines for adding skills, commands, and agents
- MIT License for open source distribution
- This CHANGELOG for tracking version history

---

## Future Releases

Planned enhancements for future versions:

- Additional language-specific skills (Rust, Go, Python advanced patterns)
- Integration with more observability platforms
- Enhanced testing automation capabilities
- Community-contributed skills and agents

[1.0.0]: https://github.com/SkillForge/claude-plugin/releases/tag/v1.0.0
