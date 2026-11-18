import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CalendarDays, MapPin, Tag, Flag } from 'lucide-react'
import { PageHeader, Section, Empty, StatusBadge, Field, fieldProps, Modal, useRun, useConfirm, fmtDate } from '../../ui/kit.jsx'
import { photoList } from '../../domain/selectors.js'
import { isNpStaffFor } from '../../domain/engine.js'
import { Avatar } from '../../components/Brand.jsx'
import { ageLabel, daysSince, useNp, whenOf } from './shared.jsx'

const DECISION = { approved: 'Approved', rejected: 'Declined', changes_requested: 'Changes requested', auto_approved: 'Approved by autopilot' }

/** Resolves :key to an event this nonprofit may handle: 'ok' | 'missing' | 'forbidden'. */
export function useReviewTarget() {
  const { key } = useParams()
  const { s, user, now, np } = useNp()
  const ev = s.events[key]
  let state = 'ok'
  if (!ev || ev.deletedAt || (ev.status === 'Draft' && ev.organizerId !== user.id)) state = 'missing'
  else if (!isNpStaffFor(user, ev)) state = 'forbidden'
  return { key, ev, state, s, user, now, np }
}

export function NotAvailable({ state, np }) {
  return state === 'forbidden'
    ? <Empty title="This event is not yours to review" action={<Link className="ch-btn ch-btn--secondary ch-btn--sm" to="/np/approvals">Back to approvals</Link>}>It supports a different nonprofit. You can only review events for {np.name}.</Empty>
    : <Empty title="We could not find that event" action={<Link className="ch-btn ch-btn--secondary ch-btn--sm" to="/np/approvals">Back to approvals</Link>}>It may have been deleted, or the link is wrong.</Empty>
}

function ReasonModal({ title, label, hint, confirm, empty, danger, onSubmit, onClose }) {
  const [text, setText] = useState('')
  const [err, setErr] = useState('')
  const submit = (e) => {
    e.preventDefault()
    if (!text.trim()) { setErr(empty); return }
    onSubmit(text.trim())
  }
  return (
    <Modal title={title} onClose={onClose} labelledBy="reason-t">
      <form onSubmit={submit} noValidate>
        <Field id="reason" label={label} hint={hint} error={err}>
          <textarea {...fieldProps('reason', err)} className="ch-field__input np-textarea" rows={4} value={text} onChange={(e) => { setText(e.target.value); setErr('') }} autoFocus />
        </Field>
        <div className="dialog-actions">
          <button type="button" className="ch-btn ch-btn--secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className={`ch-btn ${danger ? 'ch-btn--danger' : 'ch-btn--primary'}`}>{confirm}</button>
        </div>
      </form>
    </Modal>
  )
}

