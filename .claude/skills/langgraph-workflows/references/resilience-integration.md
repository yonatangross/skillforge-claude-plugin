# Resilience Integration in LangGraph

## Overview

This guide covers integrating resilience patterns (circuit breakers, bulkheads, retries) into LangGraph workflows.

**Related skill:** `resilience-patterns` (full pattern documentation)

## Integration Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                 LangGraph + Resilience Stack                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   LangGraph Workflow                                                │
│   ┌──────────────────────────────────────────────────────────┐     │
│   │  [Node] ──▶ [Node] ──▶ [Node] ──▶ [Node]                │     │
│   │     │          │          │          │                   │     │
│   │     ▼          ▼          ▼          ▼                   │     │
│   │  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐                 │     │
│   │  │Retry │  │Retry │  │Retry │  │Retry │                 │     │
│   │  └──┬───┘  └──┬───┘  └──┬───┘  └──┬───┘                 │     │
│   │     │          │          │          │                   │     │
│   │  ┌──▼───┐  ┌──▼───┐  ┌──▼───┐  ┌──▼───┐                 │     │
│   │  │Bulk- │  │Bulk- │  │Bulk- │  │Bulk- │                 │     │
│   │  │head  │  │head  │  │head  │  │head  │                 │     │
│   │  └──┬───┘  └──┬───┘  └──┬───┘  └──┬───┘                 │     │
│   │     │          │          │          │                   │     │
│   │  ┌──▼───────────▼──────────▼──────────▼───┐             │     │
│   │  │         Circuit Breaker (per service)  │             │     │
│   │  └────────────────────────────────────────┘             │     │
│   │                        │                                 │     │
│   └────────────────────────┼─────────────────────────────────┘     │
│                            ▼                                        │
│                   [External Services]                               │
│                   LLM APIs, Databases, etc.                         │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Wiring Resilience into Nodes

### Node Decorator Pattern

```python
from app.shared.resilience import (
    CircuitBreaker,
    Bulkhead,
    Tier,
    retry,
    CircuitOpenError,
    BulkheadFullError,
)

# Circuit breakers per external service
llm_breaker = CircuitBreaker(
    name="anthropic",
    failure_threshold=3,
    recovery_timeout=60.0,
)

# Bulkhead per tier (Issue #588: Sized for parallel fan-out)
tier2_bulkhead = Bulkhead(
    name="analysis-agents",
    tier=Tier.STANDARD,  # Uses defaults: max_concurrent=8, queue_size=12
    timeout=120.0,
)


def resilient_node(
    circuit: CircuitBreaker,
    bulkhead: Bulkhead,
    max_retries: int = 2,
):
    """Decorator to wrap LangGraph node with resilience."""

    def decorator(node_fn):
        @wraps(node_fn)
        async def wrapper(state: dict) -> dict:
            # Layer 1: Circuit breaker (outermost)
            async def with_circuit():
                # Layer 2: Bulkhead
                async def with_bulkhead():
                    # Layer 3: Retry (innermost)
                    @retry(max_attempts=max_retries, base_delay=1.0)
                    async def with_retry():
                        return await node_fn(state)

                    return await with_retry()

                return await bulkhead.execute(with_bulkhead)

            try:
                return await circuit.call(with_circuit)

            except CircuitOpenError as e:
                # Return degraded result
                return {
                    "error": f"Circuit open for {e.name}",
                    "degraded": True,
                }

            except BulkheadFullError as e:
                # Return degraded result
                return {
                    "error": f"Bulkhead full for {e.name}",
                    "degraded": True,
                }

        return wrapper
    return decorator
```

### Applying to Agent Nodes

```python
# backend/app/domains/analysis/workflows/nodes/agents.py

@resilient_node(
    circuit=llm_breaker,
    bulkhead=tier2_bulkhead,
    max_retries=2,
)
async def tech_comparator_node(state: AnalysisState) -> dict:
    """Tech comparator agent with resilience."""
    result = await tech_comparator_agent.analyze(state["raw_content"])
    return {
        "findings": [result],
        "completed_agent_count": 1,
    }


@resilient_node(
    circuit=llm_breaker,
    bulkhead=tier1_bulkhead,  # Higher priority tier
    max_retries=3,
)
async def synthesis_node(state: AnalysisState) -> dict:
    """Synthesis node with resilience (critical tier)."""
    result = await synthesize_findings(state["findings"])
    return {"synthesis": result}
```

