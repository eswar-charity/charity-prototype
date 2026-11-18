// Live dashboard for an event: stats, donations, updates, check-in, walk-ins, roster, share QR.
//   <LiveDashboard base="/se" />  at /se/live/:key        <LiveDashboard base="/np" /> at /np/live/:key
// Permitted: the organizer, staff of the beneficiary nonprofit, or a platform admin (read-only).
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Camera, Copy, ExternalLink, ImagePlus, X } from 'lucide-react'
import { useDomain, useSession } from '../../../domain/store.jsx'
import { ROLES, eventTotals } from '../../../domain/engine.js'
import { Avatar } from '../../../components/Brand.jsx'
import { photoList, postsFor, authorName } from '../../../domain/selectors.js'
import { Empty, Field, fieldProps, Modal, PageHeader, QR, Section, Stat, StatRow, StatusBadge, centsToDollars, dollars, fmtDateTime, plural, timeAgo, useRun, useToast } from '../../../ui/kit.jsx'
import { NotYours, canManage, whenText } from '../common.jsx'

export const liveRoutes = (base = '/se') => [{ path: 'live/:key', element: <LiveDashboard base={base} /> }]

export function LiveDashboard({ base = '/se' }) {
  const { key } = useParams()
  const s = useDomain()
  const { user } = useSession()
  const ev = s.events[key]
  const home = base === '/se' ? '/se' : '/np/events'
  const homeLabel = base === '/se' ? 'Back to your home' : 'Back to events'
  if (!user) return null
  if (!ev || ev.deletedAt) return <NotYours missing home={home} homeLabel={homeLabel} />
  if (!canManage(user, ev)) return <NotYours home={home} homeLabel={homeLabel} />
  return <Dashboard key={ev.key} ev={ev} base={base} home={home} />
}
export default LiveDashboard

const CHECKIN_REASONS = {
  already_checked_in: 'Already in',
  ticket_not_found: 'No match',
  event_blocked: 'Paused',
  event_archived: 'Closed',
  code_required: 'Missing code',
}

function Dashboard({ ev, base, home }) {
  const s = useDomain()
  const { user, now } = useSession()
  const totals = eventTotals(s, ev.key)
  const isAdmin = user.role === ROLES.ADMIN
  const canAct = !isAdmin // the engine lets only the organizer or nonprofit staff act
  const live = ev.status === 'Live'
  const open = canAct && (live || ev.status === 'Completed') // updates and check-in
  const link = `${typeof window !== 'undefined' ? window.location.origin : ''}/events/${ev.key}`
  const np = s.nonprofits[ev.nonprofitId]
  const approvalLink = base === '/se' ? `/se/approval/${ev.key}` : `/np/approvals/${ev.key}`
  const donations = useMemo(
    () => s.donations.filter((d) => d.eventKey === ev.key && ['Successful', 'Disputed'].includes(d.status)).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [s.donations, ev.key],
  )
  const hasDemoDonations = donations.some((d) => d.seeded)

  return (
    <>
      <PageHeader
        back={{ to: home, label: base === '/se' ? 'Home' : 'Events' }}
        eyebrow="Live dashboard"
        title={ev.title}
        lede={`${whenText(ev)}${ev.location ? ` · ${ev.location}` : ''}${np ? ` · for ${np.name}` : ''}`}
        actions={<><StatusBadge status={ev.status} /><Link className="ch-btn ch-btn--secondary ch-btn--sm" to={`/events/${ev.key}`}><ExternalLink size={16} aria-hidden="true" /> Public page</Link></>}
      />

      <StateBanner ev={ev} approvalLink={approvalLink} isAdmin={isAdmin} />

      <StatRow label="Event totals">
        <Stat label="Raised" value={dollars(totals.raised)} />
        <Stat label="Backers" value={totals.backed} />
        <Stat label="Joined" value={totals.joined} />
        <Stat label="Chat messages" value={totals.chat} />
        <Stat label="Updates posted" value={totals.updates} />
      </StatRow>

      <div className="grid-2c se-live-grid">
        <div className="stack">
          <UpdateComposer ev={ev} enabled={open} />
          <CheckIn ev={ev} enabled={open} />
        </div>
        <div className="stack">
          <Section title="Share this event" id="se-share">
            <div className="se-share">
              <QR value={link} size={168} label={`QR code that opens the public page for ${ev.title}`} />
              <div className="stack">
                <p className="ch-muted">Show this at the venue or put it on a flyer. It opens the public event page.</p>
                <CopyLink link={link} />
              </div>
            </div>
          </Section>
          <Section title="Recent donations" id="se-donations" aside={<span className="ch-muted">{plural(donations.length, 'gift')}</span>}>
            {donations.length === 0 ? <p className="ch-muted">No donations yet.</p> : (
              <ul className="se-list">
                {donations.slice(0, 8).map((d) => (
                  <li key={d.id}>
                    <Avatar name={d.publicName} />
                    <span className="se-list__main"><strong>{d.publicName}</strong> <span className="ch-muted">{timeAgo(d.createdAt, now)}</span></span>
                    <span className="se-list__end">{centsToDollars(d.amountCents)}{d.status === 'Disputed' ? ' · Disputed' : ''}</span>
                  </li>
                ))}
              </ul>
            )}
            {hasDemoDonations && <p className="demo-note">Some of these gifts are demo history that comes with the sample event.</p>}
          </Section>
        </div>
      </div>

      <Roster ev={ev} enabled={open} />
      <RecentUpdates ev={ev} />
    </>
  )
}

