# Spectra AI — API Documentation (v1)

Status: Draft  
Source: Derived from `docs/PRD.md` and aligned with `docs/Software_Design.md`  
Audience: Frontend, Integrations, and Admin tooling

---

## 1. Overview

Spectra AI exposes a client-first API surface implemented on Supabase services:

- REST (PostgREST) for CRUD over database tables
- RPC (Postgres functions) for secure workflows (e.g., public analytics ingestion)
- Storage API for PDF and thumbnail objects
- Auth API for user authentication (Supabase Auth)

All responses are JSON unless otherwise noted.

---

## 2. Environments and Base URLs

Replace `{SUPABASE_URL}` and `{SUPABASE_ANON_KEY}` with your project values.

- REST (PostgREST): `{SUPABASE_URL}/rest/v1`
- RPC (functions via REST): `{SUPABASE_URL}/rest/v1/rpc/{function_name}`
- Storage: `{SUPABASE_URL}/storage/v1`
- Auth: `{SUPABASE_URL}/auth/v1`
- Edge Functions (optional): `{SUPABASE_URL}/functions/v1/{function_name}`

---

## 3. Authentication

Private endpoints require a valid Supabase session access token.

- Headers (authenticated calls):
  - `Authorization: Bearer <ACCESS_TOKEN>`
  - `apikey: {SUPABASE_ANON_KEY}`
  - `Content-Type: application/json`

Public ingestion endpoints (analytics for shared links) authenticate via a share token in the request body and do not require `Authorization`.

---

## 4. Versioning and Conventions

- Version: v1 (semantic compatibility). PostgREST itself is unversioned; RPC names are versioned by function name.
- Timestamps: ISO-8601 strings (UTC).
- Pagination: PostgREST Range headers (`Range`, `Content-Range`).
- Idempotency: Analytics event ingestion should be tolerant of retries; clients may include sequence numbers where applicable.

---

## 5. Error Model

Error responses follow PostgREST/RPC shape:

```json
{
  "code": "<error_code>",
  "message": "Human readable message",
  "details": null,
  "hint": null
}
```

HTTP status codes:
- 200/201: Success
- 204: No content
- 400: Bad request
- 401: Unauthorized / invalid token
- 403: Forbidden by RLS (Row Level Security)
- 404: Not found
- 409: Conflict
- 429: Rate limited
- 5xx: Server error

---

## 6. Resources and Endpoints

### 6.1 Profiles

Entity (minimal):
- `id: uuid` (auth user id)
- `email: text`
- `display_name: text`
- `created_at: timestamptz`

Read current profile

```
GET {SUPABASE_URL}/rest/v1/profiles?id=eq.{USER_ID}&select=id,email,display_name,created_at
Headers: Authorization, apikey
```

Update profile

```
PATCH {SUPABASE_URL}/rest/v1/profiles?id=eq.{USER_ID}
Headers: Authorization, apikey, Content-Type
Body: { "display_name": "New Name" }
```

Notes: RLS restricts reads/writes to the authenticated user (admins may have broader access).

---

### 6.2 Library PDFs

Entity (core fields):
- `id: uuid`
- `owner_id: uuid`
- `filename: text`
- `size_bytes: bigint`
- `page_count: int`
- `metadata: jsonb`
- `storage_path: text` (Storage object path)
- `thumbnail_path: text`
- `created_at, updated_at: timestamptz`

List PDFs

```
GET {SUPABASE_URL}/rest/v1/library_pdfs?select=id,filename,page_count,created_at&order=created_at.desc
Headers: Authorization, apikey
```

Create PDF metadata (before or after storage upload)

```
POST {SUPABASE_URL}/rest/v1/library_pdfs
Headers: Authorization, apikey, Prefer: return=representation
Body: {
  "filename": "report.pdf",
  "size_bytes": 1234567,
  "page_count": 42,
  "metadata": {"source": "upload"}
}
```

Get one

```
GET {SUPABASE_URL}/rest/v1/library_pdfs?id=eq.{PDF_ID}&select=*
Headers: Authorization, apikey
```

