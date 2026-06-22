import { Router } from 'express';
import multer from 'multer';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { getDocumentAccess, saveVersion, replaceTextInTipTap } from '../utils/access.js';
import { textToTipTap, tipTapToMarkdown } from '../utils/markdown.js';
import { markdownToPdfBuffer } from '../utils/pdf.js';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['.txt', '.md', '.markdown'];
    const ext = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf('.'));
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Only .txt and .md files are supported'));
  },
});

const EMPTY_DOC = JSON.stringify({
  type: 'doc',
  content: [{ type: 'paragraph' }],
});

router.use(requireAuth);

router.get('/', (req, res) => {
  const q = (req.query.q || '').trim().toLowerCase();
  const like = q ? `%${q}%` : null;

  const owned = like
    ? db
        .prepare(
          `SELECT d.id, d.title, d.updated_at, d.owner_id, u.name AS owner_name,
                  'owned' AS access_type, 'owner' AS permission
           FROM documents d
           JOIN users u ON u.id = d.owner_id
           WHERE d.owner_id = ? AND LOWER(d.title) LIKE ?
           ORDER BY d.updated_at DESC`
        )
        .all(req.user.id, like)
    : db
        .prepare(
          `SELECT d.id, d.title, d.updated_at, d.owner_id, u.name AS owner_name,
                  'owned' AS access_type, 'owner' AS permission
           FROM documents d
           JOIN users u ON u.id = d.owner_id
           WHERE d.owner_id = ?
           ORDER BY d.updated_at DESC`
        )
        .all(req.user.id);

  const shared = like
    ? db
        .prepare(
          `SELECT d.id, d.title, d.updated_at, d.owner_id, u.name AS owner_name,
                  'shared' AS access_type, ds.permission
           FROM document_shares ds
           JOIN documents d ON d.id = ds.document_id
           JOIN users u ON u.id = d.owner_id
           WHERE ds.user_id = ? AND LOWER(d.title) LIKE ?
           ORDER BY d.updated_at DESC`
        )
        .all(req.user.id, like)
    : db
        .prepare(
          `SELECT d.id, d.title, d.updated_at, d.owner_id, u.name AS owner_name,
                  'shared' AS access_type, ds.permission
           FROM document_shares ds
           JOIN documents d ON d.id = ds.document_id
           JOIN users u ON u.id = d.owner_id
           WHERE ds.user_id = ?
           ORDER BY d.updated_at DESC`
        )
        .all(req.user.id);

  res.json({ owned, shared });
});

router.post('/', (req, res) => {
  const title = (req.body.title || 'Untitled Document').trim().slice(0, 200);
  if (!title) return res.status(400).json({ error: 'Title cannot be empty' });

  const result = db
    .prepare('INSERT INTO documents (title, content, owner_id) VALUES (?, ?, ?)')
    .run(title, EMPTY_DOC, req.user.id);

  const docId = result.lastInsertRowid;
  saveVersion(docId, title, EMPTY_DOC, req.user.id);

  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(docId);
  res.status(201).json({ ...doc, access_type: 'owned', permission: 'owner' });
});

router.post('/import', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const text = req.file.buffer.toString('utf-8');
  const title = req.file.originalname.replace(/\.(txt|md|markdown)$/i, '') || 'Imported Document';
  const content = textToTipTap(text);

  const result = db
    .prepare('INSERT INTO documents (title, content, owner_id) VALUES (?, ?, ?)')
    .run(title.slice(0, 200), content, req.user.id);

  const docId = result.lastInsertRowid;
  saveVersion(docId, title.slice(0, 200), content, req.user.id);

  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(docId);
  res.status(201).json({ ...doc, access_type: 'owned', permission: 'owner' });
});

router.get('/:id', (req, res) => {
  const access = getDocumentAccess(Number(req.params.id), req.user.id);
  if (!access) return res.status(404).json({ error: 'Document not found or access denied' });

  const owner = db.prepare('SELECT name, email FROM users WHERE id = ?').get(access.doc.owner_id);
  const shares = db
    .prepare(
      `SELECT u.id, u.email, u.name, ds.permission
       FROM document_shares ds
       JOIN users u ON u.id = ds.user_id
       WHERE ds.document_id = ?`
    )
    .all(access.doc.id);

  res.json({
    ...access.doc,
    access_type: access.isOwner ? 'owned' : 'shared',
    permission: access.permission,
    owner,
    shares,
  });
});

