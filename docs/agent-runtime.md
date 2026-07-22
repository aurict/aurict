# Agent Runtime

Aurict's interactive CLI, desktop sidecar, headless adapters, and Bun subagent
workers share one `AgentRuntime` contract. Surface-specific code may choose a
runtime profile and consume events, but it must not implement its own provider
or tool loop.

## Runtime flow

```text
surface -> runAgent facade -> AgentRuntime -> core engine
                              |          |
                              |          +-> typed ToolOutcome
                              +-> versioned AgentEvent stream
```

The public `runAgent()` API remains stable. `AgentRuntime` wraps it with:

- a validated `RunStateMachine`;
- monotonically sequenced `AgentEvent` records (`schemaVersion: 1`);
- runtime profile and tool-call metrics;
- hard wall-time/token/cost/tool/mutation/verification budgets;
- explicit pinned or automatic model selection;
- intent-based capability packs that reduce the model-visible tool surface;
- typed tool outcomes; and
- one terminal completed, blocked, failed, or cancelled state.

Custom tool output without a native outcome can pass through the compatibility adapter, but is marked
`status: unknown` and `source: legacy_adapter`. Correctness checks must not treat
that output as successful verification evidence.

## Complexity routing

Adaptive step and reasoning budgets share one complexity assessment. It combines text length,
attachments, prior tool/file/failure state, and explicit hard-problem signals such as concurrency,
security, intermittent failures, resource leaks, data integrity, distributed systems, and production
performance. The assessment exposes matched signal IDs for telemetry. A resumed task also includes its
canonical objective, so a short `continue` turn cannot downgrade an existing complex task. Explanatory
questions receive a lower floor than implementation, investigation, or audit requests.

## Tool routing lifecycle

Tool routing has a lightweight catalog phase that applies feature and security eligibility without
constructing AI SDK tool wrappers. Capability selection runs against those IDs. Each provider attempt
then builds executable wrappers only for the selected IDs, using that attempt's provider, model, vision,
callbacks, and task context. Retries and fallbacks therefore receive one fresh executable build each,
while the primary turn no longer builds every tool once for selection and again for execution. If a
fallback model lacks vision, multimodal tools are removed from both its executable set and prompt policy.

## Canonical task state

Task tools, continuation, the task ledger, and resume state use the session-scoped
task store in `packages/core/src/task/manager.ts`. Its snapshots are written
atomically under `.aurict/session-state/<session>.tasks.json`. Task IDs,
dependencies, subjects, evidence, and event sequence survive context compaction
and process resume.

`TaskContext` is the structured model-facing projection of that state. It keeps
the objective, constraints, decisions, relevant files, failed strategies, open
tasks, and verification references separate from transcript summaries.

## Revision-bound execution

Workspace mutation tools create a transaction record containing the base and
result revisions. A failed mutation rolls back only when the current file
revision still matches that tool's result; a concurrent user change produces a
`rollback_conflict` instead of being overwritten. Verification evidence records
the exact workspace revision it checked, and the related-test cache key includes
file and project-manifest contents.

## Headless execution

`buildHeadlessRunResult()` converts a completed runtime and its event stream into
the versioned benchmark result contract. The same contract is available from:

```bash
aurict run-agent "fix the failing tests" --workdir . --yes \
  --events run.events.jsonl --result run.result.json
```

Headless permission prompts default to deny; `--yes` grants each prompt once and
does not persist the approval. `--auto-model` delegates routing to core, while
`--provider` and `--model` pin it. `--timeout`, `--max-steps`, and
`--max-cost-usd` are hard run limits. Exit codes are `0` completed, `2` blocked,
`130` cancelled, and `1` infrastructure/contract failure.

The eval runner can exercise the built binary through `bun run eval:agent` or a
custom `AURICT_EVAL_COMMAND` template.

## Harness measurements

Session traces record prompt section/cache health, compaction pressure, exact tool-schema reserve,
provider-reported fresh/cache token usage, token-estimator calibration, and tokenizer memoization hits.
This is the phase-zero baseline used to compare cache, latency, repeated-read, and compaction behavior
without requiring UI log parsing.

The runtime now also has a provider-free A/B policy harness (`bun run eval:policy`). It guards continuation routing, small-context prompt tiering, bounded compaction input, and machine-readable completion status. Run traces remain the source for live token/cache/latency measurements.

## Staged rollout and kill switches

Agent harness layers are enabled by default. A project can stage them deterministically by session or disable a specific layer immediately:

```json
{
  "agentFeatures": {
    "rolloutPercent": 25,
    "disabled": ["background_verification"]
  }
}
```

Operations can override this without editing config:

```bash
AURICT_AGENT_ROLLOUT_PERCENT=25 aurict
AURICT_DISABLE_AGENT_FEATURES=prompt_tiering,utility_model aurict
```

Available feature ids are `canonical_state`, `structured_status`, `utility_model`, `persistent_tool_routing`, `prompt_tiering`, `background_verification`, `mtime_tool_cache`, `multimodal_tools`, `code_navigation`, `browser_drive`, and `semantic_search`. Invalid rollout percentages fail visibly instead of silently selecting a cohort.
