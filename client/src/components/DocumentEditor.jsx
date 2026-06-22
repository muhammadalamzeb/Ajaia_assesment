import { useEffect, useState, useCallback, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import { api } from '../api';
import { useToast } from './Toast';
import Toolbar from './Toolbar';
import ShareModal from './ShareModal';
import VersionPanel from './VersionPanel';
import PresenceBar from './PresenceBar';
import CommentsPanel from './CommentsPanel';
import ExportMenu from './ExportMenu';

function countWords(editor) {
  if (!editor) return 0;
  const text = editor.state.doc.textContent.trim();
  return text ? text.split(/\s+/).length : 0;
}

function canEditDoc(permission) {
  return permission === 'owner' || permission === 'edit';
}

export default function DocumentEditor({ docId, user, onUpdated, onError }) {
  const [doc, setDoc] = useState(null);
  const [title, setTitle] = useState('');
  const [saveStatus, setSaveStatus] = useState('saved');
  const [showShare, setShowShare] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [loading, setLoading] = useState(true);
  const [wordCount, setWordCount] = useState(0);
  const [dragOver, setDragOver] = useState(false);

  const fileRef = useRef(null);
  const contentLoaded = useRef(false);
  const titleRef = useRef('');
  const { addToast } = useToast();

  const editorRef = useRef(null);
  const docRef = useRef(null);
  titleRef.current = title;
  docRef.current = doc;

  const saveDocument = useCallback(async () => {
    if (!editorRef.current || !docRef.current) return;
    setSaveStatus('saving');
    try {
      await api.updateDocument(docId, {
        title: titleRef.current,
        content: editorRef.current.getJSON(),
      });
      setSaveStatus('saved');
      onUpdated();
      addToast('Document saved', 'success');
    } catch (err) {
      setSaveStatus('error');
      onError(err.message);
      addToast(err.message, 'error');
    }
  }, [docId, onUpdated, onError, addToast]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      Placeholder.configure({ placeholder: 'Start writing your document…' }),
    ],
    editable: true,
    editorProps: {
      attributes: { class: 'doc-editor-prosemirror' },
    },
    onUpdate: ({ editor: ed }) => {
      if (!contentLoaded.current) return;
      setWordCount(countWords(ed));
      setSaveStatus('unsaved');
    },
    onSelectionUpdate: ({ editor: ed }) => {
      const { from, to } = ed.state.selection;
      if (from !== to) {
        setSelectedText(ed.state.doc.textBetween(from, to, ' '));
      }
    },
  });

  editorRef.current = editor;

  const loadDocument = useCallback(async () => {
    setLoading(true);
    contentLoaded.current = false;
    try {
      const data = await api.getDocument(docId);
      setDoc(data);
      setTitle(data.title);
      titleRef.current = data.title;
      docRef.current = data;

      if (editor) {
        const content =
          typeof data.content === 'string' ? JSON.parse(data.content) : data.content;
        editor.commands.setContent(content);
        editor.setEditable(data.permission === 'owner' || data.permission === 'edit');
        setWordCount(countWords(editor));
        requestAnimationFrame(() => {
          contentLoaded.current = true;
        });
      }
      setSaveStatus('saved');
    } catch (err) {
      onError(err.message);
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [docId, editor, onError, addToast]);

  useEffect(() => {
    loadDocument();
  }, [loadDocument]);

  useEffect(() => {
    if (!editor || !doc || contentLoaded.current) return;
    const content = typeof doc.content === 'string' ? JSON.parse(doc.content) : doc.content;
    editor.commands.setContent(content);
    editor.setEditable(doc.permission === 'owner' || doc.permission === 'edit');
    setWordCount(countWords(editor));
    requestAnimationFrame(() => {
      contentLoaded.current = true;
    });
  }, [doc, editor]);

  useEffect(() => {
    const onKey = (e) => {
      if (!editor || !canEditDoc(doc?.permission)) return;
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveDocument();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [editor, doc, saveDocument]);

  useEffect(() => {
    const onBeforeUnload = (e) => {
      if (saveStatus === 'unsaved') {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [saveStatus]);

  const handleTitleChange = (e) => {
    setTitle(e.target.value);
    titleRef.current = e.target.value;
    setSaveStatus('unsaved');
  };

  const handleImportInto = async (file) => {
    if (!file || !editor) return;
    try {
      const updated = await api.importIntoDocument(docId, file);
      const content =
        typeof updated.content === 'string' ? JSON.parse(updated.content) : updated.content;
      contentLoaded.current = false;
      editor.commands.setContent(content);
      setWordCount(countWords(editor));
      requestAnimationFrame(() => {
        contentLoaded.current = true;
      });
      setSaveStatus('saved');
      onUpdated();
      addToast(`Imported ${file.name}`, 'success');
    } catch (err) {
      onError(err.message);
      addToast(err.message, 'error');
    }
  };

  const handleFileInput = (e) => {
    const file = e.target.files?.[0];
    if (file) handleImportInto(file);
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (doc?.permission === 'view') return;
    const file = e.dataTransfer.files?.[0];
    if (file) handleImportInto(file);
  };

  const handleExportMd = async () => {
    try {
      await api.exportMarkdown(docId, title);
      addToast('Exported as Markdown', 'success');
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleExportPdf = async () => {
    try {
      await api.exportPdf(docId, title);
      addToast('Exported as PDF', 'success');
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  if (loading || !doc) {
    return (
      <div className="empty-state">
        <div className="spinner" />
        <p>Loading document…</p>
      </div>
    );
  }

  const isOwner = doc.permission === 'owner';
  const canEdit = doc.permission === 'owner' || doc.permission === 'edit';
  const canComment = canEdit || doc.permission === 'comment';
  const isViewOnly = doc.permission === 'view';
  const isCommentOnly = doc.permission === 'comment';

  const permissionLabel = {
    owner: 'Owned by you',
    edit: 'Shared · Can edit',
    comment: 'Shared · Can comment',
    view: 'Shared · View only',
  }[doc.permission] || doc.permission;

  return (
    <>
      <div className="editor-header">
        <div className="editor-header-left">
          <input
            className="title-input"
            value={title}
            onChange={handleTitleChange}
            disabled={!canEdit}
            placeholder="Untitled document"
            aria-label="Document title"
          />
          <div className="doc-meta-row">
            {isOwner ? (
              <span className="badge badge-owned">Owned by you</span>
            ) : (
              <span className="badge badge-shared">{permissionLabel}</span>
            )}
            {!isOwner && (
              <span className="doc-owner-label">Owner: {doc.owner?.name}</span>
            )}
          </div>
        </div>

        <div className="editor-actions">
          <span className={`save-status status-${saveStatus}`}>
            {saveStatus === 'saving' && '● Saving…'}
            {saveStatus === 'saved' && '✓ Saved'}
            {saveStatus === 'unsaved' && '○ Unsaved changes'}
            {saveStatus === 'error' && '✕ Save failed'}
          </span>

          {canEdit && (
            <button
              type="button"
              onClick={saveDocument}
              disabled={saveStatus === 'saving'}
              title="Save (Ctrl+S)"
            >
              Save
            </button>
          )}

          <ExportMenu onExportMd={handleExportMd} onExportPdf={handleExportPdf} />

          <button
            type="button"
            className={`secondary ${showComments ? 'active-panel-btn' : ''}`}
            onClick={() => {
              setShowComments(true);
              setShowVersions(false);
            }}
            title="Comments and suggestions"
          >
            Comments
          </button>

          <button
            type="button"
            className={`secondary ${showVersions ? 'active-panel-btn' : ''}`}
            onClick={() => {
              setShowVersions(true);
              setShowComments(false);
            }}
            title="Version history"
          >
            History
          </button>

          {canEdit && (
            <button
              type="button"
              className="secondary"
              onClick={() => fileRef.current?.click()}
            >
              Import
            </button>
          )}

          {isOwner && (
            <button type="button" onClick={() => setShowShare(true)}>
              Share
            </button>
          )}
        </div>

        <input
          ref={fileRef}
          type="file"
          className="hidden-input"
          accept=".txt,.md,.markdown"
          onChange={handleFileInput}
        />
      </div>

      {canEdit && <Toolbar editor={editor} />}

      <PresenceBar docId={docId} />

      {isViewOnly && (
        <div className="readonly-banner">
          View-only access — you cannot edit or comment. Contact {doc.owner?.name} for access.
        </div>
      )}

      {isCommentOnly && (
        <div className="comment-mode-banner">
          Suggestion mode — you can comment and propose edits, but cannot change the document directly.
        </div>
      )}

      <div
        className={`editor-drop-zone ${dragOver ? 'drag-over' : ''}`}
        onDragOver={(e) => {
          if (!canEdit) return;
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <div className="editor-page">
          <EditorContent editor={editor} />
        </div>
        {dragOver && canEdit && (
          <div className="drop-overlay">Drop .txt or .md file to import</div>
        )}
      </div>

      <footer className="editor-footer">
        <span>{wordCount} words</span>
        <span>Press Save or Ctrl+S to save changes</span>
      </footer>

      {showShare && (
        <ShareModal doc={doc} onClose={() => setShowShare(false)} onUpdated={loadDocument} />
      )}

      {showVersions && (
        <VersionPanel
          docId={docId}
          canEdit={canEdit}
          onRestore={loadDocument}
          onClose={() => setShowVersions(false)}
        />
      )}

      {showComments && (
        <CommentsPanel
          docId={docId}
          user={user}
          isOwner={isOwner}
          canComment={canComment}
          selectedText={selectedText}
          onClose={() => setShowComments(false)}
          onSuggestionAccepted={loadDocument}
        />
      )}
    </>
  );
}
