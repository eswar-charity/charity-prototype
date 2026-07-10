import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Info, Share2, Heart,
  Plus, Camera, ArrowUp, MoreHorizontal,
} from 'lucide-react';
import { events, liveActivities } from '../../data/mockData';

const ev = events[0]; // Neon Night Run

/* ── Community Tab ──────────────────────────────────────── */
function CommunityTab() {
  const REEL = [
    { src: ev.photos[1], user: 'Sarah J.',  initials: 'SJ', color: 'var(--primary)', time: '2m ago' },
    { src: ev.photos[2], user: 'Emma T.',   initials: 'ET', color: '#0D7377', time: '8m ago' },
    { src: ev.photos[3], user: 'Marcus L.', initials: 'ML', color: '#7B1FA2', time: '14m ago' },
    { src: ev.photos[4], user: 'Priya M.',  initials: 'PM', color: '#1976D2', time: '22m ago' },
  ];

  return (
    <>
      <div className="ev-section-head">
        <span className="ev-section-title">Happening now</span>
        <span className="ev-live-pill">
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--primary)', display: 'inline-block' }} />
          LIVE
        </span>
      </div>

      {/* Photo reel */}
      <div className="photo-reel">
        {REEL.map((item, i) => (
          <div key={i} className="photo-reel-item">
            <img src={item.src} alt={item.user} />
            <div className="photo-reel-caption">
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{
                  width: 20, height: 20, borderRadius: '50%', background: item.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 8, fontWeight: 700, color: 'white', flexShrink: 0,
                }}>{item.initials}</div>
                <span className="photo-reel-name">{item.user}</span>
              </div>
              <span className="photo-reel-time">{item.time}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Dot pagination */}
      <div className="reel-dots">
        {REEL.map((_, i) => (
          <div key={i} className={`reel-dot ${i === 0 ? 'active' : ''}`} />
        ))}
      </div>

      {/* Donation activity */}
      <div className="ev-activity-item">
        <div className="ev-activity-avatar" style={{ background: 'linear-gradient(135deg,#1976D2,#42A5F5)' }}>MR</div>
        <div style={{ flex: 1 }}>
          <div className="ev-activity-header">
            <span className="ev-activity-user">Michael R.</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="ev-activity-time">1h ago</span>
              <MoreHorizontal size={14} color="var(--text-light)" />
            </div>
          </div>
          <p className="ev-activity-text" style={{ color: 'var(--primary)', fontWeight: 600 }}>Just donated $50</p>
          <p className="ev-activity-text" style={{ marginTop: 3 }}>
            Such a beautiful event! So happy to support this amazing cause.
          </p>
        </div>
      </div>

      {liveActivities.map((item) => (
        <div key={item.id} className="ev-activity-item">
          <div
            className="ev-activity-avatar"
            style={{ background: `linear-gradient(135deg, ${item.color}, ${item.color}99)` }}
          >{item.initials}</div>
          <div style={{ flex: 1 }}>
            <div className="ev-activity-header">
              <span className="ev-activity-user">
                {item.user}
                {item.isOrganizer && (
                  <span style={{
                    display: 'inline-flex', width: 13, height: 13, borderRadius: '50%',
                    background: 'var(--blue)', color: 'white', fontSize: 8,
                    alignItems: 'center', justifyContent: 'center', verticalAlign: 'middle', marginLeft: 4,
                  }}>✓</span>
                )}
              </span>
              <span className="ev-activity-time">{item.time}</span>
            </div>
            <p className="ev-activity-text" style={{ marginTop: 3 }}>{item.text}</p>
            {item.hasImage && (
              <div style={{ marginTop: 8, height: 100, borderRadius: 10, overflow: 'hidden' }}>
                <img src={item.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}
          </div>
        </div>
      ))}
      <div style={{ height: 20 }} />
    </>
  );
}

/* ── Chat Tab ────────────────────────────────────────────── */
function ChatTabHeader() {
  return (
    <div className="chat-room-header">
      <div className="chat-room-title">
        Chat
        <span className="chat-count-chip">
          {ev.chatCount} here
          <span className="chat-live-indicator" />
        </span>
      </div>
      <p className="chat-room-sub">One room. Real people, real cause. Say hi.</p>
    </div>
  );
}

function ChatTabMessages() {
  return (
    <div className="chat-messages">
        {/* Host */}
        <div className="chat-msg">
          <div className="chat-msg-avatar" style={{ background: 'linear-gradient(135deg,var(--primary),var(--blue))' }}>SJ</div>
          <div className="chat-msg-body">
            <div className="chat-msg-name">
              {ev.organizer}
              <span style={{
                display: 'inline-flex', width: 14, height: 14, borderRadius: '50%',
                background: 'var(--blue)', color: 'white', fontSize: 9,
                alignItems: 'center', justifyContent: 'center',
              }}>✓</span>
              <span className="chat-host-badge">Host</span>
            </div>
            <div className="chat-bubble">
              Welcome everyone! We're starting the main presentation in about 5 minutes.
              Feel free to grab a virtual seat and say hi!
            </div>
          </div>
        </div>

        {/* Marcus */}
        <div className="chat-msg">
          <div className="chat-msg-avatar" style={{ background: 'linear-gradient(135deg,#0D7377,#14A085)' }}>ML</div>
          <div className="chat-msg-body">
            <div className="chat-msg-name">Marcus L.</div>
            <div className="chat-bubble">So excited for this! Tuning in from Chicago. 👋</div>
            <div className="chat-reaction">🎉 12</div>
          </div>
        </div>

        {/* My message */}
        <div className="chat-msg mine">
          <div className="chat-msg-avatar" style={{ background: 'linear-gradient(135deg,#7B1FA2,#AB47BC)' }}>ME</div>
          <div className="chat-msg-body">
            <div className="chat-bubble">
              Incredible turnout already. Can't wait for the auction segment!
            </div>
            <p className="chat-sent">Sent</p>
          </div>
        </div>

        {/* Emma */}
        <div className="chat-msg">
          <div className="chat-msg-avatar" style={{ background: 'linear-gradient(135deg,#1976D2,#42A5F5)' }}>EJ</div>
          <div className="chat-msg-body">
            <div className="chat-msg-name">Emma J.</div>
            <div className="chat-bubble">
              This is incredible! First time attending a Charity Hub event 🙌
            </div>
          </div>
        </div>

        <div style={{ height: 8 }} />
    </div>
  );
}

function ChatInputBar({ value, onChange, onGate }) {
  return (
    <div className="chat-input-bar">
      <div className="chat-input-pill">
        <button type="button" className="chat-input-action" aria-label="Add attachment" onClick={onGate}>
          <Plus size={20} />
        </button>
        <button type="button" className="chat-input-action" aria-label="Add photo" onClick={onGate}>
          <Camera size={20} />
        </button>
        <input
          className="chat-input-field"
          placeholder="Can't wait for this..."
          value={value}
          onChange={onChange}
          onFocus={onGate}
        />
        <button type="button" className="chat-send-btn" aria-label="Send message" onClick={onGate}>
          <ArrowUp size={18} color="white" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}

/* ── Support Tab ─────────────────────────────────────────── */
function SupportTab({ selectedAmount, onSelectAmount, onDonate, onViewStructure }) {
  return (
    <div className="support-content">
      {/* Charity hierarchy */}
      <div className="support-hierarchy-row">
        <span className="support-hierarchy-title">Charity Hierarchy</span>
        <button
          onClick={onViewStructure}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          <span className="support-hierarchy-link">View structure</span>
        </button>
      </div>

      {/* NP row */}
      <div className="support-np-row">
        <span className="support-np-icon">∞</span>
        <span className="support-np-name">{ev.nonprofit}</span>
        <span className="w9-badge"><span>✓</span> W-9</span>
      </div>

      {/* Raised */}
      <div className="support-raised-row">
        <span className="support-raised-label">Raised so far</span>
        <span className="support-raised-amount">${ev.raised.toLocaleString()}</span>
      </div>
      <div className="support-progress-track">
        <div className="support-progress-fill" style={{ width: '57%' }} />
      </div>

      {/* Amount selector */}
      <p className="support-amount-label">Select Amount</p>
      <div className="support-amount-row">
        {[10, 25, 50].map((amt) => (
          <button
            key={amt}
            className={`support-amount-btn ${selectedAmount === amt ? 'active' : ''}`}
            onClick={() => onSelectAmount(amt)}
          >
            ${amt}
          </button>
        ))}
        <button
          className={`support-amount-btn ${selectedAmount === 'other' ? 'active' : ''}`}
          onClick={() => onSelectAmount('other')}
        >
          Other
        </button>
      </div>

      {/* Card fields */}
      <div className="support-card-fields">
        <div style={{ position: 'relative' }}>
          <input className="support-field" style={{ width: '100%' }} placeholder="Card number" />
          <span style={{
            position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
            fontSize: 12, color: 'var(--blue)', fontWeight: 700, pointerEvents: 'none',
          }}>VISA</span>
        </div>
        <div className="support-card-row">
          <input className="support-field" placeholder="MM / YY" />
          <input className="support-field" placeholder="CVV" />
        </div>
        <input className="support-field" style={{ width: '100%' }} placeholder="Name on card" />
      </div>

      <button className="btn-primary" onClick={onDonate}>
        Donate {typeof selectedAmount === 'number' ? `$${selectedAmount}` : 'Amount'}
      </button>
    </div>
  );
}

/* ── Main Component ──────────────────────────────────────── */
const TABS = [
  { id: 'community', icon: '🖼', label: 'Community', sub: 'Photos & moments' },
  { id: 'chat',      icon: '💬', label: 'Chat',      sub: 'Live conversation' },
  { id: 'support',   icon: '💝', label: 'Support',   sub: 'Back the cause'   },
];

export default function EventDetailLive() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab]         = useState('community');
  const [liked, setLiked]                 = useState(false);
  const [selectedAmount, setSelectedAmount] = useState(25);
  const [chatInput, setChatInput]         = useState('');
  const [showAbout, setShowAbout]         = useState(false);
  const [toast, setToast]                 = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 1800);
  };

  return (
    <div className="phone-shell">
      <div className="detail-screen">

        {/* ── Hero ── */}
        <div className="ev-hero">
          <img className="ev-hero-img" src="/events/neon-night/img2.jpg" alt="Neon Night Run" />
          <div className="ev-hero-gradient" />

          {/* Top nav */}
          <div className="ev-hero-nav">
            <button className="ev-hero-btn" onClick={() => navigate(-1)}>
              <ChevronLeft size={18} color="white" />
            </button>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="ev-hero-btn" onClick={() => setShowAbout(true)} aria-label="Event details">
                <Info size={16} color="white" />
              </button>
              <button className="ev-hero-btn" onClick={() => navigate('/guest/share')} aria-label="Share">
                <Share2 size={16} color="white" />
              </button>
            </div>
          </div>

          {/* Hero content overlay */}
          <div className="ev-hero-content">
            <div className="ev-hero-live">
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'white', display: 'inline-block' }} />
              DOORS OPEN · LIVE NOW
            </div>
            <h1 className="ev-hero-title">#{ev.title.replace(/\s+/g, '')}</h1>
            <p className="ev-hero-subtitle">{ev.subtitle.split('.')[0]}.</p>
            <div className="ev-hero-meta">
              <div>
                <p className="ev-presented">PRESENTED BY</p>
                <p className="ev-presented-name">{ev.organizer}</p>
                <button className="ev-details-link" onClick={() => setShowAbout(true)}>Event details ⓘ</button>
              </div>
              <button className="ev-heart-btn" onClick={() => setLiked(!liked)}>
                <Heart
                  size={18}
                  color={liked ? '#FF6B6B' : 'white'}
                  fill={liked ? '#FF6B6B' : 'none'}
                />
              </button>
            </div>
          </div>
        </div>

        {/* ── Bottom sheet ── */}
        <div className="ev-sheet">
          <div className="ev-sheet-handle" />

          {/* Tab bar */}
          <div className="ev-tabs">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                className={`ev-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="ev-tab-icon">{tab.icon}</span>
                <span className="ev-tab-label">{tab.label}</span>
                <span className="ev-tab-sub">{tab.sub}</span>
              </button>
            ))}
          </div>

          {/* Scrollable tab content */}
          {activeTab === 'chat' ? (
            <>
              <ChatTabHeader />
              <div className="ev-tab-content">
                <ChatTabMessages />
              </div>
              <ChatInputBar
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onGate={() => navigate('/guest/join')}
              />
            </>
          ) : (
            <div className="ev-tab-content">
              {activeTab === 'community' && <CommunityTab />}
              {activeTab === 'support' && (
                <SupportTab
                  selectedAmount={selectedAmount}
                  onSelectAmount={setSelectedAmount}
                  onDonate={() => navigate('/guest/donate')}
                  onViewStructure={() => showToast('Funds go to Youth Health Fund (verified 501c3)')}
                />
              )}
            </div>
          )}
        </div>

        {/* About / event details sheet */}
        {showAbout && (
          <div className="overlay-bg" onClick={() => setShowAbout(false)}>
            <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
              <div className="sheet-handle" />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--dark)' }}>{ev.title}</h2>
                <button
                  onClick={() => setShowAbout(false)}
                  aria-label="Close"
                  style={{
                    width: 30, height: 30, borderRadius: '50%',
                    background: 'var(--border)', border: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  }}
                >✕</button>
              </div>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', letterSpacing: 0.5, marginBottom: 6 }}>MISSION</p>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 14 }}>{ev.mission}</p>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', letterSpacing: 0.5, marginBottom: 6 }}>THE STORY</p>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 18 }}>{ev.story}</p>
              <button className="btn-primary" onClick={() => { setShowAbout(false); navigate('/guest/donate'); }}>
                Back this cause
              </button>
            </div>
          </div>
        )}

        {toast && (
          <div style={{
            position: 'absolute', bottom: 100, left: '50%', transform: 'translateX(-50%)',
            background: 'var(--dark)', color: 'white', padding: '10px 18px',
            borderRadius: 'var(--radius-pill)', fontSize: 13, fontWeight: 600,
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)', zIndex: 100, maxWidth: '80%', textAlign: 'center',
          }}>{toast}</div>
        )}

      </div>
    </div>
  );
}
