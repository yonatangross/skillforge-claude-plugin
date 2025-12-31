# LangGraph Workflow Implementation Checklist

Use this checklist when implementing multi-agent workflows with LangGraph.

## Pre-Implementation

### State Design
- [ ] **Define state schema** - Choose TypedDict or Pydantic BaseModel
- [ ] **Identify shared fields** - Input, output, metadata
- [ ] **Plan accumulators** - Use `Annotated[list[T], add]` for multi-agent outputs
- [ ] **Define control flow fields** - current_agent, next, retry_count, etc.
- [ ] **Keep state flat** - Avoid deeply nested structures
- [ ] **Document state transitions** - What each node adds/modifies

### Node Planning
- [ ] **List all nodes** - Agents, routers, quality gates, post-processors
- [ ] **Define node responsibilities** - Single responsibility per node
- [ ] **Plan node signatures** - `def node(state: State) -> State`
- [ ] **Identify pure functions** - Nodes with no side effects
- [ ] **Plan error handling** - Try/catch wrappers for each node

### Routing Logic
- [ ] **Map workflow graph** - Draw state transition diagram
- [ ] **Identify edge types** - Simple edges, conditional edges, loops
- [ ] **Define routing conditions** - When to route to each node
- [ ] **Plan entry/exit points** - `set_entry_point()`, `END` conditions
- [ ] **Detect cycles** - Identify retry/loop patterns, set max iterations

### Checkpointing Strategy
- [ ] **Choose checkpointer** - MemorySaver (dev), PostgresSaver (prod)
- [ ] **Plan thread IDs** - How to identify unique workflow runs
- [ ] **Define save frequency** - Every node, or critical nodes only?
- [ ] **Identify interrupt points** - Human-in-the-loop review nodes
- [ ] **Plan resume logic** - How to recover from crashes

## Implementation

### Graph Construction

```python
from langgraph.graph import StateGraph, END

# 1. Initialize graph
workflow = StateGraph(WorkflowState)

# 2. Add nodes
workflow.add_node("supervisor", supervisor_node)
workflow.add_node("agent_1", agent_1_node)
workflow.add_node("quality_gate", quality_gate_node)

# 3. Add edges
workflow.add_edge("agent_1", "supervisor")  # Always go to supervisor

# 4. Add conditional edges
workflow.add_conditional_edges(
    "supervisor",
    route_to_next_agent,
    {
        "agent_1": "agent_1",
        "quality_gate": "quality_gate",
        END: END
    }
)

# 5. Set entry point
workflow.set_entry_point("supervisor")

# 6. Compile
app = workflow.compile(checkpointer=checkpointer)
```

- [ ] Graph initialized with state schema
- [ ] All nodes added
- [ ] Simple edges defined
- [ ] Conditional edges with routing logic
- [ ] Entry point set
- [ ] Checkpointer configured (if needed)

### Node Implementation

```python
from langfuse.decorators import observe, langfuse_context

@observe(as_type="generation")  # For LLM nodes
def agent_node(state: WorkflowState) -> WorkflowState:
    """Agent node with error handling and tracing."""

    # 1. Log input
    langfuse_context.update_current_observation(
        name="agent_node",
        input=state["input"][:200]
    )

    try:
        # 2. Process
        result = agent.analyze(state["input"])

        # 3. Update state
        state["findings"].append(result)
        state["agents_completed"].append("agent_1")

        # 4. Log output and usage
        langfuse_context.update_current_observation(
            output=result,
            usage={
                "input_tokens": result["usage"]["input_tokens"],
                "output_tokens": result["usage"]["output_tokens"]
            }
        )

        return state

    except Exception as e:
        logger.error(f"Agent node failed: {e}")
        state["error"] = str(e)
        state["retry_count"] += 1
        return state
```

- [ ] **Input validation** - Check required state fields exist
- [ ] **Error handling** - Try/catch with state error field
- [ ] **State updates** - Properly accumulate to lists with `add` operator
- [ ] **Langfuse tracing** - `@observe()` decorator with usage tracking
- [ ] **Logging** - Log node entry/exit and errors
- [ ] **Return state** - Always return modified state

### Routing Functions

```python
def route_after_quality_gate(state: WorkflowState) -> str:
    """Route based on quality gate result."""
    if state["quality_passed"]:
        return "compress_findings"  # Success path
    elif state["retry_count"] < 2:
        return "supervisor"  # Retry with more agents
    else:
        return END  # Failed, return partial results

def route_to_next_agent(state: WorkflowState) -> str:
    """Supervisor routing logic."""
    completed = set(state["agents_completed"])
    available = [a for a in ALL_AGENTS if a not in completed]

    if not available:
        return "quality_gate"
    else:
        return available[0]  # Next available agent
```

- [ ] **Routing logic tested** - Unit tests for all routing paths
- [ ] **Handle edge cases** - Empty lists, missing fields
- [ ] **Return valid node names** - Match names in `add_conditional_edges()`
- [ ] **Document routing** - Comment why each branch exists

### Checkpointing Integration

