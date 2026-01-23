/**
 * Decision Sync Push - SessionEnd Hook
 * CC 2.1.7 Compliant: outputs JSON with correct field names
 * Pushes pending decisions to mem0 on session end
 *
 * Part of mem0 Semantic Memory Integration (#47)
 */

import { existsSync, readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import type { HookInput, HookResult } from '../types.js';
import { logHook, getProjectDir, getPluginRoot, outputSilentSuccess } from '../lib/common.js';

interface PendingDecisions {
  count?: number;
  decisions?: unknown[];
}

/**
 * Get pending decisions count
 */
function getPendingCount(projectDir: string, pluginRoot: string): number {
  const syncScript = `${projectDir}/.claude/scripts/decision-sync.sh`;
  const fallbackScript = `${pluginRoot}/.claude/scripts/decision-sync.sh`;

  const scriptPath = existsSync(syncScript) ? syncScript : existsSync(fallbackScript) ? fallbackScript : null;

  if (!scriptPath) {
    return 0;
  }

  try {
    const output = execSync(`"${scriptPath}" pending 2>/dev/null || echo "0"`, {
      encoding: 'utf-8',
      timeout: 2000,
    });

    // Parse count from output like "Pending Decisions (84)"
    const match = output.match(/Pending Decisions \((\d+)\)/);
    if (match) {
      return parseInt(match[1], 10);
    }
  } catch {
    // Ignore execution errors
  }

  return 0;
}

/**
 * Decision sync push hook
 */
export function decisionSyncPush(input: HookInput): HookResult {
  const projectDir = input.project_dir || getProjectDir();
  const pluginRoot = getPluginRoot();

  const pendingCount = getPendingCount(projectDir, pluginRoot);

  if (pendingCount === 0) {
    logHook('decision-sync-push', 'No pending decisions to sync');
    return outputSilentSuccess();
  }

  logHook('decision-sync-push', `Found ${pendingCount} pending decisions to sync`);

  // Output sync instructions for Claude to process
  return {
    continue: true,
    systemMessage: `Session ending with ${pendingCount} pending decisions. To sync to mem0, run: decision-sync.sh sync`,
  };
}
