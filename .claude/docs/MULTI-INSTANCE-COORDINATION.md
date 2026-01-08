# Multi-Instance Claude Code Coordination via Git Worktrees

## Executive Summary

This document defines a coordination system for multiple Claude Code instances working simultaneously on the same codebase using git worktrees. The design prevents conflicts, shares knowledge without duplication, coordinates work assignment, and implements quality gates to prevent low-quality output ("slop").

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                    MULTI-INSTANCE COORDINATION ARCHITECTURE                           │
│                              (Git Worktree Pattern)                                   │
├──────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                       │
│   ┌───────────────────────────────────────────────────────────────────────────────┐  │
│   │                          SHARED GIT REPOSITORY                                 │  │
│   │   ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐          │  │
│   │   │   .git/         │    │  .claude/       │    │  main branch    │          │  │
│   │   │  (shared refs)  │◄───│  (symlinked)    │    │  (protected)    │          │  │
│   │   └─────────────────┘    └─────────────────┘    └─────────────────┘          │  │
│   └───────────────────────────────────────────────────────────────────────────────┘  │
│                    │                    │                    │                        │
│           ┌───────┴────────┐  ┌────────┴────────┐  ┌────────┴────────┐              │
│           ▼                ▼  ▼                 ▼  ▼                 ▼              │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│   │  WORKTREE 1 │  │  WORKTREE 2 │  │  WORKTREE 3 │  │  WORKTREE N │              │
│   │  (main-wt)  │  │ (feature-A) │  │ (feature-B) │  │ (feature-X) │              │
│   │             │  │             │  │             │  │             │              │
│   │ ┌─────────┐ │  │ ┌─────────┐ │  │ ┌─────────┐ │  │ ┌─────────┐ │              │
│   │ │ Claude  │ │  │ │ Claude  │ │  │ │ Claude  │ │  │ │ Claude  │ │              │
│   │ │Instance │ │  │ │Instance │ │  │ │Instance │ │  │ │Instance │ │              │
│   │ │   #1    │ │  │ │   #2    │ │  │ │   #3    │ │  │ │   #N    │ │              │
│   │ └────┬────┘ │  │ └────┬────┘ │  │ └────┬────┘ │  │ └────┬────┘ │              │
│   │      │      │  │      │      │  │      │      │  │      │      │              │
│   │ ┌────▼────┐ │  │ ┌────▼────┐ │  │ ┌────▼────┐ │  │ ┌────▼────┐ │              │
│   │ │.instance│ │  │ │.instance│ │  │ │.instance│ │  │ │.instance│ │              │
│   │ │/state   │ │  │ │/state   │ │  │ │/state   │ │  │ │/state   │ │              │
│   │ └─────────┘ │  │ └─────────┘ │  │ └─────────┘ │  │ └─────────┘ │              │
│   └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘              │
│           │                │                │                │                     │
│           └────────────────┴────────────────┴────────────────┘                     │
│                                      │                                             │
│                                      ▼                                             │
│                      ┌───────────────────────────────┐                             │
│                      │     COORDINATION LAYER        │                             │
│                      │  ┌─────────────────────────┐  │                             │
│                      │  │  SQLite (.claude.db)   │  │                             │
│                      │  │  - File locks          │  │                             │
│                      │  │  - Work claims         │  │                             │
│                      │  │  - Shared knowledge    │  │                             │
│                      │  └─────────────────────────┘  │                             │
│                      │  ┌─────────────────────────┐  │                             │
│                      │  │  Redis (optional)      │  │                             │
│                      │  │  - Pub/sub messaging   │  │                             │
│                      │  │  - Distributed locks   │  │                             │
│                      │  └─────────────────────────┘  │                             │
│                      └───────────────────────────────┘                             │
│                                                                                     │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. System Architecture

### 1.1 Directory Structure

```
~/projects/
├── skillforge/                      # Main repo (bare or regular)
│   ├── .git/                        # Shared git objects
│   ├── .claude/                     # Shared Claude config (git-tracked)
│   │   ├── context/                 # Shared context
│   │   │   ├── identity.json        # Project identity (immutable)
│   │   │   ├── knowledge/           # Shared knowledge base
│   │   │   └── patterns/            # Established patterns
│   │   ├── coordination/            # NEW: Multi-instance coordination
│   │   │   ├── config.json          # Coordination config
│   │   │   ├── .claude.db           # SQLite coordination database
│   │   │   └── locks/               # File-based locks (fallback)
│   │   ├── skills/                  # Shared skills
│   │   └── hooks/                   # Shared hooks
│   └── src/                         # Source code
│
├── skillforge-wt-feature-a/         # Worktree 1
│   ├── .git                         # File pointing to main .git
│   ├── .claude -> ../skillforge/.claude  # Symlink to shared config
│   ├── .instance/                   # Instance-specific state (gitignored)
│   │   ├── id.json                  # Instance identity
│   │   ├── session.json             # Current session state
│   │   ├── claims.json              # Active work claims
│   │   └── quality-evidence/        # Evidence for this instance
│   └── src/                         # Working copy
│
├── skillforge-wt-feature-b/         # Worktree 2
│   ├── .git
│   ├── .claude -> ../skillforge/.claude
│   ├── .instance/
│   └── src/
│
└── skillforge-wt-bugfix-c/          # Worktree 3
    ├── .git
    ├── .claude -> ../skillforge/.claude
    ├── .instance/
    └── src/
```

### 1.2 Instance Identity Schema

```json
// .instance/id.json
{
  "$schema": "coordination://instance/v1",
  "instance_id": "wt-feature-a-2026-01-08-abc123",
  "worktree_name": "feature-a",
  "branch": "feature/v4.5.0-auth-refactor",
  "created_at": "2026-01-08T14:30:00Z",
  "capabilities": ["backend", "testing"],
  "agent_type": "backend-system-architect",
  "model": "claude-opus-4-5-20251101",
  "priority": 1,
  "heartbeat_interval_ms": 5000,
  "last_heartbeat": "2026-01-08T14:35:00Z",
  "status": "active"
}
```

---

## 2. Coordination Mechanisms

### 2.1 File Locking Strategy

