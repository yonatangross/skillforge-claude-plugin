# ⚡ Advanced Context Management

## 📘 ADVANCED: Loaded on-demand for complex scenarios

This file contains advanced patterns, conflict prevention strategies, and detailed validation rules. It's automatically loaded when:
- Context size > 50k tokens
- Squad mode is active
- Complex multi-agent coordination needed

## 🚀 Advanced Best Practices

### 1. Atomic Updates
- Save context after EVERY major decision
- Don't batch updates - write immediately
- Use timestamps for all entries

```javascript
// Save after each significant action
function recordDecision(decision) {
  context.agent_decisions[myAgentName].push({
    timestamp: new Date().toISOString(),
    ...decision
  });
  fs.writeFileSync(contextPath, JSON.stringify(context, null, 2));
}
```

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

// Update codebase patterns
context.codebase_patterns = {
  component_style: detectComponentPattern(context.tasks_completed),
  state_management: detectStateManagement(context.tasks_completed),
  api_pattern: detectAPIPattern(context.tasks_completed)
};
```

### 3. Conflict Prevention

```javascript
// Check if another agent is actively working
if (context.active_agent && context.active_agent !== myAgentName) {
  const lastActivity = new Date(context.last_activity);
  const now = new Date();
  const minutesSinceActivity = (now - lastActivity) / 60000;

  if (minutesSinceActivity < 5) {
    console.warn(`⚠️  ${context.active_agent} is currently active`);
    // Coordinate through Squad system or wait
    return;
  }
}

// Mark yourself as active
context.active_agent = myAgentName;
context.last_activity = new Date().toISOString();
fs.writeFileSync(contextPath, JSON.stringify(context, null, 2));
```

### 4. Session Continuity

```javascript
// On session resume, provide comprehensive summary
function getSessionSummary(context) {
  const recentDecisions = Object.values(context.agent_decisions)
    .flat()
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 5);

  return {
    lastActive: context.timestamp,
    completedCount: context.tasks_completed.length,
    pendingCount: context.tasks_pending.length,
    activeAgents: Object.keys(context.agent_decisions),
    recentDecisions,
    qualityStandards: {
      latest: context.quality_evidence?.quality_standard_met,
      coverage: context.quality_evidence?.tests?.coverage_percent
    }
  };
}

// Use at session start
console.log('Session Summary:', getSessionSummary(context));
```

## 🔍 Context Validation

Always validate context updates to prevent corruption:

```javascript
function validateContext(context) {
  // Check required fields
  const required = ['version', 'timestamp', 'session_id', 'mode'];
  const missing = required.filter(field => !context[field]);

  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }

  // Validate structure
  if (!Array.isArray(context.tasks_completed)) {
    throw new Error('tasks_completed must be an array');
  }

  if (!Array.isArray(context.tasks_pending)) {
    throw new Error('tasks_pending must be an array');
  }

  if (typeof context.agent_decisions !== 'object') {
    throw new Error('agent_decisions must be an object');
  }

  // Validate timestamps
  try {
    new Date(context.timestamp);
  } catch (e) {
    throw new Error('Invalid timestamp format');
  }

  return true;
}

// Use before saving
validateContext(context);
fs.writeFileSync(contextPath, JSON.stringify(context, null, 2));
```

## 🔄 Advanced Squad Synchronization

### Bi-Directional Sync

```javascript
// Detect Squad mode
const squadPath = '.squad/sessions/';
const isSquadMode = fs.existsSync(squadPath);

