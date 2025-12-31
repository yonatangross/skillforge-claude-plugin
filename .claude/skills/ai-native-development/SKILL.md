---
name: ai-native-development
description: Build AI-first applications with RAG pipelines, embeddings, vector databases, agentic workflows, and LLM integration. Master prompt engineering, function calling, streaming responses, and cost optimization for 2025+ AI development. Includes local LLM inference with Ollama for 93% CI cost reduction.
version: 1.2.0
author: AI Agent Hub
tags: [ai, llm, rag, embeddings, vector-database, agents, langchain, ollama, local-inference, 2025]
---

# AI-Native Development

## Overview

AI-Native Development focuses on building applications where AI is a first-class citizen, not an afterthought. This skill provides comprehensive patterns for integrating LLMs, implementing RAG (Retrieval-Augmented Generation), using vector databases, building agentic workflows, and optimizing AI application performance and cost.

**When to use this skill:**
- Building chatbots, Q&A systems, or conversational interfaces
- Implementing semantic search or recommendation engines
- Creating AI agents that can use tools and take actions
- Integrating LLMs (OpenAI, Anthropic, Ollama local models) into applications
- Building RAG systems for knowledge retrieval
- Optimizing AI costs and latency (93% savings with local models)
- Implementing AI observability and monitoring
- Setting up local LLM inference for CI/CD pipelines

---

## Why AI-Native Development Matters

Traditional software is deterministic; AI-native applications are probabilistic:

- **Context is Everything**: LLMs need relevant context to provide accurate answers
- **RAG Over Fine-Tuning**: Retrieval is cheaper and more flexible than fine-tuning
- **Embeddings Enable Semantic Search**: Move beyond keyword matching to understanding meaning
- **Agentic Workflows**: LLMs can reason, plan, and use tools autonomously
- **Cost Management**: Token usage directly impacts operational costs
- **Observability**: Debugging probabilistic systems requires new approaches
- **Prompt Engineering**: How you ask matters as much as what you ask

---

## Core Concepts

### 1. Embeddings & Vector Search

Embeddings are vector representations of text that capture semantic meaning. Similar concepts have similar vectors.

**Key Capabilities:**
- Convert text to high-dimensional vectors (1536 or 3072 dimensions)
- Measure semantic similarity using cosine similarity
- Find relevant documents through vector search
- Batch process for efficiency

**Detailed Implementation:** See `references/vector-databases.md` for:
- OpenAI embeddings setup and batch processing
- Cosine similarity algorithms
- Chunking strategies (500-1000 tokens with 10-20% overlap)

### 2. Vector Databases

Store and retrieve embeddings efficiently at scale.

**Popular Options:**
- **Pinecone**: Serverless, managed service ($0.096/hour)
- **Chroma**: Open source, self-hosted
- **Weaviate**: Flexible schema, hybrid search
- **Qdrant**: Rust-based, high performance

**Detailed Implementation:** See `references/vector-databases.md` for:
- Complete setup guides for each database
- Upsert, query, update, delete operations
- Metadata filtering and hybrid search
- Cost comparison and best practices

### 3. RAG (Retrieval-Augmented Generation)

RAG combines retrieval systems with LLMs to provide accurate, grounded answers.

**Core Pattern:**
1. Retrieve relevant documents from vector database
2. Construct context from top results
3. Generate answer with LLM using retrieved context

**Advanced Patterns:**
- RAG with citations and source tracking
- Hybrid search (semantic + keyword)
- Multi-query RAG for better recall
- HyDE (Hypothetical Document Embeddings)
- Contextual compression for relevance

**Detailed Implementation:** See `references/rag-patterns.md` for:
- Basic and advanced RAG patterns with full code
- Citation strategies
- Hybrid search with Reciprocal Rank Fusion
- Conversation memory patterns
- Error handling and validation

### 4. Function Calling & Tool Use

Enable LLMs to use external tools and APIs reliably.

