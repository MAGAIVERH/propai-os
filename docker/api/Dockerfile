# Production image for the PropAI API + BullMQ workers.
# Build context is the monorepo root:
#   docker build -f docker/api/Dockerfile -t propai-api .
#
# The API runs on tsx (the workspace packages export TypeScript), so tsx is kept
# at runtime. One image serves both processes — override CMD for the worker:
#   API:    (default) pnpm --filter @propai/api start   → src/index.ts  (port 3333)
#   Worker:          pnpm --filter @propai/api worker   → src/worker.ts

# ─────────────────────────────── build stage ────────────────────────────────
FROM node:22-alpine AS build
RUN corepack enable && corepack prepare pnpm@11.5.0 --activate
WORKDIR /app

# Manifests first for better layer caching.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/api/package.json apps/api/
COPY packages/db/package.json packages/db/
COPY packages/shared/package.json packages/shared/
COPY packages/config/package.json packages/config/

# Install only the API's workspace subtree (incl. tsx, needed at runtime).
RUN pnpm install --frozen-lockfile --filter @propai/api...

# Source.
COPY apps/api apps/api
COPY packages/db packages/db
COPY packages/shared packages/shared
COPY packages/config packages/config

# @propai/shared is imported from its built dist output.
RUN pnpm --filter @propai/shared build

# ─────────────────────────────── runtime stage ──────────────────────────────
FROM node:22-alpine AS runner
ENV NODE_ENV=production
WORKDIR /app

# Run as a non-root user.
RUN addgroup -S propai && adduser -S propai -G propai
COPY --from=build --chown=propai:propai /app ./
USER propai

# Run directly through the workspace tsx binary (no pnpm/corepack at runtime, so
# startup is fast and needs no network).
WORKDIR /app/apps/api
EXPOSE 3333

# Liveness probe hits the API's own health endpoint.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3333/health || exit 1

# Default = API server. Worker override: CMD ["node_modules/.bin/tsx", "src/worker.ts"]
CMD ["node_modules/.bin/tsx", "src/index.ts"]