Update

```
PATCH {SUPABASE_URL}/rest/v1/library_pdfs?id=eq.{PDF_ID}
Headers: Authorization, apikey
Body: { "metadata": {"tags": ["q3","finance"]}}
```

Delete

```
DELETE {SUPABASE_URL}/rest/v1/library_pdfs?id=eq.{PDF_ID}
Headers: Authorization, apikey
```

Thumbnails

```
GET {SUPABASE_URL}/rest/v1/library_pdfs?id=eq.{PDF_ID}&select=thumbnail_path
```

Storage upload (object API)

```
POST {SUPABASE_URL}/storage/v1/object/pdfs/{owner_id}/{pdf_id}.pdf
Headers: Authorization, apikey, Content-Type: application/pdf
Body: <binary PDF>
```

Generate a signed URL (time-limited)

```
POST {SUPABASE_URL}/storage/v1/object/sign/pdfs/{owner_id}/{pdf_id}.pdf
Headers: Authorization, apikey, Content-Type: application/json
Body: { "expiresIn": 3600 }
```

Notes:
- Buckets expected: `pdfs` and `thumbnails`. Access is private by default; use signed URLs for sharing within the app.

---

### 6.3 Sharing

Entity (core fields):
- `id: uuid`
- `owner_id: uuid`
- `pdf_id: uuid`
- `token_id: uuid` (public identifier)
- `token_hash: text` (SHA-256 of secret)
- `status: text` in `['active','revoked','expired']`
- `expires_at: timestamptz | null`
- `created_at: timestamptz`

List shares for a PDF

```
GET {SUPABASE_URL}/rest/v1/shares?pdf_id=eq.{PDF_ID}&select=id,token_id,status,expires_at,created_at
Headers: Authorization, apikey
```

Revoke a share

```
PATCH {SUPABASE_URL}/rest/v1/shares?id=eq.{SHARE_ID}
Headers: Authorization, apikey
Body: { "status": "revoked" }
```

Create share (secure token generation)

It is recommended to create shares via an RPC that performs server-side token generation and hashing, returning a `token_id` and a one-time `token_secret`. The exact function name may vary; the following is the reference design.

```
POST {SUPABASE_URL}/rest/v1/rpc/create_share_link
Headers: Authorization, apikey, Content-Type: application/json
Body: { "pdf_id": "{PDF_ID}", "expires_at": "2025-12-31T23:59:59Z" }

Response 200:
{
  "share_id": "{uuid}",
  "token_id": "{uuid}",
  "token_secret": "{opaque-secret}",
  "url": "https://app.example.com/s/{token_id}/{token_secret}"
}
```

Note: If `create_share_link` is not available in your project yet, implement it as a SECURITY DEFINER RPC that: generates `token_id` and `token_secret`, stores only `token_hash = sha256(token_secret)`, and returns the pair plus a convenience URL.

---

### 6.4 Analytics

Two viewer types exist:
- Private viewer (authenticated user): events may be written directly with RLS enforcement.
- Public viewer (shared link recipient): events are written via secure RPC using the share token.

Schema (simplified):
- `analytics_sessions(id uuid, pdf_id uuid, user_id uuid?, share_id uuid?, viewer_type text, started_at, ended_at, duration_ms, user_agent, device jsonb, locale)`
- `analytics_events(id bigserial, session_id uuid, ts timestamptz, type text, page int?, x float?, y float?, zoom float?, details jsonb)`

Event payload example

```json
{
  "type": "page_view | click | scroll | zoom | rotate | heartbeat | select",
  "page": 12,
  "x": 512.4,
  "y": 320.1,
  "zoom": 1.5,
  "details": {"deltaY": 120},
  "ts": "2025-08-11T10:20:30.000Z"
}
```

Public: start session (RPC)

```
POST {SUPABASE_URL}/rest/v1/rpc/public_start_session
Headers: apikey, Content-Type: application/json
Body: {
  "token": "{token_id}:{token_secret}",
  "client_info": {
    "user_agent": "Mozilla/5.0 ...",
    "device": {"type": "desktop"},
    "locale": "en-US"
  }
}

Response 200: { "session_id": "{uuid}" }
```