```
┌───────────────────────────────────────────────────────────────────────────────────┐
│                           FILE LOCKING HIERARCHY                                   │
├───────────────────────────────────────────────────────────────────────────────────┤
│                                                                                    │
│   LOCK GRANULARITY                                                                 │
│   ─────────────────                                                                │
│                                                                                    │
│   ┌─────────────────────────────────────────────────────────────────────────────┐ │
│   │  LEVEL 1: Directory Lock (Coarse)                                           │ │
│   │  ─────────────────────────────────────                                      │ │
│   │  Use for: Major structural changes, refactoring entire modules              │ │
│   │  Example: /src/backend/auth/**                                              │ │
│   │  Lock file: .claude/coordination/locks/src-backend-auth.lock                │ │
│   └─────────────────────────────────────────────────────────────────────────────┘ │
│                              │                                                     │
│                              ▼                                                     │
│   ┌─────────────────────────────────────────────────────────────────────────────┐ │
│   │  LEVEL 2: File Lock (Medium)                                                │ │
│   │  ────────────────────────────                                               │ │
│   │  Use for: Editing specific files                                            │ │
│   │  Example: /src/backend/auth/service.py                                      │ │
│   │  Lock file: .claude/coordination/locks/src-backend-auth-service.py.lock    │ │
│   └─────────────────────────────────────────────────────────────────────────────┘ │
│                              │                                                     │
│                              ▼                                                     │
│   ┌─────────────────────────────────────────────────────────────────────────────┐ │
│   │  LEVEL 3: Region Lock (Fine - SQLite)                                       │ │
│   │  ────────────────────────────────────                                       │ │
│   │  Use for: Editing specific functions/classes within a file                  │ │
│   │  Example: AuthService.validate_token() lines 45-78                          │ │
│   │  Stored in: .claude/coordination/.claude.db (region_locks table)            │ │
│   └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                    │
│   LOCK LIFECYCLE                                                                   │
│   ──────────────                                                                   │
│                                                                                    │
│   ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐               │
│   │  ACQUIRE │────►│  RENEW   │────►│  EXTEND  │────►│ RELEASE  │               │
│   └──────────┘     └──────────┘     └──────────┘     └──────────┘               │
│        │                │                 │                │                      │
│        │                │                 │                │                      │
│        ▼                ▼                 ▼                ▼                      │
│   Check owner     Heartbeat         Request more    Clear lock                   │
│   Check stale     Update TTL        time            Notify others                │
│   Create lock     5s interval       Max 2 extends                                │
│   TTL: 60s        TTL reset                                                      │
│                                                                                    │
└───────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Lock File Format

```json
// .claude/coordination/locks/src-backend-auth-service.py.lock
{
  "lock_id": "lock-abc123",
  "file_path": "src/backend/auth/service.py",
  "lock_type": "exclusive_write",
  "instance_id": "wt-feature-a-2026-01-08-abc123",
  "acquired_at": "2026-01-08T14:30:00Z",
  "expires_at": "2026-01-08T14:31:00Z",
  "extensions": 0,
  "max_extensions": 2,
  "reason": "Refactoring validate_token method",
  "regions": [
    {"start_line": 45, "end_line": 78, "function": "validate_token"}
  ]
}
```

### 2.3 SQLite Coordination Schema

```sql
-- .claude/coordination/.claude.db

-- Instance registry
CREATE TABLE instances (
    instance_id TEXT PRIMARY KEY,
    worktree_name TEXT NOT NULL,
    branch TEXT NOT NULL,
    agent_type TEXT,
    capabilities TEXT,  -- JSON array
    status TEXT CHECK(status IN ('active', 'idle', 'paused', 'terminated')),
    priority INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_heartbeat TIMESTAMP,
    UNIQUE(worktree_name)
);

-- File locks
CREATE TABLE file_locks (
    lock_id TEXT PRIMARY KEY,
    file_path TEXT NOT NULL,
    lock_type TEXT CHECK(lock_type IN ('exclusive_write', 'shared_read', 'directory')),
    instance_id TEXT REFERENCES instances(instance_id),
    acquired_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    extensions INTEGER DEFAULT 0,
    reason TEXT,
    UNIQUE(file_path, lock_type)
);

-- Region locks (fine-grained)
CREATE TABLE region_locks (
    region_id TEXT PRIMARY KEY,
    file_path TEXT NOT NULL,
    start_line INTEGER NOT NULL,
    end_line INTEGER NOT NULL,
    symbol_name TEXT,  -- function/class name
    instance_id TEXT REFERENCES instances(instance_id),
    acquired_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    UNIQUE(file_path, start_line, end_line)
);

-- Work claims (task assignment)
CREATE TABLE work_claims (
    claim_id TEXT PRIMARY KEY,
    task_description TEXT NOT NULL,
    task_type TEXT CHECK(task_type IN ('feature', 'bugfix', 'refactor', 'test', 'docs')),
    scope TEXT,  -- JSON array of file patterns
    instance_id TEXT REFERENCES instances(instance_id),
    status TEXT CHECK(status IN ('claimed', 'in_progress', 'blocked', 'completed', 'abandoned')),
    claimed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    blockers TEXT,  -- JSON array of blocking claim_ids
    evidence_path TEXT
);

-- Shared knowledge (cross-instance learning)
CREATE TABLE shared_knowledge (
    knowledge_id TEXT PRIMARY KEY,
    knowledge_type TEXT CHECK(knowledge_type IN ('decision', 'pattern', 'blocker', 'solution', 'anti_pattern')),
    content TEXT NOT NULL,  -- JSON
    source_instance TEXT REFERENCES instances(instance_id),
    confidence REAL CHECK(confidence BETWEEN 0 AND 1),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    references TEXT  -- JSON array of related knowledge_ids
);

