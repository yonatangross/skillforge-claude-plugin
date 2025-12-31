# Checkpoints & Persistence in LangGraph

## Overview

**Checkpointing** saves workflow state after each node execution, enabling:
- **Fault tolerance:** Resume after crashes
- **Human-in-the-loop:** Pause for manual approval
- **Time travel:** Inspect state at any point
- **Cost savings:** Don't re-run expensive LLM calls

---

## How Checkpointing Works

```
Workflow Execution with Checkpoints:

Node A executes ──→ Checkpoint saved ──→ Node B executes ──→ Checkpoint saved
    ↓                                         ↓
If crash here: Resume from A's checkpoint   If crash here: Resume from B's checkpoint
```

**Key Concept:** Each checkpoint captures:
- Current state values
- Which node just completed
- Metadata (timestamp, parent checkpoint)

---

## Basic Setup

### In-Memory Checkpointing (Development)

```python
from langgraph.checkpoint import MemorySaver
from langgraph.graph import StateGraph

# Create checkpointer
memory = MemorySaver()

# Compile with checkpointing
app = workflow.compile(checkpointer=memory)

# Run workflow with thread ID
config = {"configurable": {"thread_id": "conversation-1"}}
result = app.invoke(initial_state, config=config)
```

**Pros:**
- Fast (no I/O)
- Simple setup

**Cons:**
- Lost on restart
- Not suitable for production

---

### SQLite Checkpointing (Single Server)

```python
from langgraph.checkpoint.sqlite import SqliteSaver

# Create SQLite checkpointer
checkpointer = SqliteSaver.from_conn_string("checkpoints.db")

app = workflow.compile(checkpointer=checkpointer)
```

**Pros:**
- Persistent across restarts
- No external dependencies

**Cons:**
- Single server only (file-based)
- Limited concurrency

---

### PostgreSQL Checkpointing (Production)

```python
from langgraph.checkpoint.postgres import PostgresSaver

# Create PostgreSQL checkpointer
checkpointer = PostgresSaver.from_conn_string(
    "postgresql://user:pass@localhost:5432/db"
)

app = workflow.compile(checkpointer=checkpointer)
```

**Pros:**
- Distributed (multiple servers)
- High concurrency
- Reliable (ACID transactions)

**Cons:**
- Requires PostgreSQL setup
- Slightly slower than memory

**SkillForge uses PostgreSQL checkpointing.**

---

## Resuming Workflows

### Resume After Crash

```python
from langgraph.checkpoint.postgres import PostgresSaver

checkpointer = PostgresSaver.from_conn_string(settings.DATABASE_URL)
app = workflow.compile(checkpointer=checkpointer)

# Start new workflow
try:
    config = {"configurable": {"thread_id": "analysis-123"}}
    result = app.invoke({"url": "https://..."}, config=config)
except Exception as e:
    logger.error(f"Workflow crashed: {e}")
    # Checkpoint saved before crash

# Resume interrupted workflow (same thread_id)
config = {"configurable": {"thread_id": "analysis-123"}}
result = app.invoke(None, config=config)  # None = resume from checkpoint
```

**How it works:**
1. First call saves checkpoints as workflow executes
2. Crash occurs mid-workflow
3. Second call with **same thread_id** resumes from last checkpoint
4. Workflow continues from where it left off

---

## Human-in-the-Loop with `interrupt_before`

**Scenario:** You want manual approval before publishing results.

```python
app = workflow.compile(
    checkpointer=checkpointer,
    interrupt_before=["publish"]  # Pause before publish node
)

# Step 1: Run until interrupt
config = {"configurable": {"thread_id": "doc-1"}}
state = app.invoke({"content": "..."}, config=config)
# Workflow executes: draft → review → PAUSE (before publish)

# Step 2: Human reviews state
print(f"Draft: {state['draft']}")
approve = input("Approve? (y/n): ")

# Step 3: Update state based on approval
if approve == "y":
    state["approved"] = True
    app.update_state(config, state)

    # Resume workflow
    final_state = app.invoke(None, config=config)
    # Continues: publish → END
else:
    print("Rejected, not publishing")
```

**Use cases:**
- Content moderation (review before publishing)
- Budget approval (check cost before expensive operation)
- Quality control (manual inspection before finalization)

---

## SkillForge Checkpointing

