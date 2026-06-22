import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import { useToast } from './Toast';
import DocumentList from './DocumentList';
import DocumentEditor from './DocumentEditor';
import DeleteModal from './DeleteModal';

function initials(name) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function Dashboard({ user, onLogout }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [documents, setDocuments] = useState({ owned: [], shared: [] });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadDocuments = useCallback(
    async (q = search) => {
      try {
        const data = await api.getDocuments(q);
        setDocuments(data);
      } catch (err) {
        addToast(err.message, 'error');
      } finally {
        setLoading(false);
      }
    },
    [search, addToast]
  );

  useEffect(() => {
    const timer = setTimeout(() => loadDocuments(search), 300);
    return () => clearTimeout(timer);
  }, [search, loadDocuments]);

  const handleCreate = async () => {
    try {
      const doc = await api.createDocument('Untitled Document');
      await loadDocuments();
      navigate(`/doc/${doc.id}`);
      addToast('New document created', 'success');
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleImport = async (file) => {
    try {
      const doc = await api.importFile(file);
      await loadDocuments();
      navigate(`/doc/${doc.id}`);
      addToast(`Imported "${file.name}"`, 'success');
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.deleteDocument(deleteTarget.id);
      await loadDocuments();
      if (Number(id) === deleteTarget.id) navigate('/');
      addToast('Document deleted', 'success');
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-brand">
          <span className="brand-icon">📄</span>
          <h1>Ajaia Docs</h1>
        </div>
        <div className="topbar-right">
          <span className="avatar">{initials(user.name)}</span>
          <span className="user-label">{user.name}</span>
          <button type="button" className="secondary" onClick={onLogout}>
            Sign out
          </button>
        </div>
      </header>

      <div className="layout">
        <aside className="sidebar">
          <DocumentList
            owned={documents.owned}
            shared={documents.shared}
            activeId={id ? Number(id) : null}
            loading={loading}
            search={search}
            onSearchChange={setSearch}
            onCreate={handleCreate}
            onImport={handleImport}
            onSelect={(docId) => navigate(`/doc/${docId}`)}
            onDelete={(doc) => setDeleteTarget(doc)}
          />
        </aside>

        <main className="main-content">
          {id ? (
            <DocumentEditor
              key={id}
              docId={Number(id)}
              user={user}
              onUpdated={() => loadDocuments()}
              onError={(msg) => addToast(msg, 'error')}
            />
          ) : (
            <div className="empty-state welcome-state">
              <div className="welcome-card">
                <h2>Welcome, {user.name.split(' ')[0]}</h2>
                <p>
                  Create a new document, import a <code>.md</code> or <code>.txt</code> file, or
                  select an existing document from the sidebar.
                </p>
                <div className="welcome-actions">
                  <button type="button" onClick={handleCreate}>
                    + New document
                  </button>
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => document.getElementById('welcome-import')?.click()}
                  >
                    Import file
                  </button>
                  <input
                    id="welcome-import"
                    type="file"
                    className="hidden-input"
                    accept=".txt,.md,.markdown"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleImport(f);
                      e.target.value = '';
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {deleteTarget && (
        <DeleteModal
          title={deleteTarget.title}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
