# Supervisor-Worker Pattern in LangGraph

## Overview

The **Supervisor-Worker Pattern** is the most common multi-agent coordination strategy:
- **One supervisor** routes work to specialized workers
- **Multiple workers** handle specific tasks
- Workers return results to supervisor
- Supervisor decides next step

**Benefits:**
- Easy to add/remove workers
- Centralized coordination logic
- Clear separation of concerns
- Parallel execution possible

---

## Basic Pattern

```python
from langgraph.graph import StateGraph, END

class State(TypedDict):
    input: str
    next: str  # Routing decision
    results: Annotated[list[dict], add]

def supervisor(state: State) -> State:
    """Route to next worker or end."""
    if state["input"].startswith("security"):
        state["next"] = "security_worker"
    elif state["input"].startswith("performance"):
        state["next"] = "performance_worker"
    else:
        state["next"] = END
    return state

def security_worker(state: State) -> State:
    """Handle security tasks."""
    result = analyze_security(state["input"])
    return {"results": [{"worker": "security", "result": result}]}

def performance_worker(state: State) -> State:
    """Handle performance tasks."""
    result = analyze_performance(state["input"])
    return {"results": [{"worker": "performance", "result": result}]}

# Build graph
workflow = StateGraph(State)
workflow.add_node("supervisor", supervisor)
workflow.add_node("security_worker", security_worker)
workflow.add_node("performance_worker", performance_worker)

# Supervisor routes dynamically
workflow.add_conditional_edges(
    "supervisor",
    lambda s: s["next"],  # Read routing decision
    {
        "security_worker": "security_worker",
        "performance_worker": "performance_worker",
        END: END
    }
)

# Workers return to supervisor
workflow.add_edge("security_worker", "supervisor")
workflow.add_edge("performance_worker", "supervisor")

workflow.set_entry_point("supervisor")
app = workflow.compile()
```

---

## SkillForge's 8-Agent Supervisor

```python
# backend/app/workflows/nodes/supervisor_node.py
from typing import Literal

AgentName = Literal[
    "security_agent",
    "tech_comparator",
    "implementation_planner",
    "tutorial_analyzer",
    "depth_analyzer",
    "prerequisites_extractor",
    "best_practices",
    "code_examples"
]

ALL_AGENTS: list[AgentName] = [
    "security_agent",
    "tech_comparator",
    "implementation_planner",
    "tutorial_analyzer",
    "depth_analyzer",
    "prerequisites_extractor",
    "best_practices",
    "code_examples"
]

def supervisor_node(state: AnalysisState) -> AnalysisState:
    """Route to next available agent or quality gate."""

    # Get agents we've already run
    completed = set(state["agents_completed"])

    # Filter to agents we haven't run
    available = [a for a in ALL_AGENTS if a not in completed]

    if not available:
        # All agents complete → quality gate
        state["next"] = "quality_gate"
    else:
        # Route to first available agent (round-robin)
        state["next"] = available[0]

    return state

# Build workflow
workflow = StateGraph(AnalysisState)
workflow.add_node("supervisor", supervisor_node)
workflow.add_node("quality_gate", quality_gate_node)

# Add all 8 agent nodes
for agent_name in ALL_AGENTS:
    workflow.add_node(agent_name, create_agent_node(agent_name))
    workflow.add_edge(agent_name, "supervisor")  # Return to supervisor

# Supervisor routes dynamically
workflow.add_conditional_edges(
    "supervisor",
    lambda s: s["next"],
    {
        **{agent: agent for agent in ALL_AGENTS},  # Map each agent to itself
        "quality_gate": "quality_gate"
    }
)

workflow.set_entry_point("supervisor")
```

**Key Features:**
1. **Round-robin routing:** Processes all 8 agents sequentially
2. **Completion tracking:** `agents_completed` list prevents re-running agents
3. **Quality gate:** After all agents finish, validate results
4. **Easy to modify:** Add/remove agents by updating `ALL_AGENTS` list

