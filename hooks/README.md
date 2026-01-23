# OrchestKit Hooks - TypeScript/ESM

TypeScript hook system for the OrchestKit Claude Plugin. Provides lifecycle automation, permission management, and validation for Claude Code operations.

## Overview

The hooks system intercepts Claude Code operations at various lifecycle points to provide:

- **Permission management** - Auto-approve safe operations, block dangerous commands
- **Pre-execution validation** - Git protection, security checks, quality gates
- **Post-execution tracking** - Audit logging, pattern extraction, error tracking
- **Context enhancement** - Inject additional context before tool execution (CC 2.1.9)
- **Session lifecycle** - Setup, initialization, cleanup, and maintenance

**Architecture:**
- TypeScript source → ESM bundle → Single-file deployment
- Zero dependencies in production bundle
- CC 2.1.16 compliant (Task Management), CC 2.1.9 compliant (additionalContext)

---

## Directory Structure

```
hooks/
├── src/                     # TypeScript source files
│   ├── index.ts            # Hook registry and exports
│   ├── types.ts            # TypeScript type definitions
│   ├── lib/                # Shared utilities
│   │   ├── common.ts       # Logging, output builders, environment
│   │   ├── git.ts          # Git operations and validation
│   │   └── guards.ts       # Conditional execution predicates
│   ├── permission/         # Permission hooks (4)
│   ├── pretool/            # Pre-execution hooks (33)
│   │   ├── bash/           # Bash command hooks (20)
│   │   ├── write-edit/     # File operation hooks (3)
│   │   ├── Write/          # Write-specific hooks (4)
│   │   ├── mcp/            # MCP integration hooks (4)
│   │   ├── input-mod/      # Input modification hooks (1)
│   │   └── skill/          # Skill tracking hooks (1)
│   ├── posttool/           # Post-execution hooks (21)
│   │   ├── (root)/         # General post-tool hooks (12)
│   │   ├── write/          # Write tracking hooks (5)
│   │   ├── bash/           # Bash tracking hooks (3)
│   │   ├── skill/          # Skill optimization hooks (1)
│   │   └── write-edit/     # File lock hooks (1)
│   ├── prompt/             # Prompt enhancement hooks (8)
│   ├── subagent-start/     # Subagent spawn hooks (4)
│   ├── subagent-stop/      # Subagent completion hooks (9)
│   ├── notification/       # Notification hooks (2)
│   ├── stop/               # Session stop hooks (11)
│   ├── setup/              # Setup and maintenance hooks (7)
│   ├── agent/              # Agent-specific hooks (6)
│   └── skill/              # Skill validation hooks (24)
├── dist/                   # Compiled output
│   ├── hooks.mjs           # Single bundled ESM file (~35 KB)
│   ├── hooks.mjs.map       # Source map for debugging
│   └── bundle-stats.json   # Build metrics
├── bin/
│   └── run-hook.mjs        # CLI runner for hook execution
├── package.json            # NPM configuration
├── tsconfig.json           # TypeScript configuration
├── esbuild.config.mjs      # Build configuration
└── (legacy bash hooks)     # 120 bash hooks not yet migrated

**Total:** 147 hooks (27 TypeScript, 120 Bash legacy)
```

---

## Hook Types

### Permission Hooks (PermissionRequest)
Auto-approve or deny permission requests based on safety rules.

**Examples:**
- `permission/auto-approve-readonly` - Auto-approve Read, Glob, Grep
- `permission/auto-approve-safe-bash` - Auto-approve safe bash commands
- `permission/auto-approve-project-writes` - Auto-approve writes to project directory

### PreTool Hooks (PreToolUse)
Execute BEFORE a tool runs, can inject context or block execution.

**Examples:**
- `pretool/bash/git-branch-protection` - Block commits to main/dev branches
- `pretool/bash/dangerous-command-blocker` - Block `rm -rf`, `sudo`, force push
- `pretool/Write/architecture-change-detector` - Detect major architecture changes

**CC 2.1.9 Feature:** Use `additionalContext` to inject guidance before execution.

### PostTool Hooks (PostToolUse)
Execute AFTER a tool completes, used for logging and tracking.

