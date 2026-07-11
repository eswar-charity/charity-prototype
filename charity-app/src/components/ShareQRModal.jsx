import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Link as LinkIcon, X, ExternalLink } from 'lucide-react';
import { buildAppUrl } from '../utils/qrLink';

export default function ShareQRModal({
  open,
  onClose,
  path,
  title,
  subtitle,
  hint = "Scan with your phone's camera app to open this flow instantly.",
  variant = 'mobile',
}) {
  const [dataUrl, setDataUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const url = buildAppUrl(path);

  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    setCopied(false);
    QRCode.toDataURL(url, {
      width: 240,
      margin: 1,
      color: { dark: '#12203A', light: '#FFFFFF' },
    }).then((generated) => {
      if (!cancelled) setDataUrl(generated);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [open, url]);

  if (!open) return null;

  const isDesktop = variant === 'desktop';

  const copyLink = () => {
    if (navigator.clipboard) navigator.clipboard.writeText(url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const body = (
    <div className="qr-share">
      <div className="qr-share-head">
        <div>
          <h2 className="qr-share-title">{title}</h2>
          {subtitle && <p className="qr-share-sub">{subtitle}</p>}
        </div>
        <button type="button" className="qr-share-close" onClick={onClose} aria-label="Close">
          <X size={isDesktop ? 16 : 20} />
        </button>
      </div>

      <div className="qr-share-code">
        {dataUrl
          ? <img src={dataUrl} alt="Scannable QR code" width={200} height={200} />
          : <div className="qr-share-code-loading" aria-hidden="true" />}
      </div>

      <div className="url-copy-row">
        <LinkIcon size={16} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
        <span className="qr-share-url">{url.replace(/^https?:\/\//, '')}</span>
        <button type="button" className="btn-ghost" onClick={copyLink}>
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      <a className="qr-share-open" href={url} target="_blank" rel="noreferrer">
        <ExternalLink size={14} /> Open link
      </a>

      <p className="qr-share-hint">{hint}</p>
    </div>
  );

  if (isDesktop) {
    return (
      <div className="dsk-modal-backdrop" onClick={onClose} role="presentation">
        <div className="dsk-modal qr-share-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={title}>
          {body}
        </div>
      </div>
    );
  }

  return (
    <div className="overlay-bg" onClick={onClose} role="presentation">
      <div className="bottom-sheet qr-share-sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={title}>
        <div className="sheet-handle" />
        {body}
      </div>
    </div>
  );
}
