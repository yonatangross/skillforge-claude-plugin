#!/usr/bin/env node
/**
 * CLI Runner for OrchestKit TypeScript Hooks
 *
 * Usage: run-hook.mjs <hook-name>
 * Example: run-hook.mjs permission/auto-approve-readonly
 *
 * Reads hook input from stdin, executes the hook, outputs result to stdout.
 */

import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Dynamic import the hooks module (built by esbuild)
let hooks;
try {
  const hooksPath = join(__dirname, '..', 'dist', 'hooks.mjs');
  hooks = await import(hooksPath);
} catch (err) {
  // Bundle not found - likely not built yet
  // Output silent success to not block Claude Code
  console.log('{"continue":true,"suppressOutput":true}');
  process.exit(0);
}

const hookName = process.argv[2];

// If no hook name provided, output silent success
if (!hookName) {
  console.log('{"continue":true,"suppressOutput":true}');
  process.exit(0);
}

// Get the hook function from the registry
const hookFn = hooks.hooks?.[hookName];

// If hook not found (not migrated yet), output silent success
if (!hookFn) {
  console.log('{"continue":true,"suppressOutput":true}');
  process.exit(0);
}

// Read stdin with timeout to prevent hanging
let input = '';
let stdinClosed = false;

// Set up timeout - if no input received within 100ms, assume no input
const timeout = setTimeout(() => {
  if (!stdinClosed) {
    stdinClosed = true;
    runHook({});
  }
}, 100);

process.stdin.setEncoding('utf8');

process.stdin.on('data', (chunk) => {
  clearTimeout(timeout);
  input += chunk;
});

process.stdin.on('end', () => {
  clearTimeout(timeout);
  if (!stdinClosed) {
    stdinClosed = true;
    try {
      const parsedInput = input.trim() ? JSON.parse(input) : {};
      runHook(parsedInput);
    } catch (err) {
      // JSON parse error - output error message but continue
      console.log(JSON.stringify({
        continue: true,
        systemMessage: `Hook input parse error: ${err.message}`,
      }));
    }
  }
});

process.stdin.on('error', () => {
  clearTimeout(timeout);
  if (!stdinClosed) {
    stdinClosed = true;
    runHook({});
  }
});

/**
 * Execute the hook and output result
 */
async function runHook(parsedInput) {
  try {
    const result = await hookFn(parsedInput);
    console.log(JSON.stringify(result));
  } catch (err) {
    // On any error, output silent success to not block Claude Code
    console.log(JSON.stringify({
      continue: true,
      systemMessage: `Hook error (${hookName}): ${err.message}`,
    }));
  }
}
