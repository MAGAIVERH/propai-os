# PropAI API — Auth flow (Day 10–11)

Step-by-step guide to verify Better Auth sign-up, login, session cookies, tenant isolation, invitations, and RLS-scoped API access via Postman or Insomnia.

**Base URL:** `http://localhost:3333`

**Prerequisites:**

- Docker Postgres running (`pnpm docker:up`)
- Migrations applied (`pnpm db:migrate`)
- API server running (`pnpm --filter @propai/api dev`)
- Root `.env` with `DATABASE_URL`, `DATABASE_APP_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL=http://localhost:3333`

---

## Day 11 — Manual validation runbook

Use this section for human QA and to feed `docs/AUTH-POC-FEEDBACK.md`. Import `docs/api/propai-api.postman_collection.json` (folder **Day 11 — Manual POC**).

**Tip:** Use unique emails per run (collection variables `ownerAEmail`, `ownerBEmail`, `agentEmail`) or truncate auth tables between runs.

### Scenario matrix

| ID | Scenario | Expected result |
| -- | -------- | ---------------- |
| **M1** | Owner A sign-up + create test item | `201` sign-up + session cookie; `201` item scoped to org A |
| **M2** | Owner B sign-up + create test item; list items | `201` + cookie; B’s list has only B’s item (never A’s) |
| **M3** | Owner A invites agent | `201` invitation, `status: pending`, correct `organizationId` |
| **M4** | Agent signs up and accepts invitation | `200` accept; `member` in org A; `activeOrganizationId` = org A |
| **M5** | Agent lists test-items | `200`; only tenant A rows (includes A’s seeded item, not B’s) |
| **M6** | Wrong login / no cookie on protected route | `401` on `GET /v1/test-items` without cookie |

### M1 — Owner A sign-up + item

**1. Sign up (Owner A)**

```http
POST /api/auth/brokerage-sign-up
Content-Type: application/json

{
  "email": "owner-a-manual@test.propai-os.local",
  "password": "password123",
  "name": "Owner A",
  "organizationName": "Brokerage Alpha Manual"
}
```

**Expect:** `201` — body includes `organization.id`, `session.activeOrganizationId` matches org; Postman stores cookie for `localhost:3333`.

**2. Create test item**

```http
POST /v1/test-items
Cookie: <Owner A session>
Content-Type: application/json

{
  "name": "alpha-only-item"
}
```

**Expect:** `201` — `item.tenantId` equals Owner A `organization.id`.

---

### M2 — Owner B isolated tenant

**1. Sign up (Owner B)** — different email and organization name (unique slug).

```http
POST /api/auth/brokerage-sign-up
Content-Type: application/json

{
  "email": "owner-b-manual@test.propai-os.local",
  "password": "password123",
  "name": "Owner B",
  "organizationName": "Brokerage Beta Manual"
}
```

**Expect:** `201` + new cookie (separate session from A).

**2. Create and list**

```http
POST /v1/test-items
Cookie: <Owner B session>
Content-Type: application/json

{ "name": "beta-only-item" }
```

```http
GET /v1/test-items
Cookie: <Owner B session>
```

**Expect:** List length `1`, name `beta-only-item`, no `alpha-only-item`.  
**Re-check Owner A** (optional): `GET /v1/test-items` with A’s cookie still shows only `alpha-only-item`.

---

### M3 — Owner A invites agent

Use Owner A’s session cookie.

```http
POST /api/auth/brokerage-invite
Cookie: <Owner A session>
Content-Type: application/json

{
  "email": "agent-manual@test.propai-os.local",
  "role": "agent"
}
```

**Expect:** `201`

```json
{
  "invitation": {
    "id": "<invitation-uuid>",
    "email": "agent-manual@test.propai-os.local",
    "role": "agent",
    "organizationId": "<org A uuid>",
    "status": "pending"
  }
}
```

Save `invitation.id` as `invitationId` in Postman. Dev console also logs:

