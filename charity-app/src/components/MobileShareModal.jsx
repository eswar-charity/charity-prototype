import { useState } from 'react';
import { Link, ChevronRight, X } from 'lucide-react';

const CHANNELS = [
  {
    label: 'Messages',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" fill="#34C759" />
      </svg>
    ),
  },
  {
    label: 'Instagram',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="2" y="2" width="20" height="20" rx="5" fill="url(#msm-ig)" />
        <defs>
          <linearGradient id="msm-ig" x1="2" y1="2" x2="22" y2="22">
            <stop stopColor="#F77737" /><stop offset="0.5" stopColor="#E1306C" /><stop offset="1" stopColor="#833AB4" />
          </linearGradient>
        </defs>
        <circle cx="12" cy="12" r="4" stroke="white" strokeWidth="2" />
        <circle cx="17.5" cy="6.5" r="1.2" fill="white" />
      </svg>
    ),
  },
  {
    label: 'WhatsApp',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="#25D366" aria-hidden="true">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
        <path d="M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .104 5.334.101 11.893c0 2.096.549 4.14 1.595 5.945L0 24l6.335-1.652c1.746.943 3.71 1.444 5.71 1.444h.005c6.585 0 11.946-5.336 11.949-11.896 0-3.176-1.24-6.165-3.479-8.447z" fillOpacity="0.1" />
      </svg>
    ),
  },
  {
    label: 'X',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="black" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
];

/**
 * Reusable mobile share bottom sheet — matches the guest ShareSheet's look
 * (channel icons, copy-link row, "More") so every "Share" button in the app
 * opens the same rich popup instead of a bare clipboard-copy toast.
 */
export default function MobileShareModal({ title, subtitle, url, onClose }) {
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 1800);
  };

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).catch(() => {});
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleChannel = (label) => showToast(`Link ready to share on ${label}`);

  return (
    <div className="overlay-bg" onClick={onClose}>
      <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--dark)' }}>Share</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              width: 30, height: 30, borderRadius: '50%',
              background: 'var(--border)', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            }}
          >
            <X size={15} color="var(--dark)" />
          </button>
        </div>

        {(title || subtitle) && (
          <div style={{
            display: 'flex', flexDirection: 'column', gap: 2,
            background: 'var(--primary-soft)', borderRadius: 'var(--radius-md)',
            padding: '10px 14px', marginBottom: 20,
          }}>
            {title && <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--dark)' }}>{title}</p>}
            {subtitle && <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{subtitle}</p>}
          </div>
        )}

        <div className="share-icons" style={{ marginBottom: 20 }}>
          {CHANNELS.map((ch) => (
            <div
              key={ch.label}
              className="share-icon-item"
              role="button"
              tabIndex={0}
              aria-label={`Share on ${ch.label}`}
              onClick={() => handleChannel(ch.label)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleChannel(ch.label);
                }
              }}
            >
              <div className="share-icon-circle" aria-hidden="true">{ch.icon}</div>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500 }}>{ch.label}</span>
            </div>
          ))}
        </div>

        <div className="url-copy-row" style={{ marginBottom: 16 }}>
          <Link size={16} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
          <span style={{ flex: 1, fontSize: 13, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {url.replace(/^https?:\/\//, '')}
          </span>
          <button
            type="button"
            className="btn-ghost"
            style={{ fontSize: 14, color: copied ? 'var(--green)' : 'var(--primary)' }}
            onClick={handleCopy}
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>

        <div
          className="more-row"
          role="button"
          tabIndex={0}
          aria-label="Share to more apps"
          onClick={() => handleChannel('more apps')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleChannel('more apps');
            }
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'var(--border)', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: 16 }} aria-hidden="true">···</span>
            </div>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--dark)' }}>More</span>
          </div>
          <ChevronRight size={18} color="var(--text-light)" />
        </div>

        {toast && (
          <div style={{
            position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)',
            background: 'var(--dark)', color: 'white', padding: '10px 18px',
            borderRadius: 'var(--radius-pill)', fontSize: 13, fontWeight: 600,
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)', zIndex: 10, whiteSpace: 'nowrap',
          }}>{toast}</div>
        )}
      </div>
    </div>
  );
}
