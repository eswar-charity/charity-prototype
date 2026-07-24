import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Clock, MessageSquare, Rocket, PartyPopper, Radio } from 'lucide-react';
import DesktopHeader from '../../components/desktop/DesktopHeader';
import { useApprovalEvent } from '../../hooks/useApprovalEvent';

const NODES = [
  { key: 'submitted', label: 'Submitted' },
  { key: 'approved', label: 'Approved' },
  { key: 'live', label: 'Live' },
  { key: 'completed', label: 'Completed' },
];

function statusesFor(state) {
  switch (state) {
    case 'approved':  return ['done', 'done', 'active', 'pending'];
    case 'live':      return ['done', 'done', 'livenow', 'active'];
    case 'completed': return ['done', 'done', 'done', 'done'];
    default:          return ['done', 'active', 'pending', 'pending'];
  }
}

function copyFor(state, nonprofitName) {
  const np = nonprofitName || 'the nonprofit';
  return {
    review:    { title: 'Submitted!', sub: `${np} is reviewing your event. You'll hear back within 48 hours.` },
    approved:  { title: "You're approved", sub: `${np} approved your event — publish it whenever you're ready.` },
    live:      { title: "You're live!", sub: 'Your event is published and open for people to join and back.' },
    completed: { title: 'Event complete', sub: 'Great work. Your impact recap is ready to review and share.' },
  }[state];
}

function timelineSub(nodeKey, st, statuses, event) {
  if (nodeKey === 'submitted') return 'Sent for nonprofit review';
  if (nodeKey === 'approved') return statuses[1] === 'done' ? event.nonprofit : 'Awaiting nonprofit approval';
  if (nodeKey === 'live') return st === 'livenow' ? 'Open for joins & backing' : 'Publish once approved';
  if (nodeKey === 'completed') return 'Impact recap ready';
  return '';
}

