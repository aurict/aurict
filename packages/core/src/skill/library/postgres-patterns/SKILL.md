---
name: postgres-patterns
description: "PostgreSQL: Schema design patterns, Query optimization, JSON handling, Partitioning strategy." 
triggers:
  extensions: [".sql", ".ts"]
  keywords: ["PostgreSQL", "SQL", "query", "index", "transaction", "JOIN", "EXPLAIN", "CTE", "window function"]
auto_load_when: "Writing SQL queries or designing PostgreSQL schema"
agent: infra-specialist
tools: ["Read", "Write", "Bash"]
---

# PostgreSQL Architecture Patterns

**Version:** PG 17 | **Focus:** Schema, queries, optimization

## 1. Schema Design Strategy

```
When to use what:
├── UUID: distributed systems, public IDs
├── Serial: simple auto-increment, single instance
├── BigSerial: high volume tables
└── Custom sequences: specific patterns

Relations:
├── One-to-One: @unique on foreign key
├── One-to-Many: simple FK in child
├── Many-to-Many: explicit join table
└── Self-referential: parent_id with FK to self
```

---

## 2. Index Strategy

```
When to add indexes:
├── WHERE clause columns (filter frequently)
├── ORDER BY columns (sort performance)
├── JOIN columns (foreign keys - usually auto)
└── Columns in constraints

Composite indexes:
├── Order matters: equality first, then range
├── Covering: include() for covering queries
└── Partial: WHERE active = true only

When NOT to index:
├── Low cardinality (few values)
├── Frequently updated columns
└── Small tables (full scan faster)
```

---

## 3. JSON/JSONB Decision

```
When to use JSON/JSONB:
├── Flexible schema (user-defined fields)
├── Rarely queried fields
└── Complex nested structures

When NOT to use:
├── Fixed structure → regular columns
├── Frequently filtered/sorted → indexed columns
└── Need full-text search → full-text indexed columns

JSONB vs JSON:
├── JSONB: parsed, searchable, indexable
└── JSON: raw, faster write, slower read
```

---

## 4. Partitioning Strategy

```
When to partition:
├── Table > 10GB
├── Millions of rows
├── Bulk deletes by time
└── Range queries by date

Partition types:
├── Range: dates, numeric ranges
├── List: categories, regions
└── Hash: even distribution

Strategy:
├── Partition by time: historical data, time-based queries
├── Partition by list: category-based filtering
└── Partition by hash: even distribution, no natural key
```

---

## 5. Query Optimization

```
How to optimize:
├── EXPLAIN ANALYZE: see actual execution
├── Check seq scan vs index scan
├── Look for high cost operations
└── Check row estimates (accurate?)

When to worry:
├── Seq scan on large table
├── High cost (>1000)
├── Nested loops on large data
└── Missing index on WHERE/ORDER

Solutions:
├── Add indexes (where filtered)
├── Rewrite query (simplify, split)
├── Denormalize (trade-off)
└── Partition (if time-based)
```

---

## 6. Constraints Strategy

```
Constraint types:
├── NOT NULL: required fields
├── UNIQUE: single column or composite
├── CHECK: custom validation rules
└── FOREIGN KEY: referential integrity

When to use:
├── NOT NULL: business requirement
├── UNIQUE: duplicate prevention
├── CHECK: complex rules (positive, range)
└── FK: data integrity
```

---

## Key Patterns

1. **UUID for public** - ID, distributed
2. **Index WHERE/ORDER BY** - Not everything
3. **JSONB for flexible** - When schema varies
4. **Partition large** - Time-based queries
5. **EXPLAIN first** - Measure, then optimize

---

## Anti-Patterns

```
❌ SELECT * in application queries
✅ Always specify needed columns — saves bandwidth + enables index-only scans

❌ N+1 queries from ORM lazy loading
✅ Eager load with JOINs or Prisma include

❌ No EXPLAIN ANALYZE on slow queries
✅ Run EXPLAIN (ANALYZE, BUFFERS) before adding indexes

❌ Transactions that hold locks too long
✅ Keep transactions short; move expensive work outside

❌ Storing JSON blobs instead of normalized tables
✅ Use JSONB for truly schemaless data; normalize everything else
```

---

## Quick Reference

| Scenario | Pattern | Note |
|---|---|---|
| Unique constraint | UNIQUE INDEX | DB enforces, not just app |
| Soft delete | deleted_at TIMESTAMP | Add partial index WHERE deleted_at IS NULL |
| Pagination | Keyset (cursor) pagination | OFFSET is slow at scale |
| Full-text | tsvector + GIN index | Built-in, no extension needed |
| Enum values | PostgreSQL ENUM type | Type-safe at DB level |
| Connection pool | PgBouncer / prisma pool | Max 100 pg connections |
| Migrations | Up + down scripts | Always have rollback |