**Examples:**
- `posttool/audit-logger` - Log all tool executions
- `posttool/error-tracker` - Track and categorize errors
- `posttool/memory-bridge` - Sync important info to knowledge graph

### Prompt Hooks (UserPromptSubmit)
Enhance user prompts with additional context before processing.

**Examples:**
- `prompt/context-injector` - Inject session context
- `prompt/antipattern-warning` - Warn about known anti-patterns
- `prompt/skill-auto-suggest` - Suggest relevant skills

### Lifecycle Hooks
Session and instance lifecycle management.

**Events:**
- `SessionStart` - Initialize session, load context
- `SessionEnd` - Save state, cleanup
- `Stop` - User stops conversation, trigger compaction
- `Setup` - First-run setup, maintenance tasks
- `SubagentStart` - Subagent spawn validation
- `SubagentStop` - Subagent completion tracking

### Notification Hooks (Notification)
Handle notifications and alerts.

**Examples:**
- `notification/desktop` - Desktop notifications for completion
- `notification/sound` - Sound alerts for errors

---

## Development Commands

### Building

```bash
# Build production bundle (minified)
npm run build

# Build and watch for changes (development)
npm run build:watch

# Type check without building
npm run typecheck

# Clean build artifacts
npm run clean
```

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

### Verification

```bash
# Check bundle size and stats
cat dist/bundle-stats.json

# Test a hook directly
echo '{"tool_name":"Read","session_id":"test","tool_input":{}}' | \
  node bin/run-hook.mjs permission/auto-approve-readonly

# Expected output:
# {"continue":true,"suppressOutput":true,"hookSpecificOutput":{"permissionDecision":"allow"}}
```

---

## Adding a New Hook

### Step 1: Create Hook File

```bash
# Choose appropriate directory based on hook type
mkdir -p src/pretool/bash
touch src/pretool/bash/my-hook.ts
```

### Step 2: Implement Hook

```typescript
/**
 * My Hook - Brief description
 * Hook: PreToolUse (Bash)
 * CC 2.1.9 Compliant
 */

import type { HookInput, HookResult } from '../../types.js';
import { outputSilentSuccess, outputBlock, logHook } from '../../lib/common.js';
import { guardBash } from '../../lib/guards.js';

/**
 * Main hook logic
 */
export function myHook(input: HookInput): HookResult {
  // Apply guards to skip hook if conditions not met
  const guardResult = guardBash(input);
  if (guardResult) return guardResult;

  const command = input.tool_input.command || '';

  // Log hook execution
  logHook('my-hook', `Checking command: ${command}`);

  // Example: Block dangerous pattern
  if (command.includes('danger')) {
    return outputBlock('Dangerous command detected');
  }

  // Allow by default
  return outputSilentSuccess();
}
```

### Step 3: Register in Index

Add to `src/index.ts`:

```typescript
// Import hook
import { myHook } from './pretool/bash/my-hook.js';

// Add to hooks registry
export const hooks: Record<string, HookFn> = {
  // ... existing hooks ...
  'pretool/bash/my-hook': myHook,
};
```

### Step 4: Build and Test

```bash
# Build bundle
npm run build

# Test the hook
echo '{"tool_name":"Bash","session_id":"test","tool_input":{"command":"echo hello"}}' | \
  node bin/run-hook.mjs pretool/bash/my-hook
```

### Step 5: Add to Plugin Configuration

