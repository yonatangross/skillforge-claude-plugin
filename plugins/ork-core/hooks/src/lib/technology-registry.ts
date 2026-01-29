/**
 * Shared Technology Registry - Single source of truth for all technologies, patterns, and tools
 *
 * Eliminates duplication across:
 * 1. TECHNOLOGY_ALIASES in user-intent-detector.ts
 * 2. inferEntityType() in memory-writer.ts
 * 3. KNOWN_PATTERNS array in user-intent-detector.ts
 * 4. inferCategory() in capture-user-intent.ts
 *
 * CC 2.1.16 Compliant
 */

// =============================================================================
// TYPES
// =============================================================================

/**
 * Categories for grouping technologies and patterns
 */
export type TechnologyCategory =
  | 'database'
  | 'frontend'
  | 'backend'
  | 'language'
  | 'auth'
  | 'ai-ml'
  | 'infrastructure'
  | 'testing'
  | 'build-tool'
  | 'package-manager'
  | 'architecture-pattern'
  | 'caching-pattern'
  | 'api-pattern'
  | 'deployment-pattern'
  | 'workflow-pattern';

/**
 * Entity types for graph memory storage
 */
export type EntityType = 'Technology' | 'Pattern' | 'Tool';

/**
 * A registered technology/tool with metadata
 */
export interface TechnologyEntry {
  /** Canonical name (primary identifier) */
  canonical: string;
  /** Aliases that map to this canonical name */
  aliases: string[];
  /** Category for grouping and inference */
  category: TechnologyCategory;
  /** Entity type for graph storage */
  entityType: EntityType;
  /** Optional: short description */
  description?: string;
}

/**
 * A registered pattern with metadata
 */
export interface PatternEntry {
  /** Canonical name with hyphens */
  canonical: string;
  /** Alternative forms (e.g., with spaces or underscores) */
  variants: string[];
  /** Category for pattern classification */
  category:
    | 'architecture-pattern'
    | 'caching-pattern'
    | 'api-pattern'
    | 'deployment-pattern'
    | 'workflow-pattern'
    | 'pagination-pattern';
  /** Entity type (always 'Pattern') */
  entityType: 'Pattern';
  /** Description */
  description: string;
}

/**
 * A registered tool with metadata
 */
export interface ToolEntry {
  /** Canonical name */
  canonical: string;
  /** Aliases */
  aliases: string[];
  /** Category */
  category: 'build-tool' | 'package-manager' | 'cli-tool';
  /** Entity type (always 'Tool') */
  entityType: 'Tool';
  /** Description */
  description: string;
}

// =============================================================================
// TECHNOLOGY REGISTRY
// =============================================================================

