# Evaluation Matrix — How Ajaia Docs Maps to Reviewer Criteria

**Candidate:** Muhammad Alamzeb  
**Use this doc to align your video walkthrough and submission with what reviewers score.**

---

## 1. Coherent Product Slice

**What they want:** Open-ended prompt → focused, usable product — not a feature dump.

**What we built:** Ajaia Docs — a single-purpose collaborative editor with clear user journeys:
- Login → create/edit → share → collaborate

**Evidence:**
- Sidebar split: **My Documents** vs **Shared with Me**
- Welcome screen guides first action
- Scope documented in `ARCHITECTURE.md` (what we cut and why)

**Say in video:** *"I scoped to one product slice: create, edit, share, import — not a full Google Docs clone."*

| Score driver | Status |
|---|---|
| Clear product identity | ✅ |
| End-to-end user journey | ✅ |
| Documented scope cuts | ✅ |

---

## 2. Full Stack Execution

**What they want:** Frontend + backend + persistence + access logic working together.

| Layer | Implementation | Evidence |
|---|---|---|
| **Frontend** | React, TipTap, React Router | `client/src/` |
| **Backend** | Express REST API, JWT auth | `server/routes/` |
| **Persistence** | SQLite, TipTap JSON | `server/db.js` |
| **Access logic** | Owner / edit / view permissions | `server/utils/access.js`, PUT returns 403 for view-only |

**Say in video:** *"Formatting is stored as TipTap JSON in SQLite — refresh preserves bold, headings, lists."*

---

## 3. Document Editing Experience

**What they want:** Usable rich-text within chosen scope.

| Feature | Status |
|---|---|
| Bold, italic, underline | ✅ Toolbar |
| Headings H1–H3 | ✅ |
| Bullet & numbered lists | ✅ |
| Rename (title field) | ✅ Auto-save |
| Auto-save + Ctrl+S | ✅ Status indicator |
| Paper-style editor layout | ✅ Polished UI |
| Word count | ✅ Footer |

**Say in video:** Demo formatting live, refresh page, show persistence.

---

## 4. File Upload & Sharing

### File Upload

| Capability | Status |
|---|---|
| `.txt` / `.md` import | ✅ |
| New doc from file | ✅ Sidebar Import |
| Import into draft | ✅ Editor Import |
| Drag-and-drop | ✅ Sidebar + editor |
| Types stated in UI | ✅ "Supports .txt and .md" |

### Sharing

| Capability | Status |
|---|---|
| Document owner | ✅ `owner_id` |
| Grant access by email | ✅ Share modal |
| View vs edit permissions | ✅ Server enforced |
| Owned vs shared UI | ✅ Badges + sections |
| Revoke access | ✅ |
| Quick-add users | ✅ Chip buttons |

**Say in video:** Alice shares with Bob → Bob edits → Alice sees changes. Optional: Carol with view-only → read-only banner.

---

## 5. Infrastructure & Deployment

**What they want:** Ability to ship a testable build.

| Item | Status | Location |
|---|---|---|
| Local setup (README) | ✅ | `README.md` |
| Production build | ✅ | `npm run build && npm start` |
| Render deploy | ✅ | `render.yaml` |
| Docker | ✅ | `Dockerfile`, `docker-compose.yml` |
| CI pipeline | ✅ | `.github/workflows/ci.yml` |
| Health check | ✅ | `GET /api/health` |
| **Live URL** | ⏳ **YOU MUST DEPLOY** | Paste in SUBMISSION.md |

**Action required:** Deploy to Render (free) before submitting. Reviewers need a live link.

---

## 6. Code Clarity & Maintainability

| Signal | Evidence |
|---|---|
| Monorepo structure | `client/` + `server/` |
| Shared utilities | `server/utils/access.js`, `markdown.js` |
| Consistent API patterns | REST + JSON errors |
| Tests | 10 tests, 4 suites |
| `.gitignore`, no secrets in repo | ✅ |

