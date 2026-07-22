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

## Agent policy A/B checks

The deterministic policy harness measures the agent framework without provider calls. It compares the legacy last-message/full-prompt behavior with the current objective-aware routing, prompt tiering, bounded summary input, and structured completion protocol:

```bash
bun run eval:policy
bun run eval:policy -- --profile=current --json
```

The current profile exits non-zero if any policy contract regresses. The JSON result includes per-case outcomes, routed capabilities, prompt/summary size, structured status, and legacy-to-current deltas. This harness proves framework behavior only; repository task quality remains covered by the fixture runner and external benchmark adapters.

## Public benchmark preparation

Aurict is prepared for two external benchmark tracks, but the real CLI integration should be wired later when a stable headless command exists.

- [Benchmark Contract](benchmark-contract.md) defines the non-interactive CLI behavior benchmark adapters expect.
- [Terminal-Bench](terminal_bench/README.md) contains the Harbor custom-agent scaffold for terminal-native tasks.
- [SWE-bench](swe_bench/README.md) contains the prediction-generation scaffold for issue-to-patch tasks.

Do not treat these adapters as benchmark claims. They are integration scaffolds so Aurict can later be measured against public suites with reproducible commands, captured patches, and comparable result metadata.