router.put('/:id', (req, res) => {
  const docId = Number(req.params.id);
  const access = getDocumentAccess(docId, req.user.id);
  if (!access) return res.status(404).json({ error: 'Document not found or access denied' });
  if (!access.canEdit) return res.status(403).json({ error: 'You have view-only access to this document' });

  const { title, content } = req.body;
  const updates = [];
  const params = [];

  if (title !== undefined) {
    const trimmed = String(title).trim().slice(0, 200);
    if (!trimmed) return res.status(400).json({ error: 'Title cannot be empty' });
    updates.push('title = ?');
    params.push(trimmed);
  }

  let parsedContent = null;
  if (content !== undefined) {
    try {
      parsedContent = typeof content === 'string' ? JSON.parse(content) : content;
      if (parsedContent?.type !== 'doc') {
        return res.status(400).json({ error: 'Invalid document content format' });
      }
      updates.push('content = ?');
      params.push(JSON.stringify(parsedContent));
    } catch {
      return res.status(400).json({ error: 'Invalid document content JSON' });
    }
  }

  if (!updates.length) return res.status(400).json({ error: 'No valid fields to update' });

  updates.push("updated_at = datetime('now')");
  params.push(docId);

  db.prepare(`UPDATE documents SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(docId);

  saveVersion(
    docId,
    doc.title,
    doc.content,
    req.user.id
  );

  res.json(doc);
});

router.delete('/:id', (req, res) => {
  const docId = Number(req.params.id);
  const access = getDocumentAccess(docId, req.user.id);
  if (!access?.isOwner) return res.status(403).json({ error: 'Only the owner can delete this document' });

  db.prepare('DELETE FROM documents WHERE id = ?').run(docId);
  res.json({ success: true });
});

router.get('/:id/export', (req, res) => {
  const access = getDocumentAccess(Number(req.params.id), req.user.id);
  if (!access) return res.status(404).json({ error: 'Document not found or access denied' });

  const content = JSON.parse(access.doc.content);
  const markdown = tipTapToMarkdown(content);
  const filename = `${access.doc.title.replace(/[^a-z0-9-_]/gi, '_')}.md`;

  res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(markdown);
});

router.get('/:id/export/pdf', async (req, res) => {
  try {
    const access = getDocumentAccess(Number(req.params.id), req.user.id);
    if (!access) return res.status(404).json({ error: 'Document not found or access denied' });

    const content = JSON.parse(access.doc.content);
    const markdown = tipTapToMarkdown(content);
    const pdf = await markdownToPdfBuffer(access.doc.title, markdown);
    const filename = `${access.doc.title.replace(/[^a-z0-9-_]/gi, '_')}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdf);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'PDF export failed' });
  }
});

router.get('/:id/versions', (req, res) => {
  const access = getDocumentAccess(Number(req.params.id), req.user.id);
  if (!access) return res.status(404).json({ error: 'Document not found or access denied' });

  const versions = db
    .prepare(
      `SELECT v.id, v.title, v.created_at, u.name AS saved_by_name
       FROM document_versions v
       JOIN users u ON u.id = v.saved_by
       WHERE v.document_id = ?
       ORDER BY v.created_at DESC
       LIMIT 20`
    )
    .all(access.doc.id);

  res.json(versions);
});

router.post('/:id/versions/:versionId/restore', (req, res) => {
  const docId = Number(req.params.id);
  const versionId = Number(req.params.versionId);
  const access = getDocumentAccess(docId, req.user.id);
  if (!access) return res.status(404).json({ error: 'Document not found or access denied' });
  if (!access.canEdit) return res.status(403).json({ error: 'You have view-only access to this document' });

  const version = db
    .prepare('SELECT * FROM document_versions WHERE id = ? AND document_id = ?')
    .get(versionId, docId);
  if (!version) return res.status(404).json({ error: 'Version not found' });

  db.prepare(
    "UPDATE documents SET title = ?, content = ?, updated_at = datetime('now') WHERE id = ?"
  ).run(version.title, version.content, docId);

  saveVersion(docId, version.title, version.content, req.user.id);
  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(docId);
  res.json(doc);
});

