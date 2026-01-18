---
name: saga-patterns
description: Saga patterns for distributed transactions with orchestration and choreography approaches. Use when implementing multi-service transactions, handling partial failures, or building systems requiring eventual consistency with compensation.
context: fork
agent: event-driven-architect
version: 1.0.0
tags: [saga, distributed-transactions, orchestration, choreography, compensation, microservices, 2026]
author: SkillForge
user-invocable: false
---

# Saga Patterns for Distributed Transactions

Maintain consistency across microservices without distributed locks.

## When to Use

- Multi-service business transactions (order -> payment -> inventory -> shipping)
- Operations that must eventually succeed or roll back completely
- Systems requiring compensation/rollback on failure
- Long-running business processes (minutes to days)
- Microservice architectures avoiding 2PC (two-phase commit)
- When ACID across services is impractical

## When NOT to Use

- Single database operations (use transactions)
- Real-time consistency requirements (use synchronous calls)
- Simple request-response patterns
- When eventual consistency is unacceptable

## Orchestration vs Choreography

| Aspect | Orchestration | Choreography |
|--------|---------------|--------------|
| Control | Central orchestrator | Distributed events |
| Coupling | Services depend on orchestrator | Services loosely coupled |
| Visibility | Single point of observation | Requires distributed tracing |
| Complexity | Orchestrator can be complex | Event flow can be complex |
| Testing | Easier to test centrally | Requires integration tests |
| Best for | Complex, ordered workflows | Simple, parallel flows |

## Orchestration Pattern

### Saga Orchestrator

```python
from enum import Enum
from dataclasses import dataclass, field
from typing import Callable, Any
from datetime import datetime, timezone
import asyncio

class SagaStatus(Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    COMPENSATING = "compensating"
    FAILED = "failed"
    COMPENSATED = "compensated"

@dataclass
class SagaStep:
    name: str
    action: Callable
    compensation: Callable
    status: SagaStatus = SagaStatus.PENDING
    result: Any = None
    error: str | None = None

@dataclass
class SagaContext:
    saga_id: str
    data: dict = field(default_factory=dict)
    steps: list[SagaStep] = field(default_factory=list)
    status: SagaStatus = SagaStatus.PENDING
    started_at: datetime | None = None
    completed_at: datetime | None = None
    current_step: int = 0

class SagaOrchestrator:
    def __init__(self, saga_repository, event_publisher):
        self.repo = saga_repository
        self.publisher = event_publisher

    async def execute(self, saga: SagaContext) -> SagaContext:
        saga.status = SagaStatus.RUNNING
        saga.started_at = datetime.now(timezone.utc)
        await self.repo.save(saga)

        try:
            for i, step in enumerate(saga.steps):
                saga.current_step = i
                step.status = SagaStatus.RUNNING
                await self.repo.save(saga)

                try:
                    step.result = await step.action(saga.data)
                    saga.data.update(step.result or {})
                    step.status = SagaStatus.COMPLETED

                    await self.publisher.publish(
                        f"saga.{saga.saga_id}.step.{step.name}.completed",
                        {"saga_id": saga.saga_id, "step": step.name, "result": step.result},
                    )

                except Exception as e:
                    step.status = SagaStatus.FAILED
                    step.error = str(e)
                    await self.repo.save(saga)

                    # Start compensation
                    await self._compensate(saga, i)
                    return saga

            saga.status = SagaStatus.COMPLETED
            saga.completed_at = datetime.now(timezone.utc)
            await self.repo.save(saga)

            await self.publisher.publish(
                f"saga.{saga.saga_id}.completed",
                {"saga_id": saga.saga_id, "status": "completed"},
            )

        except Exception as e:
            saga.status = SagaStatus.FAILED
            await self.repo.save(saga)
            raise

        return saga

    async def _compensate(self, saga: SagaContext, failed_step: int):
        saga.status = SagaStatus.COMPENSATING
        await self.repo.save(saga)

        await self.publisher.publish(
            f"saga.{saga.saga_id}.compensating",
            {"saga_id": saga.saga_id, "failed_step": failed_step},
        )

        # Compensate in reverse order
        for i in range(failed_step - 1, -1, -1):
            step = saga.steps[i]
            if step.status == SagaStatus.COMPLETED:
                try:
                    await step.compensation(saga.data)
                    step.status = SagaStatus.COMPENSATED
                except Exception as e:
                    # Log compensation failure, continue with others
                    step.error = f"Compensation failed: {e}"
                    # May need manual intervention
                await self.repo.save(saga)

        saga.status = SagaStatus.COMPENSATED
        saga.completed_at = datetime.now(timezone.utc)
        await self.repo.save(saga)

        await self.publisher.publish(
            f"saga.{saga.saga_id}.compensated",
            {"saga_id": saga.saga_id},
        )
```

