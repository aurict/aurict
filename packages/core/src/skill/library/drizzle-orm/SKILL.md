---
name: drizzle-orm
description: "Drizzle ORM: Schema definition, type-safe queries, migrations, relations, Postgres/SQLite/MySQL support."
triggers:
  extensions: [".ts"]
  directories: ["drizzle/", "db/schema/", "src/db/"]
  filenames: ["drizzle.config.ts", "schema.ts"]
  keywords: ["drizzle", "pgTable", "sqliteTable", "mysqlTable", "drizzle-orm", "drizzle-kit"]
auto_load_when: "Using Drizzle ORM for database access"
agent: infra-specialist
tools: ["Read", "Write", "Bash"]
---

# Drizzle ORM Patterns

**Version:** Drizzle ORM v0.40+ | **Focus:** Schema, queries, migrations, relations

---

## 1. Schema Definition (PostgreSQL)

```ts
// db/schema.ts
import { pgTable, serial, text, varchar, timestamp, boolean, integer, uuid, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: text('name'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull().$onUpdate(() => new Date()),
}, (t) => [
  index('email_idx').on(t.email),
]);

export const posts = pgTable('posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  body: text('body').notNull(),
  published: boolean('published').default(false).notNull(),
  authorId: uuid('author_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
}));
export const postsRelations = relations(posts, ({ one }) => ({
  author: one(users, { fields: [posts.authorId], references: [users.id] }),
}));
```

---

## 2. Client Setup

```ts
// db/index.ts
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });

// Neon serverless
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });
```

---

## 3. Queries

```ts
import { db } from '@/db';
import { users, posts } from '@/db/schema';
import { eq, and, or, like, desc, asc, count, sql } from 'drizzle-orm';

// Select all
const allUsers = await db.select().from(users);

// With filter
const user = await db.select().from(users).where(eq(users.email, 'user@example.com')).limit(1);

// With relations (using query API)
const userWithPosts = await db.query.users.findFirst({
  where: eq(users.id, userId),
  with: { posts: { orderBy: desc(posts.createdAt) } },
});

// Insert
const [newUser] = await db.insert(users).values({ email, name }).returning();

// Update
await db.update(posts)
  .set({ published: true, updatedAt: new Date() })
  .where(eq(posts.id, postId));

// Delete
await db.delete(posts).where(and(eq(posts.id, postId), eq(posts.authorId, userId)));

// Aggregate
const [{ total }] = await db.select({ total: count() }).from(posts);
```

---

## 4. Migrations

```ts
// drizzle.config.ts
import type { Config } from 'drizzle-kit';
export default {
  schema: './db/schema.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL! },
} satisfies Config;
```

```bash
# Generate migration from schema changes
npx drizzle-kit generate

# Apply migrations to DB
npx drizzle-kit migrate

# Push schema directly (dev only — no migration file)
npx drizzle-kit push

# Open Drizzle Studio (visual DB browser)
npx drizzle-kit studio
```

---

## 5. Transactions

```ts
// Atomic operations
const result = await db.transaction(async (tx) => {
  const [user] = await tx.insert(users).values({ email }).returning();
  const [profile] = await tx.insert(profiles).values({ userId: user.id }).returning();
  return { user, profile };
});

// Rollback on error
await db.transaction(async (tx) => {
  try {
    await tx.update(accounts).set({ balance: sql`balance - 100` }).where(eq(accounts.id, fromId));
    await tx.update(accounts).set({ balance: sql`balance + 100` }).where(eq(accounts.id, toId));
  } catch (e) {
    tx.rollback(); // explicit rollback
    throw e;
  }
});
```

---

## Quick Reference

| Operation | Drizzle syntax |
|-----------|---------------|
| Find one | `db.query.users.findFirst({ where: eq(users.id, id) })` |
| Find many with relation | `db.query.users.findMany({ with: { posts: true } })` |
| Insert + return | `db.insert(table).values(data).returning()` |
| Upsert | `db.insert(table).values(data).onConflictDoUpdate({ target, set })` |
| Pagination | `.limit(20).offset(page * 20)` |
| Raw SQL | `sql\`SELECT * FROM users WHERE ...\`` |

## Anti-Patterns

```
❌ Using db.execute(sql`...`) for simple CRUD
✅ Use typed query builder — type safety is the point

❌ drizzle-kit push in production
✅ drizzle-kit generate → commit migration → drizzle-kit migrate

❌ Defining relations but not using query API (with:)
✅ Use db.query.table.findFirst({ with: {...} }) for joined queries

❌ Not using .returning() after insert/update
✅ .returning() gives you the actual saved row without an extra select
```