---

## Routing Strategies

### Strategy 1: Round-Robin (SkillForge)

```python
def supervisor(state):
    """Execute all agents in order."""
    completed = set(state["agents_completed"])
    available = [a for a in ALL_AGENTS if a not in completed]

    if available:
        return {"next": available[0]}  # First uncompleted
    else:
        return {"next": "final_step"}
```

**Use when:** All agents must run, order doesn't matter

### Strategy 2: Priority-Based

```python
AGENT_PRIORITIES = {
    "security_agent": 1,  # High priority
    "performance_agent": 2,
    "style_agent": 3  # Low priority
}

def supervisor(state):
    """Execute agents by priority."""
    completed = set(state["agents_completed"])
    available = [a for a in ALL_AGENTS if a not in completed]

    # Sort by priority
    available.sorted(key=lambda a: AGENT_PRIORITIES[a])

    if available:
        return {"next": available[0]}  # Highest priority
    else:
        return {"next": END}
```

**Use when:** Some agents are more important than others

### Strategy 3: Conditional (Content-Based)

```python
def supervisor(state):
    """Route based on content characteristics."""
    content_type = detect_type(state["content"])

    if content_type == "code":
        return {"next": "code_analyzer"}
    elif content_type == "tutorial":
        return {"next": "tutorial_analyzer"}
    elif content_type == "research":
        return {"next": "research_analyzer"}
    else:
        return {"next": END}
```

**Use when:** Workflow depends on input characteristics

### Strategy 4: Dependency-Based

```python
AGENT_DEPENDENCIES = {
    "security_agent": [],  # No dependencies
    "implementation_planner": ["security_agent"],  # Needs security first
    "code_examples": ["implementation_planner"]  # Needs implementation plan
}

def supervisor(state):
    """Execute agents respecting dependencies."""
    completed = set(state["agents_completed"])

    for agent in ALL_AGENTS:
        if agent in completed:
            continue  # Already done

        # Check dependencies satisfied
        deps = AGENT_DEPENDENCIES[agent]
        if all(dep in completed for dep in deps):
            return {"next": agent}  # Ready to run

    return {"next": "final_step"}  # All done
```