`[PropAI invite] ... invitationId=... body={"invitationId":"..."}`

---

### M4 — Agent accepts invitation

**1. Agent sign-up** (no brokerage org — user only)

```http
POST /api/auth/sign-up/email
Content-Type: application/json

{
  "email": "agent-manual@test.propai-os.local",
  "password": "password123",
  "name": "Agent Manual"
}
```

**Expect:** `200` + agent session cookie.

**2. Accept**

```http
POST /api/auth/organization/accept-invitation
Cookie: <Agent session>
Content-Type: application/json

{
  "invitationId": "<invitation-uuid from M3>"
}
```

**Expect:** `200` — response includes `member` with `organizationId` = org A.

**3. Verify session**

```http
GET /api/auth/get-session
Cookie: <Agent session after accept>
```

**Expect:** `session.activeOrganizationId` = org A id.

---

### M5 — Agent lists test-items (tenant A only)

```http
GET /v1/test-items
Cookie: <Agent session>
```

**Expect:** `200` — items include `alpha-only-item` (from M1); must **not** include `beta-only-item`. Every `tenantId` equals org A.

---

### M6 — Unauthorized access

**No cookie**

```http
GET /v1/test-items
```

**Expect:** `401`

```json
{
  "error": "Unauthorized",
  "message": "Authentication required."
}
```

**Wrong password (sign-in)** — optional sanity check:

```http
POST /api/auth/sign-in/email
Content-Type: application/json

{
  "email": "owner-a-manual@test.propai-os.local",
  "password": "wrong-password",
  "rememberMe": true
}
```

**Expect:** `401` from Better Auth (no valid session cookie for protected routes).

---

### Day 11 — Common failure checklist

| Symptom | Likely cause | Fix |
| ------- | ------------- | --- |
| `401` on all `/v1/*` after sign-up | Cookie not sent; Postman cookies disabled | Enable cookies for `localhost:3333` or paste `Cookie` header from `Set-Cookie` |
| Session exists but `403` on `/v1/test-items` | `activeOrganizationId` null | Call sign-up flow that sets active org, or `POST /api/auth/organization/set-active` |
| Auth works in Postman, fails from Next.js | CORS or credentials | API allows `http://localhost:3000` with `credentials: true`; browser must send cookies |
| Invitation email never arrives | Resend not configured | Expected in dev — use `invitation.id` from response or API log (`[PropAI invite]`) |
| `accept-invitation` `403` | Logged-in email ≠ invitation email | Sign up / sign in as the invited address |
| Sign-up `500` / DB errors | Postgres down or migrations missing | `pnpm docker:up` then `pnpm db:migrate` |
| Brokerage sign-up `409` | Email or slug collision | Use new email; change `organizationName` for a new slug |
| Cookies set but session invalid | `BETTER_AUTH_URL` mismatch | Set `BETTER_AUTH_URL=http://localhost:3333` (same host:port as requests) |
| Cross-tenant data in list | RLS or wrong active org | Verify `tenantId` on items; re-run M2 isolation checks |

---

## Day 10 — Reference flows

### 1. Brokerage sign-up (creates user + org + owner + settings)

```http
POST /api/auth/brokerage-sign-up
Content-Type: application/json

{
  "email": "owner@acme-brokerage.test",
  "password": "password123",
  "name": "Jane Owner",
  "organizationName": "Acme Brokerage"
}
```

**Expected:** `201 Created` — `user`, `organization`, `session.activeOrganizationId`; `Set-Cookie` with `better-auth.session_token` (HttpOnly, SameSite=Lax).

| Table | Row |
| ----- | --- |
| `user` | New account |
| `organization` | Slug from name (`acme-brokerage`) |
| `member` | Role `owner` |
| `tenant_settings` | Defaults: `America/New_York`, `USD` |

| Status | Cause |
| ------ | ----- |
| `400` | Validation error |
| `409` | Email or organization slug taken |

---

### 2. Get session

