import db from '../db.js';

const EDIT_PERMISSIONS = new Set(['edit']);
const COMMENT_PERMISSIONS = new Set(['edit', 'comment']);

export function getDocumentAccess(docId, userId) {
  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(docId);
  if (!doc) return null;

  const isOwner = doc.owner_id === userId;
  const share = db
    .prepare('SELECT permission FROM document_shares WHERE document_id = ? AND user_id = ?')
    .get(docId, userId);

  if (!isOwner && !share) return null;

  const permission = isOwner ? 'owner' : share.permission;

  return {
    doc,
    isOwner,
    permission,
    canEdit: isOwner || EDIT_PERMISSIONS.has(share?.permission),
    canComment: isOwner || COMMENT_PERMISSIONS.has(share?.permission),
  };
}

export function saveVersion(docId, title, content, userId) {
  db.prepare(
    `INSERT INTO document_versions (document_id, title, content, saved_by)
     VALUES (?, ?, ?, ?)`
  ).run(docId, title, typeof content === 'string' ? content : JSON.stringify(content), userId);

  const keep = db
    .prepare(
      `SELECT id FROM document_versions WHERE document_id = ?
       ORDER BY created_at DESC LIMIT -1 OFFSET 20`
    )
    .all(docId);

  if (keep.length) {
    const ids = keep.map((r) => r.id).join(',');
    db.prepare(`DELETE FROM document_versions WHERE id IN (${ids})`).run();
  }
}

export function replaceTextInTipTap(docJson, quotedText, suggestedText) {
  if (!quotedText?.trim()) return docJson;

  let replaced = false;

  function walk(nodes) {
    return nodes.map((node) => {
      if (node.type === 'text' && node.text?.includes(quotedText)) {
        replaced = true;
        return { ...node, text: node.text.replace(quotedText, suggestedText) };
      }
      if (node.content) {
        return { ...node, content: walk(node.content) };
      }
      return node;
    });
  }

  const updated = {
    ...docJson,
    content: walk(docJson.content || []),
  };

  return replaced ? updated : docJson;
}
