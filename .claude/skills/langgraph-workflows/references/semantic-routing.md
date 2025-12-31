# Semantic Routing in LangGraph

## Overview

**Problem:** Rule-based routing (regex, keywords) mismatches with LLM supervisor decisions.

**Solution:** Use embeddings for semantic similarity + optional LLM refinement.

```
┌─────────────────────────────────────────────────────────────────────┐
│                     Semantic vs Rule-Based Routing                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   RULE-BASED (Current)           SEMANTIC (Target)                  │
│   ────────────────────           ─────────────────                  │
│   if "security" in text:         embeddings = embed(text)           │
│       route_to("security")       similarities = cosine(embeddings,  │
│   elif "compare" in text:                        agent_embeddings)  │
│       route_to("comparator")     selected = topK(similarities)      │
│                                                                      │
│   Problems:                      Benefits:                          │
│   • Misses synonyms              • Understands intent               │
│   • "authentication" ≠ security  • "auth" → security agent          │
│   • Conflicts with LLM routing   • Matches semantic meaning         │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## The Routing Mismatch Problem

In SkillForge, we have **two routing mechanisms that conflict**:

```
┌─────────────────────────────────────────────────────────────────────┐
│                       Current Routing Conflict                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   Content: "How to implement OAuth 2.0 authentication flow"         │
│                                                                      │
│   SUPERVISOR (LLM):                                                 │
│   "This involves security patterns and implementation"              │
│   → Selects: security_auditor, implementation_planner               │
│                                                                      │
│   SIGNAL FILTER (Regex):                                            │
│   should_skip_agent("security_auditor"):                            │
│       patterns = ["CVE", "vulnerability", "exploit"]                │
│       "OAuth authentication" matches NONE                           │
│   → Skips security_auditor!                                         │
│                                                                      │
│   RESULT: Conflict! LLM selects, regex skips                        │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Solution: Hybrid Semantic Routing

### Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Hybrid Semantic Routing                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   Content ──▶ [Embedding]                                           │
│                    │                                                 │
│                    ▼                                                 │
│              ┌──────────────┐                                       │
│              │ Agent        │                                       │
│              │ Embeddings   │ (pre-computed capability descriptions)│
│              └──────────────┘                                       │
│                    │                                                 │
│                    ▼                                                 │
│              [Cosine Similarity]                                    │
│                    │                                                 │
│                    ▼                                                 │
│   ┌────────────────────────────────────┐                            │
│   │ Semantic Pre-Filter                 │                            │
│   │ security_auditor:   0.89 ✓         │ threshold > 0.7            │
│   │ implementation:     0.82 ✓         │                            │
│   │ tech_comparator:    0.45 ✗         │                            │
│   │ learning_synth:     0.38 ✗         │                            │
│   └────────────────────────────────────┘                            │
│                    │                                                 │
│                    ▼                                                 │
│              [LLM Refinement] (optional)                            │
│                    │                                                 │
│                    ▼                                                 │
│              Final Selection: [security_auditor, implementation]    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Implementation

```python
# backend/app/domains/analysis/routing/semantic_router.py

from dataclasses import dataclass
from typing import List, Optional
import numpy as np

from app.shared.services.embeddings.service import EmbeddingService

@dataclass
class AgentCapability:
    """Agent capability for semantic matching."""
    agent_type: str
    description: str
    embedding: Optional[np.ndarray] = None

# Pre-defined agent capabilities
AGENT_CAPABILITIES = {
    "security_auditor": AgentCapability(
        agent_type="security_auditor",
        description="""
        Security analysis: authentication, authorization, OAuth, JWT,
        vulnerabilities, CVE, OWASP, encryption, secrets management,
        secure coding practices, access control, session management
        """
    ),
    "implementation_planner": AgentCapability(
        agent_type="implementation_planner",
        description="""
        Implementation guidance: code architecture, design patterns,
        step-by-step implementation, code examples, API integration,
        library usage, configuration, setup instructions
        """
    ),
    "tech_comparator": AgentCapability(
        agent_type="tech_comparator",
        description="""
        Technology comparison: frameworks, libraries, tools,
        trade-offs, performance benchmarks, feature comparison,
        pros and cons, migration considerations
        """
    ),
    # ... other agents
}


class SemanticRouter:
    """Semantic routing for multi-agent selection."""

    def __init__(
        self,
        embedding_service: EmbeddingService,
        similarity_threshold: float = 0.7,
        max_agents: int = 4,
    ):
        self.embedding_service = embedding_service
        self.similarity_threshold = similarity_threshold
        self.max_agents = max_agents
        self._agent_embeddings: dict[str, np.ndarray] = {}

    async def initialize(self):
        """Pre-compute agent capability embeddings."""
        for agent_type, capability in AGENT_CAPABILITIES.items():
            embedding = await self.embedding_service.embed(
                capability.description
            )
            self._agent_embeddings[agent_type] = np.array(embedding)

    async def route(
        self,
        content: str,
        context: Optional[str] = None,
    ) -> List[str]:
        """
        Route content to relevant agents using semantic similarity.

        Args:
            content: The content to analyze
            context: Optional context (title, URL, etc.)

        Returns:
            List of agent types sorted by relevance
        """
        # Combine content and context for better routing
        routing_text = f"{context or ''}\n\n{content[:2000]}"

        # Get content embedding
        content_embedding = await self.embedding_service.embed(routing_text)
        content_vec = np.array(content_embedding)

        # Calculate similarities
        similarities = {}
        for agent_type, agent_vec in self._agent_embeddings.items():
            similarity = self._cosine_similarity(content_vec, agent_vec)
            similarities[agent_type] = similarity

        # Filter by threshold and sort
        selected = [
            agent_type
            for agent_type, sim in sorted(
                similarities.items(),
                key=lambda x: x[1],
                reverse=True
            )
            if sim >= self.similarity_threshold
        ][:self.max_agents]

        return selected

    @staticmethod
    def _cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
        """Calculate cosine similarity between vectors."""
        return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))
```