function StateBanner({ ev, approvalLink, isAdmin }) {
  let tone = 'info', text = null
  if (ev.status === 'Blocked') { tone = 'danger'; text = `This event was paused by Charity Hub${ev.blocked?.reason ? `: ${ev.blocked.reason}` : '.'} Updates and check-in are closed until it is restored.` }
  else if (ev.status === 'Archived') text = 'This event is archived. Everything here is read only.'
  else if (ev.status === 'Completed') text = 'This event has ended. You can still post a thank-you, and check-in stays open for late arrivals.'
  else if (ev.status !== 'Live') { tone = 'warn'; text = `This event is not live yet (${ev.status.toLowerCase()}). Updates and check-in open once it goes live.` }
  else if (isAdmin) text = 'You are viewing this as a Charity Hub admin. Updates and check-in belong to the organizer and the nonprofit.'
  if (!text) return null
  return (
    <div className={`se-banner se-banner--${tone}`} role="status">
      <p><strong>{ev.status === 'Live' ? 'Note: ' : `${ev.status}: `}</strong>{text}</p>
      {!['Live', 'Blocked', 'Archived', 'Completed'].includes(ev.status) && <Link className="link-btn" to={approvalLink}>See where it stands</Link>}
    </div>
  )
}

function CopyLink({ link }) {
  const toast = useToast()
  const copy = async () => {
    try { await navigator.clipboard.writeText(link); toast('Link copied.') } catch { toast('Copy the link from the box below.', 'error') }
  }
  return (
    <div className="stack se-copy">
      <button type="button" className="ch-btn ch-btn--secondary ch-btn--sm" onClick={copy}><Copy size={16} aria-hidden="true" /> Copy link</button>
      <input className="ch-field__input" readOnly value={link} aria-label="Event link" onFocus={(e) => e.target.select()} />
    </div>
  )
}

/* ------------------------------------------------------------------ post an update */
function UpdateComposer({ ev, enabled }) {
  const run = useRun()
  const fileRef = useRef(null)
  const [text, setText] = useState('')
  const [media, setMedia] = useState('')
  const [err, setErr] = useState('')
  const photos = photoList(ev)
  const pick = (e) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    if (!f.type.startsWith('image/')) return setErr('Only image files can be added.')
    setErr(''); if (typeof URL.createObjectURL === 'function') setMedia(URL.createObjectURL(f))
  }
  const send = (e) => {
    e.preventDefault()
    setErr('')
    const r = run('postUpdate', { eventKey: ev.key, text, mediaUrl: media }, { quiet: true, success: 'Update posted.' })
    if (!r.ok) return setErr(r.error.message)
    setText(''); setMedia('')
  }
  return (
    <Section title="Post an update" id="se-update">
      {!enabled && <p className="ch-muted">Updates open once the event is live.</p>}
      <form className="stack" onSubmit={send} noValidate>
        <Field id="se-update-text" label="What is happening?" error={err} hint="Everyone who joined or backed the event sees this on the event page.">
          <textarea {...fieldProps('se-update-text', err)} className="ch-field__input idea" rows={3} maxLength={1000} value={text} disabled={!enabled} onChange={(e) => setText(e.target.value)} aria-describedby={err ? 'se-update-text-err' : 'se-update-text-hint'} />
        </Field>
        {media && (
          <div className="se-media">
            <img src={media} alt="Attached to your update" />
            <button type="button" className="icon-btn" aria-label="Remove the photo from this update" onClick={() => setMedia('')}><X size={18} aria-hidden="true" /></button>
          </div>
        )}
        <div className="row">
          <button type="button" className="ch-btn ch-btn--secondary ch-btn--sm" disabled={!enabled} onClick={() => fileRef.current?.click()}><ImagePlus size={16} aria-hidden="true" /> Upload a photo</button>
          <input ref={fileRef} type="file" accept="image/*" hidden aria-label="Upload a photo for the update" onChange={pick} />
          {photos.length > 0 && (
            <>
              <label className="ch-sr" htmlFor="se-update-pick">Or use an event photo</label>
              <select id="se-update-pick" className="ch-field__input se-select-sm" disabled={!enabled} value="" onChange={(e) => e.target.value && setMedia(e.target.value)}>
                <option value="">Or use an event photo</option>
                {photos.slice(0, 8).map((p, i) => <option key={p} value={p}>Event photo {i + 1}</option>)}
              </select>
            </>
          )}
          <span className="se-foot__spacer" />
          <button type="submit" className="ch-btn ch-btn--primary" disabled={!enabled}>Post update</button>
        </div>
      </form>
    </Section>
  )
}

