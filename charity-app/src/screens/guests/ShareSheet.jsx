import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link, ChevronRight, X } from 'lucide-react';

const CHANNELS = [
  {
    label: 'Messages',
    color: '#34C759',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
          fill="#34C759" />
      </svg>
    ),
  },
  {
    label: 'Instagram',
    color: '#E1306C',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect x="2" y="2" width="20" height="20" rx="5" fill="url(#ig)" />
        <defs>
          <linearGradient id="ig" x1="2" y1="2" x2="22" y2="22">
            <stop stopColor="#F77737" /><stop offset="0.5" stopColor="#E1306C" /><stop offset="1" stopColor="#833AB4" />
          </linearGradient>
        </defs>
        <circle cx="12" cy="12" r="4" stroke="white" strokeWidth="2" />
        <circle cx="17.5" cy="6.5" r="1.2" fill="white" />
      </svg>
    ),
  },
  {
    label: 'X',
    color: '#000000',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="black">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    label: 'WhatsApp',
    color: '#25D366',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="#25D366">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
        <path d="M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .104 5.334.101 11.893c0 2.096.549 4.14 1.595 5.945L0 24l6.335-1.652c1.746.943 3.71 1.444 5.71 1.444h.005c6.585 0 11.946-5.336 11.949-11.896 0-3.176-1.24-6.165-3.479-8.447z" fillOpacity="0.1" />
      </svg>
    ),
  },
];

export default function ShareSheet() {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="phone-shell">
      {/* Blurred background approximation */}
      <div style={{
        flex: 1,
        background: 'linear-gradient(160deg,#FF8C42 0%,#F5604A 30%,#2C4B6E 65%,#1A2F48 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Frosted glass tint */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(0,0,0,0.38)',
          backdropFilter: 'blur(2px)',
        }} />

        {/* Close tap area */}
        <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => navigate(-1)} />

        {/* Sheet */}
        <div className="bottom-sheet" style={{ position: 'relative', zIndex: 2 }}>
          <div className="sheet-handle" />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--dark)' }}>Share this event</h2>
            <button
              onClick={() => navigate(-1)}
              style={{
                width: 30, height: 30, borderRadius: '50%',
                background: 'var(--border)', border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              }}
            >
              <X size={15} color="var(--dark)" />
            </button>
          </div>

          {/* Event preview row */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            background: 'var(--primary-soft)', borderRadius: 'var(--radius-md)',
            padding: '10px 14px', marginBottom: 20,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 8, flexShrink: 0,
              background: 'linear-gradient(160deg,#FF8C42,#F5604A)',
            }} />
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--dark)' }}>Ocean Coastal Restoration</p>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                Ocean Conservancy · verified{' '}
                <span style={{
                  display: 'inline-flex', width: 12, height: 12, borderRadius: '50%',
                  background: 'var(--blue)', color: 'white', fontSize: 8,
                  alignItems: 'center', justifyContent: 'center', verticalAlign: 'middle',
                }}>✓</span>
              </p>
            </div>
          </div>

          {/* Share channels */}
          <div className="share-icons" style={{ marginBottom: 20 }}>
            {CHANNELS.map((ch) => (
              <div key={ch.label} className="share-icon-item">
                <div className="share-icon-circle">
                  {ch.icon}
                </div>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500 }}>
                  {ch.label}
                </span>
              </div>
            ))}
          </div>

          {/* URL copy row */}
          <div className="url-copy-row" style={{ marginBottom: 16 }}>
            <Link size={16} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
            <span style={{
              flex: 1, fontSize: 13, color: 'var(--text-secondary)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              charity.hub/event/coastal-clea...
            </span>
            <button
              className="btn-ghost"
              style={{ fontSize: 14, color: copied ? 'var(--green)' : 'var(--primary)' }}
              onClick={handleCopy}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>

          <div className="more-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'var(--border)', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: 16 }}>···</span>
              </div>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--dark)' }}>More</span>
            </div>
            <ChevronRight size={18} color="var(--text-light)" />
          </div>
        </div>
      </div>
    </div>
  );
}
