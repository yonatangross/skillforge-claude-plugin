---
name: cqrs-patterns
description: CQRS (Command Query Responsibility Segregation) patterns for separating read and write models. Use when optimizing read-heavy systems, implementing event sourcing, or building systems with different read/write scaling requirements.
context: fork
agent: event-driven-architect
version: 1.0.0
tags: [cqrs, command-query, read-model, write-model, projection, event-sourcing, 2026]
author: SkillForge
user-invocable: false
---

# CQRS Patterns

Separate read and write concerns for optimized data access.

## When to Use

- Read-heavy workloads with complex queries
- Different scaling requirements for reads vs writes
- Event sourcing implementations
- Multiple read model representations of same data
- Systems requiring audit trails
- Complex domain models with simple read requirements
- Microservices with eventual consistency

## When NOT to Use

- Simple CRUD applications
- Single-user systems
- Strong consistency requirements everywhere
- Small datasets with simple queries
- When added complexity outweighs benefits

## Quick Reference

### Architecture Overview

```
┌─────────────────┐         ┌─────────────────┐
│   Write Side    │         │   Read Side     │
├─────────────────┤         ├─────────────────┤
│                 │         │                 │
│  ┌───────────┐  │         │  ┌───────────┐  │
│  │ Commands  │  │         │  │  Queries  │  │
│  └─────┬─────┘  │         │  └─────┬─────┘  │
│        │        │         │        │        │
│  ┌─────▼─────┐  │         │  ┌─────▼─────┐  │
│  │ Aggregate │  │         │  │Read Model │  │
│  └─────┬─────┘  │         │  │ (View DB) │  │
│        │        │         │  └───────────┘  │
│  ┌─────▼─────┐  │         │        ▲        │
│  │  Events   │──┼─────────┼────────┘        │
│  └───────────┘  │ Publish │   Project       │
│                 │         │                 │
└─────────────────┘         └─────────────────┘
```

## Command Side (Write Model)

### Command Definition

```python
from pydantic import BaseModel, Field
from uuid import UUID, uuid4
from datetime import datetime, timezone
from typing import Annotated

class Command(BaseModel):
    """Base command with metadata."""
    command_id: UUID = Field(default_factory=uuid4)
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    user_id: UUID | None = None

class CreateOrder(Command):
    customer_id: UUID
    items: list[OrderItem]
    shipping_address: Address

class AddOrderItem(Command):
    order_id: UUID
    product_id: UUID
    quantity: int
    unit_price: float

class CancelOrder(Command):
    order_id: UUID
    reason: str

class UpdateShippingAddress(Command):
    order_id: UUID
    new_address: Address
```

### Command Handler

```python
from abc import ABC, abstractmethod

class CommandHandler(ABC):
    @abstractmethod
    async def handle(self, command: Command) -> list["DomainEvent"]:
        pass

class CreateOrderHandler(CommandHandler):
    def __init__(self, order_repo, inventory_service):
        self.order_repo = order_repo
        self.inventory = inventory_service

    async def handle(self, command: CreateOrder) -> list[DomainEvent]:
        # Validate business rules
        for item in command.items:
            available = await self.inventory.check_availability(
                item.product_id, item.quantity
            )
            if not available:
                raise InsufficientInventoryError(item.product_id)

        # Create aggregate
        order = Order.create(
            customer_id=command.customer_id,
            items=command.items,
            shipping_address=command.shipping_address,
        )

        # Save and return events
        await self.order_repo.save(order)
        return order.pending_events


class CommandBus:
    def __init__(self):
        self._handlers: dict[type, CommandHandler] = {}

    def register(self, command_type: type, handler: CommandHandler):
        self._handlers[command_type] = handler

    async def dispatch(self, command: Command) -> list[DomainEvent]:
        handler = self._handlers.get(type(command))
        if not handler:
            raise NoHandlerFoundError(type(command))

        events = await handler.handle(command)

        # Publish events for projections
        for event in events:
            await self.event_publisher.publish(event)

        return events


# Usage
command_bus = CommandBus()
command_bus.register(CreateOrder, CreateOrderHandler(order_repo, inventory))
command_bus.register(AddOrderItem, AddOrderItemHandler(order_repo))
command_bus.register(CancelOrder, CancelOrderHandler(order_repo))

events = await command_bus.dispatch(CreateOrder(
    customer_id=customer_id,
    items=items,
    shipping_address=address,
))
```

### Write Model (Aggregate)

