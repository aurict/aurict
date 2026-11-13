# syntax=docker/dockerfile:1.7
# Build from the repository root:  docker build -f apps/backend/Dockerfile .
# Base images are pinned by digest; plain FROM lines let Dependabot update them.

FROM oven/bun:1.4.4-slim@sha256:1846adf22496bd711036aae8be147e57bdebbaea2e5264e3e0b5af1db187d9a4 AS deps
WORKDIR /app/apps/backend
COPY apps/backend/package.json apps/backend/bun.lock ./
RUN bun install --production --frozen-lockfile

FROM oven/bun:1.4.4-slim@sha256:1846adf22496bd711036aae8be147e57bdebbaea2e5264e3e0b5af1db187d9a4 AS runtime
# Same layout as the repository, so the relative import of packages/backend-contract resolves.
WORKDIR /app/apps/backend
ENV NODE_ENV=production
COPY --from=deps /app/apps/backend/node_modules ./node_modules
COPY apps/backend/package.json ./
COPY apps/backend/src ./src
COPY apps/backend/drizzle ./drizzle
COPY packages/backend-contract/src /app/packages/backend-contract/src
# Runs as the image's unprivileged "bun" user; the app writes nothing to disk, so the
# container can run with a read-only root filesystem.
USER bun
EXPOSE 8787 9464
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 CMD ["bun", "--eval", "fetch(`http://127.0.0.1:${process.env.PORT||'8787'}/health`).then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]
CMD ["bun", "run", "src/index.ts"]
