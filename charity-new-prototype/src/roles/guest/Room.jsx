// "The room" (posts by Before / During / After, replies, likes, media) and the live chat panel.
import { useEffect, useRef, useState } from 'react'
import { BadgeCheck, Flag, Heart, ImagePlus, MessageCircle, Send, X } from 'lucide-react'
import { Avatar } from '../../components/Brand.jsx'
import { Empty, fmtDate, timeAgo, plural, useRun } from '../../ui/kit.jsx'
import { useGate } from '../../ui/Gate.jsx'
import { useDomain, useSession } from '../../domain/store.jsx'
import { isNpStaffFor, isOrganizer } from '../../domain/engine.js'
import { authorName, chatFor, postsFor } from '../../domain/selectors.js'
import { ReportDialog } from './Dialogs.jsx'
import { publicName } from './lib.js'

const PHASES = [['all', 'All'], ['before', 'Before'], ['during', 'During'], ['after', 'After']]
const PHASE_TITLE = { before: 'Before the event', during: 'During the event', after: 'After the event' }

const stamp = (iso, now) => (new Date(iso) > now ? fmtDate(iso) : timeAgo(iso, now))

/** Is this author the organizer or staff of the beneficiary nonprofit? They carry the Host badge. */
function useIsHost(ev) {
  const s = useDomain()
  return (id) => {
    if (!id) return false
    if (id === ev.organizerId) return true
    const u = s.users[id]
    return !!u && isNpStaffFor(u, ev)
  }
}

export function Room({ ev, closed }) {
  const s = useDomain()
  const { user } = useSession()
  const [phase, setPhase] = useState('all')
  const [report, setReport] = useState(null)
  const posts = postsFor(s, ev.key)
  const shown = phase === 'all' ? posts : posts.filter((p) => p.phase === phase)
  const asHost = !!user && (isOrganizer(user, ev) || isNpStaffFor(user, ev))

  if (!['Live', 'Completed', 'Archived', 'Blocked'].includes(ev.status)) {
    return <Empty title="The room opens when the event is live">Once the nonprofit approves, hosts and guests can post here.</Empty>
  }

  const groups = (phase === 'all' ? ['before', 'during', 'after'] : [phase]).map((ph) => ({ ph, list: shown.filter((p) => p.phase === ph) })).filter((g) => g.list.length)

  return (
    <div className="room-wrap">
      <PostComposer ev={ev} closed={closed} asHost={asHost} />

      <div className="filter-row" role="group" aria-label="Filter the room by stage">
        {PHASES.map(([k, l]) => (
          <button key={k} className={`filter ${phase === k ? 'is-on' : ''}`} aria-pressed={phase === k} onClick={() => setPhase(k)}>{l}</button>
        ))}
      </div>

      {groups.length === 0 ? (
        <Empty title={posts.length ? 'Nothing at this stage yet' : 'No messages yet'}>{posts.length ? 'Try another stage.' : closed ? 'This room is closed.' : 'Be the first to say something.'}</Empty>
      ) : (
        <div className="ch-room room">
          <div className="ch-room__head">
            <span>{ev.title}</span>
            <span className="ch-muted">{plural(posts.length, 'message')}</span>
          </div>
          {groups.map(({ ph, list }) => (
            <section key={ph} className="room__group" aria-labelledby={`room-${ph}`}>
              <h3 className="room__phase" id={`room-${ph}`}>{PHASE_TITLE[ph]}</h3>
              <ol className="room__list">
                {list.map((p) => <PostItem key={p.id} ev={ev} post={p} closed={closed} onReport={setReport} />)}
              </ol>
            </section>
          ))}
        </div>
      )}
      <p className="demo-note">Seeded messages are demo content.</p>
      {report && <ReportDialog target={report} onClose={() => setReport(null)} />}
    </div>
  )
}

