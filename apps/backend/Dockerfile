# syntax=docker/dockerfile:1.7
# Build from the repository root:  docker build -f apps/backend/Dockerfile .
# Base images are pinned by digest; plain FROM lines let Dependabot update them.

FROM oven/bun:1.3.14-slim@sha256:d56a2534ffd262e92c12fd3249d3924d296d97086da773f821d7d0477435ea04 AS deps
WORKDIR /app
COPY apps/backend/package.json apps/backend/bun.lock ./
RUN bun install --production --frozen-lockfile

FROM oven/bun:1.3.14-slim@sha256:d56a2534ffd262e92c12fd3249d3924d296d97086da773f821d7d0477435ea04 AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY apps/backend/package.json ./
COPY apps/backend/src ./src
COPY apps/backend/drizzle ./drizzle
# Runs as the image's unprivileged "bun" user; the app writes nothing to disk, so the
# container can run with a read-only root filesystem.
USER bun
EXPOSE 8787 9464
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 CMD ["bun", "--eval", "fetch(`http://127.0.0.1:${process.env.PORT||'8787'}/health`).then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]
CMD ["bun", "run", "src/index.ts"]