const TECHNOLOGIES: Record<string, TechnologyEntry> = {
  // =========================================================================
  // DATABASES
  // =========================================================================
  postgresql: {
    canonical: 'postgresql',
    aliases: ['postgres', 'pg', 'psql'],
    category: 'database',
    entityType: 'Technology',
    description: 'PostgreSQL relational database',
  },
  pgvector: {
    canonical: 'pgvector',
    aliases: ['pg-vector'],
    category: 'database',
    entityType: 'Technology',
    description: 'PostgreSQL vector extension',
  },
  redis: {
    canonical: 'redis',
    aliases: ['redis-cache'],
    category: 'database',
    entityType: 'Technology',
    description: 'Redis in-memory data store',
  },
  mongodb: {
    canonical: 'mongodb',
    aliases: ['mongo'],
    category: 'database',
    entityType: 'Technology',
    description: 'MongoDB document database',
  },
  sqlite: {
    canonical: 'sqlite',
    aliases: ['sqlite3'],
    category: 'database',
    entityType: 'Technology',
    description: 'SQLite embedded database',
  },
  mysql: {
    canonical: 'mysql',
    aliases: ['mariadb'],
    category: 'database',
    entityType: 'Technology',
    description: 'MySQL relational database',
  },
  dynamodb: {
    canonical: 'dynamodb',
    aliases: ['dynamo'],
    category: 'database',
    entityType: 'Technology',
    description: 'AWS DynamoDB NoSQL database',
  },

  // =========================================================================
  // BACKEND FRAMEWORKS
  // =========================================================================
  fastapi: {
    canonical: 'fastapi',
    aliases: ['fast-api'],
    category: 'backend',
    entityType: 'Technology',
    description: 'FastAPI Python web framework',
  },
  django: {
    canonical: 'django',
    aliases: ['django-rest'],
    category: 'backend',
    entityType: 'Technology',
    description: 'Django Python web framework',
  },
  flask: {
    canonical: 'flask',
    aliases: [],
    category: 'backend',
    entityType: 'Technology',
    description: 'Flask Python microframework',
  },
  express: {
    canonical: 'express',
    aliases: ['expressjs', 'express.js'],
    category: 'backend',
    entityType: 'Technology',
    description: 'Express.js Node.js framework',
  },
  nextjs: {
    canonical: 'nextjs',
    aliases: ['next.js', 'next'],
    category: 'backend',
    entityType: 'Technology',
    description: 'Next.js React framework',
  },
  nest: {
    canonical: 'nest',
    aliases: ['nestjs', 'nest.js'],
    category: 'backend',
    entityType: 'Technology',
    description: 'NestJS Node.js framework',
  },
  spring: {
    canonical: 'spring',
    aliases: ['spring-boot', 'springboot'],
    category: 'backend',
    entityType: 'Technology',
    description: 'Spring Java framework',
  },
  rails: {
    canonical: 'rails',
    aliases: ['ruby-on-rails', 'ror'],
    category: 'backend',
    entityType: 'Technology',
    description: 'Ruby on Rails framework',
  },

  // =========================================================================
  // FRONTEND FRAMEWORKS
  // =========================================================================
  react: {
    canonical: 'react',
    aliases: ['reactjs', 'react.js'],
    category: 'frontend',
    entityType: 'Technology',
    description: 'React UI library',
  },
  vue: {
    canonical: 'vue',
    aliases: ['vuejs', 'vue.js'],
    category: 'frontend',
    entityType: 'Technology',
    description: 'Vue.js framework',
  },
  angular: {
    canonical: 'angular',
    aliases: ['angularjs'],
    category: 'frontend',
    entityType: 'Technology',
    description: 'Angular framework',
  },
  svelte: {
    canonical: 'svelte',
    aliases: ['sveltekit'],
    category: 'frontend',
    entityType: 'Technology',
    description: 'Svelte framework',
  },
  solid: {
    canonical: 'solid',
    aliases: ['solidjs', 'solid.js'],
    category: 'frontend',
    entityType: 'Technology',
    description: 'SolidJS framework',
  },
  qwik: {
    canonical: 'qwik',
    aliases: [],
    category: 'frontend',
    entityType: 'Technology',
    description: 'Qwik framework',
  },
  astro: {
    canonical: 'astro',
    aliases: [],
    category: 'frontend',
    entityType: 'Technology',
    description: 'Astro static site builder',
  },

  // =========================================================================
  // LANGUAGES
  // =========================================================================
  typescript: {
    canonical: 'typescript',
    aliases: ['ts'],
    category: 'language',
    entityType: 'Technology',
    description: 'TypeScript language',
  },
  python: {
    canonical: 'python',
    aliases: ['py', 'python3'],
    category: 'language',
    entityType: 'Technology',
    description: 'Python language',
  },
  javascript: {
    canonical: 'javascript',
    aliases: ['js', 'ecmascript'],
    category: 'language',
    entityType: 'Technology',
    description: 'JavaScript language',
  },
  rust: {
    canonical: 'rust',
    aliases: ['rustlang'],
    category: 'language',
    entityType: 'Technology',
    description: 'Rust language',
  },
  go: {
    canonical: 'go',
    aliases: ['golang'],
    category: 'language',
    entityType: 'Technology',
    description: 'Go language',
  },
  java: {
    canonical: 'java',
    aliases: ['jdk'],
    category: 'language',
    entityType: 'Technology',
    description: 'Java language',
  },
  kotlin: {
    canonical: 'kotlin',
    aliases: ['kt'],
    category: 'language',
    entityType: 'Technology',
    description: 'Kotlin language',
  },

  // =========================================================================
  // AUTH
  // =========================================================================
  jwt: {
    canonical: 'jwt',
    aliases: ['json-web-token'],
    category: 'auth',
    entityType: 'Technology',
    description: 'JSON Web Tokens',
  },
  oauth2: {
    canonical: 'oauth2',
    aliases: ['oauth', 'oidc'],
    category: 'auth',
    entityType: 'Technology',
    description: 'OAuth 2.0 protocol',
  },
  passkeys: {
    canonical: 'passkeys',
    aliases: ['webauthn', 'fido2'],
    category: 'auth',
    entityType: 'Technology',
    description: 'Passkeys authentication',
  },
  saml: {
    canonical: 'saml',
    aliases: ['saml2'],
    category: 'auth',
    entityType: 'Technology',
    description: 'SAML authentication',
  },

  // =========================================================================
  // AI/ML
  // =========================================================================
  langchain: {
    canonical: 'langchain',
    aliases: ['lang-chain'],
    category: 'ai-ml',
    entityType: 'Technology',
    description: 'LangChain LLM framework',
  },
  langgraph: {
    canonical: 'langgraph',
    aliases: ['lang-graph'],
    category: 'ai-ml',
    entityType: 'Technology',
    description: 'LangGraph agent framework',
  },
  langfuse: {
    canonical: 'langfuse',
    aliases: ['lang-fuse'],
    category: 'ai-ml',
    entityType: 'Technology',
    description: 'Langfuse LLM observability',
  },
  openai: {
    canonical: 'openai',
    aliases: ['gpt', 'chatgpt'],
    category: 'ai-ml',
    entityType: 'Technology',
    description: 'OpenAI GPT models',
  },
  anthropic: {
    canonical: 'anthropic',
    aliases: ['claude'],
    category: 'ai-ml',
    entityType: 'Technology',
    description: 'Anthropic Claude models',
  },
  llama: {
    canonical: 'llama',
    aliases: ['llama2', 'llama3'],
    category: 'ai-ml',
    entityType: 'Technology',
    description: 'Meta Llama models',
  },

  // =========================================================================
  // INFRASTRUCTURE
  // =========================================================================
  docker: {
    canonical: 'docker',
    aliases: ['container'],
    category: 'infrastructure',
    entityType: 'Technology',
    description: 'Docker containerization',
  },
  kubernetes: {
    canonical: 'kubernetes',
    aliases: ['k8s', 'kube'],
    category: 'infrastructure',
    entityType: 'Technology',
    description: 'Kubernetes orchestration',
  },
  terraform: {
    canonical: 'terraform',
    aliases: ['tf'],
    category: 'infrastructure',
    entityType: 'Technology',
    description: 'Terraform IaC',
  },
  aws: {
    canonical: 'aws',
    aliases: ['amazon-web-services'],
    category: 'infrastructure',
    entityType: 'Technology',
    description: 'Amazon Web Services',
  },
  gcp: {
    canonical: 'gcp',
    aliases: ['google-cloud', 'google-cloud-platform'],
    category: 'infrastructure',
    entityType: 'Technology',
    description: 'Google Cloud Platform',
  },
  azure: {
    canonical: 'azure',
    aliases: ['microsoft-azure'],
    category: 'infrastructure',
    entityType: 'Technology',
    description: 'Microsoft Azure',
  },

  // =========================================================================
  // TESTING FRAMEWORKS
  // =========================================================================
  pytest: {
    canonical: 'pytest',
    aliases: ['py-test'],
    category: 'testing',
    entityType: 'Technology',
    description: 'Python testing framework',
  },
  jest: {
    canonical: 'jest',
    aliases: [],
    category: 'testing',
    entityType: 'Technology',
    description: 'JavaScript testing framework',
  },
  vitest: {
    canonical: 'vitest',
    aliases: ['vite-test'],
    category: 'testing',
    entityType: 'Technology',
    description: 'Vite-native test framework',
  },
  playwright: {
    canonical: 'playwright',
    aliases: [],
    category: 'testing',
    entityType: 'Technology',
    description: 'Playwright E2E testing',
  },
  cypress: {
    canonical: 'cypress',
    aliases: [],
    category: 'testing',
    entityType: 'Technology',
    description: 'Cypress E2E testing',
  },
  msw: {
    canonical: 'msw',
    aliases: ['mock-service-worker'],
    category: 'testing',
    entityType: 'Technology',
    description: 'Mock Service Worker',
  },

  // =========================================================================
  // BUILD TOOLS
  // =========================================================================
  webpack: {
    canonical: 'webpack',
    aliases: [],
    category: 'build-tool',
    entityType: 'Technology',
    description: 'Webpack bundler',
  },
  vite: {
    canonical: 'vite',
    aliases: ['vitejs'],
    category: 'build-tool',
    entityType: 'Technology',
    description: 'Vite build tool',
  },
  esbuild: {
    canonical: 'esbuild',
    aliases: [],
    category: 'build-tool',
    entityType: 'Technology',
    description: 'esbuild bundler',
  },
  turbopack: {
    canonical: 'turbopack',
    aliases: [],
    category: 'build-tool',
    entityType: 'Technology',
    description: 'Turbopack bundler',
  },
  bun: {
    canonical: 'bun',
    aliases: ['bunjs'],
    category: 'build-tool',
    entityType: 'Technology',
    description: 'Bun runtime',
  },
};

