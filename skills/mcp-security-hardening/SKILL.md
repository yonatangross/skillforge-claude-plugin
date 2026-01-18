---
name: mcp-security-hardening
description: MCP security patterns for prompt injection defense, tool poisoning prevention, and permission management. Use when securing MCP servers, validating tool descriptions, implementing allowlists.
version: 1.0.0
tags: [mcp, security, prompt-injection, tool-poisoning, allowlist, zero-trust, 2026]
context: fork
agent: security-auditor
author: SkillForge
user-invocable: false
---

# MCP Security Hardening

## Overview

Defense-in-depth security patterns for Model Context Protocol (MCP) integrations. Protects against prompt injection via tool descriptions, tool poisoning attacks (TPA), rug pulls, and unauthorized access through comprehensive sanitization, allowlisting, and permission management.

## When to Use

- Securing MCP server implementations
- Validating tool descriptions before LLM exposure
- Implementing zero-trust tool allowlists
- Detecting tool poisoning attacks (TPA)
- Managing tool permissions and capabilities
- Securing session management for MCP

## Core Security Principle

> **Treat ALL tool descriptions as untrusted input.**
> **Validate tool identity with hash verification.**
> **Apply least privilege to all tool capabilities.**

## The MCP Threat Model

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         MCP THREAT LANDSCAPE                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐             │
│   │   PROMPT     │    │    TOOL      │    │   SESSION    │             │
│   │  INJECTION   │    │  POISONING   │    │   HIJACK     │             │
│   └──────┬───────┘    └──────┬───────┘    └──────┬───────┘             │
│          │                   │                   │                      │
│          ▼                   ▼                   ▼                      │
│   ┌──────────────────────────────────────────────────────────┐         │
│   │                   DEFENSE LAYERS                          │         │
│   ├──────────────────────────────────────────────────────────┤         │
│   │ Layer 1: Request Sanitization (tool descriptions)        │         │
│   │ Layer 2: Zero-Trust Allowlist (hash verification)        │         │
│   │ Layer 3: Capability Declarations (least privilege)       │         │
│   │ Layer 4: Response Filtering (output sanitization)        │         │
│   │ Layer 5: Session Security (crypto IDs, rate limits)      │         │
│   └──────────────────────────────────────────────────────────┘         │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Threat Model Summary

| Attack Vector | Defense | Implementation |
|---------------|---------|----------------|
| Tool Poisoning (TPA) | Zero-trust allowlist | Hash verification, mandatory vetting |
| Prompt Injection | Description sanitization | Regex filtering, encoding detection |
| Rug Pull | Change detection | Hash comparison on each invocation |
| Data Exfiltration | Output filtering | Sensitive pattern removal |
| Session Hijacking | Secure sessions | Cryptographic IDs, no auth in sessions |
| Capability Abuse | Least privilege | Scoped tool declarations |

## Multi-Layer Defense Architecture

### Layer 1: Tool Description Sanitization

```python
import re
from typing import Optional

FORBIDDEN_PATTERNS = [
    r"ignore previous",
    r"system prompt",
    r"<.*instruction.*>",
    r"IMPORTANT:",
    r"override",
    r"admin",
    r"execute",
    r"sudo",
    r"as root",
    r"\\x[0-9a-fA-F]{2}",  # Hex encoding
    r"&#x?[0-9a-fA-F]+;",  # HTML entities
]

def sanitize_tool_description(description: str) -> str:
    """
    Treat ALL tool descriptions as untrusted input.
    Remove any instruction-like phrases or encoding tricks.
    """
    if not description:
        return ""

    sanitized = description
    for pattern in FORBIDDEN_PATTERNS:
        sanitized = re.sub(pattern, "[REDACTED]", sanitized, flags=re.I)

    # Decode and re-sanitize to catch encoding tricks
    try:
        decoded = sanitized.encode().decode('unicode_escape')
        for pattern in FORBIDDEN_PATTERNS:
            decoded = re.sub(pattern, "[REDACTED]", decoded, flags=re.I)
        sanitized = decoded
    except (UnicodeDecodeError, ValueError):
        pass

    return sanitized.strip()


def detect_injection_attempt(description: str) -> Optional[str]:
    """Detect prompt injection patterns in tool descriptions."""
    injection_indicators = [
        (r"ignore.*previous", "instruction_override"),
        (r"you are now", "role_hijack"),
        (r"new instructions", "instruction_injection"),
        (r"forget.*above", "context_wipe"),
        (r"<\|.*\|>", "delimiter_attack"),
        (r"```system", "markdown_injection"),
    ]

    for pattern, attack_type in injection_indicators:
        if re.search(pattern, description, re.I):
            return attack_type
    return None
