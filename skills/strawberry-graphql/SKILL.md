---
name: strawberry-graphql
description: Strawberry GraphQL library for Python with FastAPI integration, type-safe resolvers, DataLoader patterns, and subscriptions. Use when building GraphQL APIs with Python, implementing real-time features, or creating federated schemas.
context: fork
agent: backend-system-architect
version: 1.0.0
tags: [graphql, strawberry, fastapi, dataloader, subscriptions, federation, python, 2026]
author: SkillForge
user-invocable: false
---

# Strawberry GraphQL Patterns

Type-safe GraphQL in Python with code-first schema definition.

## When to Use

- Complex data relationships (nested queries, multiple entities)
- Client-driven data fetching (mobile apps, SPAs)
- Real-time features (subscriptions for live updates)
- Multiple frontend consumers (web, mobile, third-party)
- Federated microservice architecture
- When REST would require many endpoints or over-fetching

## When NOT to Use

- Simple CRUD APIs (REST is simpler)
- Highly cacheable public APIs (REST + CDN better)
- Internal microservice communication (use gRPC)

> **Note**: Strawberry supports file uploads via the `Upload` scalar. See `references/file-uploads.md` for patterns.

## Quick Reference

### Schema Definition

```python
# app/graphql/types/user.py
import strawberry
from datetime import datetime
from typing import Optional, Annotated
from strawberry import Private

@strawberry.enum
class UserStatus:
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"

@strawberry.type
class User:
    id: strawberry.ID
    email: str
    name: str
    status: UserStatus
    created_at: datetime

    # Private fields (not exposed in schema)
    password_hash: Private[str]

    # Computed field
    @strawberry.field
    def display_name(self) -> str:
        return f"{self.name} ({self.email})"

    # Field with arguments
    @strawberry.field
    def avatar_url(self, size: int = 100) -> str:
        return f"https://avatars.example.com/{self.id}?size={size}"

    # Nested resolver with DataLoader
    @strawberry.field
    async def posts(
        self,
        info: strawberry.Info,
        limit: int = 10,
    ) -> list["Post"]:
        loader = info.context.post_loader
        return await loader.load_by_user(self.id, limit)

@strawberry.type
class Post:
    id: strawberry.ID
    title: str
    content: str
    author_id: strawberry.ID
    created_at: datetime

    @strawberry.field
    async def author(self, info: strawberry.Info) -> User:
        loader = info.context.user_loader
        return await loader.load(self.author_id)

@strawberry.input
class CreateUserInput:
    email: str
    name: str
    password: str

@strawberry.input
class UpdateUserInput:
    name: Optional[str] = None
    status: Optional[UserStatus] = None

# Pagination types
@strawberry.type
class PageInfo:
    has_next_page: bool
    has_previous_page: bool
    start_cursor: Optional[str] = None
    end_cursor: Optional[str] = None

@strawberry.type
class UserEdge:
    cursor: str
    node: User

@strawberry.type
class UserConnection:
    edges: list[UserEdge]
    page_info: PageInfo
    total_count: int
```

### Query and Mutation

```python
# app/graphql/resolvers/user.py
import strawberry
from strawberry.types import Info
from app.services.user_service import UserService
from app.graphql.types.user import User, CreateUserInput, UpdateUserInput, UserConnection

@strawberry.type
class Query:
    @strawberry.field
    async def user(self, info: Info, id: strawberry.ID) -> User | None:
        service: UserService = info.context.user_service
        return await service.get(id)

    @strawberry.field
    async def users(
        self,
        info: Info,
        first: int = 10,
        after: str | None = None,
        status: UserStatus | None = None,
    ) -> UserConnection:
        service: UserService = info.context.user_service
        return await service.list_paginated(
            first=first,
            after=after,
            status=status,
        )

    @strawberry.field
    async def me(self, info: Info) -> User | None:
        """Get current authenticated user."""
        user_id = info.context.current_user_id
        if not user_id:
            return None
        return await info.context.user_service.get(user_id)

@strawberry.type
class Mutation:
    @strawberry.mutation
    async def create_user(self, info: Info, input: CreateUserInput) -> User:
        service: UserService = info.context.user_service
        return await service.create(
            email=input.email,
            name=input.name,
            password=input.password,
        )

    @strawberry.mutation
    async def update_user(
        self,
        info: Info,
        id: strawberry.ID,
        input: UpdateUserInput,
    ) -> User:
        service: UserService = info.context.user_service

        # Authorization check
        if info.context.current_user_id != id:
            raise PermissionError("Cannot update other users")

        return await service.update(id, **input.__dict__)

    @strawberry.mutation
    async def delete_user(self, info: Info, id: strawberry.ID) -> bool:
        service: UserService = info.context.user_service
        await service.delete(id)
        return True
```

