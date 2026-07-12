import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Info, Share2, Heart,
  Plus, Camera, ArrowUp, MoreHorizontal,
  Images, MessageCircle, HandHeart, PartyPopper, Check, UserPlus,
} from 'lucide-react';
import { events, liveActivities, buildDonationSuccessUrl, getHappeningNowReel, EVENT_CREATOR } from '../../data/mockData';

const ev = events[0]; // Neon Night Run

/* ── Community Tab ──────────────────────────────────────── */
function CommunityTab() {
  const REEL = getHappeningNowReel(ev);

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
            <img src={item.src} alt={`Photo shared by ${item.user}`} />
            <div className="photo-reel-caption">
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{
                  width: 20, height: 20, borderRadius: '50%', background: item.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 8, fontWeight: 700, color: 'white', flexShrink: 0,
                }}>{item.initials}</div>
                <span className="photo-reel-name">
                  {item.user}
                  {item.isCreator && (
                    <span style={{ fontWeight: 500, opacity: 0.9 }}> · Host</span>
                  )}
                </span>
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
        <div className="ev-activity-avatar" style={{ background: 'linear-gradient(135deg,#1976D2,#42A5F5)' }}>MK</div>
        <div style={{ flex: 1 }}>
          <div className="ev-activity-header">
            <span className="ev-activity-user">Michael K.</span>
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
                <img src={item.image} alt={`Photo shared by ${item.user}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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

const CHAT_SEED = [
  {
    id: 'seed-1', name: ev.organizer, initials: ev.initials,
    avatar: 'linear-gradient(135deg,var(--primary),var(--blue))', host: true, verified: true,
    text: "Welcome everyone! We're starting the main presentation in about 5 minutes. Feel free to grab a virtual seat and say hi!",
  },
  {
    id: 'seed-2', name: 'Marcus L.', initials: 'ML',
    avatar: 'linear-gradient(135deg,#0D7377,#14A085)',
    text: 'So excited for this! Tuning in from Chicago.', reaction: 12,
  },
  {
    id: 'seed-3', mine: true, initials: 'ME',
    avatar: 'linear-gradient(135deg,#7B1FA2,#AB47BC)',
    text: "Incredible turnout already. Can't wait for the auction segment!", sent: 'Sent',
  },
  {
    id: 'seed-4', name: 'Emma J.', initials: 'EJ',
    avatar: 'linear-gradient(135deg,#1976D2,#42A5F5)',
    text: 'This is incredible! First time attending a Charity Hub event',
  },
];

function ChatTabMessages({ messages }) {
  return (
    <div className="chat-messages">
      {messages.map((m) => (
        <div key={m.id} className={`chat-msg${m.mine ? ' mine' : ''}`}>
          <div className="chat-msg-avatar" style={{ background: m.avatar }}>{m.initials}</div>
          <div className="chat-msg-body">
            {!m.mine && m.name && (
              <div className="chat-msg-name">
                {m.name}
                {m.verified && (
                  <span style={{
                    display: 'inline-flex', width: 14, height: 14, borderRadius: '50%',
                    background: 'var(--blue)', color: 'white', fontSize: 9,
                    alignItems: 'center', justifyContent: 'center',
                  }}>✓</span>
                )}
                {m.host && <span className="chat-host-badge">Host</span>}
              </div>
            )}
            <div className="chat-bubble">{m.text}</div>
            {m.reaction && <div className="chat-reaction"><PartyPopper size={13} aria-hidden="true" /> {m.reaction}</div>}
            {m.sent && <p className="chat-sent">{m.sent}</p>}
          </div>
        </div>
      ))}
      <div style={{ height: 8 }} />
    </div>
  );
}

function ChatInputBar({ value, onChange, onSend, onAttach, onFocus }) {
  return (
    <div className="chat-input-bar">
      <div className="chat-input-pill">
        <button type="button" className="chat-input-action" aria-label="Add attachment" onClick={onAttach}>
          <Plus size={20} />
        </button>
        <button type="button" className="chat-input-action" aria-label="Add photo" onClick={onAttach}>
          <Camera size={20} />
        </button>
        <input
          className="chat-input-field"
          aria-label="Write a message"
          placeholder="Say something…"
          value={value}
          onChange={onChange}
          onFocus={onFocus}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onSend(); } }}
        />
        <button type="button" className="chat-send-btn" aria-label="Send message" onClick={onSend}>
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

function GuestChatGate({ onSignUp }) {
  return (
    <div className="chat-guest-gate">
      <p className="chat-guest-gate-title">Chat is for members</p>
      <p className="chat-guest-gate-copy">
        Create a free account to join the live conversation, back this event, and get updates.
      </p>
      <button type="button" className="btn-primary" onClick={onSignUp}>
        Sign up to chat
      </button>
      <button type="button" className="btn-ghost" style={{ marginTop: 10 }} onClick={onSignUp}>
        Log in
      </button>
    </div>
  );
}

/* ── Main Component ──────────────────────────────────────── */
const TABS = [
  { id: 'community', Icon: Images,        label: 'Community', sub: 'Photos & moments' },
  { id: 'chat',      Icon: MessageCircle, label: 'Chat',      sub: 'Live conversation' },
  { id: 'support',   Icon: HandHeart,     label: 'Support',   sub: 'Back the cause'   },
];

export default function EventDetailLive({ loggedIn = false }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab]         = useState('community');
  const [liked, setLiked]                 = useState(false);
  const [selectedAmount, setSelectedAmount] = useState(25);
  const [chatInput, setChatInput]         = useState('');
  const [messages, setMessages]           = useState(CHAT_SEED);
  const [showAbout, setShowAbout]         = useState(false);
  const [joined, setJoined]               = useState(false);
  const [toast, setToast]                 = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 1800);
  };

  // Per the Identity Gate model: viewing/liking is open to anyone, but
  // commenting requires identity — guests are routed to the join gate,
  // while a logged-in SE can chat freely.
  const requireJoin = () => {
    if (loggedIn) return false;
    navigate('/guest/join');
    return true;
  };

  // Join / Participate (Blueprint §5 business functions): identity is
  // required to join — guests hit the identity gate, an SE (already
  // identified) joins immediately.
  const handleJoin = () => {
    if (!loggedIn) {
      navigate('/guest/join');
      return;
    }
    setJoined(true);
    showToast("You're in! See you there.");
  };

  const handleDonate = () => {
    const amount = selectedAmount === 'other' ? 25 : selectedAmount;
    navigate(buildDonationSuccessUrl({
      amount,
      eventKey: ev.key,
      returnTo: loggedIn ? '/event/live' : '/guest/event/live',
    }));
  };

  const sendMessage = () => {
    if (requireJoin()) return;
    const text = chatInput.trim();
    if (!text) return;
    setMessages((prev) => [
      ...prev,
      { id: `me-${prev.length}`, mine: true, initials: 'ME', avatar: 'linear-gradient(135deg,#7B1FA2,#AB47BC)', text, sent: 'Sent' },
    ]);
    setChatInput('');
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
            <button className="ev-hero-btn" onClick={() => navigate(-1)} aria-label="Go back">
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
                <button className="ev-details-link" onClick={() => setShowAbout(true)}>
                  Event details <Info size={13} aria-hidden="true" style={{ verticalAlign: -2 }} />
                </button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  type="button"
                  className={`ev-join-btn${joined ? ' joined' : ''}`}
                  onClick={handleJoin}
                  disabled={joined}
                  aria-label={joined ? 'Joined this event' : 'Join this event'}
                >
                  {joined ? <Check size={15} strokeWidth={3} /> : <UserPlus size={15} />}
                  {joined ? 'Joined' : 'Join event'}
                </button>
                <button className="ev-heart-btn" onClick={() => setLiked(!liked)} aria-label={liked ? 'Unlike event' : 'Like event'}>
                  <Heart
                    size={18}
                    color={liked ? '#FF6B6B' : 'white'}
                    fill={liked ? '#FF6B6B' : 'none'}
                  />
                </button>
              </div>
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
                <span className="ev-tab-icon"><tab.Icon size={18} aria-hidden="true" /></span>
                <span className="ev-tab-label">{tab.label}</span>
                <span className="ev-tab-sub">{tab.sub}</span>
              </button>
            ))}
          </div>

          {/* Scrollable tab content */}
          {activeTab === 'chat' ? (
            loggedIn ? (
              <>
                <ChatTabHeader />
                <div className="ev-tab-content">
                  <ChatTabMessages messages={messages} />
                </div>
                <ChatInputBar
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onSend={sendMessage}
                  onAttach={() => showToast('Photo sharing is coming soon')}
                />
              </>
            ) : (
              <div className="ev-tab-content">
                <GuestChatGate onSignUp={() => navigate('/guest/join')} />
              </div>
            )
          ) : (
            <div className="ev-tab-content">
              {activeTab === 'community' && <CommunityTab />}
              {activeTab === 'support' && (
                <SupportTab
                  selectedAmount={selectedAmount}
                  onSelectAmount={setSelectedAmount}
                  onDonate={handleDonate}
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
              <button
                className="btn-primary"
                onClick={() => {
                  setShowAbout(false);
                  if (loggedIn) {
                    setActiveTab('support');
                    return;
                  }
                  setActiveTab('support');
                }}
              >
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
