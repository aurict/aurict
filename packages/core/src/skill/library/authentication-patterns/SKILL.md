---
name: authentication-patterns
description: "Auth flows: JWT, OAuth, sessions, tokens, password handling, 2FA, SSO" 
triggers:
  extensions: [".ts", ".tsx"]
  directories: ["auth/", "middleware/"]
  keywords: ["auth", "jwt", "session", "login", "oauth", "password", "token", "2fa"]
auto_load_when: "Building auth flows or middleware"
agent: security-officer
tools: ["Read", "Write", "Bash"]
---

# Authentication Patterns

**Focus:** Auth strategy selection, implementation patterns, security

## 1. Auth Strategy Decision Tree

```
Choose session when:
├── Server-rendered app (SSR)
├── Simple deployment (stateless)
└── Session store available (Redis)

Choose JWT when:
├── APIs, SPAs, mobile apps
├── Need stateless scaling
└── Cross-domain requirements

Choose OAuth/SSO when:
├── Social login needed
├── Enterprise SSO required
└── Identity delegation
```

---

## 2. JWT Implementation

```
Token structure:
├── Header: alg, typ
├── Payload: iss, sub, aud, exp, iat, claims
└── Signature: HMAC or RSA

Token types:
├── Access token: short-lived (15min-1hr)
├── Refresh token: long-lived (days-weeks)
└── ID token: identity claims only

Storage decisions:
├── Access: memory (JS only)
├── Refresh: httpOnly cookie
└── NEVER: localStorage (XSS vulnerable)
```

---

## 3. Password Handling

```
Never store plain text. Use:
├── Argon2id: best (memory-hard)
├── bcrypt: good, widely supported
└── scrypt: alternative

Validation requirements:
├── Minimum length (8+)
├── Complexity: mixed case, numbers, symbols
└── Check against known breaches (HaveIBeenPwned)

Auth flow:
1. Client sends plaintext
2. Server hashes + compare
3. Issue tokens on success
4. Log failed attempts
```

---

## 4. OAuth 2.0 Flows

```
Authorization Code (web):
├── Redirect to auth server
├── Receive code via redirect
├── Exchange code for tokens
└── PKCE for public clients

Implicit (deprecated):
├── DO NOT USE
└── Tokens in URL, security risk

Client Credentials (M2M):
├── No user context
├── Service-to-service
└── Server-to-server

Device Code (IoT):
├── User authorizes on separate device
└── Poll for completion
```

---

## 5. Multi-Factor Authentication

```
TOTP (time-based):
├── Google Authenticator, Authy
├── 30-second rotating codes
└── 6-digit, easy UX

SMS (less secure):
├── Vulnerable to SIM swap
├── Phone number required
└── Use as fallback only

WebAuthn (passwordless):
├── Biometric or hardware key
├── Most secure
└── Cross-device support varies

When to require 2FA:
├── High-value actions (payments, settings)
├── Sensitive accounts
└── After suspicious activity
```

---

## 6. Session Management

```
Session store:
├── Redis: fast, scalable
├── Database: simple, slower
└── In-memory: single server only

Session data:
├── User ID, creation time
├── Last activity
└── Device/browser info

Security:
├── Secure, httpOnly cookie
├── SameSite=strict/lax
├── Rotate on login
└── Expire inactive sessions
```

---

## Key Patterns

1. **Never store passwords** - Hash + salt
2. **Short access tokens** - Long-lived refresh
3. **Secure cookies** - httpOnly, SameSite
4. **OAuth with PKCE** - Required for SPA
5. **2FA for sensitive** - Not everywhere
6. **Log auth failures** - Detect attacks

---

## Anti-Patterns

```
❌ Rolling your own auth from scratch
✅ Use battle-tested library (NextAuth, Auth.js, Clerk, Supabase Auth)

❌ Storing JWT in localStorage (XSS vulnerable)
✅ HttpOnly, Secure, SameSite=Strict cookies

❌ No refresh token rotation
✅ Rotate refresh token on every use; invalidate old on rotation

❌ Weak password policy (4 chars allowed)
✅ Min 12 chars, check against breached password DB (HaveIBeenPwned)

❌ Not expiring sessions on logout
✅ Invalidate session server-side on logout (blocklist or token version)
```

---

## Quick Reference

| Flow | Library | Note |
|---|---|---|
| OAuth 2.0 | Auth.js / NextAuth | Social login |
| Email/password | Lucia / better-auth | Full control |
| Passkeys | SimpleWebAuthn | FIDO2 |
| JWT | jose | RS256, not HS256 |
| MFA | speakeasy (TOTP) | Backup codes required |
| Session | iron-session | Encrypted cookie |

---

## Decision Tree

```
Auth strategy?
├── SSR app + simple deployment               → session (Redis store, httpOnly cookie)
├── SPA / mobile / API-only                   → JWT (access 15min + refresh in httpOnly cookie)
├── Social login / enterprise SSO             → OAuth 2.0 (Auth.js / better-auth)
└── Passwordless + security-first            → WebAuthn / Passkeys (SimpleWebAuthn)

JWT storage?
├── Access token                              → in-memory (JS variable) — never localStorage
├── Refresh token                             → httpOnly, Secure, SameSite=Strict cookie
└── ID token                                  → memory or cookie — not localStorage

OAuth flow?
├── Server-side web app                       → Authorization Code + PKCE
├── SPA / mobile (public client)              → Authorization Code + PKCE (mandatory)
└── Service-to-service (no user)              → Client Credentials

2FA when?
├── High-value actions (payments, settings)  → require step-up auth
├── New device / suspicious login            → trigger re-verification
└── Everywhere                               → TOTP preferred; SMS only as fallback
```

---

## Key Rules

1. Never roll your own auth — use Auth.js, better-auth, Clerk, or Supabase Auth
2. Never store passwords — hash with Argon2id (first choice) or bcrypt
3. Never store JWT in localStorage — XSS steals it; use httpOnly cookie
4. Rotate refresh token on every use; invalidate previous on rotation
5. Min 12-char passwords; check against HaveIBeenPwned API at registration
6. On logout: invalidate session/token server-side — client-side delete is insufficient
7. Rate-limit `/login` per IP: 5 attempts → 15min lockout

---

## Implementation

```typescript
// better-auth setup (recommended for Next.js)
// lib/auth.ts
import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'

export const auth = betterAuth({
  database:       prismaAdapter(prisma, { provider: 'postgresql' }),
  emailAndPassword: { enabled: true, minPasswordLength: 12 },
  session: {
    cookieCache: { enabled: true, maxAge: 60 * 5 },
  },
  socialProviders: {
    github: { clientId: process.env.GITHUB_CLIENT_ID!, clientSecret: process.env.GITHUB_CLIENT_SECRET! },
  },
})

// Middleware auth guard (Next.js)
// middleware.ts
import { betterFetch } from '@better-fetch/fetch'
import type { Session } from 'better-auth/types'

export async function middleware(request: NextRequest) {
  const { data: session } = await betterFetch<Session>('/api/auth/get-session', {
    baseURL: request.nextUrl.origin,
    headers: { cookie: request.headers.get('cookie') ?? '' },
  })
  if (!session && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  return NextResponse.next()
}

// JWT manual pattern (when lib not available)
import { SignJWT, jwtVerify } from 'jose'
const secret = new TextEncoder().encode(process.env.JWT_SECRET)

export async function signToken(payload: Record<string, unknown>) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('15m')
    .sign(secret)
}

export async function verifyToken(token: string) {
  const { payload } = await jwtVerify(token, secret)
  return payload
}
```