function PostComposer({ ev, closed, asHost }) {
  const { ensureIdentity } = useGate()
  const run = useRun()
  const [text, setText] = useState('')
  const [media, setMedia] = useState('')
  const [err, setErr] = useState('')
  const canPick = typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function'

  if (closed) return <p className="room__closed" role="status">{ev.status === 'Archived' ? 'This event is archived, so the room is read-only.' : 'This event is paused, so the room is closed for now.'}</p>

  const pick = (e) => {
    const f = e.target.files?.[0]
    if (f && canPick) setMedia(URL.createObjectURL(f))
    e.target.value = ''
  }
  const submit = async (e) => {
    e.preventDefault()
    if (!text.trim() && !media) { setErr('Write something first.'); return }
    if (!(await ensureIdentity({ action: 'comment', event: ev }))) return
    run(asHost ? 'postUpdate' : 'createPost', { eventKey: ev.key, text, mediaUrl: media }, {
      success: asHost ? 'Update posted' : 'Posted to the room',
      onOk: () => { setText(''); setMedia(''); setErr('') },
    })
  }

  return (
    <form className="composer" onSubmit={submit} noValidate>
      <div className={`ch-field ${err ? 'ch-field--invalid' : ''}`}>
        <label className="ch-field__label" htmlFor="post-text">{asHost ? 'Post an update as host' : 'Share with the room'}</label>
        <textarea id="post-text" className="ch-field__input idea" rows={3} value={text} placeholder={asHost ? 'Tell everyone going what is happening' : 'Say hello, share a moment, ask a question'}
          aria-invalid={!!err || undefined} aria-describedby={err ? 'post-text-err' : undefined} onChange={(e) => { setText(e.target.value); setErr('') }} />
        {err && <span className="ch-field__hint" id="post-text-err">{err}</span>}
      </div>
      {media && (
        <div className="composer__media">
          <img src={media} alt="Photo you are about to post" />
          <button type="button" className="icon-btn" onClick={() => setMedia('')} aria-label="Remove photo"><X size={18} aria-hidden="true" /></button>
        </div>
      )}
      <div className="composer__bar">
        {canPick && (
          <label className="ch-btn ch-btn--text ch-btn--sm composer__file">
            <ImagePlus size={16} aria-hidden="true" /> Add a photo
            <input type="file" accept="image/*" className="ch-sr" onChange={pick} />
          </label>
        )}
        <button className="ch-btn ch-btn--primary ch-btn--sm">{asHost ? 'Post update' : 'Post'}</button>
      </div>
    </form>
  )
}

