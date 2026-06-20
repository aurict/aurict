---
name: security-review
description: "Security: Threat modeling, Validation strategy, Auth patterns, When to use what." 
triggers:
  keywords: ["security", "vulnerability", "OWASP", "injection", "XSS", "CSRF", "auth", "sanitize", "encrypt"]
auto_load_when: "Security review or implementing security measures"
agent: security-officer
tools: ["Read", "Write", "Bash"]
---

# Security Architecture Patterns

**Focus:** OWASP Top 10, threat patterns, best practices

## 1. Input Validation Strategy

```
What to validate:
├── ALL user input (never trust client)
├── API parameters (even from "internal" sources)
├── File uploads (type, size, name)
└── Third-party webhooks (verify signature)

Where to validate:
├── Schema validation: at API boundary (Zod)
├── Business logic: in domain/service layer
└── Database: constraints (unique, foreign key)

Pattern:
1. Validate schema at boundary (early failure)
2. Validate business rules in service
3. Let DB enforce constraints
```

---

## 2. Authentication Patterns

```
How to handle auth?
├── Session-based: server stores session, cookie on client
│   └── Good for: server-rendered apps, simple
│
├── JWT: self-contained tokens
│   └── Good for: APIs, SPAs, mobile
│   └── Store in httpOnly cookie or Authorization header
│
└── OAuth/SSO: third-party identity
    └── Good for: social login, enterprise
```

**Password handling:**
- NEVER store plain text
- Use Argon2id or bcrypt (not MD5/SHA)
- Never send passwords in URLs or logs

---

## 3. Authorization Patterns

```
Authorization levels:
├── Authentication: WHO is this? (logged in?)
├── Authorization: WHAT can they do? (permissions)
└── Resource ownership: CAN they access THIS? (ownership)

Implementation:
├── Role-based (RBAC): simple, fixed roles
│   └── user, admin, moderator
│
├── Permission-based: granular
│   └── user.can('read') .can('write') .can('delete')
│
└── Resource-based: ownership check
    └── userId === resource.ownerId
```

---

## 4. SQL Injection Prevention

```
When to worry:
├── Any raw SQL query
├── Any string concatenated into SQL
└── User input in database queries

Pattern:
├── Parameterized queries (Prisma does this automatically)
├── ORM for most queries
├── Raw SQL only when ORM insufficient
└── NEVER: string interpolation into SQL
```

---

## 5. XSS Prevention

```
When to worry:
├── User input rendered as HTML
├── User input in JavaScript
└── User input in URLs

Defense layers:
├── 1. Escape all output (React does this by default)
├── 2. Sanitize HTML if needed (DOMPurify for rich text)
├── 3. Content Security Policy (CSP headers)
├── 4. httpOnly cookies (no XSS access to tokens)
└── 5. Input validation (reject known bad)
```

---

## 6. Secrets Management

```
What is a secret:
├── API keys, tokens, passwords
├── Database connection strings
├── Encryption keys
└── Third-party credentials

Pattern:
├── NEVER commit secrets to git
├── Use environment variables (or secret manager)
├── Validate at startup (fail fast if missing)
├── Different secrets per environment
└── Rotate secrets regularly
```

---

## 7. Rate Limiting Strategy

```
When to implement:
├── Public APIs
├── Login/registration endpoints
├── Search/exensive operations
└── Any resource-limited operation

How to implement:
├── IP-based for general limits
├── User-based for authenticated endpoints
├── Exponential backoff for retry
└── Return proper status (429) + Retry-After
```

---

## Key Patterns

1. **Validate at boundary** - Fail fast, don't trust inputs
2. **Parameterized queries** - Never string-concatenate SQL
3. **Authenticate + authorize** - Both needed, different purposes
4. **Secrets in env** - Never in code
5. **Rate limit public** - Prevent abuse

---

## Anti-Patterns

```
❌ Trust user input inside SQL/shell strings
✅ Parameterized queries always; never string-concatenate SQL

❌ Sensitive data in URL query parameters
✅ POST body for sensitive data; never tokens/passwords in URLs

❌ JWT with alg: none or HS256 with weak secret
✅ RS256/ES256 for JWTs; rotate keys; verify signature server-side

❌ Storing plaintext passwords
✅ bcrypt (cost 12+) or Argon2id — never reversible encryption

❌ CORS * in production
✅ Explicit allowlist of origins; never wildcard with credentials
```

---

## Quick Reference

| Threat | Mitigation | Priority |
|---|---|---|
| SQLi | Parameterized queries | Critical |
| XSS | CSP + sanitize output | Critical |
| Auth bypass | Verify JWT server-side | Critical |
| CSRF | SameSite=Strict cookie | High |
| Path traversal | Validate + normalize paths | High |
| Rate limiting | Redis sliding window | High |
| Secrets exposure | Vault / env injection | Critical |
