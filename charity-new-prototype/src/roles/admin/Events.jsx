import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Empty, Field, Modal, PageHeader, Section, StatusBadge, centsToDollars, fieldProps, fmtDate, plural, useConfirm, useRun, useToast } from '../../ui/kit.jsx'
import { useAct, useDomain, useSession } from '../../domain/store.jsx'
import { liveEvents } from '../../domain/selectors.js'
import { EVENT_STATUSES } from '../../domain/engine.js'
import { DAY, FilterBar, ResultCount, SearchField, SelectField } from './common.jsx'

export default function Events() {
  const s = useDomain()
  const { now } = useSession()
  const [params] = useSearchParams()
  const [status, setStatus] = useState('all')
  const [q, setQ] = useState(params.get('q') ?? '')
  const [blocking, setBlocking] = useState(null)
  const run = useRun()
  const confirm = useConfirm()

  const needle = q.trim().toLowerCase()
  const rows = liveEvents(s)
    .filter((e) => status === 'all' || e.status === status)
    .filter((e) => !needle || [e.title, e.key, e.location, s.users[e.organizerId]?.name, s.nonprofits[e.nonprofitId]?.name].some((f) => (f ?? '').toLowerCase().includes(needle)))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  const filtered = status !== 'all' || needle

  const restore = async (ev) => {
    const ok = await confirm({ title: `Restore ${ev.title}?`, body: 'It goes back to Live and people can join, post and give again. Refunds already made are not reversed.', confirm: 'Restore event' })
    if (ok) run('restoreEvent', { key: ev.key }, { success: `${ev.title} is live again` })
  }

  return (
    <>
      <PageHeader eyebrow="Events" title="Events" lede="Every event on the platform, including drafts and events people cannot see. Pause a live event if something is wrong." />
      <Section>
        <FilterBar label="Filter events">
          <SelectField id="ev-status" label="Status" value={status} onChange={setStatus} options={[{ value: 'all', label: 'All statuses' }, ...EVENT_STATUSES]} />
          <SearchField id="ev-q" label="Search" value={q} onChange={setQ} placeholder="Title, organizer, nonprofit or place" />
        </FilterBar>
        <ResultCount>{plural(rows.length, 'event')}</ResultCount>
        {rows.length === 0 ? (
          <Empty title="No events match" action={filtered ? <button type="button" className="link-btn" onClick={() => { setStatus('all'); setQ('') }}>Clear filters</button> : undefined}>
            Try a different status or search.
          </Empty>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <caption className="ch-sr">All events</caption>
              <thead><tr><th scope="col">Event</th><th scope="col">Organizer</th><th scope="col">Nonprofit</th><th scope="col">Date</th><th scope="col">Status</th><th scope="col">Actions</th></tr></thead>
              <tbody>
                {rows.map((ev) => {
                  const np = s.nonprofits[ev.nonprofitId]
                  const left = ev.blocked ? Math.ceil((new Date(ev.blocked.expiresAt).getTime() - now.getTime()) / DAY) : 0
                  return (
                    <tr key={ev.key}>
                      <td><Link to={`/events/${ev.key}`} aria-label={`${ev.title}, public page`}>{ev.title}</Link></td>
                      <td>{s.users[ev.organizerId]?.name ?? 'Unknown'}</td>
                      <td>{np ? <Link to={`/admin/nonprofits/${np.id}`}>{np.name}</Link> : <span className="ch-muted">None chosen</span>}</td>
                      <td className="adm-nowrap">{ev.date || 'No date yet'}</td>
                      <td>
                        <StatusBadge status={ev.status} />
                        {ev.status === 'Blocked' && ev.blocked && (
                          <p className="adm-blocked">
                            {ev.blocked.reason}. {ev.blocked.mode === 'refund' ? 'Donations were refunded.' : 'Money is held.'}{' '}
                            {left > 0 ? `${plural(left, 'day')} left until the block expires on ${fmtDate(ev.blocked.expiresAt)}.` : 'The block has expired. The lifecycle job will refund donations and archive the event.'}
                            {ev.blocked.suspension && <> <Link to={`/admin/nonprofits/${ev.nonprofitId}`}>Reinstate the nonprofit</Link> to restore all of its events.</>}
                          </p>
                        )}
                      </td>
                      <td>
                        <div className="table-actions">
                          {ev.status === 'Live' && <button type="button" className="ch-btn ch-btn--danger ch-btn--sm" aria-label={`Block ${ev.title}`} onClick={() => setBlocking(ev.key)}>Block</button>}
                          {ev.status === 'Blocked' && <button type="button" className="ch-btn ch-btn--secondary ch-btn--sm" aria-label={`Restore ${ev.title}`} onClick={() => restore(ev)}>Restore</button>}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Section>
      {blocking && <BlockModal ev={s.events[blocking]} onClose={() => setBlocking(null)} />}
    </>
  )
}

function BlockModal({ ev, onClose }) {
  const s = useDomain()
  const act = useAct()
  const toast = useToast()
  const [reason, setReason] = useState('')
  const [mode, setMode] = useState('hold')
  const [error, setError] = useState('')
  const gifts = s.donations.filter((d) => d.eventKey === ev.key && d.status === 'Successful' && !d.seeded)
  const total = gifts.reduce((t, d) => t + d.amountCents, 0)

  const submit = (e) => {
    e.preventDefault()
    const r = act('blockEvent', { key: ev.key, reason, mode })
    if (r.ok) { toast(`${ev.title} blocked`); onClose() } else setError(r.error.message)
  }
  return (
    <Modal title={`Block ${ev.title}`} onClose={onClose}>
      <form onSubmit={submit} noValidate>
        <p className="ch-muted">The public page shows &ldquo;Temporarily unavailable&rdquo;. People cannot join, post or give. The organizer and the nonprofit are told why. A block lasts 14 days, then the lifecycle job refunds donations and archives the event unless you restore it.</p>
        <Field id="block-reason" label="Reason" hint="Shown to the organizer and the nonprofit." error={error}>
          <textarea {...fieldProps('block-reason', error)} className="ch-field__input adm-textarea" rows={3} value={reason} onChange={(e) => { setReason(e.target.value); setError('') }} />
        </Field>
        <fieldset className="adm-radios">
          <legend className="ch-field__label">What happens to donations?</legend>
          <label className="check"><input type="radio" name="block-mode" value="hold" checked={mode === 'hold'} onChange={() => setMode('hold')} /> Hold the money. Nothing is refunded yet.</label>
          <label className="check"><input type="radio" name="block-mode" value="refund" checked={mode === 'refund'} onChange={() => setMode('refund')} /> Refund now. {gifts.length === 0 ? 'There are no donations to refund.' : `${plural(gifts.length, 'donation')} (${centsToDollars(total)}) will go back to donors.`}</label>
        </fieldset>
        <div className="dialog-actions">
          <button type="button" className="ch-btn ch-btn--secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="ch-btn ch-btn--danger">Block event</button>
        </div>
      </form>
    </Modal>
  )
}
