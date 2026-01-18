---
name: grpc-python
description: gRPC with Python using grpcio and protobuf for high-performance microservice communication. Use when implementing service-to-service APIs, streaming data, or building polyglot microservices requiring strong typing.
context: fork
agent: backend-system-architect
version: 1.0.0
tags: [grpc, protobuf, microservices, rpc, streaming, python, 2026]
author: SkillForge
user-invocable: false
---

# gRPC Python Patterns

High-performance RPC framework for microservice communication.

## When to Use

- Internal microservice communication (lower latency than REST)
- Streaming data (real-time updates, file transfers)
- Polyglot environments (shared proto definitions)
- Strong typing between services (compile-time validation)
- Bidirectional streaming (chat, gaming, real-time sync)
- High-throughput, low-latency requirements

## When NOT to Use

- Public APIs (prefer REST/GraphQL for browser compatibility)
- Simple CRUD with few services (REST is simpler)
- When HTTP/2 is not available (proxies, load balancers)

## Quick Reference

### Proto Definition

```protobuf
// protos/user_service.proto
syntax = "proto3";

package user.v1;

option python_package = "app.protos.user_v1";

import "google/protobuf/timestamp.proto";
import "google/protobuf/empty.proto";

// Service definition
service UserService {
  // Unary RPC
  rpc GetUser(GetUserRequest) returns (User);
  rpc CreateUser(CreateUserRequest) returns (User);
  rpc UpdateUser(UpdateUserRequest) returns (User);
  rpc DeleteUser(DeleteUserRequest) returns (google.protobuf.Empty);

  // Server streaming
  rpc ListUsers(ListUsersRequest) returns (stream User);

  // Client streaming
  rpc BulkCreateUsers(stream CreateUserRequest) returns (BulkCreateResponse);

  // Bidirectional streaming
  rpc UserUpdates(stream UserUpdateRequest) returns (stream User);
}

// Messages
message User {
  string id = 1;
  string email = 2;
  string name = 3;
  UserStatus status = 4;
  google.protobuf.Timestamp created_at = 5;
  google.protobuf.Timestamp updated_at = 6;
}

enum UserStatus {
  USER_STATUS_UNSPECIFIED = 0;
  USER_STATUS_ACTIVE = 1;
  USER_STATUS_INACTIVE = 2;
  USER_STATUS_SUSPENDED = 3;
}

message GetUserRequest {
  string user_id = 1;
}

message CreateUserRequest {
  string email = 1;
  string name = 2;
  string password = 3;
}

message UpdateUserRequest {
  string user_id = 1;
  optional string email = 2;
  optional string name = 3;
  optional UserStatus status = 4;
}

message DeleteUserRequest {
  string user_id = 1;
}

message ListUsersRequest {
  int32 page_size = 1;
  string page_token = 2;
  UserStatus status_filter = 3;
}

message BulkCreateResponse {
  int32 created_count = 1;
  repeated string user_ids = 2;
  repeated string errors = 3;
}

message UserUpdateRequest {
  oneof update {
    string subscribe_user_id = 1;
    string unsubscribe_user_id = 2;
  }
}
```

### Code Generation

```bash
# Install tools
pip install grpcio grpcio-tools

# Generate Python code
python -m grpc_tools.protoc \
  -I./protos \
  --python_out=./app/protos \
  --pyi_out=./app/protos \
  --grpc_python_out=./app/protos \
  ./protos/user_service.proto

# Using buf (recommended for larger projects)
# buf.yaml
version: v1
deps:
  - buf.build/googleapis/googleapis
breaking:
  use:
    - FILE
lint:
  use:
    - DEFAULT

# buf generate
buf generate
```

### Server Implementation

