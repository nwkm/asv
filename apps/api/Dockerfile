# Build context: repository root.  Used for the API, the one-shot migrate and the seed job.
FROM oven/bun:1.3 AS deps
WORKDIR /app
COPY package.json bun.lock ./
COPY packages/shared/package.json packages/shared/
COPY packages/db/package.json packages/db/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN bun install --frozen-lockfile --production --filter '@asv/api' --filter '@asv/db' --filter '@asv/shared'

FROM oven/bun:1.3-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY --from=deps /app/apps ./apps
COPY package.json ./
COPY packages/shared/src packages/shared/src
COPY packages/db/src packages/db/src
COPY packages/db/drizzle packages/db/drizzle
COPY apps/api/src apps/api/src
COPY apps/api/tsconfig.json apps/api/
COPY tsconfig.base.json ./
WORKDIR /app/apps/api
USER bun
EXPOSE 4000
HEALTHCHECK --interval=10s --timeout=3s --retries=6 CMD bun -e "fetch('http://localhost:4000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["bun", "src/main.ts"]
