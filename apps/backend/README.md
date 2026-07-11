# Aurict Backend

Aurict Backend is the account, device-trust, encrypted-secret relay, and remote-signaling control plane.

It intentionally does **not** proxy LLM traffic, store provider API keys in plaintext, or carry remote-control prompts, commands, terminal output, tool results, or file contents.

## Scope

- Auth: email/password register, login, Firebase-backed Google/GitHub sign-in, browser-based CLI device login, refresh, logout.
- Auth hardening: refresh token rotation, family reuse detection, and family revocation on replay.
- Auth UX: email verification, password reset, account export, account disable, and session listing.
- Devices: same-account device registry, challenge verification, and revocation.
- Trust: scoped trust between devices with audit events.
- Secret relay: ciphertext-only, short-lived, one-time E2E encrypted transfer records.
- Secret relay contract: strict encrypted envelope with algorithm allowlist, sender signature, and device fingerprints.
- Remote signaling: short-lived signed offer/answer envelope metadata only, with TURN credential minting, resume token, heartbeat sequence, and idle timeout policy.
- API safety: security headers, allowlisted CORS, strict JSON schemas, and expired-record enforcement.
- Abuse protection: injectable rate limiter with local in-memory implementation and production-ready interface.
- Observability: opt-in structured request logs, in-memory metrics snapshot, and request ids across errors.
- API contract: `/openapi.json` and a small typed fetch client in `src/client.ts`.

## Non-Goals

- No provider API key plaintext.
- No LLM proxy.
- No remote command/event data plane.
- No document or chat content storage.

## Environment

- `NODE_ENV`: `development`, `test`, or `production`.
- `PORT`: HTTP port. Defaults to `8787`.
- `JWT_SECRET`: HMAC secret for access tokens. Production rejects the development default.
- `DATABASE_URL`: required in production; enables the Postgres-backed repository.
- `CORS_ORIGINS`: comma-separated list of allowed browser/mobile web origins.
- `ACCESS_TOKEN_TTL_SECONDS`: short-lived access token TTL. Defaults to 15 minutes.
- `REFRESH_TOKEN_TTL_SECONDS`: refresh token TTL. Defaults to 30 days.
- `DEVICE_LOGIN_TTL_SECONDS`: browser-based CLI login lifetime. Defaults to 10 minutes.
- `DEVICE_LOGIN_POLL_INTERVAL_SECONDS`: suggested CLI polling interval. Defaults to 5 seconds.
- `DEVICE_LOGIN_VERIFICATION_URI`: web activation page, usually `https://aurict.com/activate`.
- `FIREBASE_PROJECT_ID`: enables `POST /auth/firebase` for Firebase Auth ID tokens from Google/GitHub/mobile clients.
- `REQUEST_BODY_LIMIT_BYTES`: maximum request body size accepted from `content-length`.
- `REQUEST_LOGS`: opt-in structured request logs. Defaults to `false`.
- `TRUST_PROXY_HEADERS`: set to `true` only when Apache/Cloudflare forwards trusted client IP headers.
- `METRICS_TOKEN`: optional bearer token for `/metrics`; production hides metrics without it.
- `PUBLIC_OPENAPI`: production exposes `/openapi.json` only when explicitly set to `true`.

Remote sessions and secret transfers are TTL-bound. Expired remote sessions are marked `expired` and cannot be accepted or heartbeated; expired secret transfers cannot be claimed.

## Database

Backend persistence is PostgreSQL-first through Drizzle.

- Generate migrations: `bun run db:generate` from `apps/backend`.
- Apply migrations: `DATABASE_URL=postgres://... bun run db:migrate` from `apps/backend`.
- Readiness: `/ready` returns `db: "disabled"` when no `DATABASE_URL` is configured, and pings Postgres when DB is enabled.
- Runtime persistence: with `DATABASE_URL`, the app uses the Postgres-backed repository; without it, tests and local development use the in-memory repository.

The database stores account, device, trust, encrypted secret-transfer metadata, and remote signaling metadata only. It must not store provider API keys in plaintext or remote-control commands, prompts, terminal output, tool results, or file contents.

## Security Contracts

