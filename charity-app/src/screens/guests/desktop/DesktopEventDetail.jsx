import { Fragment, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Share2, Heart, X, Calendar, MapPin, Plus, Camera, ArrowUp, ChevronLeft,
  MessageCircle, Users, Info, PartyPopper, Check, UserPlus,
} from 'lucide-react';
import DesktopHeader from '../../../components/desktop/DesktopHeader';
import DesktopShareModal from '../../../components/desktop/DesktopShareModal';
import DesktopJoinGateModal from '../../../components/desktop/DesktopJoinGateModal';
import { slugify, eventLivePath, eventDisplayTitle, getEventBanner, getEventBannerFocus } from '../../../data/mockData';
import { EventImageBanner } from '../../../components/event/EventImage';
import { useAuth } from '../../../auth/AuthContext';
import { useEventDetail, useEventActions } from '../../../hooks/useEventDetail';
import { useDonateFlow } from '../../../hooks/useDonateFlow';
import StaticStripePaymentForm, { STRIPE_TEST_SUCCESS } from '../../../components/StaticStripePaymentForm';
import { useEventCommunity } from '../../../hooks/useEventCommunity';
import { useEventChat } from '../../../hooks/useEventChat';
import { uploadDeviceMedia } from '../../../api/uploadDeviceMedia';
import EventNonprofitLearnMore from '../../../components/event/EventNonprofitLearnMore';

const TABS = [
  { id: 'community', label: 'Community', sub: 'Photos & moments' },
  { id: 'chat', label: 'Chat', sub: 'Live conversation' },
  { id: 'support', label: 'Support', sub: 'Back the cause' },
];

function AboutModal({ ev, onClose, following, onToggleFollow, onLearnMore }) {
  return (
    <div className="dsk-modal-backdrop" onClick={onClose}>
      <div className="dsk-modal" onClick={(e) => e.stopPropagation()}>
        <div className="dsk-modal-head">
          <h3>About this event</h3>
          <button className="dsk-modal-close" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="dsk-np-info-row" style={{ marginBottom: 18 }}>
          <div className="dsk-sidebar-np-avatar" style={{ background: ev.npBg }}>{ev.npInitials}</div>
          <div style={{ flex: 1 }}>
            <p className="dsk-sidebar-np-name">{ev.nonprofit}</p>
            <p className="dsk-sidebar-np-sub">Verified nonprofit</p>
          </div>
          <button
            type="button"
            className="btn-ghost"
            style={{ fontSize: 13 }}
            onClick={() => { onClose(); onLearnMore?.(); }}
          >
            Learn more
          </button>
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

const PHASE_LABELS = { before: 'Before the event', during: 'Live', after: 'After the event' };

function CommunityTab({ ev }) {
  const { posts, loading, error, reload } = useEventCommunity(ev);
  const [openPostId, setOpenPostId] = useState(null);
  const openPost = posts.find((p) => p.id === openPostId) || null;

  if (loading) {
    return (
      <div className="dsk-tab-panel">
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Loading community…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dsk-tab-panel">
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 10 }}>Couldn&apos;t load community posts.</p>
        <button type="button" className="dsk-cta-btn" onClick={reload}>Try again</button>
      </div>
    );
  }

  if (openPost) {
    return (
      <div className="dsk-tab-panel">
        <div className="thread-back-row thread-back-row--panel">
          <button type="button" className="thread-back-btn" onClick={() => setOpenPostId(null)}>
            <ChevronLeft size={15} aria-hidden="true" /> Community
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
    </div>
  );
}

function ChatTab({ ev, onNeedJoin, loggedIn, showToast, currentUserId, onMessageSent }) {
  const [value, setValue] = useState('');
  const fileInputRef = useRef(null);
  const {
    messages,
    loading: chatLoading,
    send: sendChatMessage,
    pending: chatPending,
  } = useEventChat({
    eventKey: ev?.key,
    eventId: ev?.id,
    enabled: loggedIn,
    currentUserId,
    showToast,
    onMessageSent,
  });

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

  const send = async () => {
    const text = value.trim();
    if (!text || chatPending) return;
    try {
      await sendChatMessage({ text });
      setValue('');
    } catch {
      // toast handled in hook
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const openMediaPicker = () => {
    if (chatPending) return;
    fileInputRef.current?.click();
  };

  const handleMediaSelected = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !ev?.id || chatPending) return;
    const caption = value.trim();
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
      setValue('');
    } catch (err) {
      URL.revokeObjectURL(localPreviewUrl);
      showToast?.(err?.message || 'Could not upload media');
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
        {chatLoading && messages.length === 0 && (
          <p style={{ padding: '12px 0', color: 'var(--text-secondary)', fontSize: 14 }}>Loading chat…</p>
        )}
        {!chatLoading && messages.length === 0 && (
          <p style={{ padding: '12px 0', color: 'var(--text-secondary)', fontSize: 14 }}>No messages yet — say hello</p>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`chat-msg${msg.mine ? ' mine' : ''}`}>
            <div className="chat-msg-avatar" style={{ background: msg.avatar || msg.color }}>{msg.initials}</div>
            <div className="chat-msg-body">
              {!msg.mine && (
                <div className="chat-msg-name">
                  {msg.name}
                  {msg.host && <span className="chat-host-badge">Host</span>}
                </div>
              )}
              <div className="chat-bubble">
                {msg.media && (msg.mediaType === 'video' ? (
                  <video
                    src={msg.media}
                    controls
                    playsInline
                    style={{ width: 150, height: 150, objectFit: 'cover', borderRadius: 8, display: 'block', marginBottom: msg.text ? 8 : 0 }}
                  />
                ) : (
                  <img
                    src={msg.media}
                    alt=""
                    style={{ width: 150, height: 150, objectFit: 'cover', borderRadius: 8, display: 'block', marginBottom: msg.text ? 8 : 0 }}
                  />
                ))}
                {msg.text ? msg.text : null}
              </div>
              {msg.reaction && <div className="chat-reaction"><PartyPopper size={12} aria-hidden="true" /> {msg.reaction}</div>}
              {msg.sent && <p className="chat-sent">Sent</p>}
            </div>
          </div>
        ))}
      </div>

      <div className="dsk-chat-input-bar">
        <button
          type="button"
          className="chat-input-action"
          aria-label="Add attachment"
          onClick={openMediaPicker}
          disabled={chatPending}
        >
          <Plus size={18} />
        </button>
        <button
          type="button"
          className="chat-input-action"
          aria-label="Add photo"
          onClick={openMediaPicker}
          disabled={chatPending}
        >
          <Camera size={18} />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          style={{ display: 'none' }}
          onChange={handleMediaSelected}
        />
        <input
          className="dsk-chat-input-field"
          aria-label="Write a message"
          placeholder="Say something..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button type="button" className="chat-send-btn" aria-label="Send message" onClick={send} disabled={!value.trim() || chatPending}>
          <ArrowUp size={16} color="white" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}

