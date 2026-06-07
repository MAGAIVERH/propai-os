# PropAI API — Upload flow (Day 18)

Step-by-step guide to verify presigned property photo upload and download via curl. Binary data goes **directly** to object storage (MinIO or R2) — never through the API.

**Base URL:** `http://localhost:3333`

**Prerequisites:**

- Docker Postgres running (`pnpm docker:up`)
- Migrations applied (`pnpm db:migrate`)
- API server running (`pnpm --filter @propai/api dev`)
- Root `.env` with auth vars (`DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL=http://localhost:3333`)
- Object storage configured — see [object-storage.md](../infra/object-storage.md)

### Local MinIO (recommended for curl)

```bash
docker compose --profile storage up -d
```

Add to `.env`:

```env
S3_ENDPOINT=http://localhost:9000
S3_REGION=us-east-1
S3_BUCKET=propai-uploads
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=minioadmin
```

Restart the API after setting `S3_*`.

---

## Flow overview

1. Sign up / obtain session cookie
2. Create a property (`POST /v1/properties`)
3. Request upload presign (`POST /v1/uploads/presign`)
4. PUT image bytes to `uploadUrl` (direct to storage)
5. Confirm upload (`POST /v1/properties/:id/images/confirm`) — see [upload-confirm.md](./upload-confirm.md)
6. Request download presign (`GET /v1/uploads/presign-download?key=...`)
7. GET image from `downloadUrl` (direct from storage)

---

## 1) Sign up and save session cookie

```bash
curl -s -c cookies.txt -X POST "http://localhost:3333/api/auth/brokerage-sign-up" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "upload-manual@test.propai-os.local",
    "password": "password123",
    "name": "Upload Tester",
    "organizationName": "Upload Test Brokerage"
  }'
```

**Expect:** `201` — response includes `organization.id` and sets session cookie in `cookies.txt`.

Save the organization id for reference:

```bash
# PowerShell — extract org id (optional)
# Or copy organization.id from the JSON response manually
```

---

## 2) Create a property

```bash
curl -s -b cookies.txt -c cookies.txt -X POST "http://localhost:3333/v1/properties" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Photo Upload Test Home",
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
# Example — set PROPERTY_ID manually after step 2
PROPERTY_ID="<property-id-from-response>"
```

---

## 3) Request upload presign

Replace `PROPERTY_ID` and adjust `contentLength` to match your file size in bytes.

```bash
curl -s -b cookies.txt -X POST "http://localhost:3333/v1/uploads/presign" \
  -H "Content-Type: application/json" \
  -d "{
    \"propertyId\": \"$PROPERTY_ID\",
    \"contentType\": \"image/jpeg\",
    \"contentLength\": 12345
  }"
```

**Expect:** `200` — response shape:

```json
{
  "uploadUrl": "http://localhost:9000/propai-uploads/tenant/.../property/.../....jpg?...",
  "key": "tenant/{tenantId}/property/{propertyId}/{uuid}.jpg",
  "expiresAt": "2026-06-05T12:15:00.000Z",
  "headers": {
    "Content-Type": "image/jpeg"
  }
}
```

Save values for the next steps:

```bash
UPLOAD_URL="<uploadUrl from response>"
OBJECT_KEY="<key from response>"
```

---

## 4) PUT image to presigned URL

The `Content-Type` header **must match** the value sent in step 3.

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X PUT "$UPLOAD_URL" \
  -H "Content-Type: image/jpeg" \
  --data-binary @photo.jpg
```

**Expect:** `200` or `204` from MinIO/R2.

---

## 5) Request download presign

```bash
curl -s -b cookies.txt \
  "http://localhost:3333/v1/uploads/presign-download?key=$(python -c "import urllib.parse; print(urllib.parse.quote('$OBJECT_KEY'))")"
```

On PowerShell without Python, URL-encode the key manually or use:

```powershell
$key = "tenant/.../property/.../....jpg"
$encoded = [uri]::EscapeDataString($key)
curl.exe -s -b cookies.txt "http://localhost:3333/v1/uploads/presign-download?key=$encoded"
```

**Expect:** `200`:

```json
{
  "downloadUrl": "http://localhost:9000/propai-uploads/tenant/...?...",
  "expiresAt": "2026-06-05T12:15:00.000Z"
}
```

```bash
DOWNLOAD_URL="<downloadUrl from response>"
```

---

## 6) Download image from storage

```bash
curl -s -o out.jpg "$DOWNLOAD_URL"
```

**Expect:** `out.jpg` is a valid JPEG (same bytes as `photo.jpg`).

Verify (optional):

```bash
# Linux/macOS
file out.jpg

# PowerShell
Get-Item out.jpg | Select-Object Length
```

---

## Error scenarios (manual checks)

| Scenario | Request | Expected |
| -------- | ------- | -------- |
| No cookie | `POST /v1/uploads/presign` without cookie | `401 Unauthorized` |
| Viewer role | Viewer session on presign | `403 Forbidden` |
| Non-image type | `contentType: "application/pdf"` | `400 Bad Request` |
| Oversize | `contentLength` > 10 MB | `400 Bad Request` |
| Cross-tenant key | Tenant B downloads Tenant A's `key` | `404 Object key not found` |
| Storage unset | Any presign with missing `S3_*` | `503 Service Unavailable` |

---

## Notes

- Presigned URLs expire after **900 seconds** (15 min) by default — set `S3_PRESIGN_EXPIRES_SECONDS` to override.
- Upload routes require **`properties:write`** (owner, manager, agent — not viewer).
- After upload, call **confirm** to persist `property_images` — see [upload-confirm.md](./upload-confirm.md).
- CORS is required for browser uploads from the dashboard; curl bypasses CORS.

**Related:** [object-storage.md](../infra/object-storage.md) · [PHASE-2-DAY-18.md](../tasks/PHASE-2-DAY-18.md) · [auth-flow.md](./auth-flow.md)