```python
from dataclasses import dataclass, field

@dataclass
class Order:
    id: UUID
    customer_id: UUID
    items: list[OrderItem]
    status: OrderStatus
    shipping_address: Address
    _pending_events: list[DomainEvent] = field(default_factory=list)

    @classmethod
    def create(cls, customer_id: UUID, items: list, shipping_address: Address) -> "Order":
        order = cls(
            id=uuid4(),
            customer_id=customer_id,
            items=[],
            status=OrderStatus.PENDING,
            shipping_address=shipping_address,
        )

        # Add items and raise events
        for item in items:
            order._add_item(item)

        order._raise_event(OrderCreated(
            order_id=order.id,
            customer_id=customer_id,
            shipping_address=shipping_address,
        ))

        return order

    def add_item(self, product_id: UUID, quantity: int, unit_price: float):
        if self.status != OrderStatus.PENDING:
            raise InvalidOperationError("Cannot add items to non-pending order")

        item = OrderItem(product_id, quantity, unit_price)
        self._add_item(item)

    def _add_item(self, item: OrderItem):
        self.items.append(item)
        self._raise_event(OrderItemAdded(
            order_id=self.id,
            product_id=item.product_id,
            quantity=item.quantity,
            unit_price=item.unit_price,
        ))

    def cancel(self, reason: str):
        if self.status == OrderStatus.SHIPPED:
            raise InvalidOperationError("Cannot cancel shipped order")

        self.status = OrderStatus.CANCELLED
        self._raise_event(OrderCancelled(
            order_id=self.id,
            reason=reason,
        ))

    def _raise_event(self, event: DomainEvent):
        self._pending_events.append(event)

    @property
    def pending_events(self) -> list[DomainEvent]:
        events = self._pending_events.copy()
        self._pending_events.clear()
        return events
```

## Query Side (Read Model)

### Query Definition

```python
class Query(BaseModel):
    """Base query."""
    pass

class GetOrderById(Query):
    order_id: UUID

class GetOrdersByCustomer(Query):
    customer_id: UUID
    status: OrderStatus | None = None
    page: int = 1
    page_size: int = 20

class SearchOrders(Query):
    query: str
    filters: dict = {}
    sort_by: str = "created_at"
    sort_order: str = "desc"

class GetOrderStatistics(Query):
    customer_id: UUID | None = None
    from_date: datetime | None = None
    to_date: datetime | None = None
```

### Query Handler

```python
class QueryHandler(ABC):
    @abstractmethod
    async def handle(self, query: Query) -> Any:
        pass

class GetOrderByIdHandler(QueryHandler):
    def __init__(self, read_db):
        self.db = read_db

    async def handle(self, query: GetOrderById) -> OrderView | None:
        row = await self.db.fetchrow(
            """
            SELECT id, customer_id, customer_name, status,
                   total_amount, item_count, created_at, updated_at
            FROM order_summary
            WHERE id = $1
            """,
            query.order_id,
        )
        return OrderView(**row) if row else None


class GetOrdersByCustomerHandler(QueryHandler):
    def __init__(self, read_db):
        self.db = read_db

    async def handle(self, query: GetOrdersByCustomer) -> PaginatedResult[OrderView]:
        conditions = ["customer_id = $1"]
        params = [query.customer_id]

        if query.status:
            conditions.append("status = $2")
            params.append(query.status.value)

        where_clause = " AND ".join(conditions)
        offset = (query.page - 1) * query.page_size

        rows = await self.db.fetch(
            f"""
            SELECT * FROM order_summary
            WHERE {where_clause}
            ORDER BY created_at DESC
            LIMIT $3 OFFSET $4
            """,
            *params, query.page_size, offset,
        )

        total = await self.db.fetchval(
            f"SELECT COUNT(*) FROM order_summary WHERE {where_clause}",
            *params,
        )

        return PaginatedResult(
            items=[OrderView(**row) for row in rows],
            total=total,
            page=query.page,
            page_size=query.page_size,
        )


class QueryBus:
    def __init__(self):
        self._handlers: dict[type, QueryHandler] = {}

    def register(self, query_type: type, handler: QueryHandler):
        self._handlers[query_type] = handler

    async def dispatch(self, query: Query) -> Any:
        handler = self._handlers.get(type(query))
        if not handler:
            raise NoHandlerFoundError(type(query))
        return await handler.handle(query)
```

### Read Model (View)

```python
from pydantic import BaseModel

class OrderView(BaseModel):
    """Denormalized read model for orders."""
    id: UUID
    customer_id: UUID
    customer_name: str  # Denormalized from customer
    customer_email: str
    status: str
    total_amount: float
    item_count: int
    items: list[OrderItemView]
    shipping_address: AddressView
    created_at: datetime
    updated_at: datetime

class OrderItemView(BaseModel):
    product_id: UUID
    product_name: str  # Denormalized from product
    quantity: int
    unit_price: float
    subtotal: float

class OrderStatisticsView(BaseModel):
    """Pre-computed statistics."""
    total_orders: int
    total_revenue: float
    average_order_value: float
    orders_by_status: dict[str, int]
    top_products: list[ProductSummary]
```

