## Spectra AI — Developer Guide

Version: 1.0  
Status: Draft  
Last Updated: 2025-08-11  
Audience: Engineering  
References: `docs/PRD.md`, `docs/Software_Design.md`, `docs/Functional_Specs.md`, `docs/SESSION_SECURITY.md`, `README.md`

---

## Purpose

This guide translates the Product Requirements (`docs/PRD.md`) into actionable engineering guidance. It describes architecture, environment setup, coding conventions, module responsibilities, data contracts, security practices, testing strategy, and runbooks so contributors can build, test, and ship features confidently.

---

## Quick Start

### Prerequisites
- Node.js 18+ (recommended 20 LTS)
- npm 9+
- Supabase project (optional for cloud mode)

### Install and run
```bash
npm install
npm run dev

# Build and preview
npm run build
npm run preview
```

Local dev runs at `http://localhost:3000` (see `vite.config.ts`).

### Environment configuration
- If using Supabase cloud features, create `.env.local` with:
```
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```
- App-side configuration is managed by `SupabaseConfigManager`. You can also initialize at runtime:
```ts
import { SupabaseConfigManager } from '@/lib/supabase/config';

SupabaseConfigManager.initializeWithCredentials(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
```
- Storage mode defaults to `local`. Switch to `hybrid` or `supabase` via settings or programmatically:
```ts
SupabaseConfigManager.setStorageMode('hybrid'); // 'local' | 'hybrid' | 'supabase'
```

---

## Architecture Overview

### Frontend stack
- React 18 + TypeScript, Vite, Tailwind CSS, Emotion
- Routing: React Router
- Rendering: PDF.js (`pdfjs-dist`)
- Charts: D3/Recharts

### High-level components
- Viewer: `src/pdf/PdfEngine.tsx`, `src/components/pdf/PDFViewer.tsx`
- Contexts: `src/contexts/*` (analytics, PDF, theme)
- Features/Plugins: `src/features/*` (analytics, snipping, export, library, public viewer, share)
- Data/repositories: `src/lib/repositories/*` (local, supabase, hybrid)
- Storage: `src/lib/storage/PDFStorageManager.ts`
- Supabase: `src/lib/supabase/*`
- Pages/Layout: `src/pages/*`, `src/layout/AppShell.tsx`

### Repository pattern
- Interfaces live in `src/lib/repositories/interfaces.ts`.
- Implementations:
  - Local (IndexedDB): `src/lib/repositories/local/*`
  - Supabase (Postgres/Storage): `src/lib/repositories/supabase/*`
  - Hybrid orchestrator: `src/lib/repositories/HybridRepositoryManager.ts`

### Feature/plugin framework
- Base contracts: `src/features/base/*`
- Plugins register with a central registry and consume contexts (PDF, Analytics). This keeps the viewer core stable while enabling overlays/tools.

---

## Project Layout

Key directories:
- `src/pdf/` — PDF engine, context, types
- `src/components/` — UI components (pdf, dashboard, admin, auth, nav, ui)
- `src/features/` — Feature modules (analytics, library, publicViewer, share, export, snipping, user)
- `src/contexts/` — React contexts (analytics, pdf)
- `src/lib/` — Domain libraries (repositories, storage, supabase, analytics)
- `src/pages/` — Route components
- `src/layout/` — App shell and layout
- `docs/` — Product/design/engineering documentation

---

## Running Modes: Local, Hybrid, Cloud

The app supports three storage/operation modes:
- Local: IndexedDB only (offline-first, dev-friendly)
- Hybrid: IndexedDB + Supabase (reads/writes orchestrated by `HybridRepositoryManager`)
- Supabase: Cloud-only operations

Switch at runtime using `SupabaseConfigManager.setStorageMode()` or dedicated settings UI.

---

## Supabase Integration

### Client initialization
`SupabaseClientManager` reads credentials from `SupabaseConfigManager` and initializes a typed client (`Database` from `database.types.ts`).

```ts
import { SupabaseClientManager } from '@/lib/supabase/client';

const client = SupabaseClientManager.getClient();
```

Health checks and test utilities:
```ts
await SupabaseClientManager.checkHealth();
await SupabaseClientManager.testAuth();
await SupabaseClientManager.testStorage();
```

