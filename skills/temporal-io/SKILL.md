---
name: temporal-io
description: Temporal.io workflow orchestration for durable, fault-tolerant distributed applications. Use when implementing long-running workflows, saga patterns, microservice orchestration, or systems requiring exactly-once execution guarantees.
context: fork
agent: workflow-architect
version: 1.0.0
tags: [temporal, workflow, orchestration, durable-execution, saga, microservices, 2026]
author: SkillForge
user-invocable: false
---

# Temporal.io Workflow Orchestration

Durable execution engine for reliable distributed applications.

## When to Use

- Long-running business processes (days/weeks/months)
- Saga patterns requiring compensation/rollback
- Microservice orchestration with retries
- Systems requiring exactly-once execution guarantees
- Complex state machines with human-in-the-loop
- Scheduled and recurring workflows
- Event-driven process automation

## Quick Reference

### Workflow Definition

```python
from temporalio import workflow
from temporalio.common import RetryPolicy
from datetime import timedelta

@workflow.defn
class OrderWorkflow:
    def __init__(self):
        self._status = "pending"
        self._order_id: str | None = None

    @workflow.run
    async def run(self, order_data: OrderInput) -> OrderResult:
        # Activities are durable - survive worker crashes
        self._order_id = await workflow.execute_activity(
            create_order,
            order_data,
            start_to_close_timeout=timedelta(seconds=30),
            retry_policy=RetryPolicy(
                maximum_attempts=3,
                initial_interval=timedelta(seconds=1),
                backoff_coefficient=2.0,
            ),
        )

        self._status = "processing"

        # Parallel activities
        payment, inventory = await asyncio.gather(
            workflow.execute_activity(
                process_payment,
                PaymentInput(order_id=self._order_id, amount=order_data.total),
                start_to_close_timeout=timedelta(minutes=5),
            ),
            workflow.execute_activity(
                reserve_inventory,
                InventoryInput(order_id=self._order_id, items=order_data.items),
                start_to_close_timeout=timedelta(minutes=2),
            ),
        )

        self._status = "completed"
        return OrderResult(order_id=self._order_id, payment_id=payment.id)

    @workflow.query
    def get_status(self) -> str:
        return self._status

    @workflow.signal
    async def cancel_order(self, reason: str):
        self._status = "cancelling"
        await workflow.execute_activity(
            cancel_order_activity,
            CancelInput(order_id=self._order_id, reason=reason),
            start_to_close_timeout=timedelta(seconds=30),
        )
        self._status = "cancelled"
```

### Activity Definition

```python
from temporalio import activity
from temporalio.exceptions import ApplicationError
import httpx

@activity.defn
async def process_payment(input: PaymentInput) -> PaymentResult:
    """Activities contain the actual business logic."""
    activity.logger.info(f"Processing payment for order {input.order_id}")

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://payments.example.com/charge",
                json={"order_id": input.order_id, "amount": input.amount},
                timeout=30,
            )
            response.raise_for_status()
            return PaymentResult(**response.json())
    except httpx.TimeoutException:
        # Retryable error - Temporal will retry based on policy
        raise
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 402:
            # Non-retryable business error
            raise ApplicationError(
                "Payment declined",
                non_retryable=True,
                type="PaymentDeclined",
            )
        raise

@activity.defn
async def send_notification(input: NotificationInput) -> None:
    """Fire-and-forget activity with heartbeating for long operations."""
    for i, recipient in enumerate(input.recipients):
        # Heartbeat for long-running activities
        activity.heartbeat(f"Sending {i+1}/{len(input.recipients)}")
        await send_email(recipient, input.subject, input.body)
```

### Worker Setup

```python
import asyncio
from temporalio.client import Client
from temporalio.worker import Worker

async def main():
    # Connect to Temporal server
    client = await Client.connect("localhost:7233")

    # Run worker
    worker = Worker(
        client,
        task_queue="order-processing",
        workflows=[OrderWorkflow],
        activities=[
            create_order,
            process_payment,
            reserve_inventory,
            cancel_order_activity,
            send_notification,
        ],
    )

    await worker.run()

if __name__ == "__main__":
    asyncio.run(main())
```

### Client Usage

```python
from temporalio.client import Client

async def start_order_workflow(order_data: OrderInput) -> str:
    client = await Client.connect("localhost:7233")

    # Start workflow
    handle = await client.start_workflow(
        OrderWorkflow.run,
        order_data,
        id=f"order-{order_data.order_id}",
        task_queue="order-processing",
    )

    return handle.id

async def get_order_status(workflow_id: str) -> str:
    client = await Client.connect("localhost:7233")
    handle = client.get_workflow_handle(workflow_id)

    # Query workflow state
    return await handle.query(OrderWorkflow.get_status)

async def cancel_order(workflow_id: str, reason: str):
    client = await Client.connect("localhost:7233")
    handle = client.get_workflow_handle(workflow_id)

    # Signal workflow
    await handle.signal(OrderWorkflow.cancel_order, reason)
```

