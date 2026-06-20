---
name: documentation-patterns
description: "Documentation Patterns: What to document, README structure, API docs, keeping docs fresh." 
triggers:
  extensions: [".md"]
  keywords: ["docs", "README", "documentation", "JSDoc", "comment", "changelog", "ADR"]
auto_load_when: "Writing or reviewing documentation"
agent: docs-agent
tools: ["Read", "Write", "Bash"]
---

# Documentation Patterns

**Focus:** Essential docs, maintainability, discoverability

## 1. What to Document

```
Must have:
├── Getting started guide
├── Architecture overview
├── API reference (if applicable)
├── Deployment steps
└── Troubleshooting

Should have:
├── Coding standards
├── Environment setup
├── Runbook for ops
└── Security considerations

Avoid:
├── Outdated docs
├── Obvious code comments
├── Duplicate information
└── Internal team quirks
```

---

## 2. README Structure

```
Standard README:
├── One-liner description
├── Quick start (3-5 steps)
├── Features overview
├── Prerequisites
├── Installation
├── Configuration
├── Usage examples
├── Testing
├── Deployment
├── Contributing
├── License

Keep under 100 lines, link details
```

---

## 3. API Documentation

```
Include:
├── Endpoint list (method, path)
├── Request format
├── Response format
├── Error codes
├── Authentication
├── Example requests/responses

Tools: OpenAPI/Swagger, Postman
```

---

## 4. Architecture Docs

```
Architecture decision:
├── System diagram
├── Component descriptions
├── Data flow
├── Technology choices
├── Rationale for decisions

Template: ADRs (Architecture Decision Records)
```

---

## 5. When to Document

```
Write docs when:
├── New project starts
├── Onboarding new member
├── Complex logic added
├── New developer joins
└── Before you forget

Update docs when:
├── Requirements change
├── Breaking changes
└── Bugs found (add to troubleshooting)
```

---

## 6. Doc Maintenance

```
Keep docs fresh:
├── Treat docs like code (review)
├── Link from code where possible
├── Docs in same repo
├── Automate where possible
└── Remove stale content

If docs rot, remove them
```

---

## 7. Decision Trees

```
What to document:
├── If question asked twice → doc it
├── If setup takes > 5 steps → doc it
├── If error is non-obvious → doc it
└── If it's a rule → doc it

What not to document:
├── Obvious code behavior
├── Code comments are enough
├── Outdated content
└── Duplicate sources
```

---

## Key Patterns

1. **README first** - essential start
2. **Code examples** - show usage
3. **Living docs** - keep updated
4. **ADRs** - record decisions
5. **Treat code** - version together

(End of file - 73 lines)

---

## Anti-Patterns

```
❌ Docs that describe WHAT the code does (code already shows that)
✅ Docs explain WHY decisions were made and non-obvious constraints

❌ Markdown docs that drift from the actual code
✅ Generate API docs from code (JSDoc, OpenAPI) — single source of truth

❌ README with installation but no usage examples
✅ README: install → quick start → common tasks → link to full docs

❌ Architecture diagrams stored as binary in git
✅ Diagrams as code (Mermaid, PlantUML) — diffable, versionable

❌ "Update docs later" — never happens
✅ Docs update in the same PR as the code change
```

---

## Quick Reference

| Doc type | Format | Tool |
|---|---|---|
| API reference | OpenAPI 3.1 | swagger-ui / redoc |
| Architecture | Mermaid diagram in MD | In-repo |
| Runbook | Numbered steps + checks | Confluence / Notion |
| ADR | Markdown with status | docs/decisions/ |
| README | Install → usage → contribute | Repo root |
| Inline | JSDoc with @param @returns | TypeDoc |