```python
# backend/app/workflows/checkpoints.py
from langgraph.checkpoint.postgres import PostgresSaver
from app.core.config import settings

def create_checkpointer() -> PostgresSaver:
    """Create PostgreSQL checkpointer for production."""
    return PostgresSaver.from_conn_string(
        settings.DATABASE_URL,
        # Additional config
        serde=CustomSerializer()  # Optional: custom serialization
    )

# backend/app/workflows/content_analysis_workflow.py
from app.workflows.checkpoints import create_checkpointer

def create_analysis_workflow():
    """Build analysis workflow with checkpointing."""
    workflow = StateGraph(AnalysisState)

    # ... add nodes ...

    app = workflow.compile(
        checkpointer=create_checkpointer(),
        interrupt_before=["quality_gate"]  # Manual quality review optional
    )

    return app

# Usage in API endpoint
@router.post("/analyze")
async def analyze_content(url: str):
    """Start analysis workflow."""
    analysis_id = generate_id()

    app = create_analysis_workflow()

    try:
        result = app.invoke(
            {"url": url, "analysis_id": analysis_id},
            config={"configurable": {"thread_id": analysis_id}}
        )
        return result
    except Exception as e:
        logger.error(f"Analysis failed: {e}", analysis_id=analysis_id)

        # Resume on retry
        result = app.invoke(
            None,
            config={"configurable": {"thread_id": analysis_id}}
        )
        return result
```

