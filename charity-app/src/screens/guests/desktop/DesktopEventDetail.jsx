import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Share2, Heart, X, Calendar, MapPin, Plus, Camera, ArrowUp,
  MessageCircle, Users, Play,
} from 'lucide-react';
import DesktopHeader from '../../../components/desktop/DesktopHeader';
import DesktopShareModal from '../../../components/desktop/DesktopShareModal';
import DesktopJoinGateModal from '../../../components/desktop/DesktopJoinGateModal';
import DesktopDonateGateModal from '../../../components/desktop/DesktopDonateGateModal';
import { events, liveActivities, slugify } from '../../../data/mockData';

const ev = events[0]; // Neon Night Run — the app's featured live event

const REEL = [
  { src: ev.photos[2], user: 'Emma T.', initials: 'ET', color: '#0D7377', time: '8m ago' },
  { src: ev.photos[3], user: 'Marcus L.', initials: 'ML', color: '#7B1FA2', time: '14m ago' },
];

const TABS = [
  { id: 'community', label: 'Community', sub: 'Photos & moments' },
  { id: 'chat', label: 'Chat', sub: 'Live conversation' },
  { id: 'support', label: 'Support', sub: 'Back the cause' },
];

function AboutModal({ onClose, following, onToggleFollow }) {
  return (
    <div className="dsk-modal-backdrop" onClick={onClose}>
      <div className="dsk-modal" onClick={(e) => e.stopPropagation()}>
        <div className="dsk-modal-head">
          <h3>About this event</h3>
          <button className="dsk-modal-close" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="dsk-modal-host-row">
          <div className="dsk-modal-host-avatar">{ev.initials}</div>
          <div style={{ flex: 1 }}>
            <p className="dsk-modal-host-lbl">HOSTED BY</p>
            <p className="dsk-modal-host-name">{ev.organizer}</p>
          </div>
          <button
            className={`dsk-follow-btn ${following ? 'active' : ''}`}
            onClick={onToggleFollow}
          >
            {following ? 'Following' : 'Follow'}
          </button>
        </div>

        <p className="dsk-modal-section-lbl">MISSION</p>
        <p className="dsk-modal-section-text">{ev.mission}</p>

        <p className="dsk-modal-section-lbl">THE STORY</p>
        <p className="dsk-modal-section-text">{ev.story}</p>

        <div className="dsk-modal-info-box">
          <div className="dsk-modal-info-row">
            <Calendar size={15} color="var(--primary)" />
            <div>
              <p className="dsk-modal-info-main">{ev.date}</p>
              <p className="dsk-modal-info-sub">{ev.startTime} – {ev.endTime} EST</p>
            </div>
          </div>
          <div className="dsk-modal-info-row">
            <MapPin size={15} color="var(--primary)" />
            <p className="dsk-modal-info-main">{ev.location}</p>
          </div>
          <div className="dsk-modal-tags">
            {ev.tags.map((t) => <span key={t} className="dsk-modal-tag">{t}</span>)}
          </div>
        </div>
      </div>
    </div>
  );
}

