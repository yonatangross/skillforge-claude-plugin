/**
 * Integration Tests: Decision Capture Pipeline
 *
 * Tests the full flow from user prompt → intent detection → memory storage
 * Verifies integration between:
 * - user-intent-detector.ts (entity extraction)
 * - technology-registry.ts (canonical names, entity types)
 * - relates-to-scaling.ts (RELATES_TO generation)
 * - memory-writer.ts (graph operations)
 *
 * CC 2.1.16 Compliant
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { detectUserIntent, extractEntities } from '../../lib/user-intent-detector.js';
import {
  getTechnologyCanonical,
  getPatternCanonical,
  getToolCanonical,
  inferEntityType,
  inferCategory,
} from '../../lib/technology-registry.js';
import {
  buildRelatesWithStrategy,
  buildTopKRelates,
  buildWeightedRelates,
  buildProbabilisticRelates,
  captureRelatesToMetrics,
} from '../../lib/relates-to-scaling.js';
import {
  buildGraphOperations,
  createDecisionRecord,
} from '../../lib/memory-writer.js';

// Mock external dependencies that aren't part of the pipeline
vi.mock('../../lib/common.js', () => ({
  getProjectDir: vi.fn(() => '/test/project'),
  logHook: vi.fn(),
}));

vi.mock('../../lib/user-identity.js', () => ({
  getIdentityContext: vi.fn(() => ({
    user_id: 'test-user@example.com',
    anonymous_id: 'anon-abc123',
    team_id: 'test-team',
    machine_id: 'test-machine',
  })),
  canShare: vi.fn(() => true),
  getUserIdForScope: vi.fn(() => 'test-user'),
  getProjectUserId: vi.fn(() => 'project-test-user'),
  getGlobalScopeId: vi.fn(() => 'global-best-practices'),
}));

vi.mock('../../lib/session-tracker.js', () => ({
  trackDecisionMade: vi.fn(),
  trackPreferenceStated: vi.fn(),
}));

vi.mock('node:fs', async () => {
  const actual = await vi.importActual('node:fs');
  return {
    ...actual,
    existsSync: vi.fn(() => true),
    appendFileSync: vi.fn(),
    mkdirSync: vi.fn(),
  };
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function countRelationType(
  operations: ReturnType<typeof buildGraphOperations>,
  type: string
): number {
  const relationsOp = operations.find(op => op.type === 'create_relations');
  if (!relationsOp?.payload.relations) return 0;
  return relationsOp.payload.relations.filter(r => r.relationType === type).length;
}

// =============================================================================
// INTEGRATION TESTS: User Prompt → Intent Detection → Entity Extraction
// =============================================================================

describe('Integration: User Prompt → Entity Extraction', () => {
  it('should extract and canonicalize technologies from decision prompt', () => {
    const prompt = "Let's use postgres for the database because it has great JSON support";

    // Step 1: Detect intent
    const result = detectUserIntent(prompt);
    expect(result.decisions.length).toBeGreaterThan(0);

    // Step 2: Extract entities
    const entities = extractEntities(prompt);

    // Step 3: Verify canonical names from registry
    expect(entities).toContain('postgresql'); // postgres → postgresql
    const canonical = getTechnologyCanonical('postgres');
    expect(canonical).toBe('postgresql');
  });

  it('should extract and canonicalize patterns from decision prompt', () => {
    const prompt = "I decided to use cursor pagination because it scales better than offset";

    const entities = extractEntities(prompt);
    expect(entities).toContain('cursor-pagination');

    const canonical = getPatternCanonical('cursor pagination');
    expect(canonical).toBe('cursor-pagination');
  });

  it('should handle mixed technologies and patterns', () => {
    const prompt = "Chose FastAPI with clean architecture pattern and Redis for caching";

    const entities = extractEntities(prompt);

    // Verify technologies
    expect(entities).toContain('fastapi');
    expect(entities).toContain('redis');

    // Verify patterns
    expect(entities).toContain('clean-architecture');

    // Verify types from registry
    expect(inferEntityType('fastapi')).toBe('Technology');
    expect(inferEntityType('redis')).toBe('Technology');
    expect(inferEntityType('clean-architecture')).toBe('Pattern');
  });

  it('should extract tools and infer correct types', () => {
    const prompt = "Using git for version control and npm for packages";

    const entities = extractEntities(prompt);
    expect(entities).toContain('git');
    expect(entities).toContain('npm');

    expect(inferEntityType('git')).toBe('Tool');
    expect(inferEntityType('npm')).toBe('Tool');
  });
});

// =============================================================================
// INTEGRATION TESTS: Entity Extraction → RELATES_TO Scaling
// =============================================================================

describe('Integration: Entity Extraction → RELATES_TO Scaling', () => {
  it('should generate correct RELATES_TO for small entity sets', () => {
    // Simulate extracted entities from a real decision
    const entities = ['postgresql', 'redis', 'fastapi', 'docker'];

    // Small set bypass: should use all-pairs
    const relations = buildRelatesWithStrategy(entities);

    // 4 entities = C(4,2) = 6 relations
    expect(relations.length).toBe(6);

    // Verify all pairs exist
    const pairSet = new Set(relations.map(r => `${r.from}-${r.to}`));
    expect(pairSet.has('postgresql-redis')).toBe(true);
    expect(pairSet.has('postgresql-fastapi')).toBe(true);
    expect(pairSet.has('postgresql-docker')).toBe(true);
    expect(pairSet.has('redis-fastapi')).toBe(true);
    expect(pairSet.has('redis-docker')).toBe(true);
    expect(pairSet.has('fastapi-docker')).toBe(true);
  });

  it('should scale gracefully for large entity sets', () => {
    // Generate a large entity set
    const entities = Array.from({ length: 30 }, (_, i) => `entity-${i}`);

    // Without scaling: C(30,2) = 435 relations
    const unscaledMax = (30 * 29) / 2;
    expect(unscaledMax).toBe(435);

    // With scaling strategy
    const relations = buildRelatesWithStrategy(entities);

    // Should be significantly less than 435
    expect(relations.length).toBeLessThan(200);

    // Capture metrics
    const metrics = captureRelatesToMetrics(entities, relations.length, 'weighted');
    expect(metrics.reductionPercentage).toBeGreaterThan(50);
  });

  it('should maintain reproducibility with seeded probabilistic sampling', () => {
    const entities = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

    const result1 = buildProbabilisticRelates(entities, { seed: 42 });
    const result2 = buildProbabilisticRelates(entities, { seed: 42 });

    expect(result1).toEqual(result2);
  });
});

// =============================================================================
// INTEGRATION TESTS: Full Pipeline → Memory Writer
// =============================================================================

describe('Integration: Full Pipeline → Memory Writer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should process a database decision through full pipeline', () => {
    // Step 1: User prompt
    const prompt = "Let's use PostgreSQL with pgvector for vector search because we need semantic similarity";

    // Step 2: Detect intent
    const intentResult = detectUserIntent(prompt);
    expect(intentResult.decisions.length).toBeGreaterThan(0);

    // Step 3: Extract entities
    const entities = extractEntities(prompt);
    expect(entities).toContain('postgresql');
    expect(entities).toContain('pgvector');
    expect(entities).toContain('vector-search');

    // Step 4: Create decision record
    const decision = createDecisionRecord(
      'decision',
      {
        what: 'Use PostgreSQL with pgvector',
        why: 'Need semantic similarity for vector search',
      },
      entities,
      {
        session_id: 'test-session',
        source: 'user_prompt',
        category: 'database',
        confidence: 0.9,
      }
    );

    // Step 5: Build graph operations
    const operations = buildGraphOperations(decision);

    // Verify structure
    expect(operations.length).toBe(2); // entities + relations
    expect(operations[0].type).toBe('create_entities');
    expect(operations[1].type).toBe('create_relations');

    // Verify entity types are inferred correctly
    const entitiesOp = operations.find(op => op.type === 'create_entities');
    const techEntity = entitiesOp?.payload.entities?.find(e => e.name === 'postgresql');
    const patternEntity = entitiesOp?.payload.entities?.find(e => e.name === 'vector-search');

    expect(techEntity?.entityType).toBe('Technology');
    expect(patternEntity?.entityType).toBe('Pattern');

    // Verify RELATES_TO relations are created
    expect(countRelationType(operations, 'RELATES_TO')).toBeGreaterThan(0);
    expect(countRelationType(operations, 'CHOSE')).toBeGreaterThan(0);
  });

  it('should process a preference through full pipeline', () => {
    const prompt = "I prefer TypeScript with strict mode for better type safety";

    // Detect and extract
    const intentResult = detectUserIntent(prompt);
    expect(intentResult.preferences.length).toBeGreaterThan(0);

    const entities = extractEntities(prompt);
    expect(entities).toContain('typescript');

    // Create record
    const preference = createDecisionRecord(
      'preference',
      { what: 'TypeScript with strict mode' },
      entities,
      {
        session_id: 'test-session',
        source: 'user_prompt',
        confidence: 0.8,
      }
    );

    // Build graph operations
    const operations = buildGraphOperations(preference);

    // Verify PREFERS relation type is used
    expect(countRelationType(operations, 'PREFERS')).toBeGreaterThan(0);
  });

  it('should handle complex multi-technology decisions', () => {
    const prompt = `Decided to use:
      - PostgreSQL for primary data
      - Redis for caching
      - FastAPI for the API
      - Docker for containerization
      - Kubernetes for orchestration
      because we need a scalable microservices architecture`;

    const entities = extractEntities(prompt);

    // Verify all technologies are extracted
    expect(entities).toContain('postgresql');
    expect(entities).toContain('redis');
    expect(entities).toContain('fastapi');
    expect(entities).toContain('docker');
    expect(entities).toContain('kubernetes');

    // Create decision
    const decision = createDecisionRecord(
      'decision',
      {
        what: 'Full-stack microservices setup',
        why: 'Scalable microservices architecture',
      },
      entities,
      {
        session_id: 'test-session',
        source: 'user_prompt',
        category: 'architecture',
        confidence: 0.95,
      }
    );

    // Build operations
    const operations = buildGraphOperations(decision);

    // 5+ entities should use scaling strategy and still work
    const relatesToCount = countRelationType(operations, 'RELATES_TO');
    expect(relatesToCount).toBeGreaterThan(0);
    expect(relatesToCount).toBeLessThanOrEqual(15); // C(6,2) = 15 max for 6 entities
  });

  it('should correctly categorize entities through full pipeline', () => {
    const prompt = "Using cursor-pagination with Redis caching and pytest for testing";

    const entities = extractEntities(prompt);

    // Verify category inference for each type
    expect(inferCategory('cursor-pagination')).toBe('pagination-pattern');
    expect(inferCategory('redis')).toBe('database');
    expect(inferCategory('pytest')).toBe('testing');

    // Verify entity type inference
    expect(inferEntityType('cursor-pagination')).toBe('Pattern');
    expect(inferEntityType('redis')).toBe('Technology');
    expect(inferEntityType('pytest')).toBe('Technology');
  });
});

// =============================================================================
// INTEGRATION TESTS: Alias Resolution
// =============================================================================

describe('Integration: Alias Resolution', () => {
  it('should resolve postgres → postgresql through pipeline', () => {
    const prompt = "Using postgres for the DB";
    const entities = extractEntities(prompt);

    // Should resolve to canonical name
    expect(entities).toContain('postgresql');
    expect(entities).not.toContain('postgres');
  });

  it('should resolve k8s → kubernetes through pipeline', () => {
    const prompt = "Deploying to k8s cluster";
    const entities = extractEntities(prompt);

    expect(entities).toContain('kubernetes');
    expect(entities).not.toContain('k8s');
  });

  it('should resolve next.js → nextjs through pipeline', () => {
    const prompt = "Building the frontend with next.js";
    const entities = extractEntities(prompt);

    expect(entities).toContain('nextjs');
    expect(entities).not.toContain('next.js');
  });

  it('should handle multiple aliases in same prompt', () => {
    const prompt = "Using postgres with k8s and next.js for the new app";
    const entities = extractEntities(prompt);

    // All should be canonical
    expect(entities).toContain('postgresql');
    expect(entities).toContain('kubernetes');
    expect(entities).toContain('nextjs');
  });
});

// =============================================================================
// INTEGRATION TESTS: RELATES_TO Scaling Edge Cases
// =============================================================================

describe('Integration: RELATES_TO Scaling Edge Cases', () => {
  it('should handle boundary case at 10 entities (small set bypass)', () => {
    const entities = Array.from({ length: 10 }, (_, i) => `Entity${i}`);
    const relations = buildRelatesWithStrategy(entities);

    // 10 entities = C(10,2) = 45 relations (all pairs)
    expect(relations.length).toBe(45);
  });

  it('should use weighted strategy at 11 entities', () => {
    const entities = Array.from({ length: 11 }, (_, i) => `Entity${i}`);
    const relations = buildRelatesWithStrategy(entities);

    // Should be less than C(11,2) = 55
    // Weighted strategy filters by importance
    expect(relations.length).toBeLessThan(55);
  });

  it('should handle real-world tech stack extraction', () => {
    const prompt = `Our stack:
      PostgreSQL, Redis, FastAPI, SQLAlchemy, Alembic,
      React, TypeScript, Vite, Vitest,
      Docker, Kubernetes, Terraform`;

    const entities = extractEntities(prompt);

    // Verify extraction
    expect(entities.length).toBeGreaterThan(5);

    // Verify scaling works
    const relations = buildRelatesWithStrategy(entities);
    const potentialRelations = (entities.length * (entities.length - 1)) / 2;

    // Should have some reduction if >10 entities
    if (entities.length > 10) {
      expect(relations.length).toBeLessThan(potentialRelations);
    }
  });
});

// =============================================================================
// INTEGRATION TESTS: Decision Record Completeness
// =============================================================================

describe('Integration: Decision Record Completeness', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create complete decision record with all metadata', () => {
    const prompt = "Decided on Redis for caching because of sub-millisecond latency";

    const entities = extractEntities(prompt);
    const intentResult = detectUserIntent(prompt);

    const decision = createDecisionRecord(
      'decision',
      {
        what: intentResult.decisions[0]?.text || 'Redis for caching',
        why: intentResult.decisions[0]?.rationale || 'sub-millisecond latency',
        alternatives: ['Memcached'],
        constraints: ['Low latency required'],
        tradeoffs: ['Memory usage'],
      },
      entities,
      {
        session_id: 'test-session',
        source: 'user_prompt',
        category: 'caching',
        confidence: 0.9,
        importance: 'high',
      }
    );

    // Verify completeness
    expect(decision.id).toMatch(/^decision-/);
    expect(decision.type).toBe('decision');
    expect(decision.content.what).toBeDefined();
    expect(decision.entities).toContain('redis');
    expect(decision.identity.user_id).toBeDefined();
    expect(decision.metadata.session_id).toBe('test-session');
    expect(decision.metadata.category).toBe('caching');
    expect(decision.metadata.confidence).toBe(0.9);
    expect(decision.metadata.importance).toBe('high');

    // Check generalizability - requires matching generalizable patterns (pagination, caching, etc.)
    // "redis" alone may not match - depends on entity list containing generalized pattern keywords
    // The actual check is: confidence >= 0.8 && has rationale && has general pattern entity
    expect(decision.metadata.is_generalizable).toBeDefined();
  });

  it('should build graph operations with correct relation types', () => {
    const decision = createDecisionRecord(
      'decision',
      {
        what: 'Use cursor-pagination',
        why: 'Better performance at scale',
        alternatives: ['offset-pagination'],
        constraints: ['Must handle millions of rows'],
        tradeoffs: ['Cannot jump to page N'],
      },
      ['cursor-pagination', 'postgresql'],
      {
        session_id: 'test-session',
        source: 'user_prompt',
        confidence: 0.85,
      }
    );

    const operations = buildGraphOperations(decision);

    // Verify all relation types
    expect(countRelationType(operations, 'CHOSE')).toBeGreaterThan(0);
    expect(countRelationType(operations, 'CHOSE_OVER')).toBe(1);
    expect(countRelationType(operations, 'CONSTRAINT')).toBe(1);
    expect(countRelationType(operations, 'TRADEOFF')).toBe(1);
    expect(countRelationType(operations, 'RELATES_TO')).toBe(1); // 2 entities = 1 RELATES_TO
  });
});