if (isSquadMode) {
  // Read Squad communications
  const commFiles = fs.readdirSync(squadPath)
    .filter(f => f.startsWith('role-comm-'));

  // Sync decisions to context
  commFiles.forEach(file => {
    const content = fs.readFileSync(`${squadPath}/${file}`, 'utf8');
    const agentName = extractAgentName(file);

    // Parse markdown and update context
    const decisions = parseMarkdownDecisions(content);
    context.agent_decisions[agentName] = decisions;
  });

  // Write context back to Squad files
  const myCommFile = `${squadPath}/role-comm-${myAgentName}.md`;
  const myDecisions = context.agent_decisions[myAgentName] || [];

  const markdownContent = formatDecisionsAsMarkdown(myDecisions);
  fs.writeFileSync(myCommFile, markdownContent);
}
```

## 🛡️ Advanced Evidence Collection

### Detailed Evidence Capture

**Security Scan Evidence**
```javascript
context.quality_evidence = context.quality_evidence || { last_updated: new Date().toISOString() };
context.quality_evidence.security_scan = {
  executed: true,
  tool: 'npm audit',
  command: 'npm audit --json',
  exit_code: 0,
  critical: 0,
  high: 0,
  moderate: 2,
  low: 5,
  total_vulnerabilities: 7,
  timestamp: new Date().toISOString(),
  evidence_file: '.claude/quality-gates/evidence/security-2025-11-02.json'
};

// Assess security quality
if (context.quality_evidence.security_scan.critical > 0 ||
    context.quality_evidence.security_scan.high > 5) {
  context.quality_evidence.security_status = 'blocked';
} else {
  context.quality_evidence.security_status = 'passed';
}

context.quality_evidence.last_updated = new Date().toISOString();
fs.writeFileSync(contextPath, JSON.stringify(context, null, 2));
```

### Evidence File Management

```javascript
// Save detailed logs separately
const evidenceDir = '.claude/quality-gates/evidence';
if (!fs.existsSync(evidenceDir)) {
  fs.mkdirSync(evidenceDir, { recursive: true });
}

// Save test output
const testLogPath = `${evidenceDir}/tests-${Date.now()}.log`;
fs.writeFileSync(testLogPath, testOutput);

// Reference in context
context.quality_evidence.tests.evidence_file = testLogPath;
```

### Quality Assessment Logic

```javascript
function assessQualityStandard(evidence) {
  if (!evidence) return 'no-evidence';

  const tests = evidence.tests;
  const build = evidence.build;
  const linter = evidence.linter;
  const typeChecker = evidence.type_checker;

  // Check Gold Standard
  if (tests?.exit_code === 0 &&
      tests?.coverage_percent >= 80 &&
      build?.exit_code === 0 &&
      linter?.exit_code === 0 &&
      linter?.warnings === 0 &&
      typeChecker?.exit_code === 0) {
    return 'gold-standard';
  }

  // Check Production-Grade
  if (tests?.exit_code === 0 &&
      tests?.coverage_percent >= 70 &&
      build?.exit_code === 0 &&
      linter?.exit_code === 0 &&
      typeChecker?.exit_code === 0) {
    return 'production-grade';
  }

  // Check Minimum
  if (tests?.exit_code === 0 ||
      build?.exit_code === 0 ||
      linter?.exit_code === 0) {
    return 'minimum';
  }

  return 'below-minimum';
}

// Auto-assess and store
context.quality_evidence.quality_standard_met = assessQualityStandard(context.quality_evidence);
context.quality_evidence.all_checks_passed =
  context.quality_evidence.quality_standard_met === 'gold-standard' ||
  context.quality_evidence.quality_standard_met === 'production-grade';
