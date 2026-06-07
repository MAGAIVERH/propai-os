# PropAI API — Upload confirm flow (Day 21)

Step-by-step guide to persist a property photo in `property_images` after presigned upload. Binary data still goes **directly** to object storage — the confirm endpoint only records metadata in PostgreSQL.

**Base URL:** `http://localhost:3333`

**Prerequisites:** Same as [upload-curl.md](./upload-curl.md) (Docker Postgres, migrations, API running, `S3_*` env, optional MinIO).

---

## Flow overview

1. Sign up / obtain session cookie
2. Create a property (`POST /v1/properties`)
3. Request upload presign (`POST /v1/uploads/presign`)
4. PUT image bytes to `uploadUrl` (direct to storage)
5. **Confirm upload** (`POST /v1/properties/:id/images/confirm`) — persists `property_images` row + audit `photo.uploaded`
6. (Optional) Request download presign (`GET /v1/uploads/presign-download?key=...`)

---

## 1) Sign up and save session cookie

```bash
curl -s -c cookies.txt -X POST "http://localhost:3333/api/auth/brokerage-sign-up" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "confirm-manual@test.propai-os.local",
    "password": "password123",
    "name": "Confirm Tester",
    "organizationName": "Confirm Test Brokerage"
  }'
```

**Expect:** `201` — session cookie saved to `cookies.txt`.

---

## 2) Create a property

```bash
curl -s -b cookies.txt -c cookies.txt -X POST "http://localhost:3333/v1/properties" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Photo Confirm Test Home",
    "type": "single_family",
    "priceUsdCents": 45000000,
    "rentOrSale": "sale",
    "bedrooms": 3,
    "bathrooms": "2.5",
    "sqFt": 2100,
    "addressLine1": "123 Main St",
    "city": "Austin",
    "state": "TX",
    "zipCode": "78701"
  }'
```

**Expect:** `201` — copy `property.id` from the response.

```bash
PROPERTY_ID="<property-id-from-response>"
```

---

## 3) Request upload presign

```bash
curl -s -b cookies.txt -X POST "http://localhost:3333/v1/uploads/presign" \
  -H "Content-Type: application/json" \
  -d "{
    \"propertyId\": \"$PROPERTY_ID\",
    \"contentType\": \"image/jpeg\",
    \"contentLength\": 12345
  }"
```

**Expect:** `200` — save `key` and `uploadUrl`.

```bash
UPLOAD_URL="<uploadUrl from response>"
OBJECT_KEY="<key from response>"
```

---

## 4) PUT image to presigned URL

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X PUT "$UPLOAD_URL" \
  -H "Content-Type: image/jpeg" \
  --data-binary @photo.jpg
```

**Expect:** `200` or `204` from MinIO/R2.

---

## 5) Confirm upload (persist DB row)

Replace `PROPERTY_ID` and match `sizeBytes` to your file size. `objectKey` must be the exact `key` from step 3.

```bash
curl -s -b cookies.txt -X POST "http://localhost:3333/v1/properties/$PROPERTY_ID/images/confirm" \
  -H "Content-Type: application/json" \
  -d "{
    \"objectKey\": \"$OBJECT_KEY\",
    \"mimeType\": \"image/jpeg\",
    \"sizeBytes\": 12345,
    \"sortOrder\": 0
  }"
```

**Expect:** `201`:

```json
{
  "image": {
    "id": "uuid",
    "propertyId": "uuid",
    "storageKey": "tenant/{tenantId}/property/{propertyId}/{uuid}.jpg",
    "sortOrder": 0,
    "isPrimary": false,
    "createdAt": "2026-06-07T12:00:00.000Z"
  }
}
```

**Audit:** Owner can list `photo.uploaded` via `GET /v1/audit-logs`.

---

## 6) Verify download still works

```bash
curl -s -b cookies.txt \
  "http://localhost:3333/v1/uploads/presign-download?key=$(python -c "import urllib.parse; print(urllib.parse.quote('$OBJECT_KEY'))")"
```

**Expect:** `200` with `downloadUrl` — same as Day 18 flow.

---

## Error scenarios (manual checks)

| Scenario | Request | Expected |
| -------- | ------- | -------- |
| No cookie | `POST .../images/confirm` without cookie | `401 Unauthorized` |
| Viewer role | Viewer session on confirm | `403 Forbidden` |
| Cross-tenant key | Tenant B confirms Tenant A's `objectKey` | `404 Object key not found` |
| Wrong property in key | Key for property A, route param property B | `400 Invalid object key format` |
| MIME mismatch | `image/png` with `.jpg` key | `400 MIME type does not match...` |
| Agent scope | Agent B confirms Agent A's property | `404 Property not found` |

---

## Notes

- Confirm requires **`properties:write`** (owner, manager, agent — not viewer).
- `objectKey` must match `tenant/{tenantId}/property/{propertyId}/` prefix for the session tenant and route `:id`.
- `sortOrder` is optional (defaults to `0`).
- Gallery UI and property detail images come in Day 25.

**Related:** [upload-curl.md](./upload-curl.md) · [object-storage.md](../infra/object-storage.md) · [PHASE-2-DAY-21.md](../tasks/PHASE-2-DAY-21.md)