// =============================================================================
// PATTERN REGISTRY
// =============================================================================

const PATTERNS: Record<string, PatternEntry> = {
  'cursor-pagination': {
    canonical: 'cursor-pagination',
    variants: ['cursor pagination', 'cursor_pagination'],
    category: 'pagination-pattern',
    entityType: 'Pattern',
    description: 'Cursor-based pagination pattern',
  },
  'offset-pagination': {
    canonical: 'offset-pagination',
    variants: ['offset pagination', 'offset_pagination'],
    category: 'pagination-pattern',
    entityType: 'Pattern',
    description: 'Offset-based pagination pattern',
  },
  'keyset-pagination': {
    canonical: 'keyset-pagination',
    variants: ['keyset pagination', 'keyset_pagination'],
    category: 'pagination-pattern',
    entityType: 'Pattern',
    description: 'Keyset-based pagination pattern',
  },
  'repository-pattern': {
    canonical: 'repository-pattern',
    variants: ['repository pattern', 'repository_pattern'],
    category: 'architecture-pattern',
    entityType: 'Pattern',
    description: 'Repository design pattern',
  },
  'service-layer': {
    canonical: 'service-layer',
    variants: ['service layer', 'service_layer'],
    category: 'architecture-pattern',
    entityType: 'Pattern',
    description: 'Service layer pattern',
  },
  'clean-architecture': {
    canonical: 'clean-architecture',
    variants: ['clean architecture', 'clean_architecture'],
    category: 'architecture-pattern',
    entityType: 'Pattern',
    description: 'Clean architecture pattern',
  },
  'dependency-injection': {
    canonical: 'dependency-injection',
    variants: ['dependency injection', 'di', 'dependency_injection'],
    category: 'architecture-pattern',
    entityType: 'Pattern',
    description: 'Dependency injection pattern',
  },
  'event-sourcing': {
    canonical: 'event-sourcing',
    variants: ['event sourcing', 'event_sourcing'],
    category: 'architecture-pattern',
    entityType: 'Pattern',
    description: 'Event sourcing pattern',
  },
  'cqrs': {
    canonical: 'cqrs',
    variants: ['command-query-responsibility-segregation'],
    category: 'architecture-pattern',
    entityType: 'Pattern',
    description: 'CQRS pattern',
  },
  'saga-pattern': {
    canonical: 'saga-pattern',
    variants: ['saga pattern', 'saga_pattern', 'saga'],
    category: 'workflow-pattern',
    entityType: 'Pattern',
    description: 'Saga pattern for distributed transactions',
  },
  'circuit-breaker': {
    canonical: 'circuit-breaker',
    variants: ['circuit breaker', 'circuit_breaker'],
    category: 'architecture-pattern',
    entityType: 'Pattern',
    description: 'Circuit breaker pattern',
  },
  'rate-limiting': {
    canonical: 'rate-limiting',
    variants: ['rate limiting', 'rate_limiting', 'throttling'],
    category: 'api-pattern',
    entityType: 'Pattern',
    description: 'Rate limiting pattern',
  },
  'retry-pattern': {
    canonical: 'retry-pattern',
    variants: ['retry pattern', 'retry_pattern', 'retry'],
    category: 'architecture-pattern',
    entityType: 'Pattern',
    description: 'Retry pattern',
  },
  'cache-aside': {
    canonical: 'cache-aside',
    variants: ['cache aside', 'cache_aside', 'lazy-loading'],
    category: 'caching-pattern',
    entityType: 'Pattern',
    description: 'Cache-aside pattern',
  },
  'write-through': {
    canonical: 'write-through',
    variants: ['write through', 'write_through'],
    category: 'caching-pattern',
    entityType: 'Pattern',
    description: 'Write-through cache pattern',
  },
  'read-through': {
    canonical: 'read-through',
    variants: ['read through', 'read_through'],
    category: 'caching-pattern',
    entityType: 'Pattern',
    description: 'Read-through cache pattern',
  },
  'rag': {
    canonical: 'rag',
    variants: ['retrieval-augmented-generation'],
    category: 'workflow-pattern',
    entityType: 'Pattern',
    description: 'Retrieval-Augmented Generation',
  },
  'semantic-search': {
    canonical: 'semantic-search',
    variants: ['semantic search', 'semantic_search'],
    category: 'workflow-pattern',
    entityType: 'Pattern',
    description: 'Semantic search pattern',
  },
  'vector-search': {
    canonical: 'vector-search',
    variants: ['vector search', 'vector_search'],
    category: 'workflow-pattern',
    entityType: 'Pattern',
    description: 'Vector search pattern',
  },
  'tdd': {
    canonical: 'tdd',
    variants: ['test-driven-development'],
    category: 'workflow-pattern',
    entityType: 'Pattern',
    description: 'Test-Driven Development',
  },
  'bdd': {
    canonical: 'bdd',
    variants: ['behavior-driven-development'],
    category: 'workflow-pattern',
    entityType: 'Pattern',
    description: 'Behavior-Driven Development',
  },
  'ddd': {
    canonical: 'ddd',
    variants: ['domain-driven-design'],
    category: 'architecture-pattern',
    entityType: 'Pattern',
    description: 'Domain-Driven Design',
  },
  'microservices': {
    canonical: 'microservices',
    variants: ['micro-services', 'micro_services'],
    category: 'architecture-pattern',
    entityType: 'Pattern',
    description: 'Microservices architecture',
  },
  'monolith': {
    canonical: 'monolith',
    variants: ['monolithic'],
    category: 'architecture-pattern',
    entityType: 'Pattern',
    description: 'Monolithic architecture',
  },
  'serverless': {
    canonical: 'serverless',
    variants: ['faas', 'function-as-a-service'],
    category: 'deployment-pattern',
    entityType: 'Pattern',
    description: 'Serverless architecture',
  },
  'rest': {
    canonical: 'rest',
    variants: ['restful', 'rest-api'],
    category: 'api-pattern',
    entityType: 'Pattern',
    description: 'REST API pattern',
  },
  'graphql': {
    canonical: 'graphql',
    variants: ['graph-ql'],
    category: 'api-pattern',
    entityType: 'Pattern',
    description: 'GraphQL API pattern',
  },
  'grpc': {
    canonical: 'grpc',
    variants: ['g-rpc'],
    category: 'api-pattern',
    entityType: 'Pattern',
    description: 'gRPC protocol',
  },
  'websocket': {
    canonical: 'websocket',
    variants: ['websockets', 'web-socket'],
    category: 'api-pattern',
    entityType: 'Pattern',
    description: 'WebSocket protocol',
  },
  'sse': {
    canonical: 'sse',
    variants: ['server-sent-events'],
    category: 'api-pattern',
    entityType: 'Pattern',
    description: 'Server-Sent Events',
  },
};

