import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, QrCode, ScanLine, X, UserCheck, Clock } from 'lucide-react';
import { QR_SCANNER_ROLES, nextAttendee } from '../data/qrScannerData';

const SCAN_DELAY_MS = 2200;

function formatTime(date) {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export default function QRScannerModal({
  open,
  onClose,
  role = 'se',
  variant = 'mobile',
  eventTitle = 'Neon Night Run',
  onScanSuccess,
}) {
  const config = QR_SCANNER_ROLES[role] || QR_SCANNER_ROLES.se;
  const [phase, setPhase] = useState('scanning');
  const [current, setCurrent] = useState(null);
  const [sessionScans, setSessionScans] = useState([]);
  const [recentScans, setRecentScans] = useState([]);
  const scannedIds = useRef(new Set());
  const timerRef = useRef(null);

  const reset = useCallback(() => {
    setPhase('scanning');
    setCurrent(null);
  }, []);

  const performScan = useCallback(() => {
    const attendee = nextAttendee();
    const isDuplicate = scannedIds.current.has(attendee.id);
    const timestamp = new Date();

    if (isDuplicate) {
      setCurrent({ ...attendee, duplicate: true });
      setPhase('duplicate');
      return;
    }

    scannedIds.current.add(attendee.id);
    const entry = { ...attendee, time: formatTime(timestamp), timestamp };
    setCurrent(entry);
    setPhase('success');
    setSessionScans((prev) => prev + 1);
    setRecentScans((prev) => [entry, ...prev].slice(0, 4));
    onScanSuccess?.(entry);
  }, [onScanSuccess]);

  useEffect(() => {
    if (!open) {
      clearTimeout(timerRef.current);
      return undefined;
    }
    scannedIds.current = new Set();
    setSessionScans(0);
    setRecentScans([]);
    reset();
    timerRef.current = setTimeout(performScan, SCAN_DELAY_MS);
    return () => clearTimeout(timerRef.current);
  }, [open, reset, performScan]);

  const handleSimulate = () => {
    clearTimeout(timerRef.current);
    if (phase !== 'scanning') reset();
    setTimeout(performScan, 600);
  };

  const handleScanAnother = () => {
    reset();
    timerRef.current = setTimeout(performScan, SCAN_DELAY_MS);
  };

  if (!open) return null;

  const isDesktop = variant === 'desktop';

  const body = (
    <div className={`qr-scanner ${isDesktop ? 'qr-scanner--desktop' : 'qr-scanner--mobile'}`}>
      <div className="qr-scanner-head">
        <div>
          <h2 className="qr-scanner-title">{config.title}</h2>
          <p className="qr-scanner-sub">{config.subtitle}</p>
        </div>
        <button type="button" className="qr-scanner-close" onClick={onClose} aria-label="Close scanner">
          <X size={isDesktop ? 16 : 20} />
        </button>
      </div>

      <div className="qr-scanner-event">
        <QrCode size={14} aria-hidden="true" />
        <span>{eventTitle}</span>
        {sessionScans > 0 && (
          <span className="qr-scanner-session-count">{sessionScans} {config.statLabel.toLowerCase()}</span>
        )}
      </div>

      {phase === 'scanning' && (
        <div className="qr-scanner-viewport" aria-live="polite">
          <div className="qr-scanner-camera">
            <div className="qr-scanner-grid" aria-hidden="true" />
            <div className="qr-scanner-frame" aria-hidden="true">
              <span /><span /><span /><span />
            </div>
            <div className="qr-scanner-line" aria-hidden="true" />
            <div className="qr-scanner-hint">
              <ScanLine size={16} />
              <span>Align badge within frame</span>
            </div>
          </div>
          <p className="qr-scanner-status">Scanning…</p>
        </div>
      )}

      {(phase === 'success' || phase === 'duplicate') && current && (
        <div className={`qr-scanner-result ${phase === 'duplicate' ? 'qr-scanner-result--warn' : ''}`}>
          <div className={`qr-scanner-result-icon ${phase === 'success' ? 'qr-scanner-result-icon--ok' : ''}`}>
            {phase === 'success' ? <Check size={28} strokeWidth={3} /> : <Clock size={24} />}
          </div>
          <p className="qr-scanner-result-label">
            {phase === 'success' ? config.successLabel : config.alreadyLabel}
          </p>
          <div className="qr-scanner-attendee">
            <div className="qr-scanner-attendee-avatar" style={{ background: current.color }}>
              {current.initials}
            </div>
            <div>
              <p className="qr-scanner-attendee-name">{current.name}</p>
              <p className="qr-scanner-attendee-meta">{current.ticket} · {current.id}</p>
            </div>
          </div>
          <p className="qr-scanner-result-copy">
            {phase === 'success'
              ? config.successDetail(current.name, eventTitle)
              : `${current.name} was already recorded for this event.`}
          </p>
          {phase === 'success' && (
            <button type="button" className="qr-scanner-another" onClick={handleScanAnother}>
              Scan next attendee
            </button>
          )}
          {phase === 'duplicate' && (
            <button type="button" className="qr-scanner-another" onClick={handleScanAnother}>
              Scan another badge
            </button>
          )}
        </div>
      )}

      {recentScans.length > 0 && (
        <div className="qr-scanner-recent">
          <p className="qr-scanner-recent-title">
            <UserCheck size={14} aria-hidden="true" />
            Recent {role === 'admin' ? 'audit logs' : 'check-ins'}
          </p>
          {recentScans.map((scan) => (
            <div key={`${scan.id}-${scan.time}`} className="qr-scanner-recent-row">
              <div className="qr-scanner-recent-avatar" style={{ background: scan.color }}>{scan.initials}</div>
              <span className="qr-scanner-recent-name">{scan.name}</span>
              <span className="qr-scanner-recent-time">{scan.time}</span>
            </div>
          ))}
        </div>
      )}

      <button type="button" className="qr-scanner-simulate" onClick={handleSimulate}>
        {config.simulateLabel}
      </button>
    </div>
  );

  if (isDesktop) {
    return (
      <div className="dsk-modal-backdrop" onClick={onClose} role="presentation">
        <div className="dsk-modal qr-scanner-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={config.title}>
          {body}
        </div>
      </div>
    );
  }

  return (
    <div className="overlay-bg" onClick={onClose} role="presentation">
      <div className="bottom-sheet qr-scanner-sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={config.title}>
        <div className="sheet-handle" />
        {body}
      </div>
    </div>
  );
}
