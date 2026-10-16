import { useCallback, useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { Check, QrCode, ScanLine, X, UserCheck, Clock, AlertTriangle } from 'lucide-react';
import { checkIn } from '../api/checkin';

const ROLE_COPY = {
  se: {
    title: 'Check in attendee',
    subtitle: 'Scan an attendee’s Charity Hub ticket at the door',
    successLabel: 'Checked in',
    successDetail: (name, event) => `${name} is now counted in your Joined total for ${event}.`,
    statLabel: 'Checked in this session',
    alreadyLabel: 'Already checked in',
  },
  admin: {
    title: 'Audit check-in scan',
    subtitle: 'Verify physical attendance against platform records for governance',
    successLabel: 'Audit logged',
    successDetail: (name, event) => `${name} at ${event} — recorded in the platform audit trail.`,
    statLabel: 'Audit scans this session',
    alreadyLabel: 'Already logged',
  },
};

const SCAN_INTERVAL_MS = 180;
const SAME_CODE_COOLDOWN_MS = 3000;

function formatTime(date) {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

/** Normalise an API attendee row into what the result card renders. */
function toEntry(attendee) {
  return {
    id: attendee.ticket_code || `walk-in-${attendee.id}`,
    name: attendee.name,
    initials: attendee.initials || attendee.name?.slice(0, 2).toUpperCase(),
    color: attendee.color || '#1A6EB5',
    ticket: attendee.ticket_type || 'Attendee',
  };
}

export default function QRScannerModal({
  open,
  onClose,
  role = 'se',
  variant = 'mobile',
  eventId,
  eventTitle = 'this event',
  onScanSuccess,
}) {
  const config = ROLE_COPY[role] || ROLE_COPY.se;
  const [phase, setPhase] = useState('scanning'); // scanning | success | duplicate | invalid
  const [current, setCurrent] = useState(null);
  const [message, setMessage] = useState('');
  const [sessionScans, setSessionScans] = useState(0);
  const [recentScans, setRecentScans] = useState([]);
  const [cameraError, setCameraError] = useState('');
  const [manualCode, setManualCode] = useState('');
  const [busy, setBusy] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const busyRef = useRef(false);
  const phaseRef = useRef('scanning');
  const lastCodeRef = useRef({ code: '', at: 0 });
  // Parents pass fresh callbacks every render; reading them through refs keeps the
  // camera/decoder effect keyed on `open` only (otherwise each scan reset the modal).
  const submitRef = useRef(null);
  const onScanSuccessRef = useRef(onScanSuccess);
  useEffect(() => {
    onScanSuccessRef.current = onScanSuccess;
  });

  const setPhaseBoth = useCallback((next) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  const submitCode = useCallback(async (raw, { manual = false } = {}) => {
    const code = String(raw || '').trim();
    if (!code || busyRef.current || !eventId) return;
    const now = Date.now();
    // The camera sees the same QR for many frames; typed codes are always deliberate.
    if (!manual && lastCodeRef.current.code === code && now - lastCodeRef.current.at < SAME_CODE_COOLDOWN_MS) return;
    lastCodeRef.current = { code, at: now };

    busyRef.current = true;
    setBusy(true);
    try {
      const attendee = await checkIn(eventId, { code });
      const entry = toEntry(attendee);
      const stamp = new Date();
      setCurrent(entry);
      setPhaseBoth('success');
      setSessionScans((n) => n + 1);
      setRecentScans((prev) => [{ ...entry, time: formatTime(stamp) }, ...prev].slice(0, 4));
      onScanSuccessRef.current?.(entry);
    } catch (err) {
      if (err?.code === 'already_checked_in' && err.details) {
        setCurrent(toEntry(err.details));
        setPhaseBoth('duplicate');
      } else {
        setMessage(err?.message || 'Could not check this ticket in');
        setCurrent(null);
        setPhaseBoth('invalid');
      }
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }, [eventId, setPhaseBoth]);

  useEffect(() => {
    submitRef.current = submitCode;
  }, [submitCode]);

  const resumeScanning = useCallback(() => {
    setCurrent(null);
    setMessage('');
    setPhaseBoth('scanning');
  }, [setPhaseBoth]);

  // Camera + decode loop, only while the modal is open.
  useEffect(() => {
    if (!open) return undefined;
    setSessionScans(0);
    setRecentScans([]);
    setCameraError('');
    setManualCode('');
    lastCodeRef.current = { code: '', at: 0 };
    resumeScanning();

    let cancelled = false;
    let timer = null;

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError('Camera is not available in this browser — enter the ticket code below.');
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          await video.play().catch(() => {});
        }
        const tick = () => {
          const v = videoRef.current;
          const canvas = canvasRef.current;
          if (v && canvas && v.readyState >= 2 && phaseRef.current === 'scanning' && !busyRef.current) {
            canvas.width = v.videoWidth;
            canvas.height = v.videoHeight;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
            const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const found = jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' });
            if (found?.data) submitRef.current?.(found.data);
          }
          timer = setTimeout(tick, SCAN_INTERVAL_MS);
        };
        tick();
      } catch {
        setCameraError('Camera access was blocked — enter the ticket code below instead.');
      }
    }
    start();

    return () => {
      cancelled = true;
      clearTimeout(timer);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [open, resumeScanning]);

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
            <video ref={videoRef} muted playsInline style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
            <canvas ref={canvasRef} hidden />
            <div className="qr-scanner-frame" aria-hidden="true">
              <span /><span /><span /><span />
            </div>
            <div className="qr-scanner-line" aria-hidden="true" />
            <div className="qr-scanner-hint">
              <ScanLine size={16} />
              <span>Align the ticket QR within the frame</span>
            </div>
          </div>
          <p className="qr-scanner-status">
            {cameraError || (busy ? 'Checking ticket…' : 'Scanning…')}
          </p>
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
          <button type="button" className="qr-scanner-another" onClick={resumeScanning}>
            {phase === 'success' ? 'Scan next attendee' : 'Scan another ticket'}
          </button>
        </div>
      )}

      {phase === 'invalid' && (
        <div className="qr-scanner-result qr-scanner-result--warn">
          <div className="qr-scanner-result-icon"><AlertTriangle size={24} /></div>
          <p className="qr-scanner-result-label">Ticket not accepted</p>
          <p className="qr-scanner-result-copy">{message}</p>
          <button type="button" className="qr-scanner-another" onClick={resumeScanning}>
            Try again
          </button>
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

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submitCode(manualCode, { manual: true });
          setManualCode('');
        }}
        style={{ display: 'flex', gap: 8, marginTop: 14 }}
      >
        <input
          className="input-field"
          placeholder="Or type a ticket code (CH-…)"
          value={manualCode}
          onChange={(e) => setManualCode(e.target.value)}
          autoCapitalize="characters"
          aria-label="Ticket code"
        />
        <button type="submit" className="qr-scanner-simulate" disabled={busy || !manualCode.trim()}>
          Check in
        </button>
      </form>
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
