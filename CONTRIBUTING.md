# Contributing to Aurict

## Setup

```bash
git clone https://github.com/aurict/aurict
cd aurict
bun install
```

## Development

```bash
bun run dev          # hot-reload dev mode
bun run typecheck    # TypeScript strict check
bun run test         # full test suite (core + TUI)
bun run build        # compile to dist/aurict
```

All commands are defined in the root `package.json`.

## Project structure

```
packages/core/   — agent engine, tools, providers, storage, HTTP server
packages/cli/    — Ink TUI, slash commands, theme
```

Core logic lives in `packages/core/src/`. TUI components live in `packages/cli/src/tui/`.

## Making changes

1. Fork the repo and create a branch off `main`
2. Make your changes
3. Run `bun run typecheck && bun run test` — both must pass
4. Open a PR with a clear description of what changed and why

For non-trivial features, open an issue first to discuss the approach.

## Tests

- Core tests: `packages/core/test/*.test.ts`
- TUI tests: `packages/cli/test/*.test.tsx` (uses ink-testing-library)

New tools and permission rules should have corresponding tests in `packages/core/test/`.

## Commit style

Short imperative subject line, e.g.:

```
feat: add glob tool timeout protection
fix: resolve path traversal bypass in edit tool
chore: bump version to 1.2.0
```

## License

By contributing, you agree your changes will be licensed under the [MIT License](./LICENSE).
