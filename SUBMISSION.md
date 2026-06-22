# Submission — Ajaia Docs

**Candidate:** Muhammad Alamzeb  
**Email:** muhammadalamzeb61@gmail.com  
**Date:** June 22, 2026

---

## Links

| Item | URL |
|---|---|
| **Live App** | https://ajaia-docs-production-f404.up.railway.app/ |
| **Google Drive** | _[Paste folder link]_ |
| **Walkthrough Video** | _[Paste in VIDEO_URL.txt]_ |

## Test Credentials

```
alice@ajaia.dev / password123  (owner)
bob@ajaia.dev   / password123  (collaborator)
carol@ajaia.dev / password123  (sharing tests)
```

---

## Deliverables Checklist

| # | Required Item | File / Location | Status |
|---|---|---|---|
| 1 | Source code | Repository root | ✅ |
| 2 | README.md | `/README.md` | ✅ |
| 3 | Architecture note | `/ARCHITECTURE.md` | ✅ |
| 4 | AI workflow note | `/AI_WORKFLOW.md` | ✅ |
| 5 | SUBMISSION.md | This file | ✅ |
| 6 | Walkthrough video URL | `/VIDEO_URL.txt` | ⏳ Record using `WALKTHROUGH_SCRIPT.md` |
| 7 | Live deployment URL | README + here | ⏳ Deploy to Render or Docker |
| 8 | Screenshots (optional) | `/screenshots/` | ⏳ |

---

## Assignment Requirements — Status

### 1. Document Creation and Editing ✅

- [x] Create, rename, edit, save, reopen
- [x] Bold, italic, underline
- [x] Headings (H1, H2, H3)
- [x] Bulleted and numbered lists
- [x] Manual save (Save button + Ctrl+S) with status indicator

### 2. File Upload ✅

- [x] Import `.txt` and `.md` as new document
- [x] Import into existing draft
- [x] Drag-and-drop support
- [x] Supported types stated in UI + README

### 3. Sharing ✅

- [x] Document owner model
- [x] Grant access by email (edit / comment / view)
- [x] Owned vs shared distinction in sidebar
- [x] Revoke access
- [x] View-only enforcement (server + UI)

### 4. Persistence ✅

- [x] SQLite — survives refresh
- [x] TipTap JSON preserves formatting
- [x] Sharing data persisted

### 5. Product and Engineering Quality ✅

- [x] Clear setup instructions (README)
- [x] Deployment config (Render, Docker, CI)
- [x] Validation and error handling
- [x] **10 automated tests** (unit + API integration)
- [x] Architecture note

### 6. AI-Native Workflow ✅

- [x] `AI_WORKFLOW.md` — tools, accelerations, rejections, verification

### Stretch Goals ✅ (All 5)

- [x] **Real-time collaboration indicators** — presence bar with live viewer avatars
- [x] **Commenting / suggestion mode** — comments panel, accept/reject suggestions
- [x] **Document version history** — snapshots on save + restore
- [x] **Export PDF + Markdown** — export dropdown
- [x] **Role-based sharing** — edit / comment / view permissions

---

## Stretch Feature Demo (video)

1. **Presence** — Alice + Bob open same doc → green "Viewing now" bar
2. **Suggestions** — Bob (comment access) posts suggestion → Alice accepts
3. **History** — History panel → restore previous version
4. **Export** — Export ▾ → PDF and Markdown
5. **Roles** — Share Carol with "Can comment" → she can suggest but not edit body

---

## How to Run Locally

```bash
npm run install:all
npm run seed
npm run dev
# → http://localhost:5173
```

Or with Docker:

```bash
docker compose up --build
# → http://localhost:3001
```

Run tests: `npm test`

---

## Sharing Flow Test (60 seconds)

1. Login as **Alice**
2. Open any owned document → **Share** → add `bob@ajaia.dev` with "Can edit"
3. Sign out → Login as **Bob**
4. Document appears under **Shared with Me**
5. Edit content → Sign out → Login as Alice → changes persisted

---

## What's Incomplete

| Item | Status | Notes |
|---|---|---|
| Live deployment URL | Pending | `render.yaml` + `Dockerfile` ready |
| Walkthrough video | Pending | Script in `WALKTHROUGH_SCRIPT.md` |
| `.docx` support | Deferred | `.md`/`.txt` with UI notice |

## Next 2–4 Hours

1. Deploy to Render, verify production URL
2. Record 3–5 min Loom walkthrough (include all 5 stretch demos)
3. `.docx` import via mammoth.js (optional)

---

## File Index

```
ajaia-docs/
├── README.md
├── ARCHITECTURE.md
├── AI_WORKFLOW.md
├── SUBMISSION.md              ← this file
├── WALKTHROUGH_SCRIPT.md
├── VIDEO_URL.txt
├── sample-import.md
├── Dockerfile
├── docker-compose.yml
├── render.yaml
├── .github/workflows/ci.yml
├── client/                    React + TipTap
└── server/                    Express + SQLite + tests
```
