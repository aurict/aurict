---
name: t3-stack
description: "T3 Stack: Next.js + tRPC + Prisma + Tailwind + NextAuth. End-to-end type safety, router patterns, auth integration."
triggers:
  deps: ["@trpc/server", "@trpc/client", "@trpc/next", "@trpc/react-query"]
  directories: ["server/api/", "src/server/api/"]
  filenames: ["trpc.ts", "root.ts"]
auto_load_when: "Working in a tRPC-based fullstack project"
tags: ["trpc", "t3", "next", "prisma", "nextauth"]
priority: 11
---

# T3 Stack Patterns

## Quick Reference

```
Type-safe call:  api.post.create.useMutation() → caller knows exact input/output
Router:          createTRPCRouter({ procedure: protectedProcedure.input(z.object({...})).mutation(async ({ctx, input}) => ...) })
Auth guard:      protectedProcedure (ctx.session guaranteed) vs publicProcedure
Invalidation:    utils.post.getAll.invalidate() after mutation
```

**Procedure anatomy:**
```typescript
create: protectedProcedure
  .input(z.object({ title: z.string().min(1).max(100) }))
  .mutation(async ({ ctx, input }) => {
    return ctx.db.post.create({ data: { title: input.title, createdById: ctx.session.user.id } })
  }),
```

---

## Decision Tree

```
Mutation or query?
├── Query  → .query(async ({ctx, input}) => ...)
│   ├── No auth needed → publicProcedure
│   └── Auth needed   → protectedProcedure (throws if no session)
└── Mutation → .mutation(async ({ctx, input}) => ...)
    └── Always invalidate related queries after success

Input validation?
├── Simple → z.string(), z.number(), z.boolean()
├── Object → z.object({ field: z.type() })
├── Optional → z.string().optional()
└── Enum   → z.enum(["a", "b", "c"])

Error handling?
├── Expected error → throw new TRPCError({ code: "NOT_FOUND", message: "..." })
├── Auth error     → throw new TRPCError({ code: "UNAUTHORIZED" })
└── Server error   → throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" })
```

---

## Anti-Patterns

- `fetch` or `axios` calls instead of tRPC procedures — defeats type safety
- Missing `.invalidate()` after mutations — UI stays stale
- `publicProcedure` for user-specific data — always use `protectedProcedure` when session is needed
- Putting business logic in the client — mutations belong in procedures
- Large `input` objects without Zod refinements — validate at procedure level, not caller
- Direct DB access in components — all DB access goes through tRPC procedures
- Not using `ctx.session.user.id` for ownership checks — always scope queries to authenticated user

---

## Key Rules

1. Every procedure gets a Zod input schema — no untyped args
2. `protectedProcedure` automatically throws `UNAUTHORIZED` if no session
3. `ctx.db` is Prisma client — use it directly in procedures
4. Infinite queries use `cursor`-based pagination with `z.string().cursor().optional()`
5. Optimistic updates: `utils.procedure.setData()` before mutation, revert on error
6. Router composition: merge sub-routers in `root.ts`, never nest `createTRPCRouter` calls

---

## Implementation

**Optimistic UI with tRPC React Query:**
```typescript
const utils = api.useUtils()
const { mutate } = api.post.create.useMutation({
  onMutate: async (newPost) => {
    await utils.post.getAll.cancel()
    const prev = utils.post.getAll.getData()
    utils.post.getAll.setData(undefined, (old) => old ? [...old, newPost] : [newPost])
    return { prev }
  },
  onError: (_, __, ctx) => { utils.post.getAll.setData(undefined, ctx?.prev) },
  onSettled: () => { void utils.post.getAll.invalidate() },
})
```

**Paginated query:**
```typescript
getPage: publicProcedure
  .input(z.object({ cursor: z.string().optional(), limit: z.number().min(1).max(50).default(20) }))
  .query(async ({ ctx, input }) => {
    const items = await ctx.db.post.findMany({ take: input.limit + 1, cursor: input.cursor ? { id: input.cursor } : undefined, orderBy: { createdAt: "desc" } })
    const nextCursor = items.length > input.limit ? items.pop()!.id : undefined
    return { items, nextCursor }
  }),
```
