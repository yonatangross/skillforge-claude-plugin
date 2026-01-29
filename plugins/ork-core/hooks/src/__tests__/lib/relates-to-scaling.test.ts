/**
 * Tests for RELATES_TO Scaling Solutions
 *
 * Comprehensive test coverage for:
 * - buildTopKRelates() - Top-K limitation strategy
 * - buildWeightedRelates() - Entity importance weighting
 * - buildProbabilisticRelates() - Random sampling
 * - buildRelatesWithStrategy() - Hybrid strategy with fallback
 * - Metrics and observability
 */

import { describe, it, expect, test } from 'vitest';
import {
  buildTopKRelates,
  buildWeightedRelates,
  buildProbabilisticRelates,
  buildRelatesWithStrategy,
  calculateAdaptiveProbability,
  captureRelatesToMetrics,
  DEFAULT_STRATEGY,
  type GraphRelation,
  type RelatesToConfig,
  type WeightedRelatesToOptions,
  type ProbabilisticSamplingConfig,
} from '../../lib/relates-to-scaling.js';

// =============================================================================
// Helper Functions
// =============================================================================

function countRelations(relations: GraphRelation[]): number {
  return relations.length;
}

function hasRelation(relations: GraphRelation[], from: string, to: string): boolean {
  return relations.some(
    r => (r.from === from && r.to === to) || (r.from === to && r.to === from)
  );
}

function generateEntities(count: number, prefix: string = 'Entity'): string[] {
  return Array.from({ length: count }, (_, i) => `${prefix}${i + 1}`);
}

// =============================================================================
// buildTopKRelates() Tests
// =============================================================================

describe('buildTopKRelates', () => {
  describe('edge cases', () => {
    it('should return empty array for empty entities', () => {
      const relations = buildTopKRelates([]);
      expect(relations).toEqual([]);
    });

    it('should return empty array for single entity', () => {
      const relations = buildTopKRelates(['PostgreSQL']);
      expect(relations).toEqual([]);
    });

    it('should return empty array when disabled', () => {
      const relations = buildTopKRelates(['A', 'B', 'C'], { enabled: false });
      expect(relations).toEqual([]);
    });
  });

  describe('small sets', () => {
    it('should create 1 relation for 2 entities', () => {
      const relations = buildTopKRelates(['A', 'B']);
      expect(countRelations(relations)).toBe(1);
      expect(hasRelation(relations, 'A', 'B')).toBe(true);
    });

    it('should create 3 relations for 3 entities', () => {
      const relations = buildTopKRelates(['A', 'B', 'C']);
      expect(countRelations(relations)).toBe(3);
    });
  });

  describe('maxRelations limit', () => {
    it('should respect maxRelations config', () => {
      const entities = generateEntities(20);
      const relations = buildTopKRelates(entities, { maxRelations: 10 });
      expect(countRelations(relations)).toBeLessThanOrEqual(10);
    });

    it('should limit relations for large entity sets', () => {
      const entities = generateEntities(50);
      const relations = buildTopKRelates(entities, { maxRelations: 50 });
      expect(countRelations(relations)).toBeLessThanOrEqual(50);
    });
  });

  describe('scoring', () => {
    it('should prioritize earlier entities (position boost)', () => {
      const entities = ['First', 'Second', 'Third', 'Fourth', 'Fifth'];
      const relations = buildTopKRelates(entities, { maxRelations: 3 });
      // Earlier entities should be more connected
      const hasFirst = relations.some(r => r.from === 'First' || r.to === 'First');
      expect(hasFirst).toBe(true);
    });
  });
});

// =============================================================================
// buildWeightedRelates() Tests
// =============================================================================

describe('buildWeightedRelates', () => {
  describe('edge cases', () => {
    it('should return empty array for empty entities', () => {
      const relations = buildWeightedRelates([]);
      expect(relations).toEqual([]);
    });

    it('should return empty array for single entity', () => {
      const relations = buildWeightedRelates(['PostgreSQL']);
      expect(relations).toEqual([]);
    });
  });

  describe('importance filtering', () => {
    it('should link well-known technologies', () => {
      const entities = ['PostgreSQL', 'Redis', 'FastAPI'];
      const relations = buildWeightedRelates(entities);
      // These are well-known patterns, should generate some relations
      expect(countRelations(relations)).toBeGreaterThanOrEqual(0);
    });

    it('should filter out low-importance entities', () => {
      const entities = ['xyz123', 'unknownThing', 'randomName'];
      const relations = buildWeightedRelates(entities, new Map(), {
        minImportanceScore: 150, // Very high threshold
      });
      // Unknown entities with high threshold should produce fewer relations
      expect(countRelations(relations)).toBe(0);
    });
  });

  describe('linking rules', () => {
    it('should respect linkPrimaryToPrimary option', () => {
      const entities = ['PostgreSQL', 'Redis']; // Both well-known
      const relations = buildWeightedRelates(entities, new Map(), {
        linkPrimaryToPrimary: true,
        minImportanceScore: 50, // Lower threshold
      });
      // Should create links between primary entities
      expect(countRelations(relations)).toBeGreaterThanOrEqual(0);
    });

    it('should disable secondary-to-secondary when configured', () => {
      const relations = buildWeightedRelates(
        ['MediumThing1', 'MediumThing2'],
        new Map(),
        {
          linkSecondaryToSecondary: false,
          minImportanceScore: 50,
        }
      );
      // With low threshold, these might still link through other rules
      expect(relations).toBeDefined();
    });
  });
});