router.post('/:id/share', (req, res) => {
  const docId = Number(req.params.id);
  const access = getDocumentAccess(docId, req.user.id);
  if (!access?.isOwner) return res.status(403).json({ error: 'Only the owner can share this document' });

  const { email, permission = 'edit' } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });
  if (!['view', 'edit', 'comment'].includes(permission)) {
    return res.status(400).json({ error: 'Permission must be view, comment, or edit' });
  }

  const targetUser = db.prepare('SELECT * FROM users WHERE email = ?').get(email.trim().toLowerCase());
  if (!targetUser) return res.status(404).json({ error: 'User not found' });
  if (targetUser.id === req.user.id) return res.status(400).json({ error: 'Cannot share with yourself' });

  db.prepare(
    `INSERT INTO document_shares (document_id, user_id, permission) VALUES (?, ?, ?)
     ON CONFLICT(document_id, user_id) DO UPDATE SET permission = excluded.permission`
  ).run(docId, targetUser.id, permission);

  res.json({
    id: targetUser.id,
    email: targetUser.email,
    name: targetUser.name,
    permission,
  });
});

router.delete('/:id/share/:userId', (req, res) => {
  const docId = Number(req.params.id);
  const access = getDocumentAccess(docId, req.user.id);
  if (!access?.isOwner) return res.status(403).json({ error: 'Only the owner can revoke access' });

  db.prepare('DELETE FROM document_shares WHERE document_id = ? AND user_id = ?').run(
    docId,
    Number(req.params.userId)
  );
  res.json({ success: true });
});

router.post('/:id/presence', (req, res) => {
  const docId = Number(req.params.id);
  const access = getDocumentAccess(docId, req.user.id);
  if (!access) return res.status(404).json({ error: 'Document not found or access denied' });

  db.prepare(
    `INSERT INTO document_presence (document_id, user_id, last_seen)
     VALUES (?, ?, datetime('now'))
     ON CONFLICT(document_id, user_id) DO UPDATE SET last_seen = datetime('now')`
  ).run(docId, req.user.id);

  res.json({ ok: true });
});

router.get('/:id/presence', (req, res) => {
  const docId = Number(req.params.id);
  const access = getDocumentAccess(docId, req.user.id);
  if (!access) return res.status(404).json({ error: 'Document not found or access denied' });

  const viewers = db
    .prepare(
      `SELECT u.id, u.name, u.email, p.last_seen
       FROM document_presence p
       JOIN users u ON u.id = p.user_id
       WHERE p.document_id = ?
         AND p.user_id != ?
         AND p.last_seen >= datetime('now', '-45 seconds')
       ORDER BY p.last_seen DESC`
    )
    .all(docId, req.user.id);

  res.json(viewers);
});

router.get('/:id/comments', (req, res) => {
  const access = getDocumentAccess(Number(req.params.id), req.user.id);
  if (!access) return res.status(404).json({ error: 'Document not found or access denied' });

  const comments = db
    .prepare(
      `SELECT c.*, u.name AS author_name, u.email AS author_email
       FROM document_comments c
       JOIN users u ON u.id = c.user_id
       WHERE c.document_id = ?
       ORDER BY c.created_at DESC`
    )
    .all(access.doc.id);

  res.json(comments);
});