export default function ApprovalReview() {
  const { key, ev, state, s, now, np } = useReviewTarget()
  const run = useRun()
  const confirm = useConfirm()
  const nav = useNavigate()
  const [modal, setModal] = useState(null) // 'reject' | 'report'

  if (state !== 'ok') return <NotAvailable state={state} np={np} />

  const org = s.users[ev.organizerId]
  const photos = photoList(ev)
  const submitted = ev.status === 'Submitted'
  const days = daysSince(ev.submittedAt, now)
  const r = ev.review
  const earlier = submitted && r && ev.submittedAt && new Date(r.at) < new Date(ev.submittedAt) ? r : null
  const current = !submitted && r ? r : null

  const approve = async () => {
    const ok = await confirm({ title: `Approve ${ev.title}?`, body: 'It goes live straight away and people can join and give. The organizer is told.', confirm: 'Approve event' })
    if (ok) run('approveEvent', { key }, { success: `${ev.title} is live`, onOk: () => nav('/np/approvals') })
  }

  return (
    <>
      <PageHeader back={{ to: '/np/approvals', label: 'All approvals' }} eyebrow="Review" title={ev.title}
        lede={submitted ? `${ageLabel(days)}. Submitted ${fmtDate(ev.submittedAt)}.` : undefined}
        actions={<StatusBadge status={ev.status} />} />

      {earlier && (
        <p className="np-banner" role="status"><strong>Resubmitted.</strong> Earlier you {DECISION[earlier.decision]?.toLowerCase()} this event{earlier.feedback ? `: ${earlier.feedback}` : earlier.reason ? `: ${earlier.reason}` : ''}</p>
      )}
      {current && (
        <Section id="decision" title="Your decision">
          <p><strong>{DECISION[current.decision]}</strong> on {fmtDate(current.at)}.</p>
          {current.reason && <p>Reason: {current.reason}</p>}
          {current.feedback && <p>Areas to change: {current.areas.join(', ')}. {current.feedback}</p>}
        </Section>
      )}

      <div className="np-review">
        <div className="stack">
          <Section id="photos" title="Photos">
            {photos.length === 0 ? <p className="ch-muted">No photos were added.</p> : (
              <ul className="np-photos">
                {photos.map((src, i) => <li key={src + i}><img src={src} alt={`${ev.title}, photo ${i + 1} of ${photos.length}`} loading="lazy" /></li>)}
              </ul>
            )}
          </Section>
          <Section id="story" title="Story">
            <p className="np-story">{ev.story || 'No story was written.'}</p>
          </Section>
          <Section id="details" title="Details">
            <dl className="np-facts">
              <div><dt><CalendarDays size={16} aria-hidden="true" /> When</dt><dd>{whenOf(ev) || 'Not set'}</dd></div>
              <div><dt><MapPin size={16} aria-hidden="true" /> Where</dt><dd>{ev.location || 'Not set'}</dd></div>
              <div><dt><Tag size={16} aria-hidden="true" /> Category</dt><dd>{ev.category || 'Not set'}</dd></div>
              <div><dt>Goal</dt><dd>${ev.goal?.toLocaleString('en-US')} (demo)</dd></div>
            </dl>
          </Section>
        </div>

        <div className="stack np-review__side">
          <Section id="organizer" title="Organizer">
            <div className="np-person">
              <Avatar name={org?.name ?? 'Unknown'} />
              <div>
                <p className="np-list__title">{org?.name ?? 'Unknown organizer'}</p>
                <p className="ch-muted">{[org?.city, ev.kind].filter(Boolean).join(' · ')}</p>
              </div>
            </div>
            {org?.bio && <p className="ch-muted">{org.bio}</p>}
            {org && <Link to={`/organizers/${org.id}`}>View organizer profile</Link>}
          </Section>

          <Section id="actions" title="Your decision">
            {submitted ? (
              <div className="stack">
                {np.status !== 'Active' && <p className="np-note">Your nonprofit must be active to approve events. Check <Link to="/np/setup">setup</Link>.</p>}
                <button className="ch-btn ch-btn--primary" onClick={approve}>Approve</button>
                <Link className="ch-btn ch-btn--secondary" to={`/np/approvals/${key}/request-changes`}>Request changes</Link>
                <button className="ch-btn ch-btn--secondary" onClick={() => setModal('reject')}>Reject</button>
              </div>
            ) : (
              <p className="ch-muted">{ev.status === 'Live' ? 'This event is live.' : `This event is ${ev.status.toLowerCase()}, so there is nothing to decide.`}</p>
            )}
            {ev.status === 'Live' && <Link className="ch-btn ch-btn--secondary" to={`/np/live/${key}`}>Manage live</Link>}
            {['Live', 'Completed', 'Archived'].includes(ev.status) && <Link to={`/events/${key}`}>Open public page</Link>}
            <button className="link-btn np-report" onClick={() => setModal('report')}><Flag size={16} aria-hidden="true" /> Report to Charity Hub</button>
          </Section>
        </div>
      </div>

      {modal === 'reject' && (
        <ReasonModal title={`Reject ${ev.title}`} label="Reason" hint="The organizer sees this and can edit and resubmit." confirm="Reject event" danger empty="Tell the organizer why."
          onClose={() => setModal(null)}
          onSubmit={(reason) => run('rejectEvent', { key, reason }, { success: `${ev.title} was rejected`, onOk: () => nav('/np/approvals') })} />
      )}
      {modal === 'report' && (
        <ReasonModal title="Report to Charity Hub" label="What is wrong?" hint="A Charity Hub admin reviews this. The organizer is not told." confirm="Send report" empty="Tell Charity Hub what is wrong."
          onClose={() => setModal(null)}
          onSubmit={(reason) => run('reportEvent', { key, reason }, { success: 'Report sent to Charity Hub', onOk: () => setModal(null) })} />
      )}
    </>
  )
}