### DataLoader (N+1 Prevention)

```python
# app/graphql/loaders.py
from strawberry.dataloader import DataLoader
from typing import Sequence
from app.repositories.user_repository import UserRepository
from app.repositories.post_repository import PostRepository

class UserLoader(DataLoader[str, User]):
    def __init__(self, user_repo: UserRepository):
        super().__init__(load_fn=self.batch_load)
        self.user_repo = user_repo

    async def batch_load(self, keys: list[str]) -> Sequence[User]:
        # Single query for all requested users
        users = await self.user_repo.get_many(keys)
        user_map = {u.id: u for u in users}
        # Return in same order as keys, None for missing
        return [user_map.get(key) for key in keys]


class PostLoader:
    def __init__(self, post_repo: PostRepository):
        self.post_repo = post_repo
        self._by_user = DataLoader(load_fn=self._load_by_user)

    async def load_by_user(self, user_id: str, limit: int = 10) -> list[Post]:
        # Use cache key combining user_id and limit
        return await self._by_user.load((user_id, limit))

    async def _load_by_user(
        self,
        keys: list[tuple[str, int]],
    ) -> Sequence[list[Post]]:
        # Group by user_id, use max limit
        user_ids = list(set(k[0] for k in keys))
        max_limit = max(k[1] for k in keys)

        posts_by_user = await self.post_repo.get_by_users(user_ids, max_limit)

        # Return posts for each key
        result = []
        for user_id, limit in keys:
            user_posts = posts_by_user.get(user_id, [])[:limit]
            result.append(user_posts)
        return result


# Context factory
class GraphQLContext:
    def __init__(self, request, user_service, user_repo, post_repo):
        self.request = request
        self.user_service = user_service
        self.user_loader = UserLoader(user_repo)
        self.post_loader = PostLoader(post_repo)
        self._current_user_id = None

    @property
    def current_user_id(self) -> str | None:
        if self._current_user_id is None:
            token = self.request.headers.get("authorization", "").replace("Bearer ", "")
            self._current_user_id = decode_token(token) if token else None
        return self._current_user_id
```

### FastAPI Integration

```python
# app/main.py
from fastapi import FastAPI, Request, Depends
from strawberry.fastapi import GraphQLRouter
import strawberry

from app.graphql.resolvers.user import Query, Mutation
from app.graphql.resolvers.subscription import Subscription
from app.graphql.loaders import GraphQLContext
from app.dependencies import get_user_service, get_user_repo, get_post_repo

# Create schema
schema = strawberry.Schema(
    query=Query,
    mutation=Mutation,
    subscription=Subscription,
)

# Context dependency
async def get_context(
    request: Request,
    user_service=Depends(get_user_service),
    user_repo=Depends(get_user_repo),
    post_repo=Depends(get_post_repo),
) -> GraphQLContext:
    return GraphQLContext(
        request=request,
        user_service=user_service,
        user_repo=user_repo,
        post_repo=post_repo,
    )

# Create router
graphql_router = GraphQLRouter(
    schema,
    context_getter=get_context,
    graphiql=True,  # Enable GraphiQL IDE
)

app = FastAPI()
app.include_router(graphql_router, prefix="/graphql")
```

### Subscriptions

