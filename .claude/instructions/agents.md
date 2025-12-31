# 👥 Agent Registry & Capabilities

*Load this file when you need to work with specific agents*

## Available Agents

### ai-ml-engineer 🤖
**Role**: AI/ML engineer who integrates LLM APIs, implements prompt engineering, builds ML pipelines, optimizes inference performance, designs recommendation systems, and architects intelligent features for production applications
**Tools**: Read, Edit, MultiEdit, Write, Bash...
**Trigger**: "Use ai-ml-engineer to [task]"

### backend-system-architect 🤖
**Role**: Backend architect who designs REST/GraphQL APIs, database schemas, microservice boundaries, and distributed systems. Focuses on scalability, security, performance optimization, and clean architecture patterns
**Tools**: Read, Edit, MultiEdit, Write, Bash...
**Trigger**: "Use backend-system-architect to [task]"

### code-quality-reviewer 🤖
**Role**: Quality assurance expert who reviews code for bugs, security vulnerabilities, performance issues, and compliance with best practices. Runs linting, type checking, ensures test coverage, and validates architectural patterns
**Tools**: Read, Bash, Grep, Glob
**Trigger**: "Use code-quality-reviewer to [task]"

### frontend-ui-developer 🤖
**Role**: Frontend developer who builds React/TypeScript components, implements responsive layouts, manages complex state, ensures accessibility compliance, optimizes performance, and creates reusable component libraries
**Tools**: Read, Edit, MultiEdit, Write, Bash...
**Trigger**: "Use frontend-ui-developer to [task]"

### product-manager 🤖
**Role**: Product strategy specialist who transforms business goals into actionable development plans. Creates PRDs, roadmaps, and prioritizes features using data-driven frameworks (RICE, JTBD, Kano model)
**Tools**: Write, Read, WebSearch, WebFetch, TodoWrite
**Trigger**: "Use product-manager to [task]"

### rapid-ui-designer 🤖
**Role**: UI/UX designer specializing in rapid prototyping. Creates mockups with Tailwind classes, defines component architectures, establishes design systems, and balances aesthetic excellence with practical implementation constraints
**Tools**: Write, Read
**Trigger**: "Use rapid-ui-designer to [task]"

### sprint-prioritizer 🤖
**Role**: Agile planning specialist for 6-day sprints. Uses MoSCoW prioritization, manages backlogs, creates sprint plans, tracks velocity, and makes strategic trade-offs to maximize value delivery within tight timelines
**Tools**: Write, Read, TodoWrite
**Trigger**: "Use sprint-prioritizer to [task]"

### studio-coach 🤖
**Role**: Master orchestrator that coordinates all other agents through phased execution. Breaks down complex projects into tasks, assigns work to specialized agents, validates outputs, and ensures all components integrate properly
**Tools**: Task, Write, Read
**Trigger**: "Use studio-coach to [task]"

### ux-researcher 🤖
**Role**: User research expert who conducts interviews, creates personas, maps user journeys, validates design decisions, and ensures features solve real user problems through data-driven insights
**Tools**: Write, Read, WebSearch
**Trigger**: "Use ux-researcher to [task]"

### whimsy-injector 🤖
**Role**: Delight specialist who adds personality to interfaces through micro-interactions, easter eggs, playful animations, and memorable moments. Transforms routine user actions into joyful experiences that users want to share
**Tools**: Read, Edit, MultiEdit
**Trigger**: "Use whimsy-injector to [task]"

## Capabilities Matrix

| Agent | Planning | Design | Backend | Frontend | ML/AI | Quality |
|-------|----------|--------|---------|----------|-------|---------|
| ai-ml-engineer | - | - | - | - | - | - |
| backend-system-architect | - | - | - | - | - | - |
| code-quality-reviewer | - | - | - | - | - | - |
| frontend-ui-developer | - | - | - | - | - | - |
| product-manager | - | - | - | - | - | - |
| rapid-ui-designer | - | - | - | - | - | - |
| sprint-prioritizer | - | - | - | - | - | - |
| studio-coach | - | - | - | - | - | - |
| ux-researcher | - | - | - | - | - | - |
| whimsy-injector | - | - | - | - | - | - |

## Common Invocation Patterns

### Studio Coach (Orchestrator)
- "Build a viral app" → Coordinates multiple agents
- "Plan our sprint" → Creates optimized workflow

### Backend System Architect
- "Design API for millions of users" → Scalable architecture
- "Review API structure" → Architecture analysis

### Frontend UI Developer
- "Create dropdown component" → UI implementation
- "Fix rendering issues" → Performance optimization

## Agent Collaboration Patterns

**Backend → Frontend Flow**:
1. Backend designs API
2. Frontend builds matching UI
3. Both update shared context

**Design → Implementation Flow**:
1. UX Researcher validates needs
2. UI Designer creates mockups
3. Frontend Developer implements
