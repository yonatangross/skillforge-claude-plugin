---
description: Curate and add documents to the golden dataset with multi-agent validation
---

# Add to Golden Dataset

Multi-agent curation workflow for adding high-quality documents to the golden dataset.

## Phase 1: Input Collection

Get the URL or file path from user:

```bash
# User provides: /add-golden <url>
# Example: /add-golden https://arxiv.org/abs/2312.xxxxx
```

If no URL provided, ask:
- Source URL (required)
- Content type hint (optional: article, tutorial, documentation, research_paper)
- Additional tags (optional)

## Phase 2: Fetch and Extract

```python
# Sequential - must complete before analysis
Task(
    subagent_type="Explore",
    prompt="""CONTENT EXTRACTION

    Fetch and analyze content from: {url}

    1. Use WebFetch to retrieve the content
    2. Extract document structure:
       - Title
       - Main sections with headings
       - Code blocks (if any)
       - Key technical terms

    3. Detect content type:
       - article (blog post, tech article)
       - tutorial (step-by-step guide)
       - documentation (API docs, reference)
       - research_paper (academic, whitepaper)
       - video_transcript (if from YouTube, etc.)
       - code_repository (GitHub README)

    4. Extract metadata:
       - Author (if available)
       - Publication date
       - Last updated

    Output structured JSON:
    {
        "title": "...",
        "detected_content_type": "article|tutorial|...",
        "sections": [
            {"title": "Section 1", "content": "...", "has_code": true}
        ],
        "metadata": {
            "author": "...",
            "date": "...",
            "word_count": 1234
        },
        "extraction_success": true
    }
    """
)
```

**Wait for extraction to complete before proceeding.**

## Phase 3: Parallel Analysis (4 Agents)

Launch ALL FOUR agents in ONE message:

