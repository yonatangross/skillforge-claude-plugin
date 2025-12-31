---
name: langgraph-workflows
description: Design and implement multi-agent workflows with LangGraph 1.0 - state management, supervisor-worker patterns, conditional routing, and fault-tolerant checkpointing
version: 1.0.0
author: SkillForge AI Agent Hub
tags: [langgraph, workflows, multi-agent, state-management, checkpointing, 2025]
---

# LangGraph Workflows

**Master multi-agent workflow orchestration with LangGraph 1.0+**

## Overview

LangGraph is a library for building stateful, multi-agent workflows as directed graphs. It's the foundation of SkillForge's 8-agent content analysis pipeline.

**When to use this skill:**
- Building multi-step AI workflows with agent coordination
- Implementing supervisor-worker patterns (one agent routes to specialists)
- Creating fault-tolerant workflows with checkpointing
- Managing complex state across multiple LLM calls
- Conditional routing based on workflow state

**When NOT to use this skill:**
- Single-agent tasks (use simple LangChain chains)
- Stateless API calls (no need for graph complexity)
- Simple sequential pipelines (LangChain LCEL is simpler)

---

## Core Concepts

### 1. State Management

LangGraph workflows operate on **shared state** passed between nodes.

**Two State Approaches:**

```python
# Approach 1: TypedDict (simple, type-safe)
from typing import TypedDict, Annotated
from operator import add

class WorkflowState(TypedDict):
    input: str
    output: str
    agent_responses: Annotated[list[dict], add]  # List accumulates
    metadata: dict

# Approach 2: Pydantic (validation, complex logic)
from pydantic import BaseModel, Field

class WorkflowState(BaseModel):
    input: str = Field(description="User input")
    output: str = ""
    agent_responses: list[dict] = Field(default_factory=list)

    def add_response(self, agent: str, result: str):
        self.agent_responses.append({"agent": agent, "result": result})
```

**SkillForge Example:**
```python
class AnalysisState(TypedDict):
    url: str
    raw_content: str

    # Agent outputs (each agent adds to these)
    findings: Annotated[list[Finding], add]
    embeddings: Annotated[list[Embedding], add]

    # Control flow
    current_agent: str
    agents_completed: list[str]
    quality_passed: bool
```

**Key Pattern: `Annotated[list[T], add]`**
- Without `add`: Each node replaces the list
- With `add`: Each node appends to the list
- Critical for multi-agent accumulation!

---

### 2. Supervisor-Worker Pattern

The most common multi-agent pattern: **one supervisor routes to specialized workers**.

```python
from langgraph.graph import StateGraph, END

# Define nodes
def supervisor(state: WorkflowState) -> WorkflowState:
    """Route to next worker based on state."""
    if state["needs_analysis"]:
        state["next"] = "analyzer"
    elif state["needs_validation"]:
        state["next"] = "validator"
    else:
        state["next"] = END
    return state

def analyzer(state: WorkflowState) -> WorkflowState:
    """Specialized analysis worker."""
    result = analyze(state["input"])
    state["results"].append(result)
    return state

# Build graph
workflow = StateGraph(WorkflowState)
workflow.add_node("supervisor", supervisor)
workflow.add_node("analyzer", analyzer)
workflow.add_node("validator", validator)

# Supervisor routes dynamically
workflow.add_conditional_edges(
    "supervisor",
    lambda s: s["next"],  # Route based on state
    {
        "analyzer": "analyzer",
        "validator": "validator",
        END: END
    }
)

# Workers return to supervisor
workflow.add_edge("analyzer", "supervisor")
workflow.add_edge("validator", "supervisor")

workflow.set_entry_point("supervisor")
app = workflow.compile()
```

**SkillForge's Supervisor Pattern:**
```python
# backend/app/workflows/content_analysis_workflow.py
def supervisor_node(state: AnalysisState) -> AnalysisState:
    """Route to next available agent."""
    completed = set(state["agents_completed"])
    available_agents = [a for a in ALL_AGENTS if a not in completed]

    if not available_agents:
        state["next"] = "quality_gate"
    else:
        # Round-robin or priority-based routing
        state["next"] = available_agents[0]

    return state

# 8 specialist agents
for agent_name in ["security", "tech", "implementation", ...]:
    workflow.add_node(agent_name, create_agent_node(agent_name))
    workflow.add_edge(agent_name, "supervisor")  # Return to supervisor
```

