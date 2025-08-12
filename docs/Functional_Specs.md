## Spectra AI — Functional Specification

**Source**: Derived from `docs/PRD.md` (v1.0, 2024)

## Document Control

- **Version**: 1.0
- **Status**: Draft
- **Audience**: Product, Engineering, Design, QA
- **Purpose**: Translate product requirements into implementable, testable functional behavior for v1.0

## Scope

- **In scope (v1.0)**:
  - **PDF viewing**: Render, navigate, zoom, rotate, thumbnails, responsive layout
  - **Interactive tools**: AI assistant, snipping tool, text selection
  - **Analytics**: Automatic sessions, heartbeat, page/time/interaction tracking, heatmaps, dashboards, exports (JSON, HTML)
  - **Sharing**: Tokenized public share links, public landing page + viewer, public analytics
  - **Library**: Local (IndexedDB) + cloud (Supabase) storage, upload, metadata, thumbnails, search/sort/filter, bulk ops
  - **Auth & profiles**: Supabase auth, social + email/password, profiles, theme, privacy controls
  - **Admin**: User/role management, activity monitoring, system health
  - **Data ops**: Backup/restore, selective backup, migration tooling, validation, rollback
  - **Plugins**: Feature registry, plugin API, hot loading

- **Out of scope (v1.0; roadmap)**:
  - Full-text in-document search, annotations, bookmarks, collaboration (real-time), mobile apps, multi-tenant enterprise features, GraphQL APIs, advanced ML analytics (see PRD Future Roadmap)

## Roles and Permissions

- **Public Viewer**: Anonymous access via valid share token. Read-only viewing + limited AI assistant, analytics tracked under public session.
- **Authenticated User**: Can upload/manage library, view analytics, create share links, use AI/snipping. Can opt out of analytics for personal usage where applicable.
- **Administrator**: All user capabilities + user/role management, system health, backup/migration operations.

Permission model:
- **Admin** can manage users and roles, view all analytics, manage backups/migrations, and revoke share links.
- **User** can manage only their own documents, share links, and see analytics for their documents.
- **Public** can only view via share token with restricted UI and no library access.

## Functional Modules

### Advanced PDF Viewing

- **Rendering**
  - **Requirement**: Render PDFs with PDF.js at quality suitable for zoom 25%–500% and rotation in 90° steps.
  - **Behavior**: Progressive/lazy page rendering; prefetch adjacent pages; throttle reflows during fast scroll.
  - **Acceptance**: A 100-page PDF renders first page < 1s after viewer mount; any page at 100% zoom renders < 300ms after in-viewport.

- **Navigation**
  - **Controls**: Prev/next, jump-to-page input, page thumbnails strip/panel, keyboard shortcuts (↑/↓/PgUp/PgDn, Home/End).
  - **State**: Persist last visited page per document locally.
  - **Acceptance**: Keyboard navigation mirrors UI actions; thumbnail click scrolls to correct page ±1 page tolerance is unacceptable.

- **Zoom & Rotation**
  - **Controls**: Zoom in/out buttons, dropdown for common levels, pinch-to-zoom (touch), rotation left/right.
  - **Constraints**: Zoom clamp 25%–500%; rotation persists during session.

- **Text Selection**
  - **Behavior**: Enable native text selection; copy-to-clipboard. Emit analytics events for selection start/end and character count.

- **Snipping Tool**
  - **Behavior**: Drag rectangle over page → export selected region as PNG with page number metadata.
  - **Options**: Copy to clipboard, download, or send to Export panel (if enabled).

- **AI Assistant**
  - **Behavior**: Chat panel contextualized to current document and (optionally) page/selection.
  - **Constraints**: In public mode, model access is allowed but rate-limited; no document export via AI.
  - **Acceptance**: Answers reference document content; shows page anchors when applicable.

### Comprehensive Analytics

- **Session Lifecycle**
  - **Start**: On viewer mount or public viewer load.
  - **Heartbeat**: Every 15s while active; includes page, scroll position, visibility state.
  - **End**: On unload/route change/inactivity timeout (60s idle) → finalize session with totals.

- **Tracked Events**
  - **session_start/session_end**
  - **page_view/page_leave** with timestamps
  - **time_on_page** aggregated
  - **interaction**: click, scroll, zoom, rotate, keynav, search_query (when implemented)
  - **selection**: char_count, page, snippet hash
  - **heatmap_sample**: throttled mouse positions

- **Privacy**
  - **Opt-out**: User-level preference to disable personal analytics collection (still allows anonymized performance metrics if required for quality).
  - **PII**: Do not collect free-form inputs; hash tokens and mask IP where possible.

- **Exports & Dashboards**
  - **JSON export**: Raw events per session/document time range.
  - **HTML report**: KPIs, charts (views over time, top pages, drop-off, heatmap preview), engagement metrics.
  - **Realtime dashboard**: Document-level live sessions, DAU, active pages, average dwell.

### Secure Document Sharing