**Benefits for SkillForge:**
1. **8-agent pipeline:** If agent 5 crashes, resume from agent 5 (don't re-run 1-4)
2. **Expensive LLM calls:** Each agent's output checkpointed (cost savings)
3. **Quality gate:** Can pause for manual review if quality low
4. **Debugging:** Inspect state after each agent

---

## Inspecting Checkpoints

### Get Current State

```python
# Get latest state for thread
config = {"configurable": {"thread_id": "analysis-123"}}
state = app.get_state(config)

print(f"Current step: {state.next}")
print(f"State values: {state.values}")
print(f"Metadata: {state.metadata}")
```

### Get State History

```python
# Get all checkpoints for a thread
config = {"configurable": {"thread_id": "analysis-123"}}
history = app.get_state_history(config)

for i, checkpoint in enumerate(history):
    print(f"Checkpoint {i}:")
    print(f"  Node: {checkpoint.metadata['source']}")
    print(f"  State: {checkpoint.values}")
    print(f"  Timestamp: {checkpoint.metadata['timestamp']}")
```

**Use case:** Debugging - see exactly what happened at each step.

---

## Advanced: Checkpoint Branching

**Scenario:** Test different paths from same checkpoint (A/B testing).

```python
# Create checkpoint at decision point
config_original = {"configurable": {"thread_id": "workflow-1"}}
state = app.invoke(initial_state, config_original)
checkpoint_id = state.metadata["checkpoint_id"]

# Branch A: Try with high quality threshold
config_a = {
    "configurable": {
        "thread_id": "workflow-1-branch-a",
        "checkpoint_id": checkpoint_id  # Start from same point
    }
}
state_a = app.invoke({"quality_threshold": 0.9}, config_a)

# Branch B: Try with low quality threshold
config_b = {
    "configurable": {
        "thread_id": "workflow-1-branch-b",
        "checkpoint_id": checkpoint_id  # Same starting point
    }
}
state_b = app.invoke({"quality_threshold": 0.7}, config_b)

# Compare results
print(f"Branch A score: {state_a['final_score']}")
print(f"Branch B score: {state_b['final_score']}")
```

---

## Checkpoint Storage Management

### Pruning Old Checkpoints

```python
from datetime import datetime, timedelta

# Delete checkpoints older than 7 days
cutoff = datetime.now() - timedelta(days=7)

checkpointer.delete_checkpoints_before(cutoff)
```

### Selective Checkpoint Saving

```python
# Only save checkpoints after expensive nodes
app = workflow.compile(
    checkpointer=checkpointer,
    checkpoint_after=["expensive_llm_call", "embeddings_generation"]
)
```

**Trade-off:**
- More checkpoints = better fault tolerance, more storage
- Fewer checkpoints = less storage, but larger recovery window

---

## Testing with Checkpoints

```python
import pytest
from langgraph.checkpoint import MemorySaver

def test_workflow_resumes_after_failure():
    """Test that workflow resumes from checkpoint."""
    memory = MemorySaver()
    app = workflow.compile(checkpointer=memory)

    # Simulate crash after 2 nodes
    class CrashAfterTwo(Exception):
        pass

    node_count = 0
    def counting_node(state):
        nonlocal node_count
        node_count += 1
        if node_count == 2:
            raise CrashAfterTwo()
        return state

    # First run - crashes
    config = {"configurable": {"thread_id": "test-1"}}
    with pytest.raises(CrashAfterTwo):
        app.invoke(initial_state, config=config)

    # Checkpoint saved before crash
    state = app.get_state(config)
    assert state.values["step"] == 1  # Completed 1 step

    # Second run - resumes from checkpoint
    node_count = 0  # Reset crash trigger
    result = app.invoke(None, config=config)  # Resume

    # Should complete without re-running first node
    assert result["completed"]
    assert node_count == 3  # Only ran remaining nodes
```

---

## Checkpoint Schema

**PostgreSQL Schema:**
```sql
CREATE TABLE checkpoints (
    thread_id TEXT,
    checkpoint_id TEXT,
    parent_checkpoint_id TEXT,
    type TEXT,  -- 'checkpoint' or 'task'
    checkpoint JSONB,  -- Serialized state
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (thread_id, checkpoint_id)
);

CREATE INDEX idx_thread_id ON checkpoints(thread_id);
CREATE INDEX idx_created_at ON checkpoints(created_at);
```

**State Serialization:**
- LangGraph automatically serializes state to JSON
- Custom types need `serde` parameter (serializer/deserializer)

---

## Custom Serialization

```python
from langgraph.checkpoint.base import Serde
import pickle

class PickleSerde(Serde):
    """Custom serializer using pickle."""

    def dumps(self, obj):
        return pickle.dumps(obj)

    def loads(self, data):
        return pickle.loads(data)

checkpointer = PostgresSaver.from_conn_string(
    settings.DATABASE_URL,
    serde=PickleSerde()  # Use pickle instead of JSON
)
```

**When needed:**
- State contains non-JSON types (datetime, custom classes)
- Binary data (images, embeddings)

**SkillForge:** Uses JSON serialization (Pydantic models serialize automatically).

---

## Performance Considerations

### Checkpoint Size

**Large state = slow checkpointing:**
```python
# BAD - Store 10MB of embeddings in state
class State(TypedDict):
    embeddings: list[list[float]]  # 10,000 vectors × 1024 dims

# GOOD - Store IDs, fetch embeddings from DB when needed
class State(TypedDict):
    embedding_ids: list[str]  # Just IDs
```

**Rule:** Keep state < 1MB for fast checkpointing.

### Checkpoint Frequency

```python
# Checkpoint after EVERY node (slow)
app = workflow.compile(checkpointer=checkpointer)

# Checkpoint only after expensive nodes (fast)
app = workflow.compile(
    checkpointer=checkpointer,
    checkpoint_after=["llm_call", "embedding_generation"]
)
```

**Trade-off:** More checkpoints = better fault tolerance, but slower execution.

---

## Common Pitfalls

### Pitfall 1: Forgetting thread_id

```python
# WRONG - No thread_id, can't resume
result = app.invoke(state)

# CORRECT - Always use thread_id with checkpoints
config = {"configurable": {"thread_id": "unique-id"}}
result = app.invoke(state, config=config)
```

### Pitfall 2: Non-Serializable State

```python
# WRONG - datetime not JSON serializable
class State(TypedDict):
    timestamp: datetime  # ERROR on checkpoint

# CORRECT - Use ISO string
class State(TypedDict):
    timestamp: str  # ISO format: "2025-12-19T10:30:00Z"
```

### Pitfall 3: Modifying State After Checkpoint

```python
# WRONG - State changes not persisted
state = app.get_state(config)
state.values["modified"] = True  # Not saved!

# CORRECT - Use update_state()
app.update_state(config, {"modified": True})
```

---

## Debugging Checkpoint Issues

```python
# Enable checkpoint logging
import logging
logging.getLogger("langgraph.checkpoint").setLevel(logging.DEBUG)

# Check if checkpoints are being saved
config = {"configurable": {"thread_id": "test"}}
app.invoke(state, config=config)

history = app.get_state_history(config)
print(f"Checkpoints saved: {len(list(history))}")

# Inspect specific checkpoint
state = app.get_state(config)
print(f"Last node: {state.next}")
print(f"State: {state.values}")
```

---

## References

- [LangGraph Checkpointing Guide](https://langchain-ai.github.io/langgraph/how-tos/persistence/)
- [Human-in-the-Loop Tutorial](https://langchain-ai.github.io/langgraph/how-tos/human_in_the_loop/)
- [PostgreSQL Checkpointer API](https://langchain-ai.github.io/langgraph/reference/checkpoints/)
- SkillForge: `backend/app/workflows/checkpoints.py`