Add hook registration to `.claude/settings.json`:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "name": "My Hook",
        "path": "./hooks/bin/run-hook.mjs pretool/bash/my-hook",
        "matcher": "Bash"
      }
    ]
  }
}
```

---

## Hook Input/Output Format

### Input (HookInput interface)

Received via stdin as JSON:

```typescript
interface HookInput {
  hook_event?: 'PreToolUse' | 'PostToolUse' | 'PermissionRequest' | 'UserPromptSubmit' | ...;
  tool_name: string;              // e.g., "Bash", "Write", "Read"
  session_id: string;             // CC 2.1.9 guaranteed
  tool_input: ToolInput;          // Tool-specific params
  tool_output?: unknown;          // PostToolUse only
  tool_error?: string;            // If tool errored
  exit_code?: number;             // Bash exit code
  prompt?: string;                // UserPromptSubmit only
  project_dir?: string;           // Project directory
  subagent_type?: string;         // SubagentStart/Stop
  agent_output?: string;          // SubagentStop
  // ... additional fields
}
```

### Output (HookResult interface)

Written to stdout as JSON:

```typescript
interface HookResult {
  continue: boolean;              // true = proceed, false = block
  suppressOutput?: boolean;       // Hide from user (default: false)
  systemMessage?: string;         // Message shown to user
  stopReason?: string;            // Reason for blocking (when continue=false)
  hookSpecificOutput?: {
    permissionDecision?: 'allow' | 'deny';         // PermissionRequest
    permissionDecisionReason?: string;             // Why allowed/denied
    additionalContext?: string;                    // CC 2.1.9: inject context
    hookEventName?: 'PreToolUse' | 'PostToolUse' | ...; // Required for additionalContext
  };
}
```

---

## Output Builders (lib/common.ts)

Use these helpers for consistent output:

```typescript
import {
  outputSilentSuccess,    // { continue: true, suppressOutput: true }
  outputSilentAllow,      // Silent permission allow
  outputBlock,            // Block with reason
  outputWithContext,      // Inject context (PostToolUse)
  outputPromptContext,    // Inject context (UserPromptSubmit)
  outputAllowWithContext, // Allow + inject context (PreToolUse)
  outputError,            // Show error message
  outputWarning,          // Show warning
  outputDeny,             // Deny permission with reason
} from './lib/common.js';

// Example: Silent success
return outputSilentSuccess();

// Example: Block operation
return outputBlock('Committing to main branch is not allowed');

// Example: Inject context before tool execution
return outputWithContext('💡 Consider using cursor-based pagination for large datasets');
```

---

## Guards (lib/guards.ts)

Guards are predicates that determine if a hook should run. Return early if guard fails:

```typescript
import {
  guardBash,              // Only run for Bash tool
  guardWriteEdit,         // Only run for Write/Edit tools
  guardCodeFiles,         // Only run for .py, .ts, .js, etc.
  guardTestFiles,         // Only run for test files
  guardSkipInternal,      // Skip .claude/, node_modules/, etc.
  guardGitCommand,        // Only run for git commands
  guardNontrivialBash,    // Skip echo, ls, pwd, etc.
  guardPathPattern,       // Only run for specific paths
  guardFileExtension,     // Only run for specific extensions
} from './lib/guards.js';

export function myHook(input: HookInput): HookResult {
  // Apply guard: skip if not Bash tool
  const guardResult = guardBash(input);
  if (guardResult) return guardResult;

  // Hook logic runs only for Bash tool
  // ...
}
```

### Composite Guards

Run multiple guards in sequence:

```typescript
import { runGuards, guardBash, guardNontrivialBash } from './lib/guards.js';

export function myHook(input: HookInput): HookResult {
  // Skip if not Bash OR is trivial command
  const guardResult = runGuards(input, guardBash, guardNontrivialBash);
  if (guardResult) return guardResult;

  // Hook logic...
}
```

---

## CC 2.1.9 Compliance

### additionalContext Feature

Hooks can inject additional context BEFORE tool execution:

```typescript
import { outputAllowWithContext } from './lib/common.js';

export function myPreToolHook(input: HookInput): HookResult {
  const context = `
⚠️ IMPORTANT: You are about to modify a critical file.
- Ensure changes are backwards compatible
- Update tests if behavior changes
- Document breaking changes in CHANGELOG
`;

  return outputAllowWithContext(context);
}
```

**Use Cases:**
- Warn about risky operations
- Inject best practices before execution
- Provide contextual guidance based on detected patterns

### Session ID Guaranteed

CC 2.1.9 guarantees `session_id` field is always present:

```typescript
export function myHook(input: HookInput): HookResult {
  // No fallback needed - session_id guaranteed
  const sessionId = input.session_id;
  logHook('my-hook', `Session: ${sessionId}`);
}
```

---

## CC 2.1.16 Compliance (Task Management)

Hooks can interact with CC 2.1.16 Task Management System for dependency tracking:

```typescript
// Example: Create task dependency when detecting blocking issue
export function myHook(input: HookInput): HookResult {
  const context = `
⚠️ Migration required before proceeding

Consider creating a task:
- Subject: "Run database migration"
- Add blockedBy dependency to current task
`;

  return outputWithContext(context);
}
```

**Task Status Workflow:**
- `pending` → `in_progress` → `completed`

**Dependency Tracking:**
- Use `blockedBy` for prerequisites
- Use `blocks` for dependent tasks

See `skills/task-dependency-patterns` for comprehensive patterns.

---

## Logging

### Hook Logging

```typescript
import { logHook } from './lib/common.js';

