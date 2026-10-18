import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Info } from 'lucide-react';

/** Shows `location.state.notice` (set by a redirect) as a dismissing banner. */
export default function FlashNotice() {
  const location = useLocation();
  const [message, setMessage] = useState('');

  useEffect(() => {
    const notice = location.state?.notice;
    if (!notice) return undefined;
    setMessage(notice);
    const id = setTimeout(() => setMessage(''), 7000);
    return () => clearTimeout(id);
  }, [location.key, location.state?.notice]);

  if (!message) return null;
  return (
    <div
      role="status"
      style={{
        position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 1000,
        display: 'flex', alignItems: 'center', gap: 10, maxWidth: 'min(92vw, 520px)',
        background: '#0A2E52', color: '#fff', padding: '12px 18px', borderRadius: 12,
        fontSize: 14, fontWeight: 600, boxShadow: '0 8px 28px rgba(0,0,0,.28)',
      }}
    >
      <Info size={16} aria-hidden="true" />
      <span>{message}</span>
      <button
        type="button"
        onClick={() => setMessage('')}
        aria-label="Dismiss"
        style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}
      >
        ×
      </button>
    </div>
  );
}