```python
# app/graphql/resolvers/subscription.py
import strawberry
from strawberry.types import Info
from typing import AsyncGenerator
import asyncio

@strawberry.type
class Subscription:
    @strawberry.subscription
    async def user_updated(
        self,
        info: Info,
        user_id: strawberry.ID,
    ) -> AsyncGenerator[User, None]:
        """Subscribe to user updates."""
        pubsub = info.context.pubsub

        async for message in pubsub.subscribe(f"user:{user_id}:updated"):
            user = User(**message)
            yield user

    @strawberry.subscription
    async def new_posts(
        self,
        info: Info,
    ) -> AsyncGenerator[Post, None]:
        """Subscribe to new posts."""
        pubsub = info.context.pubsub

        async for message in pubsub.subscribe("posts:new"):
            post = Post(**message)
            yield post

    @strawberry.subscription
    async def notifications(
        self,
        info: Info,
    ) -> AsyncGenerator["Notification", None]:
        """Subscribe to user notifications."""
        user_id = info.context.current_user_id
        if not user_id:
            raise PermissionError("Authentication required")

        pubsub = info.context.pubsub
        async for message in pubsub.subscribe(f"user:{user_id}:notifications"):
            yield Notification(**message)


# Redis PubSub implementation
import redis.asyncio as redis

class RedisPubSub:
    def __init__(self, redis_url: str):
        self.redis = redis.from_url(redis_url)

    async def publish(self, channel: str, message: dict):
        await self.redis.publish(channel, json.dumps(message))

    async def subscribe(self, channel: str):
        pubsub = self.redis.pubsub()
        await pubsub.subscribe(channel)

        try:
            async for message in pubsub.listen():
                if message["type"] == "message":
                    yield json.loads(message["data"])
        finally:
            await pubsub.unsubscribe(channel)
```

### Authentication and Authorization

```python
# app/graphql/permissions.py
from strawberry.permission import BasePermission
from strawberry.types import Info

class IsAuthenticated(BasePermission):
    message = "User is not authenticated"

    async def has_permission(self, source, info: Info, **kwargs) -> bool:
        return info.context.current_user_id is not None

class IsAdmin(BasePermission):
    message = "Admin access required"

    async def has_permission(self, source, info: Info, **kwargs) -> bool:
        user_id = info.context.current_user_id
        if not user_id:
            return False
        user = await info.context.user_service.get(user_id)
        return user and user.role == "admin"

class IsOwner(BasePermission):
    message = "You can only access your own resources"

    async def has_permission(self, source, info: Info, **kwargs) -> bool:
        user_id = info.context.current_user_id
        resource_owner_id = kwargs.get("id") or getattr(source, "user_id", None)
        return user_id == resource_owner_id


# Usage in resolvers
@strawberry.type
class Query:
    @strawberry.field(permission_classes=[IsAuthenticated])
    async def me(self, info: Info) -> User:
        return await info.context.user_service.get(info.context.current_user_id)

    @strawberry.field(permission_classes=[IsAdmin])
    async def all_users(self, info: Info) -> list[User]:
        return await info.context.user_service.list_all()

@strawberry.type
class Mutation:
    @strawberry.mutation(permission_classes=[IsAuthenticated, IsOwner])
    async def update_profile(
        self,
        info: Info,
        id: strawberry.ID,
        input: UpdateProfileInput,
    ) -> User:
        return await info.context.user_service.update(id, **input.__dict__)
```

### Error Handling

```python
# app/graphql/errors.py
import strawberry
from strawberry.types import Info
from graphql import GraphQLError

@strawberry.type
class ValidationError:
    field: str
    message: str

@strawberry.type
class UserError:
    message: str
    code: str
    field: str | None = None

# Union return type for mutations
@strawberry.type
class CreateUserSuccess:
    user: User

@strawberry.type
class CreateUserError:
    errors: list[UserError]

CreateUserResult = strawberry.union(
    "CreateUserResult",
    [CreateUserSuccess, CreateUserError],
)

@strawberry.type
class Mutation:
    @strawberry.mutation
    async def create_user(
        self,
        info: Info,
        input: CreateUserInput,
    ) -> CreateUserResult:
        errors = []

        # Validation
        if not is_valid_email(input.email):
            errors.append(UserError(
                message="Invalid email format",
                code="INVALID_EMAIL",
                field="email",
            ))

        if len(input.password) < 8:
            errors.append(UserError(
                message="Password must be at least 8 characters",
                code="WEAK_PASSWORD",
                field="password",
            ))

        if errors:
            return CreateUserError(errors=errors)

        try:
            user = await info.context.user_service.create(**input.__dict__)
            return CreateUserSuccess(user=user)
        except DuplicateEmailError:
            return CreateUserError(errors=[
                UserError(
                    message="Email already registered",
                    code="DUPLICATE_EMAIL",
                    field="email",
                )
            ])


# Custom exception handler
from strawberry.extensions import SchemaExtension

class ErrorLoggingExtension(SchemaExtension):
    def on_operation(self):
        yield
        result = self.execution_context.result
        if result and result.errors:
            for error in result.errors:
                logger.error(f"GraphQL error: {error.message}", exc_info=error.original_error)
```