```python
from langgraph.checkpoint.postgres import PostgresSaver

# Create checkpointer
checkpointer = PostgresSaver.from_conn_string(
    settings.DATABASE_URL,
    save_every=1  # Save after each node
)

# Compile with checkpointing
app = workflow.compile(
    checkpointer=checkpointer,
    interrupt_before=["quality_gate"]  # Manual review point
)

# Run workflow
config = {"configurable": {"thread_id": f"analysis-{uuid4()}"}}
result = app.invoke(initial_state, config=config)

# Resume after crash
result = app.invoke(None, config=config)  # Resumes from last checkpoint
```

- [ ] Checkpointer configured for environment (Memory/SQLite/Postgres)
- [ ] Unique thread IDs generated per workflow run
- [ ] `interrupt_before` set for human-in-the-loop nodes
- [ ] Resume logic tested (simulate crash and resume)
- [ ] Checkpoint history inspection works

## Verification

### Workflow Testing

```python
import pytest

@pytest.mark.asyncio
async def test_workflow_happy_path():
    """Test successful workflow execution."""
    initial_state = {
        "url": "https://example.com",
        "raw_content": "Test content",
        "findings": [],
        "agents_completed": [],
        "retry_count": 0
    }

    result = app.invoke(initial_state, config=config)

    assert result["quality_passed"] is True
    assert len(result["agents_completed"]) > 0
    assert "compressed_summary" in result

@pytest.mark.asyncio
async def test_workflow_retry_logic():
    """Test workflow retry on quality gate failure."""
    initial_state = {...}  # State that triggers retry

    result = app.invoke(initial_state, config=config)

    assert result["retry_count"] > 0
    # Should retry or fail gracefully
```

- [ ] **Happy path test** - Workflow completes successfully
- [ ] **Retry logic test** - Workflow retries on failures
- [ ] **Error handling test** - Workflow handles node failures
- [ ] **Edge case test** - Empty inputs, missing data
- [ ] **State persistence test** - Checkpointing works correctly

### Graph Visualization

```python
from IPython.display import Image

# Generate graph visualization
image = app.get_graph().draw_mermaid_png()
Image(image)
```

- [ ] Graph visualized and reviewed
- [ ] All nodes present
- [ ] Edges connect correctly
- [ ] No orphaned nodes
- [ ] Entry/exit points clear

### Langfuse Tracing

```python
from langfuse import Langfuse

langfuse = Langfuse()

@observe()  # Trace entire workflow
def run_workflow(url: str):
    langfuse_context.update_current_trace(
        name="content_analysis",
        metadata={"url": url},
        tags=["langgraph", "multi-agent"]
    )

    result = app.invoke({"url": url})

    langfuse_context.update_current_observation(
        output=result,
        metadata={"agents_used": len(result["agents_completed"])}
    )

    return result
```

- [ ] Workflow traced in Langfuse
- [ ] Per-node spans visible
- [ ] Token usage tracked by agent
- [ ] Latency metrics recorded
- [ ] Failed nodes highlighted

### Performance Validation

- [ ] **Workflow latency** - Measure end-to-end execution time
- [ ] **Per-node latency** - Identify bottleneck nodes
- [ ] **Token costs** - Track LLM usage per agent
- [ ] **Checkpoint overhead** - Measure checkpointing impact
- [ ] **Memory usage** - State size doesn't grow unbounded

## Post-Implementation

### Production Checklist
- [ ] **Error alerts** - Set up monitoring for workflow failures
- [ ] **Cost tracking** - Monitor LLM token usage trends
- [ ] **Checkpoint cleanup** - Delete old checkpoints (retention policy)
- [ ] **Rate limiting** - Prevent runaway workflows
- [ ] **Documentation** - State schema, routing logic, node responsibilities

### Optimization Opportunities
- [ ] **Parallel execution** - Use `Send` API for independent nodes
- [ ] **Lazy loading** - Don't load heavy data until needed
- [ ] **Streaming** - Stream LLM responses for better UX
- [ ] **Caching** - Cache expensive operations (embeddings, API calls)

## Troubleshooting

| Issue | Check |
|-------|-------|
| Workflow hangs | Add timeout, check for infinite loops |
| State not persisting | Verify checkpointer config, check thread_id |
| Node not executing | Check conditional routing logic |
| Wrong route taken | Debug routing function, inspect state |
| Checkpoint error | Verify database connection, check schema |
| Memory leak | Inspect state accumulation, clear old data |

## SkillForge Integration

```python
# Example: Content analysis workflow
from app.workflows.content_analysis_workflow import ContentAnalysisWorkflow

workflow = ContentAnalysisWorkflow()
result = await workflow.run(
    url="https://example.com",
    content="Content to analyze"
)

# Monitor via Langfuse at http://localhost:3000
# View checkpoints in PostgreSQL
```

- [ ] Workflow integrated with FastAPI endpoint
- [ ] SSE events published for progress updates
- [ ] Results stored in database (analyses, artifacts)
- [ ] Searchable via hybrid search (chunks created)

## References

- **LangGraph Docs**: https://langchain-ai.github.io/langgraph/
- **SkillForge Example**: `backend/app/workflows/content_analysis_workflow.py`
- **State Schema**: `backend/app/workflows/state.py`
- **Related Skill**: `.claude/skills/langfuse-observability/`