```python
# app/services/user_service.py
import grpc
from concurrent import futures
from google.protobuf.timestamp_pb2 import Timestamp
from google.protobuf.empty_pb2 import Empty

from app.protos import user_service_pb2 as pb2
from app.protos import user_service_pb2_grpc as pb2_grpc
from app.repositories.user_repository import UserRepository


class UserServiceServicer(pb2_grpc.UserServiceServicer):
    def __init__(self, user_repo: UserRepository):
        self.user_repo = user_repo

    def GetUser(
        self,
        request: pb2.GetUserRequest,
        context: grpc.ServicerContext,
    ) -> pb2.User:
        user = self.user_repo.get(request.user_id)
        if not user:
            context.abort(grpc.StatusCode.NOT_FOUND, f"User {request.user_id} not found")

        return self._to_proto(user)

    def CreateUser(
        self,
        request: pb2.CreateUserRequest,
        context: grpc.ServicerContext,
    ) -> pb2.User:
        # Validate
        if not request.email or "@" not in request.email:
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, "Invalid email")

        # Check uniqueness
        if self.user_repo.get_by_email(request.email):
            context.abort(grpc.StatusCode.ALREADY_EXISTS, "Email already registered")

        user = self.user_repo.create(
            email=request.email,
            name=request.name,
            password_hash=hash_password(request.password),
        )
        return self._to_proto(user)

    def ListUsers(
        self,
        request: pb2.ListUsersRequest,
        context: grpc.ServicerContext,
    ):
        """Server streaming: yield users one by one."""
        page_size = request.page_size or 100
        cursor = request.page_token or None

        for user in self.user_repo.iterate(
            page_size=page_size,
            cursor=cursor,
            status=request.status_filter if request.status_filter else None,
        ):
            # Check if client cancelled
            if context.is_active():
                yield self._to_proto(user)
            else:
                return

    def BulkCreateUsers(
        self,
        request_iterator,
        context: grpc.ServicerContext,
    ) -> pb2.BulkCreateResponse:
        """Client streaming: receive multiple requests."""
        created_ids = []
        errors = []

        for request in request_iterator:
            try:
                user = self.user_repo.create(
                    email=request.email,
                    name=request.name,
                    password_hash=hash_password(request.password),
                )
                created_ids.append(user.id)
            except Exception as e:
                errors.append(f"{request.email}: {str(e)}")

        return pb2.BulkCreateResponse(
            created_count=len(created_ids),
            user_ids=created_ids,
            errors=errors,
        )

    def UserUpdates(
        self,
        request_iterator,
        context: grpc.ServicerContext,
    ):
        """Bidirectional streaming: real-time user updates."""
        subscribed_user_ids = set()

        def receive_subscriptions():
            for request in request_iterator:
                if request.HasField("subscribe_user_id"):
                    subscribed_user_ids.add(request.subscribe_user_id)
                elif request.HasField("unsubscribe_user_id"):
                    subscribed_user_ids.discard(request.unsubscribe_user_id)

        # Start receiving in background
        import threading
        receiver = threading.Thread(target=receive_subscriptions)
        receiver.start()

        # Stream updates for subscribed users
        for update in self.user_repo.watch_changes():
            if update.user_id in subscribed_user_ids:
                yield self._to_proto(update.user)

    def _to_proto(self, user) -> pb2.User:
        created_at = Timestamp()
        created_at.FromDatetime(user.created_at)
        updated_at = Timestamp()
        updated_at.FromDatetime(user.updated_at)

        return pb2.User(
            id=user.id,
            email=user.email,
            name=user.name,
            status=pb2.UserStatus.Value(f"USER_STATUS_{user.status.upper()}"),
            created_at=created_at,
            updated_at=updated_at,
        )


def serve():
    server = grpc.server(
        futures.ThreadPoolExecutor(max_workers=10),
        options=[
            ("grpc.max_send_message_length", 50 * 1024 * 1024),  # 50MB
            ("grpc.max_receive_message_length", 50 * 1024 * 1024),
        ],
    )

    user_repo = UserRepository()
    pb2_grpc.add_UserServiceServicer_to_server(
        UserServiceServicer(user_repo),
        server,
    )

    # Health check service
    from grpc_health.v1 import health, health_pb2_grpc
    health_servicer = health.HealthServicer()
    health_pb2_grpc.add_HealthServicer_to_server(health_servicer, server)

    server.add_insecure_port("[::]:50051")
    server.start()
    server.wait_for_termination()


if __name__ == "__main__":
    serve()
```

