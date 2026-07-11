import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, MapPin, Calendar } from 'lucide-react';
import NpBottomNav from '../../components/NpBottomNav';
import MobileAppHeader from '../../components/MobileAppHeader';

const EVENTS = [
  {
    id: 1,
    title: 'Coastal Cleanup Wave 2',
    organizer: 'Maya R.',
    date: 'Oct 28, 2025',
    location: 'Santa Monica Pier',
    desc: "Join us for our largest beach cleanup of the year. We're aiming to clear 500lbs of plastic",
    submitted: '2 hours ago',
    status: 'new',
    hasHero: true,
    hasAvatar: true,
    heroImg: '/events/breakneck-ridge-run/img1.jpg',
  },
  {
    id: 2,
    title: 'Art for All Workshop',
    organizer: 'David K.',
    date: null,
    location: null,
    desc: null,
    submitted: null,
    status: 'changes',
    hasHero: false,
    hasAvatar: false,
  },
];

const TOAST_STYLE = {
  position: 'fixed', bottom: 96, left: '50%', transform: 'translateX(-50%)',
  background: 'var(--dark)', color: '#fff', padding: '11px 20px',
  borderRadius: 'var(--radius-pill)', fontSize: 13, fontWeight: 600,
  zIndex: 100, boxShadow: '0 6px 24px rgba(0,0,0,0.28)', maxWidth: '80%', textAlign: 'center',
};

export default function NpApprovals() {
  const navigate = useNavigate();
  const [autopilot, setAutopilot] = useState(false);
  const [events, setEvents] = useState(EVENTS);
  const [toast, setToast] = useState('');
  const notify = (msg) => { setToast(msg); setTimeout(() => setToast(''), 1800); };
  const onKey = (fn) => (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(); }
  };

  const approve = (ev) => {
    setEvents((prev) => prev.filter((e) => e.id !== ev.id));
    notify(`“${ev.title}” approved & published`);
  };
  const reject = (ev) => {
    setEvents((prev) => prev.filter((e) => e.id !== ev.id));
    notify(`“${ev.title}” request rejected`);
  };

  return (
    <div className="phone-shell">
      <div className="screen screen--split">
        <div className="screen-scroll">
          <MobileAppHeader
            layout="bar"
            homePath="/np/home"
            left={(
              <button type="button" className="back-btn" onClick={() => navigate('/np/home')} aria-label="Back">
                <ChevronLeft size={18} />
              </button>
            )}
          />
          <div className="np-page-title-wrap">
            <h1 className="np-page-title">Requests</h1>
          </div>

          <div style={{ padding: '0 18px 16px' }}>
            {events.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: 14, padding: '48px 0' }}>
                All caught up — no pending requests.
              </div>
            )}
            {events.map((ev) => (
              <div
                key={ev.id}
                className="ap-card"
                style={{ cursor: 'pointer' }}
                role="button"
                tabIndex={0}
                aria-label={`Review ${ev.title}`}
                onClick={() => navigate('/np/approvals/review')}
                onKeyDown={onKey(() => navigate('/np/approvals/review'))}
              >
                {ev.hasHero && (
                  <div className="ap-hero">
                    <img src={ev.heroImg} alt={ev.title} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', top: 12, left: 12 }}>
                      <span className="badge-new-req">NEW REQUEST</span>
                    </div>
                  </div>
                )}

                <div className="ap-card-body">
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                    <h3 className="ap-card-title">{ev.title}</h3>
                    {ev.status === 'changes' && (
                      <span className="badge-changes" style={{ flexShrink: 0 }}>Changes requested</span>
                    )}
                  </div>

                  <div className={`ap-organizer-row${ev.date ? ' spaced' : ''}`}>
                    {ev.hasAvatar && (
                      <div className="ap-organizer-avatar">
                        {ev.organizer.split(' ').map((w) => w[0]).join('')}
                      </div>
                    )}
                    <span className="ap-meta-text">By {ev.organizer}</span>
                    {ev.hasAvatar && <span className="ap-verify-dot">✓</span>}
                  </div>

                  {ev.date && (
                    <div className="ap-meta-row">
                      <Calendar size={13} color="var(--text-secondary)" />
                      <span className="ap-meta-text">{ev.date}</span>
                    </div>
                  )}
                  {ev.location && (
                    <div className="ap-meta-row spaced">
                      <MapPin size={13} color="var(--text-secondary)" />
                      <span className="ap-meta-text">{ev.location}</span>
                    </div>
                  )}
                  {ev.desc && <p className="ap-desc">{ev.desc}</p>}
                  {ev.submitted && <p className="ap-submitted">Submitted {ev.submitted}</p>}

                  <div className="ap-actions" onClick={(e) => e.stopPropagation()}>
                    <button type="button" className="ap-btn ap-btn-reject" onClick={() => reject(ev)}>Reject</button>
                    <button
                      type="button"
                      className="ap-btn ap-btn-approve"
                      onClick={() => approve(ev)}
                    >
                      Approve
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="np-autopilot-footer-wrap">
          <div className="np-autopilot-footer">
            <div className="np-autopilot-footer-row">
              <button
                type="button"
                className={`toggle ${autopilot ? 'on' : ''}`}
                onClick={() => setAutopilot(!autopilot)}
                aria-label="Toggle autopilot publishing"
              >
                <div className="toggle-thumb" />
              </button>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p className="np-autopilot-footer-title">Autopilot publishing</p>
                <p className="np-autopilot-footer-desc">
                  Auto-approve events from trusted SEs. Turn off anytime.
                </p>
                <button
                  type="button"
                  className="np-autopilot-footer-link"
                  onClick={() => navigate('/np/settings/autopilot')}
                >
                  More Settings
                </button>
              </div>
            </div>
          </div>
        </div>

        <NpBottomNav active="events" />
        {toast && <div style={TOAST_STYLE}>{toast}</div>}
      </div>
    </div>
  );
}
