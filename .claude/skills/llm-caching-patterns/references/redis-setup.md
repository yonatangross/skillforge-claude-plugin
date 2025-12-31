# Redis Setup for Semantic Caching

## Docker Compose Setup

```yaml
# docker-compose.yml
version: '3.8'

services:
  redis:
    image: redis/redis-stack:latest  # Includes RediSearch + RedisJSON
    container_name: skillforge-redis-cache
    ports:
      - "6379:6379"      # Redis
      - "8001:8001"      # RedisInsight UI
    environment:
      - REDIS_ARGS=--save 60 1000 --appendonly yes
    volumes:
      - redis-data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5
    networks:
      - skillforge-network

volumes:
  redis-data:

networks:
  skillforge-network:
    driver: bridge
```

## Python Setup with RedisVL

```bash
# Install dependencies
poetry add redis redisvl openai

# Or with pip
pip install redis redisvl openai
```

## Initialize Semantic Cache Index

```python
# backend/app/shared/services/cache/semantic_cache_setup.py
from redisvl.index import SearchIndex
from redisvl.schema import IndexSchema
import redis

CACHE_INDEX_SCHEMA = {
    "index": {
        "name": "llm_semantic_cache",
        "prefix": "cache:",
        "storage_type": "hash",
    },
    "fields": [
        {"name": "agent_type", "type": "tag"},
        {"name": "content_type", "type": "tag"},
        {"name": "input_hash", "type": "tag"},
        {
            "name": "embedding",
            "type": "vector",
            "attrs": {
                "dims": 1536,  # OpenAI text-embedding-3-small
                "distance_metric": "cosine",
                "algorithm": "hnsw",
                "m": 16,
                "ef_construction": 200,
            }
        },
        {"name": "response", "type": "text"},
        {"name": "created_at", "type": "numeric"},
        {"name": "hit_count", "type": "numeric"},
        {"name": "quality_score", "type": "numeric"},
    ]
}

def setup_semantic_cache_index(redis_url: str = "redis://localhost:6379"):
    """Create RediSearch index for semantic caching."""
    client = redis.from_url(redis_url)
    schema = IndexSchema.from_dict(CACHE_INDEX_SCHEMA)
    index = SearchIndex(schema, redis=client)

    try:
        index.create(overwrite=False)
        print(f"✅ Created index: {schema.index.name}")
    except Exception as e:
        if "Index already exists" in str(e):
            print(f"✅ Index already exists: {schema.index.name}")
        else:
            raise

    return index

if __name__ == "__main__":
    setup_semantic_cache_index()
```

## Verify Installation

```python
import redis
from redisvl.index import SearchIndex

client = redis.from_url("redis://localhost:6379")

# Check connection
print(client.ping())  # Should return True

# List indexes
from redisvl.redis.utils import convert_bytes
indexes = convert_bytes(client.execute_command("FT._LIST"))
print(f"Indexes: {indexes}")
```

## RedisInsight UI

Access at `http://localhost:8001` to:
- Browse cache entries
- Monitor hit rates
- Visualize vector similarity
- Analyze query performance

## Connection Pooling

```python
# backend/app/core/redis_pool.py
from redis import ConnectionPool, Redis
import os

pool = ConnectionPool.from_url(
    os.getenv("REDIS_URL", "redis://localhost:6379"),
    max_connections=50,
    socket_keepalive=True,
    socket_keepalive_options={
        socket.TCP_KEEPIDLE: 30,
        socket.TCP_KEEPINTVL: 10,
        socket.TCP_KEEPCNT: 3,
    },
    health_check_interval=30,
)

def get_redis_client() -> Redis:
    return Redis(connection_pool=pool)
```