```

### Evidence-Based Completion Flow

```javascript
// Complete flow with all checks
async function completeTaskWithEvidence(taskDescription, artifacts) {
  // 1. Collect evidence
  console.log('Collecting evidence...');
  const testEvidence = await runTests();
  const buildEvidence = await runBuild();
  const linterEvidence = await runLinter();

  // 2. Record evidence
  context.quality_evidence = {
    tests: testEvidence,
    build: buildEvidence,
    linter: linterEvidence,
    last_updated: new Date().toISOString()
  };

  // 3. Assess quality
  context.quality_evidence.quality_standard_met =
    assessQualityStandard(context.quality_evidence);

  // 4. Verify minimum standard
  if (context.quality_evidence.quality_standard_met === 'below-minimum') {
    console.error('❌ Cannot complete - evidence shows failures');
    context.tasks_pending.push({
      id: 'pending-' + Date.now(),
      description: `Fix quality issues in: ${taskDescription}`,
      blocker: 'Tests/build/linter failing',
      priority: 'high'
    });
    fs.writeFileSync(contextPath, JSON.stringify(context, null, 2));
    return false;
  }

  // 5. Mark complete with evidence
  context.tasks_completed.push({
    id: 'task-' + Date.now(),
    description: taskDescription,
    agent: myAgentName,
    timestamp: new Date().toISOString(),
    artifacts,
    quality_standard: context.quality_evidence.quality_standard_met,
    evidence_summary: formatEvidenceSummary(context.quality_evidence)
  });

  // 6. Save
  fs.writeFileSync(contextPath, JSON.stringify(context, null, 2));
  console.log(`✅ Task completed: ${context.quality_evidence.quality_standard_met} quality`);
  return true;
}
```

## 📊 Advanced Context Patterns

### Pattern Recognition

```javascript
// Detect technology stack from completed tasks
function detectTechStack(tasks) {
  const fileExtensions = tasks
    .flatMap(t => t.artifacts || [])
    .map(a => a.split('.').pop())
    .reduce((acc, ext) => {
      acc[ext] = (acc[ext] || 0) + 1;
      return acc;
    }, {});

  return {
    primary_language: Object.keys(fileExtensions).sort((a, b) =>
      fileExtensions[b] - fileExtensions[a]
    )[0],
    frameworks: detectFrameworks(tasks),
    database: detectDatabase(tasks),
    deployment: detectDeployment(tasks)
  };
}

// Store patterns for consistency
context.codebase_patterns = {
  ...context.codebase_patterns,
  tech_stack: detectTechStack(context.tasks_completed)
};
```

### Dependency Tracking

```javascript
// Track task dependencies
function recordTaskDependency(taskId, dependsOnTasks) {
  if (!context.task_dependencies) {
    context.task_dependencies = {};
  }

  context.task_dependencies[taskId] = {
    depends_on: dependsOnTasks,
    status: 'pending',
    created_at: new Date().toISOString()
  };
}

// Check if dependencies met
function areDependenciesMet(taskId) {
  const deps = context.task_dependencies[taskId];
  if (!deps) return true;

  return deps.depends_on.every(depId =>
    context.tasks_completed.some(t => t.id === depId)
  );
}
```

## 🎯 Complete Integration Checklist

### Standard Operations
- [ ] Context loaded at agent start
- [ ] Decisions tracked during work
- [ ] Tasks marked completed/pending
- [ ] Context saved before exit

### Evidence Collection (v3.5.0)
- [ ] Evidence collected during work
- [ ] Evidence verified before completion
- [ ] Quality standard assessed automatically
- [ ] Completion includes evidence summary
- [ ] Failed evidence blocks completion

### Squad Mode Integration
- [ ] Squad system synchronized
- [ ] Cross-agent decisions visible
- [ ] Communication files updated
- [ ] Active agent conflicts checked

### Advanced Features
- [ ] Patterns detected and followed
- [ ] Conflicts checked and prevented
- [ ] Session continuity maintained
- [ ] Context validation performed
- [ ] Dependencies tracked

### Quality Assurance
- [ ] Test evidence captured (exit code 0)
- [ ] Build evidence captured (exit code 0)
- [ ] Linter evidence captured (exit code 0)
- [ ] Security scan evidence captured (if applicable)
- [ ] Coverage meets threshold (70%+ for production)

## 🔗 Using the Evidence Verification Skill

For detailed guidance on collecting evidence, the `evidence-verification` skill provides:
- Comprehensive evidence collection templates
- Step-by-step verification workflows
- Quality assessment checklists
- Language-specific command references
- Evidence file management strategies

Load the skill when you need detailed guidance:
```
I need comprehensive guidance on evidence collection. Loading evidence-verification skill...
```

## 📚 Reference Links

**Related Skills:**
- `evidence-verification` - Comprehensive evidence collection guidance
- `quality-gates` - Complexity assessment and gate validation
- `code-review-playbook` - Code review standards and checklists

**Related Files:**
- `.claude/context/shared-context.json` - Active context storage
- `.squad/sessions/role-comm-*.md` - Squad communication files
- `.claude/quality-gates/evidence/` - Evidence log storage

---

**Remember:** Advanced patterns enhance the core protocol but don't replace it. Always follow the essential context protocol in `context-middleware-essential.md` first, then apply these advanced techniques as needed.