// =============================================================================
// TOOLS REGISTRY
// =============================================================================

const TOOLS: Record<string, ToolEntry> = {
  grep: {
    canonical: 'grep',
    aliases: ['ripgrep', 'rg'],
    category: 'cli-tool',
    entityType: 'Tool',
    description: 'Text search utility',
  },
  read: {
    canonical: 'read',
    aliases: [],
    category: 'cli-tool',
    entityType: 'Tool',
    description: 'Claude Code file reader',
  },
  write: {
    canonical: 'write',
    aliases: [],
    category: 'cli-tool',
    entityType: 'Tool',
    description: 'Claude Code file writer',
  },
  edit: {
    canonical: 'edit',
    aliases: [],
    category: 'cli-tool',
    entityType: 'Tool',
    description: 'Claude Code file editor',
  },
  glob: {
    canonical: 'glob',
    aliases: [],
    category: 'cli-tool',
    entityType: 'Tool',
    description: 'Claude Code file finder',
  },
  bash: {
    canonical: 'bash',
    aliases: ['shell', 'sh'],
    category: 'cli-tool',
    entityType: 'Tool',
    description: 'Bash shell',
  },
  task: {
    canonical: 'task',
    aliases: [],
    category: 'cli-tool',
    entityType: 'Tool',
    description: 'Claude Code task management',
  },
  git: {
    canonical: 'git',
    aliases: ['git-cli'],
    category: 'cli-tool',
    entityType: 'Tool',
    description: 'Version control system',
  },
  gh: {
    canonical: 'gh',
    aliases: ['github-cli'],
    category: 'cli-tool',
    entityType: 'Tool',
    description: 'GitHub command line tool',
  },
  npm: {
    canonical: 'npm',
    aliases: ['node-package-manager'],
    category: 'package-manager',
    entityType: 'Tool',
    description: 'Node.js package manager',
  },
  yarn: {
    canonical: 'yarn',
    aliases: [],
    category: 'package-manager',
    entityType: 'Tool',
    description: 'Yarn package manager',
  },
  pnpm: {
    canonical: 'pnpm',
    aliases: [],
    category: 'package-manager',
    entityType: 'Tool',
    description: 'pnpm package manager',
  },
  claude: {
    canonical: 'claude',
    aliases: ['claude-code', 'claude-cli'],
    category: 'cli-tool',
    entityType: 'Tool',
    description: 'Claude Code CLI',
  },
  cursor: {
    canonical: 'cursor',
    aliases: [],
    category: 'cli-tool',
    entityType: 'Tool',
    description: 'Cursor code editor',
  },
  vscode: {
    canonical: 'vscode',
    aliases: ['vs-code', 'visual-studio-code'],
    category: 'cli-tool',
    entityType: 'Tool',
    description: 'Visual Studio Code editor',
  },
  vim: {
    canonical: 'vim',
    aliases: ['vi'],
    category: 'cli-tool',
    entityType: 'Tool',
    description: 'Terminal text editor',
  },
  neovim: {
    canonical: 'neovim',
    aliases: ['nvim', 'neo-vim'],
    category: 'cli-tool',
    entityType: 'Tool',
    description: 'Modern vim fork',
  },
};