## Projections

### Event Handler Projection

```python
class OrderProjection:
    """Projects events to read models."""

    def __init__(self, read_db, customer_service, product_service):
        self.db = read_db
        self.customers = customer_service
        self.products = product_service

    async def handle(self, event: DomainEvent):
        match event:
            case OrderCreated():
                await self._on_order_created(event)
            case OrderItemAdded():
                await self._on_item_added(event)
            case OrderCancelled():
                await self._on_order_cancelled(event)

    async def _on_order_created(self, event: OrderCreated):
        # Fetch denormalized data
        customer = await self.customers.get(event.customer_id)

        await self.db.execute(
            """
            INSERT INTO order_summary (
                id, customer_id, customer_name, customer_email,
                status, total_amount, item_count, shipping_address,
                created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9)
            """,
            event.order_id,
            event.customer_id,
            customer.name,
            customer.email,
            "pending",
            0.0,
            0,
            json.dumps(event.shipping_address.dict()),
            event.timestamp,
        )

    async def _on_item_added(self, event: OrderItemAdded):
        # Fetch product details
        product = await self.products.get(event.product_id)
        subtotal = event.quantity * event.unit_price

        # Insert item
        await self.db.execute(
            """
            INSERT INTO order_items (
                order_id, product_id, product_name, quantity,
                unit_price, subtotal
            ) VALUES ($1, $2, $3, $4, $5, $6)
            """,
            event.order_id,
            event.product_id,
            product.name,
            event.quantity,
            event.unit_price,
            subtotal,
        )

        # Update summary
        await self.db.execute(
            """
            UPDATE order_summary
            SET total_amount = total_amount + $1,
                item_count = item_count + 1,
                updated_at = $2
            WHERE id = $3
            """,
            subtotal, event.timestamp, event.order_id,
        )

    async def _on_order_cancelled(self, event: OrderCancelled):
        await self.db.execute(
            """
            UPDATE order_summary
            SET status = 'cancelled', updated_at = $1
            WHERE id = $2
            """,
            event.timestamp, event.order_id,
        )


class ProjectionRunner:
    """Runs projections from event stream."""

    def __init__(self, event_store, projections: list):
        self.event_store = event_store
        self.projections = projections
        self._checkpoint = 0

    async def run_forever(self):
        while True:
            events = await self.event_store.get_events_from(self._checkpoint)

            for event in events:
                for projection in self.projections:
                    try:
                        await projection.handle(event)
                    except Exception as e:
                        logger.error(f"Projection failed: {e}")
                        # Continue with other projections

                self._checkpoint = event.sequence_number

            await asyncio.sleep(0.1)  # Polling interval

    async def rebuild(self, projection):
        """Rebuild a projection from scratch."""
        await projection.reset()

        async for event in self.event_store.get_all_events():
            await projection.handle(event)
```

## FastAPI Integration

```python
from fastapi import FastAPI, Depends, HTTPException

app = FastAPI()

# Dependency injection
def get_command_bus() -> CommandBus:
    return command_bus

def get_query_bus() -> QueryBus:
    return query_bus

# Write endpoints (Commands)
@app.post("/api/v1/orders", status_code=201)
async def create_order(
    request: CreateOrderRequest,
    bus: CommandBus = Depends(get_command_bus),
):
    command = CreateOrder(
        customer_id=request.customer_id,
        items=request.items,
        shipping_address=request.shipping_address,
    )

    try:
        events = await bus.dispatch(command)
        order_id = events[0].order_id  # OrderCreated event
        return {"order_id": order_id}
    except InsufficientInventoryError as e:
        raise HTTPException(400, f"Insufficient inventory: {e}")

@app.post("/api/v1/orders/{order_id}/items")
async def add_order_item(
    order_id: UUID,
    request: AddItemRequest,
    bus: CommandBus = Depends(get_command_bus),
):
    command = AddOrderItem(
        order_id=order_id,
        product_id=request.product_id,
        quantity=request.quantity,
        unit_price=request.unit_price,
    )
    await bus.dispatch(command)
    return {"status": "item_added"}

@app.delete("/api/v1/orders/{order_id}")
async def cancel_order(
    order_id: UUID,
    reason: str,
    bus: CommandBus = Depends(get_command_bus),
):
    await bus.dispatch(CancelOrder(order_id=order_id, reason=reason))
    return {"status": "cancelled"}

# Read endpoints (Queries)
@app.get("/api/v1/orders/{order_id}")
async def get_order(
    order_id: UUID,
    bus: QueryBus = Depends(get_query_bus),
):
    order = await bus.dispatch(GetOrderById(order_id=order_id))
    if not order:
        raise HTTPException(404, "Order not found")
    return order

@app.get("/api/v1/customers/{customer_id}/orders")
async def get_customer_orders(
    customer_id: UUID,
    status: OrderStatus | None = None,
    page: int = 1,
    bus: QueryBus = Depends(get_query_bus),
):
    return await bus.dispatch(GetOrdersByCustomer(
        customer_id=customer_id,
        status=status,
        page=page,
    ))

@app.get("/api/v1/orders/search")
async def search_orders(
    q: str,
    bus: QueryBus = Depends(get_query_bus),
):
    return await bus.dispatch(SearchOrders(query=q))
```

