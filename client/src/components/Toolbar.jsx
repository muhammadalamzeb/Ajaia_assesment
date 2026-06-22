export default function Toolbar({ editor }) {
  if (!editor) return null;

  const ToolBtn = ({ label, title, action, isActive, disabled }) => (
    <button
      type="button"
      className={`tool-btn ${isActive ? 'active' : ''}`}
      onClick={action}
      title={title}
      disabled={disabled}
    >
      {label}
    </button>
  );

  const Separator = () => <span className="toolbar-sep" />;

  return (
    <div className="toolbar" role="toolbar" aria-label="Formatting">
      <ToolBtn
        label={<strong>B</strong>}
        title="Bold (Ctrl+B)"
        action={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
      />
      <ToolBtn
        label={<em>I</em>}
        title="Italic (Ctrl+I)"
        action={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
      />
      <ToolBtn
        label={<span style={{ textDecoration: 'underline' }}>U</span>}
        title="Underline (Ctrl+U)"
        action={() => editor.chain().focus().toggleUnderline().run()}
        isActive={editor.isActive('underline')}
      />

      <Separator />

      <ToolBtn
        label="H1"
        title="Heading 1"
        action={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        isActive={editor.isActive('heading', { level: 1 })}
      />
      <ToolBtn
        label="H2"
        title="Heading 2"
        action={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive('heading', { level: 2 })}
      />
      <ToolBtn
        label="H3"
        title="Heading 3"
        action={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        isActive={editor.isActive('heading', { level: 3 })}
      />

      <Separator />

      <ToolBtn
        label="•"
        title="Bullet list"
        action={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive('bulletList')}
      />
      <ToolBtn
        label="1."
        title="Numbered list"
        action={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive('orderedList')}
      />
    </div>
  );
}
