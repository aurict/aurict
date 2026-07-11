FROM oven/bun:1.3-slim AS deps
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --production --frozen-lockfile

FROM oven/bun:1.3-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src
COPY drizzle ./drizzle
COPY drizzle.config.ts ./drizzle.config.ts

USER bun
EXPOSE 8787
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 CMD ["bun", "--eval", "const port=process.env.PORT||'8787'; fetch(`http://127.0.0.1:${port}/health`).then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]
CMD ["bun", "run", "src/index.ts"]
