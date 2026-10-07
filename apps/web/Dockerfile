# Build context: repository root.
FROM oven/bun:1.3 AS build
WORKDIR /app
COPY package.json bun.lock ./
COPY packages/shared/package.json packages/shared/
COPY packages/db/package.json packages/db/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN bun install --frozen-lockfile --filter '@asv/web' --filter '@asv/shared'
COPY tsconfig.base.json ./
COPY packages/shared packages/shared
COPY apps/web apps/web
ARG API_URL=http://api:4000
ARG NEXT_PUBLIC_CURRENCY=EUR
ENV API_URL=$API_URL NEXT_PUBLIC_CURRENCY=$NEXT_PUBLIC_CURRENCY NEXT_TELEMETRY_DISABLED=1
RUN cd apps/web && bun run build

FROM oven/bun:1.3-slim AS runtime
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
WORKDIR /app
COPY --from=build /app/apps/web/.next/standalone ./
COPY --from=build /app/apps/web/.next/static apps/web/.next/static
USER bun
EXPOSE 3000
CMD ["bun", "apps/web/server.js"]