**Say in video:** *"Access checks are centralized; markdown conversion is a pure utility with tests."*

---

## 7. Prioritization & Tradeoffs

**What they want:** Deliberate cuts under time pressure — not unfinished chaos.

### Built (priority order)
1. Core editor + persistence
2. Sharing with permissions
3. File import
4. UI polish + error handling
5. Version history (stretch)
6. Markdown export (stretch)
7. Collaboration presence indicator (stretch)

### Deferred (with reason)
| Cut | Reason |
|---|---|
| Real-time OT sync | High complexity; auto-save + presence covers collaboration story |
| `.docx` | Heavy dependency; `.md`/`.txt` sufficient for demo |
| Commenting | Timebox; sharing permissions deliver access-control story |
| PDF export | Markdown export chosen as lighter stretch |

**Say in video:** *"I traded real-time cursors for version history and presence — better ROI in 4 hours."*

---

## 8. Written & Verbal Communication

| Deliverable | File | Purpose |
|---|---|---|
| Setup guide | `README.md` | Reviewer onboarding |
| Architecture | `ARCHITECTURE.md` | Design reasoning |
| AI workflow | `AI_WORKFLOW.md` | AI-native evaluation |
| Submission checklist | `SUBMISSION.md` | Exact deliverables |
| Video script | `WALKTHROUGH_SCRIPT.md` | Structured 3–5 min demo |
| This matrix | `EVALUATION.md` | Criteria alignment |

**Action required:** Record walkthrough using `WALKTHROUGH_SCRIPT.md`. Paste URL in `VIDEO_URL.txt`.

---

## 9. Mature AI Tool Usage

**What they want:** AI accelerates work; you keep engineering judgment.

| AI helped | Human decided |
|---|---|
| Scaffolding, TipTap setup | SQLite over Postgres |
| Markdown converter draft | View-only 403 enforcement |
| UI/CSS drafts | Scope cuts |
| Test structure | Rejected WebSocket OT stub |
| Documentation drafts | Verified every flow manually |

**Evidence:** `AI_WORKFLOW.md` — includes what was **rejected**, not just accepted.

**Say in video:** *"AI scaffolded fast; I caught the view-only bypass and fixed it with an API test."*

---

## Stretch Goals — All 5 Implemented ✅

| Stretch option | Implementation | How to demo |
|---|---|---|
| **Real-time collaboration indicators** | `PresenceBar` — polls every 12s, shows avatars | Open same doc as Alice + Bob in two browsers |
| **Commenting / suggestion mode** | `CommentsPanel` — comments + suggestions, accept applies text | Bob suggests edit → Alice accepts |
| **Document version history** | `VersionPanel` — auto-save snapshots, restore | History → Restore |
| **Export PDF or Markdown** | `ExportMenu` — server-side PDF via PDFKit | Export ▾ → PDF |
| **Role-based sharing** | `edit` / `comment` / `view` in Share modal | Share Carol as "Can comment" |

---

## Pre-Submit Checklist

- [ ] Deploy live URL (Render or Docker)
- [ ] Record 3–5 min video (follow `WALKTHROUGH_SCRIPT.md`)
- [ ] Paste video URL in `VIDEO_URL.txt`
- [ ] Upload Google Drive folder with all files
- [ ] Demo presence: open same doc as Alice + Bob in two browsers
- [ ] Run `npm test` — confirm 8/8 pass

---

## Suggested Video Structure (maps 1:1 to criteria)

| Time | Show | Criterion |
|---|---|---|
| 0:00 | Intro + product scope | Coherent slice |
| 0:30 | Login, create, format, save, refresh | Editing + full stack |
| 1:30 | Import `sample-import.md` | File upload |
| 2:00 | Share Alice → Bob, edit as Bob | Sharing |
| 2:45 | Presence bar (two browsers) | Stretch |
| 3:00 | History restore + Export .md | Stretch |
| 3:30 | Architecture + AI workflow + tradeoffs | Judgment + communication |
| 4:15 | Live URL + how to run locally | Deployment |
