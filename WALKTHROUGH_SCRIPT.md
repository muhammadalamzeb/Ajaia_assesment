# Walkthrough Video Script (3–5 minutes)

**Candidate:** Muhammad Alamzeb  
**App:** Ajaia Docs

---

## 0:00 – Introduction (30 sec)

> "Hi, I'm Muhammad Alamzeb. This is Ajaia Docs — a lightweight collaborative document editor I built for the Ajaia assessment. It covers document creation, rich-text editing, file import, sharing, persistence, version history, and Markdown export. I'll walk through the main flows and explain my key decisions."

---

## 0:30 – Login & Dashboard (30 sec)

1. Open **http://localhost:3001** (or live URL)
2. Show the login page with demo accounts
3. Click **Alice** quick-login → Sign in
4. Point out sidebar: **My Documents** vs **Shared with Me**
5. Show search bar and Import button

---

## 1:00 – Document Editing (60 sec)

1. Open "Getting Started" sample document
2. Demonstrate formatting:
   - **Bold**, *italic*, underline
   - H1, H2 headings
   - Bullet and numbered lists
3. Rename the document title
4. Click **Save** (or Ctrl+S) → show "Saved" status
5. Refresh the page → content persists with formatting

---

## 2:00 – File Import (30 sec)

1. Go back to dashboard
2. Click **Import** → select `sample-import.md`
3. Show converted headings and lists
4. Alternatively: drag-and-drop a .txt file onto the editor

---

## 2:30 – Sharing Flow (60 sec)

1. Open a document as Alice
2. Click **Share** → quick-add **Bob** → permission "Can edit" → Share
3. Sign out → Sign in as **Bob**
4. Show document under **Shared with Me**
5. Edit the document as Bob
6. Sign back in as Alice → changes are persisted
7. (Optional) Share with Carol as "View only" → show read-only banner

---

## 3:30 – All 5 Stretch Features (90 sec)

1. **Presence** — Bob opens same doc → green "Viewing now" bar
2. **Comments** — Bob posts a comment on the document
3. **Suggestions** — Carol (comment access) posts a suggestion → Alice **Accepts**
4. **History** — restore a previous version
5. **Export** — Export ▾ → Markdown and PDF
6. **Roles** — show edit / comment / view in Share modal

---

## 4:15 – Architecture & AI Workflow (45 sec)

> "Stack: React + TipTap frontend, Express + SQLite backend, JWT auth. I chose SQLite for zero-config local setup and TipTap for reliable formatting persistence as JSON."

> "I intentionally skipped real-time OT collaboration and .docx import to prioritize depth in editing, sharing, and version history."

> "AI tools (Cursor + Claude) accelerated scaffolding and TipTap setup. I rejected over-engineered RBAC and Postgres dependencies. I verified with automated API tests and manual E2E flows."

---

## 5:00 – Close (15 sec)

> "The repo includes README, architecture note, AI workflow doc, tests, and Render deployment config. Thanks for reviewing."

---

## Recording Tips

- Use Loom or OBS, 1080p
- Keep browser zoom at 100%
- Have Alice and Bob tabs ready
- Upload as **unlisted** YouTube or Loom
- Paste URL in `VIDEO_URL.txt`