**Benefits:**
- Easy to add/remove agents (just modify routing logic)
- Centralized coordination (supervisor sees all state)
- Parallel execution possible (if agents independent)

---

### 3. Conditional Routing

**Conditional edges** let you route dynamically based on state.

```python
def route_based_on_quality(state: WorkflowState) -> str:
    """Decide next step based on quality score."""
    if state["quality_score"] >= 0.8:
        return "publish"
    elif state["retry_count"] < 3:
        return "retry"
    else:
        return "manual_review"

workflow.add_conditional_edges(
    "quality_check",
    route_based_on_quality,
    {
        "publish": "publish_node",
        "retry": "generator",
        "manual_review": "review_queue"
    }
)
```

**SkillForge Example: Quality Gate**
```python
def route_after_quality_gate(state: AnalysisState) -> str:
    """Route based on quality gate result."""
    if state["quality_passed"]:
        return "compress_findings"  # Success path
    elif state["retry_count"] < 2:
        return "supervisor"  # Retry with more agents
    else:
        return END  # Failed, return partial results

workflow.add_conditional_edges(
    "quality_gate",
    route_after_quality_gate,
    {
        "compress_findings": "compress_findings",
        "supervisor": "supervisor",
        END: END
    }
)
```

**Routing Patterns:**
- **Sequential:** `A -> B -> C` (simple edges)
- **Branching:** `A -> (B or C)` (conditional edges)
- **Looping:** `A -> B -> A` (retry logic)
- **Convergence:** `(A or B) -> C` (multiple inputs, one output)

---

### 4. Checkpointing & Persistence

**Problem:** If a workflow crashes mid-execution, you lose all progress.

**Solution:** LangGraph checkpointing saves state after each node.

```python
from langgraph.checkpoint import MemorySaver, SqliteSaver

# In-memory (development)
memory = MemorySaver()
app = workflow.compile(checkpointer=memory)

# Persistent (production) - SQLite
checkpointer = SqliteSaver.from_conn_string("checkpoints.db")
app = workflow.compile(checkpointer=checkpointer)

# Persistent (production) - PostgreSQL
from langgraph.checkpoint.postgres import PostgresSaver
checkpointer = PostgresSaver.from_conn_string("postgresql://...")
app = workflow.compile(checkpointer=checkpointer)
```

**Using Checkpoints:**
```python
# Start new workflow
config = {"configurable": {"thread_id": "analysis-123"}}
result = app.invoke(initial_state, config=config)

# Resume interrupted workflow
config = {"configurable": {"thread_id": "analysis-123"}}
result = app.invoke(None, config=config)  # Resumes from last checkpoint
```

**SkillForge Checkpointing:**
```python
# backend/app/workflows/checkpoints.py
from langgraph.checkpoint.postgres import PostgresSaver

def create_checkpointer():
    """Create PostgreSQL checkpointer for production."""
    return PostgresSaver.from_conn_string(
        settings.DATABASE_URL,
        # Save after each agent completes
        save_every=1
    )

# Compile with checkpointing
app = workflow.compile(
    checkpointer=create_checkpointer(),
    interrupt_before=["quality_gate"]  # Manual review point
)

# Resume after crash
result = app.invoke(
    None,
    config={"configurable": {"thread_id": analysis_id}}
)
```

**Benefits:**
- **Fault tolerance:** Resume after crashes
- **Human-in-the-loop:** Pause for approval (`interrupt_before`)
- **Debugging:** Inspect state at each checkpoint
- **Cost savings:** Don't re-run expensive LLM calls

---

## 5. Integration with Langfuse

**LangGraph + Langfuse = Full Observability**

