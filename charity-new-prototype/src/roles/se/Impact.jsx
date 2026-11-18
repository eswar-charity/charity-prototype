import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Repeat } from 'lucide-react'
import { useDomain, useSession } from '../../domain/store.jsx'
import { eventTotals } from '../../domain/engine.js'
import { photoList, postsFor, seEvents } from '../../domain/selectors.js'
import { Empty, Field, fieldProps, PageHeader, Section, Stat, StatRow, StatusBadge, dollars, fmtDate, plural, timeAgo, useRun } from '../../ui/kit.jsx'
import { NotYours, npNameOf, useOwnedEvent, whenText } from './common.jsx'

const FINISHED = ['Completed', 'Archived']

/** /se/impact: my finished events. */
export function ImpactList() {
  const s = useDomain()
  const { user } = useSession()
  const list = seEvents(s, user.id).filter((e) => FINISHED.includes(e.status)).sort((a, b) => new Date(b.completedAt ?? b.createdAt) - new Date(a.completedAt ?? a.createdAt))
  return (
    <>
      <PageHeader eyebrow="Impact" title="Events you have finished" lede="What each event raised, who came, and what you shared along the way." />
      {list.length === 0 ? (
        <Empty title="Nothing has finished yet." action={<Link className="ch-btn ch-btn--secondary" to="/se">Back to home</Link>}>
          When an event ends it moves here, with a summary you can share and a way to run it again.
        </Empty>
      ) : (
        <ul className="se-cards">
          {list.map((e) => {
            const t = eventTotals(s, e.key)
            return (
              <li key={e.key} className="se-card se-card--text">
                <div className="se-card__body">
                  <div className="row"><h2 className="se-card__title">{e.title}</h2><StatusBadge status={e.status} /></div>
                  <p className="ch-muted">{npNameOf(s, e)} · {whenText(e)}</p>
                  <p><strong>{dollars(t.raised)}</strong> raised · {plural(t.backed, 'backer')} · {t.joined} joined</p>
                  <div className="row"><Link className="ch-btn ch-btn--primary ch-btn--sm" to={`/se/impact/${e.key}`}>See the impact</Link></div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}

/** /se/impact/:key: the summary for one finished event, a thank-you post and "run it again". */
export default function Impact() {
  const { key } = useParams()
  const { state, ev, s } = useOwnedEvent(key)
  const { now } = useSession()
  const run = useRun()
  const nav = useNavigate()
  const [text, setText] = useState('')
  const [err, setErr] = useState('')
  if (state !== 'ok') return <NotYours missing={state === 'missing'} home="/se/impact" homeLabel="Back to impact" />

  if (!FINISHED.includes(ev.status)) {
    return (
      <>
        <PageHeader back={{ to: '/se/impact', label: 'Impact' }} title={ev.title} actions={<StatusBadge status={ev.status} />} />
        <Empty title="The impact summary opens once the event has ended." action={<Link className="ch-btn ch-btn--primary" to={ev.status === 'Live' ? `/se/live/${ev.key}` : `/se/approval/${ev.key}`}>{ev.status === 'Live' ? 'Open the live dashboard' : 'View status'}</Link>}>
          This event is {ev.status.toLowerCase()} for now.
        </Empty>
      </>
    )
  }

  const t = eventTotals(s, ev.key)
  const photos = photoList(ev)
  const thanks = postsFor(s, ev.key).filter((p) => p.host && p.phase === 'after').slice(-3).reverse()
  const canPost = ev.status === 'Completed'
  const post = (e) => {
    e.preventDefault()
    setErr('')
    const r = run('postUpdate', { eventKey: ev.key, text }, { quiet: true, success: 'Thank-you posted.' })
    if (!r.ok) return setErr(r.error.message)
    setText('')
  }
  const again = () => run('cloneEvent', { key: ev.key }, { success: 'Copied as a new draft. Set a new date to get going.', onOk: (copy) => nav(`/se/create/${copy.key}/1`) })

  return (
    <>
      <PageHeader
        back={{ to: '/se/impact', label: 'Impact' }}
        eyebrow="Impact"
        title={ev.title}
        lede={`${whenText(ev)} · ${ev.location} · for ${npNameOf(s, ev)}`}
        actions={<><StatusBadge status={ev.status} /><Link className="ch-btn ch-btn--secondary ch-btn--sm" to={`/events/${ev.key}`}>Public page</Link></>}
      />

      <StatRow label="Impact totals">
        <Stat label="Raised" value={dollars(t.raised)} />
        <Stat label="Backers" value={t.backed} />
        <Stat label="Participants" value={t.joined} hint={`${ev.checkins.length} checked in`} />
        <Stat label="Updates posted" value={t.updates} />
        <Stat label="Photos" value={photos.length} />
      </StatRow>

      <div className="grid-2c">
        <Section title="Say thank you" id="se-thanks">
          {canPost ? (
            <form className="stack" onSubmit={post} noValidate>
              <Field id="se-thanks-text" label="Your thank-you" error={err} hint="Everyone who joined or gave will see it on the event page.">
                <textarea {...fieldProps('se-thanks-text', err)} aria-describedby={err ? 'se-thanks-text-err' : 'se-thanks-text-hint'} className="ch-field__input idea" rows={4} maxLength={1000} value={text} onChange={(e) => setText(e.target.value)} />
              </Field>
              <div><button type="submit" className="ch-btn ch-btn--primary">Post thank-you</button></div>
            </form>
          ) : (
            <p className="ch-muted">This event is archived, so new posts are closed. Your earlier updates stay on the public page.</p>
          )}
          {thanks.length > 0 && (
            <div className="stack">
              <h3 className="se-h3">Your latest thank-yous</h3>
              <ul className="se-list se-list--posts">
                {thanks.map((p) => <li key={p.id}><span className="se-list__main"><span className="ch-muted">{timeAgo(p.createdAt, now)}</span><span className="se-post__text">{p.text}</span></span></li>)}
              </ul>
            </div>
          )}
        </Section>

        <Section title="Run it again" id="se-again">
          <p>Copy this event into a new draft with the same story, nonprofit and photos. You choose the new date.</p>
          <div><button type="button" className="ch-btn ch-btn--secondary" onClick={again}><Repeat size={16} aria-hidden="true" /> Run it again</button></div>
          <p className="ch-muted">Finished {fmtDate(ev.completedAt ?? ev.liveAt)}.</p>
        </Section>
      </div>

      <Section title="Photos" id="se-photos-s">
        {photos.length === 0 ? <p className="ch-muted">No photos on this event.</p> : (
          <ul className="se-gallery">
            {photos.map((p, i) => <li key={p}><img src={p} alt={`Photo ${i + 1} from ${ev.title}`} loading="lazy" /></li>)}
          </ul>
        )}
      </Section>
    </>
  )
}
