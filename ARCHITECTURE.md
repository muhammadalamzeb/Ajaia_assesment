# Architecture Note — Ajaia Docs

**Author:** Muhammad Alamzeb  
**Assessment:** Ajaia AI-Native Full Stack Developer

## System Overview

```
┌──────────────────────────────────────────────────────────────┐
│                        Browser (React)                       │
│  Login · Editor · Share · Comments · History · Export · Presence │
└──────────────────────────┬───────────────────────────────────┘
                           │ REST + JWT
┌──────────────────────────▼───────────────────────────────────┐
│                     Express API (Node.js)                       │
│  Auth · Documents · Share · Comments · Versions · Export · Presence │
└──────────────────────────┬───────────────────────────────────┘
                           │ better-sqlite3
┌──────────────────────────▼───────────────────────────────────┐
│                         SQLite                                │
│  users · documents · document_shares · document_versions     │
│  document_comments · document_presence                       │
└──────────────────────────────────────────────────────────────┘
```

## Design Principles

1. **Depth over breadth** — polish core flows instead of shallow Google Docs clone
2. **Reviewer-friendly** — zero paid services, one-command setup, seeded accounts
3. **Formatting fidelity** — TipTap JSON in SQLite, not HTML strings
4. **Explicit scope cuts** — documented in README and walkthrough

## Key Decisions

### TipTap (ProseMirror) for Rich Text

Stores structured JSON → reliable round-trip through SQLite. Headings, lists, bold/italic/underline with minimal config. Tradeoff: ~500KB bundle (acceptable for editor app).

### SQLite for Persistence

Zero external dependencies for reviewers. WAL mode for concurrent reads. Single-file backup. Production would use Postgres; schema migrates cleanly.

### JWT + Seeded Users

Sharing requires identity. OAuth/signup adds scope without demonstrating more judgment. Three demo accounts let reviewers test sharing in under 60 seconds.

### Manual Save + Version History

Explicit **Save** button and Ctrl+S persist changes. Each save creates a `document_versions` row (capped at 20 per doc).

### Markdown Import/Export

- **Import:** Server-side parser converts `.md`/`.txt` → TipTap JSON (headings, lists, bold/italic)
- **Export:** TipTap JSON → `.md` download
- Product-relevant, testable, no mammoth.js dependency for `.docx`

### Sharing Model

```
Owner ──grants──► document_shares(user_id, permission: edit|comment|view)
```

- **Owner:** full control
- **Edit:** read, write, comment, import, restore versions
- **Comment:** read + comment/suggest (no body edits)
- **View:** read-only (enforced server-side on PUT)

**Bug fixed:** View-only users were previously able to PUT — now returns 403.

## Data Model

```sql
users (id, email, name, password_hash)
documents (id, title, content JSON, owner_id, timestamps)
document_shares (document_id, user_id, permission) UNIQUE(doc, user)
document_versions (document_id, title, content, saved_by, created_at)
document_comments (document_id, user_id, type, body, quoted_text, suggested_text, status)
document_presence (document_id, user_id, last_seen)
```

## API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/login` | — | Login |
| GET | `/api/auth/users` | ✓ | List users (for share picker) |
| GET | `/api/documents?q=` | ✓ | List owned + shared (search) |
| POST | `/api/documents` | ✓ | Create |
| POST | `/api/documents/import` | ✓ | Import file as new doc |
| GET | `/api/documents/:id` | ✓ | Get doc + shares |
| PUT | `/api/documents/:id` | ✓ | Update (edit permission required) |
| DELETE | `/api/documents/:id` | ✓ | Delete (owner only) |
| GET | `/api/documents/:id/export` | ✓ | Download Markdown |
| GET | `/api/documents/:id/export/pdf` | ✓ | Download PDF |
| GET | `/api/documents/:id/comments` | ✓ | List comments/suggestions |
| POST | `/api/documents/:id/comments` | ✓ | Add comment or suggestion |
| PATCH | `/api/documents/:id/comments/:cid` | ✓ | Resolve/accept/reject |
| DELETE | `/api/documents/:id/comments/:cid` | ✓ | Delete comment |
| GET | `/api/documents/:id/presence` | ✓ | Live viewers |
| POST | `/api/documents/:id/presence` | ✓ | Heartbeat |
| GET | `/api/documents/:id/versions` | ✓ | List versions |
| POST | `/api/documents/:id/versions/:vid/restore` | ✓ | Restore version |
| POST | `/api/documents/:id/share` | ✓ | Grant access |
| DELETE | `/api/documents/:id/share/:uid` | ✓ | Revoke |
| POST | `/api/documents/:id/import` | ✓ | Import into existing |

## Frontend Architecture

- **React Router** — `/login`, `/`, `/doc/:id`
- **Toast system** — non-blocking feedback
- **DocumentEditor** — TipTap with ref-based save scheduling (avoids stale closures)
- **Debounced search** — 300ms sidebar filter
- **Keyboard shortcuts** — Ctrl+S save, standard TipTap shortcuts

## Testing Strategy

| Suite | Coverage |
|---|---|
| `markdown.test.js` | Import/export conversion |
| `documents.test.js` | DB persistence + sharing |
| `api.test.js` | HTTP integration: CRUD, share, view-only block, export |
| `comments.test.js` | Suggestion accept + permission hierarchy |

## Deployment

- **Render** — `render.yaml`, single process serves API + static build
- **Docker** — multi-stage build, volume for SQLite persistence
- **CI** — GitHub Actions runs install, test, build

## Security (Assessment Scope)

- bcrypt password hashing
- JWT expiry (7 days)
- Owner-only delete/share
- Edit permission enforced on PUT
- File type + size validation on upload
- Auth required on `/users` endpoint

## Prioritization Matrix

| Priority | Delivered | Deferred |
|---|---|---|
| P0 | Editor, CRUD, persistence, sharing | — |
| P1 | Import, manual save, owned/shared UI | — |
| P1.5 | View-only enforcement, search | — |
| P2 (stretch) | Version history, Markdown export | — |
| P3 | — | Real-time collab, .docx, PDF, comments |

## Next 2–4 Hours

1. WebSocket presence ("Bob is viewing")
2. `.docx` import via mammoth.js
3. PDF export
4. Operational transform for real-time editing