function RecentUpdates({ ev }) {
  const s = useDomain()
  const { now } = useSession()
  const posts = postsFor(s, ev.key).filter((p) => p.host).slice(-5).reverse()
  return (
    <Section title="Your recent updates" id="se-recent">
      {posts.length === 0 ? <p className="ch-muted">You have not posted an update yet.</p> : (
        <ul className="se-list se-list--posts">
          {posts.map((p) => (
            <li key={p.id}>
              <span className="se-list__main">
                <strong>{p.authorName ?? authorName(s, p.authorId, 'Nonprofit')}</strong> <span className="ch-muted">{timeAgo(p.createdAt, now)}</span>
                {p.text && <span className="se-post__text">{p.text}</span>}
              </span>
              {p.mediaUrl && <img className="se-post__img" src={p.mediaUrl} alt="Photo attached to this update" />}
            </li>
          ))}
        </ul>
      )}
    </Section>
  )
}

/* ------------------------------------------------------------------ check-in */
function CheckIn({ ev, enabled }) {
  const run = useRun()
  const { now } = useSession()
  const [code, setCode] = useState('')
  const [result, setResult] = useState(null) // { tone, title, detail }
  const [scanning, setScanning] = useState(false)
  const inputRef = useRef(null)

  const submitCode = (value) => {
    const r = run('checkIn', { eventKey: ev.key, code: value }, { quiet: true })
    if (r.ok) {
      setResult({ tone: 'ok', title: `Checked in: ${r.data.name}`, detail: `Ticket ${r.data.code}${r.data.backed ? ', has donated' : ''}.` })
      setCode('')
    } else {
      let detail = ''
      if (r.error.code === 'already_checked_in') {
        const prior = ev.checkins.find((x) => x.code.toUpperCase() === value.trim().toUpperCase())
        detail = prior ? `${prior.name} checked in ${timeAgo(prior.at, now)}.` : ''
      }
      setResult({ tone: r.error.code === 'already_checked_in' ? 'warn' : 'danger', title: `${CHECKIN_REASONS[r.error.code] ?? 'Not checked in'}: ${r.error.message}`, detail })
    }
    inputRef.current?.focus()
  }
  const onSubmit = (e) => { e.preventDefault(); submitCode(code) }

  return (
    <Section title="Check people in" id="se-checkin">
      {!enabled && <p className="ch-muted">Check-in opens once the event is live.</p>}
      <form className="stack" onSubmit={onSubmit} noValidate>
        <Field id="se-checkin-code" label="Ticket code" hint="Scan the QR on a guest’s ticket, or type the code printed under it. For example CH-RIV-1001.">
          <input {...fieldProps('se-checkin-code')} aria-describedby="se-checkin-code-hint" ref={inputRef} value={code} disabled={!enabled} autoComplete="off" autoCapitalize="characters" spellCheck={false} onChange={(e) => setCode(e.target.value)} />
        </Field>
        <div className="row">
          <button type="submit" className="ch-btn ch-btn--primary" disabled={!enabled}>Check in</button>
          <button type="button" className="ch-btn ch-btn--secondary" disabled={!enabled} onClick={() => setScanning(true)}><Camera size={18} aria-hidden="true" /> Scan a ticket</button>
        </div>
      </form>
      <div role="status" aria-live="polite" className="se-result-wrap">
        {result && (
          <div className={`se-result se-result--${result.tone}`}>
            <p className="se-result__title">{result.title}</p>
            {result.detail && <p>{result.detail}</p>}
          </div>
        )}
      </div>
      {scanning && <ScanModal onClose={() => setScanning(false)} onCode={(c) => { setScanning(false); setCode(c); submitCode(c) }} />}
      <WalkIn ev={ev} enabled={enabled} />
    </Section>
  )
}

