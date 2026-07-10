import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Share2, Bookmark, Calendar, MapPin, Users, ChevronRight } from 'lucide-react';
import DesktopHeader from '../../../components/desktop/DesktopHeader';
import DesktopShareModal from '../../../components/desktop/DesktopShareModal';
import { NonprofitLearnMoreModal, EventBackersModal } from '../../../components/event/EventModals';
import { events, slugify } from '../../../data/mockData';

const ev = events[2]; // Give Now, Apré Later — the app's featured upcoming event
const BACKER_COLORS = ['var(--primary)', '#0D7377', '#7B1FA2', '#1976D2', '#1A6EB5'];

const NP_DESCRIPTION = 'Books for Communities expands access to reading materials and literacy programs for underserved schools across New England. Every event on Charity Hub helps them reach more students.';

export default function DesktopEventDetailUpcoming() {
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);
  const [following, setFollowing] = useState(false);
  const [backed, setBacked] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showNpModal, setShowNpModal] = useState(false);
  const [showBackersModal, setShowBackersModal] = useState(false);

  const shareUrl = `https://charity.hub/event/${ev.key}`;

  return (
    <div className="dsk-page">
      <DesktopHeader active="Discover" />

      <div className="dsk-ev-hero" style={{ backgroundImage: `url(${ev.cover})` }}>
        <div className="dsk-ev-hero-gradient" />
        <div className="dsk-ev-hero-top">
          <span className="dsk-ev-hero-pill"><Calendar size={12} /> {ev.date} · {ev.startTime}</span>
          <div className="dsk-ev-hero-actions">
            <button className="ev-hero-btn" onClick={() => setSaved(!saved)} aria-label="Save event">
              <Bookmark size={16} color="white" fill={saved ? 'white' : 'none'} />
            </button>
            <button className="ev-hero-btn" onClick={() => setShowShare(true)} aria-label="Share"><Share2 size={16} color="white" /></button>
          </div>
        </div>
        <div className="dsk-ev-hero-bottom">
          <h1 className="dsk-ev-hero-title">#{ev.title.replace(/[\s,''']+/g, '')}</h1>
          <p className="dsk-ev-hero-sub">
            <MapPin size={12} style={{ verticalAlign: -1, marginRight: 4 }} />{ev.location} · PRESENTED BY{' '}
            <span onClick={() => navigate(`/guest/organizer/${slugify(ev.organizer)}`)}>{ev.organizer}</span>
          </p>
        </div>
      </div>

      <main className="dsk-main">
        <div className="dsk-container dsk-ev-grid">
          <div className="dsk-ev-content">
            <div className="dsk-tab-panel">
              <div className="dsk-np-info-row">
                <div className="dsk-sidebar-np-avatar" style={{ background: ev.npBg }}>{ev.npInitials}</div>
                <div style={{ flex: 1 }}>
                  <p className="dsk-sidebar-np-name">{ev.nonprofit}</p>
                  <p className="dsk-sidebar-np-sub">Verified nonprofit</p>
                </div>
                <button
                  className="btn-ghost"
                  style={{ fontSize: 13 }}
                  onClick={() => setShowNpModal(true)}
                >Learn more</button>
              </div>

              <div
                className="dsk-upcoming-backers-row"
                style={{ cursor: 'pointer' }}
                onClick={() => setShowBackersModal(true)}
              >
                <div className="av-stack">
                  {BACKER_COLORS.map((c, i) => <div key={i} className="av" style={{ background: c }} />)}
                </div>
                <span className="dsk-upcoming-backers-text">{ev.backed} people are backing this</span>
                <ChevronRight size={16} color="var(--text-light)" style={{ marginLeft: 'auto' }} />
              </div>

              <div className="dsk-upcoming-organiser-row">
                <div className="dsk-sidebar-np-avatar" style={{ background: ev.npBg }}>{ev.initials}</div>
                <div style={{ flex: 1 }}>
                  <p className="dsk-sidebar-np-name">{ev.organizer} <span className="dsk-verify-dot">✓</span></p>
                  <p className="dsk-sidebar-np-sub">Organiser</p>
                </div>
                <button
                  className="follow-btn"
                  style={following ? { background: 'var(--primary)', color: 'white', borderColor: 'var(--primary)' } : {}}
                  onClick={() => setFollowing(!following)}
                >
                  {following ? 'Following' : 'Follow'}
                </button>
              </div>

              <p className="dsk-panel-title" style={{ margin: '22px 0 10px' }}>The Mission</p>
              <p className="dsk-modal-section-text" style={{ fontSize: 14 }}>{ev.subtitle}</p>

              <div className="dsk-community-grid" style={{ marginTop: 20 }}>
                {ev.photos.slice(1, 3).map((src) => (
                  <div key={src} className="dsk-community-thumb" style={{ backgroundImage: `url(${src})` }} />
                ))}
              </div>
            </div>
          </div>

          <aside className="dsk-ev-sidebar">
            <div className="dsk-sidebar-card">
              <div className="dsk-sidebar-np-row">
                <div className="dsk-sidebar-np-avatar" style={{ background: ev.npBg }}>{ev.npInitials}</div>
                <div>
                  <p className="dsk-sidebar-np-name">{ev.nonprofit}</p>
                  <p className="dsk-sidebar-np-sub">{ev.date}</p>
                </div>
              </div>
              <button
                className="dsk-sidebar-back-btn"
                style={backed ? { background: 'var(--green)' } : {}}
                onClick={() => setBacked(!backed)}
              >
                {backed ? 'Backed ✓' : 'Back this event'}
              </button>
              <button className="dsk-sidebar-share-btn" onClick={() => setShowShare(true)}>Share</button>
              <div className="dsk-sidebar-stats">
                <span><Users size={13} /> {ev.backed} backing</span>
                <span>{ev.joined} joined</span>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {showShare && (
        <DesktopShareModal
          open={showShare}
          onClose={() => setShowShare(false)}
          url={shareUrl}
          title={`#${ev.title.replace(/[\s,''']+/g, '')}`}
          subtitle={`${ev.nonprofit} · verified`}
          previewStyle={{ backgroundImage: `url(${ev.cover})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        />
      )}

      <NonprofitLearnMoreModal
        open={showNpModal}
        onClose={() => setShowNpModal(false)}
        name={ev.nonprofit}
        initials={ev.npInitials}
        avatarStyle={{ background: ev.npBg }}
        category={ev.category}
        description={NP_DESCRIPTION}
        onViewProfile={() => { setShowNpModal(false); navigate('/np/profile'); }}
      />

      <EventBackersModal
        open={showBackersModal}
        onClose={() => setShowBackersModal(false)}
        count={ev.backed}
        eventTitle={ev.title}
        raised={ev.raised}
      />
    </div>
  );
}
