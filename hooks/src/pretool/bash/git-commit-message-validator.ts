/**
 * Git Commit Message Validator Hook
 * Enforces conventional commit format: type(#issue): description
 * CC 2.1.9: Injects guidance via additionalContext
 */

import type { HookInput, HookResult } from '../../types.js';
import {
  outputSilentSuccess,
  outputDeny,
  outputAllowWithContext,
  logHook,
  logPermissionFeedback,
} from '../../lib/common.js';

/**
 * Valid conventional commit types
 */
const VALID_TYPES = ['feat', 'fix', 'refactor', 'docs', 'test', 'chore', 'style', 'perf', 'ci', 'build'];

/**
 * Extract commit message from git commit command
 */
function extractCommitMessage(command: string): string | null {
  // Pattern: git commit -m "msg" or git commit -m 'msg'
  const quotedMatch = command.match(/-m\s+["']([^"']+)["']/);
  if (quotedMatch) {
    return quotedMatch[1];
  }

  // Pattern: git commit -m msg (unquoted single word)
  const unquotedMatch = command.match(/-m\s+(\S+)/);
  if (unquotedMatch) {
    return unquotedMatch[1];
  }

  return null;
}

/**
 * Validate commit message follows conventional commit format
 */
export function gitCommitMessageValidator(input: HookInput): HookResult {
  const command = input.tool_input.command || '';

  // Only process git commit commands
  if (!/^git\s+commit/.test(command)) {
    return outputSilentSuccess();
  }

  // Check for heredoc pattern
  if (/<<['"]?EOF/.test(command)) {
    const context = `Commit via heredoc detected. Ensure format: type(#issue): description

Allowed types: ${VALID_TYPES.join(', ')}
Example: feat(#123): Add user authentication

Commit MUST end with:
Co-Authored-By: Claude <noreply@anthropic.com>`;

    logPermissionFeedback('allow', 'Heredoc commit - injecting format guidance', input);
    return outputAllowWithContext(context);
  }

  // Extract commit message
  const commitMsg = extractCommitMessage(command);

  // No message found (probably interactive commit) - allow with guidance
  if (!commitMsg) {
    const context = `Interactive commit detected. Use conventional format:
type(#issue): description

Types: ${VALID_TYPES.join('|')}`;

    logPermissionFeedback('allow', 'Interactive commit - injecting guidance', input);
    return outputAllowWithContext(context);
  }

  // Validate commit message format
  // Pattern: type(#issue): description OR type: description OR type(scope): description
  const typesPattern = VALID_TYPES.join('|');
  const conventionalPattern = new RegExp(`^(${typesPattern})(\\(#?[0-9]+\\)|(\\([a-z-]+\\)))?: .+`);
  const simplePattern = new RegExp(`^(${typesPattern}): .+`);

  if (conventionalPattern.test(commitMsg) || simplePattern.test(commitMsg)) {
    // Valid format - check title length
    const titleLine = commitMsg.split('\n')[0];
    const titleLen = titleLine.length;

    if (titleLen > 72) {
      const context = `Commit message title is ${titleLen} chars (recommended: <72).
Consider shortening: ${titleLine.slice(0, 50)}...`;
      logPermissionFeedback('allow', `Valid commit but long title (${titleLen} chars)`, input);
      return outputAllowWithContext(context);
    }

    // All good
    logPermissionFeedback('allow', `Valid conventional commit: ${commitMsg}`, input);
    logHook('git-commit-message-validator', `Valid: ${commitMsg}`);
    return outputSilentSuccess();
  }

  // Invalid format - BLOCK with guidance
  const errorMsg = `INVALID COMMIT MESSAGE FORMAT

Your message: "${commitMsg}"

Required format: type(#issue): description

Allowed types:
  feat     - New feature
  fix      - Bug fix
  refactor - Code restructuring
  docs     - Documentation only
  test     - Adding/updating tests
  chore    - Build process, deps
  style    - Formatting, whitespace
  perf     - Performance improvement
  ci       - CI/CD changes
  build    - Build system changes

Examples:
  feat(#123): Add user authentication
  fix(#456): Resolve login redirect loop
  refactor: Extract validation helpers
  docs: Update API documentation

Please update your commit message to follow conventional format.`;

  logPermissionFeedback('deny', `Invalid commit format: ${commitMsg}`, input);
  logHook('git-commit-message-validator', `Invalid: ${commitMsg}`);

  return outputDeny(errorMsg);
}
