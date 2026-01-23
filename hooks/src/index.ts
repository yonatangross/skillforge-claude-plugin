/**
 * OrchestKit Hooks - TypeScript/ESM Entry Point
 *
 * This file exports all hooks and utilities for the bundle.
 * The hook registry maps hook names to their implementations.
 */

// Re-export types
export * from './types.js';

// Re-export utilities
export * from './lib/common.js';
export * from './lib/git.js';
export * from './lib/guards.js';

// Import hook implementations
// Permission hooks
import { autoApproveReadonly } from './permission/auto-approve-readonly.js';
import { autoApproveSafeBash } from './permission/auto-approve-safe-bash.js';
import { autoApproveProjectWrites } from './permission/auto-approve-project-writes.js';
import { learningTracker } from './permission/learning-tracker.js';

// PreTool/Bash hooks
import { dangerousCommandBlocker } from './pretool/bash/dangerous-command-blocker.js';
import { gitBranchProtection } from './pretool/bash/git-branch-protection.js';
import { gitCommitMessageValidator } from './pretool/bash/git-commit-message-validator.js';
import { gitBranchNamingValidator } from './pretool/bash/git-branch-naming-validator.js';
import { gitAtomicCommitChecker } from './pretool/bash/git-atomic-commit-checker.js';
import { compoundCommandValidator } from './pretool/bash/compound-command-validator.js';
import { defaultTimeoutSetter } from './pretool/bash/default-timeout-setter.js';
import { errorPatternWarner } from './pretool/bash/error-pattern-warner.js';
import { conflictPredictor } from './pretool/bash/conflict-predictor.js';
import { affectedTestsFinder } from './pretool/bash/affected-tests-finder.js';
import { ciSimulation } from './pretool/bash/ci-simulation.js';
import { preCommitSimulation } from './pretool/bash/pre-commit-simulation.js';
import { prMergeGate } from './pretool/bash/pr-merge-gate.js';
import { changelogGenerator } from './pretool/bash/changelog-generator.js';
import { versionSync } from './pretool/bash/version-sync.js';
import { licenseCompliance } from './pretool/bash/license-compliance.js';
import { ghIssueCreationGuide } from './pretool/bash/gh-issue-creation-guide.js';
import { issueDocsRequirement } from './pretool/bash/issue-docs-requirement.js';
import { multiInstanceQualityGate } from './pretool/bash/multi-instance-quality-gate.js';
import { agentBrowserSafety } from './pretool/bash/agent-browser-safety.js';

// PreTool/Write-Edit hooks
import { fileGuard } from './pretool/write-edit/file-guard.js';
import { fileLockCheck } from './pretool/write-edit/file-lock-check.js';
import { multiInstanceLock } from './pretool/write-edit/multi-instance-lock.js';

import type { HookFn } from './types.js';

/**
 * Hook registry - maps hook names to implementations
 *
 * Hook names use the format: <category>/<hook-name>
 * e.g., 'permission/auto-approve-readonly', 'pretool/bash/git-branch-protection'
 */
export const hooks: Record<string, HookFn> = {
  // Permission hooks (4)
  'permission/auto-approve-readonly': autoApproveReadonly,
  'permission/auto-approve-safe-bash': autoApproveSafeBash,
  'permission/auto-approve-project-writes': autoApproveProjectWrites,
  'permission/learning-tracker': learningTracker,

  // PreTool/Bash hooks (20)
  'pretool/bash/dangerous-command-blocker': dangerousCommandBlocker,
  'pretool/bash/git-branch-protection': gitBranchProtection,
  'pretool/bash/git-commit-message-validator': gitCommitMessageValidator,
  'pretool/bash/git-branch-naming-validator': gitBranchNamingValidator,
  'pretool/bash/git-atomic-commit-checker': gitAtomicCommitChecker,
  'pretool/bash/compound-command-validator': compoundCommandValidator,
  'pretool/bash/default-timeout-setter': defaultTimeoutSetter,
  'pretool/bash/error-pattern-warner': errorPatternWarner,
  'pretool/bash/conflict-predictor': conflictPredictor,
  'pretool/bash/affected-tests-finder': affectedTestsFinder,
  'pretool/bash/ci-simulation': ciSimulation,
  'pretool/bash/pre-commit-simulation': preCommitSimulation,
  'pretool/bash/pr-merge-gate': prMergeGate,
  'pretool/bash/changelog-generator': changelogGenerator,
  'pretool/bash/version-sync': versionSync,
  'pretool/bash/license-compliance': licenseCompliance,
  'pretool/bash/gh-issue-creation-guide': ghIssueCreationGuide,
  'pretool/bash/issue-docs-requirement': issueDocsRequirement,
  'pretool/bash/multi-instance-quality-gate': multiInstanceQualityGate,
  'pretool/bash/agent-browser-safety': agentBrowserSafety,

  // PreTool/Write-Edit hooks (3)
  'pretool/write-edit/file-guard': fileGuard,
  'pretool/write-edit/file-lock-check': fileLockCheck,
  'pretool/write-edit/multi-instance-lock': multiInstanceLock,
};

/**
 * Get a hook by name
 */
export function getHook(name: string): HookFn | undefined {
  return hooks[name];
}

/**
 * List all registered hooks
 */
export function listHooks(): string[] {
  return Object.keys(hooks);
}

/**
 * Run a hook by name
 */
export async function runHook(
  name: string,
  input: Parameters<HookFn>[0]
): Promise<ReturnType<HookFn>> {
  const hook = getHook(name);
  if (!hook) {
    return { continue: true, suppressOutput: true };
  }
  return hook(input);
}