### Order Saga Example

```python
class OrderSaga:
    def __init__(
        self,
        payment_service,
        inventory_service,
        shipping_service,
        notification_service,
    ):
        self.payment = payment_service
        self.inventory = inventory_service
        self.shipping = shipping_service
        self.notification = notification_service

    def create_saga(self, order: Order) -> SagaContext:
        return SagaContext(
            saga_id=f"order-{order.id}",
            data={"order": order.dict()},
            steps=[
                SagaStep(
                    name="reserve_inventory",
                    action=self._reserve_inventory,
                    compensation=self._release_inventory,
                ),
                SagaStep(
                    name="process_payment",
                    action=self._process_payment,
                    compensation=self._refund_payment,
                ),
                SagaStep(
                    name="create_shipment",
                    action=self._create_shipment,
                    compensation=self._cancel_shipment,
                ),
                SagaStep(
                    name="send_confirmation",
                    action=self._send_confirmation,
                    compensation=self._send_cancellation,
                ),
            ],
        )

    async def _reserve_inventory(self, data: dict) -> dict:
        order = data["order"]
        reservation = await self.inventory.reserve(
            items=order["items"],
            order_id=order["id"],
        )
        return {"reservation_id": reservation.id}

    async def _release_inventory(self, data: dict):
        await self.inventory.release(data["reservation_id"])

    async def _process_payment(self, data: dict) -> dict:
        order = data["order"]
        payment = await self.payment.charge(
            amount=order["total"],
            customer_id=order["customer_id"],
            order_id=order["id"],
        )
        return {"payment_id": payment.id}

    async def _refund_payment(self, data: dict):
        await self.payment.refund(data["payment_id"])

    async def _create_shipment(self, data: dict) -> dict:
        order = data["order"]
        shipment = await self.shipping.create(
            order_id=order["id"],
            address=order["shipping_address"],
            items=order["items"],
        )
        return {"shipment_id": shipment.id, "tracking_number": shipment.tracking}

    async def _cancel_shipment(self, data: dict):
        if "shipment_id" in data:
            await self.shipping.cancel(data["shipment_id"])

    async def _send_confirmation(self, data: dict) -> dict:
        order = data["order"]
        await self.notification.send(
            user_id=order["customer_id"],
            template="order_confirmed",
            data={
                "order_id": order["id"],
                "tracking": data.get("tracking_number"),
            },
        )
        return {}

    async def _send_cancellation(self, data: dict):
        order = data["order"]
        await self.notification.send(
            user_id=order["customer_id"],
            template="order_cancelled",
            data={"order_id": order["id"]},
        )
```

## Choreography Pattern

### Event-Driven Saga