// Log general hook activity
logHook('my-hook', 'Processing bash command');
logHook('my-hook', `File: ${filePath}`);
```

**Output:** `~/.claude/logs/ork/hooks.log` (if installed via plugin) or `.claude/logs/hooks.log`

**Format:** `[2026-01-23 10:15:30] [my-hook] Processing bash command`

**Rotation:** Automatic at 200KB

### Permission Feedback Logging

```typescript
import { logPermissionFeedback } from './lib/common.js';

// Log permission decisions for audit trail
logPermissionFeedback('allow', 'Auto-approved readonly operation', input);
logPermissionFeedback('deny', 'Blocked dangerous command', input);
logPermissionFeedback('warn', 'Potential security risk detected', input);
```

**Output:** `~/.claude/logs/ork/permission-feedback.log`

**Format:** `2026-01-23T10:15:30.123Z | allow | Auto-approved readonly operation | tool=Read | session=abc123`

**Rotation:** Automatic at 100KB

---

## Type Guards

Use type guards to narrow tool input types:

```typescript
import { isBashInput, isWriteInput, isEditInput } from '../types.js';
import type { BashToolInput, WriteToolInput } from '../types.js';

export function myHook(input: HookInput): HookResult {
  if (isBashInput(input.tool_input)) {
    // TypeScript knows tool_input has 'command' field
    const command: string = input.tool_input.command;
  }

  if (isWriteInput(input.tool_input)) {
    // TypeScript knows tool_input has 'file_path' and 'content'
    const filePath: string = input.tool_input.file_path;
    const content: string = input.tool_input.content;
  }
}
```

**Available Type Guards:**
- `isBashInput(input)` - Bash tool (command field)
- `isWriteInput(input)` - Write tool (file_path, content)
- `isEditInput(input)` - Edit tool (file_path, old_string, new_string)
- `isReadInput(input)` - Read tool (file_path)

---

## Best Practices

### 1. Use Guards Early

```typescript
// ✅ Good: Guard at top, fast return
export function myHook(input: HookInput): HookResult {
  const guardResult = guardBash(input);
  if (guardResult) return guardResult;

  // Hook logic...
}

// ❌ Bad: Complex logic before guard check
export function myHook(input: HookInput): HookResult {
  const command = input.tool_input.command || '';
  const normalized = normalizeCommand(command);
  // ... 50 lines of logic ...

  if (input.tool_name !== 'Bash') return outputSilentSuccess(); // Too late!
}
```

### 2. Silent by Default

```typescript
// ✅ Good: Silent success for non-issues
if (noIssuesFound) {
  return outputSilentSuccess();
}

// ❌ Bad: Noisy logging for normal operations
return {
  continue: true,
  systemMessage: "✓ Hook completed successfully" // Don't spam user
};
```

### 3. Block with Clear Reasons

```typescript
// ✅ Good: Explain WHY and HOW to fix
return outputBlock(`
❌ Direct commits to 'main' branch are not allowed.

Fix: Create a feature branch
  git checkout -b feature/my-feature
  git commit -m "Your changes"
  gh pr create
`);

// ❌ Bad: Vague error
return outputBlock('Operation not allowed');
```

### 4. Use Type Guards

```typescript
// ✅ Good: Type-safe access
if (isBashInput(input.tool_input)) {
  const command = input.tool_input.command; // TypeScript knows this exists
}

// ❌ Bad: Unsafe access
const command = input.tool_input.command || ''; // Might be undefined
```

### 5. Log Sparingly

```typescript
// ✅ Good: Log meaningful events
logHook('my-hook', `Blocked dangerous command: ${command}`);

