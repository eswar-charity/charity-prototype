import { useState } from 'react';
import { Link, ChevronRight, X } from 'lucide-react';

const CHANNELS = [
  {
    label: 'Messages',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" fill="#34C759" />
      </svg>
    ),
  },
  {
    label: 'Instagram',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect x="2" y="2" width="20" height="20" rx="5" fill="url(#dsk-ig)" />
        <defs>
          <linearGradient id="dsk-ig" x1="2" y1="2" x2="22" y2="22">
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
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="black" aria-hidden>
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    label: 'LinkedIn',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="#0A66C2" aria-hidden>
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
];

function truncateUrl(url, max = 34) {
  const plain = url.replace(/^https?:\/\//, '');
  if (plain.length <= max) return plain;
  return `${plain.slice(0, max)}…`;
}

export default function DesktopShareModal({
  open,
  onClose,
  url,
  title,
  subtitle,
  previewStyle,
  heading = 'Share this event',
}) {
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const copyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).catch(() => {});
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const shareVia = () => {
    copyLink();
  };

  return (
    <div className="dsk-modal-backdrop" onClick={onClose} role="presentation">
      <div className="dsk-modal dsk-share-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Share">
        <div className="dsk-modal-head">
          <h3>{heading}</h3>
          <button type="button" className="dsk-modal-close" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <div className="dsk-share-preview">
          <div className="dsk-share-preview-thumb" style={previewStyle} />
          <div className="dsk-share-preview-body">
            <p className="dsk-share-preview-title">{title}</p>
            {subtitle && <p className="dsk-share-preview-sub">{subtitle}</p>}
          </div>
        </div>

        <div className="share-icons">
          {CHANNELS.map((ch) => (
            <button key={ch.label} type="button" className="share-icon-item" onClick={shareVia}>
              <div className="share-icon-circle">{ch.icon}</div>
              <span className="dsk-share-channel-label">{ch.label}</span>
            </button>
          ))}
        </div>

        <div className="url-copy-row">
          <Link size={16} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
          <span className="dsk-share-url">{truncateUrl(url)}</span>
          <button
            type="button"
            className="btn-ghost dsk-share-copy-btn"
            onClick={copyLink}
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>

        <button type="button" className="more-row dsk-share-more" onClick={shareVia}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="dsk-share-more-icon">
              <span>···</span>
            </div>
            <span className="dsk-share-more-label">More apps</span>
          </div>
          <ChevronRight size={18} color="var(--text-light)" />
        </button>
      </div>
    </div>
  );
}