```python
from langfuse.decorators import observe, langfuse_context
from langfuse import Langfuse

langfuse = Langfuse()

@observe()  # Traces entire workflow
def run_analysis_workflow(url: str):
    """Run LangGraph workflow with Langfuse tracing."""

    # Set trace metadata
    langfuse_context.update_current_trace(
        name="content_analysis",
        metadata={"url": url},
        tags=["langgraph", "multi-agent"]
    )

    # Compile workflow
    app = workflow.compile(checkpointer=checkpointer)

    # Each node is automatically traced as a span
    result = app.invoke({"url": url})

    # Log final metrics
    langfuse_context.update_current_observation(
        output=result,
        metadata={"agents_used": len(result["agents_completed"])}
    )

    return result

# Node-level tracing
@observe(as_type="generation")  # Mark as LLM call
def security_agent_node(state: AnalysisState):
    """Security analysis agent."""
    langfuse_context.update_current_observation(
        name="security_agent",
        input=state["raw_content"][:200]  # First 200 chars
    )

    result = security_agent.analyze(state["raw_content"])

    langfuse_context.update_current_observation(
        output=result,
        usage={
            "input_tokens": result["usage"]["input_tokens"],
            "output_tokens": result["usage"]["output_tokens"]
        }
    )

    state["findings"].append(result)
    state["agents_completed"].append("security")
    return state
```

**Langfuse Dashboard Shows:**
- Full workflow execution graph
- Per-node latency and costs
- Token usage by agent
- Failed nodes and retry attempts
- State at each checkpoint

---

## SkillForge's 8-Agent Analysis Pipeline

**Architecture:**
```
User Content
    ↓
[Supervisor] → Routes to 8 specialist agents
    ↓
[Security Agent]  ──┐
[Tech Comparator] ──┤
[Implementation]  ──┤
[Tutorial]        ──┼→ [Supervisor] → [Quality Gate]
[Depth Analyzer]  ──┤                        ↓
[Prerequisites]   ──┤                   Pass: Compress
[Best Practices]  ──┤                   Fail: Retry or END
[Code Examples]   ──┘
```

**State Schema:**
```python
class Finding(BaseModel):
    agent: str
    category: str
    content: str
    confidence: float

class AnalysisState(TypedDict):
    # Input
    url: str
    raw_content: str

    # Agent outputs
    findings: Annotated[list[Finding], add]
    embeddings: Annotated[list[Embedding], add]

    # Control flow
    current_agent: str
    agents_completed: list[str]
    next: str

    # Quality control
    quality_score: float
    quality_passed: bool
    retry_count: int

    # Final output
    compressed_summary: str
    artifact: dict
```

**Key Design Decisions:**
1. **Supervisor pattern:** Centralized routing, easy to modify agent list
2. **Accumulating state:** `Annotated[list[T], add]` ensures all findings preserved
3. **Quality gate:** Validates before compression (prevents bad outputs)
4. **Checkpointing:** Resume expensive multi-agent workflows after failures
5. **Langfuse tracing:** Track costs and latency per agent

---

## Common Patterns

### Pattern 1: Map-Reduce (Parallel Agents)

```python
from langgraph.graph import StateGraph

def fan_out(state):
    """Split work into parallel tasks."""
    state["tasks"] = [{"id": 1}, {"id": 2}, {"id": 3}]
    return state

def worker(state):
    """Process one task."""
    # LangGraph handles parallel execution
    task = state["current_task"]
    result = process(task)
    return {"results": [result]}

def fan_in(state):
    """Combine parallel results."""
    combined = aggregate(state["results"])
    return {"final": combined}

workflow = StateGraph(State)
workflow.add_node("fan_out", fan_out)
workflow.add_node("worker", worker)
workflow.add_node("fan_in", fan_in)

workflow.add_edge("fan_out", "worker")
workflow.add_edge("worker", "fan_in")  # Waits for all workers
```

### Pattern 2: Human-in-the-Loop

```python
workflow = StateGraph(State)
workflow.add_node("draft", generate_draft)
workflow.add_node("review", human_review)
workflow.add_node("publish", publish_content)

# Interrupt before review (wait for human)
app = workflow.compile(interrupt_before=["review"])

# Step 1: Generate draft (stops at review)
result = app.invoke({"topic": "AI"}, config=config)

# Step 2: Human reviews, modifies state
state = app.get_state(config)
state["approved"] = True  # Human decision
app.update_state(config, state)

# Step 3: Resume workflow
result = app.invoke(None, config=config)  # Continues to publish
```

### Pattern 3: Retry with Backoff

