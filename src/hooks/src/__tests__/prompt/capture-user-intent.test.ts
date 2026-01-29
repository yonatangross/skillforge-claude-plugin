/**
 * Unit tests for capture-user-intent hook
 * Tests UserPromptSubmit hook that captures decisions, preferences, and problems from user prompts
 *
 * Part of Intelligent Decision Capture System
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { HookInput } from '../../types.js';

// =============================================================================
// MOCK SETUP
// =============================================================================

// Mock common.js functions
vi.mock('../../lib/common.js', () => ({
  outputSilentSuccess: vi.fn(() => ({ continue: true, suppressOutput: true })),
  getProjectDir: vi.fn(() => '/test/project'),
  getSessionId: vi.fn(() => 'test-session-123'),
  logHook: vi.fn(),
}));

// Mock session-tracker.ts functions
vi.mock('../../lib/session-tracker.js', () => ({
  trackDecisionMade: vi.fn(),
  trackPreferenceStated: vi.fn(),
  trackProblemReported: vi.fn(),
}));

// Mock user-intent-detector.ts
vi.mock('../../lib/user-intent-detector.js', () => ({
  detectUserIntent: vi.fn(() => ({
    intents: [],
    decisions: [],
    preferences: [],
    questions: [],
    problems: [],
    summary: 'No intents detected',
  })),
}));

// Mock node:fs for JSONL storage
vi.mock('node:fs', async () => {
  const actual = await vi.importActual('node:fs');
  return {
    ...actual,
    existsSync: vi.fn(),
    appendFileSync: vi.fn(),
    mkdirSync: vi.fn(),
  };
});

// Import mocked modules
import {
  outputSilentSuccess,
  getProjectDir,
  getSessionId,
  logHook,
} from '../../lib/common.js';
import {
  trackDecisionMade,
  trackPreferenceStated,
  trackProblemReported,
} from '../../lib/session-tracker.js';
import { detectUserIntent } from '../../lib/user-intent-detector.js';
import { existsSync, appendFileSync, mkdirSync } from 'node:fs';

// Import the hook under test
import { captureUserIntent } from '../../prompt/capture-user-intent.js';

// =============================================================================
// Test Utilities
// =============================================================================

/**
 * Create UserPromptSubmit input for testing
 */
function createPromptInput(prompt: string, overrides: Partial<HookInput> = {}): HookInput {
  return {
    hook_event: 'UserPromptSubmit',
    tool_name: 'UserPromptSubmit',
    session_id: 'test-session-123',
    project_dir: '/test/project',
    tool_input: {},
    prompt,
    ...overrides,
  };
}

/**
 * Create mock intent detection result
 */
function createMockIntentResult(options: {
  decisions?: Array<{ text: string; confidence: number; rationale?: string; entities?: string[] }>;
  preferences?: Array<{ text: string; confidence: number; entities?: string[] }>;
  problems?: Array<{ text: string; confidence: number; entities?: string[] }>;
} = {}) {
  const decisions = (options.decisions || []).map((d, i) => ({
    type: 'decision' as const,
    text: d.text,
    confidence: d.confidence,
    rationale: d.rationale,
    entities: d.entities || [],
    position: i * 50,
  }));

  const preferences = (options.preferences || []).map((p, i) => ({
    type: 'preference' as const,
    text: p.text,
    confidence: p.confidence,
    entities: p.entities || [],
    position: i * 50 + 100,
  }));

  const problems = (options.problems || []).map((p, i) => ({
    type: 'problem' as const,
    text: p.text,
    confidence: p.confidence,
    entities: p.entities || [],
    position: i * 50 + 200,
  }));

  const intents = [...decisions, ...preferences, ...problems];

  return {
    intents,
    decisions,
    preferences,
    questions: [],
    problems,
    summary: intents.length > 0
      ? `Detected: ${decisions.length} decisions, ${preferences.length} preferences, ${problems.length} problems`
      : 'No intents detected',
  };
}

// =============================================================================
// Tests
// =============================================================================

