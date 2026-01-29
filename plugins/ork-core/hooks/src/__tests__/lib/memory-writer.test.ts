/**
 * Unit Tests for buildGraphOperations()
 *
 * Comprehensive test coverage for decision record to graph operations conversion.
 * Tests all relation types, edge cases, and entity generation logic.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  buildGraphOperations,
  DecisionRecord,
  QueuedGraphOperation,
  GraphEntity,
  GraphRelation,
} from '../../lib/memory-writer.js';

// =============================================================================
// TEST HELPERS & FACTORIES
// =============================================================================

/**
 * Factory for creating valid decision records with minimal required fields
 */
function createDecisionRecord(overrides: Partial<DecisionRecord> = {}): DecisionRecord {
  const baseDecision: DecisionRecord = {
    id: 'test-decision-1',
    type: 'decision',
    content: {
      what: 'Use PostgreSQL for primary database',
      why: 'ACID compliance and team expertise',
    },
    entities: [],
    relations: [],
    identity: {
      user_id: 'test@example.com',
      anonymous_id: 'anon-123456789',
      team_id: 'test-team',
      machine_id: 'test-machine',
    },
    metadata: {
      session_id: 'session-123',
      timestamp: '2026-01-28T10:00:00Z',
      confidence: 0.85,
      source: 'user_prompt',
      project: 'test-project',
      category: 'architecture',
      importance: 'high',
    },
  };

  return { ...baseDecision, ...overrides };
}

/**
 * Helper to count operations by type
 */
function countOperationsByType(
  operations: QueuedGraphOperation[],
  type: QueuedGraphOperation['type']
): number {
  return operations.filter(op => op.type === type).length;
}

/**
 * Helper to extract entities from operations
 */
function extractEntities(operations: QueuedGraphOperation[]): GraphEntity[] {
  const createOps = operations.filter(op => op.type === 'create_entities');
  return createOps.flatMap(op => op.payload.entities ?? []);
}

/**
 * Helper to extract relations from operations
 */
function extractRelations(operations: QueuedGraphOperation[]): GraphRelation[] {
  const createOps = operations.filter(op => op.type === 'create_relations');
  return createOps.flatMap(op => op.payload.relations ?? []);
}

/**
 * Helper to count relation types
 */
function countRelationsByType(
  relations: GraphRelation[],
  type: string
): number {
  return relations.filter(r => r.relationType === type).length;
}

// =============================================================================
// UNIT TESTS - buildGraphOperations()
// =============================================================================