### Federation (Microservices)

```python
# User service schema
import strawberry
from strawberry.federation import Schema

@strawberry.federation.type(keys=["id"])
class User:
    id: strawberry.ID
    email: str
    name: str

    @classmethod
    def resolve_reference(cls, id: strawberry.ID, info: Info) -> "User":
        return info.context.user_service.get(id)

@strawberry.type
class Query:
    @strawberry.field
    def user(self, id: strawberry.ID) -> User | None:
        return user_service.get(id)

schema = Schema(query=Query, enable_federation_2=True)


# Post service schema (extends User)
@strawberry.federation.type(keys=["id"], extend=True)
class User:
    id: strawberry.ID = strawberry.federation.field(external=True)

    @strawberry.field
    async def posts(self, info: Info) -> list["Post"]:
        return await info.context.post_service.get_by_user(self.id)

@strawberry.federation.type(keys=["id"])
class Post:
    id: strawberry.ID
    title: str
    content: str
    author: User

@strawberry.type
class Query:
    @strawberry.field
    def post(self, id: strawberry.ID) -> Post | None:
        return post_service.get(id)

schema = Schema(query=Query, enable_federation_2=True)
```

## Key Decisions

| Decision | Recommendation |
|----------|----------------|
| Schema approach | Code-first with Strawberry types |
| N+1 prevention | DataLoader for all nested resolvers |
| Pagination | Relay-style cursor pagination |
| Auth | Permission classes, context-based |
| Errors | Union types for mutations, exceptions for queries |
| Subscriptions | Redis PubSub for horizontal scaling |
| Federation | Strawberry Federation 2 for microservices |

## Anti-Patterns (FORBIDDEN)

```python
# NEVER make database calls in resolver loops
@strawberry.field
async def posts(self, info: Info) -> list[Post]:
    posts = []
    for post_id in self.post_ids:
        posts.append(await db.get_post(post_id))  # N+1 queries!
    return posts

# CORRECT: Use DataLoader
@strawberry.field
async def posts(self, info: Info) -> list[Post]:
    return await info.context.post_loader.load_many(self.post_ids)

# NEVER expose internal IDs without encoding
@strawberry.type
class User:
    id: int  # Exposes auto-increment ID!

# CORRECT: Use opaque IDs
@strawberry.type
class User:
    id: strawberry.ID  # base64 encoded

# NEVER skip input validation
@strawberry.mutation
async def create_user(self, email: str, password: str) -> User:
    return await service.create(email, password)  # No validation!

# CORRECT: Validate inputs
@strawberry.mutation
async def create_user(self, input: CreateUserInput) -> CreateUserResult:
    errors = validate(input)
    if errors:
        return CreateUserError(errors=errors)
```

## Related Skills

- `api-design-framework` - REST API patterns
- `grpc-python` - gRPC alternative
- `streaming-api-patterns` - WebSocket patterns
- `caching-strategies` - Query result caching

## Capability Details

### schema-definition
**Keywords:** strawberry type, graphql schema, type definition, enum
**Solves:**
- Define GraphQL types with Python
- Create input types and enums
- Computed fields and resolvers

### dataloader
**Keywords:** dataloader, n+1, batch loading, nested query
**Solves:**
- Prevent N+1 query problems
- Batch database queries
- Cache within request

### subscriptions
**Keywords:** graphql subscription, real-time, websocket, pubsub
**Solves:**
- Real-time data updates
- WebSocket subscriptions
- Redis PubSub integration

### authentication
**Keywords:** graphql auth, permission, authorization
**Solves:**
- Protect resolvers with permissions
- Context-based authentication
- Role-based access control

### federation
**Keywords:** graphql federation, microservices, schema stitching
**Solves:**
- Federated microservice schemas
- Cross-service type extension
- Apollo Federation compatibility