/** Camera scan with the browser's BarcodeDetector when it exists; otherwise says so and points to typing. */
function ScanModal({ onClose, onCode }) {
  const videoRef = useRef(null)
  const found = useRef(onCode)
  found.current = onCode
  const [msg, setMsg] = useState('Starting the camera…')
  useEffect(() => {
    let stop = false, stream = null, timer = null
    const supported = typeof window !== 'undefined' && 'BarcodeDetector' in window && navigator.mediaDevices?.getUserMedia
    if (!supported) { setMsg('Scanning is not available in this browser. Close this and type the ticket code instead.'); return undefined }
    ;(async () => {
      try {
        const detector = new window.BarcodeDetector({ formats: ['qr_code'] })
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        if (stop) return stream.getTracks().forEach((t) => t.stop())
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        setMsg('Point the camera at the QR code on the ticket.')
        const tick = async () => {
          if (stop) return
          try {
            const hits = await detector.detect(videoRef.current)
            if (hits[0]?.rawValue) return found.current(hits[0].rawValue)
          } catch { /* keep trying */ }
          timer = setTimeout(tick, 300)
        }
        tick()
      } catch { setMsg('We could not open the camera. Check the browser permission, or type the ticket code instead.') }
    })()
    return () => { stop = true; clearTimeout(timer); stream?.getTracks().forEach((t) => t.stop()) }
  }, [])
  return (
    <Modal title="Scan a ticket" onClose={onClose} labelledBy="se-scan-t">
      <div className="stack">
        <video ref={videoRef} className="se-scan" muted playsInline aria-label="Camera preview" />
        <p role="status">{msg}</p>
        <div className="dialog-actions"><button type="button" className="ch-btn ch-btn--secondary" onClick={onClose}>Close</button></div>
      </div>
    </Modal>
  )
}

function WalkIn({ ev, enabled }) {
  const run = useRun()
  const [name, setName] = useState('')
  const [backed, setBacked] = useState(false)
  const [err, setErr] = useState('')
  const submit = (e) => {
    e.preventDefault()
    setErr('')
    const r = run('walkIn', { eventKey: ev.key, name, backed }, { quiet: true, success: `${name.trim()} added to the roster.` })
    if (!r.ok) return setErr(r.error.message)
    setName(''); setBacked(false)
  }
  return (
    <form className="stack se-walkin" onSubmit={submit} noValidate aria-label="Add a walk-in guest">
      <h3 className="se-h3">Walk-in guest</h3>
      <Field id="se-walkin-name" label="Guest name" error={err} hint="For people who arrive without a ticket.">
        <input {...fieldProps('se-walkin-name', err)} aria-describedby={err ? 'se-walkin-name-err' : 'se-walkin-name-hint'} value={name} disabled={!enabled} autoComplete="off" onChange={(e) => setName(e.target.value)} />
      </Field>
      <label className="se-check">
        <input type="checkbox" checked={backed} disabled={!enabled} onChange={(e) => setBacked(e.target.checked)} />
        <span>They donated to the event</span>
      </label>
      <div><button type="submit" className="ch-btn ch-btn--secondary" disabled={!enabled}>Add walk-in</button></div>
    </form>
  )
}

/* ------------------------------------------------------------------ roster */
function Roster({ ev, enabled }) {
  const s = useDomain()
  const rows = useMemo(() => {
    const byCode = new Map(ev.checkins.filter((c) => c.code).map((c) => [c.code.toUpperCase(), c]))
    const joined = ev.joinedIds.map((id) => {
      const code = ev.tickets[id] ?? ''
      const c = byCode.get(code.toUpperCase())
      return { id, name: authorName(s, id, 'Guest'), code, status: c ? 'Checked in' : 'Not here yet', at: c?.at ?? null, backed: c?.backed ?? s.donations.some((d) => d.eventKey === ev.key && d.donorId === id && d.status === 'Successful' && !d.seeded) }
    })
    const walkIns = ev.checkins.filter((c) => c.walkIn).map((c) => ({ id: c.id, name: c.name, code: '', status: 'Checked in (walk-in)', at: c.at, backed: c.backed }))
    return [...joined, ...walkIns]
  }, [ev, s])
  const here = ev.checkins.length
  const demoJoined = ev.baseJoined
  return (
    <Section title="Roster" id="se-roster" aside={<span className="ch-muted">{here} checked in, {ev.joinedIds.length} ticket holders{enabled ? '' : ' (read only)'}</span>}>
      {rows.length === 0 ? (
        <Empty title="Nobody on the roster yet.">Guests who join the event appear here with their ticket code. Walk-ins you add show up too.</Empty>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <caption className="ch-sr">People who joined or walked in</caption>
            <thead><tr><th scope="col">Name</th><th scope="col">Ticket</th><th scope="col">Status</th><th scope="col">Donated</th><th scope="col">Time</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <th scope="row">{r.name}</th>
                  <td>{r.code || 'Walk-in'}</td>
                  <td>{r.status}</td>
                  <td>{r.backed ? 'Yes' : 'No'}</td>
                  <td>{r.at ? fmtDateTime(r.at) : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {demoJoined > 0 && <p className="demo-note">The joined total includes {demoJoined} demo guests that come with the sample event. They are not listed here.</p>}
    </Section>
  )
}
