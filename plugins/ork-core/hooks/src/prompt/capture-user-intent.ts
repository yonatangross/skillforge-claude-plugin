/**
 * Capture User Intent Hook - Extract decisions and preferences from user prompts
 *
 * Part of Intelligent Decision Capture System
 * Hook: UserPromptSubmit
 *
 * Purpose:
 * - Capture decisions when users say "let's use X" or "chose Y over Z"
 * - Extract preferences when users express "I prefer X"
 * - Track problems/issues for later solution pairing
 * - Store with rationale ("because...") when present
 *
 * Storage:
 * - Decisions → .claude/memory/pending-decisions.jsonl
 * - Preferences → .claude/memory/user-preferences.jsonl
 * - Problems → .claude/memory/open-problems.jsonl
 *
 * CC 2.1.16 Compliant - Uses outputSilentSuccess for non-blocking capture
 */

import type { HookInput, HookResult } from '../types.js';
import {
  outputSilentSuccess,
  getProjectDir,
  getSessionId,
  logHook,
} from '../lib/common.js';
import {
  detectUserIntent,
  type UserIntent,
  type IntentDetectionResult,
} from '../lib/user-intent-detector.js';
import {
  trackDecisionMade,
  trackPreferenceStated,
  trackProblemReported,
} from '../lib/session-tracker.js';
import { existsSync, appendFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';

// =============================================================================
// CONSTANTS
// =============================================================================

const HOOK_NAME = 'capture-user-intent';
const MIN_PROMPT_LENGTH = 15; // Skip very short prompts

// =============================================================================
// STORAGE TYPES
// =============================================================================
// GAP-003/004 FIX: Removed StoredDecision and StoredPreference interfaces
// These types were only used by the now-removed storeDecisions/storePreferences functions
// Decision/preference data flows through events.jsonl via session-tracker

/**
 * Stored problem record for solution pairing
 */
interface StoredProblem {
  id: string;
  timestamp: string;
  session_id: string;
  type: 'problem';
  text: string;
  confidence: number;
  entities: string[];
  project: string;
  status: 'open' | 'solved' | 'abandoned';
}

/**
 * Generate unique ID
 */
function generateId(prefix: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Get project name from directory
 */
function getProjectName(): string {
  const projectDir = getProjectDir();
  return projectDir.split('/').pop() || 'unknown';
}

/**
 * Append record to JSONL file
 */
function appendToJsonl(filePath: string, record: unknown): boolean {
  try {
    const dir = dirname(filePath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    const line = JSON.stringify(record) + '\n';
    appendFileSync(filePath, line);
    return true;
  } catch (err) {
    logHook(HOOK_NAME, `Failed to write to ${filePath}: ${err}`, 'warn');
    return false;
  }
}

// =============================================================================
// GAP-003/004 FIX: Removed storeDecisions() and storePreferences()
// These functions wrote to pending-decisions.jsonl and user-preferences.jsonl
// but those files were never read (write-only dead ends).
// Decision/preference data is now tracked via trackDecisionMade/trackPreferenceStated
// which writes to events.jsonl and feeds into user profile aggregation.
// =============================================================================

/**
 * Store problems for later solution pairing
 */
function storeProblems(problems: UserIntent[], sessionId: string): number {
  if (problems.length === 0) return 0;

  const projectDir = getProjectDir();
  const filePath = join(projectDir, '.claude', 'memory', 'open-problems.jsonl');
  const project = getProjectName();
  const timestamp = new Date().toISOString();
  let stored = 0;

  for (const problem of problems) {
    const record: StoredProblem = {
      id: generateId('prob'),
      timestamp,
      session_id: sessionId,
      type: 'problem',
      text: problem.text,
      confidence: problem.confidence,
      entities: problem.entities,
      project,
      status: 'open',
    };

    if (appendToJsonl(filePath, record)) {
      stored++;
    }
  }

  return stored;
}

// =============================================================================
// SESSION TRACKING INTEGRATION
// =============================================================================

/**
 * Track detected intents in the session tracker for user profile aggregation.
 * This bridges the intent detection to the centralized session event tracking.
 */
function trackIntentsInSession(result: IntentDetectionResult): void {
  try {
    // Track decisions with rationale
    for (const decision of result.decisions) {
      trackDecisionMade(
        decision.text,
        decision.rationale,
        decision.confidence
      );
    }

    // Track preferences
    for (const preference of result.preferences) {
      trackPreferenceStated(
        preference.text,
        preference.confidence
      );
    }

    // Track problems for later solution pairing
    for (const problem of result.problems) {
      trackProblemReported(problem.text);
    }
  } catch (err) {
    logHook(HOOK_NAME, `Session tracking failed: ${err}`, 'warn');
  }
}

// =============================================================================
// MAIN HOOK
// =============================================================================

/**
 * Capture user intent from prompts
 *
 * This hook runs on UserPromptSubmit and extracts:
 * - Decisions: "let's use X", "chose Y over Z"
 * - Preferences: "I prefer X", "always use Y"
 * - Problems: "error with X", "not working"
 *
 * All storage is fire-and-forget to avoid blocking the prompt.
 */
export function captureUserIntent(input: HookInput): HookResult {
  const prompt = input.prompt;

  // Skip if no prompt
  if (!prompt || prompt.length < MIN_PROMPT_LENGTH) {
    return outputSilentSuccess();
  }

  // Get session ID
  const sessionId = input.session_id || getSessionId();

  // Detect intents
  let result: IntentDetectionResult;
  try {
    result = detectUserIntent(prompt);
  } catch (err) {
    logHook(HOOK_NAME, `Intent detection failed: ${err}`, 'warn');
    return outputSilentSuccess();
  }

  // Nothing detected
  if (result.intents.length === 0) {
    return outputSilentSuccess();
  }

  // Track intents in session tracker for user profile aggregation
  // Note: decisions and preferences go to events.jsonl via trackDecisionMade/trackPreferenceStated
  // GAP-003/004 fix: Removed storeDecisions/storePreferences (wrote to never-read files)
  trackIntentsInSession(result);

  // Store problems to open-problems.jsonl for problem-tracker.ts (GAP-005 wired via GAP-011)
  const problemsStored = storeProblems(result.problems, sessionId);

  if (problemsStored > 0) {
    logHook(HOOK_NAME, `Captured: ${problemsStored} problems`, 'info');
  }
  if (result.decisions.length > 0 || result.preferences.length > 0) {
    logHook(
      HOOK_NAME,
      `Tracked: ${result.decisions.length} decisions, ${result.preferences.length} preferences (to events.jsonl)`,
      'debug'
    );
  }

  // Always silent success - this is a background capture hook
  return outputSilentSuccess();
}
