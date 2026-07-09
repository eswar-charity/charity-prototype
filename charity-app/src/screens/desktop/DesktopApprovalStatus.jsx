import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Clock, MessageSquare, Rocket, PartyPopper, Radio } from 'lucide-react';
import DesktopHeader from '../../components/desktop/DesktopHeader';

/* Event lifecycle: Submitted -> Approved -> Live -> Completed (Blueprint §8) */
const NODES = [
  { key: 'submitted', label: 'Submitted', sub: 'Today, 2:34 PM' },
  { key: 'approved', label: 'Approved', sub: 'Ocean Conservancy' },
  { key: 'live', label: 'Live', sub: 'Open for joins & backing' },
  { key: 'completed', label: 'Completed', sub: 'Impact recap ready' },
];
function statusesFor(state) {
  switch (state) {
    case 'approved':  return ['done', 'done', 'active', 'pending'];
    case 'live':      return ['done', 'done', 'livenow', 'active'];
    case 'completed': return ['done', 'done', 'done', 'done'];
    default:          return ['done', 'active', 'pending', 'pending'];
  }
}
const COPY = {
  review:    { title: 'Submitted!', sub: "Ocean Conservancy is reviewing your event. You'll hear back within 48 hours." },
  approved:  { title: "You're approved 🎉", sub: 'Ocean Conservancy approved your event — publish it whenever you’re ready.' },
  live:      { title: "You're live!", sub: 'Your event is published and open for people to join and back.' },
  completed: { title: 'Event complete', sub: 'Great work. Your impact recap is ready to review and share.' },
};

export default function DesktopApprovalStatus() {
  const navigate = useNavigate();
  const [state, setState] = useState('review');
  const [notify, setNotify] = useState(false);
  const [toast, setToast] = useState('');
  const showToast = (m) => { setToast(m); setTimeout(() => setToast(''), 2200); };
  const advance = (next, msg) => { setState(next); showToast(msg); };

  const statuses = statusesFor(state);
  const copy = COPY[state];
  const primary = {
    review:    { label: 'Approve event', Icon: Check, onClick: () => advance('approved', 'Nonprofit approved your event') },
    approved:  { label: 'Go live', Icon: Rocket, onClick: () => advance('live', 'Your event is now live!') },
    live:      { label: 'Complete event', Icon: PartyPopper, onClick: () => advance('completed', 'Event marked complete') },
    completed: { label: 'See impact recap', Icon: PartyPopper, onClick: () => navigate('/post-event') },
  }[state];

  return (
    <div className="dsk-page">
      <DesktopHeader active="Discover" />

      <main className="dsk-main">
        <div className="dsk-container dsk-approval-wrap">
          <div className="dsk-approval-card">
            <div className="dsk-approval-icon" style={state === 'live' ? { background: 'var(--orange-soft)' } : undefined}>
              {state === 'review' && <Clock size={26} color="var(--primary)" />}
              {state === 'approved' && <Check size={26} color="var(--primary)" strokeWidth={3} />}
              {state === 'live' && <Radio size={26} color="var(--orange-dark)" />}
              {state === 'completed' && <PartyPopper size={26} color="var(--primary)" />}
            </div>
            <h1 className="dsk-approval-title">{copy.title}</h1>
            <p className="dsk-approval-sub">{copy.sub}</p>
          </div>

          {/* Lifecycle timeline */}
          <div className="dsk-approval-timeline">
            {NODES.map((node, i) => {
              const st = statuses[i];
              return (
                <div key={node.key} style={{ display: 'contents' }}>
                  <div className="dsk-approval-step">
                    <div
                      className={`timeline-dot ${st === 'done' ? 'td-done' : st === 'pending' ? 'td-pending' : 'td-active'}`}
                      style={st === 'livenow' ? { background: 'var(--orange)', borderColor: 'var(--orange)' } : undefined}
                    >
                      {st === 'done' && <Check size={12} strokeWidth={3} />}
                      {st === 'active' && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)' }} />}
                      {st === 'livenow' && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'white' }} />}
                    </div>
                    <p className="dsk-approval-step-title" style={{ color: st === 'pending' ? 'var(--text-secondary)' : st === 'livenow' ? 'var(--orange-dark)' : undefined }}>{node.label}</p>
                    <p className="dsk-approval-step-sub">{node.sub}</p>
                  </div>
                  {i < NODES.length - 1 && <div className="dsk-approval-connector" />}
                </div>
              );
            })}
          </div>

          {/* Event hero with real background image */}
          <div
            className="dsk-approval-hero"
            style={{
              backgroundImage: 'linear-gradient(to top, rgba(13,42,74,0.78), rgba(13,42,74,0.15)), url(/events/breakneck-ridge-run/img1.jpg)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <p className="dsk-approval-hero-title">Coastal Cleanup Gala</p>
            <p className="dsk-approval-hero-sub">📍 Santa Monica Pier{state === 'live' ? ' · LIVE NOW' : ''}</p>
          </div>

          {/* Context-aware CTAs */}
          <div className="dsk-approval-actions">
            <button className="dsk-cta-btn" onClick={primary.onClick}>
              <primary.Icon size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />{primary.label}
            </button>
            {state === 'review' && (
              <button className="dsk-sidebar-share-btn" style={{ width: 'auto', padding: '10px 24px' }} onClick={() => navigate('/event/step-4')}>Edit event</button>
            )}
            {state === 'approved' && (
              <button className="dsk-sidebar-share-btn" style={{ width: 'auto', padding: '10px 24px' }} onClick={() => navigate('/event/step-4')}>Edit before publishing</button>
            )}
            {state === 'live' && (
              <button className="dsk-sidebar-share-btn" style={{ width: 'auto', padding: '10px 24px' }} onClick={() => navigate('/live-dashboard')}>Open live dashboard</button>
            )}
            {state === 'completed' && (
              <button className="dsk-sidebar-share-btn" style={{ width: 'auto', padding: '10px 24px' }} onClick={() => navigate('/feed')}>Back to feed</button>
            )}
          </div>

          {/* Nonprofit feedback — only while under review */}
          {state === 'review' && (
            <>
              <button
                className="dsk-approval-comment-btn"
                style={{ display: 'block', margin: '0 auto 18px', background: notify ? 'var(--green)' : 'var(--primary)' }}
                onClick={() => { setNotify(!notify); showToast(notify ? 'Notifications off' : 'We’ll notify you when it’s approved'); }}
              >
                {notify ? "Notifications on ✓" : 'Notify me when approved'}
              </button>
              <div className="dsk-approval-comment">
                <div className="dsk-approval-comment-icon"><MessageSquare size={16} color="var(--blue)" /></div>
                <div style={{ flex: 1 }}>
                  <p className="dsk-approval-comment-text">"Please clarify volunteer requirements."</p>
                  <p className="dsk-approval-comment-from">— Ocean Conservancy Team</p>
                  <button className="dsk-approval-comment-btn" onClick={() => navigate('/event/step-4')}>Update event</button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {toast && (
        <div style={{
          position: 'fixed', left: '50%', bottom: 32, transform: 'translateX(-50%)',
          background: 'var(--dark)', color: '#fff', padding: '11px 20px', borderRadius: 'var(--radius-pill)',
          fontSize: 13, fontWeight: 600, zIndex: 100, boxShadow: '0 6px 22px rgba(0,0,0,0.22)',
        }}>{toast}</div>
      )}
    </div>
  );
}