// ❌ Bad: Log noise
logHook('my-hook', 'Hook started');
logHook('my-hook', 'Checking command...');
logHook('my-hook', 'Command is safe');
logHook('my-hook', 'Hook finished');
```

### 6. Handle Errors Gracefully

```typescript
// ✅ Good: Catch errors, return silent success
export function myHook(input: HookInput): HookResult {
  try {
    // Hook logic...
    return outputSilentSuccess();
  } catch (err) {
    logHook('my-hook', `Error: ${err.message}`);
    return outputSilentSuccess(); // Don't block on hook errors
  }
}

// ❌ Bad: Let errors crash the hook
export function myHook(input: HookInput): HookResult {
  const data = fs.readFileSync('/nonexistent'); // May throw!
  // Hook logic...
}
```

---

## Performance Considerations

### Bundle Size

- **Target:** < 100 KB
- **Current:** ~35 KB (well within target)
- **Strategy:** Single-file ESM bundle, no external dependencies

### Hook Execution Time

- **Permission hooks:** < 10ms (block if slower)
- **PreTool hooks:** < 50ms (critical path)
- **PostTool hooks:** < 100ms (non-blocking)

### Optimization Tips

1. **Early returns:** Use guards at top of function
2. **Lazy loading:** Import heavy dependencies only when needed
3. **Avoid I/O:** Minimize file system operations
4. **Cache results:** Store expensive computations
5. **Skip trivial:** Use guards to skip echo, ls, pwd, etc.

---

## Troubleshooting

### Hook Not Running

**Check:**
1. Hook registered in `src/index.ts`?
2. Hook added to `.claude/settings.json`?
3. Bundle built? (`npm run build`)
4. Matcher pattern correct?

**Debug:**
```bash
# Test hook directly
echo '{"tool_name":"Bash","session_id":"test","tool_input":{"command":"git status"}}' | \
  node bin/run-hook.mjs pretool/bash/my-hook
```

### Hook Blocking Incorrectly

**Check:**
1. Guard logic correct?
2. Using correct output builder?
3. Return early for non-matching cases?

**Debug:**
```typescript
// Add logging
logHook('my-hook', `Tool: ${input.tool_name}, Command: ${input.tool_input.command}`);
```

### Bundle Size Exceeds 100KB

**Actions:**
1. Check `dist/bundle-stats.json` for breakdown
2. Identify large dependencies
3. Consider lazy loading or removal
4. Run `npm run build` and check warnings

### TypeScript Errors

**Check:**
```bash
npm run typecheck
```

**Common Issues:**
- Missing type imports
- Incorrect type annotations
- Outdated types.ts definitions

---

## Migration from Bash

120 bash hooks remain in legacy directories. Migration checklist:

1. **Read original bash hook** - Understand logic
2. **Port to TypeScript** - Use types.ts interfaces
3. **Add guards** - Use guards.ts helpers
4. **Add logging** - Use logHook for tracking
5. **Write tests** - Add unit tests
6. **Register hook** - Add to src/index.ts
7. **Build and test** - Verify bundle works
8. **Update .claude/settings.json** - Point to TS version
9. **Remove bash version** - Delete old hook

**Example Migration:**

```bash
# Before (bash)
#!/usr/bin/env bash
if [[ "$TOOL_NAME" != "Bash" ]]; then
  echo '{"continue":true,"suppressOutput":true}'
  exit 0
fi
# ... logic ...
```

```typescript
// After (TypeScript)
import { guardBash, outputSilentSuccess } from './lib/guards.js';

export function myHook(input: HookInput): HookResult {
  const guardResult = guardBash(input);
  if (guardResult) return guardResult;

  // ... logic ...
  return outputSilentSuccess();
}
```

---

## References

- **Claude Code Plugin Docs:** https://docs.anthropic.com/claude-code/plugins
- **CC 2.1.16 Spec:** Task Management System with dependency tracking
- **CC 2.1.9 Spec:** additionalContext support
- **CC 2.1.7 Spec:** Hook output format
- **Project README:** `/Users/yonatangross/coding/projects/orchestkit/README.md`
- **CLAUDE.md:** `/Users/yonatangross/coding/projects/orchestkit/CLAUDE.md`

---

**Last Updated:** 2026-01-23
**Version:** 1.0.0 (Phase 1: 27/147 hooks migrated)
**Bundle Size:** 35.60 KB
**Claude Code Requirement:** >= 2.1.16
