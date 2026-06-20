---
name: blueprint
description: "Mandatory planning gate. Decomposes any task into phases, dependencies, risks, and success criteria before any implementation."
triggers:
  keywords: ["plan", "blueprint", "approach", "architecture", "design", "decompose", "how should", "strategy"]
auto_load_when: "Before any implementation task with 2+ steps (mandatory gate)"
agent: planner
tools: ["Read", "Write", "Bash"]
---

# Blueprint Skill — Mandatory Planning Gate

**Rule:** No implementation without a blueprint. This is the non-negotiable first step.

---

## 1. Task Classification

```
How complex is this?
├── 1 file, 1 concern, <30 min   → SIMPLE — no blueprint needed, proceed directly
├── 2-4 files, clear scope       → MEDIUM — quick blueprint (5 min)
└── 5+ files, multi-agent        → COMPLEX — full DAG blueprint required

If MEDIUM or COMPLEX → continue below
```

---

## 2. Blueprint Template

Fill this for every MEDIUM/COMPLEX task:

```markdown
## Blueprint: {task name}

### Goal
One sentence: what success looks like.

### Scope
- Files affected: [list]
- New dependencies: [list or none]
- Breaking changes: yes/no

### Phases

#### Phase 1: Research (parallel)
- [ ] Read existing code patterns
- [ ] Check for similar implementations
- [ ] Identify constraints

#### Phase 2: Implementation
- [ ] Step A (depends on: nothing)
- [ ] Step B (depends on: A)
- [ ] Step C (depends on: A)

#### Phase 3: Verification
- [ ] Tests pass
- [ ] TypeScript check clean
- [ ] Security: no new vulnerabilities
- [ ] Lint: no new warnings

### Risks
| Risk | Likelihood | Mitigation |
|---|---|---|
| Breaking existing API | Medium | Add to existing, don't replace |
| Performance regression | Low | Benchmark before/after |

### Definition of Done
- [ ] All Phase 3 checks pass
- [ ] Deployed and verified in staging

Proceed? (Yes / Adjust)
```

---

## 3. DAG Format (Complex Tasks)

For multi-agent tasks, express dependencies explicitly:

```
task-001: researcher  — Investigate existing patterns     [depends: nothing]
task-002: architect   — Design component structure        [depends: 001]
task-003: frontend-ops — Implement UI                    [depends: 002]
task-004: style-arch  — Apply design tokens              [depends: 003]
task-005: qa-specialist — Write tests                    [depends: 002]  ← parallel with 003
task-006: security    — Review auth changes              [depends: 003]
task-007: docs-agent  — Update documentation             [depends: 003, 004]
```

Phases:
- **Phase 1** (parallel): 001
- **Phase 2** (parallel): 002
- **Phase 3** (parallel): 003, 005
- **Phase 4** (parallel): 004, 006
- **Phase 5**: 007

---

## 4. Risk Scoring

```
Risk score = Likelihood × Impact

Likelihood: Low=1, Medium=2, High=3
Impact:     Low=1, Medium=2, High=3

Score ≥ 6 → add explicit mitigation step to Phase 1
Score ≥ 8 → present to user before proceeding
```

---

## 5. Quick Blueprints (Common Tasks)

### New Feature
```
Phase 1: Read existing patterns, identify extension points
Phase 2: Implement (server) → implement (client) → connect
Phase 3: Unit test → integration test → lint → typecheck
```

### Bug Fix
```
Phase 1: Reproduce → identify root cause → find all affected locations
Phase 2: Fix root cause → update tests
Phase 3: Verify fix → check for regressions
```

### Refactor
```
Phase 1: Map all usages → identify safe extraction boundaries
Phase 2: Extract → update imports → verify types
Phase 3: All existing tests pass → no behavior change
```

### New API Endpoint
```
Phase 1: Design request/response shape → check auth requirements
Phase 2: Route handler → validation → business logic → tests
Phase 3: Security review → rate limiting → documentation
```

---

## Anti-Patterns

```
❌ Starting implementation immediately without stating the plan
✅ Always state the plan first, even for "simple" tasks

❌ Blueprinting in your head without writing it down
✅ Write the blueprint — it forces clarity and catches gaps

❌ Skipping Phase 3 (verification) because "it looks right"
✅ Verification is non-negotiable — it catches silent failures

❌ 10-step blueprints that cover everything
✅ Max 7 tasks per blueprint — split if larger
```

---

## Output Format

Always present blueprint as:

```
[BLUEPRINT] Task: {name}
Complexity: Simple / Medium / Complex
Phases: N | Agents: [list] | Estimated tasks: N

[Phase summary]

Proceed? (Yes / Adjust / Simplify)
```