- **Share Link**
  - **Create**: Generates cryptographically secure token bound to document id and owner id.
  - **Manage**: List, revoke/disable, regenerate; optional label/notes.
  - **Access**: Public landing → viewer using token; no login required.

- **Public Viewer**
  - **UI**: Minimal controls (navigate, zoom, fit, page thumbnails optional), optional AI panel.
  - **Analytics**: Same session model, tagged as public and attributed to share token.

### Library Management

- **Storage**
  - **Local**: IndexedDB stores document blob, thumbnail(s), metadata; offline-capable.
  - **Cloud**: Supabase for metadata, storage for blobs/thumbnails; optional sync.

- **Upload**
  - **Flow**: Drag-and-drop or file picker → validate (PDF mime/signature) → extract metadata (pages, size) → generate thumbnail → persist local → optional cloud upload.
  - **Progress**: Show per-file progress; resumable where supported.

- **Organize & Find**
  - **Views**: Grid/list with thumbnails.
  - **Search/Filter/Sort**: Name, date, size, page count; ascending/descending.
  - **Bulk Ops**: Multi-select delete/move, bulk cloud sync.

### Authentication & Profiles

- **Auth**
  - **Methods**: Email/password, Google, Apple via Supabase Auth.
  - **Sessions**: Secure session handling with auto-refresh and idle timeout.

- **Profiles & Settings**
  - **Fields**: display_name, email, theme (light/dark/system), analytics_opt_in, locale.
  - **Controls**: Theme switcher; privacy toggles; language framework-ready.

### Administration

- **User Management**
  - **Actions**: Create, edit, disable, delete; assign roles (admin, user).
  - **Audit**: View user activity summary and last access.

- **System Health**
  - **Metrics**: Storage usage, error rate, performance KPIs, repository health.
  - **Ops**: Trigger backups, validate data, run benchmarks.

### Data Management & Migration

- **Backup**
  - **Types**: Full system (metadata + blobs + analytics) and selective by type/date range.
  - **Validation**: Integrity checksums; dry-run restore verification.

- **Migration**
  - **Flows**: Local↔Cloud transfer; progress monitoring; performance benchmark; rollback on failure with safety backup.

### Plugin Architecture

- **Registry**: Central registry where features register overlays/tools/analytics visualizers.
- **Plugin API**: React context contracts for lifecycle, access to current document/page, analytics emitters.
- **Hot Loading**: Enable/disable plugins at runtime without reload.

## UI Specifications

### Library Page

- **Primary components**: Upload area, search/filter/sort bar, grid/list toggle, document cards with thumbnail, name, size, pages, upload date.
- **Actions**: Upload (single/multi), open in viewer, delete, sync to cloud, select multiple.
- **Empty state**: Invitation to drag files; link to sample document.

### PDF Viewer

- **Layout**: Content area with pages; left panel optional thumbnails; right panel for AI/Export.
- **Toolbar**: Back, document title, page indicator, zoom in/out + dropdown, rotate, fit, snip, settings, fullscreen.
- **Keyboard**: Nav keys, +/- for zoom, R for rotate, F for fit, S for snip.
- **Loading**: Skeleton thumbnails, page shimmer; error banner on render failure.

### Public Landing

- **Content**: Doc title, owner, description (if provided), Open button, basic metadata, branding.
- **CTA**: Open in Viewer; optional owner logo.

### Dashboard/Reports

- **KPIs**: Views, unique sessions, avg duration, top pages, drop-off chart, heatmap preview, top documents/questions.
- **Filters**: Date range, document, share link.
- **Export**: HTML/JSON; include branding.

### Admin

- **Sections**: Users, Roles, Activity, System Health, Backups/Migrations.
- **Tables**: Paginated lists with actions and status badges.

### User Settings

- **Controls**: Display name, theme, analytics opt-in, locale; sign-out.

## Data Model (Conceptual)

- **LibraryPDF**
  - **id** (uuid), **owner_id** (uuid), **name** (string), **size_bytes** (int), **page_count** (int), **created_at** (timestamp), **updated_at** (timestamp), **thumbnail_url** (string), **blob_url/storage_key** (string), **metadata** (jsonb)

- **ShareMeta**
  - **id** (uuid), **document_id** (uuid), **owner_id** (uuid), **token** (string, secure), **status** (active|revoked), **created_at**, **revoked_at**, **label** (string)

- **AnalyticsSession**
  - **id** (uuid), **document_id** (uuid), **owner_id** (uuid), **user_id** (nullable), **share_token** (nullable), **started_at**, **ended_at**, **duration_ms** (int), **is_public** (bool), **client** (ua/os), **locale**

- **AnalyticsEvent**
  - **id** (uuid), **session_id** (uuid), **ts** (timestamp), **type** (enum), **page** (int), **payload** (jsonb)

- **UserProfile**
  - **user_id** (uuid), **display_name** (string), **email** (string), **theme** (enum), **analytics_opt_in** (bool), **locale** (string), **created_at**, **updated_at**

## Analytics Event Catalog