```http
GET /api/auth/get-session
Cookie: <session cookie>
```

**Expected:** `200` — `session.activeOrganizationId` set.

---

### 3. Sign in (email + password)

```http
POST /api/auth/sign-in/email
Content-Type: application/json

{
  "email": "owner@acme-brokerage.test",
  "password": "password123",
  "rememberMe": true
}
```

**Expected:** `200` + `Set-Cookie`.

---

### 4. Protected route (RLS tenant scope)

```http
GET /v1/test-items
Cookie: <session cookie>
```

**Expected:** `200` — `{ "items": [] }` for new org.

Without cookie → `401`. With cookie but no active org → `403`.

---

### 5. Sign out

```http
POST /api/auth/sign-out
Cookie: <session cookie>
```

**Expected:** `200` — session cleared.

---

### 6. Invite member (owner only)

```http
POST /api/auth/brokerage-invite
Cookie: <owner session>
Content-Type: application/json

{
  "email": "agent@acme-brokerage.test",
  "role": "agent"
}
```

**Roles:** `manager` | `agent` | `viewer` (`@propai/shared`; cannot invite `owner`).

**Expected:** `201` — `invitation` with `status: pending`.

| Status | Cause |
| ------ | ----- |
| `401` | No session |
| `403` | Not owner |
| `400` | Invalid email or role |

**Alternative:** `POST /api/auth/organization/invite-member` (same body fields).

---

### 7. Accept invitation

```http
POST /api/auth/organization/accept-invitation
Cookie: <invitee session>
Content-Type: application/json

{
  "invitationId": "<uuid>"
}
```

**Expected:** `200` — `member` created; `activeOrganizationId` = inviting org.

---

## CORS (web dashboard on :3000)

Credentialed origins:

- `http://localhost:3000`
- `http://localhost:3333`

Use **Credentials: Include** in browser clients.

---

## Environment variables

| Variable | Example | Purpose |
| -------- | ------- | ------- |
| `BETTER_AUTH_SECRET` | 32+ char secret | Cookie signing |
| `BETTER_AUTH_URL` | `http://localhost:3333` | Must match API host |
| `DATABASE_URL` | `postgresql://propai:propai@localhost:5432/propai` | Admin DB |
| `DATABASE_APP_URL` | `postgresql://propai_app:...` | RLS app role |

---

## API collections (Postman / Insomnia)

**Postman:** import `docs/api/propai-api.postman_collection.json`.

**Insomnia:** import `docs/api/propai-api.insomnia.json` (Application → Import). Select environment **Local** (`baseUrl` = `http://localhost:3333`). Enable the cookie jar; run folder **Day 17 — Properties** P1 sign-up before protected routes. After P2 create, copy `property.id` into env var `propertyId` for P4–P6.

| Variable | Default |
| -------- | ------- |
| `baseUrl` | `http://localhost:3333` |
| `ownerAEmail` | `owner-a-manual@test.propai-os.local` |
| `ownerBEmail` | `owner-b-manual@test.propai-os.local` |
| `agentEmail` | `agent-manual@test.propai-os.local` |
| `testPassword` | `password123` |
| `invitationId` | Set by M3 invite test script |
| `organizationIdA` | Set by Owner A sign-up script |
| `propertyId` | Set by Day 17 P2 create script |

Run folder **Day 11 — Manual POC** in order (M1 → M6), or **Day 17 — Properties** (P1 → P6) for listings CRUD.

---

## Vitest (automated)

```bash
pnpm test:api
```

| File | Coverage |
| ---- | -------- |
| `auth.integration.test.ts` | Sign-up, sign-in, slug `409` |
| `auth-tenant-isolation.integration.test.ts` | M1/M2 two-org isolation |
| `auth-invitation.integration.test.ts` | M3–M5 invite + accept + `403` non-owner invite |
| `test-items.integration.test.ts` | M6-style `401`, RLS bearer isolation |

Requires `DATABASE_URL` + migrations (local Docker or Neon).
