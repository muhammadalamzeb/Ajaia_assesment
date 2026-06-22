import { useState, useEffect } from 'react';
import { api } from '../api';
import { useToast } from './Toast';

export default function ShareModal({ doc, onClose, onUpdated }) {
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState('edit');
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    api.getUsers().then(setUsers).catch(() => {});
  }, []);

  const handleShare = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.shareDocument(doc.id, email, permission);
      setEmail('');
      addToast(`Shared with ${email}`, 'success');
      onUpdated();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickShare = (userEmail) => {
    setEmail(userEmail);
  };

  const handleRevoke = async (userId, name) => {
    try {
      await api.revokeShare(doc.id, userId);
      addToast(`Removed access for ${name}`, 'success');
      onUpdated();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const suggestions = users.filter(
    (u) => u.email !== doc.owner?.email && !doc.shares?.some((s) => s.email === u.email)
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal share-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Share document</h2>
        <p className="modal-subtitle">{doc.title}</p>

        {error && <div className="error-banner">{error}</div>}

        {suggestions.length > 0 && (
          <div className="quick-share">
            <span className="quick-share-label">Quick add:</span>
            {suggestions.map((u) => (
              <button
                key={u.id}
                type="button"
                className="chip"
                onClick={() => handleQuickShare(u.email)}
              >
                {u.name}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleShare}>
          <div className="form-group">
            <label htmlFor="share-email">User email</label>
            <input
              id="share-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="bob@ajaia.dev"
              required
              list="user-suggestions"
            />
            <datalist id="user-suggestions">
              {users.map((u) => (
                <option key={u.id} value={u.email}>
                  {u.name}
                </option>
              ))}
            </datalist>
          </div>
          <div className="form-group">
            <label htmlFor="permission">Permission</label>
            <select id="permission" value={permission} onChange={(e) => setPermission(e.target.value)}>
              <option value="edit">Can edit — full editing access</option>
              <option value="comment">Can comment — suggest changes, no direct editing</option>
              <option value="view">Can view — read-only access</option>
            </select>
          </div>
          <div className="modal-actions">
            <button type="button" className="secondary" onClick={onClose}>
              Close
            </button>
            <button type="submit" disabled={loading}>
              {loading ? 'Sharing…' : 'Share'}
            </button>
          </div>
        </form>

        {doc.shares?.length > 0 && (
          <div className="share-list">
            <strong className="share-list-heading">People with access</strong>
            {doc.shares.map((s) => (
              <div key={s.id} className="share-list-item">
                <div className="share-user">
                  <span className="avatar-sm">{s.name.charAt(0)}</span>
                  <div>
                    <div>{s.name}</div>
                    <div className="share-email">{s.email}</div>
                  </div>
                </div>
                <div className="share-actions">
                  <span className={`perm-badge perm-${s.permission}`}>
                    {s.permission === 'edit' ? 'Edit' : s.permission === 'comment' ? 'Comment' : 'View'}
                  </span>
                  <button
                    type="button"
                    className="secondary small-btn"
                    onClick={() => handleRevoke(s.id, s.name)}
                  >
                    Revoke
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