- Refresh tokens are single-use. Reusing a revoked token revokes the whole token family and emits `refresh.reuse_detected`.
- Firebase auth accepts only verified Firebase ID tokens for `FIREBASE_PROJECT_ID`. Existing password accounts are linked only when Firebase reports a verified email.
- Browser-based CLI login uses a high-entropy device code for CLI polling and a short user code approved by an already authenticated web/mobile session. The CLI never sees Google/GitHub tokens or user passwords.
- Device registration returns a short-lived verification challenge. Clients must call `/devices/:id/verify` with the challenge signature before treating the device as trusted locally.
- Trust and untrust actions are audited with source/target device ids, fingerprints, and scope.
- Secret transfers require envelope `version: 1`, allowlisted algorithms, nonce, ciphertext, recipient fingerprint, sender fingerprint, and sender signature.
- Remote sessions require signed signaling envelopes for `offer` and `answer`; transport must match the session connection mode.
- Remote control data-plane is peer-to-peer. Backend rejects prompt, command, terminal output, tool result, message, and file-content payload fields.
- Remote offer/answer fingerprints must match the registered device signing key fingerprint.
- Remote sessions enforce max active sessions per CLI device, bounded TTL, idle timeout, monotonic heartbeat sequence, and content-free resume token validation.
- TURN credentials are minted only for authenticated verified devices and are short-lived.
- Rate limiting uses an injectable `RateLimiter` interface. The default implementation is in-memory and intended for local/test; production should provide a shared Redis/KV-backed implementation.
- Password reset and email verification action tokens are stored hashed. In production responses do not include plaintext action tokens; an email delivery provider should deliver them out-of-band.
- Account deletion currently disables the account and revokes sessions. Hard-delete/data-erasure jobs can be added later if policy requires physical deletion.
- The current device verification endpoint validates the challenge envelope and records the signature algorithm. Full cryptographic signature verification should be enabled once CLI/mobile public key formats are finalized.

## Deployment

- Build image from the repo root: `docker build -f apps/backend/Dockerfile -t aurict-backend .`
- Optional local stack: `docker compose -f docker-compose.backend.yml up --build`.
- Production deploy flow should run migrations before starting the app: `DATABASE_URL=postgres://... bun run --cwd apps/backend db:migrate`.

The compose file is for local/dev validation. It binds the backend to `127.0.0.1:8787` so Apache can terminate TLS and proxy `https://api.aurict.com` to the local container without exposing the app port publicly.

Recommended Apache vhost shape:

```apache
<VirtualHost *:443>
  ServerName api.aurict.com
  ProxyPreserveHost On
  ProxyPass / http://127.0.0.1:8787/
  ProxyPassReverse / http://127.0.0.1:8787/
  RequestHeader set X-Forwarded-Proto "https"
  RequestHeader set X-Forwarded-Host "api.aurict.com"
</VirtualHost>
```

Production should provide a managed or backed-up Postgres URL, a non-default `JWT_SECRET`, `FIREBASE_PROJECT_ID`, and an explicit `CORS_ORIGINS` allowlist such as `https://aurict.com,https://www.aurict.com`. Keep `TRUST_PROXY_HEADERS=false` unless Apache/Cloudflare forwarding is configured intentionally.

## Google and GitHub Sign-In

The backend expects mobile/web clients to use Firebase Auth for Google and GitHub sign-in, then send the Firebase ID token to `POST /auth/firebase`.

```json
{ "idToken": "<firebase-id-token>" }
```

Backend behavior:

- Verifies the token signature against Google's Firebase securetoken certificates.
- Checks issuer, audience, expiration, issued-at time, subject length, and email.
- Creates a new Aurict account only when Firebase reports `email_verified=true`.
- Links an existing password account only when the Firebase email is verified.
- Issues normal Aurict access/refresh tokens after successful verification.

Firebase console requirements:

- Enable Google provider.
- Enable GitHub provider and configure the GitHub OAuth App client id/secret in Firebase.
- Configure iOS bundle id, Android package/SHA fingerprints, and authorized domains.
- Mobile clients must never send Google/GitHub raw profile ids as proof of login; send Firebase ID tokens only.

## Tests

- Memory/unit tests: `bun run test:backend`.
- Integration tests: `DATABASE_URL=postgres://... bun run test:backend:integration`.
- If `DATABASE_URL` is missing, integration tests skip cleanly. CI runs them with a Postgres service container.
