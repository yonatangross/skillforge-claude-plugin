# ⚡ Automatic Context Management

## CRITICAL: This file is auto-loaded for ALL agents

The context system ensures session persistence, cross-agent knowledge sharing, and continuous learning across all AI Agent Hub projects. Every agent MUST interact with the context system to maintain project continuity.

## 🎯 Context Protocol

### Before Starting ANY Task

```javascript
// Load existing context
const fs = require('fs');
const contextPath = '.claude/context/session/state.json (Context Protocol 2.0)';
const context = JSON.parse(fs.readFileSync(contextPath, 'utf8'));

// Extract relevant information
const myAgentName = 'current-agent-name'; // Replace with actual agent name
const myPreviousWork = context.agent_decisions[myAgentName] || [];
const completedTasks = context.tasks_completed || [];
const pendingTasks = context.tasks_pending || [];

// Check for patterns and conventions
const existingPatterns = {
  componentStyle: detectComponentPattern(completedTasks),
  stateManagement: detectStatePattern(completedTasks),
  apiPattern: detectAPIPattern(completedTasks)
};
```

### During Work

```javascript
// Track major decisions
if (!context.agent_decisions[myAgentName]) {
  context.agent_decisions[myAgentName] = [];
}

context.agent_decisions[myAgentName].push({
  timestamp: new Date().toISOString(),
  decision: "Created UserAuth component using JWT",
  rationale: "Matches existing authentication pattern in codebase",
  impact: "All future auth components should follow this pattern",
  dependencies: ["jsonwebtoken", "bcrypt"]
});

// Update working context periodically
context.last_activity = new Date().toISOString();
context.active_agent = myAgentName;
```

### After Completing Work

```javascript
// Mark tasks as completed
const taskId = 'task-' + Date.now();
context.tasks_completed.push({
  id: taskId,
  description: "Implemented user authentication flow",
  agent: myAgentName,
  timestamp: new Date().toISOString(),
  artifacts: [
    "/components/UserAuth.tsx",
    "/api/auth/login.ts",
    "/lib/jwt-utils.ts"
  ],
  metrics: {
    linesOfCode: 450,
    testsAdded: 12,
    performance: "45ms average response"
  }
});

// Remove from pending if it was there
context.tasks_pending = context.tasks_pending.filter(t => t.id !== taskId);

// Update session timestamp
context.timestamp = new Date().toISOString();

// Save context
fs.writeFileSync(contextPath, JSON.stringify(context, null, 2));
```

### On Errors or Blockers

```javascript
// Document blockers for next session
context.tasks_pending.push({
  id: 'pending-' + Date.now(),
  description: "Database migration needed for new schema",
  blocker: "Requires production data backup first",
  agent: myAgentName,
  timestamp: new Date().toISOString(),
  suggested_resolution: "Run backup script, then apply migration",
  priority: "high"
});

// Save immediately to preserve state
fs.writeFileSync(contextPath, JSON.stringify(context, null, 2));
```

## 📊 Context Structure

```typescript
interface SharedContext {
  version: string;
  timestamp: string;
  session_id: string;
  mode: "classic" | "squad";

  agent_decisions: {
    [agentName: string]: Array<{
      timestamp: string;
      decision: string;
      rationale: string;
      impact?: string;
      dependencies?: string[];
    }>;
  };

  tasks_completed: Array<{
    id: string;
    description: string;
    agent: string;
    timestamp: string;
    artifacts?: string[];
    metrics?: Record<string, any>;
  }>;

  tasks_pending: Array<{
    id: string;
    description: string;
    blocker?: string;
    agent: string;
    timestamp: string;
    suggested_resolution?: string;
    priority?: "low" | "medium" | "high";
  }>;

  codebase_patterns?: {
    component_style?: "functional" | "class";
    state_management?: "redux" | "context" | "zustand" | "mobx";
    api_pattern?: "REST" | "GraphQL";
    testing_framework?: "jest" | "vitest" | "mocha";
    styling?: "css-modules" | "styled-components" | "tailwind";
  };

  last_activity?: string;
  active_agent?: string;
}
```

## 🚀 Best Practices

### 1. Atomic Updates
- Save context after EVERY major decision
- Don't batch updates - write immediately
- Use timestamps for all entries

### 2. Pattern Detection
```javascript
function detectComponentPattern(tasks) {
  const components = tasks.filter(t =>
    t.artifacts?.some(a => a.includes('component'))
  );

  // Analyze for functional vs class components
  const functionalCount = components.filter(c =>
    c.description.includes('hook') ||
    c.description.includes('functional')
  ).length;

  return functionalCount > components.length / 2 ? 'functional' : 'class';
}
```

### 3. Conflict Prevention
```javascript
// Check if another agent is actively working
if (context.active_agent && context.active_agent !== myAgentName) {
  const lastActivity = new Date(context.last_activity);
  const now = new Date();
  const minutesSinceActivity = (now - lastActivity) / 60000;

  if (minutesSinceActivity < 5) {
    console.warn(`⚠️ ${context.active_agent} is currently active`);
    // Coordinate through Squad system or wait
  }
}
```

## 🎯 Integration Checklist

- [ ] Context loaded at agent start
- [ ] Decisions tracked during work
- [ ] Tasks marked completed/pending
- [ ] Context saved before exit
- [ ] Squad system synchronized (if applicable)
- [ ] Patterns detected and followed
- [ ] Conflicts checked and prevented
- [ ] Session continuity maintained

Remember: **Context preservation is NOT optional**. It's the foundation of intelligent, continuous AI development.