# State Management in LangGraph

## Overview

State is the **shared data structure** passed between nodes in a LangGraph workflow. Every node receives the current state and returns updated state.

**Key Principle:** State flows through the graph like water through pipes.

---

## State Schema Definition

### Approach 1: TypedDict (Recommended)

```python
from typing import TypedDict, Annotated
from operator import add

class WorkflowState(TypedDict):
    # Simple fields - last write wins
    input: str
    output: str
    current_step: str

    # Accumulating fields - append instead of replace
    results: Annotated[list[dict], add]
    errors: Annotated[list[str], add]

    # Metadata
    metadata: dict
```

**Benefits:**
- Simple, lightweight
- Type-safe (mypy catches errors)
- Fast (no validation overhead)

**When to use:**
- Simple workflows
- Performance-critical paths
- Don't need validation

---

### Approach 2: Pydantic (Validation)

```python
from pydantic import BaseModel, Field, validator

class WorkflowState(BaseModel):
    input: str = Field(description="User input", min_length=1)
    output: str = ""
    results: list[dict] = Field(default_factory=list)

    @validator("input")
    def validate_input(cls, v):
        if "forbidden" in v.lower():
            raise ValueError("Input contains forbidden content")
        return v

    class Config:
        # Allow extra fields (useful for debugging)
        extra = "allow"
```

**Benefits:**
- Input validation
- Default values
- Complex logic in validators

**When to use:**
- Untrusted inputs
- Complex validation rules
- API boundaries

---

## Accumulator Pattern: `Annotated[list, add]`

**Problem:** Multiple agents each produce results, how do we combine them?

**Wrong Way:**
```python
class State(TypedDict):
    results: list[dict]  # Last write wins!

def agent1(state):
    state["results"] = [{"agent": "1", "data": "..."}]
    return state

def agent2(state):
    state["results"] = [{"agent": "2", "data": "..."}]  # OVERWRITES agent1!
    return state

# Result: Only agent2's data is in state["results"]
```

**Correct Way:**
```python
from operator import add

class State(TypedDict):
    results: Annotated[list[dict], add]  # Accumulates!

def agent1(state):
    state["results"] = [{"agent": "1", "data": "..."}]
    return state

def agent2(state):
    state["results"] = [{"agent": "2", "data": "..."}]  # APPENDS to agent1
    return state

# Result: Both agents' data in state["results"]
```

**How It Works:**
- `Annotated[list[T], add]` tells LangGraph to **merge** lists, not replace
- Uses `operator.add` under the hood: `old_list + new_list`
- Critical for multi-agent workflows!

---

## SkillForge's Analysis State

```python
from typing import TypedDict, Annotated
from operator import add
from pydantic import BaseModel

# Domain models
class Finding(BaseModel):
    agent: str
    category: str
    content: str
    confidence: float
    metadata: dict = {}

class AnalysisState(TypedDict):
    """State for content analysis workflow."""

    # === Input (immutable) ===
    analysis_id: str
    url: str
    raw_content: str

    # === Agent Outputs (accumulating) ===
    findings: Annotated[list[Finding], add]
    embeddings: Annotated[list[dict], add]

    # === Control Flow (mutable) ===
    current_agent: str
    agents_completed: list[str]
    next_node: str

    # === Quality Control ===
    quality_score: float
    quality_passed: bool
    retry_count: int

    # === Final Output ===
    compressed_summary: str
    artifact_data: dict
```

**Design Decisions:**
1. **Immutable inputs:** `url`, `raw_content` never change (helps with checkpointing)
2. **Accumulating outputs:** `findings`, `embeddings` collect from all agents
3. **Control flow state:** `current_agent`, `next_node` for routing
4. **Quality tracking:** `quality_score`, `retry_count` for decision making

---

## State Access Patterns

### Pattern 1: Read-Only Access
```python
def analyze_node(state: WorkflowState) -> WorkflowState:
    """Read state, add new data, don't modify existing."""
    input_text = state["input"]  # Read
    result = analyze(input_text)

    # Return new data (doesn't modify state["input"])
    return {
        "results": [{"analysis": result}]
    }
```

### Pattern 2: Conditional Update
```python
def router_node(state: WorkflowState) -> WorkflowState:
    """Update control flow based on state."""
    if len(state["results"]) >= 5:
        state["next"] = "summarize"
    else:
        state["next"] = "collect_more"

    return state
```

### Pattern 3: State Accumulation
```python
def agent_node(state: WorkflowState) -> WorkflowState:
    """Add to accumulating list."""
    finding = process_agent(state["input"])

    return {
        "findings": [finding],  # Appends due to Annotated[list, add]
        "agents_completed": state["agents_completed"] + ["agent_name"]
    }
```

---

## Common Pitfalls

### Pitfall 1: Forgetting `add` Operator

```python
# WRONG - Results get overwritten
class State(TypedDict):
    results: list[dict]  # Missing Annotated[..., add]

# CORRECT
class State(TypedDict):
    results: Annotated[list[dict], add]
```

### Pitfall 2: Mutating State In-Place

```python
# WRONG - Mutates state (breaks checkpointing)
def node(state):
    state["results"].append({"new": "data"})
    return state

# CORRECT - Return new list
def node(state):
    return {
        "results": [{"new": "data"}]
    }
```

### Pitfall 3: Nested State (Hard to Debug)

```python
# WRONG - Deeply nested
class State(TypedDict):
    data: dict  # {"level1": {"level2": {"level3": ...}}}

# CORRECT - Flat structure
class State(TypedDict):
    level1_data: dict
    level2_data: dict
    level3_data: dict
```

---

## Testing State Management

```python
import pytest
from langgraph.graph import StateGraph

def test_state_accumulation():
    """Test that multiple agents accumulate results."""
    class State(TypedDict):
        results: Annotated[list[str], add]

    def agent1(state):
        return {"results": ["agent1"]}

    def agent2(state):
        return {"results": ["agent2"]}

    workflow = StateGraph(State)
    workflow.add_node("agent1", agent1)
    workflow.add_node("agent2", agent2)
    workflow.add_edge("agent1", "agent2")
    workflow.set_entry_point("agent1")

    app = workflow.compile()
    result = app.invoke({"results": []})

    assert result["results"] == ["agent1", "agent2"]  # Both present!

def test_state_immutability():
    """Test that input fields aren't modified."""
    initial_state = {"input": "test", "results": []}
    result = app.invoke(initial_state)

    assert initial_state["input"] == "test"  # Unchanged
    assert len(result["results"]) > 0  # New data added
```

---

## State Size Management

**Problem:** State grows large with accumulated results.

**Solutions:**

1. **Compress regularly:**
```python
def compress_node(state):
    """Compress accumulated findings."""
    compressed = summarize(state["findings"])
    return {
        "compressed_summary": compressed,
        "findings": []  # Clear raw findings
    }
```

2. **Store references:**
```python
class State(TypedDict):
    finding_ids: list[str]  # Store IDs, not full objects

def agent_node(state):
    finding = generate_finding()
    save_to_db(finding)  # Store externally
    return {"finding_ids": [finding.id]}
```

3. **Checkpoint pruning:**
```python
# Only keep last N checkpoints
checkpointer = PostgresSaver.from_conn_string(
    settings.DATABASE_URL,
    keep_last=10  # Prune old checkpoints
)
```

---

## References

- [LangGraph State Documentation](https://langchain-ai.github.io/langgraph/concepts/low_level/#state)
- [Annotated Accumulators](https://langchain-ai.github.io/langgraph/how-tos/state-reducers/)
- SkillForge: `backend/app/workflows/state.py`