// =============================================================================
// REVERSE LOOKUP MAPS
// =============================================================================

/**
 * Build reverse alias → canonical map for efficient lookup
 */
function buildAliasMap(
  registry: Record<string, { canonical: string; aliases: string[] }>
): Map<string, string> {
  const map = new Map<string, string>();

  for (const entry of Object.values(registry)) {
    // Map canonical to itself
    map.set(entry.canonical.toLowerCase(), entry.canonical);

    // Map all aliases to canonical
    for (const alias of entry.aliases) {
      map.set(alias.toLowerCase(), entry.canonical);
    }
  }

  return map;
}

/**
 * Build variant maps for patterns
 */
function buildPatternVariantMap(
  registry: Record<string, PatternEntry>
): Map<string, string> {
  const map = new Map<string, string>();

  for (const entry of Object.values(registry)) {
    // Map canonical
    map.set(entry.canonical.toLowerCase(), entry.canonical);

    // Map all variants
    for (const variant of entry.variants) {
      map.set(variant.toLowerCase(), entry.canonical);
    }
  }

  return map;
}

// Pre-compute reverse maps for O(1) lookup
const TECH_ALIAS_MAP = buildAliasMap(TECHNOLOGIES);
const TOOL_ALIAS_MAP = buildAliasMap(TOOLS);
const PATTERN_VARIANT_MAP = buildPatternVariantMap(PATTERNS);

// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * Get canonical name for a technology
 */
export function getTechnologyCanonical(nameOrAlias: string): string | null {
  const lower = nameOrAlias.toLowerCase();
  return TECH_ALIAS_MAP.get(lower) || null;
}

/**
 * Get canonical name for a pattern
 */
export function getPatternCanonical(nameOrVariant: string): string | null {
  const lower = nameOrVariant.toLowerCase();
  return PATTERN_VARIANT_MAP.get(lower) || null;
}

/**
 * Get canonical name for a tool
 */
export function getToolCanonical(nameOrAlias: string): string | null {
  const lower = nameOrAlias.toLowerCase();
  return TOOL_ALIAS_MAP.get(lower) || null;
}

/**
 * Get category for a technology
 */
export function getTechnologyCategory(
  nameOrAlias: string
): TechnologyCategory | null {
  const canonical = getTechnologyCanonical(nameOrAlias);
  if (!canonical) return null;
  return TECHNOLOGIES[canonical]?.category || null;
}

/**
 * Get category for a pattern
 */
export function getPatternCategory(
  nameOrVariant: string
): PatternEntry['category'] | null {
  const canonical = getPatternCanonical(nameOrVariant);
  if (!canonical) return null;
  return PATTERNS[canonical]?.category || null;
}

/**
 * Infer entity type (Technology, Pattern, or Tool)
 * Checks in order: Technology → Pattern → Tool → null
 */