### Async Server (grpcio-tools >= 1.50)

```python
import asyncio
import grpc.aio

class AsyncUserServiceServicer(pb2_grpc.UserServiceServicer):
    async def GetUser(
        self,
        request: pb2.GetUserRequest,
        context: grpc.aio.ServicerContext,
    ) -> pb2.User:
        user = await self.user_repo.get(request.user_id)
        if not user:
            await context.abort(grpc.StatusCode.NOT_FOUND, "User not found")
        return self._to_proto(user)

    async def ListUsers(
        self,
        request: pb2.ListUsersRequest,
        context: grpc.aio.ServicerContext,
    ):
        async for user in self.user_repo.iterate_async():
            yield self._to_proto(user)


async def serve_async():
    server = grpc.aio.server()
    pb2_grpc.add_UserServiceServicer_to_server(
        AsyncUserServiceServicer(),
        server,
    )
    server.add_insecure_port("[::]:50051")
    await server.start()
    await server.wait_for_termination()


if __name__ == "__main__":
    asyncio.run(serve_async())
```

### Client Implementation

```python
import grpc
from app.protos import user_service_pb2 as pb2
from app.protos import user_service_pb2_grpc as pb2_grpc


class UserServiceClient:
    def __init__(self, host: str = "localhost:50051"):
        self.channel = grpc.insecure_channel(
            host,
            options=[
                ("grpc.keepalive_time_ms", 30000),
                ("grpc.keepalive_timeout_ms", 10000),
            ],
        )
        self.stub = pb2_grpc.UserServiceStub(self.channel)

    def get_user(self, user_id: str, timeout: float = 5.0) -> pb2.User:
        try:
            return self.stub.GetUser(
                pb2.GetUserRequest(user_id=user_id),
                timeout=timeout,
            )
        except grpc.RpcError as e:
            if e.code() == grpc.StatusCode.NOT_FOUND:
                raise UserNotFoundError(user_id)
            raise

    def list_users(self, page_size: int = 100):
        """Iterate over streamed users."""
        request = pb2.ListUsersRequest(page_size=page_size)
        for user in self.stub.ListUsers(request):
            yield user

    def bulk_create(self, users: list[dict]) -> pb2.BulkCreateResponse:
        """Stream users for bulk creation."""
        def user_generator():
            for user in users:
                yield pb2.CreateUserRequest(
                    email=user["email"],
                    name=user["name"],
                    password=user["password"],
                )

        return self.stub.BulkCreateUsers(user_generator())

    def close(self):
        self.channel.close()


# Async client
class AsyncUserServiceClient:
    def __init__(self, host: str = "localhost:50051"):
        self.channel = grpc.aio.insecure_channel(host)
        self.stub = pb2_grpc.UserServiceStub(self.channel)

    async def get_user(self, user_id: str) -> pb2.User:
        return await self.stub.GetUser(
            pb2.GetUserRequest(user_id=user_id)
        )

    async def list_users(self):
        async for user in self.stub.ListUsers(pb2.ListUsersRequest()):
            yield user

    async def close(self):
        await self.channel.close()
```

## Interceptors

