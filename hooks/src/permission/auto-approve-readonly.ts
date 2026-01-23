/**
 * Auto-Approve Readonly - Automatically approves read-only operations
 * Hook: PermissionRequest (Read|Glob|Grep)
 * CC 2.1.6 Compliant: includes continue field in all outputs
 */

import type { HookInput, HookResult } from '../types.js';
import { outputSilentAllow, logHook, logPermissionFeedback } from '../lib/common.js';

/**
 * Auto-approve read-only tools: Read, Glob, Grep
 */
export function autoApproveReadonly(input: HookInput): HookResult {
  const toolName = input.tool_name;

  logHook('auto-approve-readonly', `Auto-approving readonly: ${toolName}`);
  logPermissionFeedback('allow', `Auto-approved readonly: ${toolName}`, input);

  return outputSilentAllow();
}
