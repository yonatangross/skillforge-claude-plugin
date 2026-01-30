#!/usr/bin/env node
/**
 * Background Worker for Fire-and-Forget Hooks
 * Issue #243: Process hook work in detached background process
 *
 * This worker is spawned by fire-and-forget.ts and runs independently
 * of the main hook process. It reads work from a temp file, executes
 * the appropriate dispatcher, and cleans up.
 *
 * Usage: node background-worker.mjs <work-file-path>
 */

import { readFileSync, unlinkSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Dispatcher registry - maps hook names to their dispatcher functions
const DISPATCHERS = {
  'posttool': async (input) => {
    const { unifiedDispatcher } = await import('../dist/posttool.mjs');
    return unifiedDispatcher(input);
  },
  'lifecycle': async (input) => {
    const { unifiedSessionStartDispatcher } = await import('../dist/lifecycle.mjs');
    return unifiedSessionStartDispatcher(input);
  },
  'subagent-stop': async (input) => {
    const { unifiedSubagentStopDispatcher } = await import('../dist/subagent.mjs');
    return unifiedSubagentStopDispatcher(input);
  },
  'notification': async (input) => {
    const { unifiedNotificationDispatcher } = await import('../dist/notification.mjs');
    return unifiedNotificationDispatcher(input);
  },
  'setup': async (input) => {
    const { unifiedSetupDispatcher } = await import('../dist/setup.mjs');
    return unifiedSetupDispatcher(input);
  },
  'prompt': async (input) => {
    const { captureUserIntent } = await import('../dist/prompt.mjs');
    return captureUserIntent(input);
  }
};

async function main() {
  const workFile = process.argv[2] || process.env.ORCHESTKIT_WORK_FILE;

  if (!workFile) {
    console.error('[background-worker] No work file specified');
    process.exit(1);
  }

  if (!existsSync(workFile)) {
    console.error(`[background-worker] Work file not found: ${workFile}`);
    process.exit(1);
  }

  let work;
  try {
    const content = readFileSync(workFile, 'utf-8');
    work = JSON.parse(content);
  } catch (error) {
    console.error(`[background-worker] Failed to read work file:`, error.message);
    process.exit(1);
  }

  // Clean up work file immediately (we have the data in memory)
  try {
    unlinkSync(workFile);
  } catch {
    // Ignore cleanup errors
  }

  const { hook, input, id } = work;

  const dispatcher = DISPATCHERS[hook];
  if (!dispatcher) {
    console.error(`[background-worker] Unknown hook: ${hook}`);
    process.exit(1);
  }

  try {
    await dispatcher(input);
  } catch (error) {
    // Log but don't fail - fire-and-forget is best-effort
    console.error(`[background-worker] ${hook} dispatcher failed:`, error.message);
  }

  // Exit cleanly
  process.exit(0);
}

main().catch(error => {
  console.error('[background-worker] Fatal error:', error);
  process.exit(1);
});
