---
name: code-review-patterns
description: "Code review: security + correctness checklist, feedback tone, blocking vs non-blocking, PR size, async review flow."
triggers:
  keywords: ["review", "PR", "pull request", "feedback", "code quality", "checklist", "approve", "request changes"]
auto_load_when: "Reviewing code or writing a PR description"
agent: qa-specialist
tools: ["Read", "Write", "Bash"]
---

# Code Review Patterns

## Quick Reference

```
Size rule:    PRs > 400 lines → split. Reviewers stop reading carefully above that.
Tone:         "This could cause X" not "You did Y wrong"
Blocking:     Logic error, security issue, missing test for new behavior = MUST fix
Non-blocking: Style, naming, alternatives = "nit:" prefix, author decides
Self-review:  Review your own diff BEFORE requesting — catch 30% of issues yourself
Time:         Review within 24h. Stale PRs lose context fast.
```

---

## Decision Tree

```
What to check first?
├── 1. Purpose — does the PR description explain WHY, not just WHAT?
├── 2. Scope — does it do one thing? If not, can it be split?
├── 3. Tests — is new behavior tested? Existing tests still pass?
├── 4. Security — any auth bypass, SQL injection, XSS, secrets in code?
└── 5. Logic — correctness, edge cases, error handling

Feedback type?
├── Must fix (blocking)
│   ├── Bug / logic error
│   ├── Security vulnerability
│   ├── Missing test for new critical path
│   └── Breaking API change without migration
│
├── Should fix (strong suggestion)
│   ├── Code that will confuse future developers
│   ├── Inconsistency with project conventions
│   └── Missing error handling at boundaries
│
└── Nit (non-blocking)
    ├── Naming improvements
    ├── Style preferences
    └── Alternative approaches (suggest, don't demand)

PR too large?
├── > 400 lines changed → ask to split by feature/concern
├── Config/infra separate from logic changes
└── Refactor commits separate from behavior changes
```

---

## Anti-Patterns

- Reviewing style while missing logic bugs — check correctness and security BEFORE style
- Leaving reviews open for days — unreviewed PRs kill team flow; review within 24 hours or explicitly delegate
- "This is wrong" without explanation — always say WHY and suggest HOW to fix
- Approving without reading tests — tests document behavior; no tests = no confidence in correctness
- Blocking on personal preference — "nit:" prefix for opinions; author has final say on non-blocking issues
- Huge PRs "because it's all related" — reviewers lose effectiveness; split by concern even if same feature
- Feedback on what to change without saying what's wrong — "Could you use reduce here?" → "This loop mutates state unexpectedly on line 34; using reduce would make the transformation explicit"

---

## Key Rules

1. Read the PR description first — if it doesn't exist, request one before reviewing
2. Check security early: auth gates, input validation, SQL/NoSQL injection, hardcoded secrets
3. Blocking comment = you won't approve until fixed; non-blocking = suggestion, author decides
4. Comment on the code, not the author — "this function" not "you"
5. If you'd write it differently but both ways are correct: `nit:` prefix or don't mention it
6. Approve with comments: use when you trust the author to address non-blocking nits
7. Self-review: always review your own diff in GitHub/GitLab UI before requesting review

---

## Implementation

**PR description template:**
```markdown
## What
One sentence: what this PR does.

## Why
Why this change is needed (link to issue/ticket).

## How
Key technical decisions, trade-offs, alternatives considered.

## Test plan
- [ ] Unit tests cover the new behavior
- [ ] Manual test steps for UI changes
- [ ] Migration safe for existing data
```

**Review comment examples:**
```
❌ "This is wrong"
✅ "This will throw if `user` is null on line 42 — add a null check or assert earlier"

❌ "Use reduce instead"
✅ "nit: could use .reduce() here for clarity, but current approach is fine too"

❌ "Why did you do it this way?"
✅ "This pattern differs from how we handle it in auth/middleware.ts — is there a reason to diverge?"
```
