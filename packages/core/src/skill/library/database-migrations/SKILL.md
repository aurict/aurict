---
name: database-migrations
description: "Safe database migrations: zero-downtime strategies, Prisma migrate, Drizzle migrate, rollback patterns, column changes."
triggers:
  deps: ["prisma", "drizzle-orm", "drizzle-kit", "db-migrate", "umzug"]
  filenames: ["schema.prisma", "drizzle.config.ts", "drizzle.config.js"]
  directories: ["migrations/", "db/migrations/", "prisma/migrations/"]
auto_load_when: "Writing or reviewing database migrations"
tags: ["database", "migrations", "prisma", "drizzle", "zero-downtime", "postgres"]
priority: 7
---

# Database Migration Patterns

## Quick Reference

```
Prisma:   npx prisma migrate dev --name add_user_email
          npx prisma migrate deploy (production)
          npx prisma migrate reset (dev only — drops all data)

Drizzle:  npx drizzle-kit generate && npx drizzle-kit migrate
          npx drizzle-kit push (dev, no migration file)

Safe:     add column nullable → backfill → add NOT NULL constraint (3 deploys)
Unsafe:   rename column (breaks old code reading old name)
```

---

## Decision Tree

```
Column operation risk?
├── Add nullable column → safe, one migration
├── Add NOT NULL column → risky: existing rows fail
│   └── Fix: add nullable → deploy → backfill → add default/constraint
├── Rename column       → breaking: must use column alias or multi-step
│   └── Fix: add new col → dual-write → migrate reads → drop old col
├── Drop column         → safe after code no longer reads it
└── Change type         → risky; add new col + migrate + drop old

Large table operation?
├── < 1M rows  → normal ALTER TABLE
├── 1M-10M rows → ALTER TABLE with statement_timeout guard
└── > 10M rows  → online schema change (pg_repack, gh-ost) or batched backfill

Zero-downtime approach?
├── Expand/contract pattern: add → dual-write → migrate reads → remove old
└── Feature flag: hide new code behind flag, migrate in background
```

---

## Anti-Patterns

- Adding NOT NULL column without default/backfill in one migration — will fail on existing rows
- Dropping columns before removing all code references — causes runtime errors before deploy completes
- Running `prisma migrate reset` in production — drops all data permanently
- Renaming columns in a single migration — old code breaks before new code deploys
- Long-running transactions during ALTER TABLE on Postgres — locks table, blocks all reads/writes
- `await prisma.$executeRaw` for data migrations in schema migrations — separate schema and data migrations
- No rollback plan — always know how to reverse the migration before running it

---

## Key Rules

1. Separate schema migrations (DDL) from data migrations (DML) — different timing, different risks
2. Test migrations on a production-size snapshot before running on prod
3. Always take a DB backup before running migrations in production
4. NOT NULL columns on existing tables: three-deploy strategy (add nullable → backfill → constrain)
5. Index creation: use `CREATE INDEX CONCURRENTLY` on Postgres to avoid table lock
6. Prisma `--create-only`: generate migration file without applying, to review/edit before running
7. Drizzle `push` is for development only — never push schema directly to production; always use migration files

---

## Implementation

**Prisma: safe NOT NULL column addition:**
```sql
-- Migration 1: add nullable
ALTER TABLE "users" ADD COLUMN "display_name" TEXT;

-- Deploy. Then backfill data:
UPDATE "users" SET "display_name" = "name" WHERE "display_name" IS NULL;

-- Migration 2: add constraint (separate deploy)
ALTER TABLE "users" ALTER COLUMN "display_name" SET NOT NULL;
ALTER TABLE "users" ALTER COLUMN "display_name" SET DEFAULT '';
```

**Drizzle: rename column safely (expand/contract):**
```typescript
// Step 1: add new column (deploy)
newName: text("new_name"),

// Step 2: dual-write in app code (deploy)
await db.update(users).set({ newName: data.name, name: data.name })

// Step 3: migrate reads to new column (deploy)
const user = await db.select({ name: users.newName }).from(users)

// Step 4: drop old column (deploy)
// Remove name column from schema, generate migration
```

**Batched backfill for large tables:**
```typescript
let cursor = 0
const batchSize = 1000
while (true) {
  const rows = await db.select().from(users).where(isNull(users.displayName)).limit(batchSize)
  if (rows.length === 0) break
  await db.update(users).set({ displayName: sql`name` }).where(inArray(users.id, rows.map(r => r.id)))
  await new Promise(r => setTimeout(r, 50)) // brief pause to reduce DB pressure
}
```