```python
def llm_call_with_retry(state):
    """Retry failed LLM calls."""
    try:
        result = call_llm(state["input"])
        state["output"] = result
        state["retry_count"] = 0
        return state
    except Exception as e:
        state["retry_count"] += 1
        state["error"] = str(e)
        return state

def should_retry(state) -> str:
    if state["retry_count"] == 0:
        return "success"
    elif state["retry_count"] < 3:
        return "retry"
    else:
        return "failed"

workflow.add_conditional_edges(
    "llm_call",
    should_retry,
    {
        "success": "next_step",
        "retry": "llm_call",  # Loop back
        "failed": "error_handler"
    }
)
```

---

## Best Practices

### 1. State Design
- **Keep state flat:** Avoid deeply nested dicts (hard to debug)
- **Use TypedDict:** Type safety catches errors early
- **Annotated accumulators:** Use `Annotated[list, add]` for multi-agent outputs
- **Immutable inputs:** Don't modify input fields (helps with checkpointing)

### 2. Node Design
- **Pure functions:** Nodes should not have side effects (except I/O)
- **Idempotent:** Safe to re-run (important for checkpointing)
- **Single responsibility:** One agent = one node
- **Return new state:** Don't mutate in place (use `state.copy()`)

### 3. Error Handling
- **Wrap nodes:** Try/catch to prevent workflow crash
- **Dead letter queue:** Send failed items to error handler
- **Retry logic:** Exponential backoff for transient errors
- **Checkpoints:** Enable recovery without losing progress

### 4. Performance
- **Parallel execution:** Use `Send` API for independent tasks
- **Lazy loading:** Don't load heavy data until needed
- **Streaming:** Stream LLM responses for better UX
- **Caching:** Cache expensive operations (embeddings, API calls)

### 5. Observability
- **Trace everything:** Use `@observe()` on all nodes
- **Log state changes:** Before/after state for debugging
- **Cost tracking:** Record token usage per node
- **Alerting:** Set up alerts for workflow failures

---

## Debugging LangGraph Workflows

### Visualize the Graph
```python
from IPython.display import Image

# Generate graph visualization
image = app.get_graph().draw_mermaid_png()
Image(image)
```

### Inspect Checkpoints
```python
# Get all checkpoints for a workflow
checkpoints = app.get_state_history(config)

for checkpoint in checkpoints:
    print(f"Step: {checkpoint.metadata['step']}")
    print(f"Node: {checkpoint.metadata['source']}")
    print(f"State: {checkpoint.values}")
```

### Step-by-Step Execution
```python
# Execute one node at a time
for step in app.stream(initial_state, config):
    print(f"After {step['node']}: {step['state']}")
    input("Press Enter to continue...")
```

---

## Migration from LangChain Chains

**Old Way (LCEL Chain):**
```python
chain = (
    load_content
    | analyze
    | summarize
    | format_output
)
result = chain.invoke({"url": url})
```

**New Way (LangGraph):**
```python
workflow = StateGraph(State)
workflow.add_node("load", load_content)
workflow.add_node("analyze", analyze)
workflow.add_node("summarize", summarize)
workflow.add_node("format", format_output)

workflow.add_edge("load", "analyze")
workflow.add_edge("analyze", "summarize")
workflow.add_edge("summarize", "format")

app = workflow.compile()
result = app.invoke({"url": url})
```

**When to use LangGraph over LCEL:**
- Need state persistence (checkpointing)
- Conditional routing based on results
- Multi-agent coordination
- Human-in-the-loop approval
- Fault tolerance required

---

## References

### LangGraph Documentation
- [LangGraph Docs](https://langchain-ai.github.io/langgraph/)
- [StateGraph API](https://langchain-ai.github.io/langgraph/reference/graphs/)
- [Checkpointing Guide](https://langchain-ai.github.io/langgraph/how-tos/persistence/)

### SkillForge Examples
- `backend/app/workflows/content_analysis_workflow.py` - Main analysis pipeline
- `backend/app/workflows/nodes/` - Individual agent nodes
- `backend/app/workflows/state.py` - State schema definitions

### Related Skills
- `ai-native-development` - LLM integration patterns
- `langfuse-observability` - Workflow tracing and monitoring
- `performance-optimization` - Optimize multi-agent execution

---

**Version:** 1.0.0 (December 2025)
**Status:** Production-ready patterns from SkillForge's multi-agent pipeline
