---
name: testing-patterns
description: "Testing: TDD workflow, Test selection strategy, Mock strategy, When to test what." 
triggers:
  extensions: [".test.ts", ".spec.ts", ".test.tsx", ".spec.tsx"]
  directories: ["__tests__/", "e2e/", "test/"]
  keywords: ["test", "vitest", "jest", "playwright", "coverage", "mock", "fixture", "assertion"]
auto_load_when: "Writing tests or test infrastructure"
agent: qa-specialist
tools: ["Read", "Write", "Bash"]
---

# Testing Architecture Patterns

**Tools:** Vitest, RTL, Playwright | **Focus:** TDD, coverage, mocking

## 1. TDD Workflow

```
Red-Green-Refactor:
1. Write failing test (describe expected behavior)
2. Write minimal code to pass
3. Refactor (improve without breaking)

When to write tests:
├── Before code (TDD) - preferred for new features
├── After code (debugging) - for fixing bugs
└── Before refactoring - ensure behavior preserved
```

**Test-first benefits:**
- Better API design (tests are first consumer)
- Clearer requirements (must express in test)
- Confidence to refactor

---

## 2. Test Selection Strategy

```
What to test:
├── Business logic - core functionality
├── User interactions - forms, buttons
├── Edge cases - empty, null, max values
├── Error states - network failure, validation
└── Critical paths - checkout, login

What NOT to test:
├── Implementation details - can change
├── Third-party code - assume works
├── Simple getters/setters - no logic
└── Generated code - no logic
```

**Coverage target:**
- 80% overall (functionality)
- 100% critical paths (checkout, auth)
- Ignore: UI details, styles

---

## 3. Test Type Selection

```
Unit tests:
├── Test single function/method
├── Mock all external dependencies
├── Fast, isolated
└── Use for: utilities, helpers, algorithms

Integration tests:
├── Test multiple units together
├── Real DB or test DB
├── Use for: API endpoints, DB operations
└── Slower, more realistic

E2E tests:
├── Test full user flow
├── Real browser
├── Use for: critical paths only (login, checkout)
└── Slowest, most realistic
```

---

## 4. Mock Strategy

```
When to mock:
├── External services (API, DB)
├── Slow operations (network, file I/O)
├── Hard to reproduce (timeouts, errors)
└── Third-party libraries

When NOT to mock:
├── Business logic - test real implementation
├── Simple functions - just test directly
├── What you're testing - test real, mock dependencies
```

**Mock location:**
- Per test (flexible, verbose)
- Before all (setup, cleaner)
- Factory function (reusable)

---

## 5. Test Structure

```
AAA Pattern (Arrange-Act-Assert):
├── Arrange: set up data, mocks
├── Act: call function/method
└── Assert: check expected behavior

Test organization:
├── Describe: feature/component being tested
├── It: specific behavior
├── Before/after: setup/teardown
└── Each: per-test setup
```

---

## 6. React Component Testing Strategy

```
What to test:
├── User interactions: clicks, forms, navigation
├── Conditional rendering: states, errors, loading
├── Props: different inputs, different outputs
└── Accessibility: keyboard, screen reader

What NOT to test:
├── Implementation details (state, refs)
├── Styles (except functional)
└── Child components (test them separately)
```

**Testing Library approach:**
- Query by role (button, heading)
- Query by label (form fields)
- Fire events, not methods
- Assert behavior, not internals

---

## 7. E2E Test Selection

```
When to write E2E:
├── Critical user flows
├── Multi-page interactions
└── Browser-specific behavior

What to test:
├── Login → dashboard
├── Add to cart → checkout → confirmation
├── Search → filter → results
└── Error recovery flows

What NOT to test:
├── Every page
├── Edge cases (unit tests cover)
├── Performance (separate suite)
└── Visual details (visual regression tests)
```

---

## Key Patterns

1. **TDD first** - Write test before code
2. **Test behavior** - Not implementation
3. **Mock external** - Test internal logic
4. **80% coverage** - Focus critical paths
5. **E2E sparingly** - Only critical flows

---

## Anti-Patterns

```
❌ Testing implementation details (internals, private methods)
✅ Test behavior from the user's perspective — what it does, not how

❌ Mocking everything, including the thing under test
✅ Mock only external boundaries (DB, HTTP, clock); test real logic

❌ Single test file with 200 test cases — slow, hard to navigate
✅ Co-locate tests with feature; one file per module

❌ Tests that pass individually but fail in CI (global state leak)
✅ Reset all shared state in beforeEach/afterEach

❌ 0% E2E tests relying only on unit tests
✅ Testing trophy: many unit, some integration, few critical E2E
```

---

## Quick Reference

| Test type | Tool | What to test |
|---|---|---|
| Unit | Vitest / Jest | Pure functions, hooks |
| Component | Testing Library | User interactions |
| Integration | Supertest | API routes |
| E2E | Playwright | Critical user journeys |
| Visual | Chromatic | UI regression |
| Performance | Lighthouse CI | CWV thresholds |
