---
name: message-queues
description: Message queue patterns with RabbitMQ and Redis Streams. Use when implementing async communication, pub/sub systems, event-driven microservices, or reliable message delivery.
context: fork
agent: event-driven-architect
version: 1.1.0
tags: [message-queue, rabbitmq, redis-streams, pub-sub, async, event-driven, 2026]
allowed-tools: [Read, Write, Bash, Grep, Glob]
author: SkillForge
user-invocable: false
---

# Message Queue Patterns

Asynchronous communication patterns for distributed systems using RabbitMQ and Redis Streams.

## When to Use

- Decoupling services in microservices architecture
- Implementing pub/sub and work queue patterns
- Building event-driven systems with reliable delivery
- Load leveling and buffering between services
- Task distribution across multiple workers

## Quick Reference

### RabbitMQ Publisher

```python
import aio_pika
from aio_pika import Message, DeliveryMode

class RabbitMQPublisher:
    def __init__(self, url: str):
        self.url = url
        self._connection = None
        self._channel = None

    async def connect(self):
        self._connection = await aio_pika.connect_robust(self.url)
        self._channel = await self._connection.channel()
        await self._channel.set_qos(prefetch_count=10)

    async def publish(self, exchange: str, routing_key: str, message: dict):
        exchange_obj = await self._channel.get_exchange(exchange)
        await exchange_obj.publish(
            Message(
                body=json.dumps(message).encode(),
                delivery_mode=DeliveryMode.PERSISTENT,
                content_type="application/json"
            ),
            routing_key=routing_key
        )
```

### RabbitMQ Consumer with Retry

```python
class RabbitMQConsumer:
    async def consume(self, queue_name: str, handler, max_retries: int = 3):
        queue = await self._channel.get_queue(queue_name)
        async with queue.iterator() as queue_iter:
            async for message in queue_iter:
                async with message.process(requeue=False):
                    try:
                        body = json.loads(message.body.decode())
                        await handler(body)
                    except Exception as e:
                        retry_count = message.headers.get("x-retry-count", 0)
                        if retry_count < max_retries:
                            await self.publish(exchange, routing_key, body,
                                headers={"x-retry-count": retry_count + 1})
                        else:
                            await self.publish("dlx", "failed", body,
                                headers={"x-error": str(e)})
```

### Redis Streams Consumer Group

```python
import redis.asyncio as redis

class RedisStreamConsumer:
    def __init__(self, url: str, stream: str, group: str, consumer: str):
        self.redis = redis.from_url(url)
        self.stream, self.group, self.consumer = stream, group, consumer

    async def setup(self):
        try:
            await self.redis.xgroup_create(self.stream, self.group, "0", mkstream=True)
        except redis.ResponseError as e:
            if "BUSYGROUP" not in str(e): raise

    async def consume(self, handler):
        while True:
            messages = await self.redis.xreadgroup(
                groupname=self.group, consumername=self.consumer,
                streams={self.stream: ">"}, count=10, block=5000
            )
            for stream, stream_messages in messages:
                for message_id, data in stream_messages:
                    try:
                        await handler(message_id, data)
                        await self.redis.xack(self.stream, self.group, message_id)
                    except Exception:
                        pass  # Message redelivered on restart
```

## Key Decisions

| Decision | RabbitMQ | Redis Streams |
|----------|----------|---------------|
| **Use Case** | Task queues, RPC, complex routing | Simple streaming, real-time events |
| **Throughput** | High (~50K msg/s) | Very High (~100K+ msg/s) |
| **Persistence** | Excellent (disk + replicas) | Good (AOF/RDB) |
| **Ordering** | Queue-level | Stream-level |
| **Protocol** | AMQP | Redis protocol |
| **Dead Letters** | Native DLX support | Manual implementation |
| **Consumer Groups** | Native | Native (XREADGROUP) |

## Anti-Patterns (FORBIDDEN)

```python
# NEVER process without acknowledgment
async for msg in consumer:
    process(msg)  # Message lost on failure!

# NEVER use sync calls in handlers
def handle(msg):
    requests.post(url, data=msg)  # Blocks event loop!

# NEVER ignore ordering when required
await publish("orders", {"order_id": "123"})  # No partition key!

# NEVER store large payloads
await publish("files", {"content": large_bytes})  # Use URL reference!

# NEVER skip dead letter handling
except Exception:
    pass  # Failed messages vanish!
```

## Related Skills

- `background-jobs` - Celery/ARQ task processing
- `streaming-api-patterns` - SSE/WebSocket real-time
- `observability-monitoring` - Queue metrics and alerting
- `caching-strategies` - Redis cache patterns

## Capability Details

### rabbitmq-messaging
**Keywords:** rabbitmq, amqp, aio-pika, exchange, queue, topic, fanout, routing
**Solves:**
- How do I set up RabbitMQ pub/sub?
- Exchange types and queue binding
- Dead letter queue configuration
- Message persistence and acknowledgment

### redis-streams
**Keywords:** redis streams, xadd, xread, xreadgroup, consumer group, xack
**Solves:**
- How do I use Redis Streams?
- Consumer group setup and message claiming
- Stream trimming and retention
- At-least-once delivery patterns

### message-patterns
**Keywords:** outbox, dead letter, retry, idempotent, at-least-once
**Solves:**
- Transactional outbox pattern
- Retry with exponential backoff
- Idempotent message handling
- Failed message recovery

### queue-topology
**Keywords:** exchange, binding, routing key, fanout, topic, direct
**Solves:**
- When to use topic vs fanout exchange?
- Queue naming conventions
- Routing key design
- Multi-tenant queue isolation
