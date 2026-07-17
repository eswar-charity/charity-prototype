import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Share2, Heart, X, Calendar, MapPin, Plus, Camera, ArrowUp, ChevronLeft,
  MessageCircle, Users, Info, PartyPopper, Check, UserPlus,
} from 'lucide-react';
import DesktopHeader from '../../../components/desktop/DesktopHeader';
import DesktopShareModal from '../../../components/desktop/DesktopShareModal';
import DesktopJoinGateModal from '../../../components/desktop/DesktopJoinGateModal';
import { slugify, buildDonationSuccessUrl, buildCommunityThread, getEventByKey, eventLivePath, eventDisplayTitle, getEventBanner, getEventBannerFocus } from '../../../data/mockData';
import { EventImageBanner } from '../../../components/event/EventImage';

const TABS = [
  { id: 'community', label: 'Community', sub: 'Photos & moments' },
  { id: 'chat', label: 'Chat', sub: 'Live conversation' },
  { id: 'support', label: 'Support', sub: 'Back the cause' },
];

function buildChatSeed(ev) {
  return [
    { id: 1, initials: ev.initials, color: 'linear-gradient(135deg,var(--primary),var(--blue))', name: ev.organizer, host: true, text: "Welcome everyone! We're starting the main presentation in about 5 minutes. Feel free to grab a virtual seat and say hi!" },
    { id: 2, initials: 'ML', color: 'linear-gradient(135deg,#0D7377,#14A085)', name: 'Marcus L.', text: 'So excited for this! Tuning in from Chicago.', reaction: '12' },
    { id: 3, initials: 'ME', color: 'linear-gradient(135deg,#7B1FA2,#AB47BC)', mine: true, text: "Incredible turnout already. Can't wait for the auction segment!", sent: true },
    { id: 4, initials: 'EJ', color: 'linear-gradient(135deg,#1976D2,#42A5F5)', name: 'Emma J.', text: 'This is incredible! First time attending a Charity Hub event' },
  ];
}

function AboutModal({ ev, onClose, following, onToggleFollow }) {
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
        <p className="dsk-modal-section-text">{ev.mission || ev.subtitle}</p>

        <p className="dsk-modal-section-lbl">THE STORY</p>
        <p className="dsk-modal-section-text">{ev.story || ev.subtitle}</p>

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
            {(ev.tags || [ev.category]).map((t) => <span key={t} className="dsk-modal-tag">{t}</span>)}
          </div>
        </div>
      </div>
    </div>
  );
}

function ThreadRow({ post, isLast, showLiveDot, onOpen, variant }) {
  const isReply = variant === 'reply';
  const clickable = typeof onOpen === 'function';
  const mediaClass = isReply
    ? 'thread-media-reply'
    : post.mediaSize === 'post' ? 'thread-media-post' : 'thread-media-attachment';

  return (
    <div
      className={`thread-post${isReply ? ' thread-post--reply' : ''}${clickable ? ' thread-post--clickable' : ''}`}
      onClick={clickable ? () => onOpen(post.id) : undefined}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={clickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(post.id); } } : undefined}
    >
      <div className="thread-rail">
        {showLiveDot && <span className="thread-live-dot" aria-hidden="true" />}
        <div className="thread-avatar" style={{ background: post.avatarBg }} aria-hidden="true">
          {post.initials}
        </div>
        {!isLast && <span className="thread-rail-line" />}
      </div>

      <div className="thread-content">
        <div className="thread-head">
          <span className="thread-name">
            {post.name}
            {post.host && <span className="chat-host-badge">Host</span>}
            {post.verified && <span className="dsk-verify-dot">✓</span>}
          </span>
          <span className="thread-time">{post.time}</span>
        </div>

        {post.highlight && <p className="thread-highlight">{post.highlight}</p>}
        {post.text && <p className="thread-text">{post.text}</p>}
        {post.media && (
          <EventImageBanner src={post.media} alt={post.mediaAlt} variant="community" className={mediaClass} />
        )}

        {clickable && post.replies?.length > 0 && (
          <span className="thread-reply-count">
            <MessageCircle size={12} aria-hidden="true" />
            {post.replies.length} {post.replies.length === 1 ? 'reply' : 'replies'}
          </span>
        )}
      </div>
    </div>
  );
}

