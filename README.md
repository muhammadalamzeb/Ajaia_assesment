# Ajaia Docs

A production-quality lightweight collaborative document editor built for the **Ajaia AI-Native Full Stack Developer Assessment**.

## Live Demo

**URL:** https://ajaia-docs-production-f404.up.railway.app/

## What It Does

| Feature | Details |
|---|---|
| **Rich-text editing** | Bold, italic, underline, H1–H3, bullet & numbered lists |
| **Document management** | Create, rename, manual save, search, delete |
| **File import** | `.txt` / `.md` — new doc, into draft, or drag-and-drop |
| **Sharing** | Owner grants **view** or **edit** access by email |
| **Owned vs shared** | Sidebar sections with clear badges |
| **Version history** | Auto-snapshots on save, restore any version |
| **Export** | Download document as Markdown |
| **Persistence** | SQLite + TipTap JSON (formatting survives refresh) |

## Demo Accounts

| Email | Password | Role |
|---|---|---|
| `alice@ajaia.dev` | `password123` | Owner — sample doc pre-shared with Bob |
| `bob@ajaia.dev` | `password123` | Collaborator — sees shared docs |
| `carol@ajaia.dev` | `password123` | Extra user for sharing tests |

## Quick Start (Windows — easiest)

**Double-click `start.bat`** or run:

```bash
npm run setup    # first time only
npm start
```

Open **http://localhost:3001** (not 5173 unless using dev mode)

Login: `alice@ajaia.dev` / `password123`

### Dev mode (hot reload)

```bash
# Stop any old servers first, then:
npm run dev
```

Open **http://localhost:5173**

### Troubleshooting

| Problem | Fix |
|---|---|
| Blank page when opening a document | Fixed — pull latest code and rebuild (`npm run build`) |
| `EADDRINUSE` port 3001 | Close old terminal or run: `netstat -ano \| findstr :3001` then `taskkill /PID <id> /F` |
| API errors / comments not working | Old server was running — restart with `npm start` |
| Login fails | Run `npm run seed` |

## Quick Start

```bash
# 1. Install dependencies
npm run install:all

# 2. Seed demo users + sample document
npm run seed

# 3. Development (API :3001, UI :5173 with hot reload)
npm run dev
```

Open **http://localhost:5173**

### Production (single server)

```bash
npm run build
npm start
# → http://localhost:3001
```

### Docker

```bash
docker compose up --build
# → http://localhost:3001
```

### Tests

```bash
npm test
# 10 tests: API, persistence, markdown, comments
```

## Reviewer Walkthrough (2 min)

1. **Login** as `alice@ajaia.dev` / `password123`
2. **Edit** "Getting Started" — apply bold, headings, lists
3. **Share** with `bob@ajaia.dev` (edit access)
4. **Logout** → login as Bob → doc under "Shared with Me"
5. **Import** `sample-import.md` from repo root
6. **History** → restore a previous version
7. **Export** → download `.md` file

## File Upload

- **Supported:** `.txt`, `.md`, `.markdown` (max 2 MB)
- **Sidebar Import** → creates new document
- **Editor Import** → replaces current content
- **Drag-and-drop** onto sidebar or editor

## Deployment

### Render (free tier)

1. Push to GitHub
2. New Web Service → connect repo (`render.yaml` included)
3. Deploy

**Manual settings:**
- Build: `npm install --prefix server && npm install --prefix client && npm run build --prefix client`
- Start: `npm start --prefix server`

### Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3001` | Server port |
| `JWT_SECRET` | dev secret | **Set in production** |
| `DATABASE_PATH` | `server/data/ajaia-docs.db` | SQLite file path |

## Project Structure

```
ajaia-docs/
├── client/               React + Vite + TipTap
├── server/               Express + SQLite + tests
├── ARCHITECTURE.md       Design decisions
├── AI_WORKFLOW.md        AI tool usage
├── SUBMISSION.md         Deliverables checklist
├── WALKTHROUGH_SCRIPT.md Video recording guide
├── Dockerfile            Container deployment
├── docker-compose.yml    One-command local deploy
└── render.yaml           Render config
```

## Tech Stack

- **Frontend:** React 18, Vite, TipTap, React Router
- **Backend:** Node.js, Express, JWT, bcrypt
- **Database:** SQLite (better-sqlite3)
- **Tests:** Node test runner + Supertest

## Scope Decisions

**Built:** Core editing, sharing, import, version history, export, search, polished UI

**Deferred:** Real-time OT collaboration, `.docx`, commenting, PDF export

See `ARCHITECTURE.md` for full rationale.
