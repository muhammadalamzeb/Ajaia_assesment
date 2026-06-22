import { useRef, useState } from 'react';

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso.includes('T') ? iso : iso + 'Z');
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function DocSection({ title, docs, activeId, onSelect, onDelete }) {
  if (!docs.length) return null;

  return (
    <>
      <div className="doc-section-title">{title}</div>
      {docs.map((doc) => (
        <div key={doc.id} className={`doc-item-wrap ${activeId === doc.id ? 'active' : ''}`}>
          <button
            type="button"
            className="doc-item"
            onClick={() => onSelect(doc.id)}
          >
            <div className="doc-item-title">{doc.title}</div>
            <div className="doc-item-meta">
              <span className={`badge badge-${doc.access_type}`}>
                {doc.access_type === 'owned' ? 'Owned' : 'Shared'}
              </span>
              <span>{formatDate(doc.updated_at)}</span>
            </div>
          </button>
          {doc.access_type === 'owned' && (
            <button
              type="button"
              className="doc-delete-btn"
              title="Delete document"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(doc);
              }}
            >
              🗑
            </button>
          )}
        </div>
      ))}
    </>
  );
}

export default function DocumentList({
  owned,
  shared,
  activeId,
  loading,
  search,
  onSearchChange,
  onCreate,
  onImport,
  onSelect,
  onDelete,
}) {
  const fileRef = useRef();
  const [dragOver, setDragOver] = useState(false);

  const handleFile = (file) => {
    if (file) onImport(file);
  };

  const handleFileChange = (e) => {
    handleFile(e.target.files?.[0]);
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  const total = owned.length + shared.length;

  return (
    <>
      <div className="sidebar-header">
        <div className="sidebar-actions">
          <button type="button" onClick={onCreate}>
            + New
          </button>
          <button type="button" className="secondary" onClick={() => fileRef.current?.click()}>
            Import
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          className="hidden-input"
          accept=".txt,.md,.markdown"
          onChange={handleFileChange}
        />
        <input
          type="search"
          className="search-input"
          placeholder="Search documents…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="Search documents"
        />
        <p className="sidebar-hint">Supports .txt and .md · max 2 MB</p>
      </div>

      <div
        className={`doc-list ${dragOver ? 'drag-over' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {loading ? (
          <div className="list-loading">
            <div className="spinner sm" />
            <span>Loading…</span>
          </div>
        ) : total === 0 ? (
          <div className="list-empty">
            <p>{search ? 'No documents match your search.' : 'No documents yet.'}</p>
            {!search && <p className="list-empty-hint">Create one or drop a file here.</p>}
          </div>
        ) : (
          <>
            <DocSection
              title={`My Documents (${owned.length})`}
              docs={owned}
              activeId={activeId}
              onSelect={onSelect}
              onDelete={onDelete}
            />
            <DocSection
              title={`Shared with Me (${shared.length})`}
              docs={shared}
              activeId={activeId}
              onSelect={onSelect}
              onDelete={onDelete}
            />
          </>
        )}
      </div>
    </>
  );
}
