# aurict production (thelothe)

One compose project runs everything behind `aurict.com`: backend, the four sites, Postgres 17, Redis and a Cloudflare Tunnel. No container publishes a port. Public traffic only arrives through the tunnel, so the origin cannot be reached around Cloudflare.

## Layout on the server (`~/stack/aurict`, mode 700)

| File | Contents |
| --- | --- |
| `compose.yml` | This directory's `compose.yml`. |
| `.env` (600) | Infrastructure secrets used by compose: Postgres owner and app passwords, Redis password, proxy secret, `AURICT_UID`/`AURICT_GID`. |
| `backend.env` (600) | Backend settings only (JWT keys, Firebase, Resend, CORS, ...). The backend container never sees the schema owner's password. |
| `images.env` (600) | Image digests, written by `bin/aurict-deploy`. |
| `cloudflared/` (700) | `config.yml` (from `cloudflared/config.example.yml`) and the tunnel's credentials file. |
| `postgres/init-app-role.sh` | Creates the least-privilege `aurict_app` role. |
| `bin/aurict-deploy` | Pull-based deploy (see below). |
| `bin/aurict-backup-serve` | Forced command of the backup machine's SSH key; can only run `pg_dump`. |

## Releases

1. A push to `main` runs **Images**, which builds every service for amd64 and arm64 and attests each digest.
2. **Deploy** then waits for approval in the `production` environment. Approving it verifies the attestations and moves each image's `production` tag. To roll back, run Deploy by hand with an older commit SHA.
3. On the server, `aurict-deploy.timer` runs `bin/aurict-deploy` every two minutes:
   - It resolves each `production` tag to a digest and verifies the digest's attestation: built by `images.yml` from `main` of `aurict/aurict`. It needs no token, because the bundle comes from GitHub's public API.
   - It runs migrations as the schema owner, starts the new containers and waits for them to be healthy.
   - If anything fails, it restores the previous `images.env`.
   - It writes `aurict_deploy_*` metrics to `/var/lib/aurict/metrics`.

The server accepts no connection from CI, and CI holds no server credential.

Install the timer once:

```bash
sudo install -m 644 systemd/aurict-deploy.service systemd/aurict-deploy.timer /etc/systemd/system/
sudo systemctl daemon-reload && sudo systemctl enable --now aurict-deploy.timer
```

## Backups

The backup machine pulls a dump every night over Tailscale with a key that can only run `pg_dump`. It checks the dump before keeping it and keeps 14 daily and 6 monthly dumps. A restore into a throwaway Postgres runs every month. The scripts and user units are in [`../backup`](../backup); the backup machine serves its metrics on port 9110.

Restore into the server:

```bash
docker compose --env-file .env --env-file images.env exec -T postgres \
  sh -c 'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists --no-owner' < aurict-YYYYmmddTHHMMSSZ.dump
docker compose --env-file .env --env-file images.env exec -T postgres sh /docker-entrypoint-initdb.d/10-app-role.sh
```

## Monitoring

`monitoring/aurict.alloy` is appended to the host's Alloy config. It pushes the following to the monitoring server over Tailscale, with `system="aurict"` and its own ingest credential:

- container metrics
- backend metrics (internal port 9464, which the tunnel never routes)
- cloudflared metrics
- deploy metrics
- HTTPS probes of every hostname
- container logs, with emails, IP addresses and tokens masked

The alert rules are in `monitoring/rules-aurict.yml` and the Grafana dashboard in `monitoring/dashboard-aurict.json`. Alerts are delivered to ntfy.