## Multiple Read Models

```python
# Different views for different purposes

class OrderListProjection:
    """Optimized for listing orders."""
    table = "order_list_view"

class OrderDetailProjection:
    """Full order details with items."""
    table = "order_detail_view"

class OrderAnalyticsProjection:
    """Aggregated statistics for reporting."""
    table = "order_analytics"

class CustomerOrderSummaryProjection:
    """Per-customer order summaries."""
    table = "customer_order_summary"

# Elasticsearch projection for search
class OrderSearchProjection:
    async def _on_order_created(self, event: OrderCreated):
        await self.es.index(
            index="orders",
            id=str(event.order_id),
            body={
                "customer_id": str(event.customer_id),
                "status": "pending",
                "created_at": event.timestamp.isoformat(),
                "searchable_text": "",
            },
        )

    async def _on_item_added(self, event: OrderItemAdded):
        product = await self.products.get(event.product_id)
        await self.es.update(
            index="orders",
            id=str(event.order_id),
            body={
                "script": {
                    "source": "ctx._source.searchable_text += ' ' + params.product_name",
                    "params": {"product_name": product.name},
                }
            },
        )
```

## Key Decisions

| Decision | Recommendation |
|----------|----------------|
| Consistency | Eventual consistency between write and read models |
| Event storage | Event store for write side, denormalized tables for read |
| Projection lag | Monitor and alert on projection delay |
| Read model count | Start with one, add more for specific query needs |
| Cache layer | Redis cache on top of read models for hot data |
| Rebuild strategy | Ability to rebuild projections from events |

## Anti-Patterns (FORBIDDEN)

```python
# NEVER query write model for reads
@app.get("/api/v1/orders/{order_id}")
async def get_order(order_id: UUID):
    # WRONG: Reading from aggregate
    order = await aggregate_repo.get(order_id)
    return order.to_dict()

# CORRECT: Use read model
async def get_order(order_id: UUID, query_bus: QueryBus):
    return await query_bus.dispatch(GetOrderById(order_id=order_id))

# NEVER modify read model directly
async def update_order_status(order_id: UUID, status: str):
    # WRONG: Direct update to read model
    await read_db.execute("UPDATE orders SET status = $1", status)

# CORRECT: Dispatch command, let projection update
async def update_order_status(order_id: UUID, status: str, bus: CommandBus):
    await bus.dispatch(UpdateOrderStatus(order_id=order_id, status=status))

# NEVER skip projection idempotency
async def _on_order_created(self, event: OrderCreated):
    # WRONG: Will fail on replay
    await self.db.execute("INSERT INTO ...", event.order_id)

# CORRECT: Upsert for idempotency
async def _on_order_created(self, event: OrderCreated):
    await self.db.execute(
        "INSERT INTO ... ON CONFLICT (id) DO UPDATE SET ...",
        event.order_id,
    )
```

## Related Skills

- `event-sourcing` - Event-sourced write models
- `saga-patterns` - Cross-aggregate transactions
- `database-schema-designer` - Read model schema design
- `caching-strategies` - Read model caching

## Capability Details

### command-handlers
**Keywords:** command, command handler, write model, aggregate
**Solves:**
- Process write operations
- Validate business rules
- Emit domain events

### query-handlers
**Keywords:** query, query handler, read model, projection
**Solves:**
- Optimized read operations
- Denormalized views
- Complex query patterns

### projections
**Keywords:** projection, event handler, read model update, sync
**Solves:**
- Keep read models in sync with writes
- Denormalize data for queries
- Multiple view representations

### multiple-read-models
**Keywords:** multiple views, read optimization, search, analytics
**Solves:**
- Different query requirements
- Search optimization
- Analytics aggregations