router.post('/:id/comments', (req, res) => {
  const docId = Number(req.params.id);
  const access = getDocumentAccess(docId, req.user.id);
  if (!access) return res.status(404).json({ error: 'Document not found or access denied' });
  if (!access.canComment) {
    return res.status(403).json({ error: 'You do not have permission to comment on this document' });
  }

  const { type = 'comment', body, quoted_text, suggested_text } = req.body;
  if (!body?.trim()) return res.status(400).json({ error: 'Comment body is required' });
  if (!['comment', 'suggestion'].includes(type)) {
    return res.status(400).json({ error: 'Type must be comment or suggestion' });
  }
  if (type === 'suggestion' && !suggested_text?.trim()) {
    return res.status(400).json({ error: 'Suggested text is required for suggestions' });
  }

  const result = db
    .prepare(
      `INSERT INTO document_comments
       (document_id, user_id, type, body, quoted_text, suggested_text)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(
      docId,
      req.user.id,
      type,
      body.trim().slice(0, 2000),
      quoted_text?.trim().slice(0, 500) || null,
      suggested_text?.trim().slice(0, 2000) || null
    );

  const comment = db
    .prepare(
      `SELECT c.*, u.name AS author_name, u.email AS author_email
       FROM document_comments c
       JOIN users u ON u.id = c.user_id
       WHERE c.id = ?`
    )
    .get(result.lastInsertRowid);

  res.status(201).json(comment);
});

router.patch('/:id/comments/:commentId', (req, res) => {
  const docId = Number(req.params.id);
  const commentId = Number(req.params.commentId);
  const access = getDocumentAccess(docId, req.user.id);
  if (!access) return res.status(404).json({ error: 'Document not found or access denied' });

  const comment = db
    .prepare('SELECT * FROM document_comments WHERE id = ? AND document_id = ?')
    .get(commentId, docId);
  if (!comment) return res.status(404).json({ error: 'Comment not found' });

  const { status } = req.body;
  const allowed = ['open', 'resolved', 'accepted', 'rejected'];
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const isAuthor = comment.user_id === req.user.id;
  const canModerate = access.isOwner;

  if (['accepted', 'rejected'].includes(status) && !canModerate) {
    return res.status(403).json({ error: 'Only the document owner can accept or reject suggestions' });
  }
  if (status === 'resolved' && !isAuthor && !canModerate) {
    return res.status(403).json({ error: 'Not allowed to resolve this comment' });
  }

  if (status === 'accepted' && comment.type === 'suggestion' && access.canEdit) {
    const content = JSON.parse(access.doc.content);
    const updated = replaceTextInTipTap(content, comment.quoted_text, comment.suggested_text);
    const contentStr = JSON.stringify(updated);

    db.prepare(
      "UPDATE documents SET content = ?, updated_at = datetime('now') WHERE id = ?"
    ).run(contentStr, docId);
    saveVersion(docId, access.doc.title, contentStr, req.user.id);
  }

  db.prepare('UPDATE document_comments SET status = ? WHERE id = ?').run(status, commentId);

  const updatedComment = db
    .prepare(
      `SELECT c.*, u.name AS author_name, u.email AS author_email
       FROM document_comments c
       JOIN users u ON u.id = c.user_id
       WHERE c.id = ?`
    )
    .get(commentId);

  res.json(updatedComment);
});

router.delete('/:id/comments/:commentId', (req, res) => {
  const docId = Number(req.params.id);
  const commentId = Number(req.params.commentId);
  const access = getDocumentAccess(docId, req.user.id);
  if (!access) return res.status(404).json({ error: 'Document not found or access denied' });

  const comment = db
    .prepare('SELECT * FROM document_comments WHERE id = ? AND document_id = ?')
    .get(commentId, docId);
  if (!comment) return res.status(404).json({ error: 'Comment not found' });

  if (comment.user_id !== req.user.id && !access.isOwner) {
    return res.status(403).json({ error: 'Not allowed to delete this comment' });
  }

  db.prepare('DELETE FROM document_comments WHERE id = ?').run(commentId);
  res.json({ success: true });
});

router.post('/:id/import', upload.single('file'), (req, res) => {
  const docId = Number(req.params.id);
  const access = getDocumentAccess(docId, req.user.id);
  if (!access) return res.status(404).json({ error: 'Document not found or access denied' });
  if (!access.canEdit) return res.status(403).json({ error: 'You do not have edit access to this document' });
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const text = req.file.buffer.toString('utf-8');
  const content = textToTipTap(text);

  db.prepare("UPDATE documents SET content = ?, updated_at = datetime('now') WHERE id = ?").run(
    content,
    docId
  );

  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(docId);
  saveVersion(docId, doc.title, content, req.user.id);
  res.json(doc);
});

router.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError) return res.status(400).json({ error: err.message });
  if (err) return res.status(400).json({ error: err.message });
});

export default router;