**Capabilities:**
- Define tools with JSON schemas
- Execute functions based on LLM decisions
- Handle parallel tool calls
- Stream responses with tool use

**Detailed Implementation:** See `references/function-calling.md` for:
- Tool definition patterns (OpenAI and Anthropic)
- Function calling loops
- Parallel and streaming tool execution
- Input validation with Zod
- Error handling and fallback strategies

### 5. Agentic Workflows

Enable LLMs to reason, plan, and take autonomous actions.

**Patterns:**
- **ReAct**: Reasoning + Acting loop with observations
- **Tree of Thoughts**: Explore multiple reasoning paths
- **Multi-Agent**: Specialized agents collaborating on complex tasks
- **Autonomous Agents**: Self-directed goal achievement

**Detailed Implementation:** See `references/agentic-workflows.md` for:
- Complete ReAct loop implementation
- Tree of Thoughts exploration
- Multi-agent coordinator patterns
- Agent memory management
- Error recovery and safety guards

### 5.1 Multi-Agent Orchestration (Opus 4.5)

Advanced multi-agent patterns leveraging Opus 4.5's extended thinking capabilities.

**When to Use Extended Thinking:**
- Coordinating 3+ specialized agents
- Complex dependency resolution between agent outputs
- Dynamic task allocation based on agent capabilities
- Conflict resolution when agents produce contradictory results

**Orchestrator Pattern:**
```typescript
interface AgentTask {
  id: string;
  type: 'research' | 'code' | 'review' | 'design';
  input: unknown;
  dependencies: string[]; // Task IDs that must complete first
}

interface AgentResult {
  taskId: string;
  output: unknown;
  confidence: number;
  reasoning: string;
}

async function orchestrateAgents(
  goal: string,
  availableAgents: Agent[]
): Promise<AgentResult[]> {
  // Step 1: Use extended thinking to decompose goal into tasks
  const taskPlan = await planTasks(goal, availableAgents);

  // Step 2: Build dependency graph
  const dependencyGraph = buildDependencyGraph(taskPlan.tasks);

  // Step 3: Execute tasks respecting dependencies
  const results: AgentResult[] = [];
  const completed = new Set<string>();

  while (completed.size < taskPlan.tasks.length) {
    // Find tasks with satisfied dependencies
    const ready = taskPlan.tasks.filter(task =>
      !completed.has(task.id) &&
      task.dependencies.every(dep => completed.has(dep))
    );

    // Execute ready tasks in parallel
    const batchResults = await Promise.all(
      ready.map(task => executeAgentTask(task, availableAgents))
    );

    // Validate results - use extended thinking for conflicts
    const validatedResults = await validateAndResolveConflicts(
      batchResults,
      results
    );

    results.push(...validatedResults);
    ready.forEach(task => completed.add(task.id));
  }

  return results;
}
```

**Task Planning with Extended Thinking:**

