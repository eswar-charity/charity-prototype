import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'
import { nonprofits, categories } from '../data/index.js'

const STEPS = ['Basics', 'Cause', 'Review']

export function validateStep(step, f) {
  const e = {}
  if (step === 0) {
    if (f.title.trim().length < 3) e.title = 'Give your event a title (3+ characters).'
    if (!f.date) e.date = 'Pick a date.'
    if (!f.location.trim()) e.location = 'Where is it happening?'
  }
  if (step === 1) {
    if (!f.category) e.category = 'Choose a cause.'
    if (!f.nonprofit) e.nonprofit = 'Choose a verified nonprofit.'
    if (f.goal && Number(f.goal) < 100) e.goal = 'Goal must be at least $100.'
  }
  return e
}

export default function Create() {
  const [step, setStep] = useState(0)
  const [errors, setErrors] = useState({})
  const [saved, setSaved] = useState(false)
  const [f, setF] = useState({ title: '', date: '', location: '', story: '', category: '', nonprofit: '', goal: '' })
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }))
  const options = nonprofits.filter((n) => !f.category || n.category === f.category)

  const next = () => {
    const v = validateStep(step, f)
    setErrors(v)
    if (!Object.keys(v).length) setStep((s) => s + 1)
  }

  if (saved) {
    return (
      <section className="page-head page-head--center">
        <div className="wrap wrap--narrow wizard-done" role="status">
          <span className="wizard-done__icon"><Check size={32} aria-hidden="true" /></span>
          <h1 className="h-display-3">Draft saved</h1>
          <p className="lede">“{f.title}” is ready for review. (Prototype: nothing was stored.)</p>
          <p className="page-head__cta"><Link to="/#discover" className="ch-btn ch-btn--primary">Find events</Link></p>
        </div>
      </section>
    )
  }

  const np = nonprofits.find((n) => n.slug === f.nonprofit)
  return (
    <section className="page-head">
      <div className="wrap wrap--narrow">
        <p className="ch-eyebrow">Host an event</p>
        <h1 className="h-display-3">Any idea can be an event.</h1>
        <p className="lede">Three quick steps. Pick a verified nonprofit and your event is ready for review.</p>

        <ol className="stepper" aria-label="Progress">
          {STEPS.map((s, i) => (
            <li key={s} aria-current={i === step ? 'step' : undefined} className={i === step ? 'is-on' : i < step ? 'is-done' : ''}>
              <span>{i < step ? <Check size={14} aria-hidden="true" /> : i + 1}</span> {s}
            </li>
          ))}
        </ol>

        <form className="wizard" noValidate onSubmit={(e) => { e.preventDefault(); step < 2 ? next() : setSaved(true) }}>
          {step === 0 && (
            <>
              <Field id="title" label="Event title" error={errors.title}>
                <input id="title" className="ch-field__input" placeholder="#MyCharityRun" value={f.title} onChange={set('title')} {...a11y('title', errors)} />
              </Field>
              <div className="wizard__two">
                <Field id="date" label="Date" error={errors.date}>
                  <input id="date" type="date" className="ch-field__input" value={f.date} onChange={set('date')} {...a11y('date', errors)} />
                </Field>
                <Field id="location" label="Location" error={errors.location}>
                  <input id="location" className="ch-field__input" placeholder="City, State" value={f.location} onChange={set('location')} {...a11y('location', errors)} />
                </Field>
              </div>
              <Field id="story" label="Your story (optional)">
                <textarea id="story" className="ch-field__input idea" placeholder="Why does this event matter?" value={f.story} onChange={set('story')} />
              </Field>
            </>
          )}
          {step === 1 && (
            <>
              <Field id="category" label="Cause" error={errors.category}>
                <select id="category" className="ch-field__input" value={f.category} onChange={(e) => setF((p) => ({ ...p, category: e.target.value, nonprofit: '' }))} {...a11y('category', errors)}>
                  <option value="">Select a cause</option>
                  {categories.map((c) => <option key={c.name}>{c.name}</option>)}
                </select>
              </Field>
              <Field id="nonprofit" label="Verified nonprofit" error={errors.nonprofit}>
                <select id="nonprofit" className="ch-field__input" value={f.nonprofit} onChange={set('nonprofit')} {...a11y('nonprofit', errors)}>
                  <option value="">{options.length ? 'Select a nonprofit' : 'No nonprofits for this cause yet'}</option>
                  {options.map((n) => <option key={n.slug} value={n.slug}>{n.name}</option>)}
                </select>
              </Field>
              <Field id="goal" label="Fundraising goal in $ (optional)" error={errors.goal}>
                <input id="goal" className="ch-field__input" inputMode="numeric" placeholder="5000" value={f.goal}
                  onChange={(e) => setF((p) => ({ ...p, goal: e.target.value.replace(/\D/g, '') }))} {...a11y('goal', errors)} />
              </Field>
            </>
          )}
          {step === 2 && (
            <dl className="review">
              <dt>Title</dt><dd>{f.title}</dd>
              <dt>Date</dt><dd>{f.date}</dd>
              <dt>Location</dt><dd>{f.location}</dd>
              <dt>Cause</dt><dd>{f.category}</dd>
              <dt>Nonprofit</dt><dd>{np?.name}</dd>
              <dt>Goal</dt><dd>{f.goal ? `$${Number(f.goal).toLocaleString('en-US')}` : 'Not set'}</dd>
            </dl>
          )}

          <div className="wizard-actions">
            {step > 0 && <button type="button" className="ch-btn ch-btn--secondary" onClick={() => setStep((s) => s - 1)}>Back</button>}
            <button type="submit" className="ch-btn ch-btn--primary" style={{ marginLeft: 'auto' }}>
              {step < 2 ? 'Continue' : 'Save draft'}
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}

const a11y = (k, errors) => ({ 'aria-invalid': !!errors[k], 'aria-describedby': errors[k] ? `${k}-err` : undefined })

function Field({ id, label, error, children }) {
  return (
    <div className={`ch-field ${error ? 'ch-field--invalid' : ''}`}>
      <label className="ch-field__label" htmlFor={id}>{label}</label>
      {children}
      {error && <span id={`${id}-err`} className="ch-field__hint">{error}</span>}
    </div>
  )
}
