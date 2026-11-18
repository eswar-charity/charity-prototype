// The four-step event wizard, shared by social entrepreneurs (base '/se') and nonprofit admins (base '/np/events').
//   <EventWizard base="/se" />          routes: create, create/:key/:step          (relative to /se)
//   <EventWizard base="/np/events" />   routes: events/new, events/:key/:step      (relative to /np)
// Spread `wizardRoutes(base)` into the role's route list. Every step change saves the draft first.
import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { Check, Lock } from 'lucide-react'
import { useDomain, useSession } from '../../../domain/store.jsx'
import { CauseBadge } from '../../../components/Brand.jsx'
import { coverOf, photoList } from '../../../domain/selectors.js'
import { Empty, Field, fieldProps, PageHeader, StatusBadge, useRun, useToast } from '../../../ui/kit.jsx'
import { LockedNote, NotYours, todayInput, wizardPath, whenText } from '../common.jsx'
import PhotoPicker from './PhotoPicker.jsx'
import NonprofitPicker from './NonprofitPicker.jsx'
import {
  STEPS, STEP_FOR_ERROR, blankForm, firstErrorField, formFromEvent, isOpen, nextStepFrom, npBlocker, openKeysFor, openSteps, patchFor, prevStepFrom, stepIsOpen, validateStep,
} from './helpers.js'

/** Route objects (relative to the role's mount point) for a wizard living at `base`. */
export function wizardRoutes(base = '/se') {
  const prefix = base === '/se' ? 'create' : base.split('/').slice(2).join('/') // 'create' or 'events'
  const element = <EventWizard base={base} />
  return [
    { path: base === '/se' ? 'create' : `${prefix}/new`, element },
    { path: `${prefix}/:key/:step`, element },
  ]
}
export { wizardPath }

const EDITABLE = ['Draft', 'Changes Requested', 'Rejected']

export function EventWizard({ base = '/se' }) {
  const { key, step } = useParams()
  const s = useDomain()
  const { user } = useSession()
  const npLed = base !== '/se'
  const exit = npLed ? base : '/se/drafts'
  if (!user) return null
  if (!key) return <WizardForm key="new" base={base} ev={null} stepNum={1} />

  const ev = s.events[key]
  if (!ev || ev.deletedAt) return <NotYours missing home={exit} homeLabel={npLed ? 'Back to events' : 'Back to my drafts'} />
  if (ev.organizerId !== user.id) return <NotYours home={exit} homeLabel={npLed ? 'Back to events' : 'Back to my drafts'} />
  if (!EDITABLE.includes(ev.status)) {
    const to = npLed ? (ev.status === 'Live' ? `/np/live/${ev.key}` : '/np/events') : `/se/approval/${ev.key}`
    return (
      <>
        <PageHeader title={ev.title} actions={<StatusBadge status={ev.status} />} />
        <Empty title={`This event can no longer be edited (${ev.status.toLowerCase()}).`} action={<Link className="ch-btn ch-btn--primary" to={to}>{npLed ? 'Back' : 'View status'}</Link>}>
          Only drafts, rejected events and events with changes requested can be edited.
        </Empty>
      </>
    )
  }

  // Resume at the saved step; in fix mode send locked steps to the preview.
  const open = openKeysFor(ev)
  const n = Number(step)
  const reached = Math.min(4, Math.max(1, ev.wizardStep ?? 1))
  if (!Number.isInteger(n) || n < 1 || n > 4) return <Navigate replace to={wizardPath(base, ev.key, open ? openSteps(open)[0] : reached)} />
  if (open && !stepIsOpen(open, n)) return <Navigate replace to={wizardPath(base, ev.key, 4)} />
  if (!open && n > reached) return <Navigate replace to={wizardPath(base, ev.key, reached)} />
  return <WizardForm key={ev.key} base={base} ev={ev} stepNum={n} />
}
export default EventWizard

