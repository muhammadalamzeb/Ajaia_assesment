import { useEffect, useState } from 'react';
import { api } from '../api';
import { useToast } from './Toast';

function formatWhen(iso) {
  const d = new Date(iso.includes('T') ? iso : iso + 'Z');
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const STATUS_LABELS = {
  open: 'Open',
  resolved: 'Resolved',
  accepted: 'Accepted',
  rejected: 'Rejected',
};

export default function CommentsPanel({
  docId,
  user,
  isOwner,
  canComment,
  selectedText,
  onClose,
  onSuggestionAccepted,
}) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('comment');
  const [body, setBody] = useState('');
  const [quotedText, setQuotedText] = useState(selectedText || '');
  const [suggestedText, setSuggestedText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { addToast } = useToast();

  const load = async () => {
    try {
      const data = await api.getComments(docId);
      setComments(data);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [docId]);

  useEffect(() => {
    if (selectedText) setQuotedText(selectedText);
  }, [selectedText]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canComment) return;
    setSubmitting(true);
    try {
      await api.addComment(docId, {
        type: mode,
        body,
        quoted_text: mode === 'suggestion' ? quotedText : undefined,
        suggested_text: mode === 'suggestion' ? suggestedText : undefined,
      });
      setBody('');
      setSuggestedText('');
      addToast(mode === 'suggestion' ? 'Suggestion added' : 'Comment added', 'success');
      await load();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatus = async (commentId, status) => {
    try {
      await api.updateCommentStatus(docId, commentId, status);
      addToast(`Marked as ${STATUS_LABELS[status]}`, 'success');
      if (status === 'accepted') onSuggestionAccepted?.();
      await load();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleDelete = async (commentId) => {
    if (!confirm('Delete this comment?')) return;
    try {
      await api.deleteComment(docId, commentId);
      addToast('Comment deleted', 'success');
      await load();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const openCount = comments.filter((c) => c.status === 'open').length;

  return (
    <div className="side-panel comments-panel">
      <div className="side-panel-header">
        <h3>Comments & suggestions {openCount > 0 && <span className="count-badge">{openCount}</span>}</h3>
        <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
          ✕
        </button>
      </div>

      {canComment && (
        <form className="comment-form" onSubmit={handleSubmit}>
          <div className="comment-mode-tabs">
            <button
              type="button"
              className={mode === 'comment' ? 'active' : ''}
              onClick={() => setMode('comment')}
            >
              Comment
            </button>
            <button
              type="button"
              className={mode === 'suggestion' ? 'active' : ''}
              onClick={() => setMode('suggestion')}
            >
              Suggestion
            </button>
          </div>

          {mode === 'suggestion' && (
            <>
              <label className="field-label">Original text</label>
              <textarea
                value={quotedText}
                onChange={(e) => setQuotedText(e.target.value)}
                placeholder="Highlight text in the editor or paste the original phrase"
                rows={2}
              />
              <label className="field-label">Suggested replacement</label>
              <textarea
                value={suggestedText}
                onChange={(e) => setSuggestedText(e.target.value)}
                placeholder="Your suggested wording"
                rows={2}
                required
              />
            </>
          )}

          <label className="field-label">{mode === 'suggestion' ? 'Note (optional)' : 'Comment'}</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={mode === 'suggestion' ? 'Why this change?' : 'Add your comment…'}
            rows={3}
            required
          />
          <button type="submit" disabled={submitting} className="full-width-btn">
            {submitting ? 'Posting…' : mode === 'suggestion' ? 'Post suggestion' : 'Post comment'}
          </button>
        </form>
      )}

      <div className="comments-list">
        {loading ? (
          <p className="panel-empty">Loading…</p>
        ) : comments.length === 0 ? (
          <p className="panel-empty">No comments yet. Start the conversation.</p>
        ) : (
          comments.map((c) => (
            <article key={c.id} className={`comment-card comment-${c.type} status-${c.status}`}>
              <header className="comment-header">
                <span className="avatar-sm">{c.author_name.charAt(0)}</span>
                <div>
                  <strong>{c.author_name}</strong>
                  <span className="comment-time">{formatWhen(c.created_at)}</span>
                </div>
                <span className={`comment-type-badge ${c.type}`}>
                  {c.type === 'suggestion' ? 'Suggestion' : 'Comment'}
                </span>
              </header>

              {c.quoted_text && (
                <blockquote className="comment-quote">
                  <span className="quote-label">Original</span>
                  {c.quoted_text}
                </blockquote>
              )}
              {c.suggested_text && (
                <div className="comment-suggestion">
                  <span className="quote-label">Suggest</span>
                  {c.suggested_text}
                </div>
              )}
              <p className="comment-body">{c.body}</p>

              <footer className="comment-footer">
                <span className={`status-pill status-${c.status}`}>{STATUS_LABELS[c.status]}</span>
                <div className="comment-actions">
                  {isOwner && c.type === 'suggestion' && c.status === 'open' && (
                    <>
                      <button
                        type="button"
                        className="small-btn accept-btn"
                        onClick={() => handleStatus(c.id, 'accepted')}
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        className="small-btn secondary"
                        onClick={() => handleStatus(c.id, 'rejected')}
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {c.status === 'open' && (c.user_id === user.id || isOwner) && (
                    <button
                      type="button"
                      className="small-btn secondary"
                      onClick={() => handleStatus(c.id, 'resolved')}
                    >
                      Resolve
                    </button>
                  )}
                  {(c.user_id === user.id || isOwner) && (
                    <button
                      type="button"
                      className="small-btn danger-text"
                      onClick={() => handleDelete(c.id)}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </footer>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
