# Aurict Evals

Aurict evals are terminal-first repo fixtures. They can run in two modes:

- Reference mode: applies the task's checked-in `referenceSolution`, then runs assertions. This is used for CI smoke so the harness stays deterministic and free of provider/API costs.
- Candidate mode: set `AURICT_EVAL_COMMAND` to run an agent or script against the fixture. The runner expands `{workdir}`, `{prompt}`, `{prompt_json}`, and `{task}`.

Examples:

```bash
bun run eval -- --list
bun run eval -- --smoke
bun run eval -- --json
AURICT_EVAL_COMMAND='sh -lc "aurict --no-stream < AURICT_EVAL_PROMPT.txt"' bun run eval
```

Each task lives in `evals/tasks/*.json` and points at a fixture directory under `evals/fixtures/`.

Current task coverage includes:

- focused TypeScript bug fixes
- multi-file refactors
- documentation honesty around the policy sandbox
- formatting/string utility changes

`--json` emits a machine-readable summary with pass/fail counts, failed task IDs, and per-task details for CI dashboards or regression tracking.