## Circuit Breaker Integration

### Per-Service Breakers

```python
# backend/app/shared/resilience/circuit_breakers.py

from app.core.circuit_breaker import CircuitBreaker

# LLM services
anthropic_breaker = CircuitBreaker(
    name="anthropic",
    failure_threshold=3,
    recovery_timeout=60.0,
)

openai_breaker = CircuitBreaker(
    name="openai",
    failure_threshold=3,
    recovery_timeout=60.0,
)

# External APIs
youtube_breaker = CircuitBreaker(
    name="youtube",
    failure_threshold=5,
    recovery_timeout=120.0,
)

# Get breaker for service
def get_breaker(service: str) -> CircuitBreaker:
    return {
        "anthropic": anthropic_breaker,
        "openai": openai_breaker,
        "youtube": youtube_breaker,
    }.get(service, CircuitBreaker(name=service))
```

### Handling Circuit Open in Workflow

```python
async def agent_node(state: AnalysisState) -> dict:
    """Agent with circuit breaker handling."""
    breaker = get_breaker("anthropic")

    try:
        result = await breaker.call(run_analysis, state["raw_content"])
        return {"findings": [result], "completed_agent_count": 1}

    except CircuitOpenError as e:
        # Option 1: Return empty (agent skipped)
        return {
            "findings": [],
            "completed_agent_count": 1,
            "skipped_reason": f"circuit_open:{e.name}",
        }

        # Option 2: Use fallback LLM
        fallback_breaker = get_breaker("openai")
        try:
            result = await fallback_breaker.call(run_analysis, state["raw_content"])
            return {"findings": [result], "completed_agent_count": 1, "fallback": True}
        except CircuitOpenError:
            return {"findings": [], "completed_agent_count": 1, "all_circuits_open": True}
```

## Bulkhead Integration

### Tier-Based Bulkheads

```python
# backend/app/shared/resilience/bulkheads.py

from app.shared.resilience.bulkhead import Bulkhead, Tier

# Tier 1: Critical operations (fail fast - 180s max)
tier1_bulkhead = Bulkhead(
    name="critical",
    tier=Tier.CRITICAL,
    max_concurrent=5,
    queue_size=10,
    timeout=180.0,
)

# Tier 2: Standard analysis (Issue #588: 8 agents → 8 workers)
tier2_bulkhead = Bulkhead(
    name="analysis",
    tier=Tier.STANDARD,
    max_concurrent=8,
    queue_size=12,
    timeout=120.0,
)

# Tier 3: Optional enrichment (Issue #588: 4 agents → 4 workers)
tier3_bulkhead = Bulkhead(
    name="enrichment",
    tier=Tier.OPTIONAL,
    max_concurrent=4,
    queue_size=6,
    timeout=60.0,
)

# Agent tier mapping
AGENT_TIERS = {
    "supervisor": tier1_bulkhead,
    "synthesis": tier1_bulkhead,
    "quality_gate": tier1_bulkhead,
    "tech_comparator": tier2_bulkhead,
    "implementation_planner": tier2_bulkhead,
    "security_auditor": tier2_bulkhead,
    "enrichment": tier3_bulkhead,
}
```

### Handling Bulkhead Full

```python
async def agent_node(state: AnalysisState) -> dict:
    """Agent with bulkhead handling."""
    bulkhead = AGENT_TIERS.get("tech_comparator", tier2_bulkhead)

    try:
        result = await bulkhead.execute(
            lambda: run_analysis(state["raw_content"])
        )
        return {"findings": [result], "completed_agent_count": 1}

    except BulkheadFullError:
        # Tier 2+: Skip gracefully
        return {
            "findings": [],
            "completed_agent_count": 1,
            "skipped_reason": "bulkhead_full",
        }

    except BulkheadTimeoutError:
        return {
            "findings": [],
            "completed_agent_count": 1,
            "skipped_reason": "bulkhead_timeout",
        }
```

