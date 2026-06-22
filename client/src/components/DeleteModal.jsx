export default function DeleteModal({ title, onConfirm, onCancel }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Delete document?</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: '0 0 1rem' }}>
          &ldquo;{title}&rdquo; will be permanently deleted. This cannot be undone.
        </p>
        <div className="modal-actions">
          <button type="button" className="secondary" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="danger" onClick={onConfirm}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
