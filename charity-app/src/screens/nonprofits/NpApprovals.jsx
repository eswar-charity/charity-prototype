import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, MapPin, Calendar } from 'lucide-react';
import NpBottomNav from '../../components/NpBottomNav';

const FILTERS = ['All (3)', 'Pending', 'Changes requested', 'Approved'];

const EVENTS = [
  {
    id: 1,
    title: 'Breakneck Ridge Run',
    organizer: 'Maya R.',
    date: 'Oct 28, 2025',
    location: 'Hudson Valley, NY',
    desc: 'A trail run through the Hudson Valley raising awareness for clean waterways. All skill levels welcome.',
    submitted: '2 hours ago',
    status: 'new',
    hasHero: true,
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
    heroBg: null,
  },
];

export default function NpApprovals() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('All (3)');

  return (
    <div className="phone-shell">
      <div className="screen">
        {/* Header */}
        <div style={{ padding: '52px 18px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <button className="back-btn" onClick={() => navigate('/np/home')}>
              <ChevronLeft size={18} />
            </button>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--dark)' }}>Event approvals</h1>
          </div>

          {/* Filter tabs */}
          <div className="ap-tabs" style={{ marginBottom: 16 }}>
            {FILTERS.map((f) => (
              <button
                key={f}
                className={`ap-tab ${activeFilter === f ? 'active' : ''}`}
                onClick={() => setActiveFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding: '0 18px 24px' }}>
          {EVENTS.map((ev) => (
            <div key={ev.id} className="ap-card">
              {/* Hero (if applicable) */}
              {ev.hasHero && (
                <div style={{ position: 'relative', height: 140, overflow: 'hidden' }}>
                  <img src={ev.heroImg} alt={ev.title} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 55%)',
                  }} />
                  <div style={{ position: 'absolute', top: 10, left: 10 }}>
                    <span className="badge-new-req">NEW REQUEST</span>
                  </div>
                </div>
              )}

              <div className="ap-card-body">
                {/* Status badge for non-hero cards */}
                {!ev.hasHero && ev.status === 'changes' && (
                  <div style={{ marginBottom: 8 }}>
                    <span className="badge-changes">Changes requested</span>
                  </div>
                )}

                <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--dark)', marginBottom: 6 }}>
                  {ev.title}
                </h3>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%',
                    background: 'linear-gradient(135deg,#F5604A,#FF8A65)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 8, fontWeight: 700, color: 'white',
                  }}>
                    {ev.organizer.split(' ').map(w => w[0]).join('')}
                  </div>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>By {ev.organizer}</span>
                  <span style={{
                    width: 13, height: 13, borderRadius: '50%', background: 'var(--blue)',
                    color: 'white', fontSize: 8, fontWeight: 700,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  }}>✓</span>
                </div>

                {ev.date && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                    <Calendar size={12} color="var(--text-secondary)" />
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{ev.date}</span>
                  </div>
                )}
                {ev.location && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
                    <MapPin size={12} color="var(--text-secondary)" />
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{ev.location}</span>
                  </div>
                )}
                {ev.desc && (
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 8 }}>
                    {ev.desc}
                  </p>
                )}
                {ev.submitted && (
                  <p style={{ fontSize: 12, color: 'var(--text-light)', marginBottom: 4 }}>
                    Submitted {ev.submitted}
                  </p>
                )}

                {/* Action buttons */}
                <div className="ap-actions">
                  {ev.status === 'changes' ? (
                    <button
                      className="ap-btn ap-btn-outline"
                      onClick={() => navigate('/np/approvals/request-changes')}
                    >
                      View changes
                    </button>
                  ) : (
                    <button
                      className="ap-btn ap-btn-outline"
                      onClick={() => navigate('/np/approvals/request-changes')}
                    >
                      Request changes
                    </button>
                  )}
                  <button className="ap-btn ap-btn-reject">Reject</button>
                  <button
                    className="ap-btn ap-btn-approve"
                    onClick={() => navigate('/np/approvals/review')}
                  >
                    Approve
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Autopilot note */}
          <div
            className="info-banner"
            style={{ cursor: 'pointer' }}
            onClick={() => navigate('/np/settings/autopilot')}
          >
            <div style={{
              width: 28, height: 28, borderRadius: '50%', background: 'var(--blue-soft)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <span style={{ fontSize: 14 }}>⚡</span>
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--dark)', marginBottom: 2 }}>Autopilot publishing</p>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                Auto-approve trusted SEs instantly. Tap to configure →
              </p>
            </div>
          </div>
        </div>

        <NpBottomNav active="events" />
      </div>
    </div>
  );
}