## Retry Integration

### LangGraph-Aware Retry

```python
async def agent_with_retry(state: AnalysisState) -> dict:
    """Agent with retry that updates state."""
    max_attempts = 3

    for attempt in range(1, max_attempts + 1):
        try:
            result = await run_analysis(state["raw_content"])
            return {
                "findings": [result],
                "completed_agent_count": 1,
                "retry_count": attempt - 1,
            }

        except RetryableError as e:
            if attempt == max_attempts:
                return {
                    "findings": [],
                    "completed_agent_count": 1,
                    "error": str(e),
                    "retry_exhausted": True,
                }

            # Exponential backoff with jitter
            delay = (2 ** attempt) + random.uniform(0, 1)
            await asyncio.sleep(delay)

    return {"findings": [], "completed_agent_count": 1}
```

## Complete Integration Example

```python
# backend/app/domains/analysis/workflows/graph_builder.py

from app.shared.resilience import (
    get_breaker,
    AGENT_TIERS,
    retry,
    CircuitOpenError,
    BulkheadFullError,
)


def create_resilient_agent_node(agent_type: str):
    """Factory for creating resilient agent nodes."""

    circuit = get_breaker("anthropic")
    bulkhead = AGENT_TIERS.get(agent_type, tier2_bulkhead)

    async def node(state: AnalysisState) -> dict:
        """Agent node with full resilience stack."""

        @retry(max_attempts=2, base_delay=1.0)
        async def run_with_retry():
            return await agents[agent_type].analyze(state["raw_content"])

        async def run_with_bulkhead():
            return await bulkhead.execute(run_with_retry)

        try:
            result = await circuit.call(run_with_bulkhead)
            return {
                "findings": [result],
                "completed_agent_count": 1,
            }

        except CircuitOpenError:
            logger.warning(f"Circuit open for {agent_type}")
            return {
                "completed_agent_count": 1,
                "degraded_agents": [agent_type],
            }

        except BulkheadFullError:
            logger.warning(f"Bulkhead full for {agent_type}")
            return {
                "completed_agent_count": 1,
                "skipped_agents": [agent_type],
            }

        except MaxRetriesExceeded as e:
            logger.error(f"Max retries for {agent_type}: {e}")
            return {
                "completed_agent_count": 1,
                "failed_agents": [agent_type],
            }

    return node


def build_resilient_graph() -> StateGraph:
    """Build graph with resilience at every node."""

    workflow = StateGraph(AnalysisState)

    # Create resilient nodes
    for agent_type in ANALYSIS_AGENTS:
        node = create_resilient_agent_node(agent_type)
        workflow.add_node(agent_type, node)
        workflow.add_edge(agent_type, "aggregate")

    # Critical tier nodes
    workflow.add_node("supervisor", create_resilient_supervisor())
    workflow.add_node("synthesis", create_resilient_synthesis())
    workflow.add_node("aggregate", aggregate_node)

    # Build graph
    workflow.set_entry_point("supervisor")
    workflow.add_conditional_edges("supervisor", route_to_agents)
    workflow.add_edge("aggregate", "synthesis")

    return workflow.compile()
```

## Monitoring Integration

```python
# backend/app/shared/resilience/observability.py

from langfuse import Langfuse

langfuse = Langfuse()


def trace_resilience_event(
    event_type: str,
    service: str,
    details: dict,
):
    """Record resilience events in Langfuse."""
    langfuse.event(
        name=f"resilience:{event_type}",
        metadata={
            "service": service,
            **details,
        },
        level="WARNING" if event_type in {"circuit_open", "bulkhead_full"} else "INFO",
    )


# Wire up callbacks
def setup_resilience_observability():
    for name, breaker in circuit_breakers.items():
        breaker._on_state_change = lambda old, new, n: trace_resilience_event(
            "circuit_state_change",
            n,
            {"old_state": old, "new_state": new},
        )

    for name, bulkhead in bulkheads.items():
        bulkhead._on_rejection = lambda n, t: trace_resilience_event(
            "bulkhead_rejection",
            n,
            {"tier": t.name},
        )
```
