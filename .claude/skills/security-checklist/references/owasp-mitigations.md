# OWASP Top 10 2021 - Mitigations for Python/FastAPI

## Overview

Practical mitigation strategies for OWASP Top 10 2021 vulnerabilities in Python/FastAPI applications.

## A01:2021 – Broken Access Control

### Risk
Users can access resources they shouldn't (e.g., view other users' data, admin endpoints).

### Mitigations

#### 1. Dependency-Based Authorization
```python
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer

security = HTTPBearer()

async def get_current_user(credentials = Depends(security)) -> User:
    """Validate JWT token and return current user"""
    token = credentials.credentials
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
    user_id = payload.get("sub")
    
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user = await user_repository.get_by_id(user_id)
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found")
    
    return user
```

#### 2. Resource-Level Authorization
```python
@router.get("/{analysis_id}")
async def get_analysis(
    analysis_id: UUID,
    current_user: User = Depends(get_current_user)
) -> AnalysisResponse:
    """Get analysis - enforce ownership check"""
    
    analysis = await repository.get_by_id(analysis_id)
    
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    # CRITICAL: Check ownership
    if analysis.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    return analysis
```

---

## A02:2021 – Cryptographic Failures

### Risk
Sensitive data exposed through weak encryption or plaintext storage.

### Mitigations

#### 1. Hash Passwords Properly
```python
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)
```

#### 2. Enforce HTTPS
```python
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware

if settings.ENVIRONMENT == "production":
    app.add_middleware(HTTPSRedirectMiddleware)
```

---

## A03:2021 – Injection

### Risk
SQL injection, command injection through unsanitized user input.

### Mitigations

#### 1. Use Parameterized Queries
```python
# ✅ GOOD: Parameterized query
async def search_analyses(query: str, user_id: UUID):
    stmt = (
        select(Analysis)
        .where(Analysis.user_id == user_id)
        .where(Analysis.title.ilike(f"%{query}%"))  # SQLAlchemy escapes
    )
    return await session.execute(stmt)

# ❌ BAD: String concatenation (SQL injection risk)
async def search_unsafe(query: str):
    # NEVER DO THIS
    sql = f"SELECT * FROM analyses WHERE title LIKE '%{query}%'"
    return await session.execute(text(sql))
```

#### 2. Validate Input with Pydantic
```python
from pydantic import BaseModel, HttpUrl, constr

class AnalysisCreateRequest(BaseModel):
    url: HttpUrl  # Validates URL format
    title: constr(min_length=1, max_length=500)
    tags: list[constr(max_length=50)] = Field(max_items=10)
```

---

## A04:2021 – Insecure Design

### Risk
Missing security controls (no rate limiting, unlimited file uploads).

### Mitigations

#### 1. Rate Limiting
```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@router.post("/analyze")
@limiter.limit("10/minute")
async def create_analysis(request: Request, data: AnalysisCreateRequest):
    pass
```

#### 2. Input Size Limits
```python
class RequestSizeLimitMiddleware(BaseHTTPMiddleware):
    """Limit request body size to prevent DoS"""
    
    def __init__(self, app, max_size: int = 10 * 1024 * 1024):  # 10MB
        super().__init__(app)
        self.max_size = max_size
    
    async def dispatch(self, request: Request, call_next):
        if request.headers.get("content-length"):
            content_length = int(request.headers["content-length"])
            if content_length > self.max_size:
                return JSONResponse(status_code=413, content={"detail": "Request too large"})
        
        return await call_next(request)
```

---

## A05:2021 – Security Misconfiguration

### Risk
Default credentials, verbose errors, unnecessary services enabled.

### Mitigations

#### 1. Secure Defaults
```python
class Settings(BaseSettings):
    # No default secrets - force explicit configuration
    SECRET_KEY: str  # Required, no default
    DATABASE_URL: str
    
    # Secure defaults
    DEBUG: bool = False
    ALLOWED_HOSTS: list[str] = ["localhost"]
    CORS_ORIGINS: list[str] = []
    ENABLE_SWAGGER: bool = False  # Disable docs in prod
```

#### 2. Security Headers
```python
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000"
        
        return response
```

---

## A06:2021 – Vulnerable Dependencies

### Risk
Using libraries with known vulnerabilities.

### Mitigations

#### 1. Automated Scanning
```bash
# Run on every PR
poetry run pip-audit
```

