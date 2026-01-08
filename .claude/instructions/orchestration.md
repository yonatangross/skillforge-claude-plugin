# 🧠 Orchestration & Intelligent Routing (v2.0 - Dynamic MCP)

*Load this file when handling complex tasks or multi-agent coordination*

## 🆕 Dynamic Discovery Protocol (v2.0)

**Before routing, use the agent-registry for semantic discovery:**

```
1. Read .claude/agent-registry.json
2. Match user intent against agent.capabilities and agent.can_solve_examples
3. Score confidence (0-1) based on semantic similarity
4. Select agent with highest confidence above threshold (0.7)
5. Check for pre-composed workflows in .claude/workflows/
```

### agent-find Pattern
```javascript
// Semantic agent discovery (mirrors mcp-find)
function agentFind(userIntent) {
  const registry = readJSON('.claude/agent-registry.json');

  return Object.entries(registry.agents)
    .map(([name, agent]) => ({
      name,
      confidence: calculateSemanticMatch(userIntent, agent.can_solve_examples),
      capabilities: agent.capabilities
    }))
    .filter(a => a.confidence > 0.7)
    .sort((a, b) => b.confidence - a.confidence);
}
```

### skill-find Pattern
```javascript
// Progressive skill discovery (mirrors mcp-find for tools)
function skillFind(capability) {
  const registry = readJSON('.claude/agent-registry.json');

  return Object.entries(registry.skills)
    .filter(([name, skill]) => skill.provides.includes(capability))
    .map(([name, skill]) => ({
      name,
      load_path: skill.progressive_load,
      token_cost: skill.token_budget
    }));
}
```

---

## Semantic Intent Analysis

For EVERY user input, perform multi-dimensional analysis:
1. **Intent Classification**: What does the user want to achieve?
2. **Complexity Assessment**: Rate 1-10 based on scope
3. **Domain Detection**: Which specializations are needed?
4. **Context Evaluation**: Check existing work and dependencies
5. **🆕 Workflow Match**: Check `.claude/workflows/` for pre-composed solutions

## Routing Decision Tree (Enhanced)

```
User Input
    │
    ▼
Semantic Analysis
    │
    ├─► Check .claude/workflows/ for exact match
    │   └─► If match → Use composed workflow (token savings!)
    │
    ├─► agent-find(intent) → confidence scores
    │
    ▼
Routing Decision

IF workflow_match:
  → Execute composed workflow (skip full skill loading)
ELSE IF complexity <= 3 AND single_domain:
  → Route to specialist agent
  → Load only capabilities.json + specific references
ELSE IF complexity >= 7 OR multiple_domains:
  → Route to Studio Coach (orchestrator)
  → Studio Coach composes custom workflow
ELSE:
  → Analyze context and make best decision
```

## 🆕 MCP Integration Protocol

### Always Available MCPs
These tools should be used proactively during development:

| MCP | Purpose | When to Use |
|-----|---------|-------------|
| `context7` | Library documentation | Before implementing with any framework |
| `sequential-thinking` | Complex reasoning | Multi-step planning, conflict resolution |
| `memory` | Session persistence | Store decisions for future sessions |

### On-Demand MCPs (Dynamic Discovery)
Use `mcp__MCP_DOCKER__mcp-find` to discover additional tools:

```javascript
// Example: Need to test an API?
const tools = await mcp_find("api testing");
// Returns: postman-mcp, httpie-mcp, etc.

if (tools.length > 0) {
  await mcp_add(tools[0].name);
  // Tool now available for current session
}
```

### code-mode Composition
For complex multi-tool workflows, compose them:

```javascript
// Instead of 3 separate MCP tool calls:
const composed = await mcp__MCP_DOCKER__code_mode({
  name: "full-stack-test",
  servers: ["playwright", "skillforge-postgres-dev", "langfuse"]
});
// Single tool that orchestrates all three
```

---

## Progressive Skill Loading (Token Optimization)

**CRITICAL**: Never load full SKILL.md files when only specific guidance is needed.

### Loading Tiers

```
Tier 1: capabilities.json (~100 tokens)
        └─► Use for: Initial discovery, "is this skill relevant?"

Tier 2: SKILL.md overview (~500 tokens)
        └─► Use for: Confirmed relevant, need patterns

Tier 3: references/*.md (~100-200 tokens each)
        └─► Use for: Specific implementation guidance

Tier 4: templates/*.* (~150-300 tokens each)
        └─► Use for: Code generation
```

### Example: API Endpoint Task

```
❌ OLD WAY (2500+ tokens):
   Load api-design-framework/SKILL.md (600)
   Load security-checklist/SKILL.md (800)
   Load testing-strategy-builder/SKILL.md (500)

✅ NEW WAY (800 tokens):
   1. Check .claude/workflows/secure-api-endpoint.md (exists!)
   2. OR load only:
      - api-design-framework/capabilities.json (100)
      - api-design-framework/references/endpoint-patterns.md (150)
      - security-checklist/capabilities.json (100)
      - security-checklist/SKILL.md#input-validation (150)
   3. Use context7 for current FastAPI/Express docs
```

---

## Workflow Patterns

### Sequential Pattern
Tasks with dependencies: Backend → Frontend → Testing

### Parallel Pattern
Independent tasks: Multiple components simultaneously

### Consensus Pattern
Critical decisions: Multiple agents validate

### Hierarchical Pattern
Complex projects: Studio Coach coordinates teams

### 🆕 Composed Pattern
Pre-defined workflows that combine multiple skills:
- Check `.claude/workflows/` before creating ad-hoc coordination
- Token savings: 60-80% vs loading full skills

---

## Agent Handoff Protocols

When suggesting another agent:
```
"I've completed [work]. For [next step],
I recommend [Agent] who can [capability]."
```

### 🆕 MCP-Aware Handoff
```
"I've completed [work]. Before handoff to [Agent]:
1. Recorded decision in session/state.json (Context Protocol 2.0)
2. Used MCP tools: [context7 for FastAPI docs]
3. Composed workflow saved to: .claude/workflows/[name].md

For [next step], I recommend [Agent] who can [capability].
They should use: [specific MCP tools available]"
```

---

## Performance Optimization

- Only share relevant context between agents
- Avoid duplicate work by checking context first
- Use parallel execution where possible
- Keep session/state.json (Context Protocol 2.0) under 50KB
- **🆕 Use progressive skill loading (capabilities.json first)**
- **🆕 Check workflows/ before composing ad-hoc**
- **🆕 Use context7 instead of embedding static docs**
- **🆕 Record MCP tool usage for workflow optimization**

---

## 🆕 MCP Tool Recording

After completing tasks, record which MCP tools were useful:

```javascript
// In session/state.json (Context Protocol 2.0)
{
  "mcp_usage": {
    "task": "Create paginated search endpoint",
    "tools_used": [
      { "tool": "context7", "library": "/tiangolo/fastapi", "topic": "pagination" },
      { "tool": "skillforge-postgres-dev", "query": "test pagination query" }
    ],
    "token_savings": "Used composed workflow, saved ~1700 tokens"
  }
}
```

This enables future workflow optimization and personalized tool recommendations.