```

### Layer 2: Zero-Trust Tool Allowlist

```python
from hashlib import sha256
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Optional
import json

@dataclass
class AllowedTool:
    """Represents a vetted and approved MCP tool."""
    name: str
    description_hash: str
    capabilities: list[str]
    approved_at: datetime
    approved_by: str
    max_calls_per_minute: int = 60
    requires_human_approval: bool = False
    allowed_arguments: Optional[list[str]] = None

class MCPToolAllowlist:
    """
    Zero-trust allowlist for MCP tools.
    Every tool must be explicitly vetted before use.
    """

    def __init__(self):
        self._allowed_tools: dict[str, AllowedTool] = {}
        self._call_counts: dict[str, list[datetime]] = {}

    def register(self, tool: AllowedTool) -> None:
        """Register a vetted tool in the allowlist."""
        self._allowed_tools[tool.name] = tool
        self._call_counts[tool.name] = []

    def compute_hash(self, description: str) -> str:
        """Compute hash of tool description for verification."""
        return sha256(description.encode('utf-8')).hexdigest()

    def validate(self, tool_name: str, description: str) -> tuple[bool, str]:
        """
        Validate tool against allowlist with hash verification.
        Returns (is_valid, reason).
        """
        if tool_name not in self._allowed_tools:
            return False, f"Tool '{tool_name}' not in allowlist"

        expected = self._allowed_tools[tool_name]
        actual_hash = self.compute_hash(description)

        if actual_hash != expected.description_hash:
            return False, f"Tool description changed (possible rug pull)"

        # Rate limit check
        now = datetime.now(timezone.utc)
        recent_calls = [
            t for t in self._call_counts[tool_name]
            if (now - t).total_seconds() < 60
        ]
        if len(recent_calls) >= expected.max_calls_per_minute:
            return False, "Rate limit exceeded"

        self._call_counts[tool_name] = recent_calls + [now]
        return True, "Validated"

    def requires_approval(self, tool_name: str) -> bool:
        """Check if tool requires human-in-the-loop approval."""
        if tool_name not in self._allowed_tools:
            return True  # Unknown tools always need approval
        return self._allowed_tools[tool_name].requires_human_approval

    def export(self) -> str:
        """Export allowlist for audit."""
        return json.dumps({
            name: {
                "description_hash": tool.description_hash,
                "capabilities": tool.capabilities,
                "approved_at": tool.approved_at.isoformat(),
                "approved_by": tool.approved_by,
            }
            for name, tool in self._allowed_tools.items()
        }, indent=2)
```

### Layer 3: Capability Declarations

```python
from enum import Enum
from dataclasses import dataclass

class ToolCapability(Enum):
    """MCP tool capability scopes."""
    READ_FILE = "read:file"
    WRITE_FILE = "write:file"
    EXECUTE_COMMAND = "execute:command"
    NETWORK_REQUEST = "network:request"
    DATABASE_READ = "database:read"
    DATABASE_WRITE = "database:write"
    SENSITIVE_DATA = "sensitive:data"

@dataclass
class CapabilityDeclaration:
    """Declares what a tool is allowed to do."""
    tool_name: str
    allowed_capabilities: set[ToolCapability]
    denied_paths: list[str] = field(default_factory=list)
    allowed_hosts: list[str] = field(default_factory=list)

    def can_perform(self, capability: ToolCapability) -> bool:
        """Check if tool can perform a capability."""
        return capability in self.allowed_capabilities

    def validate_path(self, path: str) -> bool:
        """Validate path is not denied."""
        for denied in self.denied_paths:
            if path.startswith(denied):
                return False
        return True

