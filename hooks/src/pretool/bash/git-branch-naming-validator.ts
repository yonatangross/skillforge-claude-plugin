/**
 * Git Branch Naming Validator Hook
 * Validates branch names follow conventions (issue/123-description)
 * CC 2.1.9: Injects guidance via additionalContext
 */

import type { HookInput, HookResult } from '../../types.js';
import {
  outputSilentSuccess,
  outputAllowWithContext,
  logHook,
  logPermissionFeedback,
} from '../../lib/common.js';
import { validateBranchName } from '../../lib/git.js';

/**
 * Validate branch names on checkout -b commands
 */
export function gitBranchNamingValidator(input: HookInput): HookResult {
  const command = input.tool_input.command || '';

  // Only process git checkout -b or git branch commands
  if (!/git\s+(checkout\s+-b|branch\s+)/.test(command)) {
    return outputSilentSuccess();
  }

  // Extract branch name
  let branchName: string | null = null;

  // git checkout -b <branch>
  const checkoutMatch = command.match(/checkout\s+-b\s+(\S+)/);
  if (checkoutMatch) {
    branchName = checkoutMatch[1];
  }

  // git branch <branch>
  const branchMatch = command.match(/git\s+branch\s+(\S+)/);
  if (branchMatch && !branchName) {
    branchName = branchMatch[1];
  }

  if (!branchName) {
    return outputSilentSuccess();
  }

  // Validate branch name
  const validationError = validateBranchName(branchName);

  if (validationError) {
    const context = `Branch naming: ${validationError}

Recommended formats:
  issue/123-description
  feature/user-auth
  fix/login-bug
  chore/update-deps

Example: git checkout -b issue/123-add-user-auth`;

    logPermissionFeedback('allow', `Branch naming guidance: ${branchName}`, input);
    logHook('git-branch-naming-validator', `Guidance for: ${branchName}`);
    return outputAllowWithContext(context);
  }

  // Valid branch name
  logPermissionFeedback('allow', `Valid branch name: ${branchName}`, input);
  return outputSilentSuccess();
}
