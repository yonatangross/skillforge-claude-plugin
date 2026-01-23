/**
 * Git Atomic Commit Checker Hook
 * Warns when committing too many changes in a single commit
 * CC 2.1.9: Injects guidance via additionalContext
 */

import type { HookInput, HookResult } from '../../types.js';
import {
  outputSilentSuccess,
  outputAllowWithContext,
  logHook,
  logPermissionFeedback,
} from '../../lib/common.js';
import { getGitStatus } from '../../lib/git.js';

/**
 * Thresholds for atomic commit warnings
 */
const STAGED_FILE_WARNING_THRESHOLD = 10;
const CHANGED_LINE_WARNING_THRESHOLD = 500;

/**
 * Check for atomic commits (not too many changes)
 */
export function gitAtomicCommitChecker(input: HookInput): HookResult {
  const command = input.tool_input.command || '';

  // Only process git commit commands
  if (!/^git\s+commit/.test(command)) {
    return outputSilentSuccess();
  }

  // Get git status
  const status = getGitStatus(input.project_dir);
  const stagedFiles = status.split('\n').filter((line) => line.trim().length > 0);
  const stagedCount = stagedFiles.length;

  if (stagedCount > STAGED_FILE_WARNING_THRESHOLD) {
    const context = `Large commit detected: ${stagedCount} files staged.

Atomic commits are easier to review, revert, and understand.
Consider splitting into smaller, focused commits:
  - Group related changes together
  - One feature/fix per commit
  - Max 5-10 files per commit recommended

Continue if this is intentional (refactoring, deps update, etc.)`;

    logPermissionFeedback('allow', `Large commit: ${stagedCount} files`, input);
    logHook('git-atomic-commit-checker', `Warning: ${stagedCount} files`);
    return outputAllowWithContext(context);
  }

  // Small commit, all good
  logPermissionFeedback('allow', 'Atomic commit check passed', input);
  return outputSilentSuccess();
}