function PostItem({ ev, post, closed, onReport }) {
  const s = useDomain()
  const { user, now } = useSession()
  const { ensureIdentity } = useGate()
  const run = useRun()
  const isHost = useIsHost(ev)
  const [replying, setReplying] = useState(false)
  const [text, setText] = useState('')
  const [err, setErr] = useState('')

  const np = s.nonprofits[ev.nonprofitId]
  const name = post.host ? post.authorName ?? np?.name ?? 'Host' : publicName(authorName(s, post.authorId, post.authorName ?? 'Someone'))
  const liked = !!user && post.likes.includes(user.id)
  const reported = !!user && post.flags.some((f) => f.by === user.id)
  const replies = post.replies.filter((r) => !r.hidden)

  const like = async () => {
    if (!(await ensureIdentity({ action: 'like', event: ev }))) return
    run('toggleLike', { postId: post.id })
  }
  const report = async () => {
    if (!(await ensureIdentity({ action: 'report', event: ev }))) return
    onReport({ kind: 'post', id: post.id, eventKey: ev.key, label: `post by ${name}` })
  }
  const reply = async (e) => {
    e.preventDefault()
    if (!text.trim()) { setErr('Write a reply first.'); return }
    if (!(await ensureIdentity({ action: 'comment', event: ev }))) return
    run('replyToPost', { postId: post.id, text }, { onOk: () => { setText(''); setErr(''); setReplying(false) } })
  }

  return (
    <li className="room__item" id={`post-${post.id}`}>
      <div className={`ch-msg ${post.host ? 'ch-msg--host' : ''}`}>
        <Avatar name={name} />
        <div className="ch-msg__body">
          <div className="ch-msg__meta">
            <strong>{name}</strong>
            {post.host && <span className="ch-badge-host"><BadgeCheck aria-hidden="true" /> Host</span>}
            <span>{stamp(post.createdAt, now)}</span>
          </div>
          <div className="ch-msg__bubble">
            {post.mediaUrl && <img className="room__photo" src={post.mediaUrl} alt={`Photo shared by ${name}`} loading="lazy" />}
            {post.text && <p>{post.text}</p>}
          </div>
          <div className="post-actions">
            {closed ? (
              <span className="ch-muted">{plural(post.likes.length, 'like')} · {plural(replies.length, 'reply', 'replies')}</span>
            ) : (
              <>
                <button type="button" className={`act ${liked ? 'is-on' : ''}`} aria-pressed={liked} aria-label={`Like post by ${name}`} onClick={like}>
                  <Heart size={16} aria-hidden="true" fill={liked ? 'currentColor' : 'none'} /> <span>{post.likes.length}</span>
                </button>
                <button type="button" className="act" aria-expanded={replying} aria-label={`Reply to post by ${name}`} onClick={() => setReplying((v) => !v)}>
                  <MessageCircle size={16} aria-hidden="true" /> <span>{replies.length ? plural(replies.length, 'reply', 'replies') : 'Reply'}</span>
                </button>
                <button type="button" className="act act--quiet" disabled={reported} aria-label={reported ? `You reported the post by ${name}` : `Report post by ${name}`} onClick={report}>
                  <Flag size={16} aria-hidden="true" /> <span>{reported ? 'Reported' : 'Report'}</span>
                </button>
              </>
            )}
          </div>

          {replies.length > 0 && (
            <ul className="replies" aria-label={`Replies to ${name}`}>
              {replies.map((r) => (
                <li key={r.id} className="reply">
                  <Avatar name={authorName(s, r.authorId, r.authorName)} size="sm" />
                  <div>
                    <p className="reply__meta"><strong>{isHost(r.authorId) ? r.authorName : publicName(r.authorName)}</strong> {isHost(r.authorId) && <span className="ch-badge-host"><BadgeCheck aria-hidden="true" /> Host</span>} <span>{stamp(r.createdAt, now)}</span></p>
                    <p>{r.text}</p>
                    {!closed && !(user && r.flags.some((f) => f.by === user.id)) && (
                      <ReplyReport ev={ev} reply={r} onReport={onReport} />
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {replying && !closed && (
            <form className="reply-form" onSubmit={reply} noValidate>
              <div className={`ch-field ${err ? 'ch-field--invalid' : ''}`}>
                <label className="ch-field__label" htmlFor={`reply-${post.id}`}>Your reply to {name}</label>
                <input id={`reply-${post.id}`} className="ch-field__input" value={text} autoFocus aria-invalid={!!err || undefined}
                  aria-describedby={err ? `reply-${post.id}-err` : undefined} onChange={(e) => { setText(e.target.value); setErr('') }} />
                {err && <span className="ch-field__hint" id={`reply-${post.id}-err`}>{err}</span>}
              </div>
              <button className="ch-btn ch-btn--primary ch-btn--sm">Send reply</button>
            </form>
          )}
        </div>
      </div>
    </li>
  )
}

function ReplyReport({ ev, reply, onReport }) {
  const { ensureIdentity } = useGate()
  return (
    <button type="button" className="act act--quiet act--tiny" aria-label={`Report reply by ${reply.authorName}`}
      onClick={async () => { if (await ensureIdentity({ action: 'report', event: ev })) onReport({ kind: 'reply', id: reply.id, eventKey: ev.key, label: `reply by ${reply.authorName}` }) }}>
      <Flag size={14} aria-hidden="true" /> Report
    </button>
  )
}

/* ------------------------------------------------------------------ chat */
export function ChatPanel({ ev, closed, preview }) {
  const s = useDomain()
  const { user, now } = useSession()
  const { ensureIdentity } = useGate()
  const run = useRun()
  const isHost = useIsHost(ev)
  const [text, setText] = useState('')
  const [err, setErr] = useState('')
  const [report, setReport] = useState(null)
  const listRef = useRef(null)
  const msgs = chatFor(s, ev.key)
  const shown = msgs.slice(-40)

  useEffect(() => { const el = listRef.current; if (el) el.scrollTop = el.scrollHeight }, [msgs.length])

  const send = async (e) => {
    e.preventDefault()
    if (!text.trim()) { setErr('Write a message first.'); return }
    if (!(await ensureIdentity({ action: 'chat', event: ev }))) return
    run('sendChat', { eventKey: ev.key, text }, { onOk: () => { setText(''); setErr('') } })
  }

  return (
    <section className="chat ch-room" aria-labelledby="chat-h">
      <div className="ch-room__head">
        <h2 id="chat-h" className="chat__title">Chat</h2>
        <span className="ch-muted">{plural(msgs.length, 'message')}</span>
      </div>
      {preview ? (
        <p className="room__closed" role="status">Chat opens when the event is live.</p>
      ) : (
        <>
          <ul className="chat__list" ref={listRef} aria-label="Chat messages" tabIndex={0}>
            {shown.length === 0 && <li className="ch-muted chat__empty">No messages yet. Say hi.</li>}
            {shown.map((m) => {
              const name = authorName(s, m.authorId)
              const host = isHost(m.authorId)
              const mine = !!user && m.flags.some((f) => f.by === user.id)
              return (
                <li key={m.id} className="chat__msg">
                  <Avatar name={name} size="sm" />
                  <div className="chat__body">
                    <p className="chat__meta"><strong>{host ? name : publicName(name)}</strong>{host && <span className="ch-badge-host"><BadgeCheck aria-hidden="true" /> Host</span>}<span>{stamp(m.createdAt, now)}</span></p>
                    <p className="chat__text">{m.text}</p>
                    {m.mediaUrl && <img className="room__photo" src={m.mediaUrl} alt={`Photo shared by ${name}`} loading="lazy" />}
                  </div>
                  {!closed && (
                    <button type="button" className="icon-btn chat__flag" disabled={mine} aria-label={mine ? `You reported the message from ${name}` : `Report message from ${name}`}
                      onClick={async () => { if (await ensureIdentity({ action: 'report', event: ev })) setReport({ kind: 'chat', id: m.id, eventKey: ev.key, label: `message from ${name}` }) }}>
                      <Flag size={14} aria-hidden="true" />
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
          {closed ? (
            <p className="room__closed" role="status">{ev.status === 'Archived' ? 'This event is archived, so chat is read-only.' : 'Chat is closed while this event is paused.'}</p>
          ) : (
            <form className="chat__form" onSubmit={send} noValidate>
              <label className="ch-sr" htmlFor="chat-text">Message</label>
              <div className="ch-composer">
                <input id="chat-text" className="ch-composer__input" value={text} placeholder="Message everyone going" autoComplete="off"
                  aria-invalid={!!err || undefined} aria-describedby={err ? 'chat-err' : undefined} onChange={(e) => { setText(e.target.value); setErr('') }} />
                <button className="ch-composer__btn ch-composer__send" aria-label="Send message"><Send aria-hidden="true" /></button>
              </div>
              {err && <p className="ch-field__hint chat__err" id="chat-err" role="alert">{err}</p>}
            </form>
          )}
        </>
      )}
      {report && <ReportDialog target={report} onClose={() => setReport(null)} />}
    </section>
  )
}