## Saga Pattern with Compensation

```python
@workflow.defn
class OrderSagaWorkflow:
    """Saga pattern with automatic compensation on failure."""

    @workflow.run
    async def run(self, order: OrderInput) -> OrderResult:
        compensations: list[tuple[Callable, Any]] = []

        try:
            # Step 1: Reserve inventory
            reservation = await workflow.execute_activity(
                reserve_inventory,
                order.items,
                start_to_close_timeout=timedelta(minutes=2),
            )
            compensations.append((release_inventory, reservation.id))

            # Step 2: Process payment
            payment = await workflow.execute_activity(
                charge_payment,
                PaymentInput(order_id=order.id, amount=order.total),
                start_to_close_timeout=timedelta(minutes=5),
            )
            compensations.append((refund_payment, payment.id))

            # Step 3: Create shipment
            shipment = await workflow.execute_activity(
                create_shipment,
                ShipmentInput(order_id=order.id, address=order.shipping_address),
                start_to_close_timeout=timedelta(minutes=3),
            )

            return OrderResult(
                order_id=order.id,
                payment_id=payment.id,
                shipment_id=shipment.id,
            )

        except Exception as e:
            # Run compensations in reverse order
            workflow.logger.warning(f"Saga failed, running {len(compensations)} compensations")
            for compensate_fn, compensate_arg in reversed(compensations):
                try:
                    await workflow.execute_activity(
                        compensate_fn,
                        compensate_arg,
                        start_to_close_timeout=timedelta(minutes=2),
                    )
                except Exception as comp_error:
                    workflow.logger.error(f"Compensation failed: {comp_error}")
            raise
```

## Child Workflows

```python
@workflow.defn
class ParentWorkflow:
    @workflow.run
    async def run(self, orders: list[OrderInput]) -> list[OrderResult]:
        # Start child workflows in parallel
        handles = []
        for order in orders:
            handle = await workflow.start_child_workflow(
                OrderWorkflow.run,
                order,
                id=f"child-order-{order.id}",
            )
            handles.append(handle)

        # Wait for all children to complete
        results = await asyncio.gather(*[h.result() for h in handles])
        return results

@workflow.defn
class RecursiveWorkflow:
    @workflow.run
    async def run(self, depth: int) -> int:
        if depth <= 0:
            return 1

        # Recursive child workflow
        child_result = await workflow.execute_child_workflow(
            RecursiveWorkflow.run,
            depth - 1,
        )
        return child_result + 1
```

## Timers and Scheduling

```python
@workflow.defn
class ScheduledWorkflow:
    @workflow.run
    async def run(self, input: ScheduleInput) -> None:
        while True:
            # Execute activity
            await workflow.execute_activity(
                scheduled_task,
                input,
                start_to_close_timeout=timedelta(minutes=10),
            )

            # Sleep until next run (durable timer)
            await asyncio.sleep(input.interval_seconds)

            # Or use workflow.sleep for better semantics
            # await workflow.sleep(timedelta(hours=1))

@workflow.defn
class TimeoutWorkflow:
    @workflow.run
    async def run(self, input: TaskInput) -> TaskResult:
        # Wait for signal with timeout
        try:
            approval = await workflow.wait_condition(
                lambda: self._approved is not None,
                timeout=timedelta(hours=24),
            )
        except asyncio.TimeoutError:
            # Auto-reject after 24 hours
            return TaskResult(status="auto_rejected")

        return TaskResult(status="approved" if self._approved else "rejected")

    @workflow.signal
    async def approve(self, approved: bool):
        self._approved = approved
```

## Versioning and Updates

```python
@workflow.defn
class VersionedWorkflow:
    @workflow.run
    async def run(self, input: Input) -> Result:
        # Version branching for workflow updates
        version = workflow.patched("new-payment-flow")

        if version:
            # New code path
            result = await workflow.execute_activity(
                new_payment_processor,
                input,
                start_to_close_timeout=timedelta(minutes=5),
            )
        else:
            # Old code path (for running workflows)
            result = await workflow.execute_activity(
                old_payment_processor,
                input,
                start_to_close_timeout=timedelta(minutes=5),
            )

        return result

# Workflow update handler (Temporal 1.10+)
@workflow.defn
class UpdatableWorkflow:
    @workflow.update
    async def update_shipping_address(self, new_address: Address) -> bool:
        if self._status in ("shipped", "delivered"):
            return False
        self._shipping_address = new_address
        return True
```

## Testing

