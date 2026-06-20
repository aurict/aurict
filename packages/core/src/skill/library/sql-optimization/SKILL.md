---
name: sql-optimization
description: "SQL Optimization: Query analysis, Execution plans, Indexing strategies, JOIN optimization, Query rewriting."
triggers:
  extensions: [".sql", ".prisma"]
  directories: ["queries/", "migrations/"]
  keywords: ["SQL", "query", "optimization", "EXPLAIN", "index", "JOIN", "performance"]
auto_load_when: "Writing SQL queries or fixing database performance issues"
agent: infra-specialist
tools: ["Read", "Write", "Bash"]
---

# SQL Optimization Patterns

**Focus:** Query performance, execution plans, indexing, JOIN optimization

## 1. Execution Plan Analysis

```
Reading EXPLAIN Output:

PostgreSQL:
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'test@example.com';
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT) SELECT ...

Key Metrics:
├── seq scan    → Full table scan (bad for large tables)
├── index scan  → Using index (good)
├── index only scan → Covering index, no table lookup (best)
├── bitmap      → Using bitmap for large datasets
├── nested loop → Potentially slow for large tables
├── hash join   → Good for large datasets
└── sort        → In-memory vs disk sort

Seq Scan vs Index Scan:
├── < 1000 rows → Seq scan often faster
├── > 10000 rows → Index scan preferred
├── < 1% of rows → Index beneficial
└── = 100% of rows → Seq scan inevitable

Cost Interpretation:
├── cost=0.00..1.00 → Startup cost
├── cost=1.00..100.00 → Total cost
└── Lower is better
```

---

## 2. Indexing Strategies

```
When to Index:
├── WHERE clause columns → Always index
├── JOIN columns → Always index
├── ORDER BY columns → Consider index for large sorts
├── GROUP BY columns → Consider index
└── Columns with high cardinality → Best for B-tree

Composite Indexes:
CREATE INDEX idx_user_email_status ON users(email, status);

Index Column Order:
├── Put high-cardinality columns first
├── Put equality conditions first
├── Put range conditions last
└── Consider query patterns, not table schema

Covering Index:
CREATE INDEX idx_user_email ON users(email) INCLUDE (name, created_at);

Index Types:
├── B-tree → Default, for equality and range
├── Hash → Exact match only, memory-based
├── GIN → Full-text search, arrays, JSONB
├── BRIN → Time-series, append-only data
└── GiST → Geospatial, range types

Index Maintenance:
├── Monitor index usage: pg_stat_user_indexes
├── Remove unused indexes → Saves write overhead
├── Index bloat → Monitor and REINDEX periodically
└── Partial indexes → For filtered queries
```

---

## 3. Query Optimization Patterns

```
SELECT Optimization:
❌ SELECT * FROM users WHERE id = 1;
✅ SELECT id, email, name FROM users WHERE id = 1;

❌ SELECT DISTINCT... (often slow)
✅ Use GROUP BY with aggregation instead

❌ SELECT MAX(id) + 1 (generate IDs)
✅ Use sequences or auto-increment

Join Optimization:
❌ Multiple N+1 queries in loop
✅ Single query with JOIN or subquery

❌ SELECT * FROM orders JOIN users
✅ SELECT o.id, o.total, u.email FROM orders o JOIN users u ON ...

Subqueries vs JOINs:
├── Subquery for filtering → Use IN/EXISTS
├── Subquery for calculation → Use JOIN or CTE
├── Correlated subqueries → Often slow, rewrite to JOIN
└── CTE (WITH) → Better readability, can be materialized

LIMIT Optimization:
❌ SELECT * FROM users ORDER BY id LIMIT 1 (full sort)
✅ SELECT * FROM users WHERE id = (SELECT MAX(id) FROM users)

✅ Use cursor pagination: WHERE id > last_id LIMIT 20
```

---

## 4. Pagination Patterns