function SupportTab({ ev, onDonate, donatePending }) {
  const [amount, setAmount] = useState(25);
  const [customAmount, setCustomAmount] = useState('');
  const [cardDigits, setCardDigits] = useState(STRIPE_TEST_SUCCESS);
  const isOther = amount === 'other';
  const parsedCustom = Number.parseFloat(customAmount);
  const donateAmount = typeof amount === 'number'
    ? amount
    : (Number.isFinite(parsedCustom) && parsedCustom > 0 ? Math.round(parsedCustom * 100) / 100 : null);
  const canDonate = donateAmount != null && donateAmount > 0;

  return (
    <div className="dsk-tab-panel">
      <p className="dsk-panel-title" style={{ marginBottom: 14 }}>Support {ev.nonprofit}</p>

      <div className="support-raised-row">
        <span className="support-raised-label">Raised so far</span>
        <span className="support-raised-amount">${Number(ev.raised || 0).toLocaleString()}</span>
      </div>
      <div className="support-progress-track"><div className="support-progress-fill" style={{ width: '57%' }} /></div>

      <p className="support-amount-label">Select amount</p>
      <div className="support-amount-row">
        {[10, 25, 50].map((amt) => (
          <button key={amt} className={`support-amount-btn ${amount === amt ? 'active' : ''}`} onClick={() => setAmount(amt)}>${amt}</button>
        ))}
        <button className={`support-amount-btn ${isOther ? 'active' : ''}`} onClick={() => setAmount('other')}>Other</button>
      </div>
      {isOther && (
        <div className="support-other-amount" style={{ marginBottom: 16 }}>
          <label htmlFor="dsk-support-other-amount" className="support-amount-label" style={{ display: 'block' }}>
            Enter amount
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 700, color: 'var(--dark)' }}>$</span>
            <input
              id="dsk-support-other-amount"
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

      <StaticStripePaymentForm
        amount={canDonate ? donateAmount : 0}
        disabled={donatePending || !canDonate}
        onCardChange={setCardDigits}
      />

      <button
        type="button"
        className="dsk-support-btn"
        onClick={() => canDonate && onDonate(donateAmount, cardDigits)}
        disabled={donatePending || !canDonate}
      >
        {donatePending ? 'Processing…' : canDonate ? `Support with $${donateAmount}` : 'Enter an amount'}
      </button>
    </div>
  );
}

