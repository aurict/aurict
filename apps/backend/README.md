# Aurict Backend

The account, device-trust, encrypted secret relay and remote-signaling service behind `api.aurict.com`. Licensed under AGPL-3.0 with the rest of this repository: if you run a modified version as a network service, you must offer its source to its users.

It does **not** proxy LLM traffic, store provider API keys in plaintext, or carry remote-control prompts, terminal output, tool results or file contents. The one place user-written text is stored is a feedback report the user chooses to send (see [Data the backend stores](#data-the-backend-stores)).

## What it does

- **Accounts:** email and password (argon2id), Google and GitHub through Firebase Auth, browser-based CLI login, email verification, password reset, sessions, export, account deletion.
- **Tokens:** short-lived access tokens (Ed25519 or HS256, bound to an issuer and audience) and single-use rotating refresh tokens with family revocation on reuse.
- **Devices and trust:** each device registers an Ed25519 or P-256 public key and proves it by signing a challenge. Trust between two devices is created only with a grant signed by the target device.
- **Secret relay:** ciphertext-only, signed, one-time transfers between trusted devices of one account.
- **Remote signaling:** signed WebRTC offers and answers, TURN credentials, heartbeats and resume. The data channel is peer to peer; the backend never sees it.
- **Legal:** cached statute texts and citations (`/legal/*`).

## Security model

These are enforced in code and covered by tests in `test/`.

- **Device keys.** The fingerprint is derived on the server as `fp_` + base64url(sha256(signingPublicKey)); a client-chosen fingerprint is rejected. Only public Ed25519 or P-256 JWKs are accepted.
- **Signatures.** Remote offers and answers, secret transfer envelopes and secret claims must be signed by the named device's registered key. Signed payloads are canonical (see `src/crypto/signatures.ts`) and carry a purpose tag, so a signature for one purpose cannot be reused for another.
- **Trust.** `POST /devices/:id/trust` needs a grant signed by device `:id` and issued in the last five minutes. A stolen access token alone cannot make a desktop trust a new phone. The desktop also pins paired phones locally and verifies every answer and data-channel event against the pinned key (`packages/cli/src/remote/peer-trust.ts`), so a compromised backend cannot add a controller either.
- **Secret transfers.** Ciphertext is returned only by the recipient's signed claim, exactly once, and is wiped in the same transaction. Claimed, revoked and expired ciphertext is purged.
- **Tokens.** Password reset, `logout-all` and refresh token reuse move `users.tokens_valid_after`, so earlier access tokens stop working immediately. A password reset also invalidates every other reset link. Deleting a Firebase account needs a sign-in from the last five minutes.
- **Rate limits.** Requests are limited per client address and, for writes, per account. Login is also limited per email address. The client address is the web app's forwarded address when it carries `TRUSTED_PROXY_SECRET`, then `CF-Connecting-IP` when `TRUST_PROXY_HEADERS=true`, then the socket address. IPv6 is grouped by /64. When Redis fails, limits fall back to an in-process limiter instead of turning off.
- **CLI login.** The approval page shows where the login started (network /24 or /64, country, time) through `POST /auth/device/lookup`, so a user can spot a code someone else sent them.
- **Input.** Strict zod schemas, a streaming body-size limit, JSON parse errors as 400, generic 500 messages in production, metrics labelled by route pattern rather than raw path.
- **Fail closed.** `NODE_ENV` defaults to `production`; production refuses to start without `JWT_SECRET`, `DATABASE_URL` and `CORS_ORIGINS`. Test-only shortcuts (test Firebase tokens, echoed action tokens) are off in production.

Report vulnerabilities privately; see [SECURITY.md](../../SECURITY.md).

## Data the backend stores

- Account: email, password hash, linked provider ids, sessions (hashed refresh tokens), audit events.
- Devices: name, platform, public keys, fingerprint, last-seen time, trust relations.
- Secret transfers: envelope metadata; ciphertext only until it is claimed or expires.
- Remote sessions: signed offer/answer (SDP), status, sequence numbers.
- CLI login requests: client name, coarse network and country, for ten minutes.
- Feedback reports: what the user submits, which can include the conversation excerpt they chose to attach (up to 24 KB). Deleted after `FEEDBACK_RETENTION_DAYS` (default 90).

## Configuration

All settings are environment variables, validated in `src/env.ts`. The production template with every variable and its meaning is [`deploy/.env.example`](deploy/.env.example). The most important ones:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Postgres connection; without it the app uses an in-memory store (development and tests only). |
| `JWT_PRIVATE_KEY` / `JWT_PUBLIC_KEY` | Ed25519 signing keys from `bun run scripts/generate-jwt-keys.ts`. Preferred over `JWT_SECRET`. |
| `JWT_ISSUER` / `JWT_AUDIENCE` | Bound into access tokens; tokens for another issuer or audience are rejected. |
| `CORS_ORIGINS` | Comma-separated browser origins allowed to call the API. |
| `TRUST_PROXY_HEADERS` | Use `CF-Connecting-IP` for rate limits. Enable only when the origin is reachable through Cloudflare alone. |
| `TRUSTED_PROXY_SECRET` | Lets the web app forward visitor addresses (`x-aurict-client-ip`). |
| `REDIS_URL` | Shared rate-limit store. |
| `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_LINK_BASE_URL` | Verification and reset emails. Without a key, production refuses verification requests and logs reset requests. |
| `FIREBASE_PROJECT_ID` | Enables `POST /auth/firebase`. |
| `TURN_URIS`, `TURN_SHARED_SECRET` | Short-lived TURN credentials for remote sessions. |
| `METRICS_TOKEN`, `PUBLIC_OPENAPI` | `/metrics` and `/openapi.json` are hidden in production unless configured. |

## Running it

Development, with an in-memory store:

```bash
cd apps/backend
bun install
bun run dev            # http://localhost:8787
```

With Postgres, from the repository root:

```bash
docker compose -f apps/backend/docker-compose.yml up --build
```

### Self-hosting

1. Build the image from the repository root, or pull the signed one CI publishes:
   `docker build -f apps/backend/Dockerfile -t aurict-backend .`
2. Copy `deploy/docker-compose.yml` and `deploy/postgres/` to the server, fill in `deploy/.env.example` as `.env` (mode 0600), and create the shared networks once:
   `docker network create aurict_app && docker network create aurict_edge`
3. `docker compose up -d`. Migrations run first as the schema owner; the app then connects as a role that can read and write data but cannot change the schema.

The compose file runs every container with a read-only root filesystem, no Linux capabilities, `no-new-privileges` and memory and process limits. Postgres and Redis sit on an internal network with no route out and no published ports. Put a TLS-terminating proxy or a Cloudflare Tunnel on the `aurict_edge` network in front of `backend:8787`. Set `TRUST_PROXY_HEADERS=true` only if every request reaches the origin through Cloudflare.

If you run TURN (coturn) for remote sessions, deny relaying to private ranges (`denied-peer-ip`) so it cannot be used to reach your internal network.

## Database

- Generate a migration after changing `src/db/schema.ts`: `bun run db:generate`.
- Apply migrations: `DATABASE_URL=postgres://... bun run db:migrate`.
- Migrations are forward-only. Never edit one that has been applied.
- `/ready` pings the database; `/health` only reports that the process is up.

## Google and GitHub sign-in

Clients sign in with Firebase Auth and send the Firebase ID token to `POST /auth/firebase`. The backend verifies the RS256 signature against Google's certificates and checks issuer, audience, expiry and email. It creates or links an account only when Firebase reports a verified email. In the Firebase console, restrict the web API key to your domains and to the Identity Toolkit API, and keep the authorized domains list short.

## Tests

```bash
cd apps/backend
bun test                         # unit and route tests, in-memory store
DATABASE_URL=postgres://... bun test test/integration.test.ts
REDIS_URL=redis://... bun test test/redis-rate-limit.test.ts
bun run typecheck
```

Integration and Redis tests skip when their URL is not set; CI runs them against service containers.
