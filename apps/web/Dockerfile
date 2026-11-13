# syntax=docker/dockerfile:1.7
# Build from the repository root:  docker build -f apps/web/Dockerfile .
# apps/web is a member of the root Bun workspace, so the install uses the root lockfile.

FROM oven/bun:1.3.14-slim@sha256:d56a2534ffd262e92c12fd3249d3924d296d97086da773f821d7d0477435ea04 AS build
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

FROM node:25-alpine@sha256:bdf2cca6fe3dabd014ea60163eca3f0f7015fbd5c7ee1b0e9ccb4ced6eb02ef4 AS runtime
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