export function inferEntityType(name: string): EntityType | null {
  const lower = name.toLowerCase();

  // Check if it's a technology
  if (TECH_ALIAS_MAP.has(lower)) {
    return 'Technology';
  }

  // Check if it's a pattern
  if (PATTERN_VARIANT_MAP.has(lower)) {
    return 'Pattern';
  }

  // Check if it's a tool
  if (TOOL_ALIAS_MAP.has(lower)) {
    return 'Tool';
  }

  return null;
}

/**
 * Infer category from any name (technology, pattern, or tool)
 */
export function inferCategory(name: string): TechnologyCategory | PatternEntry['category'] | string {
  // Try technology first
  const techCategory = getTechnologyCategory(name);
  if (techCategory) return techCategory;

  // Try pattern
  const patternCategory = getPatternCategory(name);
  if (patternCategory) return patternCategory;

  // Try tool category mapping
  const toolCanonical = getToolCanonical(name);
  if (toolCanonical) {
    const tool = TOOLS[toolCanonical];
    if (tool) {
      // Map tool categories to broader categories
      if (tool.category === 'cli-tool') return 'backend';
      return tool.category;
    }
  }

  // Default to 'general'
  return 'general';
}

/**
 * Check if a name is a known technology
 */
export function isTechnology(nameOrAlias: string): boolean {
  return getTechnologyCanonical(nameOrAlias) !== null;
}

/**
 * Check if a name is a known pattern
 */
export function isPattern(nameOrVariant: string): boolean {
  return getPatternCanonical(nameOrVariant) !== null;
}

/**
 * Check if a name is a known tool
 */
export function isTool(nameOrAlias: string): boolean {
  return getToolCanonical(nameOrAlias) !== null;
}

/**
 * Get technology aliases for extraction (used in user-intent-detector.ts)
 * Returns { alias: canonical } mapping
 */
export function getTechnologyAliasMap(): Record<string, string> {
  const result: Record<string, string> = {};

  for (const entry of Object.values(TECHNOLOGIES)) {
    // Add canonical → canonical
    result[entry.canonical] = entry.canonical;

    // Add all aliases → canonical
    for (const alias of entry.aliases) {
      result[alias] = entry.canonical;
    }
  }

  return result;
}

/**
 * Get pattern names for extraction (used in user-intent-detector.ts)
 */
export function getPatternsList(): string[] {
  return Object.values(PATTERNS).map((entry) => entry.canonical);
}

/**
 * Get tool names for extraction (used in user-intent-detector.ts)
 */
export function getToolsList(): string[] {
  return Object.values(TOOLS).map((entry) => entry.canonical);
}

/**
 * Get all canonical names for word boundary matching
 */
export function getAllKnownNames(): string[] {
  const names: string[] = [];

  // Add technology names and aliases
  for (const entry of Object.values(TECHNOLOGIES)) {
    names.push(entry.canonical);
    names.push(...entry.aliases);
  }

  // Add pattern names and variants
  for (const entry of Object.values(PATTERNS)) {
    names.push(entry.canonical);
    names.push(...entry.variants);
  }

  // Add tool names and aliases
  for (const entry of Object.values(TOOLS)) {
    names.push(entry.canonical);
    names.push(...entry.aliases);
  }

  return names;
}