```
Offset-based (Problematic for large offsets):
SELECT * FROM users ORDER BY created_at LIMIT 20 OFFSET 100000;

Problems:
├── Must scan 100,020 rows
├── Slow on high offsets
├── Inconsistent with concurrent writes

Cursor-based (Recommended):
-- First page
SELECT * FROM users ORDER BY created_at DESC LIMIT 20;

-- Next page (use last item's created_at)
SELECT * FROM users
WHERE created_at < '2024-01-15 10:30:00'
ORDER BY created_at DESC LIMIT 20;

Keyset Pagination:
-- More efficient than timestamp
SELECT * FROM users WHERE id > 1000 ORDER BY id LIMIT 20;

Limit with Subquery:
SELECT * FROM (
  SELECT * FROM users WHERE status = 'active'
  ORDER BY created_at DESC
  LIMIT 20 OFFSET 1000
) AS page ORDER BY created_at;

Window Functions (Counts):
SELECT *, COUNT(*) OVER() as total_count FROM users;
-- Add total_count to know total without second query
```

---

## 5. Common Performance Anti-Patterns

```
N+1 Query Problem:
❌
for (const user of users) {
  const posts = db.query('SELECT * FROM posts WHERE user_id = ?', user.id)
}

✅
const posts = await db.query(
  'SELECT * FROM posts WHERE user_id IN (?)',
  users.map(u => u.id)
)

SELECT in INSERT:
❌
for (const item of items) {
  await db.insert('logs', { ...item })
}

✅
await db.insert('logs', items)  // Bulk insert
-- or
await db.query('INSERT INTO logs VALUES (?, ?), (?, ?), ...', flattened)

Functions in WHERE:
❌ SELECT * FROM users WHERE LOWER(email) = 'test@test.com'
✅ SELECT * FROM users WHERE email = 'test@test.com' (with index)
-- Use expression index if needed

Date Functions on Columns:
❌ SELECT * FROM logs WHERE DATE(created_at) = '2024-01-15'
✅ SELECT * FROM logs WHERE created_at >= '2024-01-15' AND created_at < '2024-01-16'
✅ CREATE INDEX idx_logs_date ON logs (DATE(created_at)) -- using generated column

LIKE Leading Wildcard:
❌ SELECT * FROM users WHERE name LIKE '%john%'
✅ Use full-text search (GIN index)
✅ If prefix search: name LIKE 'john%' (can use index)
```

---

## 6. Query Analysis Checklist

```
Before Writing Any Query:
├── Do you need all columns? Select specific ones
├── Can you add WHERE clause to reduce rows?
├── Are there proper indexes on WHERE columns?
├── Is JOIN order optimal? Small table first
└── Can you use LIMIT?

Monitoring Queries:
├── Enable slow query log (long_query_time = 1)
├── Use pg_stat_statements (PostgreSQL)
├── Use EXPLAIN ANALYZE for problematic queries
├── Monitor wait events
└── Track query patterns over time

Query Performance Metrics:
├── Response time < 100ms (good)
├── Response time 100-500ms (acceptable)
├── Response time > 1s (needs optimization)
└── Response time > 5s (critical)

Scaling Strategies:
├── Read replicas for read-heavy workloads
├── Connection pooling (pgBouncer)
├── Query result caching (Redis)
├── Partitioning for time-series
└── Consider denormalization for read-heavy
```

---

## 7. Database-Specific Tips

```
PostgreSQL:
├── pg_stat_activity → Current queries
├── pg_indexes → List all indexes
├── EXPLAIN (ANALYZE, BUFFERS) → Detailed analysis
├── pg_trgm extension → Trigram index for LIKE
├── Partial indexes → Index filtered subsets
└── Materialized views → Pre-computed results

MySQL:
├── EXPLAIN FORMAT=JSON → Detailed plan
├── SHOW INDEXES FROM table → List indexes
├── optimizer_trace → Deep optimization insights
├── Use FORCE INDEX when optimizer is wrong
└── InnoDB buffer pool warm-up

SQL Server:
├── SET STATISTICS IO ON → IO details
├── SET STATISTICS TIME ON → Execution time
├── Include actual execution plan
├── Missing index DMVs → Index recommendations
└── Query store → Historical performance
```

---

## Key Patterns

1. **EXPLAIN first** — Always analyze query plan before optimizing
2. **Index strategically** — Focus on WHERE, JOIN, ORDER BY columns
3. **Avoid SELECT *** — Select only needed columns
4. **Use cursor pagination** — Never use OFFSET for large datasets
5. **Batch operations** — Bulk inserts, avoid N+1 queries
6. **Monitor continuously** — Slow query logs, query statistics

