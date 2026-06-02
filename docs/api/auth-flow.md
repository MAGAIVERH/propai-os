# PropAI API — Auth flow (Day 10)

Step-by-step guide to verify Better Auth sign-up, login, session cookies, and tenant-scoped API access via Postman or Insomnia.

**Base URL:** `http://localhost:3333`

**Prerequisites:**

- Docker Postgres running (`pnpm docker:up`)
- Migrations applied (`pnpm db:migrate`)
- API server running (`pnpm --filter @propai/api dev`)

---

## 1. Brokerage sign-up (creates user + org + owner + settings)

**Request**

```
POST /api/auth/brokerage-sign-up
Content-Type: application/json
```

**Body**

```json
{
  "email": "owner@acme-brokerage.test",
  "password": "password123",
  "name": "Jane Owner",
  "organizationName": "Acme Brokerage"
}
```

**Expected:** `201 Created`

- Response includes `user`, `organization`, and `session.activeOrganizationId`
- `Set-Cookie` header with `better-auth.session_token` (HttpOnly, SameSite=Lax)

**Side effects (atomic):**

| Table | Row |
| ----- | --- |
| `user` | New account |
| `organization` | Slug auto-generated from name (`acme-brokerage`) |
| `member` | Role `owner` |
| `tenant_settings` | Defaults: `America/New_York`, `USD` |

**Errors**

| Status | Cause |
| ------ | ----- |
| `400` | Validation error (invalid email, short password, etc.) |
| `409` | Email already registered or organization slug taken |

---

## 2. Get session (verify activeOrganizationId)

**Request**

```
GET /api/auth/get-session
Cookie: <paste Set-Cookie from step 1>
```

**Expected:** `200 OK`

```json
{
  "session": {
    "activeOrganizationId": "<organization-uuid>"
  },
  "user": {
    "id": "...",
    "email": "owner@acme-brokerage.test"
  }
}
```

In Postman: enable **Cookies** for `localhost:3333` after sign-up, or copy the `Cookie` header manually.

---

## 3. Sign in (email + password)

**Request**

```
POST /api/auth/sign-in/email
Content-Type: application/json
```

**Body**

```json
{
  "email": "owner@acme-brokerage.test",
  "password": "password123",
  "rememberMe": true
}
```

**Expected:** `200 OK` + new `Set-Cookie`

On sign-in, the session hook sets `activeOrganizationId` to the user's first organization membership.

---

## 4. Protected route (RLS tenant scope)

**Request**

```
GET /v1/test-items
Cookie: <session cookie>
```

**Expected:** `200 OK`

```json
{
  "items": []
}
```

Without a cookie → `401 Unauthorized`.  
With cookie but no active org → `403 Forbidden`.

---

## 5. Sign out

**Request**

```
POST /api/auth/sign-out
Cookie: <session cookie>
```

**Expected:** `200 OK` — session cookie cleared.

---

## CORS (web dashboard on :3000)

The API allows credentialed requests from:

- `http://localhost:3000` (Next.js dashboard)
- `http://localhost:3333` (API / Postman)

Configure Postman with **Credentials: Include** when calling from a browser-like client.

---

## Environment variables

| Variable | Example | Purpose |
| -------- | ------- | ------- |
| `BETTER_AUTH_SECRET` | 32+ char secret | Cookie signing |
| `BETTER_AUTH_URL` | `http://localhost:3333` | Auth base URL (must match API host) |
| `DATABASE_URL` | `postgresql://propai:propai@localhost:5432/propai` | Admin DB (migrations, auth adapter) |
| `DATABASE_APP_URL` | `postgresql://propai_app:...` | RLS-scoped app queries |

---

## Postman collection

Import `docs/api/propai-api.postman_collection.json` for pre-configured requests.

Variables:

- `baseUrl` → `http://localhost:3333`
- Cookies are stored automatically when using the collection against localhost.

---

## Vitest (automated)

```bash
pnpm test:api
```

Includes `auth.integration.test.ts` (real cookies) and `test-items.integration.test.ts` (mock bearer for RLS isolation).