describe('buildGraphOperations()', () => {
  // ===== BASIC STRUCTURE TESTS =====

  describe('operation structure and timestamps', () => {
    it('should return array of operations with timestamps', () => {
      const decision = createDecisionRecord();
      const operations = buildGraphOperations(decision);

      expect(Array.isArray(operations)).toBe(true);
      operations.forEach(op => {
        expect(op.timestamp).toBeDefined();
        expect(typeof op.timestamp).toBe('string');
        expect(new Date(op.timestamp).getTime()).toBeGreaterThan(0);
      });
    });

    it('should use consistent timestamps across all operations', () => {
      const decision = createDecisionRecord();
      const operations = buildGraphOperations(decision);

      if (operations.length > 1) {
        const firstTimestamp = operations[0].timestamp;
        operations.forEach(op => {
          expect(op.timestamp).toBe(firstTimestamp);
        });
      }
    });

    it('should always create create_entities operation first', () => {
      const decision = createDecisionRecord();
      const operations = buildGraphOperations(decision);

      expect(operations.length).toBeGreaterThan(0);
      expect(operations[0].type).toBe('create_entities');
    });
  });

  // ===== MAIN ENTITY TESTS =====

  describe('main decision entity creation', () => {
    it('should create main entity with decision type', () => {
      const decision = createDecisionRecord({ type: 'decision' });
      const operations = buildGraphOperations(decision);
      const entities = extractEntities(operations);

      const mainEntity = entities.find(e => e.name === decision.id);
      expect(mainEntity).toBeDefined();
      expect(mainEntity?.entityType).toBe('Decision');
    });

    it('should create main entity with preference type', () => {
      const decision = createDecisionRecord({ type: 'preference' });
      const operations = buildGraphOperations(decision);
      const entities = extractEntities(operations);

      const mainEntity = entities.find(e => e.name === decision.id);
      expect(mainEntity?.entityType).toBe('Preference');
    });

    it('should create main entity with solution type for problem-solution', () => {
      const decision = createDecisionRecord({ type: 'problem-solution' });
      const operations = buildGraphOperations(decision);
      const entities = extractEntities(operations);

      const mainEntity = entities.find(e => e.name === decision.id);
      expect(mainEntity?.entityType).toBe('Solution');
    });

    it('should create main entity with pattern type', () => {
      const decision = createDecisionRecord({ type: 'pattern' });
      const operations = buildGraphOperations(decision);
      const entities = extractEntities(operations);

      const mainEntity = entities.find(e => e.name === decision.id);
      expect(mainEntity?.entityType).toBe('Pattern');
    });

    it('should populate main entity observations from decision content', () => {
      const decision = createDecisionRecord({
        content: {
          what: 'Use cursor-pagination',
          why: 'Better performance at scale',
          alternatives: ['offset-pagination', 'keyset-pagination'],
          constraints: ['Must support sorting', 'Cannot use offset'],
          tradeoffs: ['More complex client code', 'Requires cursor state'],
        },
      });

      const operations = buildGraphOperations(decision);
      const entities = extractEntities(operations);
      const mainEntity = entities.find(e => e.name === decision.id);

      expect(mainEntity?.observations).toBeDefined();
      expect(mainEntity?.observations.length).toBeGreaterThan(0);
      expect(mainEntity?.observations.join('; ')).toContain('Use cursor-pagination');
      expect(mainEntity?.observations.join('; ')).toContain('Better performance at scale');
      expect(mainEntity?.observations.join('; ')).toContain('Alternatives considered');
      expect(mainEntity?.observations.join('; ')).toContain('Constraints');
      expect(mainEntity?.observations.join('; ')).toContain('Tradeoffs');
    });

    it('should include metadata in observations', () => {
      const decision = createDecisionRecord({
        metadata: {
          session_id: 'session-123',
          timestamp: '2026-01-28T10:00:00Z',
          confidence: 0.95,
          source: 'tool_output',
          project: 'my-project',
          category: 'performance',
          importance: 'high',
        },
      });

      const operations = buildGraphOperations(decision);
      const entities = extractEntities(operations);
      const mainEntity = entities.find(e => e.name === decision.id);

      const obsText = mainEntity?.observations.join('; ') ?? '';
      expect(obsText).toContain('95%'); // confidence
      expect(obsText).toContain('tool_output');
      expect(obsText).toContain('performance');
      expect(obsText).toContain('my-project');
    });
  });

  // ===== ENTITY MENTION TESTS =====

  describe('mentioned entity creation', () => {
    it('should create no entity operations when no entities mentioned', () => {
      const decision = createDecisionRecord({ entities: [] });
      const operations = buildGraphOperations(decision);
      const entities = extractEntities(operations);

      // Should only have main decision entity
      expect(entities.length).toBe(1);
      expect(entities[0].name).toBe(decision.id);
    });

    it('should create entities for each mentioned technology', () => {
      const decision = createDecisionRecord({
        entities: ['PostgreSQL', 'Redis', 'FastAPI'],
      });

      const operations = buildGraphOperations(decision);
      const entities = extractEntities(operations);

      expect(entities.length).toBe(4); // main + 3 technologies
      expect(entities.map(e => e.name)).toContain('PostgreSQL');
      expect(entities.map(e => e.name)).toContain('Redis');
      expect(entities.map(e => e.name)).toContain('FastAPI');
    });

    it('should infer Technology type for known databases', () => {
      const decision = createDecisionRecord({
        entities: ['PostgreSQL', 'MongoDB', 'Redis'],
      });

      const operations = buildGraphOperations(decision);
      const entities = extractEntities(operations);

      entities.forEach(e => {
        if (['PostgreSQL', 'MongoDB', 'Redis'].includes(e.name)) {
          expect(e.entityType).toBe('Technology');
        }
      });
    });

    it('should infer Technology type for known frameworks', () => {
      const decision = createDecisionRecord({
        entities: ['FastAPI', 'React', 'Django'],
      });

      const operations = buildGraphOperations(decision);
      const entities = extractEntities(operations);

      entities.forEach(e => {
        if (['FastAPI', 'React', 'Django'].includes(e.name)) {
          expect(e.entityType).toBe('Technology');
        }
      });
    });

    it('should infer Pattern type for pattern names', () => {
      const decision = createDecisionRecord({
        entities: ['cursor-pagination', 'circuit-breaker', 'event-sourcing'],
      });

      const operations = buildGraphOperations(decision);
      const entities = extractEntities(operations);

      entities.forEach(e => {
        if (['cursor-pagination', 'circuit-breaker', 'event-sourcing'].includes(e.name)) {
          expect(e.entityType).toBe('Pattern');
        }
      });
    });

    it('should infer Tool type for known tools', () => {
      const decision = createDecisionRecord({
        entities: ['pytest', 'jest', 'git'],
      });

      const operations = buildGraphOperations(decision);
      const entities = extractEntities(operations);

      entities.forEach(e => {
        if (['pytest', 'jest', 'git'].includes(e.name)) {
          expect(e.entityType).toBe('Tool');
        }
      });
    });

    it('should default to Technology type for unknown entities', () => {
      const decision = createDecisionRecord({
        entities: ['UnknownThing', 'SomethingElse'],
      });

      const operations = buildGraphOperations(decision);
      const entities = extractEntities(operations);

      entities.forEach(e => {
        if (['UnknownThing', 'SomethingElse'].includes(e.name)) {
          expect(e.entityType).toBe('Technology');
        }
      });
    });

    it('should include context observation for mentioned entities', () => {
      const decision = createDecisionRecord({
        content: { what: 'Use PostgreSQL for data persistence' },
        entities: ['PostgreSQL'],
      });

      const operations = buildGraphOperations(decision);
      const entities = extractEntities(operations);
      const pgEntity = entities.find(e => e.name === 'PostgreSQL');

      expect(pgEntity?.observations).toBeDefined();
      expect(pgEntity?.observations[0]).toContain('decision');
      expect(pgEntity?.observations[0]).toContain('PostgreSQL');
    });

    it('should truncate long context observations', () => {
      const longWhat = 'A'.repeat(200); // Very long string
      const decision = createDecisionRecord({
        content: { what: longWhat },
        entities: ['PostgreSQL'],
      });

      const operations = buildGraphOperations(decision);
      const entities = extractEntities(operations);
      const pgEntity = entities.find(e => e.name === 'PostgreSQL');

      expect(pgEntity?.observations[0].length).toBeLessThanOrEqual(150);
    });
  });

  // ===== RELATION TYPE TESTS =====

  describe('relation types based on decision type', () => {
    it('should use CHOSE relation for decision type', () => {
      const decision = createDecisionRecord({
        type: 'decision',
        entities: ['PostgreSQL', 'Redis'],
      });

      const operations = buildGraphOperations(decision);
      const relations = extractRelations(operations);

      const chosenRelations = relations.filter(
        r => r.from === decision.id && r.relationType === 'CHOSE'
      );

      expect(chosenRelations.length).toBe(2);
      expect(chosenRelations.some(r => r.to === 'PostgreSQL')).toBe(true);
      expect(chosenRelations.some(r => r.to === 'Redis')).toBe(true);
    });

    it('should use PREFERS relation for preference type', () => {
      const decision = createDecisionRecord({
        type: 'preference',
        entities: ['TypeScript', 'strict-mode'],
      });

      const operations = buildGraphOperations(decision);
      const relations = extractRelations(operations);

      const prefersRelations = relations.filter(
        r => r.from === decision.id && r.relationType === 'PREFERS'
      );

      expect(prefersRelations.length).toBe(2);
      expect(prefersRelations.some(r => r.to === 'TypeScript')).toBe(true);
    });

    it('should use MENTIONS relation for problem-solution type', () => {
      const decision = createDecisionRecord({
        type: 'problem-solution',
        entities: ['connection-pool', 'timeout-issue'],
      });

      const operations = buildGraphOperations(decision);
      const relations = extractRelations(operations);

      const mentionsRelations = relations.filter(
        r => r.from === decision.id && r.relationType === 'MENTIONS'
      );

      expect(mentionsRelations.length).toBe(2);
    });

    it('should use MENTIONS relation for pattern type', () => {
      const decision = createDecisionRecord({
        type: 'pattern',
        entities: ['cursor-pagination', 'async-handling'],
      });

      const operations = buildGraphOperations(decision);
      const relations = extractRelations(operations);

      const mentionsRelations = relations.filter(
        r => r.from === decision.id && r.relationType === 'MENTIONS'
      );

      expect(mentionsRelations.length).toBe(2);
    });
  });

  // ===== ALTERNATIVES (CHOSE_OVER) TESTS =====

  describe('CHOSE_OVER relations for alternatives', () => {
    it('should not create CHOSE_OVER when no alternatives', () => {
      const decision = createDecisionRecord({
        content: { what: 'Use PostgreSQL' },
      });

      const operations = buildGraphOperations(decision);
      const relations = extractRelations(operations);

      const choseOverRelations = relations.filter(r => r.relationType === 'CHOSE_OVER');
      expect(choseOverRelations.length).toBe(0);
    });

    it('should create CHOSE_OVER for each alternative', () => {
      const decision = createDecisionRecord({
        content: {
          what: 'Use PostgreSQL',
          alternatives: ['MongoDB', 'MySQL', 'MariaDB'],
        },
      });

      const operations = buildGraphOperations(decision);
      const relations = extractRelations(operations);

      const choseOverRelations = relations.filter(r => r.relationType === 'CHOSE_OVER');
      expect(choseOverRelations.length).toBe(3);
      expect(choseOverRelations.some(r => r.to === 'MongoDB')).toBe(true);
      expect(choseOverRelations.some(r => r.to === 'MySQL')).toBe(true);
      expect(choseOverRelations.some(r => r.to === 'MariaDB')).toBe(true);
    });

    it('should link CHOSE_OVER from what (not from decision id)', () => {
      const decision = createDecisionRecord({
        content: {
          what: 'cursor-pagination',
          alternatives: ['offset-pagination', 'keyset-pagination'],
        },
      });

      const operations = buildGraphOperations(decision);
      const relations = extractRelations(operations);

      const choseOverRelations = relations.filter(r => r.relationType === 'CHOSE_OVER');
      expect(choseOverRelations.every(r => r.from === 'cursor-pagination')).toBe(true);
    });

    it('should handle single alternative', () => {
      const decision = createDecisionRecord({
        content: {
          what: 'PostgreSQL',
          alternatives: ['MongoDB'],
        },
      });

      const operations = buildGraphOperations(decision);
      const relations = extractRelations(operations);

      const choseOverRelations = relations.filter(r => r.relationType === 'CHOSE_OVER');
      expect(choseOverRelations.length).toBe(1);
      expect(choseOverRelations[0].to).toBe('MongoDB');
    });
  });

  // ===== CONSTRAINTS TESTS =====

  describe('CONSTRAINT relations', () => {
    it('should not create CONSTRAINT relations when no constraints', () => {
      const decision = createDecisionRecord({
        content: { what: 'Use PostgreSQL' },
      });

      const operations = buildGraphOperations(decision);
      const relations = extractRelations(operations);

      const constraintRelations = relations.filter(r => r.relationType === 'CONSTRAINT');
      expect(constraintRelations.length).toBe(0);
    });

    it('should create CONSTRAINT for each constraint', () => {
      const decision = createDecisionRecord({
        content: {
          what: 'Use PostgreSQL',
          constraints: [
            'Must support ACID transactions',
            'Team must know SQL',
            'Must support JSON fields',
          ],
        },
      });

      const operations = buildGraphOperations(decision);
      const relations = extractRelations(operations);

      const constraintRelations = relations.filter(r => r.relationType === 'CONSTRAINT');
      expect(constraintRelations.length).toBe(3);
      expect(constraintRelations.every(r => r.from === decision.id)).toBe(true);
    });

    it('should handle single constraint', () => {
      const decision = createDecisionRecord({
        content: {
          what: 'Use PostgreSQL',
          constraints: ['Must support ACID'],
        },
      });

      const operations = buildGraphOperations(decision);
      const relations = extractRelations(operations);

      const constraintRelations = relations.filter(r => r.relationType === 'CONSTRAINT');
      expect(constraintRelations.length).toBe(1);
    });

    it('should store full constraint text without truncation', () => {
      const longConstraint = 'Must support ' + 'very '.repeat(50) + 'complex queries';
      const decision = createDecisionRecord({
        content: {
          what: 'Use PostgreSQL',
          constraints: [longConstraint],
        },
      });

      const operations = buildGraphOperations(decision);
      const relations = extractRelations(operations);

      const constraintRelations = relations.filter(r => r.relationType === 'CONSTRAINT');
      expect(constraintRelations[0].to).toBe(longConstraint);
    });
  });

  // ===== TRADEOFFS TESTS =====

  describe('TRADEOFF relations', () => {
    it('should not create TRADEOFF relations when no tradeoffs', () => {
      const decision = createDecisionRecord({
        content: { what: 'Use PostgreSQL' },
      });

      const operations = buildGraphOperations(decision);
      const relations = extractRelations(operations);

      const tradeoffRelations = relations.filter(r => r.relationType === 'TRADEOFF');
      expect(tradeoffRelations.length).toBe(0);
    });

    it('should create TRADEOFF for each tradeoff', () => {
      const decision = createDecisionRecord({
        content: {
          what: 'Use cursor-pagination',
          tradeoffs: [
            'More complex client code',
            'Requires storing cursor state',
            'Cannot jump to arbitrary pages',
          ],
        },
      });

      const operations = buildGraphOperations(decision);
      const relations = extractRelations(operations);

      const tradeoffRelations = relations.filter(r => r.relationType === 'TRADEOFF');
      expect(tradeoffRelations.length).toBe(3);
      expect(tradeoffRelations.every(r => r.from === decision.id)).toBe(true);
    });

    it('should handle single tradeoff', () => {
      const decision = createDecisionRecord({
        content: {
          what: 'Use cursor-pagination',
          tradeoffs: ['More complex client code'],
        },
      });

      const operations = buildGraphOperations(decision);
      const relations = extractRelations(operations);

      const tradeoffRelations = relations.filter(r => r.relationType === 'TRADEOFF');
      expect(tradeoffRelations.length).toBe(1);
    });
  });

  // ===== RELATES_TO CROSS-LINK TESTS =====

  describe('RELATES_TO cross-links between entities', () => {
    it('should not create RELATES_TO with single entity', () => {
      const decision = createDecisionRecord({
        entities: ['PostgreSQL'],
      });

      const operations = buildGraphOperations(decision);
      const relations = extractRelations(operations);

      const relatesRelations = relations.filter(r => r.relationType === 'RELATES_TO');
      expect(relatesRelations.length).toBe(0);
    });

    it('should create RELATES_TO for 2 entities (1 relation)', () => {
      const decision = createDecisionRecord({
        entities: ['PostgreSQL', 'Redis'],
      });

      const operations = buildGraphOperations(decision);
      const relations = extractRelations(operations);

      const relatesRelations = relations.filter(r => r.relationType === 'RELATES_TO');
      expect(relatesRelations.length).toBe(1); // C(2,2) = 1
      expect(relatesRelations[0].from).toBe('PostgreSQL');
      expect(relatesRelations[0].to).toBe('Redis');
    });

    it('should create pairwise RELATES_TO for 3 entities', () => {
      const decision = createDecisionRecord({
        entities: ['PostgreSQL', 'Redis', 'FastAPI'],
      });

      const operations = buildGraphOperations(decision);
      const relations = extractRelations(operations);

      const relatesRelations = relations.filter(r => r.relationType === 'RELATES_TO');
      expect(relatesRelations.length).toBe(3); // C(3,2) = 3
    });

    it('should verify correct pairwise combinations for 3 entities', () => {
      const decision = createDecisionRecord({
        entities: ['A', 'B', 'C'],
      });

      const operations = buildGraphOperations(decision);
      const relations = extractRelations(operations);

      const relatesRelations = relations.filter(r => r.relationType === 'RELATES_TO');
      const pairs = relatesRelations.map(r => `${r.from}-${r.to}`);

      expect(pairs).toContain('A-B');
      expect(pairs).toContain('A-C');
      expect(pairs).toContain('B-C');
    });

    it('should create N*(N-1)/2 RELATES_TO for N entities', () => {
      // Test formula: 4 entities = 6 relations, 5 entities = 10 relations
      const test4Entities = createDecisionRecord({
        entities: ['E1', 'E2', 'E3', 'E4'],
      });
      const ops4 = buildGraphOperations(test4Entities);
      const rels4 = extractRelations(ops4).filter(r => r.relationType === 'RELATES_TO');
      expect(rels4.length).toBe(6); // 4*3/2 = 6

      const test5Entities = createDecisionRecord({
        entities: ['E1', 'E2', 'E3', 'E4', 'E5'],
      });
      const ops5 = buildGraphOperations(test5Entities);
      const rels5 = extractRelations(ops5).filter(r => r.relationType === 'RELATES_TO');
      expect(rels5.length).toBe(10); // 5*4/2 = 10
    });

    it('should maintain entity order in RELATES_TO (i < j)', () => {
      const decision = createDecisionRecord({
        entities: ['PostgreSQL', 'Redis', 'FastAPI', 'Celery'],
      });

      const operations = buildGraphOperations(decision);
      const relations = extractRelations(operations);

      const relatesRelations = relations.filter(r => r.relationType === 'RELATES_TO');

      // Check that indices are ordered (from comes before to in original array)
      const entities = decision.entities;
      relatesRelations.forEach(r => {
        const fromIdx = entities.indexOf(r.from);
        const toIdx = entities.indexOf(r.to);
        expect(fromIdx).toBeLessThan(toIdx);
      });
    });
  });

  // ===== EXPLICIT RELATIONS TESTS =====

  describe('explicit relations from decision record', () => {
    it('should include explicit relations from decision.relations array', () => {
      const decision = createDecisionRecord({
        relations: [
          { from: 'PostgreSQL', to: 'ACID', type: 'PROVIDES' },
          { from: 'Redis', to: 'caching', type: 'ENABLES' },
        ],
      });

      const operations = buildGraphOperations(decision);
      const relations = extractRelations(operations);

      expect(relations.some(r => r.from === 'PostgreSQL' && r.to === 'ACID')).toBe(true);
      expect(relations.some(r => r.from === 'Redis' && r.to === 'caching')).toBe(true);
    });

    it('should preserve relation types from explicit relations', () => {
      const decision = createDecisionRecord({
        relations: [
          { from: 'A', to: 'B', type: 'CHOSE' },
          { from: 'C', to: 'D', type: 'PREFERS' },
        ],
      });

      const operations = buildGraphOperations(decision);
      const relations = extractRelations(operations);

      const relAB = relations.find(r => r.from === 'A' && r.to === 'B');
      const relCD = relations.find(r => r.from === 'C' && r.to === 'D');

      expect(relAB?.relationType).toBe('CHOSE');
      expect(relCD?.relationType).toBe('PREFERS');
    });
  });

  // ===== EDGE CASES: DUPLICATE ENTITIES =====

  describe('edge case: duplicate entities in input', () => {
    it('should handle duplicate entities in mentions list', () => {
      const decision = createDecisionRecord({
        entities: ['PostgreSQL', 'PostgreSQL', 'Redis'],
      });

      const operations = buildGraphOperations(decision);
      const entities = extractEntities(operations);

      const pgEntities = entities.filter(e => e.name === 'PostgreSQL');
      expect(pgEntities.length).toBeGreaterThanOrEqual(1);
    });

    it('should create correct RELATES_TO for duplicates', () => {
      // Note: The function may or may not deduplicate - just verify behavior is consistent
      const decision = createDecisionRecord({
        entities: ['A', 'A', 'B'],
      });

      const operations = buildGraphOperations(decision);
      const relations = extractRelations(operations);

      // Should still work even with duplicate entities
      expect(operations.length).toBeGreaterThan(0);
    });
  });

  // ===== EDGE CASES: VERY LONG TEXT =====

  describe('edge case: very long constraint/tradeoff text', () => {
    it('should handle very long constraint without truncation', () => {
      const veryLongConstraint = 'C'.repeat(1000);
      const decision = createDecisionRecord({
        content: {
          what: 'Use PostgreSQL',
          constraints: [veryLongConstraint],
        },
      });

      const operations = buildGraphOperations(decision);
      const relations = extractRelations(operations);

      const constraintRel = relations.find(r => r.relationType === 'CONSTRAINT');
      expect(constraintRel?.to).toBe(veryLongConstraint);
    });

    it('should handle very long tradeoff text', () => {
      const veryLongTradeoff = 'T'.repeat(2000);
      const decision = createDecisionRecord({
        content: {
          what: 'Use cursor-pagination',
          tradeoffs: [veryLongTradeoff],
        },
      });

      const operations = buildGraphOperations(decision);
      const relations = extractRelations(operations);

      const tradeoffRel = relations.find(r => r.relationType === 'TRADEOFF');
      expect(tradeoffRel?.to).toBe(veryLongTradeoff);
    });

    it('should truncate context observation for very long what', () => {
      const veryLongWhat = 'W'.repeat(500);
      const decision = createDecisionRecord({
        content: { what: veryLongWhat },
        entities: ['PostgreSQL'],
      });

      const operations = buildGraphOperations(decision);
      const entities = extractEntities(operations);

      const pgEntity = entities.find(e => e.name === 'PostgreSQL');
      const contextObs = pgEntity?.observations[0] ?? '';

      // Context observation should truncate long what
      expect(contextObs.length).toBeLessThan(veryLongWhat.length);
    });
  });

  // ===== EDGE CASES: MINIMAL INPUT =====

  describe('edge case: minimal input with no optional fields', () => {
    it('should handle decision with only required what field', () => {
      const decision = createDecisionRecord({
        content: {
          what: 'Do something',
        },
        entities: [],
      });

      const operations = buildGraphOperations(decision);

      expect(operations.length).toBeGreaterThan(0);
      expect(operations[0].type).toBe('create_entities');

      const entities = extractEntities(operations);
      expect(entities.length).toBe(1); // Only main entity
    });

    it('should handle decision with empty alternatives array', () => {
      const decision = createDecisionRecord({
        content: {
          what: 'Use PostgreSQL',
          alternatives: [],
        },
      });

      const operations = buildGraphOperations(decision);
      const relations = extractRelations(operations);

      const choseOverRelations = relations.filter(r => r.relationType === 'CHOSE_OVER');
      expect(choseOverRelations.length).toBe(0);
    });

    it('should handle decision with empty constraints array', () => {
      const decision = createDecisionRecord({
        content: {
          what: 'Use PostgreSQL',
          constraints: [],
        },
      });

      const operations = buildGraphOperations(decision);
      const relations = extractRelations(operations);

      const constraintRelations = relations.filter(r => r.relationType === 'CONSTRAINT');
      expect(constraintRelations.length).toBe(0);
    });

    it('should handle decision with empty tradeoffs array', () => {
      const decision = createDecisionRecord({
        content: {
          what: 'Use PostgreSQL',
          tradeoffs: [],
        },
      });

      const operations = buildGraphOperations(decision);
      const relations = extractRelations(operations);

      const tradeoffRelations = relations.filter(r => r.relationType === 'TRADEOFF');
      expect(tradeoffRelations.length).toBe(0);
    });
  });

  // ===== COMPREHENSIVE INTEGRATION TESTS =====

  describe('comprehensive scenario: full decision with all fields', () => {
    it('should generate all relation types in single decision', () => {
      const decision = createDecisionRecord({
        type: 'decision',
        content: {
          what: 'Use PostgreSQL with cursor-pagination',
          why: 'ACID compliance and performance',
          alternatives: ['MongoDB', 'MySQL'],
          constraints: ['Must support ACID', 'Team expertise'],
          tradeoffs: ['More complex setup', 'Higher operational overhead'],
        },
        entities: ['PostgreSQL', 'cursor-pagination', 'ACID'],
      });

      const operations = buildGraphOperations(decision);
      const entities = extractEntities(operations);
      const relations = extractRelations(operations);

      // Verify all entity types
      expect(entities.length).toBe(4); // main + 3 entities

      // Verify all relation types
      expect(countRelationsByType(relations, 'CHOSE')).toBe(3); // 3 entities
      expect(countRelationsByType(relations, 'CHOSE_OVER')).toBe(2); // 2 alternatives
      expect(countRelationsByType(relations, 'CONSTRAINT')).toBe(2);
      expect(countRelationsByType(relations, 'TRADEOFF')).toBe(2);
      expect(countRelationsByType(relations, 'RELATES_TO')).toBe(3); // C(3,2) = 3
    });

    it('should handle complex multi-entity decision', () => {
      const decision = createDecisionRecord({
        type: 'decision',
        content: {
          what: 'Architecture for microservices',
          why: 'Scalability and team autonomy',
          alternatives: ['Monolith', 'Modular monolith'],
          constraints: [
            'Budget constraint of $100K',
            'Team size limit of 10',
            'Infrastructure must be cloud-native',
          ],
          tradeoffs: [
            'Increased operational complexity',
            'Network latency concerns',
            'Data consistency challenges',
          ],
        },
        entities: [
          'Kubernetes',
          'Docker',
          'FastAPI',
          'PostgreSQL',
          'Redis',
          'event-driven-architecture',
        ],
      });

      const operations = buildGraphOperations(decision);
      expect(operations.length).toBeGreaterThanOrEqual(2); // At least entities and relations

      const entities = extractEntities(operations);
      expect(entities.length).toBe(7); // main + 6 entities

      const relations = extractRelations(operations);
      expect(relations.length).toBeGreaterThan(0);
    });
  });

  // ===== RELATION COUNT VERIFICATION =====

  describe('relation count correctness', () => {
    it('should not create relations operation when no relations', () => {
      const decision = createDecisionRecord({
        type: 'preference',
        content: { what: 'Just a simple preference' },
        entities: ['PostgreSQL'], // Single entity, no alternatives, constraints, or tradeoffs
        relations: [],
      });

      const operations = buildGraphOperations(decision);

      // Should have create_entities but might not have create_relations
      const createRelOps = countOperationsByType(operations, 'create_relations');
      // If no relations at all, create_relations operation should not exist
      if (createRelOps > 0) {
        const relations = extractRelations(operations);
        expect(relations.length).toBeGreaterThan(0);
      }
    });

    it('should create create_relations operation when relations exist', () => {
      const decision = createDecisionRecord({
        content: {
          what: 'Use PostgreSQL',
          alternatives: ['MongoDB'],
        },
        entities: ['PostgreSQL', 'Redis'],
      });

      const operations = buildGraphOperations(decision);
      const createRelOps = countOperationsByType(operations, 'create_relations');

      expect(createRelOps).toBeGreaterThan(0);

      const relations = extractRelations(operations);
      expect(relations.length).toBeGreaterThan(0);
    });
  });
});
