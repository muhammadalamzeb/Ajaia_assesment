import { useEffect, useState } from 'react';
import { api } from '../api';

export default function PresenceBar({ docId }) {
  const [viewers, setViewers] = useState([]);

  useEffect(() => {
    let active = true;

    const ping = async () => {
      try {
        await api.pingPresence(docId);
        const list = await api.getPresence(docId);
        if (active) setViewers(list);
      } catch {
        /* ignore */
      }
    };

    ping();
    const interval = setInterval(ping, 12000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [docId]);

  if (!viewers.length) return null;

  return (
    <div className="presence-bar" aria-live="polite">
      <span className="presence-dot" title="Live" />
      <span className="presence-label">Viewing now:</span>
      <div className="presence-avatars">
        {viewers.map((v) => (
          <span key={v.id} className="presence-chip" title={v.email}>
            <span className="avatar-xs">{v.name.charAt(0)}</span>
            {v.name.split(' ')[0]}
          </span>
        ))}
      </div>
    </div>
  );
}