**Use when:** Agents have dependencies (B needs A's output)

---

## Dynamic Worker Creation

**Problem:** Number of workers varies at runtime.

**Solution:** Use `Send` API for dynamic parallelism.

```python
from langgraph.graph import Send

def supervisor(state):
    """Create workers dynamically."""
    tasks = state["tasks"]  # List of tasks from state

    # Create one worker per task
    return [
        Send("worker", {"task": task})
        for task in tasks
    ]

def worker(state):
    """Process one task."""
    result = process(state["task"])
    return {"results": [result]}

workflow = StateGraph(State)
workflow.add_node("supervisor", supervisor)
workflow.add_node("worker", worker)

# Supervisor sends to multiple workers in parallel
workflow.add_conditional_edges("supervisor", lambda s: "worker")

# Workers converge at aggregator
workflow.add_edge("worker", "aggregator")
```

**Use when:** Number of parallel tasks unknown until runtime

---

## Error Handling in Supervisor Pattern

### Pattern 1: Retry Failed Workers

```python
def supervisor(state):
    """Retry failed agents."""
    completed = set(state["agents_completed"])
    failed = set(state["agents_failed"])

    # Retry failed agents (max 2 retries)
    for agent in failed:
        if state["retry_count"][agent] < 2:
            state["retry_count"][agent] += 1
            return {"next": agent}

    # Otherwise, continue with remaining agents
    available = [a for a in ALL_AGENTS if a not in completed]
    if available:
        return {"next": available[0]}
    else:
        return {"next": END}

def agent_wrapper(agent_fn):
    """Wrap agent with error handling."""
    def wrapper(state):
        try:
            result = agent_fn(state)
            state["agents_completed"].append(agent_fn.__name__)
            return result
        except Exception as e:
            state["agents_failed"].append(agent_fn.__name__)
            state["errors"].append({"agent": agent_fn.__name__, "error": str(e)})
            return state
    return wrapper
```

### Pattern 2: Fallback Workers

```python
FALLBACK_AGENTS = {
    "primary_analyzer": "simple_analyzer",  # If primary fails, use simple
}

def supervisor(state):
    """Use fallback if primary fails."""
    if state["last_agent_failed"]:
        failed_agent = state["agents_failed"][-1]
        if failed_agent in FALLBACK_AGENTS:
            return {"next": FALLBACK_AGENTS[failed_agent]}

    # Normal routing
    # ...
```

---

## Parallel Execution

**Problem:** Workers are independent, running sequentially is slow.

**Solution:** Use `Send` API for true parallelism.

```python
from langgraph.graph import Send

def supervisor(state):
    """Dispatch all agents in parallel."""
    agents_to_run = [
        "security_agent",
        "performance_agent",
        "style_agent"
    ]

    # Send work to all agents simultaneously
    return [
        Send(agent, state)
        for agent in agents_to_run
    ]

# Define fan-in point (wait for all workers)
workflow.add_edge(["security_agent", "performance_agent", "style_agent"], "aggregator")
```

**Performance Gain:**
- Sequential: 3 agents × 10s = 30s total
- Parallel: max(10s, 10s, 10s) = 10s total
- **3x speedup!**

---

## Monitoring Supervisor Decisions

```python
from langfuse.decorators import observe

@observe()
def supervisor_node(state: AnalysisState) -> AnalysisState:
    """Traced supervisor node."""
    completed = set(state["agents_completed"])
    available = [a for a in ALL_AGENTS if a not in completed]

    next_agent = available[0] if available else "quality_gate"

    # Log routing decision to Langfuse
    langfuse_context.update_current_observation(
        output={"next": next_agent},
        metadata={
            "completed_count": len(completed),
            "remaining_count": len(available)
        }
    )

    return {"next": next_agent}
```

**Langfuse Dashboard Shows:**
- Routing decisions over time
- Agent utilization (which agents used most)
- Average completion times per agent
- Supervisor overhead (time spent routing)

---

## Testing Supervisor Logic

```python
import pytest

def test_supervisor_routes_all_agents():
    """Test supervisor routes to all agents."""
    state = {
        "agents_completed": [],
        "results": []
    }

    for i in range(len(ALL_AGENTS)):
        state = supervisor_node(state)
        agent = state["next"]

        assert agent in ALL_AGENTS
        assert agent not in state["agents_completed"]

        # Simulate agent completion
        state["agents_completed"].append(agent)
        state["results"].append({"agent": agent, "data": "..."})

    # After all agents, should route to quality gate
    state = supervisor_node(state)
    assert state["next"] == "quality_gate"

def test_supervisor_handles_failures():
    """Test supervisor retries failed agents."""
    state = {
        "agents_completed": [],
        "agents_failed": ["security_agent"],
        "retry_count": {"security_agent": 1}
    }

    state = supervisor_node(state)

    # Should retry security agent
    assert state["next"] == "security_agent"
```

---

## When NOT to Use Supervisor Pattern

**Use simpler patterns when:**
1. **Linear workflow:** A → B → C (no branching)
2. **Single agent:** No coordination needed
3. **Fixed DAG:** Dependencies never change (use explicit edges)

**Supervisor adds overhead:**
- Extra routing node (latency)
- More complex state (next field, completed list)
- Harder to visualize (dynamic edges)

**Rule of thumb:** Use supervisor when number/order of workers varies at runtime.

---

## References

- [LangGraph Multi-Agent Systems](https://langchain-ai.github.io/langgraph/tutorials/multi_agent/)
- [Supervisor Pattern Tutorial](https://langchain-ai.github.io/langgraph/tutorials/multi_agent/agent_supervisor/)
- SkillForge: `backend/app/workflows/nodes/supervisor_node.py`