- **session_start**: { documentId, startTs, viewport, referrer, isPublic }
- **session_end**: { endTs, durationMs, totalPagesViewed, totalInteractions }
- **page_view**: { page, ts, scrollTop, zoom }
- **page_leave**: { page, ts, dwellMs }
- **time_on_page**: { page, intervalMs }
- **interaction**: { action: click|scroll|zoom|rotate|keynav, value, page, ts }
- **selection**: { page, charCount, snippetHash, ts }
- **heatmap_sample**: { page, x, y, ts, densityBucket }

Constraints:
- Sampling for heatmap at most every 200ms; batch send to reduce network overhead.
- Heartbeat includes active page and cumulative dwell.

## Repository/Service Contracts

- **LibraryRepository**
  - listDocuments(ownerId, query)
  - getDocument(documentId)
  - createDocument(metadata, blob)
  - updateDocument(documentId, patch)
  - deleteDocument(documentId)
  - generateThumbnail(documentId|blob)

- **ShareRepository**
  - createShare(documentId, options)
  - listShares(documentId)
  - revokeShare(shareId)
  - getShareByToken(token)

- **AnalyticsRepository**
  - startSession(context)
  - sendEvents(sessionId, events[])
  - endSession(sessionId, summary)
  - queryReports(filters)

- **BackupManager**
  - createBackup(scope, options)
  - listBackups()
  - restoreBackup(backupId, options)
  - validateBackup(backupId)

## Security and Privacy

- **AuthN/Z**: Supabase Auth; RLS at table level for multi-tenant data access.
- **Share tokens**: Unguessable, revocable; token scope restricted to single document.
- **Data protection**: TLS in transit; encryption at rest; minimal PII in analytics.
- **Privacy controls**: User opt-in/out for analytics; honor DNT if configured.

## Error Handling & States

- **Upload errors**: Invalid file type, corrupted PDF, size limit exceeded → show toast + retry guidance.
- **Viewer errors**: Render failure, missing page resources → inline error with reload.
- **Share errors**: Invalid/expired token → landing with error and contact owner link.
- **Auth errors**: Bad credentials, provider failures → modal with retry.
- **Offline**: Read-only local viewer for documents stored locally; queue analytics/events for later sync.

## Non-Functional Acceptance (from PRD)

- **Performance**: Initial load < 3s; large PDFs render first page < 5s; analytics latency < 100ms; efficient memory usage.
- **Scalability**: 1000+ documents per library; 100+ concurrent public users; high-frequency event processing.
- **Security**: GDPR-aligned; secure auth; RLS; secure share tokens; user privacy controls.
- **Reliability**: 99.9% viewer availability; zero data loss with backups; graceful errors; offline core functionality.
- **Usability**: Responsive design; WCAG 2.1 AA; supported browsers per PRD; clear loading states.
- **Compatibility**: PDF 1.4–2.0; cross-platform; RESTful patterns for integrations.

## Acceptance Tests (sample)

- **AT-Viewer-001**: Open 200-page PDF; first page visible < 1s; thumbnails available while scrolling; no jank > 100ms long frames.
- **AT-Nav-003**: Enter page 57 in jump-to-page; viewer lands on page 57 ±0.
- **AT-Analytics-010**: With default settings, open viewer for 45s; verify 3 heartbeats (15s interval) and session_end with durationMs ~ 45, events persisted.
- **AT-Share-020**: Create share; open token link in incognito; viewer loads with minimal UI; events attributed to token.
- **AT-Library-030**: Upload 3 PDFs via drag & drop; thumbnails generated; search by name filters correctly; delete restores capacity.
- **AT-Admin-040**: Admin disables a user; user cannot log in; audit log shows action.

## Traceability (PRD → Features)

| PRD Epic/Story | Functional Module | Key Acceptance |
|---|---|---|
| Epic 1: Viewing 1.1/1.2 | Advanced PDF Viewing | Rendering, navigation, zoom/rotate, thumbnails |
| Story 1.3 | AI Assistant | Contextual chat, page anchors |
| Epic 2: Analytics | Analytics | Session lifecycle, events, dashboards, exports |
| Epic 3: Sharing | Sharing | Token creation, public viewer, public analytics |
| Epic 4: Library | Library | Upload, organize, search/filter/sort, bulk ops |
| Epic 5: Admin | Admin | User/role mgmt, system health |
| Data Mgmt | Backup/Migration | Full/selective backup, validation, rollback |
| Plugins | Plugin Architecture | Registry, API, hot load |

## Open Questions & Assumptions

- **AI**: Model/RAG details and rate limits to be finalized; assume per-session modest token budget for public.
- **Search**: Full-text search is roadmap; v1 limits to name/metadata search only.
- **Share**: Optional token expiry/limits are not required in v1 but API should be forward-compatible.
- **Heatmaps**: Sampling/bucketing approach may evolve; current spec uses throttled samples and aggregation server-side.

---

This functional spec guides v1.0 implementation aligned with `PRD.md`. Engineering should use this as the basis for user stories, UI designs, and QA test plans.