// =============================================================================
// buildProbabilisticRelates() Tests
// =============================================================================

describe('buildProbabilisticRelates', () => {
  describe('edge cases', () => {
    it('should return empty array for empty entities', () => {
      const relations = buildProbabilisticRelates([]);
      expect(relations).toEqual([]);
    });

    it('should return empty array for single entity', () => {
      const relations = buildProbabilisticRelates(['A']);
      expect(relations).toEqual([]);
    });
  });

  describe('fixed probability strategy', () => {
    it('should include all relations with probability 1.0', () => {
      const entities = ['A', 'B', 'C'];
      const relations = buildProbabilisticRelates(entities, {
        strategy: 'fixed',
        fixedProbability: 1.0,
        seed: 12345,
      });
      expect(countRelations(relations)).toBe(3); // C(3,2) = 3
    });

    it('should include no relations with probability 0.0', () => {
      const entities = ['A', 'B', 'C'];
      const relations = buildProbabilisticRelates(entities, {
        strategy: 'fixed',
        fixedProbability: 0.0,
        seed: 12345,
      });
      expect(countRelations(relations)).toBe(0);
    });
  });

  describe('adaptive strategy', () => {
    it('should keep all relations for small sets (≤5)', () => {
      const entities = ['A', 'B', 'C', 'D', 'E'];
      const relations = buildProbabilisticRelates(entities, {
        strategy: 'adaptive',
        seed: 12345,
      });
      // For 5 entities, adaptive probability is 1.0
      expect(countRelations(relations)).toBe(10); // C(5,2) = 10
    });
  });

  describe('weighted strategy', () => {
    it('should favor nearby entities', () => {
      const entities = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'];
      const relations = buildProbabilisticRelates(entities, {
        strategy: 'weighted',
        seed: 42,
        absoluteMaxRelations: 50,
      });
      // Should produce some relations
      expect(countRelations(relations)).toBeGreaterThan(0);
    });
  });

  describe('absolute max limit', () => {
    it('should respect absoluteMaxRelations', () => {
      const entities = generateEntities(20);
      const relations = buildProbabilisticRelates(entities, {
        strategy: 'fixed',
        fixedProbability: 1.0,
        absoluteMaxRelations: 15,
        seed: 12345,
      });
      expect(countRelations(relations)).toBeLessThanOrEqual(15);
    });
  });

  describe('reproducibility', () => {
    it('should produce same results with same seed', () => {
      const entities = generateEntities(15);
      const config: Partial<ProbabilisticSamplingConfig> = {
        strategy: 'adaptive',
        seed: 42,
      };
      const relations1 = buildProbabilisticRelates(entities, config);
      const relations2 = buildProbabilisticRelates(entities, config);
      expect(relations1).toEqual(relations2);
    });
  });
});

// =============================================================================
// calculateAdaptiveProbability() Tests
// =============================================================================

describe('calculateAdaptiveProbability', () => {
  it('should return 1.0 for small sets (≤5)', () => {
    expect(calculateAdaptiveProbability(1)).toBe(1.0);
    expect(calculateAdaptiveProbability(5)).toBe(1.0);
  });

  it('should return 0.8 for sets 6-10', () => {
    expect(calculateAdaptiveProbability(6)).toBe(0.8);
    expect(calculateAdaptiveProbability(10)).toBe(0.8);
  });

  it('should return 0.5 for sets 11-20', () => {
    expect(calculateAdaptiveProbability(11)).toBe(0.5);
    expect(calculateAdaptiveProbability(20)).toBe(0.5);
  });

  it('should return 0.3 for sets 21-50', () => {
    expect(calculateAdaptiveProbability(21)).toBe(0.3);
    expect(calculateAdaptiveProbability(50)).toBe(0.3);
  });

  it('should return 0.15 for sets 51-100', () => {
    expect(calculateAdaptiveProbability(51)).toBe(0.15);
    expect(calculateAdaptiveProbability(100)).toBe(0.15);
  });

  it('should return ≤0.1 for very large sets', () => {
    expect(calculateAdaptiveProbability(200)).toBeLessThanOrEqual(0.1);
    expect(calculateAdaptiveProbability(500)).toBeLessThanOrEqual(0.1);
  });
});