#### 2. CI Integration
```yaml
- name: Security scan
  run: |
    poetry run pip-audit
    CRITICAL=$(poetry run pip-audit --format json | jq '.vulnerabilities[] | select(.severity == "CRITICAL") | length')
    if [ "$CRITICAL" -gt 0 ]; then
      exit 1
    fi
```

---

## A07:2021 – Authentication Failures

### Risk
Weak passwords, session fixation, credential stuffing.

### Mitigations

#### 1. Strong Password Requirements
```python
from pydantic import validator
import re

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    
    @validator("password")
    def validate_password_strength(cls, v):
        if len(v) < 12:
            raise ValueError("Password must be at least 12 characters")
        if not re.search(r'[A-Z]', v):
            raise ValueError("Password must contain uppercase letter")
        if not re.search(r'[a-z]', v):
            raise ValueError("Password must contain lowercase letter")
        if not re.search(r'[0-9]', v):
            raise ValueError("Password must contain digit")
        return v
```

#### 2. Account Lockout
```python
async def check_account_lockout(email: str) -> bool:
    failed_attempts = await redis.get(f"failed_login:{email}")
    
    if failed_attempts and int(failed_attempts) >= 5:
        lockout_until = await redis.get(f"lockout:{email}")
        if lockout_until and datetime.fromisoformat(lockout_until) > datetime.utcnow():
            return True
    
    return False
```

---

## A08:2021 – Software Integrity Failures

### Risk
Insecure CI/CD, deserialization vulnerabilities.

### Mitigations

#### 1. Secure Deserialization
```python
# ✅ GOOD: Use Pydantic (type-safe)
def deserialize_safe(data: str, model: type[BaseModel]):
    return model.model_validate_json(data)

# ❌ BAD: Using pickle (code execution risk)
import pickle
def deserialize_unsafe(data: bytes):
    return pickle.loads(data)  # NEVER DO THIS
```

---

## A09:2021 – Logging & Monitoring Failures

### Risk
Insufficient logging, no alerting on suspicious activity.

### Mitigations

#### 1. Security Event Logging
```python
async def log_security_event(event_type: str, user_id: Optional[UUID], details: dict):
    logger.log(
        "WARNING",
        event_type,
        user_id=str(user_id) if user_id else None,
        ip_address=request.client.host,
        **details
    )
```

---

## A10:2021 – Server-Side Request Forgery (SSRF)

### Risk
Attacker provides URL causing server to access internal resources.

### Mitigations

#### 1. URL Validation
```python
import ipaddress
from urllib.parse import urlparse

BLOCKED_NETWORKS = [
    ipaddress.ip_network("127.0.0.0/8"),
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("192.168.0.0/16"),
]

async def validate_url_safe(url: str) -> bool:
    parsed = urlparse(url)
    
    if parsed.scheme not in ["http", "https"]:
        raise ValueError(f"Scheme {parsed.scheme} not allowed")
    
    import socket
    ip = socket.gethostbyname(parsed.hostname)
    ip_obj = ipaddress.ip_address(ip)
    
    for network in BLOCKED_NETWORKS:
        if ip_obj in network:
            raise ValueError(f"Access to {ip} not allowed (internal network)")
    
    return True
```

#### 2. Disable Redirects
```python
async def fetch_url(url: str) -> str:
    await validate_url_safe(url)
    
    async with httpx.AsyncClient(follow_redirects=False, timeout=30.0) as client:
        response = await client.get(url)
        return response.text
```

---

## Quick Reference Checklist

- [ ] **A01**: Enforce authorization on all endpoints
- [ ] **A02**: Encrypt sensitive data, use HTTPS
- [ ] **A03**: Use parameterized queries, validate input
- [ ] **A04**: Add rate limiting, timeouts, size limits
- [ ] **A05**: Secure defaults, no verbose errors in production
- [ ] **A06**: Run pip-audit in CI, update dependencies monthly
- [ ] **A07**: Strong passwords, secure session management
- [ ] **A08**: Avoid pickle, verify dependencies
- [ ] **A09**: Log security events, monitor for anomalies
- [ ] **A10**: Validate URLs, block internal networks

---

**References**:
- [OWASP Top 10 2021](https://owasp.org/Top10/)
- [FastAPI Security](https://fastapi.tiangolo.com/tutorial/security/)
