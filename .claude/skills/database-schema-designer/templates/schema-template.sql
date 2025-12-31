-- Database Schema Template
-- PostgreSQL with PGVector extension
-- Includes: table creation, constraints, indexes, triggers

-- ============================================================================
-- EXTENSIONS
-- ============================================================================

-- Enable UUID support
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable PGVector for embedding storage
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================================
-- ENUMS (Optional: Use CHECK constraints for simplicity)
-- ============================================================================

-- Option 1: Enum type (more strict, harder to change)
CREATE TYPE content_type_enum AS ENUM ('article', 'video', 'repo', 'tutorial');

-- Option 2: CHECK constraint (more flexible, easier to change)
-- See examples below

-- ============================================================================
-- TABLES
-- ============================================================================

-- Example: Parent table with common patterns
CREATE TABLE analyses (
    -- Primary key (UUID recommended for distributed systems)
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Required fields
    url TEXT NOT NULL,
    content_type VARCHAR(50) NOT NULL CHECK (content_type IN ('article', 'video', 'repo', 'tutorial')),
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'complete', 'failed')),

    -- Optional fields
    title TEXT,
    raw_content TEXT,

    -- JSON metadata (flexible schema)
    extraction_metadata JSONB,

    -- Vector embeddings (PGVector)
    content_embedding VECTOR(1536),  -- OpenAI text-embedding-3-small

    -- Full-text search vector (auto-populated by trigger)
    search_vector TSVECTOR,

    -- Timestamps (always include these!)
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Example: Child table with foreign key
CREATE TABLE artifacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Foreign key with cascade delete
    analysis_id UUID NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,

    -- Required fields
    markdown_content TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),

    -- Optional fields
    artifact_metadata JSONB,
    trace_id VARCHAR(255),

    -- Counters (denormalized for performance)
    download_count INTEGER NOT NULL DEFAULT 0 CHECK (download_count >= 0),

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Example: Chunked embeddings with rich metadata
CREATE TABLE analysis_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Foreign key
    analysis_id UUID NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,

    -- Chunking metadata
    granularity VARCHAR(20) NOT NULL CHECK (granularity IN ('coarse', 'fine', 'summary')),
    path JSONB NOT NULL,  -- Hierarchical path: ["section", "subsection", "chunk"]
    section_title TEXT,
    chunk_idx INTEGER NOT NULL CHECK (chunk_idx >= 0),
    chunk_total INTEGER NOT NULL CHECK (chunk_total > 0),

    -- Content metadata
    content_type VARCHAR(50),  -- Denormalized for filtering
    language VARCHAR(20),

    -- Deduplication
    hash VARCHAR(128) NOT NULL,

    -- Embedding metadata
    model VARCHAR(100),
    model_version VARCHAR(50),

    -- Content preview
    snippet TEXT,

    -- Vector embedding
    vector VECTOR(1536) NOT NULL,

    -- Full-text search vector (auto-populated by trigger)
    content_tsvector TSVECTOR,

    -- Telemetry fields
    token_count INTEGER,
    embedding_latency_ms FLOAT,
    was_truncated BOOLEAN DEFAULT FALSE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    -- Table-level constraints
    CONSTRAINT chk_chunk_idx_lt_total CHECK (chunk_idx < chunk_total)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- B-Tree indexes (default, for equality/range queries)
CREATE INDEX idx_analyses_url ON analyses(url);
CREATE INDEX idx_analyses_status ON analyses(status);
CREATE INDEX idx_artifacts_analysis_id ON artifacts(analysis_id);
CREATE INDEX idx_chunks_analysis_id ON analysis_chunks(analysis_id);
CREATE INDEX idx_chunks_hash ON analysis_chunks(hash);

-- Composite indexes (order matters! High selectivity first)
CREATE INDEX idx_chunks_analysis_granularity ON analysis_chunks(analysis_id, granularity);
CREATE INDEX idx_chunks_hash_model ON analysis_chunks(hash, model, model_version);

-- GIN indexes (for full-text search, JSONB, arrays)
CREATE INDEX idx_analyses_search_vector ON analyses USING GIN(search_vector);
CREATE INDEX idx_chunks_content_tsvector ON analysis_chunks USING GIN(content_tsvector);
CREATE INDEX idx_artifacts_metadata_gin ON artifacts USING GIN(artifact_metadata);

