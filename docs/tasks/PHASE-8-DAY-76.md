# Phase 8 · Day 76 — Docker production builds

**Objective:** Containerized API and workers.

**Delivered:**
- [x] Multi-stage `docker/api/Dockerfile` (node:22-alpine): a build stage installs
  the API's pnpm subtree (`--filter @propai/api...`) and builds `@propai/shared`;
  the runtime stage runs as a non-root user through the workspace `tsx` binary
  (no pnpm/corepack at runtime → fast startup, no network).
- [x] **One image, two processes** — the worker is the same image with a different
  command: `node_modules/.bin/tsx src/worker.ts` (vs. `src/index.ts` for the API).
- [x] `.dockerignore` keeps the build context small (excludes node_modules, .next,
  dist, .git, .env, tests, docs).
- [x] `docker-compose.prod.yml` — self-contained postgres + redis + api + worker;
  documented to swap in Neon + Upstash for real production (Day 77). The worker
  service disables the HTTP health check (it serves no HTTP).
- [x] **Fix:** `AI_ANALYZE_IMAGES_QUEUE_NAME` / `AI_GENERATE_EMBEDDING_QUEUE_NAME`
  used `:`, which BullMQ v5 rejects (`Queue name cannot contain :`) and crashed the
  worker on boot. Renamed to hyphens (`ai-analyze-images`, `ai-generate-embedding`)
  with updated unit tests.

**Verified (locally, against the running postgres/redis):**
- `docker build -f docker/api/Dockerfile -t propai-api .` succeeds (~1 GB image).
- API container reaches `healthy` — `/health` → 200; the built-in `HEALTHCHECK`
  passes.
- Worker container boots all three BullMQ workers (`analyze-property-images`,
  `generate-property-embedding`, `send-visit-confirmation` → "ready").

**Env the containers expect:** `DATABASE_URL`, `DATABASE_APP_URL`,
`REDIS_BULLMQ_URL` (BullMQ Redis — note: *not* `REDIS_URL`), `BETTER_AUTH_SECRET`,
plus the `NEXT_PUBLIC_*` URLs.

**Run:**
```bash
docker build -f docker/api/Dockerfile -t propai-api .
BETTER_AUTH_SECRET=<32+ chars> docker compose -f docker-compose.prod.yml up -d --build
curl -s http://localhost:3333/health   # → 200
```

**Done:** `docker build` succeeds; the API container passes its health check and the
worker container runs the queues.