-- Message queue (inter-instance communication)
CREATE TABLE messages (
    message_id TEXT PRIMARY KEY,
    from_instance TEXT REFERENCES instances(instance_id),
    to_instance TEXT REFERENCES instances(instance_id),  -- NULL for broadcast
    message_type TEXT CHECK(message_type IN (
        'lock_request', 'lock_granted', 'lock_denied',
        'work_offer', 'work_accept', 'work_reject',
        'knowledge_share', 'blocker_alert', 'help_request',
        'quality_review_request', 'quality_review_result'
    )),
    payload TEXT NOT NULL,  -- JSON
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP,
    acknowledged_at TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_file_locks_path ON file_locks(file_path);
CREATE INDEX idx_file_locks_expires ON file_locks(expires_at);
CREATE INDEX idx_region_locks_file ON region_locks(file_path);
CREATE INDEX idx_work_claims_instance ON work_claims(instance_id, status);
CREATE INDEX idx_messages_to_instance ON messages(to_instance, read_at);
CREATE INDEX idx_instances_status ON instances(status, last_heartbeat);
```

---

## 3. Work Coordination Protocol

### 3.1 Task Distribution Flow

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         WORK COORDINATION PROTOCOL                                   │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│   USER REQUEST                                                                       │
│        │                                                                             │
│        ▼                                                                             │
│   ┌────────────────────────────────────────────────────────────────────────────┐   │
│   │  SUPERVISOR INSTANCE (Priority 0)                                          │   │
│   │  ───────────────────────────────────                                        │   │
│   │                                                                              │   │
│   │  1. Parse user request                                                       │   │
│   │  2. Decompose into tasks                                                     │   │
│   │  3. Check instance capabilities                                              │   │
│   │  4. Check file locks                                                         │   │
│   │  5. Assign work with claims                                                  │   │
│   │                                                                              │   │
│   │  ┌─────────────────────────────────────────────────────────────────────┐   │   │
│   │  │  WORK ASSIGNMENT ALGORITHM                                          │   │   │
│   │  │                                                                      │   │   │
│   │  │  for each task in decomposed_tasks:                                 │   │   │
│   │  │      candidates = instances.filter(                                 │   │   │
│   │  │          status='active',                                           │   │   │
│   │  │          capabilities.overlaps(task.required_skills),               │   │   │
│   │  │          current_claims.count() < MAX_CLAIMS_PER_INSTANCE           │   │   │
│   │  │      )                                                              │   │   │
│   │  │                                                                      │   │   │
│   │  │      # Check for file conflicts                                     │   │   │
│   │  │      candidates = candidates.filter(                                │   │   │
│   │  │          not has_conflicting_locks(task.scope)                      │   │   │
│   │  │      )                                                              │   │   │
│   │  │                                                                      │   │   │
│   │  │      # Score and select                                             │   │   │
│   │  │      best = max(candidates, key=lambda c: (                         │   │   │
│   │  │          c.capability_match_score * 0.4 +                           │   │   │
│   │  │          c.locality_score * 0.3 +      # Already working nearby    │   │   │
│   │  │          (1 / (c.current_load + 1)) * 0.2 +                         │   │   │
│   │  │          c.success_rate * 0.1                                       │   │   │
│   │  │      ))                                                              │   │   │
│   │  │                                                                      │   │   │
│   │  │      assign_work(task, best)                                        │   │   │
│   │  │      acquire_locks(task.scope, best.instance_id)                    │   │   │
│   │  └─────────────────────────────────────────────────────────────────────┘   │   │
│   │                                                                              │   │
│   └────────────────────────────────────────────────────────────────────────────┘   │
│                              │                                                      │
│            ┌─────────────────┼─────────────────┐                                   │
│            ▼                 ▼                 ▼                                   │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                            │
│   │  Instance A  │  │  Instance B  │  │  Instance C  │                            │
│   │  (backend)   │  │  (frontend)  │  │  (testing)   │                            │
│   │              │  │              │  │              │                            │
│   │  Task: Auth  │  │  Task: UI    │  │  Task: E2E   │                            │
│   │  Files:      │  │  Files:      │  │  Files:      │                            │
│   │  - auth/*    │  │  - ui/*      │  │  - tests/*   │                            │
│   │              │  │              │  │              │                            │
│   │  [LOCKED]    │  │  [LOCKED]    │  │  [LOCKED]    │                            │
│   └──────┬───────┘  └──────┬───────┘  └──────┬───────┘                            │
│          │                 │                 │                                     │
│          └─────────────────┼─────────────────┘                                     │
│                            ▼                                                        │
│                   ┌────────────────┐                                               │
│                   │  AGGREGATION   │                                               │
│                   │  & MERGE       │                                               │
│                   │                │                                               │
│                   │  - Collect     │                                               │
│                   │  - Validate    │                                               │
│                   │  - Merge PRs   │                                               │
│                   └────────────────┘                                               │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Work Claim Protocol

```python
# Pseudo-code for work claiming

class WorkCoordinator:
    """Coordinates work across Claude instances."""

    def claim_work(self, task: Task, instance_id: str) -> ClaimResult:
        """Attempt to claim work with conflict checking."""

        # 1. Check for existing claims on same scope
        existing_claims = self.db.query("""
            SELECT * FROM work_claims
            WHERE status IN ('claimed', 'in_progress')
            AND scope_overlaps(scope, ?)
        """, task.scope)

        if existing_claims:
            return ClaimResult(
                success=False,
                reason="Scope conflict",
                conflicting_claims=existing_claims
            )

        # 2. Acquire necessary file locks
        lock_results = []
        for file_pattern in task.scope:
            lock = self.acquire_file_lock(
                file_path=file_pattern,
                instance_id=instance_id,
                lock_type="exclusive_write",
                reason=task.description
            )
            if not lock.success:
                # Rollback acquired locks
                self.release_locks(lock_results)
                return ClaimResult(
                    success=False,
                    reason=f"Lock conflict on {file_pattern}",
                    holder=lock.current_holder
                )
            lock_results.append(lock)

        # 3. Create work claim
        claim = WorkClaim(
            claim_id=generate_id(),
            task_description=task.description,
            task_type=task.type,
            scope=task.scope,
            instance_id=instance_id,
            status="claimed"
        )
        self.db.insert("work_claims", claim)

        # 4. Notify other instances
        self.broadcast_message(
            message_type="work_claimed",
            payload={
                "claim_id": claim.claim_id,
                "scope": task.scope,
                "instance_id": instance_id
            }
        )

        return ClaimResult(success=True, claim=claim, locks=lock_results)
```

---

## 4. Shared Knowledge System

### 4.1 Knowledge Sharing Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         SHARED KNOWLEDGE ARCHITECTURE                                │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│   KNOWLEDGE TYPES                                                                    │
│   ───────────────                                                                    │
│                                                                                      │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│   │  DECISIONS  │  │  PATTERNS   │  │  BLOCKERS   │  │ SOLUTIONS   │              │
│   │             │  │             │  │             │  │             │              │
│   │ "We chose   │  │ "Always use │  │ "Database   │  │ "Fixed by   │              │
│   │  Pydantic   │  │  TypedDict  │  │  migration  │  │  using      │              │
│   │  v2 for     │  │  for state" │  │  failed"    │  │  UUID type" │              │
│   │  validation"│  │             │  │             │  │             │              │
│   └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│          │                │                │                │                      │
│          └────────────────┴────────────────┴────────────────┘                      │
│                                      │                                             │
│                                      ▼                                             │
│                      ┌───────────────────────────────┐                             │
│                      │    KNOWLEDGE STORE (SQLite)   │                             │
│                      │                                │                             │
│                      │  ┌──────────────────────────┐ │                             │
│                      │  │ Deduplication            │ │                             │
│                      │  │ - Semantic similarity    │ │                             │
│                      │  │ - Hash-based exact match │ │                             │
│                      │  └──────────────────────────┘ │                             │
│                      │                                │                             │
│                      │  ┌──────────────────────────┐ │                             │
│                      │  │ Confidence Scoring       │ │                             │
│                      │  │ - Source reliability     │ │                             │
│                      │  │ - Verification count     │ │                             │
│                      │  │ - Recency                │ │                             │
│                      │  └──────────────────────────┘ │                             │
│                      │                                │                             │
│                      │  ┌──────────────────────────┐ │                             │
│                      │  │ Expiration               │ │                             │
│                      │  │ - Decisions: 30 days     │ │                             │
│                      │  │ - Patterns: 90 days      │ │                             │
│                      │  │ - Blockers: 7 days       │ │                             │
│                      │  │ - Solutions: 30 days     │ │                             │
│                      │  └──────────────────────────┘ │                             │
│                      └───────────────────────────────┘                             │
│                                      │                                             │
│            ┌─────────────────────────┼─────────────────────────┐                  │
│            ▼                         ▼                         ▼                  │
│   ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐              │
│   │   Instance A    │    │   Instance B    │    │   Instance C    │              │
│   │   ───────────   │    │   ───────────   │    │   ───────────   │              │
│   │                 │    │                 │    │                 │              │
│   │  Pull relevant  │    │  Pull relevant  │    │  Pull relevant  │              │
│   │  knowledge on   │    │  knowledge on   │    │  knowledge on   │              │
│   │  session start  │    │  session start  │    │  session start  │              │
│   │                 │    │                 │    │                 │              │
│   │  Push new       │    │  Push new       │    │  Push new       │              │
│   │  discoveries    │    │  discoveries    │    │  discoveries    │              │
│   │                 │    │                 │    │                 │              │
│   └─────────────────┘    └─────────────────┘    └─────────────────┘              │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Knowledge Sync Protocol

```python
class KnowledgeSyncProtocol:
    """Sync knowledge between instances without duplication."""

    def on_session_start(self, instance_id: str) -> KnowledgeBundle:
        """Pull relevant knowledge for this instance."""

        # Get instance capabilities
        instance = self.db.get_instance(instance_id)

        # Query relevant knowledge
        knowledge = self.db.query("""
            SELECT * FROM shared_knowledge
            WHERE expires_at > CURRENT_TIMESTAMP
            AND (
                -- Match by capability
                knowledge_type IN ('pattern', 'anti_pattern')
                AND json_extract(content, '$.domain') IN (
                    SELECT value FROM json_each(?)
                )
                -- Or recent high-confidence items
                OR (confidence > 0.8 AND created_at > datetime('now', '-1 day'))
                -- Or blockers (always relevant)
                OR knowledge_type = 'blocker'
            )
            ORDER BY confidence DESC, created_at DESC
            LIMIT 50
        """, instance.capabilities)

        return KnowledgeBundle(
            items=knowledge,
            synced_at=datetime.utcnow()
        )

    def on_discovery(self, instance_id: str, knowledge: Knowledge) -> bool:
        """Share new knowledge with deduplication."""

        # Check for duplicates
        existing = self.db.query("""
            SELECT * FROM shared_knowledge
            WHERE knowledge_type = ?
            AND content_hash = ?
        """, knowledge.type, hash(knowledge.content))

        if existing:
            # Boost confidence of existing
            self.db.execute("""
                UPDATE shared_knowledge
                SET confidence = MIN(1.0, confidence + 0.1),
                    references = json_insert(references, '$[#]', ?)
                WHERE knowledge_id = ?
            """, instance_id, existing.knowledge_id)
            return False  # Not new

        # Insert new knowledge
        self.db.insert("shared_knowledge", {
            "knowledge_id": generate_id(),
            "knowledge_type": knowledge.type,
            "content": json.dumps(knowledge.content),
            "source_instance": instance_id,
            "confidence": knowledge.initial_confidence,
            "expires_at": self.calculate_expiry(knowledge.type)
        })

        # Broadcast to other instances
        self.broadcast_message(
            message_type="knowledge_share",
            payload=knowledge
        )

        return True  # New knowledge added
```

---

## 5. Quality Gate System

### 5.1 Anti-Slop Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              QUALITY GATE SYSTEM                                     │
│                          (Multi-Instance Anti-Slop)                                  │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│   QUALITY DIMENSIONS                                                                 │
│   ──────────────────                                                                 │
│                                                                                      │
│   ┌───────────────────────────────────────────────────────────────────────────────┐ │
│   │                                                                                │ │
│   │    CODE         TESTS        DOCS         CONSISTENCY     EVIDENCE            │ │
│   │    ────         ─────        ────         ───────────     ────────            │ │
│   │                                                                                │ │
│   │    Linting      Coverage     Exists       Style match     Claims              │ │
│   │    Types        Assertions   Updated      Naming          Screenshots         │ │
│   │    Complexity   Edge cases   Accurate     Architecture    Test results        │ │
│   │                                                                                │ │
│   │    Weight: 30%  Weight: 25%  Weight: 15%  Weight: 15%     Weight: 15%         │ │
│   │                                                                                │ │
│   └───────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                      │
│   GATE LEVELS                                                                        │
│   ───────────                                                                        │
│                                                                                      │
│   ┌─────────────────────────────────────────────────────────────────────────────┐   │
│   │  GATE 1: Pre-Commit (Local)                                                 │   │
│   │  ─────────────────────────                                                  │   │
│   │  Runs in: Each worktree before commit                                       │   │
│   │  Checks:                                                                     │   │
│   │    - Linting passes                                                          │   │
│   │    - Types check                                                             │   │
│   │    - Unit tests pass                                                         │   │
│   │    - No secrets in code                                                      │   │
│   │  Blocking: Yes (must pass to commit)                                        │   │
│   │  Time limit: 60 seconds                                                      │   │
│   └─────────────────────────────────────────────────────────────────────────────┘   │
│                              │                                                      │
│                              ▼                                                      │
│   ┌─────────────────────────────────────────────────────────────────────────────┐   │
│   │  GATE 2: Pre-Push (Cross-Instance)                                          │   │
│   │  ──────────────────────────────────                                         │   │
│   │  Runs in: Coordination layer before push                                    │   │
│   │  Checks:                                                                     │   │
│   │    - Integration tests pass                                                  │   │
│   │    - No merge conflicts with other worktrees                                 │   │
│   │    - Coverage threshold met (80%)                                            │   │
│   │    - Evidence file exists and validates                                      │   │
│   │  Blocking: Yes (must pass to push)                                          │   │
│   │  Time limit: 5 minutes                                                       │   │
│   └─────────────────────────────────────────────────────────────────────────────┘   │
│                              │                                                      │
│                              ▼                                                      │
│   ┌─────────────────────────────────────────────────────────────────────────────┐   │
│   │  GATE 3: PR Review (Cross-Instance Peer Review)                             │   │
│   │  ──────────────────────────────────────────────                             │   │
│   │  Runs in: Another instance reviews the PR                                   │   │
│   │  Checks:                                                                     │   │
│   │    - Architecture consistency                                                │   │
│   │    - Pattern adherence                                                       │   │
│   │    - Documentation quality                                                   │   │
│   │    - Security review                                                         │   │
│   │  Blocking: Approval required                                                │   │
│   │  Reviewer assignment: Capability-based                                       │   │
│   └─────────────────────────────────────────────────────────────────────────────┘   │
│                              │                                                      │
│                              ▼                                                      │
│   ┌─────────────────────────────────────────────────────────────────────────────┐   │
│   │  GATE 4: Merge Validation (Final)                                           │   │
│   │  ─────────────────────────────────                                          │   │
│   │  Runs in: CI/CD pipeline                                                    │   │
│   │  Checks:                                                                     │   │
│   │    - All previous gates passed                                               │   │
│   │    - E2E tests pass                                                          │   │
│   │    - No regression in metrics                                                │   │
│   │    - Audit trail complete                                                    │   │
│   │  Blocking: Yes (must pass to merge)                                         │   │
│   │  Time limit: 15 minutes                                                      │   │
│   └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Cross-Instance Review Protocol

```python
class CrossInstanceReviewer:
    """Enables one Claude instance to review another's work."""

    def request_review(
        self,
        author_instance: str,
        pr_info: PRInfo,
        urgency: str = "normal"
    ) -> ReviewRequest:
        """Request review from another instance."""

        # Find suitable reviewer
        author = self.db.get_instance(author_instance)
        candidates = self.db.query("""
            SELECT * FROM instances
            WHERE instance_id != ?
            AND status = 'active'
            AND (
                -- Different capability (fresh perspective)
                NOT capabilities && ?
                -- Or same capability, high success rate (expert)
                OR (capabilities && ? AND success_rate > 0.9)
            )
            ORDER BY
                CASE WHEN ? = 'urgent' THEN current_claims ELSE 0 END,
                last_review_at ASC
            LIMIT 1
        """, author_instance, author.capabilities, author.capabilities, urgency)

        if not candidates:
            # No available reviewers - queue for later
            return ReviewRequest(
                status="queued",
                reason="No available reviewers"
            )

        reviewer = candidates[0]

        # Create review request message
        request = ReviewRequest(
            request_id=generate_id(),
            author_instance=author_instance,
            reviewer_instance=reviewer.instance_id,
            pr_info=pr_info,
            created_at=datetime.utcnow(),
            deadline=datetime.utcnow() + timedelta(hours=1 if urgency == "normal" else 0.5)
        )

        self.db.insert("messages", {
            "message_id": generate_id(),
            "from_instance": author_instance,
            "to_instance": reviewer.instance_id,
            "message_type": "quality_review_request",
            "payload": json.dumps(request.to_dict())
        })

        return request

    def submit_review(
        self,
        reviewer_instance: str,
        request_id: str,
        review: Review
    ) -> ReviewResult:
        """Submit review results."""

        # Calculate overall score
        weights = {
            "code_quality": 0.30,
            "test_coverage": 0.25,
            "documentation": 0.15,
            "consistency": 0.15,
            "evidence": 0.15
        }

        overall_score = sum(
            review.scores.get(dim, 0) * weight
            for dim, weight in weights.items()
        )

        # Determine if passing
        passing = (
            overall_score >= 0.7 and  # Overall threshold
            review.scores.get("code_quality", 0) >= 0.6 and  # Minimum code quality
            review.scores.get("test_coverage", 0) >= 0.6  # Minimum test coverage
        )

        result = ReviewResult(
            request_id=request_id,
            reviewer_instance=reviewer_instance,
            scores=review.scores,
            overall_score=overall_score,
            passing=passing,
            comments=review.comments,
            blocking_issues=review.blocking_issues,
            suggestions=review.suggestions
        )

        # Send result back to author
        self.db.insert("messages", {
            "message_id": generate_id(),
            "from_instance": reviewer_instance,
            "to_instance": result.author_instance,
            "message_type": "quality_review_result",
            "payload": json.dumps(result.to_dict())
        })

        # Update shared knowledge if patterns found
        if review.patterns_found:
            for pattern in review.patterns_found:
                self.knowledge_sync.on_discovery(
                    reviewer_instance,
                    Knowledge(
                        type="pattern" if pattern.is_good else "anti_pattern",
                        content=pattern.to_dict(),
                        initial_confidence=0.7
                    )
                )

        return result
```

---

## 6. Conflict Prevention

### 6.1 Pre-Commit Conflict Detection

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           CONFLICT DETECTION FLOW                                    │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│   INSTANCE ATTEMPTS COMMIT                                                           │
│           │                                                                          │
│           ▼                                                                          │
│   ┌───────────────────────────────────────────────────────────────────────────────┐ │
│   │  PRE-COMMIT HOOK: .claude/hooks/pretool/bash/multi-instance-guard.sh         │ │
│   │                                                                                │ │
│   │  #!/bin/bash                                                                   │ │
│   │  source "$(dirname "$0")/../../_lib/common.sh"                                │ │
│   │                                                                                │ │
│   │  # Get files being committed                                                   │ │
│   │  CHANGED_FILES=$(git diff --cached --name-only)                               │ │
│   │                                                                                │ │
│   │  # Check each file against coordination database                               │ │
│   │  for file in $CHANGED_FILES; do                                               │ │
│   │      # Check for locks by other instances                                      │ │
│   │      LOCK=$(sqlite3 "$COORDINATION_DB" \                                      │ │
│   │          "SELECT instance_id FROM file_locks                                   │ │
│   │           WHERE file_path = '$file'                                            │ │
│   │           AND instance_id != '$INSTANCE_ID'                                    │ │
│   │           AND expires_at > datetime('now')")                                   │ │
│   │                                                                                │ │
│   │      if [[ -n "$LOCK" ]]; then                                                │ │
│   │          echo "ERROR: $file is locked by instance $LOCK"                      │ │
│   │          exit 1                                                                │ │
│   │      fi                                                                        │ │
│   │                                                                                │ │
│   │      # Check for concurrent modifications in other worktrees                   │ │
│   │      for wt in $(git worktree list --porcelain | grep worktree | cut -d' ' -f2); do│
│   │          if [[ "$wt" != "$PWD" ]]; then                                       │ │
│   │              OTHER_HASH=$(git -C "$wt" rev-parse HEAD:$file 2>/dev/null)     │ │
│   │              OUR_HASH=$(git rev-parse HEAD:$file 2>/dev/null)                 │ │
│   │              if [[ "$OTHER_HASH" != "$OUR_HASH" ]]; then                      │ │
│   │                  echo "WARN: $file modified in $wt - check for conflicts"    │ │
│   │              fi                                                                │ │
│   │          fi                                                                    │ │
│   │      done                                                                      │ │
│   │  done                                                                          │ │
│   │                                                                                │ │
│   │  exit 0                                                                        │ │
│   │                                                                                │ │
│   └───────────────────────────────────────────────────────────────────────────────┘ │
│           │                                                                          │
│           ▼                                                                          │
│   ┌───────────────┐     ┌───────────────┐     ┌───────────────┐                    │
│   │   NO LOCKS    │     │  LOCK FOUND   │     │   CONFLICT    │                    │
│   │               │     │               │     │    FOUND      │                    │
│   │  Proceed to   │     │  Block commit │     │               │                    │
│   │  commit       │     │  Show holder  │     │  Trigger      │                    │
│   │               │     │  Request lock │     │  resolution   │                    │
│   └───────────────┘     └───────────────┘     └───────────────┘                    │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Semantic Conflict Detection

```python
class SemanticConflictDetector:
    """Detect semantic conflicts beyond git merge conflicts."""

    def check_semantic_conflicts(
        self,
        instance_id: str,
        changed_files: list[str]
    ) -> list[SemanticConflict]:
        """Check for semantic conflicts with other instances."""

        conflicts = []

        for file_path in changed_files:
            # Get our changes
            our_changes = self.parse_changes(file_path)

            # Check against other worktrees
            for other_wt in self.get_other_worktrees():
                other_changes = self.get_pending_changes(other_wt, file_path)

                if not other_changes:
                    continue

                # Check for function signature changes
                for func_name, our_sig in our_changes.function_signatures.items():
                    if func_name in other_changes.function_signatures:
                        other_sig = other_changes.function_signatures[func_name]
                        if our_sig != other_sig:
                            conflicts.append(SemanticConflict(
                                type="signature_mismatch",
                                file=file_path,
                                symbol=func_name,
                                our_version=our_sig,
                                their_version=other_sig,
                                severity="high"
                            ))

                # Check for import changes that might break dependencies
                new_imports = our_changes.imports - self.get_base_imports(file_path)
                removed_imports = self.get_base_imports(file_path) - our_changes.imports

                for imp in removed_imports:
                    if self.is_import_used_in(imp, other_wt):
                        conflicts.append(SemanticConflict(
                            type="removed_dependency",
                            file=file_path,
                            symbol=imp,
                            severity="high",
                            message=f"Import {imp} is used in {other_wt}"
                        ))

                # Check for interface/type changes
                for type_name, our_type in our_changes.type_definitions.items():
                    if type_name in other_changes.type_definitions:
                        other_type = other_changes.type_definitions[type_name]
                        if not self.types_compatible(our_type, other_type):
                            conflicts.append(SemanticConflict(
                                type="type_incompatibility",
                                file=file_path,
                                symbol=type_name,
                                our_version=our_type,
                                their_version=other_type,
                                severity="critical"
                            ))

        return conflicts
```

---

## 7. Message Passing System

### 7.1 Inter-Instance Communication

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                        MESSAGE PASSING ARCHITECTURE                                   │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│   MESSAGE TYPES                                                                      │
│   ─────────────                                                                      │
│                                                                                      │
│   ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ │
│   │   LOCKS     │ │    WORK     │ │  KNOWLEDGE  │ │    HELP     │ │   QUALITY   │ │
│   │             │ │             │ │             │ │             │ │             │ │
│   │ lock_request│ │ work_offer  │ │ knowledge_  │ │ help_request│ │ review_     │ │
│   │ lock_granted│ │ work_accept │ │   share     │ │ help_offer  │ │   request   │ │
│   │ lock_denied │ │ work_reject │ │             │ │             │ │ review_     │ │
│   │ lock_release│ │ work_done   │ │             │ │             │ │   result    │ │
│   └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ │
│                                                                                      │
│   TRANSPORT OPTIONS                                                                  │
│   ─────────────────                                                                  │
│                                                                                      │
│   Option 1: SQLite Polling (Default)                                                 │
│   ┌───────────────────────────────────────────────────────────────────────────────┐ │
│   │                                                                                │ │
│   │   Instance A                  SQLite                   Instance B             │ │
│   │       │                          │                          │                 │ │
│   │       │── INSERT message ───────►│                          │                 │ │
│   │       │                          │◄──── POLL (1s) ──────────│                 │ │
│   │       │                          │                          │                 │ │
│   │       │                          │───── SELECT new ────────►│                 │ │
│   │       │                          │                          │                 │ │
│   │   Pros: Simple, no dependencies, works offline                                │ │
│   │   Cons: 1s latency, polling overhead                                          │ │
│   │                                                                                │ │
│   └───────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                      │
│   Option 2: Redis Pub/Sub (Production)                                               │
│   ┌───────────────────────────────────────────────────────────────────────────────┐ │
│   │                                                                                │ │
│   │   Instance A                  Redis                    Instance B             │ │
│   │       │                          │                          │                 │ │
│   │       │── PUBLISH msg ──────────►│──── SUBSCRIBE ──────────►│                 │ │
│   │       │                          │                          │                 │ │
│   │   Pros: Real-time (<10ms), scalable, pub/sub pattern                          │ │
│   │   Cons: Requires Redis, network dependency                                     │ │
│   │                                                                                │ │
│   └───────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                      │
│   Option 3: File System Watcher (Hybrid)                                             │
│   ┌───────────────────────────────────────────────────────────────────────────────┐ │
│   │                                                                                │ │
│   │   Instance A              .claude/coordination/inbox/        Instance B       │ │
│   │       │                          │                                │           │ │
│   │       │── write message ────────►│                                │           │ │
│   │       │                          │◄───── fswatch/inotify ─────────│           │ │
│   │       │                          │                                │           │ │
│   │   Pros: Near real-time, no server, works locally                              │ │
│   │   Cons: Platform-specific, file cleanup needed                                │ │
│   │                                                                                │ │
│   └───────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Message Handler Implementation

```python
class MessageHandler:
    """Handle inter-instance messages."""

    def __init__(self, instance_id: str, transport: str = "sqlite"):
        self.instance_id = instance_id
        self.handlers = {}
        self.transport = self._create_transport(transport)

    def register_handler(self, message_type: str, handler: Callable):
        """Register a handler for a message type."""
        self.handlers[message_type] = handler

    async def process_messages(self):
        """Process incoming messages."""
        while True:
            messages = await self.transport.receive(
                to_instance=self.instance_id,
                unread_only=True
            )

            for msg in messages:
                handler = self.handlers.get(msg.message_type)
                if handler:
                    try:
                        await handler(msg)
                        await self.transport.acknowledge(msg.message_id)
                    except Exception as e:
                        logger.error(f"Failed to handle message: {e}")

            await asyncio.sleep(0.1)  # 100ms poll interval for SQLite

    async def send(
        self,
        to_instance: str | None,  # None = broadcast
        message_type: str,
        payload: dict
    ) -> str:
        """Send a message to another instance."""
        message_id = generate_id()

        await self.transport.send(Message(
            message_id=message_id,
            from_instance=self.instance_id,
            to_instance=to_instance,
            message_type=message_type,
            payload=payload
        ))

        return message_id

    # Built-in handlers
    async def handle_lock_request(self, msg: Message):
        """Handle incoming lock request."""
        file_path = msg.payload["file_path"]

        # Check if we hold the lock
        our_lock = await self.db.query_one("""
            SELECT * FROM file_locks
            WHERE file_path = ?
            AND instance_id = ?
            AND expires_at > datetime('now')
        """, file_path, self.instance_id)

        if our_lock:
            # We hold the lock - can we release it?
            if await self.can_release_lock(file_path):
                await self.release_lock(file_path)
                await self.send(
                    msg.from_instance,
                    "lock_granted",
                    {"file_path": file_path}
                )
            else:
                await self.send(
                    msg.from_instance,
                    "lock_denied",
                    {
                        "file_path": file_path,
                        "reason": "In active use",
                        "estimated_release": our_lock.expires_at
                    }
                )

    async def handle_help_request(self, msg: Message):
        """Handle request for help from another instance."""
        problem = msg.payload["problem"]
        context = msg.payload["context"]

        # Check if we have relevant knowledge
        solutions = await self.knowledge_store.search(
            query=problem,
            knowledge_type="solution",
            min_confidence=0.7
        )

        if solutions:
            await self.send(
                msg.from_instance,
                "help_offer",
                {
                    "problem_id": msg.payload["problem_id"],
                    "solutions": [s.to_dict() for s in solutions],
                    "confidence": max(s.confidence for s in solutions)
                }
            )
```

---

## 8. Implementation Hooks

### 8.1 Multi-Instance Hook System

```bash
#!/bin/bash
# .claude/hooks/lifecycle/multi-instance-init.sh
# Initialize multi-instance coordination on session start

set -euo pipefail
source "$(dirname "$0")/../_lib/common.sh"

COORDINATION_DIR="$PROJECT_ROOT/.claude/coordination"
INSTANCE_DIR="$PROJECT_ROOT/.instance"
DB_PATH="$COORDINATION_DIR/.claude.db"

# Generate unique instance ID
generate_instance_id() {
    local worktree_name=$(basename "$PROJECT_ROOT")
    local timestamp=$(date +%Y%m%d-%H%M%S)
    local random=$(openssl rand -hex 4)
    echo "${worktree_name}-${timestamp}-${random}"
}

# Initialize instance state
init_instance() {
    mkdir -p "$INSTANCE_DIR"

    local instance_id=$(generate_instance_id)
    local branch=$(git branch --show-current)

    # Create instance identity
    cat > "$INSTANCE_DIR/id.json" << EOF
{
  "instance_id": "$instance_id",
  "worktree_name": "$(basename "$PROJECT_ROOT")",
  "branch": "$branch",
  "created_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "status": "active",
  "heartbeat_interval_ms": 5000
}
EOF

    echo "$instance_id"
}

# Register instance in coordination database
register_instance() {
    local instance_id="$1"
    local id_json=$(cat "$INSTANCE_DIR/id.json")

    sqlite3 "$DB_PATH" << EOF
INSERT OR REPLACE INTO instances (
    instance_id,
    worktree_name,
    branch,
    status,
    created_at,
    last_heartbeat
) VALUES (
    '$instance_id',
    '$(echo "$id_json" | jq -r '.worktree_name')',
    '$(echo "$id_json" | jq -r '.branch')',
    'active',
    '$(echo "$id_json" | jq -r '.created_at')',
    datetime('now')
);
EOF
}

# Start heartbeat in background
start_heartbeat() {
    local instance_id="$1"

    (
        while true; do
            sqlite3 "$DB_PATH" "UPDATE instances SET last_heartbeat = datetime('now') WHERE instance_id = '$instance_id'"
            sleep 5
        done
    ) &

    echo $! > "$INSTANCE_DIR/heartbeat.pid"
}

# Cleanup stale instances
cleanup_stale_instances() {
    sqlite3 "$DB_PATH" << EOF
UPDATE instances
SET status = 'terminated'
WHERE status = 'active'
AND last_heartbeat < datetime('now', '-30 seconds');

-- Release locks held by terminated instances
DELETE FROM file_locks
WHERE instance_id IN (
    SELECT instance_id FROM instances WHERE status = 'terminated'
);
EOF
}

# Main initialization
main() {
    # Ensure coordination directory exists
    mkdir -p "$COORDINATION_DIR/locks"

    # Initialize database if needed
    if [[ ! -f "$DB_PATH" ]]; then
        sqlite3 "$DB_PATH" < "$COORDINATION_DIR/schema.sql"
    fi

    # Cleanup stale instances
    cleanup_stale_instances

    # Initialize this instance
    local instance_id=$(init_instance)
    register_instance "$instance_id"
    start_heartbeat "$instance_id"

    # Output for Claude to read
    echo "INSTANCE_INITIALIZED: $instance_id"
}

main
```

### 8.2 Pre-Tool File Lock Hook

```bash
#!/bin/bash
# .claude/hooks/pretool/write-edit/multi-instance-lock.sh
# Acquire file lock before writing

set -euo pipefail
source "$(dirname "$0")/../../_lib/common.sh"

# Read tool input from stdin
INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name')
FILE_PATH=$(echo "$INPUT" | jq -r '.file_path // .input.file_path // empty')

# Only process Write and Edit tools
if [[ "$TOOL_NAME" != "Write" && "$TOOL_NAME" != "Edit" ]]; then
    echo "$INPUT"
    exit 0
fi

# Skip if no file path
if [[ -z "$FILE_PATH" ]]; then
    echo "$INPUT"
    exit 0
fi

# Get instance ID
INSTANCE_ID=$(jq -r '.instance_id' "$PROJECT_ROOT/.instance/id.json")
DB_PATH="$PROJECT_ROOT/.claude/coordination/.claude.db"

# Attempt to acquire lock
acquire_lock() {
    local file_path="$1"
    local lock_id="lock-$(openssl rand -hex 8)"
    local expires_at=$(date -u -d '+60 seconds' +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u -v+60S +%Y-%m-%dT%H:%M:%SZ)

    # Check for existing lock
    local existing=$(sqlite3 "$DB_PATH" "SELECT instance_id FROM file_locks WHERE file_path = '$file_path' AND expires_at > datetime('now')")

    if [[ -n "$existing" && "$existing" != "$INSTANCE_ID" ]]; then
        # Lock held by another instance
        echo "LOCK_CONFLICT"
        echo "$existing"
        return 1
    fi

    # Acquire or renew lock
    sqlite3 "$DB_PATH" << EOF
INSERT OR REPLACE INTO file_locks (
    lock_id,
    file_path,
    lock_type,
    instance_id,
    expires_at,
    reason
) VALUES (
    '$lock_id',
    '$file_path',
    'exclusive_write',
    '$INSTANCE_ID',
    '$expires_at',
    'Writing file'
);
EOF

    echo "LOCK_ACQUIRED"
    echo "$lock_id"
    return 0
}

# Try to acquire lock
RESULT=$(acquire_lock "$FILE_PATH")
STATUS=$(echo "$RESULT" | head -1)

if [[ "$STATUS" == "LOCK_CONFLICT" ]]; then
    HOLDER=$(echo "$RESULT" | tail -1)

    # Output blocking error
    cat << EOF
{
  "blocked": true,
  "reason": "File locked by another instance",
  "file": "$FILE_PATH",
  "holder_instance": "$HOLDER",
  "suggestion": "Wait for lock release or coordinate with instance $HOLDER"
}
EOF
    exit 1
fi

# Lock acquired, pass through
echo "$INPUT"
```

---

## 9. Configuration

### 9.1 Coordination Configuration

```json
// .claude/coordination/config.json
{
  "$schema": "coordination://config/v1",
  "version": "1.0.0",

  "instances": {
    "max_concurrent": 4,
    "heartbeat_interval_ms": 5000,
    "stale_timeout_seconds": 30,
    "priority_levels": [0, 1, 2, 3]
  },

  "locking": {
    "default_ttl_seconds": 60,
    "max_extensions": 2,
    "extension_ttl_seconds": 60,
    "lock_levels": ["directory", "file", "region"]
  },

  "messaging": {
    "transport": "sqlite",
    "poll_interval_ms": 100,
    "message_ttl_hours": 24,
    "retry_count": 3
  },

  "quality_gates": {
    "enabled": true,
    "require_peer_review": true,
    "min_coverage_percent": 80,
    "require_evidence": true
  },

  "knowledge_sharing": {
    "enabled": true,
    "sync_on_session_start": true,
    "max_knowledge_items": 100,
    "deduplication_threshold": 0.9,
    "expiry_days": {
      "decision": 30,
      "pattern": 90,
      "blocker": 7,
      "solution": 30
    }
  },

  "conflict_detection": {
    "semantic_analysis": true,
    "check_other_worktrees": true,
    "block_on_conflict": true
  }
}
```

---

## 10. Usage Examples

### 10.1 Setting Up Worktrees

```bash
# Create main repo (or use existing)
cd ~/projects/skillforge

# Create worktrees for parallel work
git worktree add ../skillforge-wt-auth feature/auth-refactor
git worktree add ../skillforge-wt-frontend feature/new-dashboard
git worktree add ../skillforge-wt-tests feature/e2e-improvements

# Symlink shared .claude directory
for wt in ../skillforge-wt-*; do
    ln -sf ../skillforge/.claude "$wt/.claude"
done

# Initialize .gitignore for instance-specific files
echo ".instance/" >> .gitignore

# Initialize coordination database
sqlite3 .claude/coordination/.claude.db < .claude/coordination/schema.sql
```

### 10.2 Starting Claude Instances

```bash
# Terminal 1: Backend instance
cd ~/projects/skillforge-wt-auth
claude --config .claude/settings.json

# Terminal 2: Frontend instance
cd ~/projects/skillforge-wt-frontend
claude --config .claude/settings.json

# Terminal 3: Testing instance
cd ~/projects/skillforge-wt-tests
claude --config .claude/settings.json
```

### 10.3 Monitoring Coordination

```bash
# View active instances
sqlite3 .claude/coordination/.claude.db \
  "SELECT instance_id, branch, status, last_heartbeat FROM instances WHERE status = 'active'"

# View current locks
sqlite3 .claude/coordination/.claude.db \
  "SELECT file_path, instance_id, expires_at FROM file_locks WHERE expires_at > datetime('now')"

# View pending messages
sqlite3 .claude/coordination/.claude.db \
  "SELECT message_type, from_instance, to_instance, created_at FROM messages WHERE read_at IS NULL"

# View work claims
sqlite3 .claude/coordination/.claude.db \
  "SELECT task_description, instance_id, status FROM work_claims WHERE status IN ('claimed', 'in_progress')"
```

---

## 11. LangGraph Workflow Integration

### 11.1 Multi-Instance Supervisor Graph

```python
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.postgres import PostgresSaver
from typing import TypedDict, Annotated
from operator import add

class MultiInstanceState(TypedDict):
    """State for multi-instance coordination workflow."""
    # Input
    user_request: str

    # Task decomposition
    tasks: list[dict]

    # Instance assignment
    assignments: Annotated[list[dict], add]

    # Results collection
    results: Annotated[list[dict], add]

    # Coordination
    active_instances: list[str]
    conflicts: list[dict]
    next_action: str

def decompose_tasks(state: MultiInstanceState) -> MultiInstanceState:
    """Break user request into parallel tasks."""
    # Analyze request and decompose
    tasks = analyze_and_decompose(state["user_request"])

    return {
        **state,
        "tasks": tasks,
        "next_action": "assign" if tasks else "complete"
    }

def assign_to_instances(state: MultiInstanceState) -> MultiInstanceState:
    """Assign tasks to available instances."""
    coordinator = WorkCoordinator()

    for task in state["tasks"]:
        # Find best instance
        instance = coordinator.find_best_instance(
            task=task,
            active_instances=state["active_instances"]
        )

        if instance:
            # Claim work and acquire locks
            claim = coordinator.claim_work(task, instance.instance_id)

            state["assignments"].append({
                "task_id": task["id"],
                "instance_id": instance.instance_id,
                "claim_id": claim.claim_id,
                "scope": task["scope"]
            })

    return {
        **state,
        "next_action": "monitor"
    }

def monitor_progress(state: MultiInstanceState) -> MultiInstanceState:
    """Monitor instance progress and handle issues."""
    coordinator = WorkCoordinator()

    for assignment in state["assignments"]:
        status = coordinator.get_claim_status(assignment["claim_id"])

        if status == "completed":
            result = coordinator.get_result(assignment["claim_id"])
            state["results"].append(result)
        elif status == "blocked":
            # Handle blocker
            blockers = coordinator.get_blockers(assignment["claim_id"])
            state["conflicts"].extend(blockers)

    # Check if all done
    completed = len([a for a in state["assignments"]
                     if coordinator.get_claim_status(a["claim_id"]) == "completed"])

    if completed == len(state["assignments"]):
        return {**state, "next_action": "aggregate"}
    elif state["conflicts"]:
        return {**state, "next_action": "resolve_conflicts"}
    else:
        return {**state, "next_action": "monitor"}  # Continue monitoring

def resolve_conflicts(state: MultiInstanceState) -> MultiInstanceState:
    """Resolve conflicts between instances."""
    for conflict in state["conflicts"]:
        resolution = negotiate_resolution(conflict)
        apply_resolution(resolution)

    return {
        **state,
        "conflicts": [],
        "next_action": "monitor"
    }

def aggregate_results(state: MultiInstanceState) -> MultiInstanceState:
    """Aggregate results from all instances."""
    final_result = merge_results(state["results"])

    return {
        **state,
        "final_result": final_result,
        "next_action": "complete"
    }

# Build the graph
def create_multi_instance_workflow():
    workflow = StateGraph(MultiInstanceState)

    # Add nodes
    workflow.add_node("decompose", decompose_tasks)
    workflow.add_node("assign", assign_to_instances)
    workflow.add_node("monitor", monitor_progress)
    workflow.add_node("resolve", resolve_conflicts)
    workflow.add_node("aggregate", aggregate_results)

    # Add edges
    workflow.add_edge(START, "decompose")

    workflow.add_conditional_edges(
        "decompose",
        lambda s: s["next_action"],
        {
            "assign": "assign",
            "complete": END
        }
    )

    workflow.add_edge("assign", "monitor")

    workflow.add_conditional_edges(
        "monitor",
        lambda s: s["next_action"],
        {
            "monitor": "monitor",  # Loop back
            "resolve_conflicts": "resolve",
            "aggregate": "aggregate"
        }
    )

    workflow.add_edge("resolve", "monitor")
    workflow.add_edge("aggregate", END)

    # Compile with checkpointing
    return workflow.compile(
        checkpointer=PostgresSaver.from_conn_string(DATABASE_URL)
    )
```

---

## 12. Future Enhancements

### 12.1 Planned Features

1. **Distributed Locking with Redis**: For larger teams with remote instances
2. **Semantic Diff Analysis**: AI-powered conflict detection
3. **Auto-Scaling**: Dynamically spawn/terminate instances based on workload
4. **Metrics Dashboard**: Real-time coordination metrics
5. **Conflict Resolution AI**: Automated merge conflict resolution
6. **Work Stealing**: Idle instances can take work from overloaded ones
7. **Priority Preemption**: High-priority tasks can preempt lower priority

### 12.2 Integration Points

- **CI/CD**: Integrate with GitHub Actions for cross-instance testing
- **Monitoring**: Export metrics to Prometheus/Grafana
- **Alerting**: Notify on coordination failures
- **Audit**: Complete audit trail of all coordination decisions

---

## Appendix A: Quick Reference

### Command Cheat Sheet

```bash
# Setup
git worktree add ../wt-feature-x feature/x
ln -sf ../main-repo/.claude ../wt-feature-x/.claude

# Monitoring
sqlite3 .claude/coordination/.claude.db "SELECT * FROM instances WHERE status='active'"
sqlite3 .claude/coordination/.claude.db "SELECT * FROM file_locks WHERE expires_at > datetime('now')"

# Manual lock release (emergency)
sqlite3 .claude/coordination/.claude.db "DELETE FROM file_locks WHERE instance_id='stuck-instance-id'"

# Cleanup
git worktree remove ../wt-feature-x
```

### Troubleshooting

| Issue | Solution |
|-------|----------|
| Lock not releasing | Check heartbeat, manually release if stale |
| Instance not visible | Verify heartbeat PID is running |
| Conflicts not detected | Ensure semantic analysis enabled in config |
| Messages not delivered | Check poll interval and transport config |

---

*Document Version: 1.0.0*
*Last Updated: 2026-01-08*
*Author: SkillForge Workflow Architect*