function CommunityTab({ ev }) {
  const posts = buildCommunityThread(ev);
  const [openPostId, setOpenPostId] = useState(null);
  const openPost = posts.find((p) => p.id === openPostId) || null;

  if (openPost) {
    return (
      <div className="dsk-tab-panel">
        <div className="thread-back-row thread-back-row--panel">
          <button type="button" className="thread-back-btn" onClick={() => setOpenPostId(null)}>
            <ChevronLeft size={15} aria-hidden="true" /> 
          </button>
        </div>

        <div className="community-thread community-thread--panel">
          <ThreadRow post={openPost} isLast />

          {openPost.replies.length > 0 && (
            <div className="thread-replies">
              {openPost.replies.map((reply, i) => (
                <ThreadRow key={reply.id} post={reply} variant="reply" isLast={i === openPost.replies.length - 1} />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="dsk-tab-panel">
      <div className="dsk-panel-head">
        <span className="dsk-panel-title">Happening now</span>
        <span className="dsk-live-pill"><span className="live-dot" /> LIVE</span>
      </div>

      <div className="community-thread community-thread--panel">
        {posts.map((post, i) => (
          <ThreadRow key={post.id} post={post} isLast={i === posts.length - 1} showLiveDot={i === 0} onOpen={setOpenPostId} />
        ))}
      </div>
    </div>
  );
}

function ChatTab({ ev, onNeedJoin, loggedIn }) {
  const [value, setValue] = useState('');
  const [messages, setMessages] = useState(() => buildChatSeed(ev));

  if (!loggedIn) {
    return (
      <div className="dsk-tab-panel">
        <div className="chat-guest-gate">
          <p className="chat-guest-gate-title">Chat is for members</p>
          <p className="chat-guest-gate-copy">
            Create a free account to join the live conversation, back this event, and get updates.
          </p>
          <button type="button" className="dsk-cta-btn" onClick={onNeedJoin}>
            Sign up to chat
          </button>
        </div>
      </div>
    );
  }

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
              {msg.reaction && <div className="chat-reaction"><PartyPopper size={12} aria-hidden="true" /> {msg.reaction}</div>}
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
          aria-label="Write a message"
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

function SupportTab({ ev, onDonate }) {
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

export default function DesktopEventDetail({ loggedIn = false }) {
  const navigate = useNavigate();
  const { eventKey } = useParams();
  const ev = getEventByKey(eventKey);
  const heroImage = getEventBanner(ev);
  const [activeTab, setActiveTab] = useState('community');
  const [liked, setLiked] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [following, setFollowing] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showJoinGate, setShowJoinGate] = useState(false);
  const [joined, setJoined] = useState(false);
  const [toast, setToast] = useState('');

  const shareUrl = `https://charity.hub/event/${ev.key}`;
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 1800);
  };

  // Join / Participate (Blueprint §5): identity required — guests hit the
  // join gate, a logged-in SE joins immediately.
  const handleJoin = () => {
    if (!loggedIn) {
      setShowJoinGate(true);
      return;
    }
    setJoined(true);
    showToast("You're in! See you there.");
  };

  const handleDonate = (amt) => {
    const amount = amt === 'other' ? 25 : amt;
    navigate(buildDonationSuccessUrl({
      amount,
      eventKey: ev.key,
      returnTo: eventLivePath(ev.key, { loggedIn }),
    }));
  };

  return (
    <div className="dsk-page">
      <DesktopHeader active="Discover" loggedIn={loggedIn} homePath={loggedIn ? '/feed' : '/guest/feed'} />

      <EventImageBanner src={heroImage} alt={ev.title} variant="hero" className="dsk-ev-hero" objectPosition={getEventBannerFocus(ev)}>
        <div className="dsk-ev-hero-gradient" />
        <div className="dsk-ev-hero-overlay">
          <div className="dsk-ev-hero-copy">
            {ev.isLive && (
              <span className="dsk-ev-hero-live"><span className="live-dot" /> DOORS OPEN · LIVE NOW</span>
            )}
            <h1 className="dsk-ev-hero-title">{eventDisplayTitle(ev.title)}</h1>
            <p className="dsk-ev-hero-sub">
              PRESENTED BY ·{' '}
              <span
                role="button"
                tabIndex={0}
                aria-label={`View ${ev.organizer}'s profile`}
                onClick={() => navigate(`/guest/organizer/${slugify(ev.organizer)}`)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate(`/guest/organizer/${slugify(ev.organizer)}`);
                  }
                }}
              >
                {ev.organizer}
              </span>
            </p>
          </div>
          <div className="dsk-ev-hero-actions">
            <button className="ev-hero-btn" onClick={() => setShowShare(true)} aria-label="Share"><Share2 size={16} color="white" /></button>
            <button className="ev-hero-btn" onClick={() => setShowAbout(true)} aria-label="Event info"><Info size={16} color="white" /></button>
            <button className="ev-hero-btn" onClick={() => setLiked(!liked)} aria-label="Like">
              <Heart size={16} color={liked ? '#FF6B6B' : 'white'} fill={liked ? '#FF6B6B' : 'none'} />
            </button>
          </div>
        </div>
      </EventImageBanner>

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

            {activeTab === 'community' && <CommunityTab ev={ev} />}
            {activeTab === 'chat' && (
              <ChatTab
                ev={ev}
                loggedIn={loggedIn}
                onNeedJoin={() => setShowJoinGate(true)}
              />
            )}
            {activeTab === 'support' && (
              <SupportTab ev={ev} onDonate={handleDonate} />
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
              <button
                type="button"
                className="ev-join-btn"
                style={{
                  width: '100%', justifyContent: 'center', marginBottom: 10,
                  ...(joined ? { background: 'var(--tertiary)', color: 'var(--tertiary-text)' } : {}),
                }}
                onClick={handleJoin}
                disabled={joined}
              >
                {joined ? <Check size={15} strokeWidth={3} /> : <UserPlus size={15} />}
                {joined ? 'Joined' : 'Join event'}
              </button>
              <button className="dsk-sidebar-share-btn" onClick={() => setShowShare(true)}>Share</button>
              <div className="dsk-sidebar-stats">
                <span><Users size={13} /> {ev.backed} backing</span>
                <button type="button" className="dsk-sidebar-stat-btn" onClick={() => setActiveTab('chat')}>
                  <MessageCircle size={13} /> {ev.chatCount} in chat
                </button>
              </div>
              <button className="dsk-sidebar-details-link" onClick={() => setShowAbout(true)}>Event details <Info size={13} aria-hidden="true" style={{ verticalAlign: -2 }} /></button>
            </div>
          </aside>
        </div>
      </main>

      {showAbout && (
        <AboutModal
          ev={ev}
          onClose={() => setShowAbout(false)}
          following={following}
          onToggleFollow={() => setFollowing((f) => !f)}
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
          title={eventDisplayTitle(ev.title)}
          subtitle={`${ev.nonprofit} · verified`}
          previewSrc={heroImage}
        />
      )}

      {toast && <div className="dsk-live-toast">{toast}</div>}
    </div>
  );
}
