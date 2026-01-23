/**
 * Git Branch Protection Hook
 * Prevents commits and pushes to dev/main branches
 * CC 2.1.9 Enhanced: injects additionalContext before git commands
 */

import type { HookInput, HookResult } from '../../types.js';
import {
  outputSilentSuccess,
  outputDeny,
  outputWithContext,
  logHook,
  logPermissionFeedback,
} from '../../lib/common.js';
import { getCurrentBranch, isProtectedBranch } from '../../lib/git.js';

/**
 * Protect dev/main/master branches from direct commits/pushes
 */
export function gitBranchProtection(input: HookInput): HookResult {
  const command = input.tool_input.command || '';

  // Check if this is a git command
  if (!command.startsWith('git')) {
    return outputSilentSuccess();
  }

  // Get current branch
  const currentBranch = getCurrentBranch(input.project_dir);

  // Check if on a protected branch
  if (isProtectedBranch(currentBranch)) {
    // Check if command is commit or push
    if (/git\s+commit/.test(command) || /git\s+push/.test(command)) {
      const errorMsg = `BLOCKED: Cannot commit or push directly to '${currentBranch}' branch.

You are currently on branch: ${currentBranch}

Required workflow:
1. Create a feature branch:
   git checkout -b issue/<number>-<description>

2. Make your changes and commit:
   git add .
   git commit -m "feat(#<number>): Description"

3. Push the feature branch:
   git push -u origin issue/<number>-<description>

4. Create a pull request:
   gh pr create --base dev

Aborting command to protect ${currentBranch} branch.`;

      logPermissionFeedback('deny', `Blocked ${command} on protected branch ${currentBranch}`, input);
      logHook('git-branch-protection', `BLOCKED: ${command} on ${currentBranch}`);

      return outputDeny(errorMsg);
    }

    // CC 2.1.9: On protected branch but not commit/push - inject warning context
    const branchContext = `Branch: ${currentBranch} (PROTECTED). Direct commits blocked. Create feature branch for changes: git checkout -b issue/<number>-<desc>`;
    logPermissionFeedback('allow', `Git command on protected branch: ${command}`, input);
    return outputWithContext(branchContext);
  }

  // CC 2.1.9: On feature branch with commit/push/merge - inject helpful context
  if (/git\s+(commit|push|merge)/.test(command)) {
    const branchContext = `Branch: ${currentBranch}. Protected: dev, main, master. PR workflow: push to feature branch, then gh pr create --base dev`;
    logPermissionFeedback('allow', `Git command allowed: ${command}`, input);
    return outputWithContext(branchContext);
  }

  // Allow other git operations (fetch, pull, status, etc.) without context injection
  logPermissionFeedback('allow', `Git command allowed: ${command}`, input);
  return outputSilentSuccess();
}