```python
import pytest
from temporalio.testing import WorkflowEnvironment
from temporalio.worker import Worker

@pytest.fixture
async def workflow_env():
    async with await WorkflowEnvironment.start_local() as env:
        yield env

@pytest.mark.asyncio
async def test_order_workflow(workflow_env):
    async with Worker(
        workflow_env.client,
        task_queue="test-queue",
        workflows=[OrderWorkflow],
        activities=[create_order, process_payment, reserve_inventory],
    ):
        # Start workflow
        result = await workflow_env.client.execute_workflow(
            OrderWorkflow.run,
            OrderInput(id="test-1", total=100, items=["item1"]),
            id="test-order-1",
            task_queue="test-queue",
        )

        assert result.order_id == "test-1"

@pytest.mark.asyncio
async def test_workflow_with_mocked_activities(workflow_env):
    """Test with mocked activities."""
    @activity.defn(name="process_payment")
    async def mock_payment(input: PaymentInput) -> PaymentResult:
        return PaymentResult(id="mock-payment-id", status="success")

    async with Worker(
        workflow_env.client,
        task_queue="test-queue",
        workflows=[OrderWorkflow],
        activities=[create_order, mock_payment, reserve_inventory],
    ):
        result = await workflow_env.client.execute_workflow(
            OrderWorkflow.run,
            test_order,
            id="test-mocked",
            task_queue="test-queue",
        )
        assert result.payment_id == "mock-payment-id"

@pytest.mark.asyncio
async def test_workflow_time_skipping(workflow_env):
    """Test with time skipping for timers."""
    async with Worker(
        workflow_env.client,
        task_queue="test-queue",
        workflows=[ScheduledWorkflow],
        activities=[scheduled_task],
    ):
        handle = await workflow_env.client.start_workflow(
            ScheduledWorkflow.run,
            ScheduleInput(interval_seconds=3600),
            id="test-scheduled",
            task_queue="test-queue",
        )

        # Skip ahead 2 hours
        await workflow_env.sleep(timedelta(hours=2))

        # Verify activity ran twice
        # (implementation detail depends on test setup)
```

## Key Decisions

| Decision | Recommendation |
|----------|----------------|
| Workflow ID | Business-meaningful, idempotent (e.g., `order-{order_id}`) |
| Task queue | Per-service or per-workflow-type, not per-activity |
| Activity timeout | `start_to_close` for most cases, `schedule_to_close` for queued |
| Retry policy | 3 attempts default, exponential backoff, idempotent activities |
| Versioning | `workflow.patched()` for breaking changes |
| Testing | `WorkflowEnvironment.start_local()` for integration tests |
| Heartbeating | Required for activities > 60s |

## Anti-Patterns (FORBIDDEN)

```python
# NEVER do non-deterministic operations in workflows
@workflow.defn
class BadWorkflow:
    @workflow.run
    async def run(self):
        # WRONG: Non-deterministic
        if random.random() > 0.5:  # Different on replay!
            pass
        if datetime.now() > deadline:  # Different on replay!
            pass

        # CORRECT: Use workflow APIs
        if await workflow.random() > 0.5:
            pass
        if workflow.now() > deadline:
            pass

# NEVER make network calls directly in workflows
@workflow.defn
class BadWorkflow2:
    @workflow.run
    async def run(self):
        # WRONG: Direct I/O in workflow
        response = await httpx.get("https://api.example.com")

        # CORRECT: Use activities for I/O
        response = await workflow.execute_activity(fetch_data, ...)

# NEVER ignore activity idempotency
@activity.defn
async def bad_activity(order_id: str):
    # WRONG: Creates duplicate on retry
    await db.insert(Order(id=generate_id()))

    # CORRECT: Use idempotency key
    await db.upsert(Order(id=order_id))
```

## Related Skills

- `saga-patterns` - Distributed transaction patterns
- `message-queues` - Event-driven integration
- `resilience-patterns` - Retry and circuit breaker patterns
- `asyncio-advanced` - Python async patterns

## Capability Details

### workflow-definition
**Keywords:** temporal workflow, durable workflow, orchestration, long-running
**Solves:**
- Define fault-tolerant workflows
- Orchestrate microservices
- Long-running business processes

### activities
**Keywords:** temporal activity, side effect, external call, io operation
**Solves:**
- Execute unreliable operations reliably
- Automatic retry with backoff
- Heartbeating for long operations

### signals-queries
**Keywords:** temporal signal, query, workflow state, external input
**Solves:**
- Send external input to running workflows
- Query workflow state without affecting execution
- Human-in-the-loop approval workflows

### saga-compensation
**Keywords:** saga, compensation, rollback, distributed transaction
**Solves:**
- Implement saga pattern with automatic compensation
- Handle partial failures in distributed systems
- Maintain consistency across services

### testing
**Keywords:** temporal testing, workflow test, time skipping
**Solves:**
- Unit test workflows with mocked activities
- Integration test with local Temporal server
- Time skipping for timer-heavy workflows
