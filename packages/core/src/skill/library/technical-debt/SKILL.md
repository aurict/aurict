---
name: technical-debt
description: "Technical debt: identification, classification, cost estimation, Strangler Fig, Boy Scout Rule, debt payoff prioritization."
triggers:
  keywords: ["refactor", "technical debt", "cleanup", "legacy", "TODO", "FIXME", "complexity", "coupling"]
auto_load_when: "Addressing technical debt or refactoring legacy code"
agent: architect
tools: ["Read", "Write", "Bash"]
---

# Technical Debt Patterns

## Quick Reference

```
Identify:   High cyclomatic complexity, >300-line functions, >5 levels of nesting, test coverage <50%
Classify:   Design debt (wrong abstraction) vs Code debt (poor impl) vs Test debt (no coverage)
Prioritize: Impact on dev velocity × risk of bug × effort to fix
Boy Scout:  Leave the code slightly better than you found it — no dedicated refactor sprints needed
Strangler:  Replace legacy incrementally: new code next to old → migrate callers → delete old
Cost:       "This feature takes 2x longer because of [X]" — translate debt to delivery time for stakeholders
```

---

## Decision Tree

```
How to pay off debt?
├── Small (<2h) → Boy Scout Rule: fix while passing through, commit separately
├── Medium (2h–1 day) → Schedule in next sprint as a task, not a "debt sprint"
└── Large (>1 day) → Strangler Fig pattern: don't rewrite, replace incrementally

Debt type determines approach:
├── Design debt (wrong abstraction)
│   └── Strangler Fig: build new interface → migrate callers → deprecate old
│
├── Code debt (poor implementation, no tests)
│   └── Add tests FIRST (characterization tests) → then refactor safely
│
├── Test debt (low coverage on critical path)
│   └── Add tests for the behavior you're about to change → refactor with confidence
│
└── Dependency debt (outdated, vulnerable packages)
    └── Automated: Dependabot / Renovate → auto-merge patch, review minor/major

When to NOT pay off debt?
├── 2 days before a release
├── When you don't understand the code well enough yet
└── When the "debt" is actually stable, working, untouched code
```

---

## Anti-Patterns

- "We'll fix it later" with no ticket — create a TODO comment with ticket reference: `// TODO(#123): replace with new auth`
- Big-bang rewrite instead of incremental — rewrites fail; Strangler Fig replaces piece by piece with the system always working
- Dedicated "debt sprint" every quarter — debt accumulates between sprints; Boy Scout Rule distributes the cost
- Refactoring without tests — add characterization tests first; refactoring untested code is guessing
- Paying off debt no one touches — only pay debt on hot paths; leave stable untouched code alone
- Describing debt as "messy code" to stakeholders — frame as business impact: "this costs us 3 hours per new feature in this module"

---

## Key Rules

1. Always add tests BEFORE refactoring — tests are your safety net, not a reward for finishing
2. Commit refactors separately from behavior changes — clean git history, easier to revert
3. Track debt visibly: `// TODO(#ticket)` in code + ticket in backlog — invisible debt never gets paid
4. Strangler Fig: new code coexists with old, never a hard cutover — system stays deployable at all times
5. Measure: cyclomatic complexity, test coverage, build time — track trends, not one-time snapshots
6. Boy Scout Rule: the only sustainable approach — 15 min of cleanup per day beats a 2-week debt sprint

---

## Implementation

**Characterization test before refactor:**
```typescript
// Step 1: capture current behavior (even if wrong)
it("handles edge case — current behavior", () => {
  const result = legacyFunction(edgeInput)
  expect(result).toMatchSnapshot() // lock current output
})
// Step 2: refactor
// Step 3: if snapshot breaks, decide: fix refactor or update expected behavior
```

**Strangler Fig in TypeScript:**
```typescript
// Old: monolithic getUserData()
// New: incremental replacement

// 1. Add new implementation alongside old
async function getUserProfile(id: string): Promise<UserProfile> { ... } // new

// 2. In old function, delegate to new for new callers
async function getUserData(id: string) {
  if (featureFlags.useNewUserProfile) return getUserProfile(id) // migrate
  return legacyGetUserData(id) // keep working
}

// 3. Once all callers migrated, delete legacyGetUserData
```
