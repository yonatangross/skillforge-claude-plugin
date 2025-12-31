# Fan-In/Fan-Out Patterns in LangGraph

## Overview

Fan-out sends work to multiple parallel agents. Fan-in aggregates their results. **The challenge:** knowing when all agents are done, especially when some are skipped.

```
┌─────────────────────────────────────────────────────────────────────┐
│                     Fan-Out / Fan-In Pattern                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│                        [Supervisor]                                  │
│                             │                                        │
│                    ┌────────┼────────┐                              │
│                    ▼        ▼        ▼         FAN-OUT              │
│                [Agent1] [Agent2] [Agent3]      (parallel)           │
│                    │        │        │                               │
│                    └────────┼────────┘                              │
│                             ▼                  FAN-IN               │
│                        [Aggregate]             (wait for all)       │
│                             │                                        │
│                             ▼                                        │
│                        [Synthesis]                                  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## The Fan-In Wait Problem

**Problem:** How does the aggregate node know when all agents are done?

```
┌─────────────────────────────────────────────────────────────────────┐
│                   The Fan-In Ambiguity Problem                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   Scenario: Supervisor selects 3 agents, but signal filter skips 1  │
│                                                                      │
│   Supervisor selects: [security, implementation, comparator]        │
│                                                                      │
│   Signal filter:                                                    │
│   - security: SKIP (no security keywords)                           │
│   - implementation: RUN                                              │
│   - comparator: RUN                                                  │
│                                                                      │
│   Fan-In waits for 3 agents... but only 2 will fire!               │
│   → STUCK FOREVER                                                   │
│                                                                      │
│   Solutions:                                                         │
│   A) Remove signal filter (let supervisor decide)                   │
│   B) Dynamic expected count (track actually-started agents)         │
│   C) Timeout-based fan-in (give up after X seconds)                 │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Solution: Dynamic Fan-In with Expected Count

### LangGraph Send() API

The `Send()` API enables dynamic parallel execution:

```python
from langgraph.graph import StateGraph, Send, END

def supervisor_node(state: AnalysisState) -> List[Send]:
    """Fan-out to selected agents using Send() API."""

    # Select agents (semantic routing)
    selected_agents = select_agents(state)

    # Track expected count for fan-in
    state["expected_agent_count"] = len(selected_agents)

    # Send to each agent in parallel
    return [
        Send(agent_type, {"content": state["raw_content"]})
        for agent_type in selected_agents
    ]


def agent_node(state: AgentState) -> dict:
    """Individual agent execution."""
    result = analyze(state["content"])
    return {
        "findings": [result],
        "agent_type": state["agent_type"],
    }


def aggregate_node(state: AnalysisState) -> AnalysisState:
    """Fan-in: aggregate all agent results."""
    # All parallel branches automatically merge here
    # state["findings"] contains results from ALL agents
    return state
```

### Building the Graph with Send()

```python
def build_analysis_graph() -> StateGraph:
    """Build graph with dynamic fan-out/fan-in."""

    workflow = StateGraph(AnalysisState)

    # Supervisor fans out
    workflow.add_node("supervisor", supervisor_node)

    # Add all possible agent nodes
    for agent_type in ALL_AGENTS:
        workflow.add_node(agent_type, create_agent_node(agent_type))
        # Each agent goes to aggregate
        workflow.add_edge(agent_type, "aggregate")

    # Aggregate fans in
    workflow.add_node("aggregate", aggregate_node)

    # Entry point
    workflow.set_entry_point("supervisor")

    # Supervisor dynamically sends to agents
    # (handled by Send() return value)

    return workflow.compile()
```

## Implementation: Dynamic Expected Count

### State Schema Update

```python
from typing import TypedDict, Annotated
from operator import add

class AnalysisState(TypedDict):
    # Input
    url: str
    raw_content: str

    # Agent coordination (NEW)
    expected_agent_count: int    # Set by supervisor
    completed_agent_count: int   # Incremented by each agent
    agents_started: list[str]    # Track which agents actually started

    # Agent outputs
    findings: Annotated[list[Finding], add]

    # Control flow
    current_phase: str
    error_agents: list[str]
```

### Supervisor with Dynamic Tracking

```python
async def supervisor_node(state: AnalysisState) -> dict:
    """Supervisor that tracks expected agents."""

    # Use semantic routing for selection
    selected_agents = await semantic_router.route(state["raw_content"])

    # Store expected count for fan-in validation
    return {
        "expected_agent_count": len(selected_agents),
        "agents_started": selected_agents,
        "current_phase": "parallel_analysis",
    }


def route_to_agents(state: AnalysisState) -> list[Send]:
    """Route to selected agents using Send() API."""
    return [
        Send(agent_type, state)
        for agent_type in state["agents_started"]
    ]
```

### Agent with Completion Tracking

```python
async def agent_node(state: AnalysisState, agent_type: str) -> dict:
    """Agent that tracks completion."""

    try:
        result = await run_agent_analysis(agent_type, state["raw_content"])

        return {
            "findings": [result],
            "completed_agent_count": 1,  # Increment via reducer
        }

    except Exception as e:
        logger.error(f"Agent {agent_type} failed: {e}")

        return {
            "error_agents": [agent_type],
            "completed_agent_count": 1,  # Still count as "done"
        }
```

### Aggregate with Validation