Public: add events (RPC)

```
POST {SUPABASE_URL}/rest/v1/rpc/public_add_events
Headers: apikey, Content-Type: application/json
Body: {
  "session_id": "{uuid}",
  "events": [ {"type":"page_view","page":1,"ts":"..."}, {"type":"heartbeat","ts":"..."} ]
}
```

Private: end session (RPC)

```
POST {SUPABASE_URL}/rest/v1/rpc/private_end_session
Headers: Authorization, apikey, Content-Type: application/json
Body: { "session_id": "{uuid}", "duration_ms": 123456 }
```

Private: insert events (direct, optional if permitted by RLS)

```
POST {SUPABASE_URL}/rest/v1/analytics_events
Headers: Authorization, apikey, Prefer: return=minimal
Body: [
  {"session_id":"{uuid}","type":"page_view","page":1,"ts":"..."},
  {"session_id":"{uuid}","type":"scroll","details":{"deltaY":120},"ts":"..."}
]
```

Query sessions for a PDF (owner-only)

```
GET {SUPABASE_URL}/rest/v1/analytics_sessions?pdf_id=eq.{PDF_ID}&select=id,started_at,ended_at,duration_ms,viewer_type
Headers: Authorization, apikey
```

Query events by session

```
GET {SUPABASE_URL}/rest/v1/analytics_events?session_id=eq.{SESSION_ID}&select=ts,type,page,x,y,zoom,details
Headers: Authorization, apikey
```

---

### 6.5 Reports (Roadmap)

For long-running, computed reports, use an asynchronous job model.

Proposed schema: `report_jobs(id, owner_id, params jsonb, status, created_at, completed_at)`

Proposed RPC:

```
POST {SUPABASE_URL}/rest/v1/rpc/create_report_job
Body: { "params": { "pdf_id": "{PDF_ID}", "range": {"from":"2025-01-01","to":"2025-01-31"} } }
```

Poll status via `GET /rest/v1/report_jobs?id=eq.{JOB_ID}`.

---

## 7. Rate Limiting

Guidance (tunable per environment):
- Public RPC (`public_start_session`, `public_add_events`): 60 requests/min per IP (burst 120). Batch events to stay within limits.
- Authenticated REST: 120 requests/min per user (burst 240).

Clients should implement exponential backoff on HTTP 429.

---

## 8. Security and Privacy

- RLS: enforced on all tables; public ingestion only via SECURITY DEFINER RPC.
- Tokens: share secrets are never stored in plaintext; only `token_hash` is persisted.
- PII: avoid storing IP addresses; limit device context to non-identifying fields.
- Storage: buckets are private; expose via signed URLs only.

Refer to `docs/SESSION_SECURITY.md` for logout and session-clearing guidance.

---

## 9. SDK Usage (Examples)

Although direct HTTP is supported, most apps should use the Supabase JavaScript SDK.

Authenticate

```ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!)

const { data: { user }, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: '••••••••'
})
```

Call RPC (public session start)

```ts
const { data, error } = await supabase.rpc('public_start_session', {
  token: `${tokenId}:${tokenSecret}`,
  client_info: { user_agent: navigator.userAgent, locale: navigator.language }
})
```

Upload to Storage

```ts
const path = `pdfs/${ownerId}/${pdfId}.pdf`
const { data, error } = await supabase.storage.from('pdfs').upload(path, file, { upsert: true })
```

---

## 10. Changelog

- v1 (Draft): Initial specification aligned to PRD core capabilities: library management, secure sharing, analytics ingestion, and storage.

---

## 11. Glossary

- Share Token: A two-part token composed of `token_id` (public identifier) and `token_secret` (kept only by client). Only the hash of `token_secret` is stored server-side.
- RLS: Row Level Security policies in Postgres, enforced by Supabase.
- RPC: Postgres functions exposed via PostgREST under `/rest/v1/rpc/*`.


