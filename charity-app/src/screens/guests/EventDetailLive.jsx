import { Fragment, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronLeft, Info, Share2, Heart,
  Plus, Camera, ArrowUp, MoreHorizontal,
  Images, MessageCircle, HandHeart, PartyPopper, Check, UserPlus,
  Calendar, MapPin, Ticket,
} from 'lucide-react';
import { eventDisplayTitle, getEventBanner, getEventBannerFocus } from '../../utils/eventDisplay';
import { eventLivePath } from '../../utils/eventPaths';
import { EventImageBanner } from '../../components/event/EventImage';
import MobileShareModal from '../../components/MobileShareModal';
import MobileJoinModal from '../../components/MobileJoinModal';
import TicketModal from '../../components/TicketModal';
import { useAuth } from '../../auth/AuthContext';
import { useEventDetail, useEventActions } from '../../hooks/useEventDetail';
import { useDonateFlow } from '../../hooks/useDonateFlow';
import { useEventCommunity } from '../../hooks/useEventCommunity';
import { useEventChat } from '../../hooks/useEventChat';
import PaymentForm from '../../components/PaymentForm';
import { STRIPE_TEST_SUCCESS } from '../../utils/staticStripe.js';
import { uploadDeviceMedia } from '../../api/uploadDeviceMedia';
import EventNonprofitLearnMore from '../../components/event/EventNonprofitLearnMore';
import EventNpStoryStrip from '../../components/event/EventNpStoryStrip';

/* ── Community Tab ──────────────────────────────────────── */
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
            {post.verified && (
              <span style={{
                display: 'inline-flex', width: 13, height: 13, borderRadius: '50%',
                background: 'var(--blue)', color: 'white', fontSize: 8,
                alignItems: 'center', justifyContent: 'center',
              }}>✓</span>
            )}
          </span>
          <span className="thread-time">{post.time}</span>
          {post.showMore && <MoreHorizontal size={14} color="var(--text-light)" aria-hidden="true" />}
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

const PHASE_LABELS = { before: 'Before the event', during: 'Live', after: 'After the event' };

function CommunityTab({ ev }) {
  const { posts, loading, error, reload } = useEventCommunity(ev);
  const [openPostId, setOpenPostId] = useState(null);
  const openPost = posts.find((p) => p.id === openPostId) || null;

  if (loading) {
    return <p style={{ padding: '16px 0', color: 'var(--text-secondary)', fontSize: 14 }}>Loading community…</p>;
  }

  if (error) {
    return (
      <div style={{ padding: '16px 0' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 10 }}>Couldn&apos;t load community posts.</p>
        <button type="button" className="btn-ghost" onClick={reload}>Try again</button>
      </div>
    );
  }

  if (openPost) {
    return (
      <>
        <div className="thread-back-row">
          <button type="button" className="thread-back-btn" onClick={() => setOpenPostId(null)}>
            <ChevronLeft size={15} aria-hidden="true" /> Community
          </button>
        </div>

        <div className="community-thread">
          <ThreadRow post={openPost} isLast />

          {openPost.replies.length > 0 && (
            <div className="thread-replies">
              {openPost.replies.map((reply, i) => (
                <ThreadRow key={reply.id} post={reply} variant="reply" isLast={i === openPost.replies.length - 1} />
              ))}
            </div>
          )}
        </div>
        <div style={{ height: 20 }} />
      </>
    );
  }

  return (
    <>
      <div className="ev-section-head">
        <span className="ev-section-title">Happening now</span>
        <span className="ev-live-pill">
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--primary)', display: 'inline-block' }} />
          LIVE
        </span>
      </div>

      <div className="community-thread">
        {posts.map((post, i) => {
          const prevPhase = posts[i - 1]?.phase;
          const showDivider = i === 0 || prevPhase !== post.phase;
          const showLiveDot = post.phase === 'during' && (i === 0 || prevPhase !== 'during');
          return (
            <Fragment key={post.id}>
              {showDivider && <p className="thread-phase-label">{PHASE_LABELS[post.phase] || post.phase}</p>}
              <ThreadRow post={post} isLast={i === posts.length - 1} showLiveDot={showLiveDot} onOpen={setOpenPostId} />
            </Fragment>
          );
        })}
      </div>
      <div style={{ height: 20 }} />
    </>
  );
}