describe('prompt/capture-user-intent', () => {
  const mockOutputSilentSuccess = vi.mocked(outputSilentSuccess);
  const mockDetectUserIntent = vi.mocked(detectUserIntent);
  const mockTrackDecisionMade = vi.mocked(trackDecisionMade);
  const mockTrackPreferenceStated = vi.mocked(trackPreferenceStated);
  const mockTrackProblemReported = vi.mocked(trackProblemReported);
  const mockLogHook = vi.mocked(logHook);
  const mockExistsSync = vi.mocked(existsSync);
  const mockAppendFileSync = vi.mocked(appendFileSync);
  const mockMkdirSync = vi.mocked(mkdirSync);

  beforeEach(() => {
    vi.clearAllMocks();
    mockOutputSilentSuccess.mockReturnValue({ continue: true, suppressOutput: true });
    mockDetectUserIntent.mockReturnValue(createMockIntentResult());
    mockExistsSync.mockReturnValue(true);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ===========================================================================
  // 1. Skip short prompts (< 15 chars)
  // ===========================================================================
  describe('skip short prompts', () => {
    it('should skip empty prompts', () => {
      const input = createPromptInput('');
      const result = captureUserIntent(input);

      expect(result.continue).toBe(true);
      expect(result.suppressOutput).toBe(true);
      expect(mockDetectUserIntent).not.toHaveBeenCalled();
    });

    it('should skip undefined prompts', () => {
      const input = createPromptInput('');
      input.prompt = undefined;
      const result = captureUserIntent(input);

      expect(result.continue).toBe(true);
      expect(result.suppressOutput).toBe(true);
      expect(mockDetectUserIntent).not.toHaveBeenCalled();
    });

    it('should skip prompts shorter than 15 characters', () => {
      const input = createPromptInput('short prompt'); // 12 chars
      const result = captureUserIntent(input);

      expect(result.continue).toBe(true);
      expect(result.suppressOutput).toBe(true);
      expect(mockDetectUserIntent).not.toHaveBeenCalled();
    });

    it('should skip prompts exactly at 14 characters', () => {
      const input = createPromptInput('14charactersss'); // 14 chars
      const result = captureUserIntent(input);

      expect(result.continue).toBe(true);
      expect(result.suppressOutput).toBe(true);
      expect(mockDetectUserIntent).not.toHaveBeenCalled();
    });

    it('should process prompts at 15 characters', () => {
      const input = createPromptInput('15 characters!!'); // 15 chars
      const result = captureUserIntent(input);

      expect(result.continue).toBe(true);
      expect(mockDetectUserIntent).toHaveBeenCalled();
    });

    it('should process prompts longer than 15 characters', () => {
      const input = createPromptInput('This is a longer prompt that will be processed');
      const result = captureUserIntent(input);

      expect(result.continue).toBe(true);
      expect(mockDetectUserIntent).toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // 2. Skip empty/undefined prompts
  // ===========================================================================
  describe('skip empty/undefined prompts', () => {
    it('should handle null-ish prompt gracefully', () => {
      const input = createPromptInput('');
      (input as Record<string, unknown>).prompt = null;
      const result = captureUserIntent(input);

      expect(result.continue).toBe(true);
      expect(result.suppressOutput).toBe(true);
    });

    it('should handle missing prompt field', () => {
      const input = createPromptInput('');
      delete (input as Record<string, unknown>).prompt;
      const result = captureUserIntent(input);

      expect(result.continue).toBe(true);
      expect(result.suppressOutput).toBe(true);
    });
  });

  // ===========================================================================
  // 3. Detect decisions and track via trackDecisionMade
  // ===========================================================================
  describe('detect decisions', () => {
    it('should track decisions via trackDecisionMade', () => {
      const mockResult = createMockIntentResult({
        decisions: [
          {
            text: 'I chose PostgreSQL for the database',
            confidence: 0.85,
            rationale: 'better JSON support',
            entities: ['postgresql'],
          },
        ],
      });
      mockDetectUserIntent.mockReturnValue(mockResult);

      const input = createPromptInput('I chose PostgreSQL for the database because of better JSON support');
      captureUserIntent(input);

      expect(mockTrackDecisionMade).toHaveBeenCalledWith(
        'I chose PostgreSQL for the database',
        'better JSON support',
        0.85
      );
    });

    it('should track multiple decisions', () => {
      const mockResult = createMockIntentResult({
        decisions: [
          { text: 'Let us use cursor pagination', confidence: 0.8 },
          { text: 'Selected FastAPI for the backend', confidence: 0.9, rationale: 'async support' },
        ],
      });
      mockDetectUserIntent.mockReturnValue(mockResult);

      const input = createPromptInput('Let us use cursor pagination. Selected FastAPI for the backend.');
      captureUserIntent(input);

      expect(mockTrackDecisionMade).toHaveBeenCalledTimes(2);
      expect(mockTrackDecisionMade).toHaveBeenNthCalledWith(
        1,
        'Let us use cursor pagination',
        undefined,
        0.8
      );
      expect(mockTrackDecisionMade).toHaveBeenNthCalledWith(
        2,
        'Selected FastAPI for the backend',
        'async support',
        0.9
      );
    });

    it('should track decisions without rationale', () => {
      const mockResult = createMockIntentResult({
        decisions: [
          { text: 'Using TypeScript for all code', confidence: 0.75 },
        ],
      });
      mockDetectUserIntent.mockReturnValue(mockResult);

      const input = createPromptInput('Using TypeScript for all code in this project');
      captureUserIntent(input);

      expect(mockTrackDecisionMade).toHaveBeenCalledWith(
        'Using TypeScript for all code',
        undefined,
        0.75
      );
    });
  });

  // ===========================================================================
  // 4. Detect preferences and track via trackPreferenceStated
  // ===========================================================================
  describe('detect preferences', () => {
    it('should track preferences via trackPreferenceStated', () => {
      const mockResult = createMockIntentResult({
        preferences: [
          { text: 'I prefer TypeScript over JavaScript', confidence: 0.9 },
        ],
      });
      mockDetectUserIntent.mockReturnValue(mockResult);

      const input = createPromptInput('I prefer TypeScript over JavaScript for type safety');
      captureUserIntent(input);

      expect(mockTrackPreferenceStated).toHaveBeenCalledWith(
        'I prefer TypeScript over JavaScript',
        0.9
      );
    });

    it('should track multiple preferences', () => {
      const mockResult = createMockIntentResult({
        preferences: [
          { text: 'I always use tabs', confidence: 0.8 },
          { text: 'I prefer kebab-case', confidence: 0.85 },
        ],
      });
      mockDetectUserIntent.mockReturnValue(mockResult);

      const input = createPromptInput('I always use tabs for indentation. I prefer kebab-case for naming.');
      captureUserIntent(input);

      expect(mockTrackPreferenceStated).toHaveBeenCalledTimes(2);
      expect(mockTrackPreferenceStated).toHaveBeenNthCalledWith(1, 'I always use tabs', 0.8);
      expect(mockTrackPreferenceStated).toHaveBeenNthCalledWith(2, 'I prefer kebab-case', 0.85);
    });
  });

  // ===========================================================================
  // 5. Detect problems, store to JSONL, and track via trackProblemReported
  // ===========================================================================
  describe('detect and store problems', () => {
    it('should track problems via trackProblemReported', () => {
      const mockResult = createMockIntentResult({
        problems: [
          { text: 'The tests are failing with timeout', confidence: 0.75, entities: ['tests'] },
        ],
      });
      mockDetectUserIntent.mockReturnValue(mockResult);

      const input = createPromptInput('The tests are failing with timeout error in CI');
      captureUserIntent(input);

      expect(mockTrackProblemReported).toHaveBeenCalledWith('The tests are failing with timeout');
    });

    it('should store problems to JSONL file', () => {
      const mockResult = createMockIntentResult({
        problems: [
          { text: 'Database connection error', confidence: 0.8, entities: ['postgresql'] },
        ],
      });
      mockDetectUserIntent.mockReturnValue(mockResult);
      mockExistsSync.mockReturnValue(true);

      const input = createPromptInput('Getting database connection error when running tests');
      captureUserIntent(input);

      expect(mockAppendFileSync).toHaveBeenCalled();
      const writtenData = mockAppendFileSync.mock.calls[0][1] as string;
      const record = JSON.parse(writtenData.trim());

      expect(record.type).toBe('problem');
      expect(record.text).toBe('Database connection error');
      expect(record.confidence).toBe(0.8);
      expect(record.status).toBe('open');
      expect(record.id).toMatch(/^prob-/);
    });

    it('should create memory directory if missing', () => {
      const mockResult = createMockIntentResult({
        problems: [
          { text: 'Import error in module', confidence: 0.75, entities: [] },
        ],
      });
      mockDetectUserIntent.mockReturnValue(mockResult);
      mockExistsSync.mockReturnValue(false);

      const input = createPromptInput('Getting an import error in the main module');
      captureUserIntent(input);

      expect(mockMkdirSync).toHaveBeenCalledWith(
        expect.stringContaining('.claude/memory'),
        { recursive: true }
      );
    });

    it('should store multiple problems', () => {
      const mockResult = createMockIntentResult({
        problems: [
          { text: 'API returning 500 error', confidence: 0.8, entities: [] },
          { text: 'Build failing on CI', confidence: 0.75, entities: [] },
        ],
      });
      mockDetectUserIntent.mockReturnValue(mockResult);

      const input = createPromptInput('API returning 500 error and build failing on CI');
      captureUserIntent(input);

      expect(mockTrackProblemReported).toHaveBeenCalledTimes(2);
      expect(mockAppendFileSync).toHaveBeenCalledTimes(2);
    });

    it('should log when problems are captured', () => {
      const mockResult = createMockIntentResult({
        problems: [
          { text: 'Memory leak detected', confidence: 0.85, entities: [] },
        ],
      });
      mockDetectUserIntent.mockReturnValue(mockResult);

      const input = createPromptInput('Memory leak detected in the worker process');
      captureUserIntent(input);

      expect(mockLogHook).toHaveBeenCalledWith(
        'capture-user-intent',
        'Captured: 1 problems',
        'info'
      );
    });
  });

  // ===========================================================================
  // 6. Handle multiple intents in single prompt
  // ===========================================================================
  describe('handle multiple intents', () => {
    it('should handle prompt with decision, preference, and problem', () => {
      const mockResult = createMockIntentResult({
        decisions: [
          { text: 'I chose FastAPI', confidence: 0.85, rationale: 'async support' },
        ],
        preferences: [
          { text: 'I prefer pytest for testing', confidence: 0.9 },
        ],
        problems: [
          { text: 'The build is failing', confidence: 0.75, entities: [] },
        ],
      });
      mockDetectUserIntent.mockReturnValue(mockResult);

      const input = createPromptInput(
        'I chose FastAPI because async support. I prefer pytest for testing. The build is failing.'
      );
      captureUserIntent(input);

      expect(mockTrackDecisionMade).toHaveBeenCalledTimes(1);
      expect(mockTrackPreferenceStated).toHaveBeenCalledTimes(1);
      expect(mockTrackProblemReported).toHaveBeenCalledTimes(1);
    });

    it('should handle prompt with only decisions and preferences', () => {
      const mockResult = createMockIntentResult({
        decisions: [
          { text: 'Using Redis for caching', confidence: 0.8 },
        ],
        preferences: [
          { text: 'I prefer explicit imports', confidence: 0.85 },
        ],
      });
      mockDetectUserIntent.mockReturnValue(mockResult);

      const input = createPromptInput('Using Redis for caching. I prefer explicit imports in all files.');
      captureUserIntent(input);

      expect(mockTrackDecisionMade).toHaveBeenCalledTimes(1);
      expect(mockTrackPreferenceStated).toHaveBeenCalledTimes(1);
      expect(mockTrackProblemReported).not.toHaveBeenCalled();
    });

    it('should log when decisions and preferences are tracked', () => {
      const mockResult = createMockIntentResult({
        decisions: [
          { text: 'Using Vitest', confidence: 0.85 },
        ],
        preferences: [
          { text: 'I prefer camelCase', confidence: 0.8 },
        ],
      });
      mockDetectUserIntent.mockReturnValue(mockResult);

      const input = createPromptInput('Using Vitest for testing. I prefer camelCase for variables.');
      captureUserIntent(input);

      expect(mockLogHook).toHaveBeenCalledWith(
        'capture-user-intent',
        'Tracked: 1 decisions, 1 preferences (to events.jsonl)',
        'debug'
      );
    });
  });

  // ===========================================================================
  // 7. Handle errors gracefully (returns silent success)
  // ===========================================================================
  describe('error handling', () => {
    it('should return silent success when detectUserIntent throws', () => {
      mockDetectUserIntent.mockImplementation(() => {
        throw new Error('Detection failed');
      });

      const input = createPromptInput('This prompt will cause an error during detection');
      const result = captureUserIntent(input);

      expect(result.continue).toBe(true);
      expect(result.suppressOutput).toBe(true);
      expect(mockLogHook).toHaveBeenCalledWith(
        'capture-user-intent',
        expect.stringContaining('Intent detection failed'),
        'warn'
      );
    });

    it('should continue processing when session tracking fails', () => {
      const mockResult = createMockIntentResult({
        decisions: [
          { text: 'Using PostgreSQL', confidence: 0.85 },
        ],
      });
      mockDetectUserIntent.mockReturnValue(mockResult);
      mockTrackDecisionMade.mockImplementation(() => {
        throw new Error('Tracking failed');
      });

      const input = createPromptInput('Using PostgreSQL for the database');
      const result = captureUserIntent(input);

      // Should still return silent success despite tracking error
      expect(result.continue).toBe(true);
      expect(result.suppressOutput).toBe(true);
    });

    it('should handle JSONL write failures gracefully', () => {
      const mockResult = createMockIntentResult({
        problems: [
          { text: 'Build failing', confidence: 0.75, entities: [] },
        ],
      });
      mockDetectUserIntent.mockReturnValue(mockResult);
      mockAppendFileSync.mockImplementation(() => {
        throw new Error('Write failed');
      });

      const input = createPromptInput('Build failing in CI pipeline');
      const result = captureUserIntent(input);

      expect(result.continue).toBe(true);
      expect(result.suppressOutput).toBe(true);
      expect(mockLogHook).toHaveBeenCalledWith(
        'capture-user-intent',
        expect.stringContaining('Failed to write'),
        'warn'
      );
    });

    it('should handle directory creation failure gracefully', () => {
      const mockResult = createMockIntentResult({
        problems: [
          { text: 'Test timeout', confidence: 0.8, entities: [] },
        ],
      });
      mockDetectUserIntent.mockReturnValue(mockResult);
      mockExistsSync.mockReturnValue(false);
      mockMkdirSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const input = createPromptInput('Test timeout in the integration suite');
      const result = captureUserIntent(input);

      expect(result.continue).toBe(true);
      expect(result.suppressOutput).toBe(true);
    });
  });

  // ===========================================================================
  // 8. File/directory creation for JSONL storage
  // ===========================================================================
  describe('JSONL storage', () => {
    it('should write to open-problems.jsonl path', () => {
      const mockResult = createMockIntentResult({
        problems: [
          { text: 'Network error', confidence: 0.75, entities: [] },
        ],
      });
      mockDetectUserIntent.mockReturnValue(mockResult);

      const input = createPromptInput('Getting network error when connecting to API');
      captureUserIntent(input);

      expect(mockAppendFileSync).toHaveBeenCalledWith(
        expect.stringContaining('open-problems.jsonl'),
        expect.any(String)
      );
    });

    it('should include session_id in stored problem', () => {
      const mockResult = createMockIntentResult({
        problems: [
          { text: 'Crash on startup', confidence: 0.8, entities: [] },
        ],
      });
      mockDetectUserIntent.mockReturnValue(mockResult);

      const input = createPromptInput('App crash on startup after update');
      input.session_id = 'custom-session-456';
      captureUserIntent(input);

      const writtenData = mockAppendFileSync.mock.calls[0][1] as string;
      const record = JSON.parse(writtenData.trim());
      expect(record.session_id).toBe('custom-session-456');
    });

    it('should include project name in stored problem', () => {
      const mockResult = createMockIntentResult({
        problems: [
          { text: 'Lint error', confidence: 0.75, entities: [] },
        ],
      });
      mockDetectUserIntent.mockReturnValue(mockResult);

      const input = createPromptInput('Lint error in the module file');
      captureUserIntent(input);

      const writtenData = mockAppendFileSync.mock.calls[0][1] as string;
      const record = JSON.parse(writtenData.trim());
      expect(record.project).toBe('project'); // from /test/project
    });

    it('should use "unknown" as project name when path has no segments', () => {
      const mockResult = createMockIntentResult({
        problems: [
          { text: 'Edge case error', confidence: 0.75, entities: [] },
        ],
      });
      mockDetectUserIntent.mockReturnValue(mockResult);

      // Mock getProjectDir to return '/' (root) - split('/').pop() returns ''
      const mockGetProjectDir = vi.mocked(getProjectDir);
      // Reset the mock and set it to return '/' for all calls in this test
      mockGetProjectDir.mockReturnValue('/');

      const input = createPromptInput('Edge case error with empty project dir');
      captureUserIntent(input);

      const writtenData = mockAppendFileSync.mock.calls[0][1] as string;
      const record = JSON.parse(writtenData.trim());
      expect(record.project).toBe('unknown');

      // Restore for other tests
      mockGetProjectDir.mockReturnValue('/test/project');
    });

    it('should generate unique IDs for each problem', () => {
      const mockResult = createMockIntentResult({
        problems: [
          { text: 'Problem 1', confidence: 0.75, entities: [] },
          { text: 'Problem 2', confidence: 0.8, entities: [] },
        ],
      });
      mockDetectUserIntent.mockReturnValue(mockResult);

      const input = createPromptInput('Problem 1 and Problem 2 in the codebase');
      captureUserIntent(input);

      const record1 = JSON.parse((mockAppendFileSync.mock.calls[0][1] as string).trim());
      const record2 = JSON.parse((mockAppendFileSync.mock.calls[1][1] as string).trim());

      expect(record1.id).toMatch(/^prob-/);
      expect(record2.id).toMatch(/^prob-/);
      expect(record1.id).not.toBe(record2.id);
    });

    it('should include entities in stored problem', () => {
      const mockResult = createMockIntentResult({
        problems: [
          { text: 'PostgreSQL connection timeout', confidence: 0.85, entities: ['postgresql'] },
        ],
      });
      mockDetectUserIntent.mockReturnValue(mockResult);

      const input = createPromptInput('PostgreSQL connection timeout in production');
      captureUserIntent(input);

      const writtenData = mockAppendFileSync.mock.calls[0][1] as string;
      const record = JSON.parse(writtenData.trim());
      expect(record.entities).toContain('postgresql');
    });

    it('should write valid JSONL format with newline', () => {
      const mockResult = createMockIntentResult({
        problems: [
          { text: 'JSONL test', confidence: 0.75, entities: [] },
        ],
      });
      mockDetectUserIntent.mockReturnValue(mockResult);

      const input = createPromptInput('Testing JSONL format output');
      captureUserIntent(input);

      const writtenData = mockAppendFileSync.mock.calls[0][1] as string;
      expect(writtenData.endsWith('\n')).toBe(true);
      // Should be parseable JSON
      expect(() => JSON.parse(writtenData.trim())).not.toThrow();
    });
  });

  // ===========================================================================
  // No intents detected
  // ===========================================================================
  describe('no intents detected', () => {
    it('should return silent success when no intents found', () => {
      mockDetectUserIntent.mockReturnValue(createMockIntentResult());

      const input = createPromptInput('Hello, how are you doing today?');
      const result = captureUserIntent(input);

      expect(result.continue).toBe(true);
      expect(result.suppressOutput).toBe(true);
      expect(mockTrackDecisionMade).not.toHaveBeenCalled();
      expect(mockTrackPreferenceStated).not.toHaveBeenCalled();
      expect(mockTrackProblemReported).not.toHaveBeenCalled();
    });

    it('should not write to JSONL when no problems', () => {
      mockDetectUserIntent.mockReturnValue(createMockIntentResult({
        decisions: [
          { text: 'Using React', confidence: 0.85 },
        ],
      }));

      const input = createPromptInput('Using React for the frontend application');
      captureUserIntent(input);

      expect(mockAppendFileSync).not.toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // Session ID handling
  // ===========================================================================
  describe('session ID handling', () => {
    it('should use input session_id when provided', () => {
      const mockResult = createMockIntentResult({
        problems: [
          { text: 'Test error', confidence: 0.75, entities: [] },
        ],
      });
      mockDetectUserIntent.mockReturnValue(mockResult);

      const input = createPromptInput('Test error in CI');
      input.session_id = 'provided-session-789';
      captureUserIntent(input);

      const writtenData = mockAppendFileSync.mock.calls[0][1] as string;
      const record = JSON.parse(writtenData.trim());
      expect(record.session_id).toBe('provided-session-789');
    });

    it('should fallback to getSessionId when session_id not in input', () => {
      const mockResult = createMockIntentResult({
        problems: [
          { text: 'Missing session', confidence: 0.75, entities: [] },
        ],
      });
      mockDetectUserIntent.mockReturnValue(mockResult);

      const input = createPromptInput('Missing session test case');
      delete (input as Record<string, unknown>).session_id;
      captureUserIntent(input);

      const writtenData = mockAppendFileSync.mock.calls[0][1] as string;
      const record = JSON.parse(writtenData.trim());
      expect(record.session_id).toBe('test-session-123'); // from mocked getSessionId
    });
  });

  // ===========================================================================
  // Always returns silent success (CC 2.1.16 compliance)
  // ===========================================================================
  describe('CC 2.1.16 compliance', () => {
    it('should always return continue: true', () => {
      const scenarios = [
        { prompt: '' },
        { prompt: 'short' },
        { prompt: 'A longer prompt with decisions' },
        { prompt: 'Error scenario', throwError: true },
      ];

      for (const scenario of scenarios) {
        vi.clearAllMocks();
        if (scenario.throwError) {
          mockDetectUserIntent.mockImplementation(() => {
            throw new Error('Test error');
          });
        } else {
          mockDetectUserIntent.mockReturnValue(createMockIntentResult());
        }

        const input = createPromptInput(scenario.prompt);
        const result = captureUserIntent(input);
        expect(result.continue).toBe(true);
      }
    });

    it('should always suppress output for non-blocking capture', () => {
      const mockResult = createMockIntentResult({
        decisions: [{ text: 'Test decision', confidence: 0.85 }],
        preferences: [{ text: 'Test preference', confidence: 0.8 }],
        problems: [{ text: 'Test problem', confidence: 0.75, entities: [] }],
      });
      mockDetectUserIntent.mockReturnValue(mockResult);

      const input = createPromptInput('Test decision and preference and problem');
      const result = captureUserIntent(input);

      expect(result.suppressOutput).toBe(true);
    });
  });

  // ===========================================================================
  // Edge cases
  // ===========================================================================
  describe('edge cases', () => {
    it('should handle prompts with special characters', () => {
      const mockResult = createMockIntentResult({
        decisions: [{ text: 'Using <template>', confidence: 0.8 }],
      });
      mockDetectUserIntent.mockReturnValue(mockResult);

      const input = createPromptInput('Using <template> & "quotes" in the code');
      const result = captureUserIntent(input);

      expect(result.continue).toBe(true);
    });

    it('should handle prompts with newlines', () => {
      const mockResult = createMockIntentResult({
        decisions: [{ text: 'Using multiline', confidence: 0.8 }],
      });
      mockDetectUserIntent.mockReturnValue(mockResult);

      const input = createPromptInput('First line\nUsing multiline\nThird line');
      const result = captureUserIntent(input);

      expect(result.continue).toBe(true);
      expect(mockDetectUserIntent).toHaveBeenCalled();
    });

    it('should handle very long prompts', () => {
      const mockResult = createMockIntentResult();
      mockDetectUserIntent.mockReturnValue(mockResult);

      const longPrompt = 'I decided to use PostgreSQL ' + 'a'.repeat(5000);
      const input = createPromptInput(longPrompt);
      const result = captureUserIntent(input);

      expect(result.continue).toBe(true);
    });

    it('should handle prompts with unicode characters', () => {
      const mockResult = createMockIntentResult({
        decisions: [{ text: 'Using emoji strategy', confidence: 0.75 }],
      });
      mockDetectUserIntent.mockReturnValue(mockResult);

      const input = createPromptInput('Using emoji strategy for status indicators');
      const result = captureUserIntent(input);

      expect(result.continue).toBe(true);
    });

    it('should handle empty intent arrays in result', () => {
      mockDetectUserIntent.mockReturnValue({
        intents: [],
        decisions: [],
        preferences: [],
        questions: [],
        problems: [],
        summary: 'No intents detected',
      });

      const input = createPromptInput('Random text without any intents here');
      const result = captureUserIntent(input);

      expect(result.continue).toBe(true);
      expect(mockTrackDecisionMade).not.toHaveBeenCalled();
      expect(mockTrackPreferenceStated).not.toHaveBeenCalled();
      expect(mockTrackProblemReported).not.toHaveBeenCalled();
    });
  });
});
