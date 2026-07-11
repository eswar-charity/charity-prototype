import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Plus, Heart, BookOpen, Waves, PawPrint } from 'lucide-react';
import MobileAppHeader from '../../components/MobileAppHeader';

const CAUSES = [
  { label: 'Add', isAdd: true },
  { label: 'Education', bg: 'linear-gradient(135deg,#7B1FA2,#AB47BC)', Icon: BookOpen },
  { label: 'Ocean', bg: 'linear-gradient(135deg,#0288D1,#26C6DA)', Icon: Waves },
  { label: 'Animals', bg: 'linear-gradient(135deg,#D32F2F,#EF5350)', Icon: PawPrint },
];

function EmptyIllustration() {
  return (
    <svg viewBox="0 0 280 200" width="100%" height="100%" style={{ position: 'absolute', inset: 0 }} aria-hidden="true">
      {/* Background */}
      <rect width="280" height="200" fill="transparent" />

      {/* Ground */}
      <ellipse cx="140" cy="175" rx="90" ry="12" fill="rgba(180,170,210,0.25)" />

      {/* Tree trunk */}
      <rect x="133" y="100" width="14" height="70" rx="6" fill="#8B7BA8" opacity="0.7" />

      {/* Tree canopy — lavender blob */}
      <ellipse cx="140" cy="88" rx="42" ry="40" fill="#B5A8D8" opacity="0.85" />
      <ellipse cx="118" cy="98" rx="22" ry="20" fill="#C3B8E2" opacity="0.7" />
      <ellipse cx="162" cy="96" rx="22" ry="20" fill="#C3B8E2" opacity="0.7" />

      {/* Red sun / ball */}
      <circle cx="200" cy="55" r="22" fill="var(--primary)" opacity="0.88" />

      {/* Two people silhouettes */}
      {/* Person 1 */}
      <circle cx="108" cy="148" r="9" fill="#2D2540" opacity="0.7" />
      <path d="M108 157 L108 182" stroke="#2D2540" strokeWidth="9" strokeLinecap="round" opacity="0.7" />
      <path d="M97 168 L119 163" stroke="#2D2540" strokeWidth="5" strokeLinecap="round" opacity="0.7" />

      {/* Person 2 */}
      <circle cx="172" cy="148" r="9" fill="#2D2540" opacity="0.7" />
      <path d="M172 157 L172 182" stroke="#2D2540" strokeWidth="9" strokeLinecap="round" opacity="0.7" />
      <path d="M161 165 L183 168" stroke="#2D2540" strokeWidth="5" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}

export default function EmptyFeed() {
  const navigate = useNavigate();
  const [notifyOn, setNotifyOn] = useState(false);

  return (
    <div className="phone-shell">
      <div className="screen">
        <MobileAppHeader
          layout="center"
          homePath="/guest/feed"
          left={(
            <button type="button" className="guest-signup-btn" onClick={() => navigate('/')}>
              Sign up
            </button>
          )}
          actions={(
            <button
              type="button"
              aria-label="Notifications"
              style={{ position: 'relative', background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex' }}
              onClick={() => setNotifyOn((on) => !on)}
            >
              <Bell size={22} color={notifyOn ? 'var(--blue)' : 'var(--dark)'} />
              {notifyOn && <span className="np-notify-dot" />}
            </button>
          )}
        />

        {/* Causes row */}
        <div className="story-row" style={{ padding: '0 18px 16px' }}>
          {CAUSES.map((c, i) => (
            <div
              key={i}
              className="story-bubble"
              role="button"
              tabIndex={0}
              aria-label={c.isAdd ? 'Add a cause' : `Browse ${c.label} events`}
              onClick={() => navigate(c.isAdd ? '/' : '/guest/feed')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate(c.isAdd ? '/' : '/guest/feed');
                }
              }}
            >
              {c.isAdd ? (
                <div style={{
                  width: 56, height: 56, borderRadius: '50%',
                  border: '1.5px dashed var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'var(--white)',
                }}>
                  <Plus size={18} color="var(--text-light)" />
                </div>
              ) : (
                <div className="story-circle" style={{ background: c.bg }}>
                  <c.Icon size={24} color="white" aria-hidden="true" />
                </div>
              )}
              <span className="story-label">{c.label}</span>
            </div>
          ))}
        </div>

        <div style={{ padding: '0 18px 20px' }}>
          {/* Empty state illustration */}
          <div className="empty-illo">
            <EmptyIllustration />
          </div>

          {/* Empty state text */}
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--dark)', marginBottom: 6 }}>
              Nothing live right now
            </p>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              New events are added every day.<br />Be the first to know.
            </p>
          </div>

          {/* CTA */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginBottom: 32 }}>
            <button
              className="btn-primary"
              style={{ width: 'auto', padding: '14px 32px', fontSize: 15 }}
              onClick={() => navigate('/guest/feed')}
            >
              Explore all causes
            </button>
            <button
              className="btn-ghost"
              style={{ fontSize: 14 }}
              onClick={() => navigate('/guest/feed')}
            >
              Refresh
            </button>
          </div>

          {/* Featured Story */}
          <div style={{ marginBottom: 12 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
              Featured Story
            </p>
            <div
              className="story-card"
              role="button"
              tabIndex={0}
              aria-label="View Clean Water Initiative story"
              onClick={() => navigate('/guest/event/upcoming')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate('/guest/event/upcoming');
                }
              }}
            >
              <div className="story-card-hero">
                {/* Warm forest image */}
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(160deg,#5D4037 0%,#795548 35%,#8D6E63 65%,#A1887F 100%)',
                }} />
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 60%)',
                }} />
                {/* Story badge */}
                <div style={{ position: 'absolute', top: 10, left: 10 }}>
                  <span className="badge" style={{ background: 'var(--blue)', color: 'white', fontSize: 10, fontWeight: 700 }}>
                    Story
                  </span>
                </div>
                {/* Well illustration overlay */}
                <div style={{
                  position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
                  width: 50, height: 40,
                  background: 'rgba(255,255,255,0.12)',
                  borderRadius: 4,
                }} />
              </div>
              <div style={{ padding: '12px 14px 14px' }}>
                <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--dark)', marginBottom: 4 }}>
                  Clean Water Initiative Hits Milestone
                </p>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                  Thanks to the incredible support from our community, over 5,000 families now...
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom nav */}
        <nav className="bottom-nav">
          <button className="nav-item active" onClick={() => navigate('/guest/empty')}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="var(--primary)" stroke="var(--primary)" strokeWidth="1.5">
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            </svg>
            <span>Home</span>
          </button>
          <button className="nav-item" onClick={() => navigate('/guest/feed')}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
            </svg>
            <span>Browse</span>
          </button>
          <button className="nav-item" onClick={() => navigate('/guest/feed')}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <span>Search</span>
          </button>
          <button className="nav-item" onClick={() => navigate('/guest/join')}>
            <Heart size={22} />
            <span>Saved</span>
          </button>
          <button className="nav-item" onClick={() => navigate('/')}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" />
            </svg>
            <span>Sign up</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
