import { Link, useNavigate, useParams } from 'react-router-dom'
import { Check, Circle, Copy, Trash2, X as XIcon } from 'lucide-react'
import { fmtDate, fmtDateTime, PageHeader, Section, StatusBadge, useConfirm, useRun } from '../../ui/kit.jsx'
import { NotYours, npNameOf, useOwnedEvent, whenText } from './common.jsx'
import { editLink } from './Drafts.jsx'

const DECIDED = ['Live', 'Completed', 'Archived', 'Blocked']

/** Draft → Submitted → decision → Live, from the event's status and review. Every state carries words. */
function buildTimeline(ev, np) {
  const r = ev.review
  const draft = ev.status === 'Draft'
  const decisionKind = ev.status === 'Submitted' ? 'pending' : ev.status === 'Changes Requested' ? 'changes' : ev.status === 'Rejected' ? 'rejected' : DECIDED.includes(ev.status) ? 'approved' : null
  const decision = {
    pending: { state: 'current', detail: `Waiting for ${np} to decide.` },
    changes: { state: 'action', detail: `${np} asked for changes${r?.at ? ` on ${fmtDate(r.at)}` : ''}.` },
    rejected: { state: 'stopped', detail: `${np} did not approve it${r?.at ? ` on ${fmtDate(r.at)}` : ''}.` },
    approved: { state: 'done', detail: r?.decision === 'auto_approved' ? 'Approved automatically by the nonprofit’s autopilot.' : r?.decision === 'approved' ? `${np} approved it${r.at ? ` on ${fmtDate(r.at)}` : ''}.` : 'Published by the nonprofit.' },
  }[decisionKind] ?? { state: 'todo', detail: 'The nonprofit decides after you submit.' }
  return [
    { label: 'Draft', state: draft ? 'current' : 'done', detail: `Created ${fmtDate(ev.createdAt)}.` },
    { label: 'Submitted', state: draft ? 'todo' : 'done', detail: draft ? 'Not sent yet.' : `Sent ${fmtDateTime(ev.submittedAt)}.` },
    { label: decisionKind === 'changes' ? 'Changes requested' : decisionKind === 'rejected' ? 'Not approved' : decisionKind === 'approved' ? 'Approved' : 'Decision', ...decision },
    { label: 'Live', state: DECIDED.includes(ev.status) ? 'done' : 'todo', detail: DECIDED.includes(ev.status) ? `Went live ${fmtDate(ev.liveAt)}.` : decisionKind === 'rejected' ? 'Not reached.' : 'Goes live once it is approved.' },
  ]
}
const STATE_TEXT = { done: 'Done', current: 'Now', action: 'Needs you', stopped: 'Stopped', todo: 'Next' }

export default function Approval() {
  const { key } = useParams()
  const { state, ev, s } = useOwnedEvent(key)
  const run = useRun()
  const confirm = useConfirm()
  const nav = useNavigate()
  if (state !== 'ok') return <NotYours missing={state === 'missing'} />

  const np = npNameOf(s, ev)
  const steps = buildTimeline(ev, np)
  const r = ev.review
  const edit = ['Draft', 'Changes Requested', 'Rejected'].includes(ev.status) ? editLink(ev) : null
  const remove = async () => {
    if (await confirm({ title: `Delete ${ev.title}?`, body: 'This removes the event for good.', confirm: 'Delete', danger: true })) {
      run('deleteEvent', { key: ev.key }, { success: `${ev.title} deleted.`, onOk: () => nav('/se?tab=drafts') })
    }
  }
  const clone = () => run('cloneEvent', { key: ev.key }, { success: 'Copied as a new draft.', onOk: (copy) => nav(`/se/create/${copy.key}/1`) })

  return (
    <>
      <PageHeader
        back={{ to: '/se?tab=drafts', label: 'My drafts' }}
        eyebrow="Approval status"
        title={ev.title}
        lede={`${whenText(ev)}${ev.location ? ` · ${ev.location}` : ''} · for ${np}`}
        actions={<StatusBadge status={ev.status} />}
      />

      <Section title="Where it stands" id="se-timeline">
        <ol className="se-timeline">
          {steps.map((st) => (
            <li key={st.label} className={`se-tl se-tl--${st.state}`} aria-current={st.state === 'current' || st.state === 'action' ? 'step' : undefined}>
              <span className="se-tl__dot" aria-hidden="true">{st.state === 'done' ? <Check size={14} /> : st.state === 'stopped' ? <XIcon size={14} /> : <Circle size={10} />}</span>
              <span className="se-tl__text">
                <strong>{st.label}</strong>
                <span className="se-tl__state">{STATE_TEXT[st.state]}</span>
                <span className="ch-muted">{st.detail}</span>
              </span>
            </li>
          ))}
        </ol>
      </Section>

      {ev.status === 'Changes Requested' && (
        <section className="se-banner se-banner--warn" aria-label="Feedback from the nonprofit">
          <p className="se-banner__title">What {np} asked you to change</p>
          <blockquote className="se-banner__quote">{r?.feedback}</blockquote>
          <p><strong>Flagged areas:</strong> {(r?.areas ?? []).join(', ')}. Only those steps can be edited.</p>
        </section>
      )}
      {ev.status === 'Rejected' && (
        <section className="se-banner se-banner--danger" aria-label="Why it was not approved">
          <p className="se-banner__title">Why {np} did not approve it</p>
          <blockquote className="se-banner__quote">{r?.reason}</blockquote>
          <p>You can edit it and resubmit. Your first edit moves it back to Draft.</p>
        </section>
      )}
      {ev.status === 'Draft' && r?.decision === 'rejected' && (
        <section className="se-banner se-banner--danger" aria-label="Earlier decision">
          <p className="se-banner__title">Last time, {np} did not approve it</p>
          <blockquote className="se-banner__quote">{r.reason}</blockquote>
        </section>
      )}
      {ev.status === 'Submitted' && (
        <div className="se-banner se-banner--info" role="status">
          <p>{np} has your event. You cannot edit it while it is being reviewed. You will get a notification as soon as there is a decision.</p>
        </div>
      )}
      {ev.status === 'Blocked' && (
        <div className="se-banner se-banner--danger" role="status"><p>Charity Hub paused this event{ev.blocked?.reason ? `: ${ev.blocked.reason}` : '.'}</p></div>
      )}

      <Section title="What you can do" id="se-actions">
        <div className="row">
          {edit && <Link className="ch-btn ch-btn--primary" to={edit.to}>{ev.status === 'Draft' ? 'Resume editing' : 'Edit and resubmit'}</Link>}
          {['Live', 'Completed', 'Archived'].includes(ev.status) && <Link className="ch-btn ch-btn--primary" to={`/events/${ev.key}`}>View the public page</Link>}
          {['Live', 'Blocked'].includes(ev.status) && <Link className="ch-btn ch-btn--secondary" to={`/se/live/${ev.key}`}>Live dashboard</Link>}
          {['Completed', 'Archived'].includes(ev.status) && <Link className="ch-btn ch-btn--secondary" to={`/se/impact/${ev.key}`}>See the impact</Link>}
          <button type="button" className="ch-btn ch-btn--secondary" onClick={clone}><Copy size={16} aria-hidden="true" /> Clone as a new draft</button>
          {['Draft', 'Rejected'].includes(ev.status) && <button type="button" className="ch-btn ch-btn--text se-danger" onClick={remove}><Trash2 size={16} aria-hidden="true" /> Delete</button>}
        </div>
        {!['Draft', 'Rejected'].includes(ev.status) && <p className="ch-muted">Only drafts and rejected events can be deleted.</p>}
      </Section>
    </>
  )
}