```python
from dataclasses import dataclass
from typing import Literal
import json

@dataclass
class SagaEvent:
    saga_id: str
    event_type: str
    payload: dict
    timestamp: datetime

class OrderChoreography:
    """Event handlers for order saga choreography."""

    def __init__(self, event_bus, order_repo):
        self.bus = event_bus
        self.repo = order_repo

    async def handle_order_created(self, event: SagaEvent):
        """Order service publishes, Inventory service handles."""
        order = event.payload["order"]

        # Inventory service handles this
        await self.bus.publish(
            "inventory.reserve.requested",
            {
                "saga_id": event.saga_id,
                "order_id": order["id"],
                "items": order["items"],
            },
        )

    async def handle_inventory_reserved(self, event: SagaEvent):
        """Inventory service publishes, Payment service handles."""
        await self.bus.publish(
            "payment.charge.requested",
            {
                "saga_id": event.saga_id,
                "order_id": event.payload["order_id"],
                "amount": event.payload["amount"],
                "reservation_id": event.payload["reservation_id"],
            },
        )

    async def handle_inventory_failed(self, event: SagaEvent):
        """Inventory service publishes, Order service handles."""
        order = await self.repo.get(event.payload["order_id"])
        order.status = "failed"
        order.failure_reason = "Insufficient inventory"
        await self.repo.save(order)

        await self.bus.publish(
            "notification.send.requested",
            {
                "saga_id": event.saga_id,
                "user_id": order.customer_id,
                "template": "order_failed",
                "data": {"reason": "Items out of stock"},
            },
        )

    async def handle_payment_completed(self, event: SagaEvent):
        """Payment service publishes, Shipping service handles."""
        await self.bus.publish(
            "shipping.create.requested",
            {
                "saga_id": event.saga_id,
                "order_id": event.payload["order_id"],
                "payment_id": event.payload["payment_id"],
            },
        )

    async def handle_payment_failed(self, event: SagaEvent):
        """Payment service publishes, triggers compensation."""
        # Release inventory (compensation)
        await self.bus.publish(
            "inventory.release.requested",
            {
                "saga_id": event.saga_id,
                "reservation_id": event.payload["reservation_id"],
            },
        )

        # Update order status
        order = await self.repo.get(event.payload["order_id"])
        order.status = "payment_failed"
        await self.repo.save(order)

    async def handle_shipment_created(self, event: SagaEvent):
        """Shipping service publishes, Order service completes saga."""
        order = await self.repo.get(event.payload["order_id"])
        order.status = "shipped"
        order.tracking_number = event.payload["tracking_number"]
        await self.repo.save(order)

        await self.bus.publish(
            "notification.send.requested",
            {
                "saga_id": event.saga_id,
                "user_id": order.customer_id,
                "template": "order_shipped",
                "data": {"tracking": event.payload["tracking_number"]},
            },
        )
```

### Event Router

```python
class SagaEventRouter:
    """Routes saga events to appropriate handlers."""

    def __init__(self):
        self.handlers: dict[str, list[Callable]] = {}

    def on(self, event_type: str):
        def decorator(handler: Callable):
            if event_type not in self.handlers:
                self.handlers[event_type] = []
            self.handlers[event_type].append(handler)
            return handler
        return decorator

    async def route(self, event: SagaEvent):
        handlers = self.handlers.get(event.event_type, [])
        for handler in handlers:
            try:
                await handler(event)
            except Exception as e:
                # Log and continue with other handlers
                logger.error(f"Handler failed for {event.event_type}: {e}")


# Usage
router = SagaEventRouter()

@router.on("order.created")
async def on_order_created(event: SagaEvent):
    await inventory_service.reserve(event.payload)

@router.on("inventory.reserved")
async def on_inventory_reserved(event: SagaEvent):
    await payment_service.charge(event.payload)

@router.on("payment.failed")
async def on_payment_failed(event: SagaEvent):
    # Compensation
    await inventory_service.release(event.payload["reservation_id"])
```

## State Machine Saga

