# Skills & Project Detection

## What are skills?

A skill is a structured context injection that tells the AI how to reason about a specific technology, framework, or pattern. Skills are not prompt templates — they are modular system prompt sections that are composed at session start based on what Aurict detects in your project.

A TypeScript + Next.js + Tailwind project automatically gets skills for:
- TypeScript strict mode conventions
- Next.js App Router patterns
- Tailwind utility-first CSS
- React component patterns

You don't configure this — it's automatic.

---

## How detection works

On startup, Aurict scans `<workdir>` for:

1. **Package files** — `package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`, `pom.xml`, …
2. **Config files** — `tsconfig.json`, `next.config.*`, `vite.config.*`, `tailwind.config.*`, …
3. **Directory structure** — `src/`, `app/`, `pages/`, `components/`, …
4. **File extensions** — `.ts`, `.py`, `.go`, `.rs`, …

The detected stack is matched against 218+ skill definitions. Skills are scored by relevance and loaded within a 6 000-token budget (highest-priority skills first).

---

## Skill budget

| Limit | Value |
|-------|-------|
| Total token budget | 6 000 tokens |
| Skill selection order | Priority score (descending) |
| Cache TTL | 60 seconds |

Skills are cached per workdir. The cache is invalidated after 60 seconds or when you run `/reload`.

---

## Viewing active skills

The active skill IDs are shown in the status bar (when terminal is wide enough):

```
skills  typescript · nextjs · tailwind
```

Or run:

```
/skills
```

---

## Custom skills

### Global custom skills

Place `.md` files in `~/.aurict/skills/`. They are loaded for every project.

```
~/.aurict/skills/
├── my-conventions.md
└── team-patterns.md
```

### Project-local custom skills

Place `.md` files in `<workdir>/.aurict/skills/`. They override global skills with the same name.

```
myproject/.aurict/skills/
├── api-conventions.md
└── database-patterns.md
```

### Skill file format

```markdown
---
name: my-conventions
description: Team coding conventions for Acme Corp
priority: 80
tags: [conventions, team]
---

## Acme Corp Coding Conventions

- All API handlers must validate input with Zod schemas
- Use `Result<T, E>` return type for operations that can fail
- Database queries must go through the repository layer in `src/db/`
- Never use `any` — use `unknown` and narrow explicitly
```

| Field | Description |
|-------|-------------|
| `name` | Unique skill ID (used for overrides) |
| `description` | One-line summary (shown in `/skills`) |
| `priority` | 0–100, higher = loaded first within budget (default: 50) |
| `tags` | Array of string tags for filtering |

---

## Skill dependency graph

Skills can declare dependencies:

```yaml
---
name: nextjs-app-router
requires: [typescript, react]
---
```

If `nextjs-app-router` is selected, `typescript` and `react` are automatically included (if within budget).

---

## Pinning context

Beyond skills, you can pin arbitrary content into every session for a project:

```bash
# Pin a file's content permanently
aurict /pin add src/db/schema.ts

# Pin a note
aurict /pin add "Always use the shared Prisma client from lib/prisma.ts"

# View pinned items
aurict /pin list

# Remove a pin
aurict /pin remove <id>
```

Pinned content is always injected, regardless of the token budget.

---

## Auto-invoke skills

Certain skills can be triggered when the agent edits specific file types:

```yaml
---
name: react-component-review
auto_invoke:
  file_edit: "**/*.tsx"
---

## When editing React components

- Check for missing `key` props in lists
- Ensure `useEffect` dependencies are complete
- Prefer `const` arrow functions for handlers
```

Auto-invoke skills are injected as contextual additions when the trigger condition fires, without counting toward the main token budget.
