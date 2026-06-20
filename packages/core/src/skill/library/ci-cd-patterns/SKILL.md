---
name: ci-cd-patterns
description: "CI/CD: Pipeline strategy, testing stages, deployment patterns, and release workflows." 
triggers:
  extensions: [".yml", ".yaml"]
  filenames: [".github/workflows", ".gitlab-ci.yml", "Jenkinsfile", ".circleci"]
  keywords: ["pipeline", "deploy", "CI", "CD", "workflow", "release"]
auto_load_when: "Editing CI/CD pipeline files"
agent: devops-engineer
tools: ["Read", "Write", "Bash"]
---

# CI/CD Pipeline Patterns

**Focus:** Build automation, testing strategy, deployment cadence

---

## 1. Pipeline Strategy

```
When to use what pipeline model:

├── Trunk-based (short-lived branches)
│   └── Use when: small teams, fast feedback needed
│   └── Avoid when: large teams, complex integration
│
├── GitFlow (long-lived branches)
│   └── Use when: scheduled releases, mature products
│   └── Avoid when: need rapid iteration
│
└── Release branches
    └── Use when: multiple versions in production
    └── Avoid when: single version, frequent releases
```

---

## 2. Testing Stages

```
Test pyramid (bottom to top):

├── Unit tests (70%)
│   ├── Run: every commit
│   ├── Fast (< 1min total)
│   └── Coverage: core business logic
│
├── Integration tests (20%)
│   ├── Run: every PR
│   ├── Medium (1-10min)
│   └── Coverage: API contracts, DB interactions
│
├── E2E tests (10%)
│   ├── Run: before deploy
│   ├── Slow (10-30min)
│   └── Coverage: critical user journeys
│
└── Performance tests
    ├── Run: weekly or before major releases
    └── Coverage: load handling, latency
```

---

## 3. Deployment Patterns

```
When to use deployment strategy:

├── Blue-green
│   └── Use when: zero-downtime required
│   └── Swap: instant traffic switch
│   └── Rollback: instant revert
│
├── Canary
│   └── Use when: testing new version with real traffic
│   └── Approach: 1% → 10% → 100%
│   └── Rollback: redirect traffic back
│
├── Rolling
│   └── Use when: simple deployments, no downtime needed
│   └── Approach: replace instances one by one
│   └── Risk: partial deployment state
│
└── Feature flags
    └── Use when: decoupling deploy from release
    └── Approach: toggle features without redeploy
    └── Benefit: gradual rollout, quick rollback
```

---

## 4. Build Optimization

```
How to speed up CI:

├── Caching
│   ├── Dependencies: npm, pip, maven cache
│   ├── Build artifacts: compiled binaries, Docker layers
│   └── Test results: only rerun changed tests
│
├── Parallelization
│   ├── Split test suites by type
│   ├── Run independent jobs concurrently
│   └── Use matrix builds for multiple configs
│
└── Optimization
    ├── Skip builds for docs-only changes
    ├── Use shallow clones (git clone --depth 1)
    └── Cache Docker layers between runs
```

---

## 5. Release Workflow

```
Version strategy:

├── Semantic versioning (recommended)
│   ├── MAJOR: breaking changes
│   ├── MINOR: new features (backward compatible)
│   └── PATCH: bug fixes
│
├── Continuous deployment
│   └── Use when: high test confidence, fast feedback needed
│   └── Requirement: comprehensive test suite
│
└── Scheduled releases
    └── Use when: business requires coordination
    └── Requirement: release notes, changelog
```

---

## Key Patterns

1. **Fail fast** — Run fastest tests first
2. **Environment parity** — Dev, staging, prod as similar as possible
3. **Immutable artifacts** — Build once, deploy everywhere
4. **Rollback-first** — Always know how to revert
5. **Secrets management** — Never inject secrets in pipeline code

---

## Anti-Patterns

```
❌ Deploying directly from developer laptops
✅ All deployments via CI/CD pipeline — never manual

❌ CI runs only on main branch
✅ Run CI on every PR — catch issues before merge

❌ No staging environment — dev → prod directly
✅ At minimum: dev → staging → prod with approval gates

❌ Secrets hardcoded in pipeline YAML
✅ Secrets from vault/secrets manager, injected as env vars

❌ Flaky tests causing random pipeline failures
✅ Quarantine flaky tests; fix or remove — never ignore
```

---

## Quick Reference

| Stage | What runs | Gate to next |
|---|---|---|
| Build | Compile, lint, typecheck | All pass |
| Test | Unit + integration tests | >80% coverage |
| Security | SAST, dependency audit | No criticals |
| Artifact | Docker build + push | Image tagged |
| Deploy staging | Helm/Terraform apply | Smoke tests pass |
| Deploy prod | Same image, prod values | Manual approval |

---

## Decision Tree

```
Pipeline model?
├── Fast iteration, small team             → trunk-based (short-lived branches, merge daily)
├── Scheduled releases, enterprise         → GitFlow (long-lived release branches)
└── Multiple versions in production        → release branches per version

Deployment strategy?
├── Zero downtime required                 → blue-green (instant traffic switch)
├── Test with real traffic gradually       → canary (1% → 10% → 50% → 100%)
├── Simple, stateless service              → rolling (replace instances one by one)
└── Decouple deploy from release           → feature flags (deploy dark, enable gradually)

Test stage gate?
├── Every commit (< 1min)                  → lint + typecheck + unit tests
├── Every PR (< 10min)                     → + integration + smoke tests
├── Before staging deploy                  → + E2E critical paths
└── Before prod deploy                    → + performance + security scan
```

---

## Key Rules

1. Run CI on every PR branch — never only on main
2. Build once → deploy same artifact to staging then prod (immutable)
3. No secrets in YAML — inject from secrets manager (GitHub Secrets, Vault)
4. Fail fast: lint/typecheck first, E2E last
5. Staging environment as close to prod as possible (same Docker image, similar data)
6. Always have a rollback procedure tested before deployment
7. Quarantine flaky tests immediately — never ignore or re-run silently

---

## Implementation

```yaml
# .github/workflows/ci.yml — fail-fast pipeline
name: CI/CD
on:
  push:
    branches: [main]
  pull_request:

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install --frozen-lockfile
      - run: bun run typecheck          # fail fast — type errors
      - run: bun run lint               # lint
      - run: bun run test --coverage    # unit + integration

  build:
    needs: check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - uses: docker/login-action@v3
        with: { registry: ghcr.io, username: ${{ github.actor }}, password: ${{ secrets.GITHUB_TOKEN }} }
      - uses: docker/build-push-action@v5
        with:
          push: ${{ github.ref == 'refs/heads/main' }}
          tags: ghcr.io/${{ github.repository }}:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy-staging:
    needs: build
    if: github.ref == 'refs/heads/main'
    environment: staging
    runs-on: ubuntu-latest
    steps:
      - run: |
          # Deploy same image built above
          docker pull ghcr.io/${{ github.repository }}:${{ github.sha }}
          # ... helm upgrade / kubectl rollout

  deploy-prod:
    needs: deploy-staging
    environment: production   # requires manual approval in GitHub
    runs-on: ubuntu-latest
    steps:
      - run: echo "Deploy ${{ github.sha }} to production"
```
