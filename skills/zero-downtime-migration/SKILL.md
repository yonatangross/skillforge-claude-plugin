---
name: zero-downtime-migration
description: Safe database schema changes without downtime using expand-contract pattern and online schema changes. Use when deploying schema changes to production without service interruption.
context: fork
agent: database-engineer
version: 1.0.0
tags: [database, migration, zero-downtime, expand-contract]
allowed-tools: [Read, Write, Bash, Grep]
author: SkillForge
user-invocable: false
---

# Zero-Downtime Migration

Database migration patterns that ensure continuous service availability during schema changes.

## When to Use

- Deploying schema changes to production systems with uptime requirements
- Renaming or removing columns without breaking existing application code
- Adding NOT NULL constraints to existing columns with data
- Creating indexes on large tables without locking
- Migrating data between columns or tables during live traffic

## Quick Reference

### Expand Phase (Add New)

```sql
-- Step 1: Add new column (nullable, no default constraint yet)
ALTER TABLE users ADD COLUMN display_name VARCHAR(200);

-- Step 2: Backfill existing data
UPDATE users SET display_name = CONCAT(first_name, ' ', last_name)
WHERE display_name IS NULL;

-- Step 3: Add trigger for dual-write (optional, if app can't dual-write)
CREATE OR REPLACE FUNCTION sync_display_name() RETURNS TRIGGER AS $$
BEGIN
  NEW.display_name := CONCAT(NEW.first_name, ' ', NEW.last_name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Contract Phase (Remove Old)

```sql
-- Step 1: Verify no readers of old column (check query logs)
-- Step 2: Drop old column ONLY after app fully migrated
ALTER TABLE users DROP COLUMN first_name;
ALTER TABLE users DROP COLUMN last_name;

-- Step 3: Make new column NOT NULL if required
ALTER TABLE users ALTER COLUMN display_name SET NOT NULL;
```

### CONCURRENTLY Index Creation

```sql
-- Create index without locking table (PostgreSQL)
CREATE INDEX CONCURRENTLY idx_orders_customer_date
ON orders (customer_id, created_at DESC);

-- Drop index without locking (if recreation needed)
DROP INDEX CONCURRENTLY IF EXISTS idx_orders_customer_date;

-- IMPORTANT: CONCURRENTLY cannot run inside transaction block
-- Run outside of Alembic transaction or use raw connection
```

## Key Decisions

| Decision | Recommendation | Rationale |
|----------|----------------|-----------|
| Column Rename | Add new + copy + drop old | Direct RENAME blocks reads |
| Constraint Timing | Add NOT VALID first, VALIDATE separately | NOT VALID is non-blocking |
| Rollback Window | Keep old schema 24-72 hours | Allows safe rollback if issues |
| Backfill Batch Size | 1000-10000 rows per batch | Prevents lock escalation |
| Index Strategy | CONCURRENTLY always | Standard CREATE INDEX locks table |

### NOT VALID Constraint Pattern

```sql
-- Step 1: Add constraint without validating existing rows (instant)
ALTER TABLE orders ADD CONSTRAINT chk_amount_positive
CHECK (amount > 0) NOT VALID;

-- Step 2: Validate constraint (scans table but allows writes)
ALTER TABLE orders VALIDATE CONSTRAINT chk_amount_positive;
```

## Anti-Patterns (FORBIDDEN)

```sql
-- FORBIDDEN: Single-step ALTER that locks table
ALTER TABLE users RENAME COLUMN name TO full_name;
-- Impact: Blocks ALL queries during metadata lock

-- FORBIDDEN: Add NOT NULL to existing column directly
ALTER TABLE orders ADD COLUMN org_id UUID NOT NULL;
-- Impact: Fails immediately if table has data

-- FORBIDDEN: Regular CREATE INDEX on large table
CREATE INDEX idx_big_table_col ON big_table(col);
-- Impact: Locks table for minutes/hours

-- FORBIDDEN: Drop column without verification period
ALTER TABLE users DROP COLUMN legacy_field;
-- Impact: No rollback if application still references it

-- FORBIDDEN: Constraint validation in same transaction as creation
ALTER TABLE orders ADD CONSTRAINT fk_org
FOREIGN KEY (org_id) REFERENCES orgs(id);
-- Impact: Full table scan with exclusive lock
```

## Related Skills

- `alembic-migrations` - Python migration framework with expand-contract support
- `database-schema-designer` - Schema design patterns and normalization principles

## Capability Details

### expand-contract
**Keywords:** expand contract, zero downtime, online migration, safe deploy
**Solves:**
- How do I rename a column without downtime?
- Safe production schema changes
- Rolling deployments with schema changes

### online-index
**Keywords:** concurrent index, non-blocking index, large table index
**Solves:**
- Create index without locking
- Index creation on production
- PostgreSQL CONCURRENTLY pattern

### constraint-migration
**Keywords:** not valid constraint, foreign key migration, check constraint safe
**Solves:**
- Add constraints without downtime
- Foreign key on existing data
- Validate constraints safely