```python
from enum import Enum, auto
from transitions import Machine

class OrderState(Enum):
    PENDING = auto()
    INVENTORY_RESERVED = auto()
    PAYMENT_PROCESSING = auto()
    PAYMENT_COMPLETED = auto()
    SHIPPING_CREATED = auto()
    COMPLETED = auto()
    COMPENSATING = auto()
    FAILED = auto()

class OrderSagaStateMachine:
    states = [s.name for s in OrderState]

    transitions = [
        # Forward flow
        {"trigger": "reserve_inventory", "source": "PENDING", "dest": "INVENTORY_RESERVED", "after": "_on_inventory_reserved"},
        {"trigger": "process_payment", "source": "INVENTORY_RESERVED", "dest": "PAYMENT_PROCESSING", "after": "_on_payment_processing"},
        {"trigger": "payment_success", "source": "PAYMENT_PROCESSING", "dest": "PAYMENT_COMPLETED", "after": "_on_payment_completed"},
        {"trigger": "create_shipment", "source": "PAYMENT_COMPLETED", "dest": "SHIPPING_CREATED", "after": "_on_shipment_created"},
        {"trigger": "complete", "source": "SHIPPING_CREATED", "dest": "COMPLETED", "after": "_on_completed"},

        # Compensation flow
        {"trigger": "payment_failed", "source": "PAYMENT_PROCESSING", "dest": "COMPENSATING", "after": "_compensate_from_payment"},
        {"trigger": "shipment_failed", "source": "PAYMENT_COMPLETED", "dest": "COMPENSATING", "after": "_compensate_from_shipment"},
        {"trigger": "compensation_done", "source": "COMPENSATING", "dest": "FAILED"},
    ]

    def __init__(self, order_id: str, services: dict):
        self.order_id = order_id
        self.services = services
        self.data = {}

        self.machine = Machine(
            model=self,
            states=self.states,
            transitions=self.transitions,
            initial="PENDING",
        )

    async def _on_inventory_reserved(self):
        result = await self.services["inventory"].reserve(self.order_id)
        self.data["reservation_id"] = result.id

    async def _on_payment_processing(self):
        pass  # Trigger async payment

    async def _on_payment_completed(self):
        result = await self.services["payment"].get_result(self.order_id)
        self.data["payment_id"] = result.id

    async def _on_shipment_created(self):
        result = await self.services["shipping"].create(self.order_id)
        self.data["shipment_id"] = result.id

    async def _on_completed(self):
        await self.services["notification"].send_confirmation(self.order_id)

    async def _compensate_from_payment(self):
        await self.services["inventory"].release(self.data["reservation_id"])
        await self.compensation_done()

    async def _compensate_from_shipment(self):
        await self.services["payment"].refund(self.data["payment_id"])
        await self.services["inventory"].release(self.data["reservation_id"])
        await self.compensation_done()
```

## Timeout and Recovery

```python
from datetime import datetime, timedelta, timezone

class SagaRecovery:
    """Handles stuck and failed sagas."""

    def __init__(self, saga_repo, orchestrator):
        self.repo = saga_repo
        self.orchestrator = orchestrator

    async def recover_stuck_sagas(self, timeout: timedelta = timedelta(hours=1)):
        """Find and recover sagas stuck in RUNNING state."""
        cutoff = datetime.now(timezone.utc) - timeout
        stuck_sagas = await self.repo.find_by_status_and_age(
            status=SagaStatus.RUNNING,
            older_than=cutoff,
        )

        for saga in stuck_sagas:
            logger.warning(f"Recovering stuck saga: {saga.saga_id}")

            # Option 1: Resume from current step
            try:
                await self.orchestrator.resume(saga)
            except Exception as e:
                # Option 2: Trigger compensation
                logger.error(f"Resume failed, compensating: {e}")
                await self.orchestrator._compensate(saga, saga.current_step)

    async def retry_failed_step(self, saga_id: str, max_retries: int = 3):
        """Retry a failed saga step with exponential backoff."""
        saga = await self.repo.get(saga_id)
        if saga.status != SagaStatus.FAILED:
            raise ValueError(f"Saga {saga_id} is not in FAILED state")

        failed_step = saga.steps[saga.current_step]

        for attempt in range(max_retries):
            try:
                failed_step.result = await failed_step.action(saga.data)
                failed_step.status = SagaStatus.COMPLETED
                await self.repo.save(saga)

                # Continue with remaining steps
                await self.orchestrator.resume(saga, from_step=saga.current_step + 1)
                return

            except Exception as e:
                wait_time = (2 ** attempt) + random.uniform(0, 1)
                logger.warning(f"Retry {attempt + 1} failed, waiting {wait_time}s: {e}")
                await asyncio.sleep(wait_time)

        # All retries failed, compensate
        await self.orchestrator._compensate(saga, saga.current_step)


class SagaTimeout:
    """Per-step timeout handling."""

    @staticmethod
    async def with_timeout(coro, timeout_seconds: int, fallback=None):
        try:
            return await asyncio.wait_for(coro, timeout=timeout_seconds)
        except asyncio.TimeoutError:
            if fallback:
                return await fallback()
            raise SagaTimeoutError(f"Step timed out after {timeout_seconds}s")
```

