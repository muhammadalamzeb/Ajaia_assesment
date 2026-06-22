# AI Workflow Note

**Candidate:** Muhammad Alamzeb  
**Date:** June 22, 2026  
**Project:** Ajaia Docs

## Tools Used

| Tool | Purpose |
|---|---|
| **Cursor IDE** | Primary development environment |
| **Claude (AI agent)** | Scaffolding, implementation, debugging, documentation |
| **Node test runner + Supertest** | Verification |

## Where AI Materially Sped Up Work

1. **Full monorepo scaffold** — Express routes, React components, TipTap config in one session (~45 min saved)
2. **TipTap integration** — Correct StarterKit + Underline + Placeholder setup without deep ProseMirror docs diving
3. **Markdown ↔ TipTap converter** — Server-side import/export logic drafted and iterated
4. **API integration tests** — Supertest suite structure generated, then refined for view-only enforcement
5. **CSS/UI polish** — Layout, login page, editor page styling accelerated
6. **Documentation** — README, architecture, submission docs drafted from implemented code

## What I Changed or Rejected

| AI Suggestion | My Decision |
|---|---|
| Postgres/Supabase | **Rejected** → SQLite for zero-config reviewer setup |
| Session-based auth | **Rejected** → JWT for SPA simplicity |
| Enterprise RBAC | **Rejected** → owner/view/edit is sufficient |
| `.docx` via mammoth | **Rejected** → `.txt`/`.md` with clear UI limits |
| WebSocket collab stub | **Rejected** → version history + manual save instead |
| Generic error banners | **Modified** → toast notification system |
| `scheduleSave` in useEditor onUpdate | **Fixed** → ref-based pattern to avoid stale closure bug |
| View-only not enforced on PUT | **Fixed** → server returns 403 (AI missed this edge case) |
| Public `/users` endpoint | **Fixed** → requires auth, excludes current user |

## How I Verified Correctness

### Automated (10 tests)

```bash
npm test
```

- Markdown parsing: headings, lists, bold/italic
- DB: document creation, sharing, formatting preservation
- API: CRUD, share flow, **view-only edit blocked**, Markdown export

### Manual E2E

- [x] Login → create → format → refresh → persists
- [x] Share Alice → Bob → edit → Alice sees changes
- [x] View-only share → Bob cannot edit (UI + API)
- [x] Import `sample-import.md`
- [x] Version history restore
- [x] Export Markdown download
- [x] Search filters sidebar
- [x] Drag-and-drop file import

### UX Review

- Save status indicator accuracy
- Read-only banner for view permission
- Owned/shared badges in sidebar
- Mobile responsive layout
- Keyboard Ctrl+S save

## Judgment Over Volume

AI was an **accelerator**, not a replacement for engineering judgment:

- I chose the stack, defined scope cuts, caught the view-only security gap
- I rejected over-engineering that would consume the timebox
- Every file was reviewed; AI-generated code was tested before inclusion
- Documentation reflects what was actually built, not aspirational features

## Time Breakdown

| Phase | Time |
|---|---|
| Planning + architecture | 30 min |
| Backend (API, DB, versions, export) | 75 min |
| Frontend (editor, UI polish, features) | 90 min |
| Tests + bug fixes | 30 min |
| Docs + deployment config | 35 min |
| **Total** | **~4.5 hours** |

## Iteration After Initial Build

After the first pass, I invested additional time in:

- Professional UI redesign (login hero, editor page layout, toasts)
- Version history (stretch goal)
- Markdown export (stretch goal)
- Document search
- API integration tests
- View-only permission enforcement fix
- Docker + CI pipeline
- Walkthrough video script

This second pass addressed the gap between "working prototype" and "submission-ready product."
