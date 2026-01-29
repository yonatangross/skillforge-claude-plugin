/**
 * Tests for Technology Registry
 *
 * Comprehensive test coverage for:
 * - getTechnologyCanonical() - technology alias resolution
 * - getPatternCanonical() - pattern variant resolution
 * - getToolCanonical() - tool alias resolution
 * - inferEntityType() - entity type inference
 * - inferCategory() - category inference
 * - getTechnologyAliasMap() - alias map export
 * - getPatternsList() - patterns list export
 * - getToolsList() - tools list export
 */

import { describe, it, expect } from 'vitest';
import {
  getTechnologyCanonical,
  getPatternCanonical,
  getToolCanonical,
  getTechnologyCategory,
  getPatternCategory,
  inferEntityType,
  inferCategory,
  isTechnology,
  isPattern,
  isTool,
  getTechnologyAliasMap,
  getPatternsList,
  getToolsList,
  getAllKnownNames,
} from '../../lib/technology-registry.js';

// =============================================================================
// getTechnologyCanonical() Tests
// =============================================================================

describe('getTechnologyCanonical', () => {
  describe('databases', () => {
    it('should resolve postgresql variants', () => {
      expect(getTechnologyCanonical('postgresql')).toBe('postgresql');
      expect(getTechnologyCanonical('postgres')).toBe('postgresql');
      expect(getTechnologyCanonical('pg')).toBe('postgresql');
      expect(getTechnologyCanonical('psql')).toBe('postgresql');
    });

    it('should resolve redis', () => {
      expect(getTechnologyCanonical('redis')).toBe('redis');
      expect(getTechnologyCanonical('redis-cache')).toBe('redis');
    });

    it('should resolve mongodb variants', () => {
      expect(getTechnologyCanonical('mongodb')).toBe('mongodb');
      expect(getTechnologyCanonical('mongo')).toBe('mongodb');
    });
  });

  describe('frameworks', () => {
    it('should resolve fastapi', () => {
      expect(getTechnologyCanonical('fastapi')).toBe('fastapi');
      expect(getTechnologyCanonical('fast-api')).toBe('fastapi');
    });

    it('should resolve nextjs variants', () => {
      expect(getTechnologyCanonical('nextjs')).toBe('nextjs');
      expect(getTechnologyCanonical('next.js')).toBe('nextjs');
      expect(getTechnologyCanonical('next')).toBe('nextjs');
    });

    it('should resolve nestjs variants', () => {
      expect(getTechnologyCanonical('nest')).toBe('nest');
      expect(getTechnologyCanonical('nestjs')).toBe('nest');
      expect(getTechnologyCanonical('nest.js')).toBe('nest');
    });
  });

  describe('languages', () => {
    it('should resolve typescript variants', () => {
      expect(getTechnologyCanonical('typescript')).toBe('typescript');
      expect(getTechnologyCanonical('ts')).toBe('typescript');
    });

    it('should resolve python variants', () => {
      expect(getTechnologyCanonical('python')).toBe('python');
      expect(getTechnologyCanonical('py')).toBe('python');
      expect(getTechnologyCanonical('python3')).toBe('python');
    });

    it('should resolve go variants', () => {
      expect(getTechnologyCanonical('go')).toBe('go');
      expect(getTechnologyCanonical('golang')).toBe('go');
    });
  });

  describe('infrastructure', () => {
    it('should resolve kubernetes variants', () => {
      expect(getTechnologyCanonical('kubernetes')).toBe('kubernetes');
      expect(getTechnologyCanonical('k8s')).toBe('kubernetes');
      expect(getTechnologyCanonical('kube')).toBe('kubernetes');
    });

    it('should resolve terraform', () => {
      expect(getTechnologyCanonical('terraform')).toBe('terraform');
      expect(getTechnologyCanonical('tf')).toBe('terraform');
    });
  });

  describe('case insensitivity', () => {
    it('should be case insensitive', () => {
      expect(getTechnologyCanonical('PostgreSQL')).toBe('postgresql');
      expect(getTechnologyCanonical('REDIS')).toBe('redis');
      expect(getTechnologyCanonical('TypeScript')).toBe('typescript');
    });
  });

  describe('unknown values', () => {
    it('should return null for unknown technologies', () => {
      expect(getTechnologyCanonical('unknowntech')).toBeNull();
      expect(getTechnologyCanonical('xyz123')).toBeNull();
    });
  });
});

// =============================================================================
// getPatternCanonical() Tests
// =============================================================================