---

## Anti-Patterns

```
❌ SELECT * FROM table (fetches all columns)
✅ SELECT id, name, email FROM table

❌ SELECT * FROM users WHERE LOWER(email) = 'x'
✅ Use case-insensitive index or COLLATE

❌ SELECT * FROM users WHERE id IN (1,2,3) LIMIT 1000
✅ Use proper pagination with cursor

❌ N+1 queries in application code
✅ Use JOIN or batch queries

❌ No indexes on foreign keys
✅ Always index foreign key columns

❌ Using OFFSET for pagination
✅ Use keyset/cursor pagination

❌ Functions on indexed columns in WHERE
✅ Rewrite to use index-friendly form

❌ Subquery when JOIN would work
✅ Often JOIN is more efficient
```

---

## Quick Reference

| Issue | Solution | Command |
|---|---|---|
| Slow WHERE | Add index on column | CREATE INDEX idx_... |
| Slow JOIN | Index join columns | CREATE INDEX idx_... |
| Slow ORDER BY | Index for ORDER BY | CREATE INDEX idx_... |
| Full table scan | Check plan, add index | EXPLAIN ANALYZE |
| N+1 query | Use JOIN or batch | - |
| Offset pagination | Use cursor/keyset | WHERE id > ? |
| Too many indexes | Monitor, remove unused | pg_stat_user_indexes |

---

## Decision Tree

```
Query is slow — where to start?
└── EXPLAIN ANALYZE first — always diagnose before acting

Seq scan on large table?
├── < 1% of rows returned → add B-tree index on WHERE column
├── > 50% of rows returned → seq scan is fine (index won't help)
└── Composite query       → composite index (equality cols first, range cols last)

Which index type?
├── Equality / range on standard columns → B-tree (default)
├── Full-text search / JSONB / arrays    → GIN
├── Time-series / append-only (logs)     → BRIN
└── Geospatial / ranges                  → GiST

Pagination on large table?
├── Need arbitrary page jumps            → offset (accept perf tradeoff)
├── Infinite scroll / cursor API         → keyset: WHERE id > $last LIMIT 20
└── Time-ordered feed                    → cursor on created_at DESC

Multiple queries in a loop?
└── N+1 → rewrite to single JOIN or IN (...) batch query
```

---

## Key Rules

1. Run `EXPLAIN (ANALYZE, BUFFERS)` before and after any query change
2. Index all columns used in WHERE, JOIN, ORDER BY
3. Composite index: high-cardinality first, equality before range conditions
4. Covering index with `INCLUDE (col)` eliminates heap lookups for hot queries
5. Never apply functions on indexed columns in WHERE (`LOWER(email)` breaks index)
6. Cursor/keyset pagination > OFFSET for tables > 10k rows
7. Bulk insert always > loop of single INSERTs
8. Index foreign key columns or JOINs will seq-scan the child table

---

## Implementation

```sql
-- Covering index — index-only scan, no heap lookup
CREATE INDEX idx_users_email_cover
  ON users (email)
  INCLUDE (id, name, created_at);

-- Composite index — equality first, range last
CREATE INDEX idx_orders_user_status_date
  ON orders (user_id, status, created_at DESC);

-- Cursor pagination — O(1) regardless of page number
-- First page
SELECT id, title, created_at
FROM posts
WHERE status = 'published'
ORDER BY created_at DESC, id DESC
LIMIT 20;

-- Next page (pass last row's values as cursor)
SELECT id, title, created_at
FROM posts
WHERE status = 'published'
  AND (created_at, id) < ('2024-01-15 10:30:00', 1050)
ORDER BY created_at DESC, id DESC
LIMIT 20;

-- Batch fix for N+1
-- ❌ N+1
-- for user of users: SELECT * FROM orders WHERE user_id = ?

-- ✅ Single query
SELECT u.id, u.email, json_agg(o.*) AS orders
FROM users u
LEFT JOIN orders o ON o.user_id = u.id
WHERE u.id = ANY($1::int[])
GROUP BY u.id;
```