-- HNSW indexes (for vector similarity search)
CREATE INDEX idx_analyses_embedding_hnsw
ON analyses
USING hnsw (content_embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

CREATE INDEX idx_chunks_vector_hnsw
ON analysis_chunks
USING hnsw (vector vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Partial indexes (for frequently filtered queries)
CREATE INDEX idx_analyses_completed
ON analyses(created_at DESC)
WHERE status = 'complete';

CREATE INDEX idx_chunks_content_type_created
ON analysis_chunks(content_type, created_at DESC)
WHERE content_type IS NOT NULL;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Reusable trigger function: Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables with updated_at
CREATE TRIGGER update_analyses_updated_at
BEFORE UPDATE ON analyses
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chunks_updated_at
BEFORE UPDATE ON analysis_chunks
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger function: Auto-update full-text search vector (analyses)
CREATE OR REPLACE FUNCTION analyses_search_vector_update() RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.url, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.raw_content, '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER analyses_search_vector_trigger
BEFORE INSERT OR UPDATE OF title, url, raw_content ON analyses
FOR EACH ROW EXECUTE FUNCTION analyses_search_vector_update();

-- Trigger function: Auto-update full-text search vector (chunks)
CREATE OR REPLACE FUNCTION chunks_tsvector_update() RETURNS TRIGGER AS $$
BEGIN
    NEW.content_tsvector :=
        setweight(to_tsvector('english', COALESCE(NEW.section_title, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.snippet, '')), 'B');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER chunks_tsvector_trigger
BEFORE INSERT OR UPDATE OF section_title, snippet ON analysis_chunks
FOR EACH ROW EXECUTE FUNCTION chunks_tsvector_update();

-- ============================================================================
-- COMMON QUERY PATTERNS
-- ============================================================================

-- Semantic search (vector similarity)
SELECT id, title, 1 - (content_embedding <=> '[0.1, 0.2, ...]'::vector) AS similarity
FROM analyses
ORDER BY content_embedding <=> '[0.1, 0.2, ...]'::vector
LIMIT 10;

-- Full-text search (keyword)
SELECT id, title, ts_rank_cd(search_vector, query) AS rank
FROM analyses, to_tsquery('english', 'machine & learning') AS query
WHERE search_vector @@ query
ORDER BY rank DESC
LIMIT 10;

-- Hybrid search (semantic + keyword with RRF fusion)
WITH semantic AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY vector <=> '[...]'::vector) AS rank
    FROM analysis_chunks
    WHERE analysis_id = :analysis_id
    LIMIT 20
),
keyword AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY ts_rank_cd(content_tsvector, query) DESC) AS rank
    FROM analysis_chunks, to_tsquery('english', 'machine & learning') AS query
    WHERE analysis_id = :analysis_id AND content_tsvector @@ query
    LIMIT 20
)
SELECT
    COALESCE(s.id, k.id) AS id,
    1.0 / (60 + COALESCE(s.rank, 1000)) + 1.0 / (60 + COALESCE(k.rank, 1000)) AS rrf_score
FROM semantic s
FULL OUTER JOIN keyword k ON s.id = k.id
ORDER BY rrf_score DESC
LIMIT 10;

-- JSONB queries
SELECT * FROM artifacts
WHERE artifact_metadata @> '{"topics": ["RAG"]}'::jsonb;

SELECT artifact_metadata->>'complexity' AS complexity
FROM artifacts
WHERE artifact_metadata ? 'complexity';

-- Hierarchical queries (chunks by analysis)
SELECT section_title, COUNT(*) AS chunk_count
FROM analysis_chunks
WHERE analysis_id = :analysis_id
GROUP BY section_title
ORDER BY MIN(chunk_idx);

-- ============================================================================
-- COMMON COLUMN TYPES
-- ============================================================================

/*
UUID:               id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
Text (unbounded):   content TEXT
Varchar (bounded):  status VARCHAR(50)
Integer:            download_count INTEGER DEFAULT 0
Float:              confidence_score FLOAT
Boolean:            was_truncated BOOLEAN DEFAULT FALSE
JSONB:              metadata JSONB
Timestamp:          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
Vector:             embedding VECTOR(1536)
TSVector:           search_vector TSVECTOR
Enum (via CHECK):   status VARCHAR(50) CHECK (status IN ('pending', 'complete'))
Array:              tags TEXT[]
*/

-- ============================================================================
-- CONSTRAINTS REFERENCE
-- ============================================================================

/*
PRIMARY KEY:        id UUID PRIMARY KEY
FOREIGN KEY:        analysis_id UUID REFERENCES analyses(id) ON DELETE CASCADE
UNIQUE:             UNIQUE (email)
NOT NULL:           url TEXT NOT NULL
DEFAULT:            created_at TIMESTAMP DEFAULT NOW()
CHECK:              status CHECK (status IN ('pending', 'complete'))
                    chunk_idx CHECK (chunk_idx >= 0)
                    chunk_idx CHECK (chunk_idx < chunk_total)  -- Multi-column check
*/

-- ============================================================================
-- NOTES
-- ============================================================================

/*
1. Always use TIMESTAMP WITH TIME ZONE (not TIMESTAMP)
2. Always index foreign keys for join performance
3. Use CHECK constraints for enums (more flexible than ENUM types)
4. Use JSONB (not JSON) for better performance and indexing
5. Use CASCADE deletes for true parent-child relationships
6. Use triggers for auto-computed fields (updated_at, search_vector)
7. Use VECTOR type for embeddings (requires pgvector extension)
8. Use HNSW indexes for vector similarity search
9. Use GIN indexes for full-text search and JSONB
10. Use partial indexes for frequently filtered queries
*/
