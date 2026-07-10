import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Check, Clock, Rocket, PartyPopper, Radio } from 'lucide-react';

/* Event lifecycle after submit (Blueprint §8):
   Submitted -> Approved -> Live -> Completed.
   This screen lets the organiser walk the event through each stage. */
const NODES = [
  { key: 'submitted', label: 'Submitted' },
  { key: 'approved', label: 'Approved' },
  { key: 'live', label: 'Live' },
  { key: 'completed', label: 'Completed' },
];

function nodeStatuses(state) {
  switch (state) {
    case 'approved':  return ['done', 'done', 'active', 'pending'];
    case 'live':      return ['done', 'done', 'livenow', 'active'];
    case 'completed': return ['done', 'done', 'done', 'done'];
    default:          return ['done', 'active', 'pending', 'pending']; // review
  }
}

const COPY = {
  review:    { title: 'Submitted!', sub: "Ocean Conservancy is reviewing your event. You'll hear back within 48 hours." },
  approved:  { title: "You're approved 🎉", sub: 'Ocean Conservancy approved your event. Publish it whenever you’re ready.' },
  live:      { title: "You're live!", sub: 'Your event is published and open for people to join and back.' },
  completed: { title: 'Event complete', sub: 'Thanks for running a great event. Your impact recap is ready to share.' },
};

export default function ApprovalStatus() {
  const navigate = useNavigate();
  const [state, setState] = useState('review');
  const [notified, setNotified] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2200);
  };

  const advance = (next, msg) => { setState(next); showToast(msg); };

  const statuses = nodeStatuses(state);
  const copy = COPY[state];

  // Primary CTA is context-aware and drives the lifecycle forward.
  const primary = {
    review:    { label: 'Approve event', icon: Check, onClick: () => advance('approved', 'Nonprofit approved your event') },
    approved:  { label: 'Go live', icon: Rocket, onClick: () => advance('live', 'Your event is now live!') },
    live:      { label: 'Complete event', icon: PartyPopper, onClick: () => advance('completed', 'Event marked complete') },
    completed: { label: 'See impact recap', icon: PartyPopper, onClick: () => navigate('/post-event') },
  }[state];
  const PrimaryIcon = primary.icon;

  return (
    <div className="phone-shell">
      <div className="screen">
        <div style={{ padding: '52px 18px 0' }}>
          <button className="back-btn" onClick={() => navigate('/event/step-4')} style={{ marginBottom: 20 }}>
            <ChevronLeft size={18} />
          </button>

          {/* Event hero — real background image */}
          <div
            style={{
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              height: 168,
              backgroundImage: 'url(/events/breakneck-ridge-run/img1.jpg)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              position: 'relative',
              display: 'flex',
              alignItems: 'flex-end',
              marginBottom: 20,
            }}
          >
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(13,42,74,0.78) 0%, rgba(13,42,74,0.12) 55%, transparent 100%)' }} />
            <div style={{ position: 'absolute', top: 12, left: 12 }}>
              {state === 'live' ? (
                <span className="live-badge"><span className="live-dot" /> LIVE NOW</span>
              ) : (
                <span className="badge" style={{ background: 'rgba(255,255,255,0.9)', color: 'var(--primary)' }}>
                  {state === 'completed' ? 'COMPLETED' : state === 'approved' ? 'APPROVED' : 'IN REVIEW'}
                </span>
              )}
            </div>
            <div style={{ position: 'relative', padding: '0 14px 14px' }}>
              <p style={{ color: 'white', fontSize: 19, fontWeight: 800, letterSpacing: -0.3 }}>Coastal Cleanup Drive</p>
              <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: 600 }}>for Ocean Conservancy</p>
            </div>
          </div>

          {/* Status card */}
          <div className="card" style={{ textAlign: 'center', padding: '24px 20px', marginBottom: 18 }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: state === 'live' ? 'var(--orange-soft)' : 'var(--primary-soft)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px',
            }}>
              {state === 'review' && <Clock size={24} color="var(--primary)" />}
              {state === 'approved' && <Check size={24} color="var(--primary)" strokeWidth={3} />}
              {state === 'live' && <Radio size={24} color="var(--orange-dark)" />}
              {state === 'completed' && <PartyPopper size={24} color="var(--primary)" />}
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--dark)', marginBottom: 8 }}>{copy.title}</h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{copy.sub}</p>
          </div>

          {/* Lifecycle timeline */}
          <div className="card" style={{ padding: '18px', marginBottom: 20 }}>
            {NODES.map((node, i) => {
              const st = statuses[i];
              const isLast = i === NODES.length - 1;
              return (
                <div key={node.key}>
                  <div className="timeline-step">
                    <div className={`timeline-dot ${st === 'done' ? 'td-done' : st === 'pending' ? 'td-pending' : 'td-active'}`}
                      style={st === 'livenow' ? { background: 'var(--orange)', borderColor: 'var(--orange)' } : undefined}>
                      {st === 'done' && <Check size={12} strokeWidth={3} />}
                      {(st === 'active') && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)' }} />}
                      {st === 'livenow' && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'white' }} />}
                    </div>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: st === 'pending' ? 600 : 700, color: st === 'pending' ? 'var(--text-secondary)' : (st === 'livenow' ? 'var(--orange-dark)' : 'var(--dark)') }}>
                        {node.label}
                      </p>
                      <p style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 2 }}>
                        {node.key === 'submitted' && 'Sent for nonprofit review'}
                        {node.key === 'approved' && (statuses[1] === 'done' ? 'Approved by Ocean Conservancy' : 'Awaiting nonprofit approval')}
                        {node.key === 'live' && (st === 'livenow' ? 'Open for joins & backing' : 'Auto-publishes once approved')}
                        {node.key === 'completed' && 'Wrap up & share impact'}
                      </p>
                    </div>
                  </div>
                  {!isLast && <div className="timeline-connector" />}
                </div>
              );
            })}
          </div>

          {/* Context-aware CTAs */}
          <div className="approval-actions">
            <div className="approval-actions-pair">
              <button type="button" className="btn-primary" onClick={primary.onClick}>
                <PrimaryIcon size={18} />
                {primary.label}
              </button>

              {state === 'review' && (
                <button type="button" className="btn-outline" onClick={() => navigate('/event/step-4')}>Edit event</button>
              )}
              {state === 'approved' && (
                <button type="button" className="btn-outline" onClick={() => navigate('/event/step-4')}>Edit before publishing</button>
              )}
              {state === 'live' && (
                <button type="button" className="btn-outline" onClick={() => navigate('/live-dashboard')}>Open live dashboard</button>
              )}
              {state === 'completed' && (
                <button type="button" className="btn-outline" onClick={() => navigate('/feed')}>Back to feed</button>
              )}
            </div>

            {state === 'review' && (
              <>
                <p className="approval-actions-hint">Walk your event through each stage.</p>
                <button
                  type="button"
                  className="btn-ghost approval-notify-btn"
                  onClick={() => { setNotified(true); showToast('We’ll notify you the moment it’s approved'); }}
                >
                  {notified ? 'Notifications on ✓' : 'Notify me when approved'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {toast && (
        <div style={{
          position: 'absolute', left: '50%', bottom: 40, transform: 'translateX(-50%)',
          background: 'var(--dark)', color: '#fff', padding: '10px 18px',
          borderRadius: 'var(--radius-pill)', fontSize: 13, fontWeight: 600, zIndex: 100,
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)', maxWidth: '80%', textAlign: 'center',
        }}>
          {toast}
        </div>
      )}
    </div>
  );
}