class CapabilityEnforcer:
    """Enforces capability declarations for MCP tools."""

    SENSITIVE_PATHS = [
        "/etc/passwd", "/etc/shadow", "~/.ssh",
        ".env", "credentials", "secrets",
    ]

    def __init__(self):
        self._declarations: dict[str, CapabilityDeclaration] = {}

    def register(self, declaration: CapabilityDeclaration) -> None:
        """Register capability declaration for a tool."""
        self._declarations[declaration.tool_name] = declaration

    def check(
        self,
        tool_name: str,
        capability: ToolCapability,
        resource: str = ""
    ) -> tuple[bool, str]:
        """
        Check if tool can perform capability on resource.
        Returns (allowed, reason).
        """
        if tool_name not in self._declarations:
            return False, "No capability declaration found"

        decl = self._declarations[tool_name]

        if not decl.can_perform(capability):
            return False, f"Capability {capability.value} not allowed"

        # Check sensitive paths for file operations
        if capability in (ToolCapability.READ_FILE, ToolCapability.WRITE_FILE):
            for sensitive in self.SENSITIVE_PATHS:
                if sensitive in resource:
                    return False, f"Access to sensitive path denied"
            if not decl.validate_path(resource):
                return False, f"Path {resource} is denied"

        # Check allowed hosts for network
        if capability == ToolCapability.NETWORK_REQUEST:
            if decl.allowed_hosts and not any(
                host in resource for host in decl.allowed_hosts
            ):
                return False, "Host not in allowlist"

        return True, "Allowed"
```

### Layer 4: Session Security

```python
import secrets
import re
from datetime import datetime, timedelta, timezone
from dataclasses import dataclass
from typing import Optional

def generate_secure_session_id() -> str:
    """Generate cryptographically secure session ID."""
    return secrets.token_urlsafe(32)  # 256 bits of entropy

def validate_session_id(
    session_id: str,
    expected_format: str = r'^[A-Za-z0-9_-]{43}$'
) -> bool:
    """Validate session ID format."""
    return bool(re.match(expected_format, session_id))

@dataclass
class MCPSession:
    """Secure MCP session with rate limiting."""
    session_id: str
    created_at: datetime
    last_activity: datetime
    request_count: int = 0
    max_requests_per_minute: int = 100
    timeout_minutes: int = 30

    def is_valid(self) -> tuple[bool, str]:
        """Check if session is still valid."""
        now = datetime.now(timezone.utc)

        # Check timeout
        if (now - self.last_activity) > timedelta(minutes=self.timeout_minutes):
            return False, "Session timed out"

        # Validate session ID format
        if not validate_session_id(self.session_id):
            return False, "Invalid session ID format"

        return True, "Valid"

    def record_request(self) -> tuple[bool, str]:
        """Record request and check rate limit."""
        now = datetime.now(timezone.utc)

        # Reset counter if new minute
        if (now - self.last_activity).total_seconds() >= 60:
            self.request_count = 0

        self.request_count += 1
        self.last_activity = now

        if self.request_count > self.max_requests_per_minute:
            return False, "Rate limit exceeded"

        return True, "OK"

class MCPSessionManager:
    """Manages MCP sessions with security controls."""

    def __init__(self):
        self._sessions: dict[str, MCPSession] = {}

    def create_session(self) -> MCPSession:
        """Create a new secure session."""
        session_id = generate_secure_session_id()
        now = datetime.now(timezone.utc)
        session = MCPSession(
            session_id=session_id,
            created_at=now,
            last_activity=now,
        )
        self._sessions[session_id] = session
        return session

    def get_session(self, session_id: str) -> Optional[MCPSession]:
        """Get session if valid."""
        session = self._sessions.get(session_id)
        if session:
            is_valid, _ = session.is_valid()
            if is_valid:
                return session
            else:
                self.invalidate_session(session_id)
        return None

    def invalidate_session(self, session_id: str) -> None:
        """Invalidate and remove session."""
        self._sessions.pop(session_id, None)

    def cleanup_expired(self) -> int:
        """Remove all expired sessions. Returns count removed."""
        expired = [
            sid for sid, session in self._sessions.items()
            if not session.is_valid()[0]
        ]
        for sid in expired:
            self._sessions.pop(sid, None)
        return len(expired)