/* ── Chat Tab ────────────────────────────────────────────── */
function ChatTabHeader({ ev }) {
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

function ChatTabMessages({ messages, loading }) {
  return (
    <div className="chat-messages">
      {loading && messages.length === 0 && (
        <p style={{ padding: '12px 0', color: 'var(--text-secondary)', fontSize: 14 }}>Loading chat…</p>
      )}
      {!loading && messages.length === 0 && (
        <p style={{ padding: '12px 0', color: 'var(--text-secondary)', fontSize: 14 }}>No messages yet — say hello</p>
      )}
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
            <div className="chat-bubble">
              {m.media && (m.mediaType === 'video' ? (
                <video
                  src={m.media}
                  controls
                  playsInline
                  style={{ width: 150, height: 150, objectFit: 'cover', borderRadius: 8, display: 'block', marginBottom: m.text ? 8 : 0 }}
                />
              ) : (
                <img
                  src={m.media}
                  alt=""
                  style={{ width: 150, height: 150, objectFit: 'cover', borderRadius: 8, display: 'block', marginBottom: m.text ? 8 : 0 }}
                />
              ))}
              {m.text ? m.text : null}
            </div>
            {m.reaction && <div className="chat-reaction"><PartyPopper size={13} aria-hidden="true" /> {m.reaction}</div>}
            {m.sent && <p className="chat-sent">{m.sent}</p>}
          </div>
        </div>
      ))}
      <div style={{ height: 8 }} />
    </div>
  );
}

function ChatInputBar({ value, onChange, onSend, onAttach, onFocus, disabled }) {
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
        <button type="button" className="chat-send-btn" aria-label="Send message" onClick={onSend} disabled={disabled}>
          <ArrowUp size={18} color="white" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}