describe('getPatternCanonical', () => {
  describe('pagination patterns', () => {
    it('should resolve cursor-pagination variants', () => {
      expect(getPatternCanonical('cursor-pagination')).toBe('cursor-pagination');
      expect(getPatternCanonical('cursor pagination')).toBe('cursor-pagination');
      expect(getPatternCanonical('cursor_pagination')).toBe('cursor-pagination');
    });

    it('should resolve offset-pagination', () => {
      expect(getPatternCanonical('offset-pagination')).toBe('offset-pagination');
      expect(getPatternCanonical('offset pagination')).toBe('offset-pagination');
    });
  });

  describe('architecture patterns', () => {
    it('should resolve clean-architecture', () => {
      expect(getPatternCanonical('clean-architecture')).toBe('clean-architecture');
      expect(getPatternCanonical('clean architecture')).toBe('clean-architecture');
    });

    it('should resolve dependency-injection', () => {
      expect(getPatternCanonical('dependency-injection')).toBe('dependency-injection');
      expect(getPatternCanonical('di')).toBe('dependency-injection');
    });

    it('should resolve cqrs', () => {
      expect(getPatternCanonical('cqrs')).toBe('cqrs');
    });

    it('should resolve ddd', () => {
      expect(getPatternCanonical('ddd')).toBe('ddd');
      expect(getPatternCanonical('domain-driven-design')).toBe('ddd');
    });
  });

  describe('caching patterns', () => {
    it('should resolve cache-aside', () => {
      expect(getPatternCanonical('cache-aside')).toBe('cache-aside');
      expect(getPatternCanonical('cache aside')).toBe('cache-aside');
      expect(getPatternCanonical('lazy-loading')).toBe('cache-aside');
    });
  });

  describe('api patterns', () => {
    it('should resolve rest', () => {
      expect(getPatternCanonical('rest')).toBe('rest');
      expect(getPatternCanonical('restful')).toBe('rest');
      expect(getPatternCanonical('rest-api')).toBe('rest');
    });

    it('should resolve graphql', () => {
      expect(getPatternCanonical('graphql')).toBe('graphql');
    });

    it('should resolve sse', () => {
      expect(getPatternCanonical('sse')).toBe('sse');
      expect(getPatternCanonical('server-sent-events')).toBe('sse');
    });
  });

  describe('case insensitivity', () => {
    it('should be case insensitive', () => {
      expect(getPatternCanonical('CQRS')).toBe('cqrs');
      expect(getPatternCanonical('RAG')).toBe('rag');
    });
  });
});

// =============================================================================
// getToolCanonical() Tests
// =============================================================================

describe('getToolCanonical', () => {
  describe('CLI tools', () => {
    it('should resolve git', () => {
      expect(getToolCanonical('git')).toBe('git');
      expect(getToolCanonical('git-cli')).toBe('git');
    });

    it('should resolve gh', () => {
      expect(getToolCanonical('gh')).toBe('gh');
      expect(getToolCanonical('github-cli')).toBe('gh');
    });

    it('should resolve grep variants', () => {
      expect(getToolCanonical('grep')).toBe('grep');
      expect(getToolCanonical('ripgrep')).toBe('grep');
      expect(getToolCanonical('rg')).toBe('grep');
    });

    it('should resolve bash', () => {
      expect(getToolCanonical('bash')).toBe('bash');
      expect(getToolCanonical('shell')).toBe('bash');
      expect(getToolCanonical('sh')).toBe('bash');
    });
  });

  describe('package managers', () => {
    it('should resolve npm', () => {
      expect(getToolCanonical('npm')).toBe('npm');
    });

    it('should resolve yarn', () => {
      expect(getToolCanonical('yarn')).toBe('yarn');
    });

    it('should resolve pnpm', () => {
      expect(getToolCanonical('pnpm')).toBe('pnpm');
    });
  });

  describe('editors', () => {
    it('should resolve vscode variants', () => {
      expect(getToolCanonical('vscode')).toBe('vscode');
      expect(getToolCanonical('vs-code')).toBe('vscode');
      expect(getToolCanonical('visual-studio-code')).toBe('vscode');
    });

    it('should resolve neovim variants', () => {
      expect(getToolCanonical('neovim')).toBe('neovim');
      expect(getToolCanonical('nvim')).toBe('neovim');
    });
  });
});

// =============================================================================
// inferEntityType() Tests
// =============================================================================