export default function DesktopEventDetail({ loggedIn = false }) {
  const navigate = useNavigate();
  const { eventKey } = useParams();
  const { user, isAuthenticated } = useAuth();
  const { ev, patchEv, loading, error, reload } = useEventDetail(eventKey);
  const heroImage = getEventBanner(ev);
  const [activeTab, setActiveTab] = useState('community');
  const [showAbout, setShowAbout] = useState(false);
  const [showNpModal, setShowNpModal] = useState(false);
  const [following, setFollowing] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showJoinGate, setShowJoinGate] = useState(false);
  const [gateIntent, setGateIntent] = useState('default');
  const [toast, setToast] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 1800);
  };

  const openGate = (intent = 'default') => {
    setGateIntent(typeof intent === 'string' ? intent : intent?.intent || 'default');
    setShowJoinGate(true);
  };

  const handleFollow = () => {
    if (isAuthenticated || loggedIn) {
      setFollowing((f) => !f);
      return;
    }
    openGate('follow');
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

  const handleDonate = async (amt, cardNumber) => {
    await donate({
      ev,
      amount: amt,
      cardNumber,
      returnTo: eventLivePath(ev.key, { loggedIn }),
    });
  };

  if (loading) {
    return (
      <div className="dsk-page">
        <DesktopHeader active="Discover" loggedIn={loggedIn} homePath={loggedIn ? '/feed' : '/guest/feed'} />
        <main className="dsk-main">
          <div className="dsk-container" style={{ padding: '48px 0' }}>
            <p style={{ color: 'var(--text-secondary)' }}>Loading event…</p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !ev) {
    return (
      <div className="dsk-page">
        <DesktopHeader active="Discover" loggedIn={loggedIn} homePath={loggedIn ? '/feed' : '/guest/feed'} />
        <main className="dsk-main">
          <div className="dsk-container" style={{ padding: '48px 0' }}>
            <p style={{ fontWeight: 700, color: 'var(--dark)' }}>Couldn&apos;t load event</p>
            <p style={{ marginTop: 8, color: 'var(--text-secondary)' }}>{error?.message || 'Not found'}</p>
          </div>
        </main>
      </div>
    );
  }

  const shareUrl = `https://charity.hub/event/${ev.key}`;

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
            <button className="ev-hero-btn" onClick={handleLike} aria-label="Like">
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
                loggedIn={loggedIn || isAuthenticated}
                onNeedJoin={() => openGate('chat')}
                showToast={showToast}
                currentUserId={user?.id}
                onMessageSent={handleChatStatsRefresh}
              />
            )}
            {activeTab === 'support' && (
              <SupportTab ev={ev} onDonate={handleDonate} donatePending={donatePending} />
            )}
          </div>

          <aside className="dsk-ev-sidebar">
            <div className="dsk-sidebar-card">
              <div className="dsk-sidebar-np-row" style={{ alignItems: 'flex-start' }}>
                <div className="dsk-sidebar-np-avatar" style={{ background: ev.npBg }}>{ev.npInitials}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p className="dsk-sidebar-np-name">{ev.nonprofit}</p>
                  <p className="dsk-sidebar-np-sub">Registered 501(c)(3)</p>
                  {(ev.mission || ev.subtitle) ? (
                    <p className="dsk-modal-section-text" style={{ fontSize: 13, marginTop: 8, WebkitLineClamp: 2, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {ev.mission || ev.subtitle}
                    </p>
                  ) : null}
                </div>
              </div>
              <button
                type="button"
                className="btn-ghost"
                style={{ width: '100%', justifyContent: 'center', marginBottom: 10, fontSize: 13 }}
                onClick={() => setShowNpModal(true)}
              >
                Learn more
              </button>
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
          onToggleFollow={handleFollow}
          onLearnMore={() => setShowNpModal(true)}
        />
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

      {showJoinGate && (
        <DesktopJoinGateModal
          open={showJoinGate}
          onClose={() => setShowJoinGate(false)}
          eventTitle={ev.title}
          nonprofit={ev.nonprofit}
          npInitials={ev.npInitials}
          npBg={ev.npBg}
          intent={gateIntent}
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
