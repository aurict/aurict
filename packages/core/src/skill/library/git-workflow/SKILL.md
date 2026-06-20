---
name: git-workflow
description: "Git: Branch strategy, Commit patterns, Merge vs Rebase, When to use what." 
triggers:
  keywords: ["git", "branch", "commit", "PR", "merge", "rebase", "workflow", "conventional commits"]
auto_load_when: "Git workflow decisions or commit standards"
agent: researcher
tools: ["Read", "Write", "Bash"]
---

# Git Workflow Patterns

**Focus:** Branching, commits, collaboration

## 1. Branch Strategy

```
Branch types:
├── main: production-ready, never force push
├── develop: integration branch, feature base
├── feature/*: new features, from develop
├── release/*: release preparation, from develop
└── hotfix/*: production fixes, from main

Flow:
develop → feature → develop → release → main → hotfix → main
```

**When to create branches:**
- Feature: new functionality
- Bugfix: bug fix
- Release: preparing version
- Hotfix: critical production fix

---

## 2. Commit Strategy

```
When to commit:
├── Logical unit complete
├── Tests pass
└── Works locally

Message format:
├── <type>: <description>
├── Types: feat, fix, docs, style, refactor, test, chore
├── Description: imperative, lowercase, short
└── Body: optional, explanation

What to include:
├── What changed
├── Why (if not obvious)
└── How (if complex)
```

---

## 3. Merge vs Rebase Decision

```
When to merge:
├── Feature branch into develop
├── Long-lived branches
└── Public/shared branches
└── Preserves history exactly

When to rebase:
├── Local feature branch updates
├── Keep history linear
├── Clean up commit history
└── Before PR review

NEVER rebase:
├── Public/shared branches
├── Main/master branch
└── Already pushed branches (if shared)
```

---

## 4. PR Workflow

```
Before creating PR:
├── Tests pass locally
├── Code formatted
├── Rebased on target branch
└── Self-reviewed changes

PR best practices:
├── Small PRs (easier to review)
├── Clear description
├── Screenshots for UI
└── Related issues linked

Review feedback:
├── Address all comments
├── Don't take personally
├── Ask for clarification if unclear
└── Re-request review after changes
```

---

## 5. Commit Organization

```
How to organize commits:
├── First commit: setup/scaffolding
├── Middle: logical steps
├── Last commit: final touches
└── Squash: clean before merge

Atomic commits:
├── One logical change per commit
├── Can be understood alone
├── Tests related changes together
```

---

## 6. When to Use What

```
Squash merge (GitHub default):
├── When: feature branch has multiple commits
├── Good for: clean history on main
└── Preserves: feature branch temporarily

Rebase:
├── When: update local branch with main
├── Good for: clean, linear history
└── Use on: local branches only

Merge:
├── When: combining branches
├── Good for: preserving history
└── Use on: long-lived branches
```

---

## Key Patterns

1. **Feature branches** - Isolated development
2. **Small PRs** - Faster review, less risk
3. **Rebase locally** - Linear history
4. **Squash to main** - Clean history
5. **Atomic commits** - Logical, understandable

---

## Anti-Patterns

```
❌ Force-pushing to main/master
✅ Protected branches + PR reviews — no direct push

❌ Commits like "fix", "WIP", "misc"
✅ Conventional Commits: feat(scope): description

❌ One giant commit per PR
✅ Atomic commits — each commit passes tests independently

❌ Long-lived feature branches (> 2 days)
✅ Trunk-based development with feature flags for incomplete work

❌ Merging without squashing messy WIP commits
✅ Squash-and-merge for clean main history
```

---

## Quick Reference

| Scenario | Command | Note |
|---|---|---|
| New feature | git checkout -b feat/name | Branch from main |
| Sync branch | git rebase main | Not merge — cleaner history |
| Interactive rebase | git rebase -i HEAD~N | Squash WIP commits |
| Undo last commit | git reset --soft HEAD~1 | Keeps changes staged |
| Cherry-pick | git cherry-pick <sha> | Port specific commit |
| Stash | git stash push -m "WIP: description" | Named stash |