describe('inferEntityType', () => {
  describe('technologies', () => {
    it('should identify databases as Technology', () => {
      expect(inferEntityType('postgresql')).toBe('Technology');
      expect(inferEntityType('redis')).toBe('Technology');
      expect(inferEntityType('mongodb')).toBe('Technology');
    });

    it('should identify frameworks as Technology', () => {
      expect(inferEntityType('fastapi')).toBe('Technology');
      expect(inferEntityType('react')).toBe('Technology');
      expect(inferEntityType('django')).toBe('Technology');
    });

    it('should identify languages as Technology', () => {
      expect(inferEntityType('typescript')).toBe('Technology');
      expect(inferEntityType('python')).toBe('Technology');
    });
  });

  describe('patterns', () => {
    it('should identify architecture patterns as Pattern', () => {
      expect(inferEntityType('cqrs')).toBe('Pattern');
      expect(inferEntityType('clean-architecture')).toBe('Pattern');
      expect(inferEntityType('microservices')).toBe('Pattern');
    });

    it('should identify caching patterns as Pattern', () => {
      expect(inferEntityType('cache-aside')).toBe('Pattern');
      expect(inferEntityType('write-through')).toBe('Pattern');
    });

    it('should identify api patterns as Pattern', () => {
      expect(inferEntityType('rest')).toBe('Pattern');
      expect(inferEntityType('graphql')).toBe('Pattern');
    });
  });

  describe('tools', () => {
    it('should identify CLI tools as Tool', () => {
      expect(inferEntityType('git')).toBe('Tool');
      expect(inferEntityType('gh')).toBe('Tool');
      expect(inferEntityType('grep')).toBe('Tool');
    });

    it('should identify package managers as Tool', () => {
      expect(inferEntityType('npm')).toBe('Tool');
      expect(inferEntityType('pnpm')).toBe('Tool');
    });
  });

  describe('unknown', () => {
    it('should return null for unknown entities', () => {
      expect(inferEntityType('unknownThing')).toBeNull();
      expect(inferEntityType('xyz123')).toBeNull();
    });
  });
});

// =============================================================================
// inferCategory() Tests
// =============================================================================

describe('inferCategory', () => {
  describe('technology categories', () => {
    it('should return database for database technologies', () => {
      expect(inferCategory('postgresql')).toBe('database');
      expect(inferCategory('redis')).toBe('database');
      expect(inferCategory('mongodb')).toBe('database');
    });

    it('should return backend for backend frameworks', () => {
      expect(inferCategory('fastapi')).toBe('backend');
      expect(inferCategory('django')).toBe('backend');
      expect(inferCategory('express')).toBe('backend');
    });

    it('should return frontend for frontend frameworks', () => {
      expect(inferCategory('react')).toBe('frontend');
      expect(inferCategory('vue')).toBe('frontend');
      expect(inferCategory('angular')).toBe('frontend');
    });

    it('should return language for languages', () => {
      expect(inferCategory('typescript')).toBe('language');
      expect(inferCategory('python')).toBe('language');
    });

    it('should return testing for testing frameworks', () => {
      expect(inferCategory('pytest')).toBe('testing');
      expect(inferCategory('jest')).toBe('testing');
      expect(inferCategory('vitest')).toBe('testing');
    });

    it('should return infrastructure for infra tools', () => {
      expect(inferCategory('kubernetes')).toBe('infrastructure');
      expect(inferCategory('docker')).toBe('infrastructure');
      expect(inferCategory('terraform')).toBe('infrastructure');
    });
  });

  describe('pattern categories', () => {
    it('should return architecture-pattern for arch patterns', () => {
      expect(inferCategory('cqrs')).toBe('architecture-pattern');
      expect(inferCategory('clean-architecture')).toBe('architecture-pattern');
    });

    it('should return caching-pattern for caching patterns', () => {
      expect(inferCategory('cache-aside')).toBe('caching-pattern');
      expect(inferCategory('write-through')).toBe('caching-pattern');
    });

    it('should return api-pattern for API patterns', () => {
      expect(inferCategory('rest')).toBe('api-pattern');
      expect(inferCategory('graphql')).toBe('api-pattern');
    });
  });

  describe('unknown', () => {
    it('should return general for unknown entities', () => {
      expect(inferCategory('unknownThing')).toBe('general');
      expect(inferCategory('xyz123')).toBe('general');
    });
  });
});

// =============================================================================
// Boolean Check Functions Tests
// =============================================================================

