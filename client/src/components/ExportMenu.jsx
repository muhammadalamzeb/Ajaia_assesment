import { useState, useRef, useEffect } from 'react';

export default function ExportMenu({ onExportMd, onExportPdf }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  return (
    <div className="export-menu" ref={ref}>
      <button type="button" className="secondary" onClick={() => setOpen((o) => !o)}>
        Export ▾
      </button>
      {open && (
        <div className="export-dropdown">
          <button type="button" onClick={() => { onExportMd(); setOpen(false); }}>
            Markdown (.md)
          </button>
          <button type="button" onClick={() => { onExportPdf(); setOpen(false); }}>
            PDF (.pdf)
          </button>
        </div>
      )}
    </div>
  );
}