```

## Anti-Patterns (FORBIDDEN)

```python
# ❌ NEVER trust tool descriptions without sanitization
def call_tool(tool):
    prompt = f"Use this tool: {tool.description}"  # INJECTION RISK

# ❌ NEVER allow tools without explicit vetting
def discover_tools():
    return mcp.list_tools()  # No validation!

# ❌ NEVER store auth tokens in session IDs
session_id = f"{user_id}:{auth_token}"  # CREDENTIAL LEAK

# ❌ NEVER skip hash verification on tool calls
def invoke_tool(name):
    return tools[name].execute()  # No rug pull detection

# ✅ ALWAYS sanitize tool descriptions
sanitized = sanitize_tool_description(tool.description)

# ✅ ALWAYS validate against allowlist with hash
is_valid, reason = allowlist.validate(tool.name, tool.description)

# ✅ ALWAYS use cryptographic session IDs
session_id = secrets.token_urlsafe(32)

# ✅ ALWAYS verify tool hash on each invocation
if allowlist.compute_hash(tool.description) != expected_hash:
    raise SecurityError("Tool description changed")
```

## Key Decisions

| Decision | Recommendation |
|----------|----------------|
| Tool trust model | Zero-trust (explicit allowlist) |
| Description handling | Sanitize + hash verify |
| Session IDs | Cryptographic (secrets.token_urlsafe) |
| Rate limiting | Per-tool and per-session |
| Sensitive operations | Human-in-the-loop approval |
| Change detection | Hash comparison on each call |

## Detailed Documentation

| Resource | Description |
|----------|-------------|
| [references/prompt-injection-defense.md](references/prompt-injection-defense.md) | Injection patterns and encoding tricks |
| [references/tool-poisoning-attacks.md](references/tool-poisoning-attacks.md) | TPA detection and rug pull prevention |
| [references/tool-permissions.md](references/tool-permissions.md) | Capability declarations and least privilege |
| [references/session-security.md](references/session-security.md) | Secure session management patterns |
| [checklists/mcp-security-audit.md](checklists/mcp-security-audit.md) | Pre-deployment security checklist |
| [templates/tool-allowlist.py](templates/tool-allowlist.py) | Zero-trust MCP tool validator with hash verification |
| [templates/session-security.py](templates/session-security.py) | Cryptographic session manager with state machine |

## Related Skills

- `llm-safety-patterns` - LLM-specific security patterns
- `input-validation` - Input sanitization fundamentals
- `auth-patterns` - Session and token security
- `defense-in-depth` - Layered security architecture
- `owasp-top-10` - Web security fundamentals

## Capability Details

### prompt-injection-defense
**Keywords:** prompt injection, tool description, sanitization, encoding
**Solves:**
- How do I prevent prompt injection via tool descriptions?
- How do I detect encoding tricks in tool metadata?
- How do I sanitize MCP tool responses?

### tool-poisoning-prevention
**Keywords:** tool poisoning, TPA, rug pull, malicious tool, hash verification
**Solves:**
- How do I detect tool poisoning attacks?
- How do I prevent rug pull attacks on tools?
- How do I verify tool integrity over time?

### tool-allowlist
**Keywords:** allowlist, whitelist, zero-trust, tool vetting, approved tools
**Solves:**
- How do I implement a tool allowlist?
- How do I vet tools before allowing them?
- How do I manage approved tool inventory?

### capability-management
**Keywords:** capability, permission, least privilege, access control
**Solves:**
- How do I declare tool capabilities?
- How do I enforce least privilege for tools?
- How do I restrict tool access to sensitive resources?

### session-security
**Keywords:** session, session ID, rate limit, timeout, authentication
**Solves:**
- How do I generate secure session IDs?
- How do I implement rate limiting for MCP?
- How do I manage session lifecycle securely?

---

**Version:** 1.0.0 (January 2026)
