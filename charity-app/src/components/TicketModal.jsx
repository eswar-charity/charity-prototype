import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { X, Ticket } from 'lucide-react';
import { getMyTicket } from '../api/checkin';

/**
 * The attendee's door ticket: a QR of their per-event ticket code. Staff scan
 * it with the check-in scanner. The code is issued by the API when they join.
 */
export default function TicketModal({ open, onClose, eventId, title, variant = 'mobile' }) {
  const [ticket, setTicket] = useState(null);
  const [dataUrl, setDataUrl] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open || !eventId) return undefined;
    let cancelled = false;
    setTicket(null);
    setDataUrl('');
    setError('');
    getMyTicket(eventId)
      .then(async (t) => {
        if (cancelled) return;
        setTicket(t);
        const url = await QRCode.toDataURL(t.code, {
          width: 240, margin: 1, color: { dark: '#12203A', light: '#FFFFFF' },
        });
        if (!cancelled) setDataUrl(url);
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || 'Could not load your ticket');
      });
    return () => { cancelled = true; };
  }, [open, eventId]);

  if (!open) return null;

  const body = (
    <div className="qr-share">
      <div className="qr-share-head">
        <div>
          <h2 className="qr-share-title">Your ticket</h2>
          <p className="qr-share-sub">{title}</p>
        </div>
        <button type="button" className="qr-share-close" onClick={onClose} aria-label="Close">
          <X size={variant === 'desktop' ? 16 : 20} />
        </button>
      </div>
      <div className="qr-share-code">
        {error ? (
          <p style={{ color: 'var(--text-secondary)', padding: 24, textAlign: 'center' }}>{error}</p>
        ) : dataUrl ? (
          <img src={dataUrl} alt={`Ticket QR code ${ticket?.code}`} width={200} height={200} />
        ) : (
          <div className="qr-share-code-loading" aria-hidden="true" />
        )}
      </div>
      {ticket && (
        <p className="qr-share-hint" style={{ textAlign: 'center', fontWeight: 700, letterSpacing: 1 }}>
          <Ticket size={14} style={{ verticalAlign: -2, marginRight: 6 }} aria-hidden="true" />
          {ticket.code}
        </p>
      )}
      <p className="qr-share-hint" style={{ textAlign: 'center' }}>
        Show this at the door. {ticket?.holder ? `Issued to ${ticket.holder}.` : ''}
      </p>
    </div>
  );

  if (variant === 'desktop') {
    return (
      <div className="dsk-modal-backdrop" onClick={onClose} role="presentation">
        <div className="dsk-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Your ticket">
          {body}
        </div>
      </div>
    );
  }
  return (
    <div className="overlay-bg" onClick={onClose} role="presentation">
      <div className="bottom-sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Your ticket">
        <div className="sheet-handle" />
        {body}
      </div>
    </div>
  );
}
