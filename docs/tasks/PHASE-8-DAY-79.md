# Phase 8 · Day 79 — Docker image build in CI

## Goal

Make CI **build the production image on every PR** so a broken
`docker/api/Dockerfile` (Day 76) is caught in review instead of at deploy time
(Day 77). Purely a CI change — no application code, no cloud.

## What changed

`.github/workflows/ci.yml` — new `docker-build` job:

- **Buildx + GitHub Actions cache** (`cache-from/to: type=gha`) so repeat runs
  are fast (only changed layers rebuild).
- Builds `docker/api/Dockerfile` with `push: false, load: true` → the image
  stays local to the runner; nothing is published to a registry.
- **Smoke check** runs the built image with the entrypoint overridden to `sh`
  (so it needs no Postgres/Redis) and asserts the runtime is intact:
  ```sh
  node_modules/.bin/tsx --version   # tsx runtime present
  test -f src/index.ts              # API entrypoint present
  test -f src/worker.ts             # worker entrypoint present
  ```

## Why the smoke check (not just build)

A green `docker build` proves the image *assembles*. The smoke check proves the
two things the runtime actually depends on are present — the `tsx` binary
(there is no pnpm at runtime, Day 76) and both process entrypoints. A boot test
(hitting `/health`) is intentionally left out of CI because it needs a live DB +
Redis; that is covered by the deploy health check in `railway.api.json` (Day 77).

## CI job matrix (after this change)

| Job | Checks |
|-----|--------|
| `lint-and-typecheck` | `pnpm lint` + `pnpm typecheck` (all packages) |
| `web-build` | `@propai/web` production build |
| `test-api` | API integration tests against Postgres |
| `docker-build` | **new** — builds prod image + runtime smoke check |

## Verify

```bash
# Local reproduction of the CI job:
docker build -f docker/api/Dockerfile -t propai-api:ci .
docker run --rm --entrypoint sh propai-api:ci -c \
  "node_modules/.bin/tsx --version && test -f src/index.ts && test -f src/worker.ts && echo ok"
```

Verified locally: build succeeded; smoke printed `tsx v4.22.4 / node v22.23.1`
and confirmed both entrypoints. YAML validated (4 jobs parse).