describe('isTechnology', () => {
  it('should return true for known technologies', () => {
    expect(isTechnology('postgresql')).toBe(true);
    expect(isTechnology('react')).toBe(true);
    expect(isTechnology('typescript')).toBe(true);
  });

  it('should return false for patterns and tools', () => {
    expect(isTechnology('cqrs')).toBe(false);
    expect(isTechnology('git')).toBe(false);
  });

  it('should return false for unknown', () => {
    expect(isTechnology('unknownThing')).toBe(false);
  });
});

describe('isPattern', () => {
  it('should return true for known patterns', () => {
    expect(isPattern('cqrs')).toBe(true);
    expect(isPattern('microservices')).toBe(true);
    expect(isPattern('rest')).toBe(true);
  });

  it('should return false for technologies and tools', () => {
    expect(isPattern('postgresql')).toBe(false);
    expect(isPattern('git')).toBe(false);
  });
});

describe('isTool', () => {
  it('should return true for known tools', () => {
    expect(isTool('git')).toBe(true);
    expect(isTool('npm')).toBe(true);
    expect(isTool('vscode')).toBe(true);
  });

  it('should return false for technologies and patterns', () => {
    expect(isTool('postgresql')).toBe(false);
    expect(isTool('cqrs')).toBe(false);
  });
});

// =============================================================================
// Export Functions Tests
// =============================================================================

describe('getTechnologyAliasMap', () => {
  it('should return a non-empty object', () => {
    const map = getTechnologyAliasMap();
    expect(Object.keys(map).length).toBeGreaterThan(0);
  });

  it('should map aliases to canonical names', () => {
    const map = getTechnologyAliasMap();
    expect(map['postgres']).toBe('postgresql');
    expect(map['k8s']).toBe('kubernetes');
    expect(map['ts']).toBe('typescript');
  });

  it('should include canonical names mapping to themselves', () => {
    const map = getTechnologyAliasMap();
    expect(map['postgresql']).toBe('postgresql');
    expect(map['react']).toBe('react');
  });
});

describe('getPatternsList', () => {
  it('should return an array of pattern names', () => {
    const patterns = getPatternsList();
    expect(Array.isArray(patterns)).toBe(true);
    expect(patterns.length).toBeGreaterThan(0);
  });

  it('should include common patterns', () => {
    const patterns = getPatternsList();
    expect(patterns).toContain('cqrs');
    expect(patterns).toContain('rest');
    expect(patterns).toContain('microservices');
    expect(patterns).toContain('cursor-pagination');
  });
});

describe('getToolsList', () => {
  it('should return an array of tool names', () => {
    const tools = getToolsList();
    expect(Array.isArray(tools)).toBe(true);
    expect(tools.length).toBeGreaterThan(0);
  });

  it('should include common tools', () => {
    const tools = getToolsList();
    expect(tools).toContain('git');
    expect(tools).toContain('npm');
    expect(tools).toContain('vscode');
  });
});

describe('getAllKnownNames', () => {
  it('should return all names and aliases', () => {
    const names = getAllKnownNames();
    expect(names.length).toBeGreaterThan(100); // Should have many entries
  });

  it('should include technologies, patterns, and tools', () => {
    const names = getAllKnownNames();
    // Technologies
    expect(names).toContain('postgresql');
    expect(names).toContain('postgres'); // alias
    // Patterns
    expect(names).toContain('cqrs');
    // Tools
    expect(names).toContain('git');
  });
});

// =============================================================================
// Category Functions Tests
// =============================================================================

describe('getTechnologyCategory', () => {
  it('should return correct categories', () => {
    expect(getTechnologyCategory('postgresql')).toBe('database');
    expect(getTechnologyCategory('react')).toBe('frontend');
    expect(getTechnologyCategory('fastapi')).toBe('backend');
    expect(getTechnologyCategory('typescript')).toBe('language');
  });

  it('should return null for unknown', () => {
    expect(getTechnologyCategory('unknown')).toBeNull();
  });
});

describe('getPatternCategory', () => {
  it('should return correct categories', () => {
    expect(getPatternCategory('cqrs')).toBe('architecture-pattern');
    expect(getPatternCategory('cache-aside')).toBe('caching-pattern');
    expect(getPatternCategory('rest')).toBe('api-pattern');
    expect(getPatternCategory('cursor-pagination')).toBe('pagination-pattern');
  });

  it('should return null for unknown', () => {
    expect(getPatternCategory('unknown')).toBeNull();
  });
});