```python
# PARALLEL - All 4 in ONE message!

# Agent 1: Quality Evaluation
Task(
    subagent_type="code-quality-reviewer",
    prompt="""QUALITY EVALUATION for Golden Dataset

    Content: {extracted_content_preview}
    Source: {url}
    Type: {detected_content_type}

    Score these dimensions (0.0-1.0):

    1. ACCURACY (weight 0.25)
       - Technical correctness of claims
       - Code examples valid and working
       - Information is current/not outdated

    2. COHERENCE (weight 0.20)
       - Logical structure and flow
       - Clear transitions between sections
       - Consistent terminology throughout

    3. DEPTH (weight 0.25)
       - Comprehensive topic coverage
       - Edge cases and caveats mentioned
       - Appropriate level of detail

    4. RELEVANCE (weight 0.30)
       - Alignment with SkillForge domains:
         AI/ML, LangGraph, RAG, FastAPI, React, DevOps
       - Practical applicability
       - Technical value for developers

    Output JSON:
    {
        "accuracy": {"score": 0.X, "rationale": "..."},
        "coherence": {"score": 0.X, "rationale": "..."},
        "depth": {"score": 0.X, "rationale": "..."},
        "relevance": {"score": 0.X, "rationale": "..."},
        "weighted_total": 0.X,
        "recommendation": "include|review|exclude",
        "concerns": ["any specific concerns"]
    }
    """,
    run_in_background=True
)

# Agent 2: Difficulty Classification
Task(
    subagent_type="Explore",
    prompt="""DIFFICULTY CLASSIFICATION

    Analyze retrieval complexity for: {title}
    Sections: {section_titles}
    Content preview: {content_preview}

    Classify difficulty based on:
    1. Technical term density (specialized vocabulary)
    2. Structure complexity (nesting, cross-references)
    3. Abstraction level (concrete examples vs theory)
    4. Multi-hop reasoning required
    5. Domain specificity

    Difficulty Levels:
    - trivial: Direct keyword match, >0.85 expected score
    - easy: Common synonyms, >0.70 expected score
    - medium: Paraphrased intent, >0.55 expected score
    - hard: Multi-hop reasoning, >0.40 expected score
    - adversarial: Edge cases, robustness tests

    Output JSON:
    {
        "difficulty": "trivial|easy|medium|hard|adversarial",
        "expected_retrieval_score": 0.X,
        "factors": {
            "technical_density": "low|medium|high",
            "structure_complexity": "simple|moderate|complex",
            "abstraction_level": "concrete|mixed|abstract"
        },
        "rationale": "..."
    }
    """,
    run_in_background=True
)

# Agent 3: Domain Tagging
Task(
    subagent_type="Explore",
    prompt="""DOMAIN TAGGING

    Extract tags for: {title}
    Content: {content_preview}
    Source: {url}

    Primary domains (select 1-2):
    - ai-ml (LLM, agents, RAG, embeddings, LangGraph)
    - backend (FastAPI, PostgreSQL, APIs, microservices)
    - frontend (React, TypeScript, UI/UX)
    - devops (Docker, K8s, CI/CD, infrastructure)
    - security (auth, OWASP, encryption)
    - databases (SQL, NoSQL, vector DBs, PGVector)
    - testing (pytest, playwright, TDD)

    Secondary tags (select 3-7):
    - Specific technologies mentioned
    - Patterns/concepts covered
    - Use cases addressed

    Output JSON:
    {
        "primary_domains": ["ai-ml"],
        "tags": ["langraph", "agents", "tool-use", "state-management"],
        "confidence": 0.X
    }
    """,
    run_in_background=True
)

# Agent 4: Test Query Generation
Task(
    subagent_type="Explore",
    prompt="""TEST QUERY GENERATION

    Generate retrieval test queries for: {title}
    Document ID: {document_id}
    Sections: {section_titles_with_ids}
    Content: {content_preview}

    Generate 3-5 test queries with varied difficulty:

    Requirements:
    - At least 1 TRIVIAL (exact keyword match)
    - At least 1 EASY (synonyms, common terms)
    - At least 1 MEDIUM (paraphrased intent)
    - Optional: 1 HARD (cross-section reasoning)

    Query format:
    {
        "id": "q-{doc-id}-{num}",
        "query": "Natural language query",
        "difficulty": "trivial|easy|medium|hard",
        "expected_chunks": ["section-id-1", "section-id-2"],
        "min_score": 0.X,
        "modes": ["semantic", "hybrid"],
        "category": "specific|broad",
        "description": "What this query tests"
    }

    Output JSON:
    {
        "queries": [...]
    }
    """,
    run_in_background=True
)
```

**Wait for ALL agents to complete.**

## Phase 4: Validation Checks

```python
# Run validation (can be parallel with aggregation)
Task(
    subagent_type="code-quality-reviewer",
    prompt="""VALIDATION CHECKS

    Validate this document for golden dataset inclusion:

    Document: {document_json}
    Source URL: {url}

    Run these checks:

    1. URL VALIDATION
       - Not a placeholder (no skillforge.dev, example.com)
       - Uses HTTPS (except arxiv.org)
       - Not already in source_url_map.json

    2. SCHEMA VALIDATION
       - Has required fields (id, title, source_url, content_type, sections)
       - ID is kebab-case
       - Sections have id, title, content
       - At least 2 tags

    3. DUPLICATE CHECK
       - Compare title against existing documents
       - Flag if >80% similar to existing

    4. QUALITY GATES
       - Title length 10-200 chars
       - Each section content >50 chars
       - At least 2 sections

    Output JSON:
    {
        "valid": true|false,
        "errors": ["blocking issues"],
        "warnings": ["non-blocking concerns"],
        "duplicate_warning": {
            "possible_duplicate": true|false,
            "similar_to": "doc-id or null",
            "similarity": 0.X
        }
    }
    """
)
```

## Phase 5: Consensus Aggregation

Calculate weighted scores and make recommendation:

```python
# Aggregate results from all agents
quality_score = (
    quality["accuracy"]["score"] * 0.25 +
    quality["coherence"]["score"] * 0.20 +
    quality["depth"]["score"] * 0.25 +
    quality["relevance"]["score"] * 0.30
)

# Decision thresholds
if quality_score >= 0.75 and validation["valid"]:
    decision = "INCLUDE"
elif quality_score >= 0.55:
    decision = "REVIEW"
else:
    decision = "EXCLUDE"
```

## Phase 6: User Approval Gate

Present results to user for approval:

```markdown
## Golden Dataset Curation Results

**Document:** {title}
**URL:** {url}
**Content Type:** {content_type}

### Quality Scores
| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Accuracy | {accuracy} | {rationale} |
| Coherence | {coherence} | {rationale} |
| Depth | {depth} | {rationale} |
| Relevance | {relevance} | {rationale} |
| **Total** | **{weighted_total}** | |

### Classification
- **Difficulty:** {difficulty}
- **Primary Domains:** {domains}
- **Tags:** {tags}

### Generated Queries
{list of queries}

### Validation
- **Status:** {valid/invalid}
- **Errors:** {errors if any}
- **Warnings:** {warnings if any}
- **Duplicate Check:** {result}

### Recommendation: **{INCLUDE/REVIEW/EXCLUDE}**

**Langfuse Trace:** {trace_url}
```

Use AskUserQuestion:
```python
AskUserQuestion(
    questions=[{
        "question": "Add this document to the golden dataset?",
        "header": "Decision",
        "options": [
            {"label": "Approve", "description": "Add document with generated queries"},
            {"label": "Modify", "description": "Edit details before adding"},
            {"label": "Reject", "description": "Do not add to dataset"}
        ],
        "multiSelect": False
    }]
)
```

## Phase 7: Write to Dataset

If approved, update the fixture files:

```python
# 1. Add to documents_expanded.json
document_entry = {
    "id": document_id,
    "title": title,
    "source_url": url,
    "content_type": content_type,
    "bucket": "short" if section_count < 8 else "long",
    "language": "en",
    "tags": tags,
    "sections": sections
}

# 2. Add to source_url_map.json
source_url_map[document_id] = url

# 3. Add queries to queries.json
for query in generated_queries:
    queries.append(query)

# 4. Validate fixture consistency
poetry run python -c "
from backend.tests.smoke.retrieval.fixtures.loader import FixtureLoader
loader = FixtureLoader(use_expanded=True)
loader.validate()
print('✅ Fixture validation passed')
"
```

## Phase 8: Summary

```markdown
## Document Added Successfully

**Document ID:** {document_id}
**Quality Score:** {score}
**Difficulty:** {difficulty}
**Queries Added:** {query_count}

### Files Updated
- `tests/smoke/retrieval/fixtures/documents_expanded.json`
- `tests/smoke/retrieval/fixtures/source_url_map.json`
- `tests/smoke/retrieval/fixtures/queries.json`

### Next Steps
1. Review changes: `git diff tests/smoke/retrieval/fixtures/`
2. Run tests: `poetry run pytest tests/smoke/retrieval/ -v`
3. Commit: `/commit`
4. Backup: `poetry run python scripts/backup_golden_dataset.py backup`

**Langfuse Trace:** {trace_url}
```

---

## Summary

**Total Parallel Agents: 4**
- 1 code-quality-reviewer (quality evaluation)
- 3 Explore agents (difficulty, tagging, query generation)

**Sequential Steps:**
1. Fetch content (must complete first)
2. Parallel analysis (4 agents)
3. Validation checks
4. User approval
5. Write to files

**Quality Gates:**
- Minimum score: 0.55 for review, 0.75 for auto-include
- No placeholder URLs
- No >90% duplicates
- At least 2 tags, 2 sections

**Langfuse Integration:**
- Full trace of curation process
- Individual dimension scores logged
- Decision event captured
