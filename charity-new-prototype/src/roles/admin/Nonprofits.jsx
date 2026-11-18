import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { Empty, Field, Modal, PageHeader, Section, StatusBadge, fieldProps, fmtDate, plural } from '../../ui/kit.jsx'
import { useAct, useDomain, useSession } from '../../domain/store.jsx'
import { CopyField, FilterBar, ResultCount, SearchField, SelectField, approvedDocs, inviteUrl } from './common.jsx'

const STATUSES = ['Invited', 'Pending', 'Active', 'Suspended', 'Rejected']
export const STRIPE_LABEL = { none: 'Not connected', incomplete: 'Setup incomplete', connected: 'Connected' }

export default function Nonprofits() {
  const s = useDomain()
  const [status, setStatus] = useState('all')
  const [q, setQ] = useState('')
  const [inviting, setInviting] = useState(false)

  const needle = q.trim().toLowerCase()
  const rows = Object.values(s.nonprofits)
    .filter((n) => status === 'all' || n.status === status)
    .filter((n) => !needle || [n.name, n.legalName, n.ein, n.category].some((f) => (f ?? '').toLowerCase().includes(needle)))
    .sort((a, b) => a.name.localeCompare(b.name))
  const filtered = status !== 'all' || needle

  return (
    <>
      <PageHeader
        eyebrow="Nonprofits"
        title="Nonprofits"
        lede="Nonprofits join by invitation. Verify their documents, then they can receive donations."
        actions={<button type="button" className="ch-btn ch-btn--primary" onClick={() => setInviting(true)}><Plus size={18} aria-hidden="true" /> Invite a nonprofit</button>}
      />
      <Section>
        <FilterBar label="Filter nonprofits">
          <SelectField id="np-status" label="Status" value={status} onChange={setStatus} options={[{ value: 'all', label: 'All statuses' }, ...STATUSES]} />
          <SearchField id="np-q" label="Search" value={q} onChange={setQ} placeholder="Name, EIN or category" />
        </FilterBar>
        <ResultCount>{plural(rows.length, 'nonprofit')}</ResultCount>
        {rows.length === 0 ? (
          <Empty title="No nonprofits match" action={filtered ? <button type="button" className="link-btn" onClick={() => { setStatus('all'); setQ('') }}>Clear filters</button> : undefined}>
            Try a different status or search.
          </Empty>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <caption className="ch-sr">Nonprofits</caption>
              <thead>
                <tr><th scope="col">Nonprofit</th><th scope="col">Category</th><th scope="col">EIN</th><th scope="col">Status</th><th scope="col">Documents</th><th scope="col">Stripe</th></tr>
              </thead>
              <tbody>
                {rows.map((n) => (
                  <tr key={n.id}>
                    <td><Link to={`/admin/nonprofits/${n.id}`}>{n.name}</Link></td>
                    <td>{n.category}</td>
                    <td className="adm-mono">{n.ein || 'Not given'}</td>
                    <td><StatusBadge status={n.status} /></td>
                    <td>{approvedDocs(n)} of 3 approved</td>
                    <td>{STRIPE_LABEL[n.stripe.state]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
      {inviting && <InviteModal onClose={() => setInviting(false)} />}
    </>
  )
}

const FIELD_OF = { invalid_name: 'name', duplicate_name: 'name', invalid_category: 'category', invalid_ein: 'ein', invalid_email: 'email', email_taken: 'email' }

function InviteModal({ onClose }) {
  const s = useDomain()
  const { now } = useSession()
  const act = useAct()
  const [form, setForm] = useState({ name: '', category: '', ein: '', email: '' })
  const [errors, setErrors] = useState({})
  const [created, setCreated] = useState(null)
  const set = (k) => (e) => { setForm((f) => ({ ...f, [k]: e.target.value })); setErrors((x) => ({ ...x, [k]: undefined })) }

  const submit = (e) => {
    e.preventDefault()
    const r = act('adminInviteNonprofit', { name: form.name, category: form.category, ein: form.ein.trim(), email: form.email.trim() || undefined })
    if (r.ok) setCreated(r.data)
    else setErrors({ [FIELD_OF[r.error.code] ?? 'name']: r.error.message })
  }

  if (created) {
    return (
      <Modal title={`${created.name} added`} onClose={onClose}>
        <div className="stack">
          {created.invite ? (
            <>
              <p>Share this single-use link with the nonprofit&rsquo;s admin. It expires on {fmtDate(created.invite.expiresAt)} (7 days from now), and issuing a new link replaces it.</p>
              <CopyField id="invite-link" label="Invite link" value={inviteUrl(created.invite.token)} />
              <p className="ch-muted adm-note">Prototype: no email is sent. Copy the link and open it to walk through the nonprofit&rsquo;s side.</p>
            </>
          ) : (
            <p>No invite link yet because no admin email was given. Open the nonprofit to issue one.</p>
          )}
          <div className="dialog-actions">
            <button type="button" className="ch-btn ch-btn--secondary" onClick={onClose}>Done</button>
            <Link to={`/admin/nonprofits/${created.id}`} className="ch-btn ch-btn--primary">Open nonprofit</Link>
          </div>
        </div>
      </Modal>
    )
  }

  return (
    <Modal title="Invite a nonprofit" onClose={onClose}>
      <form onSubmit={submit} noValidate>
        <p className="ch-muted">Add the organization, then share a single-use link so its admin can set a password and upload documents.</p>
        <Field id="inv-name" label="Nonprofit name" error={errors.name}>
          <input {...fieldProps('inv-name', errors.name)} value={form.name} onChange={set('name')} autoComplete="off" />
        </Field>
        <Field id="inv-category" label="Category" error={errors.category}>
          <select {...fieldProps('inv-category', errors.category)} value={form.category} onChange={set('category')}>
            <option value="">Choose a category</option>
            {s.categories.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
          </select>
        </Field>
        <Field id="inv-ein" label="EIN (optional)" hint="Format 12-3456789" error={errors.ein}>
          <input {...fieldProps('inv-ein', errors.ein)} value={form.ein} onChange={set('ein')} inputMode="numeric" autoComplete="off" />
        </Field>
        <Field id="inv-email" label="Admin email (optional)" hint="Add one to create the invite link now. You can also issue it later." error={errors.email}>
          <input {...fieldProps('inv-email', errors.email)} type="email" value={form.email} onChange={set('email')} autoComplete="off" />
        </Field>
        <p className="ch-muted adm-note">The invite is valid for 7 days from {fmtDate(now.toISOString())}.</p>
        <div className="dialog-actions">
          <button type="button" className="ch-btn ch-btn--secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="ch-btn ch-btn--primary">Create invite</button>
        </div>
      </form>
    </Modal>
  )
}
