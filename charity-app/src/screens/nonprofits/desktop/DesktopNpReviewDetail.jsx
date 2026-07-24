import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Tag, Check } from 'lucide-react';
import { DesktopNpLayout } from '../../../components/desktop/DesktopNpLayout';
import { useNpReviewDetail } from '../../../hooks/useNpApprovals';
import { npRequestChangesPath } from '../../../utils/npApprovalAdapter';

const TOAST_STYLE = {
  position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
  background: 'var(--dark)', color: '#fff', padding: '12px 22px',
  borderRadius: 'var(--radius-pill)', fontSize: 14, fontWeight: 600,
  zIndex: 100, boxShadow: '0 6px 24px rgba(0,0,0,0.28)',
};

const DEFAULT_CHECKS = [
  { id: 1, label: 'Media present', done: true },
  { id: 2, label: 'Story text', done: true },
  { id: 3, label: 'Policy scan', done: false },
];

export default function DesktopNpReviewDetail() {
  const navigate = useNavigate();
  const { event, eventId, loading, error, approve, reject } = useNpReviewDetail();
  const [toast, setToast] = useState('');
  const notify = (msg) => { setToast(msg); setTimeout(() => setToast(''), 1800); };

  const handleApprove = async () => {
    try {
      await approve();
      notify(`“${event?.title ?? 'Event'}” approved & published`);
      navigate('/np/approvals');
    } catch {
      notify('Could not approve event');
    }
  };

  const handleReject = async () => {
    try {
      await reject();
      notify(`“${event?.title ?? 'Event'}” rejected`);
      navigate('/np/approvals');
    } catch {
      notify('Could not reject event');
    }
  };

  if (loading) {
    return (
      <DesktopNpLayout active="approvals" title="Launchpad">
        <div style={{ padding: 24, color: 'var(--text-secondary)' }}>Loading…</div>
      </DesktopNpLayout>
    );
  }

  if (error || !event) {
    return (
      <DesktopNpLayout active="approvals" title="Launchpad">
        <div style={{ padding: 24, color: 'var(--text-secondary)' }}>
          {error?.message || 'Could not load event'}
        </div>
      </DesktopNpLayout>
    );
  }

  const heroImg = event.cover || '/events/give-now/img1.jpg';
  const organizerName = event.organizer || 'Organizer';
  const nonprofitName = event.nonprofit || event.nonprofitBrief?.name || 'Your organization';
  const tags = event.tags?.length ? event.tags : [event.category].filter(Boolean);
  const timeLabel = [event.startTime, event.endTime].filter(Boolean).join(' – ');
  const contentChecks = DEFAULT_CHECKS.map((c) => ({
    ...c,
    done: c.id === 1 ? !!event.cover : c.id === 2 ? !!event.mission : c.done,
  }));

  return (
    <DesktopNpLayout active="approvals" title="Launchpad">
      <div className="dsk-np-review-banner">You're reviewing this event — it won't go live until you approve it</div>

      <div className="dsk-np-review-grid">
        <div className="dsk-np-review-main">
          <div className="dsk-np-review-hero" style={{ backgroundImage: `url(${heroImg})` }}>
            <div className="dsk-np-review-hero-tags">
              {tags.slice(0, 2).map((tag) => (
                <span key={tag} className="dsk-modal-tag" style={{ background: 'rgba(255,255,255,0.9)' }}>{tag}</span>
              ))}
            </div>
            <div className="dsk-np-review-hero-title">
              <h2>{event.title}</h2>
              <p>for {nonprofitName} · by {organizerName}</p>
            </div>
          </div>

          <div className="dsk-np-review-section">
            <p className="dsk-np-review-section-title">The Mission</p>
            <p className="dsk-np-review-section-text">
              {event.mission || 'No description provided.'}
            </p>
            <button
              type="button"
              className="dsk-cta-btn"
              style={{ marginTop: 4 }}
              onClick={() => navigate('/guest/event/upcoming')}
            >
              Join the Crew
            </button>
          </div>

          <div className="dsk-np-review-section">
            <p className="dsk-np-review-section-title">The Story</p>
            <p className="dsk-np-review-section-text">
              {event.mission || 'No story provided.'}
            </p>
          </div>
        </div>

        <aside className="dsk-np-review-sidebar">
          <div className="dsk-sidebar-card">
            <div className="dsk-sidebar-np-row">
              <img src={heroImg} alt={organizerName} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
              <div>
                <p className="dsk-sidebar-np-name">{organizerName} <span className="dsk-verify-dot">✓</span></p>
                <p className="dsk-sidebar-np-sub">Social entrepreneur</p>
              </div>
            </div>
          </div>

          <div className="dsk-sidebar-card" style={{ marginTop: 14 }}>
            <p className="dsk-np-review-side-title">Event details</p>
            <div className="dsk-np-review-detail-row"><Calendar size={14} color="var(--blue)" /><div><p>{event.date || '—'}</p><span>{timeLabel}</span></div></div>
            <div className="dsk-np-review-detail-row"><MapPin size={14} color="var(--blue)" /><div><p>{event.location || '—'}</p></div></div>
            {event.category && (
              <div className="dsk-np-review-detail-row"><Tag size={14} color="var(--blue)" /><div><p>{event.category}</p></div></div>
            )}
          </div>

          <div className="dsk-sidebar-card" style={{ marginTop: 14 }}>
            <p className="dsk-np-review-side-title">Content check</p>
            {contentChecks.map((c) => (
              <div key={c.id} className="dsk-np-content-check">
                <div className={`check-circle ${c.done ? 'checked' : ''}`}>{c.done && <Check size={12} strokeWidth={3} />}</div>
                <span>{c.label}</span>
              </div>
            ))}
          </div>
        </aside>
      </div>

      <div className="dsk-np-review-bar">
        <button className="np-link-btn" style={{ color: 'var(--primary)', fontWeight: 700 }} onClick={handleReject}>Reject event</button>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="review-bar-outline"
            style={{ flex: 'none', padding: '13px 22px' }}
            onClick={() => navigate(npRequestChangesPath(eventId))}
          >
            Request changes
          </button>
          <button
            className="review-bar-approve"
            style={{ flex: 'none', padding: '13px 22px' }}
            onClick={handleApprove}
          >
            Approve
          </button>
        </div>
      </div>
      {toast && <div style={TOAST_STYLE}>{toast}</div>}
    </DesktopNpLayout>
  );
}