/* ── Support Tab ─────────────────────────────────────────── */
function SupportTab({ ev, selectedAmount, onSelectAmount, onDonate, onViewStructure, donatePending }) {
  const [cardDigits, setCardDigits] = useState(STRIPE_TEST_SUCCESS);
  const paymentRef = useRef(null);
  const [customAmount, setCustomAmount] = useState('');
  const isOther = selectedAmount === 'other';
  const parsedCustom = Number.parseFloat(customAmount);
  const donateAmount = typeof selectedAmount === 'number'
    ? selectedAmount
    : (Number.isFinite(parsedCustom) && parsedCustom > 0 ? Math.round(parsedCustom * 100) / 100 : null);
  const canDonate = donateAmount != null && donateAmount > 0;

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
        {ev.nonprofitBrief?.verified && <span className="w9-badge"><span>✓</span> Verified</span>}
      </div>

      {/* Raised */}
      <div className="support-raised-row">
        <span className="support-raised-label">Raised so far</span>
        <span className="support-raised-amount">${Number(ev.raised || 0).toLocaleString()}</span>
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
          className={`support-amount-btn ${isOther ? 'active' : ''}`}
          onClick={() => onSelectAmount('other')}
        >
          Other
        </button>
      </div>
      {isOther && (
        <div className="support-other-amount" style={{ marginBottom: 16 }}>
          <label htmlFor="support-other-amount" className="support-amount-label" style={{ display: 'block' }}>
            Enter amount
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 700, color: 'var(--dark)' }}>$</span>
            <input
              id="support-other-amount"
              className="input-field"
              type="number"
              inputMode="decimal"
              min="1"
              step="0.01"
              placeholder="0.00"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              aria-label="Custom donation amount"
            />
          </div>
        </div>
      )}

      <PaymentForm
        ref={paymentRef}
        amount={canDonate ? donateAmount : 0}
        disabled={donatePending || !canDonate}
        onCardChange={setCardDigits}
      />

      <button
        className="btn-primary"
        onClick={() => canDonate && onDonate(donateAmount, cardDigits, paymentRef.current)}
        disabled={donatePending || !canDonate}
      >
        {donatePending ? 'Processing…' : canDonate ? `Donate $${donateAmount}` : 'Enter an amount'}
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
  const { eventKey } = useParams();
  const { user, isAuthenticated } = useAuth();
  const { ev, patchEv, loading, error, reload } = useEventDetail(eventKey);
  const heroImage = getEventBanner(ev);
  const [activeTab, setActiveTab]         = useState('community');
  const [selectedAmount, setSelectedAmount] = useState(25);
  const [chatInput, setChatInput]         = useState('');
  const [showAbout, setShowAbout]         = useState(false);
  const [showNpModal, setShowNpModal]     = useState(false);
  const [showShare, setShowShare]         = useState(false);
  const [showJoin, setShowJoin]           = useState(false);
  const [showTicket, setShowTicket]       = useState(false);
  const [gateIntent, setGateIntent]       = useState('default');
  const [toast, setToast]                 = useState('');
  const chatFileInputRef = useRef(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 1800);
  };

  const openGate = (intent = 'default') => {
    setGateIntent(typeof intent === 'string' ? intent : intent?.intent || 'default');
    setShowJoin(true);
  };

  const handleChatStatsRefresh = () => {
    // Optimistic chat bump, then silent reload for backing + authoritative chat count.
    patchEv((prev) => {
      const nextCount = (prev.chatCount ?? prev.chat ?? 0) + 1;
      return { chatCount: nextCount, chat: nextCount };
    });
    reload({ silent: true });
  };

  const { liked, joined, handleLike, handleJoin } = useEventActions({
    ev,
    loggedIn,
    isAuthenticated,
    onNeedAuth: (intent) => openGate(intent || 'default'),
    showToast,
  });

  const { donate, pending: donatePending } = useDonateFlow({
    showToast,
    onNeedAuth: (opts) => openGate(opts?.intent || 'donate'),
  });

  const canChat = loggedIn || isAuthenticated;
  const {
    messages,
    loading: chatLoading,
    send: sendChatMessage,
    pending: chatPending,
  } = useEventChat({
    eventKey: ev?.key,
    eventId: ev?.id,
    enabled: activeTab === 'chat' && canChat,
    currentUserId: user?.id,
    showToast,
    onMessageSent: handleChatStatsRefresh,
  });

  // Per the Identity Gate model: viewing is open, but commenting requires
  // identity — guests hit the join gate; SE / authed users can chat.
  const requireJoin = () => {
    if (loggedIn || isAuthenticated) return false;
    openGate('chat');
    return true;
  };

  const handleDonate = async (amount, cardNumber, payment) => {
    await donate({
      ev,
      amount,
      cardNumber,
      payment,
      returnTo: eventLivePath(ev.key, { loggedIn }),
    });
  };

  const sendMessage = async () => {
    if (requireJoin()) return;
    const text = chatInput.trim();
    if (!text || chatPending) return;
    try {
      await sendChatMessage({ text });
      setChatInput('');
    } catch {
      // toast handled in hook
    }
  };

  const openChatMediaPicker = () => {
    if (requireJoin()) return;
    if (chatPending) return;
    chatFileInputRef.current?.click();
  };

  const handleChatMediaSelected = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !ev?.id || chatPending) return;
    const caption = chatInput.trim();
    const localPreviewUrl = URL.createObjectURL(file);
    const mediaType = file.type.startsWith('video/') ? 'video' : 'image';
    try {
      const asset = await uploadDeviceMedia(file, { folder: 'chat', eventId: ev.id });
      await sendChatMessage({
        text: caption,
        mediaId: asset.id,
        localPreviewUrl,
        mediaType: asset.resource_type || mediaType,
      });
      setChatInput('');
    } catch (err) {
      URL.revokeObjectURL(localPreviewUrl);
      showToast(err?.message || 'Could not upload media');
    }
  };

  if (loading) {
    return (
      <div className="phone-shell">
        <div className="detail-screen" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Loading event…</p>
        </div>
      </div>
    );
  }

  if (error || !ev) {
    return (
      <div className="phone-shell">
        <div className="detail-screen" style={{ padding: 24 }}>
          <button type="button" className="ev-hero-btn" onClick={() => navigate(-1)} aria-label="Go back" style={{ background: 'var(--border)' }}>
            <ChevronLeft size={18} />
          </button>
          <p style={{ marginTop: 24, fontWeight: 700, color: 'var(--dark)' }}>Couldn&apos;t load event</p>
          <p style={{ marginTop: 8, color: 'var(--text-secondary)', fontSize: 14 }}>{error?.message || 'Not found'}</p>
        </div>
      </div>
    );
  }

  const subtitleLead = (ev.subtitle || ev.mission || '').split('.')[0];

  return (
    <div className="phone-shell">
      <div className="detail-screen">

        {/* ── Hero ── */}
        <EventImageBanner src={heroImage} alt={ev.title} variant="hero" className="ev-hero" objectPosition={getEventBannerFocus(ev)}>
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
              <button className="ev-hero-btn" onClick={() => setShowShare(true)} aria-label="Share">
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
            <h1 className="ev-hero-title">{eventDisplayTitle(ev.title)}</h1>
            <p className="ev-hero-subtitle">{subtitleLead}{subtitleLead ? '.' : ''}</p>
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
                {joined && isAuthenticated && (
                  <button type="button" className="ev-heart-btn" onClick={() => setShowTicket(true)} aria-label="Show my ticket">
                    <Ticket size={18} color="white" />
                  </button>
                )}
                <button className="ev-heart-btn" onClick={handleLike} aria-label={liked ? 'Unlike event' : 'Like event'}>
                  <Heart
                    size={18}
                    color={liked ? '#FF6B6B' : 'white'}
                    fill={liked ? '#FF6B6B' : 'none'}
                  />
                </button>
              </div>
            </div>
          </div>
        </EventImageBanner>

        {/* ── Bottom sheet ── */}
        <div className="ev-sheet">
          <div className="ev-sheet-handle" />

          <div style={{ padding: '0 18px' }}>
            <EventNpStoryStrip
              name={ev.nonprofit}
              initials={ev.npInitials}
              bg={ev.npBg}
              mission={ev.mission || ev.subtitle}
              onLearnMore={() => setShowNpModal(true)}
              compact
            />
          </div>

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
            canChat ? (
              <>
                <ChatTabHeader ev={ev} />
                <div className="ev-tab-content">
                  <ChatTabMessages messages={messages} loading={chatLoading} />
                </div>
                <ChatInputBar
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onSend={sendMessage}
                  onAttach={openChatMediaPicker}
                  disabled={chatPending}
                />
                <input
                  ref={chatFileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  style={{ display: 'none' }}
                  onChange={handleChatMediaSelected}
                />
              </>
            ) : (
              <div className="ev-tab-content">
                <GuestChatGate onSignUp={() => openGate('chat')} />
              </div>
            )
          ) : (
            <div className="ev-tab-content">
              {activeTab === 'community' && <CommunityTab ev={ev} />}
              {activeTab === 'support' && (
                <SupportTab
                  ev={ev}
                  selectedAmount={selectedAmount}
                  onSelectAmount={setSelectedAmount}
                  onDonate={handleDonate}
                  donatePending={donatePending}
                  onViewStructure={() => showToast(`Funds go to ${ev.nonprofit} (verified 501c3)`)}
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
                <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--dark)' }}>About this event</h2>
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

              <div className="np-info-row" style={{ marginBottom: 16 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: ev.npBg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700, color: 'white', flexShrink: 0,
                }}>{ev.npInitials}</div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--dark)' }}>{ev.nonprofit}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Verified Nonprofit</p>
                </div>
                <button
                  type="button"
                  className="btn-ghost"
                  style={{ fontSize: 13 }}
                  onClick={() => { setShowAbout(false); setShowNpModal(true); }}
                >
                  Learn more
                </button>
              </div>

              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', letterSpacing: 0.5, marginBottom: 6 }}>WHEN &amp; WHERE</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <Calendar size={15} color="var(--primary)" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: 'var(--dark)', fontWeight: 600 }}>
                  {ev.date}{ev.startTime && ev.startTime !== 'TBA' ? ` · ${ev.startTime} – ${ev.endTime}` : ''}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <MapPin size={15} color="var(--primary)" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: 'var(--dark)', fontWeight: 600 }}>{ev.location}</span>
              </div>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', letterSpacing: 0.5, marginBottom: 6 }}>MISSION</p>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 14 }}>{ev.mission || ev.subtitle}</p>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', letterSpacing: 0.5, marginBottom: 6 }}>THE STORY</p>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 18 }}>{ev.story || ev.subtitle}</p>
              <button
                className="btn-primary"
                onClick={() => {
                  setShowAbout(false);
                  setActiveTab('support');
                }}
              >
                Back this cause
              </button>
            </div>
          </div>
        )}

        <EventNonprofitLearnMore
          open={showNpModal}
          onClose={() => setShowNpModal(false)}
          event={ev}
          fallbackName={ev.nonprofit}
          fallbackInitials={ev.npInitials}
          fallbackBg={ev.npBg}
          fallbackCategory={ev.category}
          fallbackDescription={ev.mission || ev.subtitle}
        />

        {showShare && (
          <MobileShareModal
            title={eventDisplayTitle(ev.title)}
            subtitle={`${ev.nonprofit} · verified`}
            url={`https://charity-prototype.vercel.app${eventLivePath(ev.key)}`}
            onClose={() => setShowShare(false)}
          />
        )}

        {showTicket && (
          <TicketModal open eventId={ev.id} title={eventDisplayTitle(ev.title)} onClose={() => setShowTicket(false)} />
        )}

        {showJoin && (
          <MobileJoinModal
            title={eventDisplayTitle(ev.title)}
            subtitle={ev.nonprofit}
            intent={gateIntent}
            onClose={() => setShowJoin(false)}
          />
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
