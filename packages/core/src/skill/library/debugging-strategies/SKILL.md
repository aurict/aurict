---
name: debugging-strategies
description: "Systematic debugging: reproduction, isolation, binary search, structured logging, profiling, async/runtime debugging."
triggers:
  keywords: ["debug", "error", "bug", "trace", "investigate", "reproduce", "root cause", "not working"]
auto_load_when: "Debugging errors or investigating unexpected behavior"
agent: qa-specialist
tools: ["Read", "Write", "Bash"]
---

# Debugging Strategies

## Quick Reference

```
Stack:     Read full trace — error origin is last line before framework code
Reproduce: Write failing test FIRST — documents bug, prevents regression
Binary:    git bisect start → bad/good commits → finds breaking commit in O(log n)
Types:     tsc --noEmit — catches 80% of runtime errors before they happen
Network:   curl -v URL | DevTools Network → check status, headers, body
Async:     process.on('unhandledRejection', console.error) — expose silent failures
Memory:    node --inspect + Chrome DevTools → heap snapshot comparison
```

---

## Decision Tree

```
Error type?
├── TypeScript / compile error
│   └── tsc --noEmit → fix the FIRST error only (cascading: rest often disappear)
│
├── Runtime crash / exception
│   ├── Read full stack trace — actual origin is 3-5 frames in, past framework code
│   ├── Look for swallowed errors: catch(e) {} — add console.error(e) minimum
│   └── Check: null/undefined access, wrong types at runtime, missing await
│
├── Wrong output (no crash)
│   ├── Log at each transformation step → narrow which step is wrong
│   ├── Write unit test: assert expected vs actual on smallest failing case
│   └── Binary search: log at midpoint — which side produces wrong output?
│
├── Intermittent / race condition
│   ├── Missing await or parallel state mutations — trace execution order
│   ├── Add timestamps to logs to understand interleaving
│   └── Reproduce with --runInBand (force serial test execution)
│
└── Performance / memory leak
    ├── Node: node --inspect → Chrome heap snapshot before & after
    ├── Frontend: DevTools Performance → flame chart → long tasks
    └── Memory: compare snapshots, look for growing retained object counts
```

---

## Anti-Patterns

- `console.log` left in production — use structured logger with levels; remove debug logs before commit
- Changing multiple things at once — change ONE thing; binary search the problem space
- Fixing the symptom instead of root cause — reproduce reliably → isolate → understand → fix → add test
- Swallowed errors `catch (e) {}` — always at minimum `console.error(e)`; silent failures are 10x harder to debug
- Debugging on prod instead of staging — reproduce locally first; add structured observability for future prod incidents
- Reading last error in a cascade — TypeScript: fix the FIRST error, cascading ones often disappear automatically
- Assuming the bug is in your code — check library version, env variable, network response first

---

## Key Rules

1. Write a failing test BEFORE fixing — documents the bug, proves the fix works
2. `tsc --noEmit` runs in seconds and catches the majority of bugs before runtime
3. Structured logging > console.log: `logger.error({ userId, action, err })` — searchable, filterable
4. Stack traces: read bottom-up from your code, skip framework/runtime frames
5. `git bisect` for regressions: binary search commit history, finds breaking commit in ~10 steps for 1000 commits
6. Async: check every `await`, find fire-and-forget Promises, add `process.on("unhandledRejection")`
7. Minimal reproduction: strip to smallest failing case — reveals real issue 90% of the time

---

## Implementation

**Structured logging:**
```typescript
import pino from "pino"
const log = pino({ level: process.env.LOG_LEVEL ?? "info" })

log.error({ userId, requestId, err: err.message }, "payment failed") // ✅ structured
console.log("payment failed for user " + userId)                      // ❌ unstructured
```

**Binary search a bug:**
```typescript
const step1 = transform1(raw);   console.log("step1:", step1)
const step2 = transform2(step1); console.log("step2:", step2) // find the bad step
const step3 = transform3(step2); console.log("step3:", step3)
// then dig only into the failing step
```

**git bisect:**
```bash
git bisect start
git bisect bad              # current commit is broken
git bisect good v2.3.0      # this tag was working
# test each checkout, then: git bisect good OR git bisect bad
git bisect reset            # when done
```