### Integration with Supervisor

```python
# backend/app/domains/analysis/workflows/nodes/supervisor.py

class SupervisorNode:
    """Supervisor with semantic routing integration."""

    def __init__(
        self,
        semantic_router: SemanticRouter,
        llm_refinement: bool = True,
    ):
        self.semantic_router = semantic_router
        self.llm_refinement = llm_refinement

    async def select_agents(
        self,
        state: AnalysisState,
    ) -> List[str]:
        """Select agents using semantic routing + optional LLM refinement."""

        # Step 1: Semantic pre-filter
        candidates = await self.semantic_router.route(
            content=state["raw_content"],
            context=state.get("title"),
        )

        # Step 2: LLM refinement (optional)
        if self.llm_refinement and candidates:
            refined = await self._llm_refine_selection(
                content=state["raw_content"],
                candidates=candidates,
            )
            return refined

        return candidates

    async def _llm_refine_selection(
        self,
        content: str,
        candidates: List[str],
    ) -> List[str]:
        """Use LLM to refine agent selection from candidates."""

        prompt = f"""Given this content and candidate agents, select the most relevant ones.

Content (first 500 chars): {content[:500]}

Candidate agents: {', '.join(candidates)}

Select 1-4 agents that would provide the most value. Return as JSON array.
"""

        response = await self.llm.complete(
            prompt,
            response_format={"type": "json_object"},
        )

        return response.get("selected_agents", candidates[:2])
```

## Removing Regex-Based Signal Filtering

**Current problematic code to remove:**

```python
# REMOVE THIS: backend/app/shared/workflows/utils/content_signals.py

def should_skip_agent(agent_type: str, content: str) -> bool:
    """
    DEPRECATED: This causes routing conflicts with semantic routing.

    This function uses regex patterns that don't match semantic meaning:
    - "authentication" doesn't match security patterns
    - "API design" doesn't match implementation patterns

    Replace with semantic routing in supervisor node.
    """
    # OLD CODE TO REMOVE:
    patterns = AGENT_SKIP_PATTERNS.get(agent_type, [])
    for pattern in patterns:
        if re.search(pattern, content, re.IGNORECASE):
            return False  # Don't skip if pattern matches
    return True  # Skip if no patterns match
```

**Migration path:**

1. Remove `should_skip_agent()` calls from agent execution
2. Use `SemanticRouter.route()` in supervisor instead
3. Trust supervisor's semantic selection

## Cost Analysis

Using OpenAI text-embedding-3-small:
- Cost: $0.02 per 1M tokens
- Per routing decision: ~500 tokens = $0.00001
- Per analysis: ~$0.00003 (negligible)

**Comparison:**
- LLM routing: $0.001-0.01 per decision
- Semantic routing: $0.00001 per decision
- **100x cheaper than pure LLM routing**

## Best Practices

### 1. Pre-compute Agent Embeddings

```python
# Compute once at startup, not per request
async def startup():
    await semantic_router.initialize()
```

### 2. Use Descriptive Capability Texts

```python
# BAD: Too short
description = "Security analysis"

# GOOD: Rich capability description
description = """
Security analysis including: authentication patterns (OAuth, JWT, SAML),
authorization frameworks, vulnerability assessment, OWASP Top 10,
secure coding practices, secrets management, encryption standards
"""
```

### 3. Tune Threshold Based on Content

```python
# For technical content: higher threshold (more specific)
threshold = 0.75

# For general content: lower threshold (broader coverage)
threshold = 0.65
```

### 4. Combine with LLM for Edge Cases

```python
# If semantic confidence is low, use LLM to decide
if max_similarity < 0.6:
    selected = await llm_select_agents(content, all_agents)
else:
    selected = semantic_selection
```

## Testing Semantic Routing

```python
# tests/unit/routing/test_semantic_router.py

@pytest.mark.asyncio
async def test_oauth_routes_to_security():
    """OAuth content should route to security agent."""
    router = SemanticRouter(embedding_service)
    await router.initialize()

    content = "How to implement OAuth 2.0 authentication flow"
    selected = await router.route(content)

    assert "security_auditor" in selected


@pytest.mark.asyncio
async def test_comparison_routes_to_comparator():
    """Comparison content should route to tech comparator."""
    router = SemanticRouter(embedding_service)
    await router.initialize()

    content = "React vs Vue vs Angular: which framework to choose"
    selected = await router.route(content)

    assert "tech_comparator" in selected
```
