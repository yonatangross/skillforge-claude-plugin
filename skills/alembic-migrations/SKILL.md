---
name: alembic-migrations
description: Alembic migration patterns for SQLAlchemy. Use when creating database migrations, managing schema versions, handling zero-downtime deployments, or implementing reversible database changes.
context: fork
agent: database-engineer
version: 1.0.0
tags: [alembic, migrations, sqlalchemy, database, schema, python, 2026]
allowed-tools: [Read, Write, Edit, Bash, Grep, Glob]
author: SkillForge
user-invocable: false
---

# Alembic Migration Patterns

Database migration management with Alembic for SQLAlchemy applications.

## When to Use

- Creating or modifying database tables and columns
- Auto-generating migrations from SQLAlchemy models
- Implementing zero-downtime schema changes
- Rolling back or managing migration history
- Adding indexes on large production tables

## Quick Reference

### Migration Template
```python
"""Add users table.
Revision ID: abc123 | Revises: None
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = 'abc123'
down_revision = None

def upgrade() -> None:
    op.create_table('users',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('email', sa.String(255), nullable=False, unique=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index('idx_users_email', 'users', ['email'], unique=True)

def downgrade() -> None:
    op.drop_index('idx_users_email', table_name='users')
    op.drop_table('users')
```

### Autogenerate Migration
```bash
# Generate from model changes
alembic revision --autogenerate -m "sync models"

# Apply migrations
alembic upgrade head

# Rollback one step
alembic downgrade -1

# Generate SQL for review (production)
alembic upgrade head --sql > migration.sql
```

### Concurrent Index (Zero-Downtime)
```python
def upgrade() -> None:
    # CONCURRENTLY avoids table locks on large tables
    op.execute("""
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_org
        ON users (organization_id, created_at DESC)
    """)

def downgrade() -> None:
    op.execute("DROP INDEX CONCURRENTLY IF EXISTS idx_users_org")
```

## Key Decisions

| Decision | Recommendation | Rationale |
|----------|---------------|-----------|
| NOT NULL column | Two-phase: nullable first, then alter | Avoids locking, backward compatible |
| Large table index | `CREATE INDEX CONCURRENTLY` | Zero-downtime, no table locks |
| Column rename | 4-phase expand/contract | Safe migration without downtime |
| Autogenerate review | Always review generated SQL | May miss custom constraints |
| Migration granularity | One logical change per file | Easier rollback and debugging |
| Production deployment | Generate SQL, review, then apply | Never auto-run in production |
| Downgrade function | Always implement properly | Ensures reversibility |

## Anti-Patterns (FORBIDDEN)

```python
# NEVER: Add NOT NULL without default or two-phase approach
op.add_column('users', sa.Column('org_id', UUID, nullable=False))  # LOCKS TABLE, FAILS!

# NEVER: Use blocking index creation on large tables
op.create_index('idx_large', 'big_table', ['col'])  # LOCKS TABLE - use CONCURRENTLY

# NEVER: Skip downgrade implementation
def downgrade():
    pass  # WRONG - implement proper rollback

# NEVER: Modify migration after deployment
# Create a new migration instead!

# NEVER: Run migrations automatically in production
# Use: alembic upgrade head --sql > review.sql
```

## Related Skills

- `database-schema-designer` - Schema design and normalization patterns
- `database-versioning` - Version control and change management
- `integration-testing` - Testing migrations with test databases
- `observability-monitoring` - Migration logging and alerting

## Capability Details

### autogenerate-migrations
**Keywords:** autogenerate, auto-generate, revision, model sync, compare
**Solves:**
- Auto-generate migrations from SQLAlchemy models
- Sync database with model changes
- Detect schema drift

### revision-management
**Keywords:** upgrade, downgrade, rollback, history, current, revision
**Solves:**
- Apply or rollback migrations
- View migration history
- Check current database version

### zero-downtime-changes
**Keywords:** concurrent, expand contract, online migration, no downtime
**Solves:**
- Add indexes without locking
- Rename columns safely
- Large table migrations

### data-migration
**Keywords:** backfill, data migration, transform, batch update
**Solves:**
- Backfill new columns with data
- Transform existing data
- Migrate between column formats
