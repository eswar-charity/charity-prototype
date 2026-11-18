import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Empty, PageHeader, StatusBadge, fmtDateTime, plural, useRun } from '../../ui/kit.jsx'
import { useDomain } from '../../domain/store.jsx'
import { authorName } from '../../domain/selectors.js'
import { FilterBar, OPEN_REVIEW, ResultCount, SelectField, parseContentRef } from './common.jsx'

const KIND_LABEL = { post: 'Post', reply: 'Reply', chat: 'Chat message' }

/** Find the reported content in the domain state, with its author name. */
function lookup(s, ref) {
  const { kind, id, eventKey } = parseContentRef(ref)
  let item = null
  let author = ''
  if (kind === 'post') {
    item = s.posts.find((p) => p.id === id)
    if (item) author = item.authorName ?? (item.authorId?.startsWith('np:') ? s.nonprofits[item.authorId.slice(3)]?.name : authorName(s, item.authorId)) ?? 'Someone'
  } else if (kind === 'reply') {
    for (const p of s.posts) { const r = p.replies.find((x) => x.id === id); if (r) { item = r; break } }
    if (item) author = item.authorName ?? authorName(s, item.authorId)
  } else if (kind === 'chat') {
    item = (s.chat[eventKey] ?? []).find((m) => m.id === id)
    if (item) author = authorName(s, item.authorId)
  }
  return { kind, id, eventKey, item, author }
}

export default function Moderation() {
  const s = useDomain()
  const run = useRun()
  const [show, setShow] = useState('open')

  // One card per piece of content; every report on it is listed as a reason.
  const groups = []
  s.reviewItems.filter((r) => r.type === 'Content report').forEach((r) => {
    let g = groups.find((x) => x.ref === r.entityRef)
    if (!g) { g = { ref: r.entityRef, reports: [] }; groups.push(g) }
    g.reports.push(r)
  })
  groups.forEach((g) => { g.open = g.reports.some((r) => OPEN_REVIEW.includes(r.status)); g.newest = Math.max(...g.reports.map((r) => new Date(r.createdAt).getTime())) })
  const shown = groups.filter((g) => show === 'all' || g.open).sort((a, b) => Number(b.open) - Number(a.open) || b.newest - a.newest)

  const decide = (g, decision, success) => {
    const { kind, id, eventKey } = parseContentRef(g.ref)
    run('moderateContent', { kind, id, eventKey, decision }, { success })
  }

  return (
    <>
      <PageHeader eyebrow="Moderation" title="Moderation" lede="Posts, replies and chat messages people have reported. Hidden content disappears from the public page. Removed content is also gone for the author." />
      <FilterBar label="Filter reports">
        <SelectField id="mod-show" label="Show" value={show} onChange={setShow} options={[{ value: 'open', label: 'Needs a decision' }, { value: 'all', label: 'All reports' }]} />
      </FilterBar>
      <ResultCount>{plural(shown.length, 'reported item')}</ResultCount>
      {shown.length === 0 ? (
        <Empty title={show === 'open' ? 'Nothing to moderate' : 'No reports yet'} action={show === 'open' && groups.length > 0 ? <button type="button" className="link-btn" onClick={() => setShow('all')}>Show decided reports</button> : undefined}>
          Reports from guests, organizers and nonprofits appear here with the content they point to.
        </Empty>
      ) : (
        <ul className="adm-cards">
          {shown.map((g) => {
            const c = lookup(s, g.ref)
            const ev = s.events[c.eventKey]
            const state = c.item?.removed ? 'Removed' : c.item?.hidden ? 'Hidden' : 'Visible'
            const label = KIND_LABEL[c.kind] ?? 'Content'
            return (
              <li key={g.ref} className="panel-section adm-card">
                <div className="panel-section__head">
                  <h2 className="h-heading-sm">{label} reported</h2>
                  <div className="row">
                    <StatusBadge status={g.open ? 'Open' : 'Resolved'}>{g.open ? 'Needs a decision' : 'Decided'}</StatusBadge>
                    {c.item && <StatusBadge status={state === 'Visible' ? 'Live' : 'Closed'}>{state === 'Visible' ? 'Visible to the public' : state}</StatusBadge>}
                  </div>
                </div>
                {c.item ? (
                  <figure className="adm-quote">
                    <blockquote>{c.item.text || (c.item.mediaUrl ? 'Photo with no text.' : 'No text.')}</blockquote>
                    <figcaption>{c.author} · {fmtDateTime(c.item.createdAt)}</figcaption>
                  </figure>
                ) : (
                  <p className="ch-muted">This content no longer exists.</p>
                )}
                <dl className="adm-facts">
                  <div><dt>Event</dt><dd>{ev ? <Link to={`/events/${ev.key}`}>{ev.title}</Link> : c.eventKey}</dd></div>
                  <div>
                    <dt>{plural(g.reports.length, 'report')}</dt>
                    <dd>
                      <ul className="adm-reasons">
                        {g.reports.map((r) => <li key={r.id}>&ldquo;{r.summary}&rdquo; <span className="ch-muted">reported by {r.submittedBy}, <Link to={`/admin/review/${r.id}`}>{r.code}</Link></span></li>)}
                      </ul>
                    </dd>
                  </div>
                </dl>
                {g.open ? (
                  <div className="row">
                    <button type="button" className="ch-btn ch-btn--secondary" onClick={() => decide(g, 'hide', `${label} hidden`)} disabled={!c.item}>Hide</button>
                    <button type="button" className="ch-btn ch-btn--danger" onClick={() => decide(g, 'remove', `${label} removed`)} disabled={!c.item}>Remove</button>
                    <button type="button" className="ch-btn ch-btn--text" onClick={() => decide(g, 'dismiss', 'Report dismissed')} disabled={!c.item}>Dismiss</button>
                  </div>
                ) : (
                  <p className="adm-decided" role="status">Decided: {g.reports.map((r) => r.status).join(', ').toLowerCase()}. See the audit log for who acted.</p>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}
