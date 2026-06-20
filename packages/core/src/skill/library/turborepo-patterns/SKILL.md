---
name: turborepo-patterns
description: "Turborepo: Monorepo structure, task pipeline, remote caching, shared packages, workspace configuration."
triggers:
  extensions: [".json", ".ts"]
  directories: ["packages/", "apps/"]
  filenames: ["turbo.json", "turbo.config.ts", "pnpm-workspace.yaml"]
  keywords: ["turbo", "turborepo", "workspace", "turbo.json", "pipeline", "dependsOn"]
auto_load_when: "Working in a Turborepo monorepo or setting up workspace"
agent: architect
tools: ["Read", "Write", "Bash"]
---

# Turborepo Patterns

**Version:** Turborepo v2 | **Focus:** Pipeline, caching, shared packages, workspace setup

---

## 1. Repository Structure

```
my-monorepo/
├── apps/
│   ├── web/          (Next.js)
│   └── api/          (Express/Hono)
├── packages/
│   ├── ui/           (shared React components)
│   ├── config/       (eslint, tsconfig, tailwind configs)
│   └── db/           (shared Drizzle/Prisma schema)
├── turbo.json
├── package.json      (root — workspaces declared here)
└── pnpm-workspace.yaml
```

```yaml
# pnpm-workspace.yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

---

## 2. turbo.json (Task Pipeline)

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**", "!.next/cache/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    },
    "lint": {
      "dependsOn": ["^lint"]
    },
    "type-check": {
      "dependsOn": ["^build"]
    }
  }
}
```

**`^build` means:** build all workspace dependencies first (topological sort).

---

## 3. Shared Package (UI Components)

```json
// packages/ui/package.json
{
  "name": "@repo/ui",
  "exports": {
    ".": {
      "types": "./src/index.ts",
      "default": "./src/index.ts"
    },
    "./button": "./src/components/button.tsx"
  },
  "devDependencies": {
    "typescript": "workspace:*"
  },
  "peerDependencies": {
    "react": "^18 || ^19"
  }
}
```

```tsx
// packages/ui/src/index.ts
export { Button } from './components/button';
export { Card } from './components/card';

// apps/web — consume shared package
import { Button } from '@repo/ui';
```

---

## 4. Shared Config Package

```js
// packages/config/eslint/index.js
module.exports = {
  extends: ['next', 'turbo', 'prettier'],
  rules: { 'no-console': 'warn' },
};

// packages/config/tsconfig/base.json
{
  "compilerOptions": {
    "target": "ES2022", "module": "ESNext",
    "moduleResolution": "bundler", "strict": true,
    "skipLibCheck": true
  }
}
```

```json
// apps/web/tsconfig.json — extend base
{
  "extends": "@repo/config/tsconfig/nextjs.json",
  "include": ["**/*.ts", "**/*.tsx"]
}
```

---

## 5. Running Tasks

```bash
# Run build for all apps
turbo build

# Run only web app
turbo build --filter=web

# Run web and all its dependencies
turbo build --filter=web...

# Run all packages changed since main branch
turbo build --filter='[origin/main]'

# Run dev for specific apps
turbo dev --filter=web --filter=api

# Generate new package from template
turbo gen workspace --name @repo/my-package
```

---

## 6. Remote Caching (Vercel)

```bash
# Link to Vercel Remote Cache
npx turbo login
npx turbo link

# Or with self-hosted cache (Turborepo Remote Cache)
TURBO_API=https://your-cache.example.com
TURBO_TOKEN=your-token
TURBO_TEAM=your-team
```

---

## Quick Reference

| Pattern | Command / Config |
|---------|----------------|
| Build with deps | `"dependsOn": ["^build"]` in turbo.json |
| Skip cache for task | `"cache": false` |
| Long-running process | `"persistent": true` |
| Filter by app | `turbo <task> --filter=app-name` |
| Affected packages | `--filter='[origin/main]'` |
| Cache outputs | `"outputs": ["dist/**"]` |

## Anti-Patterns

```
❌ Publishing internal packages to npm
✅ Use workspace:* protocol — internal packages don't need to be published

❌ Each app has its own tsconfig from scratch
✅ Extend from shared @repo/config/tsconfig base

❌ Running turbo build from individual app directories
✅ Always run from monorepo root — turborepo manages the graph

❌ Not declaring outputs in turbo.json
✅ Declare all build artifacts as outputs for cache hits
```