### Data model (core tables)
See `docs/Software_Design.md` for full schema. Core entities:
- `profiles`: user profile aligned to `auth.users`
- `library_pdfs`: document metadata and storage paths
- `shares`: public share tokens (store `token_hash`, never plaintext secret)
- `analytics_sessions`: session-level metadata
- `analytics_events`: high-volume interaction events

### RLS and RPC
- Enforce RLS on all tables. Public analytics ingestion should go through SECURITY DEFINER RPCs:
```sql
-- Pseudocode (define in Supabase SQL editor/migrations)
create or replace function public_start_session(token text, client_info jsonb)
returns uuid security definer as $$
  -- validate token via token_hash; create session row tied to share/pdf
$$ language sql;

create or replace function public_add_events(session_id uuid, events jsonb)
returns void security definer as $$
  -- insert batched events for existing session
$$ language sql;
```

### Storage conventions
- PDFs: `pdfs/${owner_id}/${pdf_id}.pdf`
- Thumbnails: `thumbnails/${owner_id}/${pdf_id}.jpg`
- Prefer signed URLs or server-side proxy when exposing assets.

---

## Analytics Subsystem

### Event lifecycle
- Session starts on viewer mount or public viewer load
- Heartbeat every 15 seconds while active
- Batching: size/time thresholds (e.g., 50 events or ~2s)
- Offline queueing in IndexedDB; background flush on reconnect

### Event contract
```json
{
  "type": "page_view|click|scroll|zoom|rotate|heartbeat|select",
  "page": 12,
  "x": 512.4,
  "y": 320.1,
  "zoom": 1.5,
  "details": { "deltaY": 120 },
  "ts": "ISO-8601"
}
```

### Emitting events from features
```ts
import { useEnhancedAnalytics } from '@/contexts/EnhancedAnalyticsContext';

const { emitEvent } = useEnhancedAnalytics();
emitEvent({ type: 'click', page: currentPage, x, y, ts: new Date().toISOString() });
```

---

## PDF Viewer and Plugins

### Core responsibilities
- `PdfEngine.tsx`: PDF.js integration, page virtualization, viewport math
- `PDFViewer.tsx`: UI controls (zoom, rotate, thumbnails, navigation) and context wiring

### Adding a plugin
1. Create a feature under `src/features/<your-plugin>/`.
2. Implement the plugin component using base types from `src/features/base/types.ts`.
3. Register it in `src/plugins/index.ts`.

```ts
import { PdfFeatureComponent } from '@/features/base/types';

export const MyOverlay: PdfFeatureComponent = {
  displayName: 'MyOverlay',
  Component: ({ canvasRef, containerRef }) => {
    // draw or overlay using refs and contexts
    return null;
  }
};
```

---

## Library Management

### Upload pipeline
1. DropZone: `src/features/library/components/DropZone.tsx`
2. Validate file → extract metadata → generate thumbnail
3. Persist to IndexedDB
4. Optionally upload to Supabase and store `storage_path`/`thumbnail_path`

### Repository contracts
- `LibraryRepository`: CRUD documents, thumbnails, search
- `ShareRepository`: create/revoke/list shares, resolve token
- `AnalyticsRepository`: start/end sessions, batch events, query reports

---

## Authentication and Access Control

### Auth
- Supabase Auth supports email/password and social (Google/Apple)
- Client config: PKCE flow, persistent session (see `SupabaseClientManager`)

### Guards
- `src/components/auth/AuthGuard.tsx` protects private routes
- Admin-only routes check profile roles/claims

### Logout hygiene
Follow `docs/SESSION_SECURITY.md`:
```ts
await supabase.auth.signOut();
localStorage.clear();
sessionStorage.clear();
// Reset repository mode to local for safety
```

---

## Coding Standards

### TypeScript
- Strict types; no `any` in exported APIs
- Verbose, descriptive names; avoid 1–2 character identifiers

### Lint/format
- ESLint + Prettier (enable in editor/CI). Match project formatting; wrap long lines and avoid unrelated reformatting in edits.

### Commits and branching
- Conventional Commits recommended:
  - `feat:`, `fix:`, `docs:`, `refactor:`, `perf:`, `test:`, `build:`, `chore:`
- Use short, imperative subject and a focused scope

### Control flow and comments
- Use guard clauses; handle edge cases first
- Keep comments for complex intent (the “why”), not obvious “how”

