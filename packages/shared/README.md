# @propai/shared

Zod schemas, constants, and RBAC helpers shared by the API and Next.js apps.

## Consumption

Next.js apps (`@propai/web`, `@propai/marketplace`) import the compiled **`dist/`** output — not raw TypeScript source. Turbopack cannot resolve ESM `.js` suffix imports against `.ts` files in workspace packages.

| Step | Command |
| ---- | ------- |
| Build | `pnpm --filter @propai/shared build` |
| Local dev | `pnpm dev` — Turbo runs `^build` on dependencies first |
| Regression guard | `pnpm build:web` or `pnpm web-build-smoke` |

Source keeps Node ESM `.js` import suffixes; `tsc` emits matching files under `dist/`.
