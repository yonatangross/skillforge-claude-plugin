---
name: outbox-pattern
description: Transactional outbox pattern for reliable event publishing. Use when implementing atomic writes with event delivery, ensuring exactly-once semantics, or building event-driven microservices.
context: fork
agent: event-driven-architect
version: 1.0.0
tags: [event-driven, outbox, transactions, reliability, microservices, 2026]
allowed-tools:
  - Read
  - Write
  - Grep
  - Glob
author: SkillForge
user-invocable: false
---

# Outbox Pattern

Ensure atomic state changes and event publishing by writing both to a database transaction, then publishing asynchronously.

## When to Use

- Ensuring database writes and event publishing are atomic
- Building reliable event-driven microservices
- Implementing exactly-once message delivery semantics
- Avoiding dual-write problems (DB + message broker)
- Decoupling domain logic from message infrastructure

## Quick Reference

### Outbox Table Schema

```sql
CREATE TABLE outbox (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aggregate_type VARCHAR(100) NOT NULL,
    aggregate_id UUID NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    published_at TIMESTAMPTZ,
    retry_count INT DEFAULT 0,
    last_error TEXT
);

CREATE INDEX idx_outbox_unpublished ON outbox(created_at)
    WHERE published_at IS NULL;
CREATE INDEX idx_outbox_aggregate ON outbox(aggregate_id, created_at);
```

### SQLAlchemy Model

```python
from sqlalchemy.dialects.postgresql import UUID, JSONB

class OutboxMessage(Base):
    __tablename__ = "outbox"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    aggregate_type = Column(String(100), nullable=False)
    aggregate_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    event_type = Column(String(100), nullable=False)
    payload = Column(JSONB, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    published_at = Column(DateTime, nullable=True)
    retry_count = Column(Integer, default=0)
```

### Polling Publisher

```python
class OutboxPublisher:
    """Polls outbox and publishes to message broker."""

    async def publish_pending(self, batch_size: int = 100) -> int:
        stmt = (
            select(OutboxMessage)
            .where(OutboxMessage.published_at.is_(None))
            .order_by(OutboxMessage.created_at)
            .limit(batch_size)
            .with_for_update(skip_locked=True)  # Prevent duplicate processing
        )
        messages = (await self.session.execute(stmt)).scalars().all()

        for msg in messages:
            try:
                await self.producer.publish(
                    topic=f"{msg.aggregate_type.lower()}-events",
                    key=str(msg.aggregate_id),
                    value={"type": msg.event_type, **msg.payload},
                )
                msg.published_at = datetime.utcnow()
            except Exception as e:
                msg.retry_count += 1
                msg.last_error = str(e)

        await self.session.commit()
```

## Key Decisions

| Decision | Option A | Option B | Recommendation |
|----------|----------|----------|----------------|
| Delivery | Polling | CDC (Debezium) | Polling for simplicity, CDC for high throughput |
| Batch size | Small (10-50) | Large (100-500) | Start with 100, tune based on latency |
| Retry | Fixed delay | Exponential backoff | Exponential with max 5 retries |
| Cleanup | Delete published | Archive to cold storage | Archive for audit, delete after 30 days |
| Ordering | Per-aggregate | Global | Per-aggregate via partition key |

## Anti-Patterns (FORBIDDEN)

```python
# NEVER publish before commit - dual-write problem
await producer.publish(event)  # May succeed but commit may fail!
await session.commit()

# NEVER delete without publishing - events lost
await session.execute(delete(OutboxMessage).where(...))

# NEVER process without locking - causes duplicates
messages = await session.execute(select(OutboxMessage))  # No lock!

# NEVER store large payloads - use URL references instead
OutboxMessage(payload={"file": large_binary_data})

# NEVER ignore ordering - use aggregate_id as partition key
await producer.publish(event_a)  # May arrive out of order!
```

## Related Skills

- `message-queues` - Kafka, RabbitMQ, Redis Streams integration
- `event-sourcing` - Full event-sourced architecture patterns
- `database-schema-designer` - Schema design and migrations

## Capability Details

### outbox-schema
**Keywords:** outbox table, transactional outbox, event table, schema
**Solves:**
- How do I design an outbox table?
- What indexes are needed for outbox?
- Outbox table best practices

### polling-publisher
**Keywords:** polling, publish outbox, background worker, relay
**Solves:**
- How do I publish from the outbox?
- Batch publishing patterns
- Handling publish failures

### atomic-operations
**Keywords:** atomic, transaction, dual-write, consistency
**Solves:**
- How to avoid dual-write problems?
- Ensuring atomicity between DB and events
- Exactly-once delivery patterns
