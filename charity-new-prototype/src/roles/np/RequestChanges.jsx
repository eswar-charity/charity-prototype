import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PageHeader, Section, Field, fieldProps, useRun } from '../../ui/kit.jsx'
import { CHANGE_AREAS } from '../../domain/engine.js'
import { NotAvailable, useReviewTarget } from './ApprovalReview.jsx'

const AREA_HELP = {
  Photos: 'Add, replace or remove photos',
  Story: 'Title, story, mission and category',
  Nonprofit: 'Which nonprofit it supports',
  'Date & place': 'Date, times and location',
}

export default function RequestChanges() {
  const { key, ev, state, np } = useReviewTarget()
  const run = useRun()
  const nav = useNavigate()
  const [areas, setAreas] = useState([])
  const [feedback, setFeedback] = useState('')
  const [errors, setErrors] = useState({})

  if (state !== 'ok') return <NotAvailable state={state} np={np} />
  if (ev.status !== 'Submitted') {
    return (
      <>
        <PageHeader back={{ to: `/np/approvals/${key}`, label: 'Back to review' }} title="Request changes" />
        <Section><p>This event is {ev.status.toLowerCase()}, so changes can no longer be requested. <Link to={`/np/approvals/${key}`}>Back to the review</Link>.</p></Section>
      </>
    )
  }

  const toggle = (a) => { setAreas((l) => (l.includes(a) ? l.filter((x) => x !== a) : [...l, a])); setErrors((e) => ({ ...e, areas: '' })) }
  const submit = (e) => {
    e.preventDefault()
    const next = {}
    if (!areas.length) next.areas = 'Pick at least one area to change.'
    if (!feedback.trim()) next.feedback = 'Tell the organizer what to fix.'
    setErrors(next)
    if (Object.keys(next).length) return
    run('requestChanges', { key, areas, feedback }, { success: `Changes requested on ${ev.title}`, onOk: () => nav('/np/approvals') })
  }

  return (
    <>
      <PageHeader back={{ to: `/np/approvals/${key}`, label: 'Back to review' }} eyebrow="Request changes" title={ev.title}
        lede="Pick what needs work and say what to fix. The organizer can only edit the areas you flag, then resubmit." />
      <Section id="changes">
        <form className="np-form" onSubmit={submit} noValidate>
          <fieldset className={`np-fieldset ${errors.areas ? 'is-invalid' : ''}`} aria-describedby={errors.areas ? 'areas-err' : undefined}>
            <legend className="ch-field__label">Areas to change</legend>
            <div className="np-checks">
              {Object.keys(CHANGE_AREAS).map((a) => (
                <label key={a} className="np-check">
                  <input type="checkbox" checked={areas.includes(a)} onChange={() => toggle(a)} />
                  <span><strong>{a}</strong><span className="ch-muted"> {AREA_HELP[a]}</span></span>
                </label>
              ))}
            </div>
            {errors.areas && <span className="ch-field__hint np-err" id="areas-err">{errors.areas}</span>}
          </fieldset>
          <Field id="feedback" label="Feedback for the organizer" hint="Be specific and kind. They see this exactly as written." error={errors.feedback}>
            <textarea {...fieldProps('feedback', errors.feedback)} className="ch-field__input np-textarea" rows={5} value={feedback}
              onChange={(e) => { setFeedback(e.target.value); setErrors((x) => ({ ...x, feedback: '' })) }} />
          </Field>
          <div className="row">
            <button type="submit" className="ch-btn ch-btn--primary">Send request</button>
            <Link className="ch-btn ch-btn--secondary" to={`/np/approvals/${key}`}>Cancel</Link>
          </div>
        </form>
      </Section>
    </>
  )
}