```python
async def aggregate_node(state: AnalysisState) -> dict:
    """Aggregate with completion validation."""

    expected = state["expected_agent_count"]
    completed = state["completed_agent_count"]
    errors = len(state.get("error_agents", []))

    logger.info(
        f"Fan-in complete: {completed}/{expected} agents, {errors} errors"
    )

    # Validate all agents reported
    if completed < expected:
        logger.warning(
            f"Missing agent results: expected {expected}, got {completed}"
        )
        # Could add retry logic here

    # Aggregate findings
    all_findings = state["findings"]

    return {
        "current_phase": "synthesis",
        "aggregated_findings": all_findings,
    }
```

## Timeout-Based Fan-In

For extra safety, add timeout to prevent infinite waits:

```python
import asyncio
from langgraph.graph import StateGraph

async def aggregate_with_timeout(
    state: AnalysisState,
    timeout: float = 120.0,
) -> dict:
    """Aggregate with timeout safety."""

    start_time = time.time()

    while True:
        completed = state["completed_agent_count"]
        expected = state["expected_agent_count"]

        if completed >= expected:
            break

        elapsed = time.time() - start_time
        if elapsed > timeout:
            logger.warning(
                f"Fan-in timeout after {elapsed:.1f}s. "
                f"Got {completed}/{expected} agents."
            )
            break

        await asyncio.sleep(0.5)  # Check every 500ms

    return {"current_phase": "synthesis"}
```

## Pattern: Map-Reduce with Send()

```python
def map_phase(state: State) -> list[Send]:
    """Map: send work to parallel workers."""
    items = state["items_to_process"]

    return [
        Send("worker", {"item": item, "index": i})
        for i, item in enumerate(items)
    ]


def worker_node(state: WorkerState) -> dict:
    """Worker: process single item."""
    result = process_item(state["item"])
    return {"results": [{"index": state["index"], "result": result}]}


def reduce_phase(state: State) -> dict:
    """Reduce: combine all worker results."""
    results = sorted(state["results"], key=lambda r: r["index"])
    combined = combine_results([r["result"] for r in results])
    return {"final_result": combined}


# Build graph
graph = StateGraph(State)
graph.add_node("map", map_phase)
graph.add_node("worker", worker_node)
graph.add_node("reduce", reduce_phase)

# Map fans out to workers
graph.add_conditional_edges(
    "map",
    lambda s: "worker",  # Always goes to worker via Send()
)

# Workers converge to reduce
graph.add_edge("worker", "reduce")
```

## Anti-Patterns

### 1. Fixed Agent Count

```python
# BAD: Hardcoded count doesn't match runtime selection
state["expected_agents"] = 8  # What if only 3 selected?

# GOOD: Dynamic count from actual selection
selected = await router.route(content)
state["expected_agents"] = len(selected)
```

### 2. Signal Filter After Selection

```python
# BAD: Supervisor selects, then filter overrides
selected = supervisor.select(content)  # Returns 5
for agent in selected:
    if should_skip(agent, content):  # Skips 2
        continue
    run(agent)
# Fan-in expects 5, only 3 run → STUCK

# GOOD: Single point of selection
selected = router.route(content)  # Returns 3 (all will run)
state["expected"] = len(selected)  # Exactly 3
```

### 3. Missing Error Handling

```python
# BAD: Failed agent doesn't decrement count
async def agent(state):
    try:
        result = await run()
        return {"findings": [result]}
    except:
        return {}  # No completion signal!

# GOOD: Always signal completion
async def agent(state):
    try:
        result = await run()
        return {"findings": [result], "completed": 1}
    except Exception as e:
        return {"errors": [str(e)], "completed": 1}  # Still counts
```

## Monitoring Fan-In Health

```python
def fan_in_health_check(state: AnalysisState) -> dict:
    """Check fan-in status for monitoring."""
    expected = state.get("expected_agent_count", 0)
    completed = state.get("completed_agent_count", 0)
    errors = len(state.get("error_agents", []))

    return {
        "expected": expected,
        "completed": completed,
        "errors": errors,
        "success_rate": (completed - errors) / expected if expected > 0 else 0,
        "is_stuck": completed < expected and time_since_last_update() > 60,
    }
```

## SkillForge Integration

```python
# backend/app/domains/analysis/workflows/graph_builder.py

def build_analysis_graph() -> StateGraph:
    """Build SkillForge analysis graph with proper fan-in."""

    workflow = StateGraph(AnalysisState)

    # Supervisor selects and fans out
    workflow.add_node("supervisor", supervisor_node)

    # All agents (dynamic selection via Send())
    for agent in ANALYSIS_AGENTS:
        workflow.add_node(agent, create_agent_node(agent))
        workflow.add_edge(agent, "aggregate")

    # Aggregate fans in
    workflow.add_node("aggregate", aggregate_node)

    # Post-aggregation
    workflow.add_node("synthesis", synthesis_node)
    workflow.add_node("quality_gate", quality_gate_node)

    # Edges
    workflow.set_entry_point("supervisor")
    workflow.add_conditional_edges(
        "supervisor",
        route_to_agents,  # Returns list[Send]
    )
    workflow.add_edge("aggregate", "synthesis")
    workflow.add_edge("synthesis", "quality_gate")

    return workflow.compile(
        checkpointer=PostgresSaver.from_conn_string(DATABASE_URL)
    )
```