```python
import grpc
import time
import logging

logger = logging.getLogger(__name__)


class LoggingInterceptor(grpc.ServerInterceptor):
    def intercept_service(self, continuation, handler_call_details):
        start = time.time()
        method = handler_call_details.method

        handler = continuation(handler_call_details)

        # Wrap the handler
        if handler.unary_unary:
            return self._wrap_unary(handler, method, start)
        elif handler.unary_stream:
            return self._wrap_stream(handler, method, start)
        return handler

    def _wrap_unary(self, handler, method, start):
        def wrapper(request, context):
            try:
                response = handler.unary_unary(request, context)
                logger.info(f"{method} completed in {time.time() - start:.3f}s")
                return response
            except Exception as e:
                logger.error(f"{method} failed: {e}")
                raise
        return grpc.unary_unary_rpc_method_handler(
            wrapper,
            request_deserializer=handler.request_deserializer,
            response_serializer=handler.response_serializer,
        )


class AuthInterceptor(grpc.ServerInterceptor):
    def __init__(self, auth_service):
        self.auth_service = auth_service
        self.public_methods = {"/user.v1.UserService/CreateUser"}

    def intercept_service(self, continuation, handler_call_details):
        method = handler_call_details.method
        metadata = dict(handler_call_details.invocation_metadata)

        if method not in self.public_methods:
            token = metadata.get("authorization", "").replace("Bearer ", "")
            if not token or not self.auth_service.verify(token):
                return grpc.unary_unary_rpc_method_handler(
                    lambda req, ctx: ctx.abort(
                        grpc.StatusCode.UNAUTHENTICATED, "Invalid token"
                    )
                )

        return continuation(handler_call_details)


# Client interceptor
class RetryInterceptor(grpc.UnaryUnaryClientInterceptor):
    def __init__(self, max_retries: int = 3, retry_codes: set = None):
        self.max_retries = max_retries
        self.retry_codes = retry_codes or {
            grpc.StatusCode.UNAVAILABLE,
            grpc.StatusCode.DEADLINE_EXCEEDED,
        }

    def intercept_unary_unary(self, continuation, client_call_details, request):
        for attempt in range(self.max_retries):
            try:
                return continuation(client_call_details, request)
            except grpc.RpcError as e:
                if e.code() not in self.retry_codes:
                    raise
                if attempt == self.max_retries - 1:
                    raise
                time.sleep(2 ** attempt)  # Exponential backoff
```

## Error Handling

```python
import grpc
from grpc_status import rpc_status
from google.rpc import status_pb2, error_details_pb2


def abort_with_details(context, code, message, details=None):
    """Abort with rich error details."""
    status = status_pb2.Status(
        code=code.value[0],
        message=message,
    )

    if details:
        for detail in details:
            status.details.add().Pack(detail)

    context.abort_with_status(rpc_status.to_status(status))


class UserServiceServicer(pb2_grpc.UserServiceServicer):
    def CreateUser(self, request, context):
        errors = []

        if not request.email:
            errors.append(
                error_details_pb2.BadRequest.FieldViolation(
                    field="email",
                    description="Email is required",
                )
            )

        if len(request.password) < 8:
            errors.append(
                error_details_pb2.BadRequest.FieldViolation(
                    field="password",
                    description="Password must be at least 8 characters",
                )
            )

        if errors:
            bad_request = error_details_pb2.BadRequest(field_violations=errors)
            abort_with_details(
                context,
                grpc.StatusCode.INVALID_ARGUMENT,
                "Validation failed",
                [bad_request],
            )

        # ... create user


# Client error handling
def get_user_safe(client, user_id):
    try:
        return client.get_user(user_id)
    except grpc.RpcError as e:
        status = rpc_status.from_call(e)
        if status:
            for detail in status.details:
                if detail.Is(error_details_pb2.BadRequest.DESCRIPTOR):
                    bad_request = error_details_pb2.BadRequest()
                    detail.Unpack(bad_request)
                    for violation in bad_request.field_violations:
                        print(f"Field {violation.field}: {violation.description}")
        raise
```

## Health Checks and Load Balancing

