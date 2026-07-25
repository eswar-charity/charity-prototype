import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Check, Clock, Rocket, PartyPopper, Radio } from 'lucide-react';
import MobileAppHeader from '../components/MobileAppHeader';
import { getEvent } from '../api/events';
import { useApprovalEvent } from '../hooks/useApprovalEvent';
import { beginEventFix } from '../utils/beginEventFix';

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
    default:          return ['done', 'active', 'pending', 'pending'];
  }
}

function copyFor(state, nonprofitName) {
  const np = nonprofitName || 'the nonprofit';
  return {
    review:    { title: 'Submitted!', sub: `${np} is reviewing your event. You'll hear back within 48 hours.` },
    approved:  { title: "You're approved", sub: `${np} approved your event. Publish it whenever you're ready.` },
    live:      { title: "You're live!", sub: 'Your event is published and open for people to join and back.' },
    completed: { title: 'Event complete', sub: 'Thanks for running a great event. Your impact recap is ready to share.' },
  }[state];
}

export default function ApprovalStatus() {
  const navigate = useNavigate();
  const { event, loading, error, uiState, actionPending, handleGoLive, handleComplete } = useApprovalEvent();
  const [notified, setNotified] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2200);
  };

  const statuses = nodeStatuses(uiState);
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

  const openUpdateEvent = async () => {
    let raw = event?.raw;
    if (raw?.key) {
      try {
        raw = await getEvent(raw.key);
      } catch {
        /* use list payload */
      }
    }
    if (raw) beginEventFix(raw);
    navigate('/event/step-4');
  };

  const primary = {
    approved:  { label: 'Go live', icon: Rocket, onClick: () => runAction(handleGoLive, 'Your event is now live!', 'Could not go live') },
    live:      { label: 'Complete event', icon: PartyPopper, onClick: () => runAction(handleComplete, 'Event marked complete', 'Could not complete event') },
    completed: { label: 'See impact recap', icon: PartyPopper, onClick: () => navigate(key ? `/post-event?key=${encodeURIComponent(key)}` : '/post-event') },
  }[uiState];
  const PrimaryIcon = primary?.icon;

  if (loading) {
    return (
      <div className="phone-shell">
        <div className="screen" style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)' }}>Loading…</div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="phone-shell">
        <div className="screen" style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)' }}>
          {error?.message || 'Could not load event'}
        </div>
      </div>
    );
  }

  return (
    <div className="phone-shell">
      <div className="screen">
        <div style={{ padding: '0 18px 0' }}>
          <MobileAppHeader
            layout="bar"
            homePath="/feed"
            left={(
              <button type="button" className="back-btn" onClick={() => navigate('/event/step-4')} aria-label="Back">
                <ChevronLeft size={18} />
              </button>
            )}
          />
          <div style={{ paddingBottom: 20 }}>

          <div
            style={{
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              height: 168,
              backgroundImage: `url(${event.cover})`,
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
              {uiState === 'live' ? (
                <span className="live-badge"><span className="live-dot" /> LIVE NOW</span>
              ) : (
                <span className="badge" style={{ background: 'rgba(255,255,255,0.9)', color: 'var(--primary)' }}>
                  {uiState === 'completed' ? 'COMPLETED' : uiState === 'approved' ? 'APPROVED' : 'IN REVIEW'}
                </span>
              )}
            </div>
            <div style={{ position: 'relative', padding: '0 14px 14px' }}>
              <p style={{ color: 'white', fontSize: 19, fontWeight: 800, letterSpacing: -0.3 }}>{event.title}</p>
              <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: 600 }}>for {event.nonprofit}</p>
            </div>
          </div>

          <div className="card" style={{ textAlign: 'center', padding: '24px 20px', marginBottom: 18 }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: 'var(--primary-soft)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px',
            }}>
              {uiState === 'review' && <Clock size={24} color="var(--primary)" />}
              {uiState === 'approved' && <Check size={24} color="var(--primary)" strokeWidth={3} />}
              {uiState === 'live' && <Radio size={24} color="var(--primary)" />}
              {uiState === 'completed' && <PartyPopper size={24} color="var(--primary)" />}
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--dark)', marginBottom: 8 }}>{copy.title}</h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{copy.sub}</p>
          </div>

          <div className="card" style={{ padding: '18px', marginBottom: 20 }}>
            {NODES.map((node, i) => {
              const st = statuses[i];
              const isLast = i === NODES.length - 1;
              return (
                <div key={node.key}>
                  <div className="timeline-step">
                    <div className={`timeline-dot ${st === 'done' ? 'td-done' : st === 'pending' ? 'td-pending' : 'td-active'}`}
                      style={st === 'livenow' ? { background: 'var(--primary)', borderColor: 'var(--primary)' } : undefined}>
                      {st === 'done' && <Check size={12} strokeWidth={3} />}
                      {(st === 'active') && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)' }} />}
                      {st === 'livenow' && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'white' }} />}
                    </div>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: st === 'pending' ? 600 : 700, color: st === 'pending' ? 'var(--text-secondary)' : (st === 'livenow' ? 'var(--primary)' : 'var(--dark)') }}>
                        {node.label}
                      </p>
                      <p style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 2 }}>
                        {node.key === 'submitted' && 'Sent for nonprofit review'}
                        {node.key === 'approved' && (statuses[1] === 'done' ? `Approved by ${event.nonprofit}` : 'Awaiting nonprofit approval')}
                        {node.key === 'live' && (st === 'livenow' ? 'Open for joins & backing' : 'Publish once approved')}
                        {node.key === 'completed' && 'Wrap up & share impact'}
                      </p>
                    </div>
                  </div>
                  {!isLast && <div className="timeline-connector" />}
                </div>
              );
            })}
          </div>

          <div className="approval-actions">
            <div className="approval-actions-pair">
              {primary && (
                <button type="button" className="btn-primary" onClick={primary.onClick} disabled={actionPending}>
                  <PrimaryIcon size={18} />
                  {primary.label}
                </button>
              )}

              {uiState === 'review' && event.apiStatus === 'Changes Requested' && (
                <button type="button" className="btn-outline" onClick={openUpdateEvent}>Update event</button>
              )}
              {uiState === 'review' && event.apiStatus !== 'Changes Requested' && (
                <button type="button" className="btn-outline" onClick={() => navigate('/event/step-4')}>Edit event</button>
              )}
              {uiState === 'approved' && (
                <button type="button" className="btn-outline" onClick={() => navigate('/event/step-4')}>Edit before publishing</button>
              )}
              {uiState === 'live' && (
                <button type="button" className="btn-outline" onClick={() => navigate(key ? `/live-dashboard?key=${encodeURIComponent(key)}` : '/live-dashboard')}>Open live dashboard</button>
              )}
              {uiState === 'completed' && (
                <button type="button" className="btn-outline" onClick={() => navigate('/feed')}>Back to feed</button>
              )}
            </div>

            {uiState === 'review' && (
              <>
                <p className="approval-actions-hint">Waiting for nonprofit approval.</p>
                <button
                  type="button"
                  className="btn-ghost approval-notify-btn"
                  onClick={() => { setNotified(true); showToast("We'll notify you the moment it's approved"); }}
                >
                  {notified ? 'Notifications on ✓' : 'Notify me when approved'}
                </button>
              </>
            )}
          </div>
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