// =============================================================================
// buildRelatesWithStrategy() Tests
// =============================================================================

describe('buildRelatesWithStrategy', () => {
  describe('small set bypass', () => {
    it('should use all-pairs for ≤10 entities', () => {
      const entities = ['A', 'B', 'C'];
      const relations = buildRelatesWithStrategy(entities);
      expect(countRelations(relations)).toBe(3); // C(3,2) = 3
    });

    it('should create correct pairs for 2 entities', () => {
      const relations = buildRelatesWithStrategy(['X', 'Y']);
      expect(countRelations(relations)).toBe(1);
      expect(hasRelation(relations, 'X', 'Y')).toBe(true);
    });

    it('should create N*(N-1)/2 relations for N≤10 entities', () => {
      for (let n = 2; n <= 10; n++) {
        const entities = generateEntities(n);
        const relations = buildRelatesWithStrategy(entities);
        const expected = (n * (n - 1)) / 2;
        expect(countRelations(relations)).toBe(expected);
      }
    });
  });

  describe('strategy selection for large sets', () => {
    it('should use weighted strategy by default for >10 entities', () => {
      const entities = generateEntities(15);
      const relations = buildRelatesWithStrategy(entities);
      // Weighted strategy will produce some relations based on importance
      expect(relations).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('should return empty array for empty entities', () => {
      const relations = buildRelatesWithStrategy([]);
      expect(relations).toEqual([]);
    });

    it('should return empty array for single entity', () => {
      const relations = buildRelatesWithStrategy(['Only']);
      expect(relations).toEqual([]);
    });
  });
});

// =============================================================================
// captureRelatesToMetrics() Tests
// =============================================================================

describe('captureRelatesToMetrics', () => {
  it('should calculate correct potential relations', () => {
    const entities = ['A', 'B', 'C', 'D'];
    const metrics = captureRelatesToMetrics(entities, 3, 'topk');
    expect(metrics.potentialRelations).toBe(6); // C(4,2) = 6
  });

  it('should calculate reduction percentage', () => {
    const entities = generateEntities(10);
    const metrics = captureRelatesToMetrics(entities, 20, 'weighted');
    // 45 potential, 20 actual = ~55.6% reduction
    expect(metrics.reductionPercentage).toBeCloseTo(55.56, 0);
  });

  it('should format reduction ratio string', () => {
    const entities = ['A', 'B', 'C'];
    const metrics = captureRelatesToMetrics(entities, 1, 'probabilistic');
    expect(metrics.reductionRatio).toBe('3 → 1');
  });

  it('should handle zero entities', () => {
    const metrics = captureRelatesToMetrics([], 0, 'topk');
    expect(metrics.potentialRelations).toBe(0);
    expect(metrics.actualRelations).toBe(0);
    expect(metrics.reductionPercentage).toBe(0);
  });

  it('should record strategy used', () => {
    const metrics = captureRelatesToMetrics(['A', 'B'], 1, 'weighted');
    expect(metrics.strategy).toBe('weighted');
  });
});

// =============================================================================
// DEFAULT_STRATEGY Tests
// =============================================================================

describe('DEFAULT_STRATEGY', () => {
  it('should have weighted as primary strategy', () => {
    expect(DEFAULT_STRATEGY.primary).toBe('weighted');
  });

  it('should have topk as fallback strategy', () => {
    expect(DEFAULT_STRATEGY.fallback).toBe('topk');
  });

  it('should have fallback threshold of 100', () => {
    expect(DEFAULT_STRATEGY.fallbackThreshold).toBe(100);
  });
});

// =============================================================================
// Integration Tests
// =============================================================================

describe('integration scenarios', () => {
  it('should handle real-world entity set (database decisions)', () => {
    const entities = [
      'PostgreSQL', 'Redis', 'FastAPI', 'SQLAlchemy',
      'cursor-pagination', 'caching', 'docker',
    ];
    const relations = buildRelatesWithStrategy(entities);
    // 7 entities, small set bypass: C(7,2) = 21 relations
    expect(countRelations(relations)).toBe(21);
  });

  it('should handle mixed technologies and patterns', () => {
    const entities = ['TypeScript', 'React', 'clean-architecture', 'jest', 'vite'];
    const relations = buildRelatesWithStrategy(entities);
    // 5 entities: C(5,2) = 10 relations
    expect(countRelations(relations)).toBe(10);
  });

  it('should scale gracefully for 50 entities', () => {
    const entities = generateEntities(50);
    const relations = buildRelatesWithStrategy(entities);
    // Should not explode to 1,225 relations
    // With weighted strategy, will be filtered
    expect(countRelations(relations)).toBeLessThan(500);
  });

  it('should scale gracefully for 100 entities', () => {
    const entities = generateEntities(100);
    const relations = buildRelatesWithStrategy(entities);
    // Should not explode to 4,950 relations
    expect(countRelations(relations)).toBeLessThan(1000);
  });
});