/* ------------------------------------------------------------------ the form */
function WizardForm({ base, ev, stepNum }) {
  const s = useDomain()
  const { user, now } = useSession()
  const run = useRun()
  const toast = useToast()
  const nav = useNavigate()
  const npLed = base !== '/se'
  const open = openKeysFor(ev)
  const fixMode = !!open
  const [form, setForm] = useState(() => (ev ? formFromEvent(ev) : blankForm(npLed ? user.nonprofitId : '')))
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState(null)
  const headRef = useRef(null)
  const first = useRef(true)
  useEffect(() => {
    if (first.current) { first.current = false; return }
    headRef.current?.focus()
  }, [stepNum])

  const today = todayInput(now)
  const exitTo = npLed ? base : '/se/drafts'
  const myNp = s.nonprofits[form.nonprofitId]
  const set = (k) => (v) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => (e[k] ? { ...e, [k]: undefined } : e)) }
  const bind = (k) => ({ value: form[k], onChange: (e) => set(k)(e.target.value) })
  const locked = (k) => !isOpen(open, k)
  const focusField = (k) => setTimeout(() => document.getElementById(`se-w-${k}`)?.focus(), 0)
  const go = (n, key = ev?.key) => { setErrors({}); setSubmitError(null); nav(wizardPath(base, key, n)) }
  // fieldProps with a hint wired to aria-describedby
  const fp = (k, hint = true) => ({ ...fieldProps(`se-w-${k}`, errors[k]), 'aria-describedby': errors[k] ? `se-w-${k}-err` : hint ? `se-w-${k}-hint` : undefined, disabled: locked(k) })
  const hint = (k, text) => (locked(k) ? 'Locked. The nonprofit did not ask you to change this.' : text)

  /** Save this step's fields and the step reached. Returns the event key, or null when the engine refused. */
  const saveCurrent = (target) => {
    if (!ev) {
      const r = run('createDraft', { title: form.title, story: form.story, category: form.category, photos: form.photos, nonprofitId: form.nonprofitId })
      if (!r.ok) return null
      const saved = run('saveDraft', { key: r.data.key, patch: {}, step: target })
      return saved.ok ? r.data.key : null
    }
    const r = run('saveDraft', { key: ev.key, patch: patchFor(form, STEPS[stepNum - 1].fields, open), step: target })
    return r.ok ? ev.key : null
  }

  const next = () => {
    const errs = npLed && stepNum === 2 ? {} : validateStep(stepNum, form, { open, today, nonprofits: s.nonprofits })
    setErrors(errs)
    const bad = firstErrorField(errs)
    if (bad) return focusField(bad)
    const target = nextStepFrom(open, stepNum)
    const key = saveCurrent(target)
    if (key) go(target, key)
  }
  const back = () => {
    const prev = prevStepFrom(open, stepNum)
    if (prev === null) return
    const key = saveCurrent(stepNum)
    if (key) go(prev, key)
  }
  const saveAndExit = () => {
    const nothing = !ev && !form.photos.length && !form.title.trim() && !form.story.trim()
    if (!nothing && !saveCurrent(stepNum)) return
    if (!nothing) toast('Draft saved.')
    nav(exitTo)
  }
  const jump = (n) => { const key = saveCurrent(stepNum); if (key) go(n, key) }

  /* ---- step 4: submit */
  const evForm = ev ? formFromEvent(ev) : null
  const problems = ev ? [1, 2, 3].filter((n) => !(npLed && n === 2)).flatMap((n) => Object.values(validateStep(n, evForm, { open, today, nonprofits: s.nonprofits })).map((message) => ({ n, message }))) : []
  const accepted = !!ev?.guidelinesAccepted
  const toggleGuidelines = (checked) => {
    setSubmitError(null)
    run('saveDraft', { key: ev.key, patch: { guidelinesAccepted: checked }, step: 4 })
  }
  const submit = () => {
    setSubmitError(null)
    if (problems.length) return setTimeout(() => document.getElementById('se-problems')?.focus(), 0)
    if (!accepted) { setSubmitError({ message: 'Accept the community guidelines to submit.', field: 'guidelines' }); return focusField('guidelines') }
    const r = run('submitEvent', { key: ev.key }, { quiet: true })
    if (!r.ok) return setSubmitError({ message: r.error.message, step: STEP_FOR_ERROR[r.error.code] })
    const np = s.nonprofits[ev.nonprofitId]?.name ?? 'the nonprofit'
    if (r.data.outcome === 'submitted') { toast(`Submitted. ${np} will review it.`); nav(`/se/approval/${ev.key}`) }
    else if (r.data.outcome === 'auto_approved') { toast('Approved automatically. Your event is live.'); nav(`/events/${ev.key}`) }
    else { toast('Your event is live.'); nav(`/events/${ev.key}`) }
  }

  const title = fixMode ? 'Make the requested changes' : ev?.status === 'Rejected' || ev?.review?.decision === 'rejected' ? 'Edit and resubmit' : npLed ? 'Create an event for your nonprofit' : ev ? 'Edit your event' : 'Create an event'
  const reachedMax = fixMode ? 4 : Math.max(ev?.wizardStep ?? 1, stepNum)
  const canJump = (n) => !!ev && n !== stepNum && n <= reachedMax && stepIsOpen(open, n)

  return (
    <>
      <PageHeader
        back={{ to: exitTo, label: npLed ? 'Events' : 'My drafts' }}
        eyebrow={`Step ${stepNum} of 4`}
        title={title}
        lede={ev ? 'Your draft saves each time you move between steps.' : 'Four short steps. Your draft is saved as soon as you continue.'}
        actions={ev && <StatusBadge status={ev.status} />}
      />

      {fixMode && (
        <section className="se-banner se-banner--warn" aria-label="Changes requested">
          <p className="se-banner__title">{s.nonprofits[ev.nonprofitId]?.name ?? 'The nonprofit'} asked for changes</p>
          <blockquote className="se-banner__quote">{ev.review?.feedback}</blockquote>
          <p><strong>Areas to change:</strong> {(ev.review?.areas ?? []).join(', ')}. Steps that were not flagged are locked.</p>
        </section>
      )}
      {!fixMode && ev?.review?.decision === 'rejected' && (
        <section className="se-banner se-banner--danger" aria-label="Rejected">
          <p className="se-banner__title">{ev.status === 'Rejected' ? 'This event was not approved' : 'Last time this event was not approved'}</p>
          <blockquote className="se-banner__quote">{ev.review.reason}</blockquote>
          <p>{ev.status === 'Rejected' ? 'Saving your first edit moves it back to Draft. Then you can resubmit it.' : 'Fix what was mentioned, then submit it again.'}</p>
        </section>
      )}

      <nav aria-label="Wizard steps">
        <ol className="se-steps">
          {STEPS.map((st) => {
            const isLocked = !stepIsOpen(open, st.n)
            const state = st.n === stepNum ? 'Current step' : isLocked ? 'Locked' : st.n < (fixMode ? stepNum : reachedMax) ? 'Done' : 'Not done'
            const inner = (
              <>
                <span className="se-step__n" aria-hidden="true">{state === 'Done' ? <Check size={16} /> : isLocked ? <Lock size={14} /> : st.n}</span>
                <span className="se-step__label">{st.label}</span>
                <span className="se-step__state">{state}</span>
              </>
            )
            return (
              <li key={st.n} className={`se-step ${st.n === stepNum ? 'is-current' : ''} ${isLocked ? 'is-locked' : ''}`} aria-current={st.n === stepNum ? 'step' : undefined}>
                {canJump(st.n) ? <button type="button" className="se-step__btn" onClick={() => jump(st.n)}>{inner}</button> : <span className="se-step__btn">{inner}</span>}
              </li>
            )
          })}
        </ol>
      </nav>

      <form className="panel-section se-panel" noValidate aria-labelledby="se-step-h" onSubmit={(e) => { e.preventDefault(); if (stepNum === 4) submit(); else next() }}>
        <h2 className="h-heading-sm" id="se-step-h" tabIndex={-1} ref={headRef}>{STEPS[stepNum - 1].label}</h2>

        {stepNum === 1 && (
          <>
            <PhotoPicker photos={form.photos} onChange={set('photos')} disabled={locked('photos')} error={errors.photos} />
            {locked('photos') && <LockedNote>Photos are locked. The nonprofit did not ask you to change them.</LockedNote>}
            <Field id="se-w-title" label="Title" hint={hint('title', 'One word, or a few joined together. It shows as a hashtag, like #RiverCleanupDay.')} error={errors.title}>
              <div className="se-hash">
                <span className="se-hash__sign" aria-hidden="true">#</span>
                <input {...fp('title')} className="ch-field__input se-hash__input" maxLength={40} autoComplete="off" value={form.title} onChange={(e) => set('title')(e.target.value.replace(/[^\p{L}\p{N}_]/gu, ''))} />
              </div>
            </Field>
            <Field id="se-w-story" label="Story" hint={hint('story', 'What happens, who it is for and why it matters. A few sentences is plenty.')} error={errors.story}>
              <textarea {...fp('story')} className="ch-field__input idea" rows={6} maxLength={1500} {...bind('story')} />
            </Field>
            <Field id="se-w-category" label="Category" hint={hint('category', 'Helps people find your event.')} error={errors.category}>
              <select {...fp('category')} {...bind('category')}>
                <option value="">Choose a category</option>
                {(s.categories ?? []).map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
              </select>
            </Field>
          </>
        )}

        {stepNum === 2 && (npLed ? (
          <div className="se-fixednp">
            <p><strong>{myNp?.name ?? 'Your nonprofit'}</strong> is the nonprofit for this event.</p>
            <p className="ch-muted">Events created here are yours to run. They go live as soon as you publish them, with no approval step, and donations go to {myNp?.name ?? 'your nonprofit'}.</p>
            {myNp && npBlocker(myNp) && <p className="se-banner se-banner--warn">Heads up: {myNp.name} is not ready to receive donations yet. {npBlocker(myNp)} Your event can still go live, and giving opens once that is sorted.</p>}
          </div>
        ) : (
          <>
            <NonprofitPicker nonprofits={s.nonprofits} value={form.nonprofitId} onChange={set('nonprofitId')} disabled={locked('nonprofitId')} error={errors.nonprofitId} />
            {locked('nonprofitId') && <LockedNote>The nonprofit is locked. The nonprofit did not ask you to change it.</LockedNote>}
          </>
        ))}

        {stepNum === 3 && (
          <>
            <div className="se-grid2">
              <Field id="se-w-date" label="Date" hint={hint('date', 'The day the event starts.')} error={errors.date}>
                <input {...fp('date')} type="date" min={today} {...bind('date')} />
              </Field>
              <Field id="se-w-endDate" label="End date (optional)" hint={hint('endDate', 'Only if it runs past the first day.')} error={errors.endDate}>
                <input {...fp('endDate')} type="date" min={form.date || today} {...bind('endDate')} />
              </Field>
              <Field id="se-w-start" label="Start time" error={errors.start}>
                <input {...fp('start', false)} type="time" {...bind('start')} />
              </Field>
              <Field id="se-w-end" label="End time" error={errors.end}>
                <input {...fp('end', false)} type="time" {...bind('end')} />
              </Field>
            </div>
            <Field id="se-w-location" label="Location" hint={hint('location', 'A venue or address people can find.')} error={errors.location}>
              <input {...fp('location')} type="text" autoComplete="off" {...bind('location')} />
            </Field>
          </>
        )}

        {stepNum === 4 && ev && (
          <>
            <article className="se-preview" aria-label="Preview of your event">
              {coverOf(ev) ? <img className="se-preview__cover" src={coverOf(ev)} alt="" /> : <div className="se-preview__cover se-preview__cover--none" />}
              <div className="se-preview__body">
                {myNp && <CauseBadge name={myNp.name} />}
                <h3 className="h-heading">{ev.title}</h3>
                <dl className="se-facts">
                  <div><dt>When</dt><dd>{whenText(ev)}</dd></div>
                  <div><dt>Where</dt><dd>{ev.location || 'Not set yet'}</dd></div>
                  <div><dt>Category</dt><dd>{ev.category || 'Not set yet'}</dd></div>
                  <div><dt>Photos</dt><dd>{photoList(ev).length}</dd></div>
                </dl>
                <p className="se-preview__story">{ev.story || 'No story yet.'}</p>
              </div>
            </article>
            <p className="ch-field__hint">This is how your event will look. Anything wrong? Use the step links above, or go back.</p>

            {problems.length > 0 && (
              <div className="se-banner se-banner--warn" role="alert" id="se-problems" tabIndex={-1}>
                <p className="se-banner__title">Finish these before you submit</p>
                <ul>{problems.map((p) => <li key={`${p.n}-${p.message}`}>{p.message} <button type="button" className="link-btn" onClick={() => go(p.n)}>Go to step {p.n}</button></li>)}</ul>
              </div>
            )}

            <div className={`ch-field ${submitError?.field === 'guidelines' ? 'ch-field--invalid' : ''}`}>
              <label className="se-check" htmlFor="se-w-guidelines">
                <input id="se-w-guidelines" type="checkbox" checked={accepted} onChange={(e) => toggleGuidelines(e.target.checked)} aria-describedby="se-w-guidelines-hint" />
                <span>I have read the Charity Hub community guidelines and this event follows them.</span>
              </label>
              <span className="ch-field__hint" id="se-w-guidelines-hint">
                The event is real and will run as described. Money goes to the nonprofit, never to me. The photos and words are mine to share, and people at the event will be kept safe.
              </span>
            </div>

            {submitError && (
              <div className="se-banner se-banner--danger" role="alert">
                <p>{submitError.message}</p>
                {submitError.step && stepIsOpen(open, submitError.step) && <button type="button" className="link-btn" onClick={() => go(submitError.step)}>Go to step {submitError.step}</button>}
              </div>
            )}
            <p className="ch-muted">
              {npLed ? `As ${myNp?.name ?? 'the nonprofit'}, your event goes live as soon as you publish it.` : `${myNp?.name ?? 'The nonprofit'} reviews your event before it goes live. You will get a notification with the decision.`}
            </p>
          </>
        )}

        <div className="se-foot">
          {prevStepFrom(open, stepNum) !== null && <button type="button" className="ch-btn ch-btn--secondary" onClick={back}>Back</button>}
          <button type="button" className="ch-btn ch-btn--text" onClick={saveAndExit}>Save and exit</button>
          <span className="se-foot__spacer" />
          <button type="submit" className="ch-btn ch-btn--primary">
            {stepNum < 4 ? 'Continue' : npLed ? 'Publish event' : fixMode ? 'Resubmit for approval' : 'Submit for approval'}
          </button>
        </div>
      </form>
    </>
  )
}
