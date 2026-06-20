---
name: developer-experience
description: "Developer Experience: CLI tooling, documentation, onboarding, productivity, inner source." 
triggers:
  extensions: [".md", ".sh", ".ts"]
  directories: ["dx/", "scripts/", "tools/"]
  keywords: ["developer experience", "dx", "cli", "onboarding", "productivity", "automation", "scripts", "inner source"]
auto_load_when: "Improving developer productivity or building internal tools"
agent: platform-engineer
tools: ["Read", "Write", "Bash"]
---

# Developer Experience Patterns

**Focus:** Productivity, automation, developer tooling

## 1. Local Development

```
Local Dev Patterns:
├── Container-based dev
│   ├── Docker Compose for local stack
│   └── Database, cache, services in containers
│   └── Just "docker compose up"
│
├── Hot reload
│   ├── Watch for file changes
│   └── Restart in seconds, not minutes
│   └── Environment parity with prod
│
├── Debugging
│   ├── Local debug breakpoints
│   └── Log aggregation locally
│   └── VS Code/IntelliJ configs
│
└── Seed data
    └── Scripts to populate test data
    └── Reset to known state
```

---

## 2. CLI & Automation

```
CLI Design:
├── One command to rule them all
│   ├── `dev up` - starts all services
│   ├── `dev test` - runs all tests
│   ├── `dev deploy` - deploys to env
│   └── `dev help` - shows available commands
│
├── Standardized interface
│   ├── Consistent flags (--env, --verbose)
│   └── Colored output
│   └── Exit codes for automation
│
└── Scripts location
    └── In repo, version controlled
    └── Not in personal dotfiles
    └── Documented in README
```

---

## 3. Documentation

```
DX Documentation:
├── README per project
│   ├── Getting started (5 min or less)
│   ├── Prerequisites
│   └── First steps
│
├── Architecture docs
│   ├── System diagram
│   └── Data flow
│   └── Key decisions (ADRs)
│
├── Runbooks
│   ├── How to debug common issues
│   ├── How to run migrations
│   └── How to rollback
│
└── API docs
    ├── Auto-generated from code
    └── Interactive (try it out)
    └── Versioned
```

---

## 4. Onboarding

```
Onboarding Patterns:
├── New hire checklist
│   ├── Access provisioning
│   ├── Repository access
│   └── Tool setup
│
├── First week
│   ├── First PR by day 2-3
│   ├── Pair with buddy
│   └── Team intro
│
├── Self-service onboarding
│   ├── Scripts set up everything
│   └── Docs for each step
│   └── No manual ticket needed
│
└── Quick start
    └── 30 min to first commit
    └── 1 day to first deployment
    └── 1 week to first feature
```

---

## 5. Inner Source

```
Inner Source Patterns:
├── Shared libraries
│   ├── Reusable components
│   ├── Documented API
│   └── Versioned, semver
│
├── Shared services
│   ├── Common services (auth, payments)
│   └── Teams own their services
│   └── Cross-team consumption
│
├── Contribution culture
│   ├── Issue tags for contributions
│   └── Welcome external PRs
│   └── Documentation as code
│
└── Knowledge sharing
    └── Tech talks, demos
    └── Guilds/wg for topics
    └── Internal tech blog
```

---

## Key Patterns

1. **Convention over configuration** - Reduce decisions
2. **Automate repetitive tasks** - Humans are expensive
3. **Fast feedback loops** - Minutes, not hours
4. **Documentation as code** - Version, reviewable
5. **Measure and improve** - Track DX metrics

---

## Anti-Patterns

```
❌ No local setup instructions — new dev struggles
✅ README with "how to run locally" (works in 10 min)

❌ Manual processes requiring tickets — delay, frustration
✅ Self-service with automation

❌ Complex dependency setup (JavaScript hell) — blocker
✅ Docker-based or one-command setup

❌ No onboarding documentation — tribal knowledge
✅ Written guide for new joiners

❌ "Works on my machine" — not reproducible
✅ Reproducible environments (Docker, etc.)
```

---

## Quick Reference

| DX Area | Tool/Pattern | Priority |
|---|---|---|
| Local setup | Docker Compose | Critical |
| CLI | Custom commands | High |
| Docs | README, ADRs | High |
| Debugging | VS Code, logs | Medium |
| Testing | Test running scripts | Medium |
| Onboarding | Checklists | Medium |
