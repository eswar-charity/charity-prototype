import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin } from 'lucide-react';
import { DesktopNpLayout } from '../../../components/desktop/DesktopNpLayout';

const TABS = ['All', 'Pending', 'Changes requested', 'Approved'];

const EVENTS = [
  {
    id: 1,
    title: 'Coastal Cleanup Wave 2',
    organizer: 'Maya R.',
    date: 'Oct 28, 2025',
    location: 'Santa Monica Pier',
    desc: "Join us for our second wave of coastal cleanup efforts. We will be providing all necessary equipment and a light breakfast for volunteers.",
    submitted: 'Submitted 2 hours ago',
    status: 'New request',
    heroImg: '/events/breakneck-ridge-run/img1.jpg',
  },
  {
    id: 2,
    title: 'Art for All',
    organizer: 'David K.',
    date: 'Nov 12, 2025',
    location: 'Downtown Arts District',
    desc: 'An inclusive community art session focusing on collaborative murals. We updated the budget per previous feedback and...',
    submitted: 'Updated 1 day ago',
    status: 'Changes requested',
    heroImg: '/events/dog-dad/img1.jpg',
  },
];

const TOAST_STYLE = {
  position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
  background: 'var(--dark)', color: '#fff', padding: '12px 22px',
  borderRadius: 'var(--radius-pill)', fontSize: 14, fontWeight: 600,
  zIndex: 100, boxShadow: '0 6px 24px rgba(0,0,0,0.28)',
};

export default function DesktopNpApprovals() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('All');
  const [autopilot, setAutopilot] = useState(false);
  const [events, setEvents] = useState(EVENTS);
  const [toast, setToast] = useState('');
  const notify = (msg) => { setToast(msg); setTimeout(() => setToast(''), 1800); };

  const approve = (ev) => {
    setEvents((prev) => prev.map((e) => (e.id === ev.id ? { ...e, status: 'Approved' } : e)));
    notify(`“${ev.title}” approved & published`);
  };
  const reject = (ev) => {
    setEvents((prev) => prev.filter((e) => e.id !== ev.id));
    notify(`“${ev.title}” request rejected`);
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
        <button className={`toggle ${autopilot ? 'on' : ''}`} onClick={() => setAutopilot(!autopilot)} aria-label="Toggle autopilot">
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
        <div key={ev.id} className="dsk-np-approval-card" onClick={() => navigate('/np/approvals/review')}>
          <div className="dsk-np-approval-hero" style={{ backgroundImage: `url(${ev.heroImg})` }}>
            {ev.status === 'Approved'
              ? <span className="badge" style={{ background: 'var(--green)', color: 'white' }}>✓ Approved</span>
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
            <p className="dsk-np-approval-submitted">{ev.submitted}</p>
          </div>
          <div className="dsk-np-approval-actions" onClick={(e) => e.stopPropagation()}>
            {ev.status === 'Approved' ? (
              <button className="ap-btn-outline dsk-np-review-btn" onClick={() => navigate('/np/approvals/review')}>View event</button>
            ) : (
              <>
                <button className="ap-btn-outline dsk-np-review-btn" onClick={() => navigate('/np/approvals/review')}>
                  {ev.status === 'Changes requested' ? 'View changes' : 'Review'}
                </button>
                <button className="ap-btn ap-btn-approve" onClick={() => approve(ev)}>Approve</button>
                <button className="ap-btn ap-btn-reject" onClick={() => reject(ev)}>Reject</button>
              </>
            )}
          </div>
        </div>
      ))}
      {toast && <div style={TOAST_STYLE}>{toast}</div>}
    </DesktopNpLayout>
  );
}