---

## Performance Guidelines

Frontend:
- Virtualize pages; lazy render and memoize canvases
- Debounce zoom/resize handlers; prefer requestAnimationFrame for draw loops
- Avoid heavy React state for high-frequency signals; use refs or throttled emitters

Backend/DB:
- Index `analytics_events(session_id, ts)` and `analytics_sessions(pdf_id)`
- Consider time-based partitioning for high-volume tables in future phases

Build:
- Chunk-split large deps (`pdfjs`, `react-vendor`, charts) per `vite.config.ts`

---

## Security and Privacy

- Enforce RLS on all tables; least-privilege policies
- Store only `token_hash` for share links; never store/share the plaintext secret
- HTTPS only; set CSP and security headers (COOP/COEP already set for PDF.js worker)
- Respect analytics opt-out; minimize PII (no IP storage)
- Keys: Never commit service-role keys; use environment variables. Rotate secrets if exposed.

---

## Testing Strategy

Unit tests (recommend adding):
- Repositories (mock Supabase)
- Analytics batching/flush logic
- PDF utilities (viewport/page math)

Integration tests:
- Public session start via RPC → event insert → RLS checks
- Upload → thumbnail → DB persistence

E2E tests:
- Core viewer flows, share links, analytics capture, admin gating

Quality gates:
- Type-check, lint, unit/integration tests, selected E2E on CI before release

---

## Build, Deploy, and Environments

Environments:
- Local: `.env.local` for Vite vars
- Staging/Prod: separate Supabase projects and storage buckets

Build:
- `npm run build` generates optimized assets with manual chunking

Deploy:
- Any static host (Vercel/Netlify); ensure headers for PDF.js worker:
  - `Cross-Origin-Embedder-Policy: require-corp`
  - `Cross-Origin-Opener-Policy: same-origin`

Database migrations:
- Track SQL for tables, RLS policies, RPCs; apply via Supabase CLI or dashboard

---

## Common Tasks

### Add a new analytics event type
1. Extend the union/type in analytics types
2. Update `AnalyticsEventManager` to accept and batch it
3. Extend repository insert logic (and DB enum/check if applicable)
4. Add charts/reporting mappings where relevant

### Create a share link
1. Use `ShareRepository.createShare(documentId, options)`
2. Redirect recipients to `/s/:token_id/:token_secret` (secret only in URL at session start)
3. Public viewer calls `public_start_session` then batches events

### Add a repository method
1. Extend `interfaces.ts`
2. Implement in local and supabase repositories
3. Wire through `HybridRepositoryManager`
4. Add unit tests for each implementation

---

## Troubleshooting

### PDF.js worker errors (COOP/COEP)
- Ensure headers are set (dev server config already includes them)
- When hosting, configure the same headers at the edge/CDN

### Supabase client not available
- Check `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Confirm `SupabaseConfigManager.isConfigured()` is true

### Analytics not recording
- Verify session starts on viewer mount
- Check batch size/time thresholds and network errors
- For public viewer, ensure RPCs exist and RLS allows inserts via SECURITY DEFINER

### Large PDF memory usage
- Lower prefetch window and thumbnail resolution
- Confirm virtualization is active and canvases are reused

---

## Release Checklist

- Update migrations (tables, RLS, RPC) and apply to target env
- Build passes; type-check and lint clean
- Tests pass (unit/integration/E2E)
- Secrets configured via env, not embedded in code
- Analytics dashboards and reports verified on staging

---

## Roadmap Alignment

The guide implements v1 scope per `docs/PRD.md`. Future items (annotations, full-text search, bookmarks, collaboration, advanced analytics, mobile, enterprise SSO/SAML) should extend the existing repository, plugin, and RPC patterns without breaking current contracts.

---

## Quick Links

- Product requirements: `docs/PRD.md`
- Software design: `docs/Software_Design.md`
- Functional specs: `docs/Functional_Specs.md`
- Session security: `docs/SESSION_SECURITY.md`
- Viewer code: `src/pdf/PdfEngine.tsx`, `src/components/pdf/PDFViewer.tsx`
- Analytics: `src/contexts/EnhancedAnalyticsContext.tsx`, `src/lib/analytics/AnalyticsEventManager.ts`
- Repositories: `src/lib/repositories/*`
- Supabase: `src/lib/supabase/*`


