# syntax=docker/dockerfile:1.7
# Build from the repository root:  docker build -f apps/web/Dockerfile .
# apps/web is a member of the root Bun workspace, so the install uses the root lockfile.

FROM oven/bun:1.4.4-slim@sha256:1846adf22496bd711036aae8be147e57bdebbaea2e5264e3e0b5af1db187d9a4 AS build
WORKDIR /repo
# Every workspace manifest is needed for a frozen install; only web's dependencies are installed.
COPY package.json bun.lock bunfig.toml tsconfig.base.json ./
COPY patches ./patches
COPY packages/core/package.json packages/core/
COPY packages/cli/package.json packages/cli/
COPY packages/aurict/package.json packages/aurict/
COPY packages/cli-linux-x64/package.json packages/cli-linux-x64/
COPY packages/cli-linux-arm64/package.json packages/cli-linux-arm64/
COPY packages/cli-darwin-x64/package.json packages/cli-darwin-x64/
COPY packages/cli-darwin-arm64/package.json packages/cli-darwin-arm64/
COPY packages/cli-win32-x64/package.json packages/cli-win32-x64/
COPY apps/desktop/package.json apps/desktop/
COPY apps/web/package.json apps/web/
RUN bun install --frozen-lockfile --filter web
COPY apps/web ./apps/web
# The site reads the public model catalog straight from core's source (a dependency-free file).
COPY packages/core/src/marketing ./packages/core/src/marketing
# NEXT_PUBLIC_* values are compiled into the client bundle, so they are build arguments.
ARG NEXT_PUBLIC_SITE_URL=https://aurict.com
ARG NEXT_PUBLIC_FIREBASE_API_KEY=
ARG NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
ARG NEXT_PUBLIC_FIREBASE_PROJECT_ID=
ARG NEXT_PUBLIC_FIREBASE_APP_ID=
ENV DOCKER_BUILD=1 NEXT_TELEMETRY_DISABLED=1
RUN cd apps/web && bun run build

FROM node:22-alpine@sha256:1314fb30ec37592d5845e5a160d522c0e680972aa534549940b8d73bde88481a AS runtime
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 HOSTNAME=0.0.0.0 PORT=3000
# Files stay root-owned and read-only; only .next/cache needs to be writable (a tmpfs in compose).
COPY --from=build /repo/apps/web/.next/standalone ./
COPY --from=build /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=build /repo/apps/web/public ./apps/web/public
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 CMD ["node", "-e", "fetch('http://127.0.0.1:3000/').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]
CMD ["node", "apps/web/server.js"]
