import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader, Section, Empty, Field, fieldProps, useRun, fmtDateTime } from '../../ui/kit.jsx'
import { npEvents } from '../../domain/selectors.js'
import { AUTOPILOT_CHECKS } from '../../domain/engine.js'
import { Avatar } from '../../components/Brand.jsx'
import { useNp } from './shared.jsx'

export default function Autopilot() {
  const { s, np } = useNp()
  const run = useRun()
  const ap = np.autopilot
  const [enabled, setEnabled] = useState(!!ap.enabled)
  const [checks, setChecks] = useState(ap.checks)
  const [trusted, setTrusted] = useState(ap.trustedSeIds)
  const [query, setQuery] = useState('')
  const [errors, setErrors] = useState({})

  const ses = Object.values(s.users).filter((u) => u.role === 'se' && u.status === 'active').sort((a, b) => a.name.localeCompare(b.name))
  const shown = ses.filter((u) => !query.trim() || `${u.name} ${u.city}`.toLowerCase().includes(query.trim().toLowerCase()))
  const recent = npEvents(s, np.id).filter((e) => e.review?.decision === 'auto_approved').sort((a, b) => new Date(b.review.at) - new Date(a.review.at)).slice(0, 10)
  const flip = (list, set, v) => set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v])
  const dirty = enabled !== !!ap.enabled || checks.join('|') !== ap.checks.join('|') || trusted.join('|') !== ap.trustedSeIds.join('|')

  const save = (e) => {
    e.preventDefault()
    const next = {}
    if (enabled && !checks.length) next.checks = 'Choose at least one check, or turn autopilot off.'
    if (enabled && !trusted.length) next.trusted = 'Pick at least one trusted organizer, or turn autopilot off.'
    setErrors(next)
    if (Object.keys(next).length) return
    run('npSetAutopilot', { enabled, checks: AUTOPILOT_CHECKS.filter((c) => checks.includes(c)), trustedSeIds: trusted }, { success: enabled ? 'Autopilot is on' : 'Autopilot is off' })
  }

  return (
    <>
      <PageHeader back={{ to: '/np/approvals', label: 'Approvals' }} eyebrow="Settings" title="Autopilot"
        lede="Let organizers you trust go live without waiting in your queue." />

      <div className="grid-2c np-align-start">
        <form className="stack" onSubmit={save} noValidate aria-label="Autopilot settings">
          <Section id="onoff" title="Turn it on">
            <label className="np-check np-check--switch">
              <input type="checkbox" role="switch" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
              <span><strong>Enable autopilot</strong><span className="ch-muted"> {enabled ? 'On: matching events go live automatically.' : 'Off: every event waits for your approval.'}</span></span>
            </label>
          </Section>

          <Section id="checks" title="Checks every event must pass">
            <fieldset className="np-fieldset" aria-describedby={errors.checks ? 'checks-err' : undefined}>
              <legend className="ch-sr">Checks</legend>
              <div className="np-checks">
                {AUTOPILOT_CHECKS.map((c) => (
                  <label key={c} className="np-check">
                    <input type="checkbox" checked={checks.includes(c)} onChange={() => { flip(checks, setChecks, c); setErrors((x) => ({ ...x, checks: '' })) }} />
                    <span>{c}</span>
                  </label>
                ))}
              </div>
              {errors.checks && <span className="ch-field__hint np-err" id="checks-err">{errors.checks}</span>}
            </fieldset>
          </Section>

          <Section id="trusted" title="Trusted organizers" aside={<span className="ch-muted">{trusted.length} selected</span>}>
            <Field id="se-search" label="Find an organizer">
              <input {...fieldProps('se-search')} type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Name or city" autoComplete="off" />
            </Field>
            <fieldset className="np-fieldset" aria-describedby={errors.trusted ? 'trusted-err' : undefined}>
              <legend className="ch-sr">Trusted organizers</legend>
              {shown.length === 0 ? <p className="ch-muted">No organizers match.</p> : (
                <div className="np-checks np-checks--scroll">
                  {shown.map((u) => (
                    <label key={u.id} className="np-check">
                      <input type="checkbox" checked={trusted.includes(u.id)} onChange={() => { flip(trusted, setTrusted, u.id); setErrors((x) => ({ ...x, trusted: '' })) }} />
                      <Avatar name={u.name} />
                      <span><strong>{u.name}</strong>{u.city && <span className="ch-muted"> {u.city}</span>}</span>
                    </label>
                  ))}
                </div>
              )}
              {errors.trusted && <span className="ch-field__hint np-err" id="trusted-err">{errors.trusted}</span>}
            </fieldset>
          </Section>

          <div className="row">
            <button type="submit" className="ch-btn ch-btn--primary">Save autopilot settings</button>
            {dirty && <span className="ch-muted" role="status">Unsaved changes</span>}
          </div>
        </form>

        <div className="stack">
          <Section id="how" title="What happens">
            <ol className="np-how">
              <li>A trusted organizer submits an event for {np.name}.</li>
              <li>Charity Hub runs the checks you chose. They look only at what the organizer entered, not at the people.</li>
              <li>If every check passes, the event goes <strong>live immediately</strong>. It never enters your approval queue. The organizer and you are notified.</li>
              <li>If any check fails, or the organizer is not on the list, the event waits for you as usual.</li>
            </ol>
            <p className="ch-muted">You can still report a live event to Charity Hub from its page. Turning autopilot off only affects events submitted after you save.</p>
          </Section>

          <Section id="recent" title="Recently auto-approved">
            {recent.length === 0 ? <Empty title="Nothing auto-approved yet">Events that autopilot approves are listed here with the time.</Empty> : (
              <ul className="np-list">
                {recent.map((ev) => (
                  <li key={ev.key} className="np-list__item">
                    <div>
                      <p className="np-list__title">{ev.title}</p>
                      <p className="ch-muted">By {s.users[ev.organizerId]?.name ?? 'Unknown'} · {fmtDateTime(ev.review.at)}</p>
                    </div>
                    <Link to={ev.status === 'Live' ? `/np/live/${ev.key}` : `/np/approvals/${ev.key}`}>{ev.status === 'Live' ? 'Manage live' : 'View'}</Link>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>
      </div>
    </>
  )
}