## Idempotency

```python
class IdempotentSagaStep:
    """Ensures saga steps are idempotent."""

    def __init__(self, step_name: str, idempotency_store):
        self.step_name = step_name
        self.store = idempotency_store

    async def execute(
        self,
        saga_id: str,
        action: Callable,
        *args,
        **kwargs,
    ):
        idempotency_key = f"{saga_id}:{self.step_name}"

        # Check if already executed
        existing = await self.store.get(idempotency_key)
        if existing:
            return existing["result"]

        # Execute and store result
        result = await action(*args, **kwargs)

        await self.store.set(
            idempotency_key,
            {"result": result, "executed_at": datetime.now(timezone.utc).isoformat()},
            ttl=timedelta(days=7),
        )

        return result


# Usage in saga step
async def _reserve_inventory(self, data: dict) -> dict:
    step = IdempotentSagaStep("reserve_inventory", self.idempotency_store)
    return await step.execute(
        data["saga_id"],
        self.inventory.reserve,
        items=data["order"]["items"],
    )
```

## Key Decisions

| Decision | Recommendation |
|----------|----------------|
| Pattern choice | Orchestration for complex flows, Choreography for simple |
| State storage | Persistent store (PostgreSQL) for saga state |
| Idempotency | Required for all saga steps |
| Timeouts | Per-step timeouts with recovery |
| Compensation | Always implement, test thoroughly |
| Observability | Trace saga ID across all services |
| Testing | Unit test steps, integration test full saga |

## Anti-Patterns (FORBIDDEN)

```python
# NEVER skip compensation logic
async def _process_payment(self, data: dict) -> dict:
    return await self.payment.charge(data)
    # Missing compensation = data inconsistency on failure!

# NEVER rely on synchronous calls across services
async def _reserve_and_pay(self, data: dict):
    await self.inventory.reserve(data)
    await self.payment.charge(data)  # If this fails, inventory is stuck!

# NEVER ignore idempotency
async def _create_order(self, data: dict):
    return await self.db.insert(Order(**data))  # Duplicate on retry!

# NEVER use in-memory saga state
sagas = {}  # Lost on restart!

# ALWAYS persist saga state
await self.repo.save(saga)

# ALWAYS test compensation paths
@pytest.mark.asyncio
async def test_saga_compensation_on_payment_failure():
    # Verify inventory is released when payment fails
```

## Related Skills

- `temporal-io` - Durable workflow execution
- `event-sourcing` - Event-driven state management
- `message-queues` - Reliable event delivery
- `idempotency-patterns` - Idempotent operations

## Capability Details

### orchestration-saga
**Keywords:** saga orchestrator, central coordinator, workflow orchestration
**Solves:**
- Centrally coordinated multi-step transactions
- Complex ordered workflows
- Saga state management

### choreography-saga
**Keywords:** event-driven saga, choreography, decentralized
**Solves:**
- Loosely coupled service transactions
- Event-based coordination
- Parallel saga steps

### compensation
**Keywords:** compensation, rollback, undo, compensating transaction
**Solves:**
- Rollback completed steps on failure
- Maintain eventual consistency
- Handle partial failures

### saga-recovery
**Keywords:** saga recovery, timeout, retry, stuck saga
**Solves:**
- Recover from stuck sagas
- Retry failed steps
- Handle timeouts
