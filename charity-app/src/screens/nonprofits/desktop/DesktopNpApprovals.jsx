import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin } from 'lucide-react';
import { DesktopNpLayout } from '../../../components/desktop/DesktopNpLayout';
import { useNpApprovalsQueue } from '../../../hooks/useNpApprovals';
import { npReviewPath } from '../../../utils/npApprovalAdapter';

const TABS = ['All', 'Pending', 'Changes requested', 'Approved'];

const TOAST_STYLE = {
  position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
  background: 'var(--dark)', color: '#fff', padding: '12px 22px',
  borderRadius: 'var(--radius-pill)', fontSize: 14, fontWeight: 600,
  zIndex: 100, boxShadow: '0 6px 24px rgba(0,0,0,0.28)',
};

export default function DesktopNpApprovals() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('All');
  const {
    events,
    loading,
    error,
    autopilot,
    approve,
    reject,
    toggleAutopilot,
  } = useNpApprovalsQueue('desktop');
  const [toast, setToast] = useState('');
  const notify = (msg) => { setToast(msg); setTimeout(() => setToast(''), 1800); };
  const onKey = (fn) => (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(); }
  };

  const handleApprove = async (ev) => {
    try {
      await approve(ev);
      notify(`“${ev.title}” approved & published`);
    } catch {
      notify('Could not approve event');
    }
  };

  const handleReject = async (ev) => {
    try {
      await reject(ev);
      notify(`“${ev.title}” request rejected`);
    } catch {
      notify('Could not reject event');
    }
  };

  const handleToggleAutopilot = async () => {
    try {
      await toggleAutopilot();
      notify(autopilot ? 'Autopilot turned off' : 'Autopilot turned on');
    } catch {
      notify('Could not update autopilot');
    }
  };

  const matches = (ev, t) => {
    if (t === 'All') return true;
    if (t === 'Pending') return ev.status === 'New request';
    if (t === 'Changes requested') return ev.status === 'Changes requested';
    if (t === 'Approved') return ev.status === 'Approved';
    return true;
  };
  const visible = events.filter((ev) => matches(ev, tab));

  const badgeStyle = (status) => {
    if (status === 'New request') return 'badge-new-req';
    return 'badge-changes';
  };

  if (loading) {
    return (
      <DesktopNpLayout active="approvals" title="Event approvals">
        <div style={{ padding: 24, color: 'var(--text-secondary)' }}>Loading…</div>
      </DesktopNpLayout>
    );
  }

  if (error) {
    return (
      <DesktopNpLayout active="approvals" title="Event approvals">
        <div style={{ padding: 24, color: 'var(--text-secondary)' }}>
          {error?.message || 'Could not load approvals'}
        </div>
      </DesktopNpLayout>
    );
  }

  return (
    <DesktopNpLayout active="approvals" title="Event approvals">
      <div className="dsk-np-ap-tabs">
        {TABS.map((t) => (
          <button key={t} className={`dsk-np-ap-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t} ({events.filter((ev) => matches(ev, t)).length})
          </button>
        ))}
      </div>

      <div className="dsk-np-autopilot-banner">
        <button className={`toggle ${autopilot ? 'on' : ''}`} onClick={handleToggleAutopilot} aria-label="Toggle autopilot">
          <div className="toggle-thumb" />
        </button>
        <span>Autopilot publishing — auto-approve events from trusted SEs</span>
        <button className="np-link-btn" onClick={() => navigate('/np/settings/autopilot')}>Learn more</button>
      </div>

      {visible.length === 0 && (
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: 14, padding: '40px 0' }}>
          Nothing here in “{tab}”.
        </div>
      )}

      {visible.map((ev) => (
        <div key={ev.id} className="dsk-np-approval-card" role="button" tabIndex={0} aria-label={`Review ${ev.title}`} onClick={() => navigate(npReviewPath(ev.id))} onKeyDown={onKey(() => navigate(npReviewPath(ev.id)))}>
          <div className="dsk-np-approval-hero" style={{ backgroundImage: `url(${ev.heroImg})` }}>
            {ev.status === 'Approved'
              ? <span className="badge" style={{ background: 'var(--green)', color: 'white' }}>✓ Approved</span>
              : ev.status === 'Rejected'
                ? <span className="badge" style={{ background: 'var(--coral)', color: 'white' }}>Rejected</span>
                : <span className={badgeStyle(ev.status)}>{ev.status}</span>}
          </div>
          <div className="dsk-np-approval-body">
            <h3 className="dsk-np-approval-title">{ev.title}</h3>
            <p className="dsk-np-approval-by">By {ev.organizer} <span className="dsk-verify-dot">✓</span></p>
            <div className="dsk-np-approval-meta">
              <span><Calendar size={13} /> {ev.date}</span>
              <span><MapPin size={13} /> {ev.location}</span>
            </div>
            <p className="dsk-np-approval-desc">{ev.desc}</p>
            {ev.submitted && <p className="dsk-np-approval-submitted">{ev.submitted}</p>}
          </div>
          <div className="dsk-np-approval-actions" onClick={(e) => e.stopPropagation()}>
            {ev.status === 'Approved' || ev.status === 'Rejected' ? (
              <button className="ap-btn-outline dsk-np-review-btn" onClick={() => navigate(npReviewPath(ev.id))}>View event</button>
            ) : (
              <>
                <button className="ap-btn-outline dsk-np-review-btn" onClick={() => navigate(npReviewPath(ev.id))}>
                  {ev.status === 'Changes requested' ? 'View changes' : 'Review'}
                </button>
                <button className="ap-btn ap-btn-approve" onClick={() => handleApprove(ev)}>Approve</button>
                <button className="ap-btn ap-btn-reject" onClick={() => handleReject(ev)}>Reject</button>
              </>
            )}
          </div>
        </div>
      ))}
      {toast && <div style={TOAST_STYLE}>{toast}</div>}
    </DesktopNpLayout>
  );
}
