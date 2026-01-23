/**
 * Decision Sync Pull - SessionStart Hook
 * CC 2.1.7 Compliant: uses hookSpecificOutput.additionalContext
 * Reminds about retrieving past decisions from mem0 on session start
 *
 * Part of mem0 Semantic Memory Integration (#47)
 */

import type { HookInput, HookResult } from '../types.js';
import { logHook, getProjectDir, outputSilentSuccess } from '../lib/common.js';

/**
 * Get project ID for user_id hint
 */
function getProjectId(projectDir: string): string {
  const parts = projectDir.split('/');
  const basename = parts[parts.length - 1] || 'unknown';
  return basename.toLowerCase().replace(/\s+/g, '-');
}

/**
 * Decision sync pull hook
 */
export function decisionSyncPull(input: HookInput): HookResult {
  const projectDir = input.project_dir || getProjectDir();
  const projectId = getProjectId(projectDir);
  const userId = `${projectId}-decisions`;

  logHook('decision-sync-pull', `Session starting - decision recall available with user_id: ${userId}`);

  // Note: SessionStart hooks don't support hookSpecificOutput.additionalContext
  // Context injection happens via session-context-loader instead
  logHook('decision-sync-pull', `Decision memory available: user_id='${userId}' for ${projectId}`);

  return outputSilentSuccess();
}
