import { Link, useParams } from 'react-router-dom'
import { Check, X } from 'lucide-react'
import { Empty, PageHeader, Section, StatusBadge, fmtDateTime, useRun } from '../../ui/kit.jsx'
import { useDomain } from '../../domain/store.jsx'
import { DECIDED_REVIEW, parseContentRef, roleName } from './common.jsx'

/** Where the item points: a nonprofit page, an event's public page, or the moderation queue. */
function entityFor(s, r) {
  if (r.type === 'Nonprofit Verification') {
    const np = s.nonprofits[r.entityRef]
    return np ? { kind: 'Nonprofit', label: np.name, to: `/admin/nonprofits/${np.id}` } : null
  }
  if (r.type === 'Content report') {
    const { kind, eventKey } = parseContentRef(r.entityRef)
    const ev = s.events[eventKey]
    return { kind: 'Content', label: `${kind || 'Content'} in ${ev?.title ?? eventKey}`, to: '/admin/moderation' }
  }
  const ev = s.events[r.entityRef]
  return ev ? { kind: 'Event', label: ev.title, to: `/events/${ev.key}` } : null
}

/** Approving only changes the item's status; the real follow-up lives elsewhere, so we point to it. */
function followUp(s, r, entity) {
  if (r.type === 'Nonprofit Verification' && entity) {
    return { text: 'Approving or rejecting this item only changes its status. To verify or reject the nonprofit itself, use its page. Verifying closes this item for you.', to: entity.to, label: 'Open the nonprofit to verify' }
  }
  if (r.type === 'Content report') {
    return { text: 'Approving this item only changes its status. To hide or remove the content, use Moderation. Acting there closes this item for you.', to: '/admin/moderation', label: 'Review the content in Moderation' }
  }
  if (r.type === 'Event report' && s.events[r.entityRef]) {
    return { text: 'Approving this item only changes its status. To pause the event and decide what happens to donations, block it from Events.', to: `/admin/events?q=${encodeURIComponent(r.entityRef)}`, label: 'Open the event in Events' }
  }
  return null
}

export default function ReviewDetail() {
  const { id } = useParams()
  const s = useDomain()
  const run = useRun()
  const r = s.reviewItems.find((x) => x.id === id)
  if (!r) {
    return (
      <>
        <PageHeader back={{ to: '/admin/review', label: 'Review queue' }} title="Review item not found" />
        <Empty title="We could not find that review item" action={<Link to="/admin/review">Back to the review queue</Link>}>It may have been removed, or the link is wrong.</Empty>
      </>
    )
  }
  const entity = entityFor(s, r)
  const next = followUp(s, r, entity)
  const decided = DECIDED_REVIEW.includes(r.status)
  const decide = (status, success) => run('reviewDecision', { id: r.id, status }, { success })

  return (
    <>
      <PageHeader
        back={{ to: '/admin/review', label: 'Review queue' }}
        eyebrow={`${r.code} · ${r.type}`}
        title={r.title}
        actions={<><StatusBadge status={r.priority}>{r.priority} priority</StatusBadge><StatusBadge status={r.status} /></>}
      />

      <div className="grid-2c">
        <Section title="Summary" id="summary">
          <p>{r.summary || 'No summary was provided.'}</p>
          <dl className="adm-facts">
            <div><dt>Submitted by</dt><dd>{r.submittedBy} ({roleName(r.submittedRole)})</dd></div>
            <div><dt>Created</dt><dd>{fmtDateTime(r.createdAt)}</dd></div>
            {entity && <div><dt>{entity.kind}</dt><dd><Link to={entity.to}>{entity.label}</Link></dd></div>}
            {decided && <div><dt>Decided</dt><dd>{fmtDateTime(r.decidedAt)}</dd></div>}
          </dl>
        </Section>

        <Section title="Checks" id="checks">
          {r.checks.length === 0 ? (
            <p className="ch-muted">No automated checks for this item. Read the summary and open the linked page to decide.</p>
          ) : (
            <ul className="adm-checks">
              {r.checks.map((c) => (
                <li key={c.label} className={c.ok ? 'is-pass' : 'is-fail'}>
                  {c.ok ? <Check size={18} aria-hidden="true" /> : <X size={18} aria-hidden="true" />}
                  <span className="adm-checks__state">{c.ok ? 'Passed' : 'Failed'}</span>
                  <span>{c.label}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      <Section title={decided ? 'Decision' : 'Decide'} id="decision">
        {decided ? (
          <div className="adm-decided" role="status">
            <StatusBadge status={r.status} />
            <p><strong>{r.status} on {fmtDateTime(r.decidedAt)}.</strong> Decided items are read-only, so the decision cannot be changed or repeated.</p>
          </div>
        ) : (
          <>
            {next && (
              <p className="adm-note">
                {next.text} <Link to={next.to}>{next.label}</Link>.
              </p>
            )}
            <div className="row">
              {r.status === 'New' && <button type="button" className="ch-btn ch-btn--secondary" onClick={() => decide('In Review', `Review of ${r.code} started`)}>Start review</button>}
              <button type="button" className="ch-btn ch-btn--primary" onClick={() => decide('Approved', `${r.code} approved`)}>Approve</button>
              <button type="button" className="ch-btn ch-btn--danger" onClick={() => decide('Rejected', `${r.code} rejected`)}>Reject</button>
              <button type="button" className="ch-btn ch-btn--secondary" onClick={() => decide('Closed', `${r.code} closed`)}>Close</button>
            </div>
          </>
        )}
      </Section>
    </>
  )
}
