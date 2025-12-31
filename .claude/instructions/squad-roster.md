# Squad Roster Configuration

## Supervisor Tier
**Single instance, coordinates all agents**

### studio-coach (Supervisor)
- **Model**: claude-3-opus-20240229 (latest Opus for highest reasoning)
- **Instances**: 1
- **Token Limit**: 16,000
- **Role**: Task allocation, validation gates, error recovery
- **Tools**: Task, Write, Read
- **Never**: Writes implementation code

## Core Squad
**Essential agents for feature development**

### frontend-ui-developer
- **Model**: claude-3-sonnet
- **Instances**: 2 (can work on different components in parallel)
- **Token Limit**: 8,000
- **Specialization**: React/Vue/Angular components, state management
- **2025 Expertise**: React Server Components (RSC), Next.js 15 App Router, Server Actions, Streaming SSR with Suspense, Tailwind 4 CSS-first, Modern CSS (container queries, View Transitions, oklch), Turbopack/Vite 6, tRPC client integration, Edge middleware
- **Domain**: frontend/src/**, components/**, hooks/**, app/**(Next.js)
- **Tools**: Read, Edit, MultiEdit, Write, Bash, Grep, Glob

### backend-system-architect
- **Model**: claude-3-sonnet
- **Instances**: 1
- **Token Limit**: 8,000
- **Specialization**: API design, database schemas, authentication
- **2025 Expertise**: Edge Computing (Cloudflare Workers, Vercel Edge, Deno Deploy), Streaming APIs (SSE, WebSockets, backpressure), Type Safety (tRPC, Zod, Prisma), Server Actions, Route Handlers, AI Integration (LLM APIs, vector databases), OpenTelemetry observability
- **Domain**: backend/**, api/**, database/**, edge/**
- **Tools**: Read, Edit, MultiEdit, Write, Bash, Grep, Glob

### ai-ml-engineer
- **Model**: claude-3-sonnet
- **Instances**: 1
- **Token Limit**: 8,000
- **Specialization**: LLM integration, prompt engineering, AI features
- **2025 Expertise**: RAG pipelines (Pinecone, Weaviate, Chroma), Vector databases & embeddings, Agentic workflows (ReAct, multi-agent), LLM streaming responses, Function calling & tool use, Prompt caching & optimization, AI observability (LangSmith, LangFuse), Cost management
- **Domain**: ml/**, models/**, prompts/**, embeddings/**, agents/**
- **Tools**: Read, Edit, MultiEdit, Write, Bash, WebFetch

## Support Squad
**Specialized agents for quality and design**

### code-quality-reviewer
- **Model**: claude-3-sonnet
- **Instances**: 1
- **Token Limit**: 8,000
- **Specialization**: Code review, security audit, test coverage
- **Domain**: **/*.test.*, **/*.spec.*, tests/**
- **Tools**: Read, Bash, Grep, Glob
- **Never**: Implements features

### rapid-ui-designer
- **Model**: claude-3-sonnet
- **Instances**: 1
- **Token Limit**: 8,000
- **Specialization**: UI mockups, design systems, component specs
- **Domain**: designs/**, mockups/**, style-guides/**
- **Tools**: Write, Read
- **Never**: Writes code

### ux-researcher
- **Model**: claude-3-sonnet
- **Instances**: 1
- **Token Limit**: 8,000
- **Specialization**: Requirements gathering, user research, personas
- **Domain**: research/**, personas/**, user-stories/**
- **Tools**: Write, Read, WebSearch
- **Never**: Implements solutions

### product-manager
- **Model**: claude-3-sonnet
- **Instances**: 1
- **Token Limit**: 8,000
- **Specialization**: Product strategy, roadmaps, PRDs, feature prioritization, stakeholder management
- **2025 Expertise**: Lean product development, Jobs-to-be-Done framework, Continuous discovery, Data-driven decision making, RICE prioritization, Product-market fit validation, OKR/KPI frameworks
- **Domain**: docs/**, requirements/**, roadmaps/**, specs/**, product-plans/**
- **Tools**: Write, Read, WebSearch, WebFetch, TodoWrite
- **Activation**: Start of planning phase or when product decisions needed
- **Never**: Writes code or creates mockups

## Optional Squad
**Enhancement agents for polish and planning**

### whimsy-injector
- **Model**: claude-3-haiku (simple tasks, cost optimization)
- **Instances**: 1
- **Token Limit**: 4,000
- **Specialization**: Micro-interactions, loading states, easter eggs
- **Domain**: components/**, styles/**, animations/**
- **Tools**: Read, Edit, MultiEdit
- **Activation**: After core features complete

### sprint-prioritizer
- **Model**: claude-3-haiku
- **Instances**: 1
- **Token Limit**: 4,000
- **Specialization**: Sprint planning, feature prioritization, risk assessment
- **Domain**: planning/**, roadmaps/**, backlogs/**
- **Tools**: Write, Read, TodoWrite
- **Activation**: Start of sprint or planning phase

## Agent Activation Rules

### Always Active
- studio-coach (Supervisor)

### Phase-Based Activation

**Requirements Phase**:
- ux-researcher (primary)
- sprint-prioritizer (if planning needed)

**Design Phase**:
- rapid-ui-designer
- backend-system-architect (API design only)

**Implementation Phase**:
- frontend-ui-developer (1-2 instances)
- backend-system-architect
- ai-ml-engineer (if AI features needed)

**Quality Phase**:
- code-quality-reviewer
- whimsy-injector (after review passes)

## Parallel Execution Capabilities

### Can Run in Parallel
- frontend-ui-developer[1] + frontend-ui-developer[2] (different components)
- frontend-ui-developer + backend-system-architect (different layers)
- rapid-ui-designer + ux-researcher (different artifacts)
- Multiple read operations by any agents

### Must Run Sequentially
- code-quality-reviewer → after implementation
- whimsy-injector → after code-quality-reviewer
- Integration testing → after all implementation
- Same file modifications by different agents

## Resource Limits

### Per Session
- **Max Active Agents**: 4 (excluding supervisor)
- **Max Frontend Instances**: 2
- **Max Total Tokens**: 100,000 per session
- **Max Files Open**: 20 simultaneously

### Per Agent
- **Task Timeout**: 5 minutes
- **Max Retries**: 3 for blocked tasks
- **File Lock Duration**: 2 minutes max

## Model Selection Rationale

### Opus (Supervisor Only)
- Complex orchestration logic
- Multi-agent coordination
- Error recovery decisions
- Quality gate evaluation

### Sonnet (Core & Support)
- Implementation tasks
- Code generation
- Design work
- Technical analysis

### Haiku (Optional Squad)
- Simple enhancements
- Planning tasks
- Cost optimization
- Repetitive operations

## Communication Channels

Each agent monitors specific file patterns:

### Supervisor
- Monitors: All role-comm-*.md files
- Writes: All role-plan-*.md files
- Maintains: session-status.md

### Workers
- Monitors: role-plan-[agent-name]-*.md
- Writes: role-comm-[agent-name]-*.md
- Updates: artifacts in designated domains

## Performance Metrics

Track per agent type:
- **Task Completion Rate**: Target > 90%
- **First-Time Success**: Target > 75%
- **Token Efficiency**: Tokens per task
- **Validation Pass Rate**: Target > 80%
- **Parallel Speedup**: 1.5-2x with parallel execution