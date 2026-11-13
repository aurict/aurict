# syntax=docker/dockerfile:1.7
# Build from the repository root:  docker build -f apps/decision-web/Dockerfile .
# decision-web is a standalone app with its own lockfile (written by Bun 1.4).

FROM oven/bun:1.4.2-slim@sha256:cb3bbbb08e13a4a2ff400f24c7a2a1d5efa83f6ef8544d52d95a519631e2fc61 AS build
WORKDIR /app
COPY apps/decision-web/package.json apps/decision-web/bun.lock ./
RUN bun install --frozen-lockfile
COPY apps/decision-web ./
# NEXT_PUBLIC_* values are compiled into the client bundle, so they are build arguments.
ARG NEXT_PUBLIC_DECISION_API_URL=https://decision.aurict.com
ENV DOCKER_BUILD=1 NEXT_TELEMETRY_DISABLED=1
RUN bun run build

FROM node:22-alpine@sha256:1314fb30ec37592d5845e5a160d522c0e680972aa534549940b8d73bde88481a AS runtime
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 HOSTNAME=0.0.0.0 PORT=3000
# Files stay root-owned and read-only; only .next/cache needs to be writable (a tmpfs in compose).
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 CMD ["node", "-e", "fetch('http://127.0.0.1:3000/').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]
CMD ["node", "server.js"]
