import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Field, PageHeader, Section, Stat, StatRow, Empty, StatusBadge, dollars, fieldProps, plural, timeAgo, useRun, useToast } from '../../ui/kit.jsx'
import { useAct, useDomain, useSession } from '../../domain/store.jsx'
import { adminMetrics } from '../../domain/selectors.js'
import { OPEN_REVIEW, PRIORITY_RANK, toLocalInput } from './common.jsx'

export default function Dashboard() {
  const s = useDomain()
  const { now } = useSession()
  const m = adminMetrics(s)
  const actionItems = s.reviewItems
    .filter((r) => OPEN_REVIEW.includes(r.status))
    .sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || new Date(a.createdAt) - new Date(b.createdAt))
  const openExceptions = s.exceptions.filter((x) => x.status !== 'Resolved')

  return (
    <>
      <PageHeader eyebrow="Charity Hub admin" title="Dashboard" lede="What needs a decision today, and the controls for the demo clock." />

      <StatRow label="Platform metrics">
        <Stat label="Live events" value={m.liveEvents} hint={<Link to="/admin/events">See all events</Link>} />
        <Stat label="Pending reviews" value={m.pendingReviews} hint={<Link to="/admin/review">Open the queue</Link>} />
        <Stat label="Nonprofits to verify" value={m.nonprofitsToVerify} hint={<Link to="/admin/nonprofits">See nonprofits</Link>} />
        <Stat label="Open exceptions" value={m.openExceptions} hint={<Link to="/admin/exceptions">See exceptions</Link>} />
        <Stat label="Flagged content" value={m.flaggedContent} hint={<Link to="/admin/moderation">Open moderation</Link>} />
        <Stat label="Demo GMV" value={dollars(m.gmv)} hint="Demo total, no date filter" />
      </StatRow>

      <div className="grid-2c">
        <Section title="Action items" id="action-items" aside={<Link to="/admin/review" className="adm-more">All review items</Link>}>
          {actionItems.length === 0 ? (
            <Empty title="Nothing is waiting for review">New nonprofit verifications, event reviews and content reports show up here.</Empty>
          ) : (
            <ul className="adm-list">
              {actionItems.slice(0, 5).map((r) => (
                <li key={r.id}>
                  <div className="adm-list__main">
                    <Link to={`/admin/review/${r.id}`}>{r.title}</Link>
                    <span className="ch-muted">{r.code} · {r.type} · {timeAgo(r.createdAt, now)}</span>
                  </div>
                  <div className="adm-list__badges"><StatusBadge status={r.priority}>{r.priority} priority</StatusBadge><StatusBadge status={r.status} /></div>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Open exceptions" id="open-exceptions" aside={<Link to="/admin/exceptions" className="adm-more">Manage exceptions</Link>}>
          {openExceptions.length === 0 ? (
            <Empty title="No open exceptions">Disputes and payout holds appear here until they are resolved.</Empty>
          ) : (
            <ul className="adm-list">
              {openExceptions.map((x) => (
                <li key={x.id}>
                  <div className="adm-list__main">
                    <Link to="/admin/exceptions">{x.title}</Link>
                    <span className="ch-muted">{x.code} · {x.type} · {x.entityRef}{x.amount ? ` · ${dollars(x.amount)}` : ''}</span>
                  </div>
                  <div className="adm-list__badges"><StatusBadge status={x.severity}>{x.severity} severity</StatusBadge><StatusBadge status={x.status} /></div>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      <ClockCard />
    </>
  )
}

function ClockCard() {
  const { now } = useSession()
  const act = useAct()
  const toast = useToast()
  const run = useRun()
  const [local, setLocal] = useState(toLocalInput(now))
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  useEffect(() => { setLocal(toLocalInput(now)) }, [now.getTime()]) // eslint-disable-line react-hooks/exhaustive-deps

  const advance = (days) => run('advanceClock', { days }, { success: `Clock moved forward ${plural(days, 'day')}` })
  const setDate = (e) => {
    e.preventDefault()
    const d = new Date(local)
    const r = act('setClock', { iso: Number.isNaN(d.getTime()) ? local : d.toISOString() })
    if (r.ok) { setError(''); toast('Clock set') } else setError(r.error.message)
  }
  const lifecycle = () => run('runLifecycle', {}, { success: 'Lifecycle job finished', onOk: setResult })

  return (
    <Section title="Demo clock and lifecycle job" id="clock">
      <p className="ch-muted adm-note">
        Prototype tool. The whole app reads this clock, so moving it ends events, expires blocks and ages payments. The lifecycle job is the daily job in the real app; here you run it by hand.
      </p>
      <div className="grid-2c">
        <div className="stack">
          <p className="adm-clock">
            <span className="ch-muted">Domain clock</span>
            <time dateTime={now.toISOString()} className="adm-clock__time">{now.toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}</time>
          </p>
          <div className="row" role="group" aria-label="Move the clock forward">
            <button type="button" className="ch-btn ch-btn--secondary ch-btn--sm" onClick={() => advance(1)}>+1 day</button>
            <button type="button" className="ch-btn ch-btn--secondary ch-btn--sm" onClick={() => advance(7)}>+7 days</button>
            <button type="button" className="ch-btn ch-btn--secondary ch-btn--sm" onClick={() => advance(31)}>+31 days</button>
          </div>
          <form className="adm-inline-form" onSubmit={setDate} noValidate>
            <Field id="clock-set" label="Set the clock to" hint="Local date and time" error={error}>
              <input {...fieldProps('clock-set', error)} type="datetime-local" value={local} onChange={(e) => { setLocal(e.target.value); setError('') }} />
            </Field>
            <button type="submit" className="ch-btn ch-btn--secondary">Set date</button>
          </form>
        </div>
        <div className="stack">
          <p className="ch-muted">Completes events that have ended, archives events 30 days after they complete, refunds and archives blocked events whose block expired, and fails payments left unconfirmed for over a day.</p>
          <div><button type="button" className="ch-btn ch-btn--primary" onClick={lifecycle}>Run lifecycle job</button></div>
          {result && (
            <div role="status" aria-label="Lifecycle job result">
              <p className="adm-result__title">Last run</p>
              <dl className="adm-result">
                <div><dt>Events completed</dt><dd>{result.completed}</dd></div>
                <div><dt>Events archived</dt><dd>{result.archived}</dd></div>
                <div><dt>Blocks expired</dt><dd>{result.expiredBlocks}</dd></div>
                <div><dt>Payments failed</dt><dd>{result.failedPayments}</dd></div>
              </dl>
            </div>
          )}
        </div>
      </div>
    </Section>
  )
}
