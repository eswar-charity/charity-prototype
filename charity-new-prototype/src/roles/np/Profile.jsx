import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink } from 'lucide-react'
import { PageHeader, Section, Field, fieldProps, StatusBadge, useRun } from '../../ui/kit.jsx'
import { useNp } from './shared.jsx'

export default function Profile() {
  const { user, np } = useNp()
  const run = useRun()
  const [mission, setMission] = useState(np.mission ?? '')
  const [story, setStory] = useState(np.story ?? '')
  const [hq, setHq] = useState(np.headquarters ?? '')
  const [errors, setErrors] = useState({})
  const [name, setName] = useState(user.name)
  const [phone, setPhone] = useState(user.phone ?? '')
  const [acctErrors, setAcctErrors] = useState({})

  const saveOrg = (e) => {
    e.preventDefault()
    const next = {}
    if (mission.trim().length < 10) next.mission = 'Describe the mission in a sentence or two.'
    setErrors(next)
    if (Object.keys(next).length) return
    run('npUpdateProfile', { mission, story, headquarters: hq }, { success: 'Organization profile saved' })
  }
  const saveAcct = (e) => {
    e.preventDefault()
    const next = {}
    if (name.trim().length < 2) next.name = 'Enter your name.'
    setAcctErrors(next)
    if (Object.keys(next).length) return
    run('updateProfile', { name, phone }, { success: 'Account details saved' })
  }

  return (
    <>
      <PageHeader eyebrow="Organization" title={np.name} lede="What supporters read about you on your public profile."
        actions={<Link className="ch-btn ch-btn--secondary ch-btn--sm" to={`/nonprofits/${np.slug}`}>View public profile <ExternalLink size={16} aria-hidden="true" /></Link>} />

      <div className="grid-2c np-align-start">
        <Section id="org" title="Public profile">
          <form className="np-form" onSubmit={saveOrg} noValidate>
            <Field id="np-mission" label="Mission" hint="One or two sentences. Shown at the top of your profile and on event pages." error={errors.mission}>
              <textarea {...fieldProps('np-mission', errors.mission)} className="ch-field__input np-textarea" rows={3} value={mission} onChange={(e) => setMission(e.target.value)} />
            </Field>
            <Field id="np-story" label="Story" hint="Your history and the work supporters help with.">
              <textarea {...fieldProps('np-story')} className="ch-field__input np-textarea" rows={6} value={story} onChange={(e) => setStory(e.target.value)} />
            </Field>
            <Field id="np-hq" label="Headquarters">
              <input {...fieldProps('np-hq')} value={hq} onChange={(e) => setHq(e.target.value)} autoComplete="off" />
            </Field>
            <div><button className="ch-btn ch-btn--primary" type="submit">Save profile</button></div>
          </form>
        </Section>

        <div className="stack">
          <Section id="legal" title="Legal details">
            <p className="ch-muted">These come from IRS records and can only be changed by Charity Hub.</p>
            <Field id="np-legal" label="Legal name">
              <input {...fieldProps('np-legal')} value={np.legalName ?? ''} readOnly />
            </Field>
            <Field id="np-ein" label="EIN">
              <input {...fieldProps('np-ein')} value={np.ein || 'Not on file'} readOnly />
            </Field>
            <p className="row">
              <StatusBadge status={np.status} />
              {np.verified && <StatusBadge status="Verified">Verified by Charity Hub</StatusBadge>}
              <Link to="/np/setup">Setup and documents</Link>
            </p>
          </Section>

          <Section id="account" title="Your account">
            <form className="np-form" onSubmit={saveAcct} noValidate>
              <Field id="acct-name" label="Name" error={acctErrors.name}>
                <input {...fieldProps('acct-name', acctErrors.name)} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
              </Field>
              <Field id="acct-email" label="Email" hint="Your sign-in email. Ask Charity Hub to change it.">
                <input {...fieldProps('acct-email')} value={user.email} readOnly />
              </Field>
              <Field id="acct-phone" label="Phone (optional)">
                <input {...fieldProps('acct-phone')} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
              </Field>
              <div><button className="ch-btn ch-btn--secondary" type="submit">Save account details</button></div>
            </form>
          </Section>
        </div>
      </div>
    </>
  )
}