```python
from grpc_health.v1 import health, health_pb2, health_pb2_grpc

# Server-side health
health_servicer = health.HealthServicer()
health_pb2_grpc.add_HealthServicer_to_server(health_servicer, server)

# Set service health status
health_servicer.set("user.v1.UserService", health_pb2.HealthCheckResponse.SERVING)
health_servicer.set("", health_pb2.HealthCheckResponse.SERVING)  # Overall health

# Client-side health check
from grpc_health.v1 import health_pb2_grpc

health_stub = health_pb2_grpc.HealthStub(channel)
response = health_stub.Check(
    health_pb2.HealthCheckRequest(service="user.v1.UserService")
)
print(f"Service status: {response.status}")

# Load balancing with multiple backends
channel = grpc.insecure_channel(
    "dns:///users.service.local:50051",
    options=[
        ("grpc.lb_policy_name", "round_robin"),
        ("grpc.service_config", '{"loadBalancingConfig": [{"round_robin": {}}]}'),
    ],
)
```

## Key Decisions

| Decision | Recommendation |
|----------|----------------|
| Proto organization | One service per file, shared messages in common.proto |
| Versioning | Package version (user.v1, user.v2), backward compatible |
| Streaming | Server stream for large lists, bidirectional for real-time |
| Error codes | Use standard gRPC codes, add details for validation |
| Auth | Interceptor with metadata, JWT tokens |
| Timeouts | Always set client-side deadlines |
| Health checks | Required for load balancers (Kubernetes, Envoy) |

## References

For detailed implementation patterns, see:

- `references/streaming-patterns.md` - All 4 streaming types with async patterns
- `references/interceptor-patterns.md` - Server/client interceptors for logging, auth, retry
- `references/health-check-setup.md` - gRPC health checking service implementation
- `references/error-handling.md` - Status codes, error propagation, exception mapping

## Templates

Production-ready code templates:

- `templates/grpc-server-template.py` - Async server with health checks, graceful shutdown
- `templates/grpc-client-template.py` - Async client with retry interceptor, connection pool
- `templates/proto-service-template.proto` - Well-structured proto3 with all RPC types

## Checklists

- `checklists/grpc-production-checklist.md` - Pre-deployment verification checklist

## Examples

- `examples/user-service-example.md` - Complete CRUD user service implementation

## Anti-Patterns (FORBIDDEN)

```python
# NEVER skip deadline/timeout
stub.GetUser(request)  # Can hang forever

# CORRECT
stub.GetUser(request, timeout=5.0)

# NEVER ignore streaming cancellation
def ListUsers(self, request, context):
    for user in all_users:
        yield user  # Client may have disconnected!

# CORRECT
def ListUsers(self, request, context):
    for user in all_users:
        if not context.is_active():
            return
        yield user

# NEVER return None for message fields
return pb2.User()  # Missing required fields

# NEVER use proto2 syntax for new services
syntax = "proto2";  # Use proto3!

# ALWAYS close channels
channel.close()  # Prevents resource leaks
```

## Related Skills

- `api-design-framework` - REST/OpenAPI patterns
- `strawberry-graphql` - GraphQL alternative
- `streaming-api-patterns` - SSE/WebSocket patterns
- `contract-testing` - Service contract verification

## Capability Details

### proto-definition
**Keywords:** protobuf, proto3, message, service, grpc definition
**Solves:**
- Define gRPC service contracts
- Message schema design
- Code generation setup

### server-implementation
**Keywords:** grpc server, servicer, streaming server
**Solves:**
- Implement gRPC services
- Handle streaming requests
- Server configuration

### client-patterns
**Keywords:** grpc client, stub, channel, client streaming
**Solves:**
- Create gRPC clients
- Handle streaming responses
- Connection management

### interceptors
**Keywords:** grpc interceptor, middleware, logging, auth
**Solves:**
- Add cross-cutting concerns
- Authentication/authorization
- Logging and metrics

### error-handling
**Keywords:** grpc error, status code, error details
**Solves:**
- Rich error responses
- Validation error details
- Client error handling