function CommunityTab() {
  return (
    <div className="dsk-tab-panel">
      <div className="dsk-panel-head">
        <span className="dsk-panel-title">Happening now</span>
        <span className="dsk-live-pill"><span className="live-dot" /> LIVE</span>
      </div>

      <div className="dsk-community-hero" style={{ backgroundImage: `url(${ev.photos[1]})` }}>
        <div className="dsk-community-hero-play"><Play size={22} fill="white" color="white" /></div>
        <div className="dsk-community-hero-caption">
          <div className="dsk-mini-avatar" style={{ background: 'linear-gradient(135deg,var(--primary),var(--blue))' }}>{ev.initials}</div>
          <span>{ev.organizer} · Just now</span>
        </div>
      </div>

      <div className="dsk-community-grid">
        {REEL.map((item) => (
          <div key={item.user} className="dsk-community-thumb" style={{ backgroundImage: `url(${item.src})` }}>
            <div className="dsk-community-hero-caption">
              <div className="dsk-mini-avatar" style={{ background: item.color }}>{item.initials}</div>
              <span>{item.user} · {item.time}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="dsk-activity-list">
        <div className="dsk-activity-item">
          <div className="dsk-activity-avatar" style={{ background: 'linear-gradient(135deg,#1976D2,#42A5F5)' }}>MR</div>
          <div>
            <div className="dsk-activity-header"><span>Michael R.</span><span className="dsk-activity-time">1h ago</span></div>
            <p className="dsk-activity-highlight">Just donated $50</p>
            <p className="dsk-activity-text">Such a beautiful event! So happy to support this amazing cause.</p>
          </div>
        </div>
        {liveActivities.map((item) => (
          <div key={item.id} className="dsk-activity-item">
            <div className="dsk-activity-avatar" style={{ background: `linear-gradient(135deg, ${item.color}, ${item.color}99)` }}>{item.initials}</div>
            <div>
              <div className="dsk-activity-header"><span>{item.user}{item.isOrganizer && <span className="dsk-verify-dot">✓</span>}</span><span className="dsk-activity-time">{item.time}</span></div>
              <p className="dsk-activity-text">{item.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const CHAT_SEED = [
  { id: 1, initials: ev.initials, color: 'linear-gradient(135deg,var(--primary),var(--blue))', name: ev.organizer, host: true, text: "Welcome everyone! We're starting the main presentation in about 5 minutes. Feel free to grab a virtual seat and say hi!" },
  { id: 2, initials: 'ML', color: 'linear-gradient(135deg,#0D7377,#14A085)', name: 'Marcus L.', text: 'So excited for this! Tuning in from Chicago. 👋', reaction: '🎉 12' },
  { id: 3, initials: 'ME', color: 'linear-gradient(135deg,#7B1FA2,#AB47BC)', mine: true, text: "Incredible turnout already. Can't wait for the auction segment!", sent: true },
  { id: 4, initials: 'EJ', color: 'linear-gradient(135deg,#1976D2,#42A5F5)', name: 'Emma J.', text: 'This is incredible! First time attending a Charity Hub event 🙌' },
];

function ChatTab({ onNeedJoin }) {
  const [value, setValue] = useState('');
  const [messages, setMessages] = useState(CHAT_SEED);

  const send = () => {
    const text = value.trim();
    if (!text) return;
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        initials: 'ME',
        color: 'linear-gradient(135deg,#7B1FA2,#AB47BC)',
        mine: true,
        text,
        sent: true,
      },
    ]);
    setValue('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="dsk-tab-panel dsk-chat-panel">
      <div className="dsk-chat-room-header">
        <div className="chat-room-title">
          Chat
          <span className="chat-count-chip">
            {ev.chatCount} here
            <span className="chat-live-indicator" />
          </span>
        </div>
        <p className="chat-room-sub">One room. Real people, real cause. Say hi.</p>
      </div>

      <div className="dsk-chat-messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`chat-msg${msg.mine ? ' mine' : ''}`}>
            <div className="chat-msg-avatar" style={{ background: msg.color }}>{msg.initials}</div>
            <div className="chat-msg-body">
              {!msg.mine && (
                <div className="chat-msg-name">
                  {msg.name}
                  {msg.host && <span className="chat-host-badge">Host</span>}
                </div>
              )}
              <div className="chat-bubble">{msg.text}</div>
              {msg.reaction && <div className="chat-reaction">{msg.reaction}</div>}
              {msg.sent && <p className="chat-sent">Sent</p>}
            </div>
          </div>
        ))}
      </div>

      <div className="dsk-chat-input-bar">
        <button type="button" className="chat-input-action" aria-label="Add attachment" onClick={onNeedJoin}>
          <Plus size={18} />
        </button>
        <button type="button" className="chat-input-action" aria-label="Add photo" onClick={onNeedJoin}>
          <Camera size={18} />
        </button>
        <input
          className="dsk-chat-input-field"
          placeholder="Say something..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button type="button" className="chat-send-btn" aria-label="Send message" onClick={send} disabled={!value.trim()}>
          <ArrowUp size={16} color="white" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}

function SupportTab({ onDonate }) {
  const [amount, setAmount] = useState(25);
  return (
    <div className="dsk-tab-panel">
      <p className="dsk-panel-title" style={{ marginBottom: 14 }}>Support {ev.nonprofit}</p>

      <div className="support-raised-row">
        <span className="support-raised-label">Raised so far</span>
        <span className="support-raised-amount">${ev.raised.toLocaleString()}</span>
      </div>
      <div className="support-progress-track"><div className="support-progress-fill" style={{ width: '57%' }} /></div>

      <p className="support-amount-label">Select amount</p>
      <div className="support-amount-row">
        {[10, 25, 50].map((amt) => (
          <button key={amt} className={`support-amount-btn ${amount === amt ? 'active' : ''}`} onClick={() => setAmount(amt)}>${amt}</button>
        ))}
        <button className={`support-amount-btn ${amount === 'other' ? 'active' : ''}`} onClick={() => setAmount('other')}>Other</button>
      </div>

      <div className="support-card-fields">
        <div style={{ position: 'relative' }}>
          <input className="support-field" style={{ width: '100%' }} placeholder="Card number" />
          <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'var(--blue)', fontWeight: 700 }}>VISA</span>
        </div>
        <div className="support-card-row">
          <input className="support-field" placeholder="MM / YY" />
          <input className="support-field" placeholder="CVV" />
        </div>
        <input className="support-field" style={{ width: '100%' }} placeholder="Name on card" />
      </div>

      <button type="button" className="dsk-support-btn" onClick={() => onDonate(amount)}>
        Support with {typeof amount === 'number' ? `$${amount}` : 'custom amount'}
      </button>
    </div>
  );
}

export default function DesktopEventDetail() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('community');
  const [liked, setLiked] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [following, setFollowing] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showJoinGate, setShowJoinGate] = useState(false);
  const [showDonateGate, setShowDonateGate] = useState(false);
  const [donateAmount, setDonateAmount] = useState(25);

  const shareUrl = `https://charity.hub/event/${ev.key}`;

  return (
    <div className="dsk-page">
      <DesktopHeader active="Discover" />

      <div className="dsk-ev-hero" style={{ backgroundImage: `url(${ev.photos[1]})` }}>
        <div className="dsk-ev-hero-gradient" />
        <div className="dsk-ev-hero-top">
          {ev.isLive && (
            <span className="dsk-ev-hero-live"><span className="live-dot" /> DOORS OPEN · LIVE NOW</span>
          )}
          <div className="dsk-ev-hero-actions">
            <button className="ev-hero-btn" onClick={() => setShowAbout(true)} aria-label="Event info">ⓘ</button>
            <button className="ev-hero-btn" onClick={() => setShowShare(true)} aria-label="Share"><Share2 size={16} color="white" /></button>
            <button className="ev-hero-btn" onClick={() => setLiked(!liked)} aria-label="Like">
              <Heart size={16} color={liked ? '#FF6B6B' : 'white'} fill={liked ? '#FF6B6B' : 'none'} />
            </button>
          </div>
        </div>
        <div className="dsk-ev-hero-bottom">
          <h1 className="dsk-ev-hero-title">#{ev.title.replace(/\s+/g, '')}</h1>
          <p className="dsk-ev-hero-sub">PRESENTED BY <span onClick={() => navigate(`/guest/organizer/${slugify(ev.organizer)}`)}>{ev.organizer}</span></p>
        </div>
      </div>

      <main className="dsk-main">
        <div className="dsk-container dsk-ev-grid">
          <div className="dsk-ev-content">
            <div className="dsk-ev-tabs">
              {TABS.map((tab) => (
                <button key={tab.id} className={`dsk-ev-tab ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
                  <span className="dsk-ev-tab-label">{tab.label}</span>
                  <span className="dsk-ev-tab-sub">{tab.sub}</span>
                </button>
              ))}
            </div>

            {activeTab === 'community' && <CommunityTab />}
            {activeTab === 'chat' && <ChatTab onNeedJoin={() => setShowJoinGate(true)} />}
            {activeTab === 'support' && (
              <SupportTab onDonate={(amt) => { setDonateAmount(amt); setShowDonateGate(true); }} />
            )}
          </div>

          <aside className="dsk-ev-sidebar">
            <div className="dsk-sidebar-card">
              <div className="dsk-sidebar-np-row">
                <div className="dsk-sidebar-np-avatar" style={{ background: ev.npBg }}>{ev.npInitials}</div>
                <div>
                  <p className="dsk-sidebar-np-name">{ev.nonprofit}</p>
                  <p className="dsk-sidebar-np-sub">Registered 501(c)(3)</p>
                </div>
              </div>
              <button className="dsk-sidebar-back-btn" onClick={() => setActiveTab('support')}>Back this event</button>
              <button className="dsk-sidebar-share-btn" onClick={() => setShowShare(true)}>Share</button>
              <div className="dsk-sidebar-stats">
                <span><Users size={13} /> {ev.backed} backing</span>
                <button type="button" className="dsk-sidebar-stat-btn" onClick={() => setActiveTab('chat')}>
                  <MessageCircle size={13} /> {ev.chatCount} in chat
                </button>
              </div>
              <button className="dsk-sidebar-details-link" onClick={() => setShowAbout(true)}>Event details ⓘ</button>
            </div>
          </aside>
        </div>
      </main>

      {showAbout && (
        <AboutModal
          onClose={() => setShowAbout(false)}
          following={following}
          onToggleFollow={() => setFollowing((f) => !f)}
        />
      )}

      {showDonateGate && (
        <DesktopDonateGateModal
          open={showDonateGate}
          onClose={() => setShowDonateGate(false)}
          amount={donateAmount}
          eventTitle={ev.title}
          nonprofit={ev.nonprofit}
          npInitials={ev.npInitials}
          npBg={ev.npBg}
        />
      )}

      {showJoinGate && (
        <DesktopJoinGateModal
          open={showJoinGate}
          onClose={() => setShowJoinGate(false)}
          eventTitle={ev.title}
          nonprofit={ev.nonprofit}
          npInitials={ev.npInitials}
          npBg={ev.npBg}
        />
      )}

      {showShare && (
        <DesktopShareModal
          open={showShare}
          onClose={() => setShowShare(false)}
          url={shareUrl}
          title={`#${ev.title.replace(/\s+/g, '')}`}
          subtitle={`${ev.nonprofit} · verified`}
          previewStyle={{ backgroundImage: `url(${ev.photos[1]})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        />
      )}
    </div>
  );
}
