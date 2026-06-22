import { useEffect, useState } from 'react';
import { api } from '../api';
import { useToast } from './Toast';

function formatWhen(iso) {
  const d = new Date(iso.includes('T') ? iso : iso + 'Z');
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function VersionPanel({ docId, canEdit, onRestore, onClose }) {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    api
      .getVersions(docId)
      .then(setVersions)
      .catch((err) => addToast(err.message, 'error'))
      .finally(() => setLoading(false));
  }, [docId, addToast]);

  const handleRestore = async (versionId) => {
    if (!canEdit) return;
    if (!confirm('Restore this version? Current content will be replaced.')) return;
    try {
      await api.restoreVersion(docId, versionId);
      addToast('Version restored', 'success');
      onRestore();
      onClose();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  return (
    <div className="side-panel version-panel">
      <div className="side-panel-header">
        <h3>Version history</h3>
        <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
          ✕
        </button>
      </div>
      {loading ? (
        <p className="version-empty">Loading versions…</p>
      ) : versions.length === 0 ? (
        <p className="version-empty">No versions saved yet.</p>
      ) : (
        <ul className="version-list">
          {versions.map((v) => (
            <li key={v.id} className="version-item">
              <div>
                <div className="version-title">{v.title}</div>
                <div className="version-meta">
                  {formatWhen(v.created_at)} · {v.saved_by_name}
                </div>
              </div>
              {canEdit && (
                <button
                  type="button"
                  className="secondary small-btn"
                  onClick={() => handleRestore(v.id)}
                >
                  Restore
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