export default function DesktopApprovalStatus() {
  const navigate = useNavigate();
  const { event, loading, error, uiState, actionPending, handleGoLive, handleComplete } = useApprovalEvent();
  const [notify, setNotify] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (m) => { setToast(m); setTimeout(() => setToast(''), 2200); };

  const statuses = statusesFor(uiState);
  const copy = copyFor(uiState, event?.nonprofit);
  const key = event?.key;

  const runAction = async (fn, successMsg, failMsg) => {
    try {
      await fn();
      showToast(successMsg);
    } catch (err) {
      showToast(err?.message || failMsg);
    }
  };

  const primary = {
    approved:  { label: 'Go live', Icon: Rocket, onClick: () => runAction(handleGoLive, 'Your event is now live!', 'Could not go live') },
    live:      { label: 'Complete event', Icon: PartyPopper, onClick: () => runAction(handleComplete, 'Event marked complete', 'Could not complete event') },
    completed: { label: 'See impact recap', Icon: PartyPopper, onClick: () => navigate(key ? `/post-event?key=${encodeURIComponent(key)}` : '/post-event') },
  }[uiState];
  const PrimaryIcon = primary?.Icon;

  if (loading) {
    return (
      <div className="dsk-page">
        <DesktopHeader active="Discover" />
        <main className="dsk-main"><div className="dsk-container" style={{ paddingTop: 40, color: 'var(--text-secondary)' }}>Loading…</div></main>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="dsk-page">
        <DesktopHeader active="Discover" />
        <main className="dsk-main"><div className="dsk-container" style={{ paddingTop: 40, color: 'var(--text-secondary)' }}>{error?.message || 'Could not load event'}</div></main>
      </div>
    );
  }

  return (
    <div className="dsk-page">
      <DesktopHeader active="Discover" />

      <main className="dsk-main">
        <div className="dsk-container dsk-approval-wrap">
          <div className="dsk-approval-card dsk-approval-card--horizontal">
            <div className="dsk-approval-icon" style={uiState === 'live' ? { background: 'var(--primary-soft)' } : undefined}>
              {uiState === 'review' && <Clock size={28} color="var(--primary)" />}
              {uiState === 'approved' && <Check size={28} color="var(--primary)" strokeWidth={3} />}
              {uiState === 'live' && <Radio size={28} color="var(--primary)" />}
              {uiState === 'completed' && <PartyPopper size={28} color="var(--primary)" />}
            </div>
            <div className="dsk-approval-card-copy">
              <h1 className="dsk-approval-title">{copy.title}</h1>
              <p className="dsk-approval-sub">{copy.sub}</p>
            </div>
          </div>

          <div className="dsk-approval-timeline-wrap">
            <div className="dsk-approval-timeline">
              {NODES.map((node, i) => {
                const st = statuses[i];
                return (
                  <div key={node.key} style={{ display: 'contents' }}>
                    <div className="dsk-approval-step">
                      <div
                        className={`timeline-dot ${st === 'done' ? 'td-done' : st === 'pending' ? 'td-pending' : 'td-active'}`}
                        style={st === 'livenow' ? { background: 'var(--primary)', borderColor: 'var(--primary)' } : undefined}
                      >
                        {st === 'done' && <Check size={12} strokeWidth={3} />}
                        {st === 'active' && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)' }} />}
                        {st === 'livenow' && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'white' }} />}
                      </div>
                      <p className="dsk-approval-step-title" style={{ color: st === 'pending' ? 'var(--text-secondary)' : st === 'livenow' ? 'var(--primary)' : undefined }}>{node.label}</p>
                      <p className="dsk-approval-step-sub">{timelineSub(node.key, st, statuses, event)}</p>
                    </div>
                    {i < NODES.length - 1 && <div className="dsk-approval-connector" />}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="dsk-approval-grid">
            <div
              className="dsk-approval-hero"
              style={{
                backgroundImage: `linear-gradient(to top, rgba(13,42,74,0.78), rgba(13,42,74,0.15)), url(${event.cover})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <p className="dsk-approval-hero-title">{event.title}</p>
              <p className="dsk-approval-hero-sub">{event.location}{uiState === 'live' ? ' · LIVE NOW' : ''}</p>
            </div>

            <div className="dsk-approval-side">
              <div className="dsk-approval-actions">
                {primary && (
                  <button type="button" className="dsk-cta-btn" onClick={primary.onClick} disabled={actionPending}>
                    <PrimaryIcon size={16} />
                    {primary.label}
                  </button>
                )}
                {uiState === 'review' && (
                  <button type="button" className="dsk-approval-btn-secondary" onClick={() => navigate('/event/step-4')}>Edit event</button>
                )}
                {uiState === 'approved' && (
                  <button type="button" className="dsk-approval-btn-secondary" onClick={() => navigate('/event/step-4')}>Edit before publishing</button>
                )}
                {uiState === 'live' && (
                  <button type="button" className="dsk-approval-btn-secondary" onClick={() => navigate(key ? `/live-dashboard?key=${encodeURIComponent(key)}` : '/live-dashboard')}>Open live dashboard</button>
                )}
                {uiState === 'completed' && (
                  <button type="button" className="dsk-approval-btn-secondary" onClick={() => navigate('/feed')}>Back to feed</button>
                )}
              </div>

              {uiState === 'review' && (
                <>
                  <button
                    type="button"
                    className={`dsk-approval-notify-btn${notify ? ' on' : ''}`}
                    onClick={() => { setNotify(!notify); showToast(notify ? 'Notifications off' : 'We'll notify you when it's approved'); }}
                  >
                    {notify ? 'Notifications on ✓' : 'Notify me when approved'}
                  </button>
                  {event.apiStatus === 'Changes Requested' && (
                    <div className="dsk-approval-comment">
                      <div className="dsk-approval-comment-icon"><MessageSquare size={16} color="var(--blue)" /></div>
                      <div style={{ flex: 1 }}>
                        <p className="dsk-approval-comment-text">Changes were requested for this event.</p>
                        <p className="dsk-approval-comment-from">— {event.nonprofit}</p>
                        <button type="button" className="dsk-approval-comment-btn" onClick={() => navigate('/event/step-4')}>Update event</button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
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
