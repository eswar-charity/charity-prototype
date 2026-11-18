import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useSession } from '../../domain/store.jsx'
import { Avatar } from '../../components/Brand.jsx'
import { Field, fieldProps, PageHeader, Section, useRun } from '../../ui/kit.jsx'

const PHONE = /^[\d\s()+.-]{7,20}$/

export default function Profile() {
  const { user } = useSession()
  const run = useRun()
  const [form, setForm] = useState({ name: user.name, bio: user.bio ?? '', city: user.city ?? '', phone: user.phone ?? '' })
  const [errors, setErrors] = useState({})
  const bind = (k) => ({ value: form[k], onChange: (e) => { setForm((f) => ({ ...f, [k]: e.target.value })); setErrors((x) => ({ ...x, [k]: undefined })) } })
  const fp = (k, hint = true) => ({ ...fieldProps(`se-p-${k}`, errors[k]), 'aria-describedby': errors[k] ? `se-p-${k}-err` : hint ? `se-p-${k}-hint` : undefined })

  const save = (e) => {
    e.preventDefault()
    const bad = {}
    if (form.name.trim().length < 2) bad.name = 'Enter your name.'
    if (form.phone.trim() && !PHONE.test(form.phone.trim())) bad.phone = 'That phone number does not look right.'
    setErrors(bad)
    const first = Object.keys(bad)[0]
    if (first) return document.getElementById(`se-p-${first}`)?.focus()
    const r = run('updateProfile', { name: form.name, bio: form.bio, city: form.city.trim(), phone: form.phone.trim() }, { quiet: true, success: 'Profile saved.' })
    if (!r.ok) { setErrors({ [r.error.code === 'invalid_name' ? 'name' : 'form']: r.error.message }); if (r.error.code === 'invalid_name') document.getElementById('se-p-name')?.focus() }
  }

  return (
    <>
      <PageHeader eyebrow="Profile" title="About you" lede="This is what people see on your public organizer page." actions={<Link className="ch-btn ch-btn--secondary" to={`/organizers/${user.id}`}>View your public profile</Link>} />
      <Section id="se-profile">
        <form className="stack se-form" onSubmit={save} noValidate>
          <div className="row"><Avatar name={form.name || user.name} size="lg" /><span className="ch-muted">{user.email}</span></div>
          {errors.form && <p className="se-banner se-banner--danger" role="alert">{errors.form}</p>}
          <Field id="se-p-name" label="Name" error={errors.name}>
            <input {...fp('name', false)} autoComplete="name" {...bind('name')} />
          </Field>
          <Field id="se-p-bio" label="Bio" hint={`${280 - form.bio.length} characters left. Tell people what kind of events you run.`} error={errors.bio}>
            <textarea {...fp('bio')} className="ch-field__input idea" rows={4} maxLength={280} {...bind('bio')} />
          </Field>
          <div className="se-grid2">
            <Field id="se-p-city" label="City" error={errors.city}>
              <input {...fp('city', false)} autoComplete="address-level2" {...bind('city')} />
            </Field>
            <Field id="se-p-phone" label="Phone (optional)" hint="Digits, spaces and + ( ) - only." error={errors.phone}>
              <input {...fp('phone')} type="tel" autoComplete="tel" {...bind('phone')} />
            </Field>
          </div>
          <div><button type="submit" className="ch-btn ch-btn--primary">Save profile</button></div>
        </form>
      </Section>
    </>
  )
}
