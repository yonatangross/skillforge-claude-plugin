# ⚡ Automatic Context Management (Essential)

## CRITICAL: This file is auto-loaded for ALL agents

The context system ensures session persistence, cross-agent knowledge sharing, and continuous learning across all AI Agent Hub projects. Every agent MUST interact with the context system to maintain project continuity.

## 🎯 Core Context Protocol

### Before Starting ANY Task

```javascript
// Load existing context
const fs = require('fs');
const contextPath = '.claude/context/shared-context.json';
const context = JSON.parse(fs.readFileSync(contextPath, 'utf8'));

// Extract relevant information
const myAgentName = 'current-agent-name'; // Replace with actual agent name
const myPreviousWork = context.agent_decisions[myAgentName] || [];
const completedTasks = context.tasks_completed || [];
const pendingTasks = context.tasks_pending || [];
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
  impact: "All future auth components should follow this pattern"
});

// Update working context
context.last_activity = new Date().toISOString();
context.active_agent = myAgentName;
```

### After Completing Work

```javascript
// Mark tasks as completed
context.tasks_completed.push({
  id: 'task-' + Date.now(),
  description: "Implemented user authentication flow",
  agent: myAgentName,
  timestamp: new Date().toISOString(),
  artifacts: [
    "/components/UserAuth.tsx",
    "/api/auth/login.ts"
  ]
});

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
  description: "Database migration needed",
  blocker: "Requires production data backup first",
  agent: myAgentName,
  priority: "high"
});

// Save immediately
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
    }>;
  };

  tasks_completed: Array<{
    id: string;
    description: string;
    agent: string;
    timestamp: string;
    artifacts?: string[];
  }>;

  tasks_pending: Array<{
    id: string;
    description: string;
    blocker?: string;
    agent: string;
    timestamp: string;
    priority?: "low" | "medium" | "high";
  }>;

  last_activity?: string;
  active_agent?: string;
}
```

## 🔄 Squad Mode Synchronization

When in Squad mode, context automatically syncs with Squad communication files:

```javascript
const squadPath = '.squad/sessions/';
const isSquadMode = fs.existsSync(squadPath);

if (isSquadMode) {
  // Sync decisions from Squad communications
  const commFiles = fs.readdirSync(squadPath)
    .filter(f => f.startsWith('role-comm-'));

  // Update context from Squad files
  commFiles.forEach(file => {
    const agentName = extractAgentName(file);
    // Sync agent decisions
  });
}
```

## 🛡️ Evidence Collection Protocol (v3.5.0)

### CRITICAL: Evidence Required Before Task Completion

All agents MUST collect evidence before marking tasks complete. Evidence proves code actually works.

### Evidence Types

**1. Test Evidence**
```javascript
context.quality_evidence = context.quality_evidence || {};
context.quality_evidence.tests = {
  executed: true,
  command: 'npm test',
  exit_code: 0,  // MUST be 0 for success
  passed: 24,
  failed: 0,
  coverage_percent: 87.5,
  timestamp: new Date().toISOString()
};
fs.writeFileSync(contextPath, JSON.stringify(context, null, 2));
```

**2. Build Evidence**
```javascript
context.quality_evidence.build = {
  executed: true,
  command: 'npm run build',
  exit_code: 0,  // MUST be 0 for success
  errors: 0,
  warnings: 2,
  timestamp: new Date().toISOString()
};
fs.writeFileSync(contextPath, JSON.stringify(context, null, 2));
```

**3. Code Quality Evidence**
```javascript
// Linter
context.quality_evidence.linter = {
  executed: true,
  tool: 'ESLint',
  command: 'npm run lint',
  exit_code: 0,
  errors: 0,
  warnings: 3,
  timestamp: new Date().toISOString()
};

// Type checker
context.quality_evidence.type_checker = {
  executed: true,
  tool: 'TypeScript',
  command: 'npm run typecheck',
  exit_code: 0,
  errors: 0,
  timestamp: new Date().toISOString()
};
fs.writeFileSync(contextPath, JSON.stringify(context, null, 2));
```

### Quality Standards

**Minimum** (at least ONE passes):
- Tests pass (exit_code 0) OR
- Build succeeds (exit_code 0) OR
- Linter passes (exit_code 0)

**Production-Grade** (ALL must pass):
- Tests pass (exit_code 0)
- Coverage ≥70%
- Build succeeds (exit_code 0)
- Linter passes (exit_code 0)
- Type checker passes (exit_code 0)

**Gold Standard** (ALL must pass):
- Tests pass (exit_code 0)
- Coverage ≥80%
- Build succeeds (exit_code 0)
- No linter warnings (warnings: 0)
- Type checker passes (exit_code 0)

### Enforcement Rules

**Rule 1: Evidence Before Completion**
```javascript
// ✅ GOOD: With evidence
if (context.quality_evidence?.tests?.exit_code === 0) {
  context.tasks_completed.push({
    description: "Implemented user login",
    agent: myAgentName,
    quality_standard: "production-grade"
  });
} else {
  console.warn('⚠️ Cannot mark complete - no passing evidence');
}
```

**Rule 2: Failed Evidence = Task Not Complete**
```javascript
if (context.quality_evidence?.tests?.exit_code !== 0) {
  // Tests failed - DO NOT mark complete
  context.tasks_pending.push({
    description: "Fix failing tests",
    blocker: `${context.quality_evidence.tests.failed} tests failing`,
    priority: "high"
  });
  return; // Stop here
}
```

**Rule 3: Include Evidence Summary**
```javascript
const evidenceSummary = `
Evidence:
- Tests: ✅ (${context.quality_evidence.tests.passed} passed)
- Build: ✅
- Coverage: ${context.quality_evidence.tests.coverage_percent}%
- Quality: ${context.quality_evidence.quality_standard_met}
`;

context.tasks_completed.push({
  description: "Implemented user authentication",
  evidence_summary: evidenceSummary,
  timestamp: new Date().toISOString()
});
```

## 🎯 Essential Checklist

- [ ] Context loaded at agent start
- [ ] Decisions tracked during work
- [ ] Evidence collected during work ⭐
- [ ] Evidence verified before completion ⭐
- [ ] Tasks marked completed with evidence ⭐
- [ ] Context saved before exit

**Remember:** Context preservation and evidence collection are MANDATORY. No task can be marked complete without verifiable proof of success.

---

**For advanced patterns, conflict prevention, and detailed examples, see:** `.claude/instructions/context-middleware-advanced.md` (loaded automatically when needed)