Based on [Anthropic's Extended Thinking documentation](https://platform.claude.com/docs/en/build-with-claude/extended-thinking):

```typescript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

async function planTasks(
  goal: string,
  agents: Agent[]
): Promise<{ tasks: AgentTask[]; rationale: string }> {
  // Extended thinking requires budget_tokens < max_tokens
  // Minimum budget: 1,024 tokens
  const response = await anthropic.messages.create({
    model: 'claude-opus-4-5-20251101', // Or claude-sonnet-4-5-20250929
    max_tokens: 16000,
    thinking: {
      type: 'enabled',
      budget_tokens: 10000 // Extended thinking for complex planning
    },
    messages: [{
      role: 'user',
      content: `
        Goal: ${goal}

        Available agents and their capabilities:
        ${agents.map(a => `- ${a.name}: ${a.capabilities.join(', ')}`).join('\n')}

        Decompose this goal into tasks. For each task, specify:
        1. Which agent should handle it
        2. What input it needs
        3. Which other tasks it depends on
        4. Expected output format

        Think carefully about:
        - Optimal parallelization opportunities
        - Potential conflicts between agent outputs
        - Information that needs to flow between tasks
      `
    }]
  });

  // Response contains thinking blocks followed by text blocks
  // content: [{ type: 'thinking', thinking: '...' }, { type: 'text', text: '...' }]
  return parseTaskPlan(response);
}
```

**Conflict Resolution:**
```typescript
async function validateAndResolveConflicts(
  newResults: AgentResult[],
  existingResults: AgentResult[]
): Promise<AgentResult[]> {
  // Check for conflicts with existing results
  const conflicts = detectConflicts(newResults, existingResults);

  if (conflicts.length === 0) {
    return newResults;
  }

  // Use extended thinking to resolve conflicts
  const resolution = await anthropic.messages.create({
    model: 'claude-opus-4-5-20251101',
    max_tokens: 8000,
    thinking: {
      type: 'enabled',
      budget_tokens: 5000
    },
    messages: [{
      role: 'user',
      content: `
        The following agent outputs conflict:

        ${conflicts.map(c => `
          Conflict: ${c.description}
          Agent A (${c.agentA.name}): ${JSON.stringify(c.resultA)}
          Agent B (${c.agentB.name}): ${JSON.stringify(c.resultB)}
        `).join('\n\n')}

        Analyze each conflict and determine:
        1. Which output is more likely correct and why
        2. If both have merit, how to synthesize them
        3. What additional verification might be needed
      `
    }]
  });

  return applyResolutions(newResults, resolution);
}
```

**Adaptive Agent Selection:**
```typescript
async function selectOptimalAgent(
  task: AgentTask,
  agents: Agent[],
  context: ExecutionContext
): Promise<Agent> {
  // Score each agent based on:
  // - Capability match
  // - Current load
  // - Historical performance on similar tasks
  // - Cost (model tier)

  const scores = agents.map(agent => ({
    agent,
    score: calculateAgentScore(agent, task, context)
  }));

  // For complex tasks, use Opus; for simple tasks, use Haiku
  const complexity = assessTaskComplexity(task);

  if (complexity > 0.7) {
    // Filter to agents that can use Opus
    const opusCapable = scores.filter(s => s.agent.supportsOpus);
    return opusCapable.sort((a, b) => b.score - a.score)[0].agent;
  }

  return scores.sort((a, b) => b.score - a.score)[0].agent;
}
```

**Agent Communication Protocol:**
```typescript
interface AgentMessage {
  from: string;
  to: string | 'broadcast';
  type: 'request' | 'response' | 'update' | 'conflict';
  payload: unknown;
  timestamp: Date;
}

class AgentCommunicationBus {
  private messages: AgentMessage[] = [];
  private subscribers: Map<string, (msg: AgentMessage) => void> = new Map();

  send(message: AgentMessage): void {
    this.messages.push(message);

    if (message.to === 'broadcast') {
      this.subscribers.forEach(callback => callback(message));
    } else {
      this.subscribers.get(message.to)?.(message);
    }
  }

  subscribe(agentId: string, callback: (msg: AgentMessage) => void): void {
    this.subscribers.set(agentId, callback);
  }

  getHistory(agentId: string): AgentMessage[] {
    return this.messages.filter(
      m => m.from === agentId || m.to === agentId || m.to === 'broadcast'
    );
  }
}
```

### 6. Multi-Agent Synthesis & Aggregation (v1.1.0)

When multiple specialized agents analyze content, synthesize their findings into coherent output.

**Fan-Out/Fan-In Pattern:**
```python
async def multi_agent_analysis(content: str) -> AggregatedInsights:
    """8-agent fan-out with synthesis aggregation."""
    # Fan-out: Run agents in parallel
    agents = [
        tech_comparator, security_auditor, implementation_planner,
        integration_analyst, performance_analyst, code_quality_critic,
        trend_validator, dependency_mapper
    ]

    findings = await asyncio.gather(
        *[agent.analyze(content) for agent in agents],
        return_exceptions=True  # Don't fail all if one fails
    )

    # Filter successful results with confidence scores
    valid_findings = [
        f for f in findings
        if not isinstance(f, Exception) and f.confidence > 0.5
    ]

    # Fan-in: Synthesize into coherent artifact
    return await synthesize_findings(valid_findings)
```

**Confidence Score Handling:**
```python
def resolve_conflicts(findings: list[AgentFinding]) -> dict:
    """When agents disagree, prioritize by confidence."""
    conflicts = detect_contradictions(findings)

    for conflict in conflicts:
        # Higher confidence wins
        winner = max(conflict.agents, key=lambda a: a.confidence)
        record_resolution(
            conflict=conflict.description,
            resolution=winner.recommendation,
            priority_agent=winner.agent_type,
            reasoning=f"Confidence {winner.confidence:.2f} > others"
        )
```

**Detailed Implementation:** See SkillForge's `synthesis.py` for production patterns.

### 7. Streaming Responses

Deliver real-time AI responses for better UX.

**Capabilities:**
- Stream LLM output token-by-token
- Server-Sent Events (SSE) for web clients
- Streaming with function calls
- Backpressure handling

**Detailed Implementation:** See `../streaming-api-patterns/SKILL.md` for streaming patterns

### 8. LLM-as-Judge Evaluation (v1.1.0)

Use LLMs to evaluate LLM outputs for quality assurance.

**Quality Aspects:**
```python
QUALITY_DIMENSIONS = {
    "relevance": "How relevant is the output to the input?",
    "depth": "How thorough and detailed is the analysis?",
    "coherence": "How well-structured and clear is the content?",
    "accuracy": "Are facts and code snippets correct?",
    "completeness": "Are all required sections present?"
}
```

**Evaluator Pattern:**
```python
from langchain_community.evaluation import load_evaluator

def create_quality_evaluator(aspect: str):
    """Create LLM-as-judge evaluator for a quality aspect."""
    return load_evaluator(
        evaluator=LabeledScoreStringEvalChain,
        criteria={aspect: QUALITY_DIMENSIONS[aspect]},
        llm=ChatOpenAI(model="gpt-4o-mini"),  # Cost-effective judge
        normalize_by=10  # Output 0.0-1.0 scores
    )

async def evaluate_output_quality(
    input_content: str,
    output_content: str
) -> dict[str, float]:
    """Evaluate output across all quality dimensions."""
    scores = {}
    for aspect in QUALITY_DIMENSIONS:
        evaluator = create_quality_evaluator(aspect)
        result = await evaluator.aevaluate_strings(
            input=input_content,
            prediction=output_content
        )
        scores[aspect] = result["score"]
    return scores
```

**Quality Gate Integration:**
```python
QUALITY_THRESHOLD = 0.7  # Minimum acceptable score

async def quality_gate(state: dict) -> dict:
    """Block low-quality outputs with retry capability."""
    scores = await evaluate_output_quality(
        state["input"], state["output"]
    )
    avg_score = sum(scores.values()) / len(scores)

    return {
        "quality_scores": scores,
        "quality_passed": avg_score >= QUALITY_THRESHOLD
    }
```

### 9. Cost Optimization

**Strategies:**
- **Use local models for CI/dev**: Ollama with DeepSeek R1 70B, Qwen 2.5 Coder 32B (93% savings)
- Use smaller models for simple tasks (GPT-3.5 vs GPT-4, Haiku vs Sonnet)
- Implement prompt caching (Anthropic's ephemeral cache, Claude native cache)
- Batch requests when possible
- Set max_tokens to prevent runaway generation
- Monitor usage with alerts
- Use provider factory for automatic cloud/local switching

**Token Counting:**
```typescript
import { encoding_for_model } from 'tiktoken'

function countTokens(text: string, model = 'gpt-4'): number {
  const encoder = encoding_for_model(model)
  const tokens = encoder.encode(text)
  encoder.free()
  return tokens.length
}
```

**Detailed Implementation:** See `references/observability.md` for:
- Cost estimation and budget tracking
- Model selection strategies
- Prompt caching patterns

### 10. Local LLM Inference with Ollama (v1.2.0)

Run LLMs locally for cost reduction, privacy, and offline development.

**When to Use Local Models:**
- CI/CD pipelines (93% cost reduction)
- Development and testing (no API costs)
- Privacy-sensitive data (no data leaves your machine)
- Offline development environments
- High-volume batch processing

**Recommended Models (Apple Silicon M4 Max 256GB):**
| Task | Model | Size | Notes |
|------|-------|------|-------|
| Reasoning | `deepseek-r1:70b` | ~42GB | GPT-4 level reasoning |
| Coding | `qwen2.5-coder:32b` | ~35GB | 73.7% Aider benchmark |
| Embeddings | `nomic-embed-text` | ~0.5GB | 768 dims, fast |

**LangChain Ollama Provider (v1.0.1):**
```python
from langchain_ollama import ChatOllama, OllamaEmbeddings

# Chat completion with keep_alive for CI performance
llm = ChatOllama(
    model="deepseek-r1:70b",
    base_url="http://localhost:11434",
    temperature=0.0,
    num_ctx=32768,          # Context window (Apple Silicon can handle large)
    keep_alive="5m",        # CRITICAL: Keep model loaded between calls
)

# Embeddings
embeddings = OllamaEmbeddings(
    model="nomic-embed-text",
    base_url="http://localhost:11434",
)

# Generate embedding
vector = await embeddings.aembed_query("Hello world")  # Single text
vectors = await embeddings.aembed_documents(["text1", "text2"])  # Batch
```

**Tool Calling with Ollama:**
```python
from langchain_core.tools import tool
from pydantic import BaseModel, Field

@tool
def search_documents(query: str) -> str:
    """Search the document database."""
    return f"Found 5 documents for: {query}"

# Bind tools to model
llm_with_tools = llm.bind_tools([search_documents])

# Or with structured output
class CodeAnalysis(BaseModel):
    language: str = Field(description="Programming language")
    complexity: int = Field(ge=1, le=10, description="Complexity score")
    issues: list[str] = Field(description="Identified issues")

structured_llm = llm.with_structured_output(CodeAnalysis)
result = await structured_llm.ainvoke("Analyze this Python code...")
```

**Streaming Responses:**
```python
async def stream_response(prompt: str):
    """Stream tokens as they're generated."""
    async for chunk in llm.astream(prompt):
        if hasattr(chunk, "content"):
            yield chunk.content
```

**Provider Factory Pattern:**
```python
from app.shared.services.llm import get_llm_provider, get_embedding_provider

# Automatically uses Ollama if OLLAMA_ENABLED=true, else cloud API
llm = get_llm_provider(task_type="reasoning")  # deepseek-r1:70b or Gemini
llm = get_llm_provider(task_type="coding")     # qwen2.5-coder:32b or Claude
embedder = get_embedding_provider()             # nomic-embed-text or OpenAI

# Check availability
from app.shared.services.llm import is_ollama_available, get_available_ollama_models
if is_ollama_available():
    models = get_available_ollama_models()
```

**Environment Configuration:**
```bash
# Enable Ollama for local inference
export OLLAMA_ENABLED=true
export OLLAMA_HOST=http://localhost:11434
export OLLAMA_MODEL_REASONING=deepseek-r1:70b
export OLLAMA_MODEL_CODING=qwen2.5-coder:32b
export OLLAMA_MODEL_EMBED=nomic-embed-text

# Performance tuning for M4 Max
export OLLAMA_MAX_LOADED_MODELS=3    # Keep 3 models in memory
export OLLAMA_KEEP_ALIVE=5m          # 5 minute keep-alive
```

**CI Integration (GitHub Actions):**
```yaml
# .github/workflows/evaluation.yml
jobs:
  evaluate:
    runs-on: self-hosted  # M4 Max 256GB runner
    env:
      OLLAMA_ENABLED: "true"
      OLLAMA_HOST: "http://localhost:11434"
      OLLAMA_MODEL_REASONING: "deepseek-r1:70b"
      OLLAMA_MODEL_CODING: "qwen2.5-coder:32b"
      OLLAMA_MODEL_EMBED: "nomic-embed-text"
    steps:
      - name: Ensure Ollama models ready
        run: |
          # Pre-warm embedding model for faster first call
          curl -s http://localhost:11434/api/embeddings \
            -d '{"model":"nomic-embed-text","prompt":"warmup"}' > /dev/null
```

**Cost Comparison:**
| Provider | Monthly Cost | Latency | Privacy |
|----------|-------------|---------|---------|
| Cloud APIs | ~₪675/month | 200-500ms | ❌ |
| Ollama Local | ~₪50/month (electricity) | 50-200ms | ✅ |
| **Savings** | **93%** | **2-3x faster** | **Full control** |

**Best Practices:**
- ✅ Use `keep_alive="5m"` in CI to avoid cold starts
- ✅ Pre-warm models before first call in CI
- ✅ Set `num_ctx=32768` on Apple Silicon (plenty of memory)
- ✅ Use factory pattern for cloud/local switching
- ✅ Run 3 models simultaneously on M4 Max 256GB
- ❌ Don't use `keep_alive=-1` (keeps model forever, wastes memory)
- ❌ Don't skip pre-warming in CI (cold start adds 30-60s)

**Detailed Implementation:** See SkillForge's `backend/app/shared/services/llm/` for production patterns.

---

### 8. Observability & Monitoring

Track LLM performance, costs, and quality in production.

**Tools:**
- **Langfuse**: Open-source LLM observability, tracing, evaluation, monitoring
- **Custom Logging**: Structured logs with metrics

**Key Metrics:**
- Throughput (requests/minute)
- Latency (P50, P95, P99)
- Token usage and cost
- Error rate
- Quality scores (relevance, coherence, factuality)

**Detailed Implementation:** See `references/observability.md` for:
- Langfuse integration (self-hosted LLM observability)
- Custom logger implementation
- Performance monitoring
- Quality evaluation
- Debugging and error analysis

---

## Searching References

This skill includes detailed reference material. Use grep to find specific patterns:

```bash
# Find RAG patterns
grep -r "RAG" references/

# Search for specific vector database
grep -A 10 "Pinecone Setup" references/vector-databases.md

# Find agentic workflow examples
grep -B 5 "ReAct Pattern" references/agentic-workflows.md

# Locate function calling patterns
grep -n "parallel.*tool" references/function-calling.md

# Search for cost optimization
grep -i "cost\|pricing\|budget" references/observability.md

# Find all code examples for embeddings
grep -A 20 "async function.*embedding" references/
```

---

## Best Practices

### Context Management
- ✅ Keep context windows under 75% of model limit
- ✅ Use sliding window for long conversations
- ✅ Summarize old messages before they scroll out
- ✅ Remove redundant or irrelevant context

### Embedding Strategy
- ✅ Chunk documents to 500-1000 tokens
- ✅ Overlap chunks by 10-20% for continuity
- ✅ Include metadata (title, source, date) with chunks
- ✅ Re-embed when source data changes

### RAG Quality
- ✅ Use hybrid search (semantic + keyword)
- ✅ Re-rank results for relevance
- ✅ Include citation/source in context
- ✅ Set temperature low (0.1-0.3) for factual answers
- ✅ Validate answers against retrieved context

### Function Calling
- ✅ Provide clear, concise function descriptions
- ✅ Use strict JSON schema for parameters
- ✅ Handle missing or invalid parameters gracefully
- ✅ Limit to 10-20 tools to avoid confusion
- ✅ Validate function outputs before returning to LLM

### Cost Optimization
- ✅ Use smaller models for simple tasks
- ✅ Implement prompt caching for repeated content
- ✅ Batch requests when possible
- ✅ Set max_tokens to prevent runaway generation
- ✅ Monitor usage with alerts for anomalies

### Security
- ✅ Validate and sanitize user inputs
- ✅ Never include secrets in prompts
- ✅ Implement rate limiting
- ✅ Filter outputs for harmful content
- ✅ Use separate API keys per environment

---

## Templates

Use the provided templates for common AI patterns:

- **`templates/rag-pipeline.ts`** - Basic RAG implementation
- **`templates/agentic-workflow.ts`** - ReAct agent pattern

---

## Examples

### Complete RAG Chatbot

See `examples/chatbot-with-rag/` for a full-stack implementation:
- Vector database setup with document ingestion
- RAG query with citations
- Streaming chat interface
- Cost tracking and monitoring

---

## Checklists

### AI Implementation Checklist

See `checklists/ai-implementation.md` for comprehensive validation covering:
- [ ] Vector database setup and configuration
- [ ] Embedding generation and chunking strategy
- [ ] RAG pipeline with quality validation
- [ ] Function calling with error handling
- [ ] Streaming response implementation
- [ ] Cost monitoring and budget alerts
- [ ] Observability and logging
- [ ] Security and input validation

---

## Common Patterns

### Semantic Caching

Reduce costs by caching similar queries:

```typescript
const cache = new Map<string, { embedding: number[]; response: string }>()

async function cachedRAG(query: string) {
  const queryEmbedding = await createEmbedding(query)

  // Check if similar query exists in cache
  for (const [cachedQuery, cached] of cache.entries()) {
    const similarity = cosineSimilarity(queryEmbedding, cached.embedding)
    if (similarity > 0.95) {
      return cached.response
    }
  }

  // Not cached, perform RAG
  const response = await ragQuery(query)
  cache.set(query, { embedding: queryEmbedding, response })
  return response
}
```

### Conversational Memory

Maintain context across multiple turns:

```typescript
interface ConversationMemory {
  messages: Message[] // Last 10 messages
  summary?: string // Summary of older messages
}

async function getConversationContext(userId: string): Promise<Message[]> {
  const memory = await db.memory.findUnique({ where: { userId } })

  return [
    { role: 'system', content: `Previous conversation summary: ${memory.summary}` },
    ...memory.messages.slice(-5) // Last 5 messages
  ]
}
```

---

## Prompt Engineering

### Few-Shot Learning

Provide examples to guide LLM behavior:

```typescript
const fewShotExamples = `
Example 1:
Input: "I love this product!"
Sentiment: Positive

Example 2:
Input: "It's okay, nothing special"
Sentiment: Neutral
`

// Include in system prompt
```

### Chain of Thought (CoT)

Ask LLM to show reasoning:

```typescript
const prompt = `${problem}\n\nLet's think step by step:`
```

---

## Resources

- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Anthropic Claude API](https://docs.anthropic.com)
- [LangChain Documentation](https://python.langchain.com/docs/)
- [LangChain-Ollama](https://python.langchain.com/docs/integrations/chat/ollama/) - ChatOllama, OllamaEmbeddings
- [Ollama Documentation](https://ollama.ai/docs) - Local LLM inference
- [Ollama Model Library](https://ollama.ai/library) - Available models
- [Pinecone Documentation](https://docs.pinecone.io/)
- [Chroma Documentation](https://docs.trychroma.com/)
- [Langfuse Observability](https://langfuse.com/docs)

---

## Next Steps

After mastering AI-Native Development:
1. Explore **Streaming API Patterns** skill for real-time AI responses
2. Use **Type Safety & Validation** skill for AI input/output validation
3. Apply **Edge Computing Patterns** skill for global AI deployment
4. Reference **Observability Patterns** for production monitoring
