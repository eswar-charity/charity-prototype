import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { FileText } from 'lucide-react'
import { Empty, Field, Modal, PageHeader, Section, StatusBadge, fieldProps, fmtDate, plural, useConfirm, useRun } from '../../ui/kit.jsx'
import { useAct, useDomain, useSession } from '../../domain/store.jsx'
import { npEvents } from '../../domain/selectors.js'
import { CopyField, ReasonModal, approvedDocs, inviteUrl } from './common.jsx'
import { STRIPE_LABEL } from './Nonprofits.jsx'

const EIN_FORMAT = /^\d{2}-\d{7}$/

export default function NonprofitDetail() {
  const { id } = useParams()
  const s = useDomain()
  const np = s.nonprofits[id]
  if (!np) {
    return (
      <>
        <PageHeader back={{ to: '/admin/nonprofits', label: 'Nonprofits' }} title="Nonprofit not found" />
        <Empty title="We could not find that nonprofit" action={<Link to="/admin/nonprofits">Back to nonprofits</Link>}>The link may be wrong.</Empty>
      </>
    )
  }
  return (
    <>
      <PageHeader
        back={{ to: '/admin/nonprofits', label: 'Nonprofits' }}
        eyebrow="Nonprofit"
        title={np.name}
        actions={<><StatusBadge status={np.status} />{np.verified && <StatusBadge status="Verified">Verified by Charity Hub</StatusBadge>}</>}
      />
      <div className="grid-2c">
        <Facts np={np} />
        <StatusPanel np={np} />
      </div>
      <DocumentsPanel np={np} />
      <InvitePanel np={np} />
      <EventsPanel np={np} />
      <AccountsPanel np={np} />
    </>
  )
}

/* ---------------------------------------------------------------- facts */
function Facts({ np }) {
  const rows = [
    ['Legal name', np.legalName],
    ['EIN', np.ein ? `${np.ein}${EIN_FORMAT.test(np.ein) ? '' : ' (format looks wrong)'}` : 'Not given'],
    ['Category', np.category],
    ['Headquarters', np.headquarters || 'Not given'],
    ['Founded', np.founded ?? 'Not given'],
    ['EIN source', np.source],
    ['Stripe', `${STRIPE_LABEL[np.stripe.state]}${np.stripe.account ? ` (${np.stripe.account})` : ''}`],
    ['Settlement', np.settlement],
  ]
  return (
    <Section title="Facts" id="facts">
      <dl className="adm-facts">
        {rows.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
      </dl>
      <p><Link to={`/nonprofits/${np.slug}`}>View the public profile</Link></p>
    </Section>
  )
}

/* ---------------------------------------------------------------- verification + status controls */
function StatusPanel({ np }) {
  const s = useDomain()
  const run = useRun()
  const act = useAct()
  const confirm = useConfirm()
  const [rejecting, setRejecting] = useState(false)
  const approved = approvedDocs(np)
  const liveCount = npEvents(s, np.id).filter((e) => e.status === 'Live').length
  const blockReason = np.status === 'Invited' ? 'Waiting for the nonprofit to accept its invite.' : approved < 3 ? `Approve all three documents first (${approved} of 3 approved).` : ''
  const canVerify = !(np.status === 'Active' && np.verified)
  const einOk = EIN_FORMAT.test(np.ein ?? '')

  const verify = () => run('adminVerifyNonprofit', { npId: np.id }, { success: `${np.name} is verified` })
  const rerun = () => run('adminRerunEin', { npId: np.id }, { success: 'EIN check re-run. Source: IRS BMF (prototype stub, no live lookup).' })
  const reinstate = () => run('adminReinstateNonprofit', { npId: np.id }, { success: `${np.name} reinstated` })
  const suspend = async () => {
    const ok = await confirm({
      title: `Suspend ${np.name}?`,
      body: `${liveCount === 0 ? 'It has no live events right now.' : `Its ${plural(liveCount, 'live event')} will be blocked.`} Donations are held while it is suspended, and the nonprofit cannot take new events or donations until you reinstate it.`,
      confirm: 'Suspend nonprofit',
      danger: true,
    })
    if (ok) run('adminSuspendNonprofit', { npId: np.id }, { success: `${np.name} suspended` })
  }

  return (
    <Section title="Verification" id="verification">
      <dl className="adm-facts">
        <div><dt>EIN format</dt><dd><span className={einOk ? 'adm-pass' : 'adm-fail'}>{einOk ? 'Passed' : 'Failed'}</span> {np.ein || 'No EIN given'}</dd></div>
        <div><dt>Documents</dt><dd>{approved} of 3 approved</dd></div>
        <div><dt>Status</dt><dd><StatusBadge status={np.status} /></dd></div>
      </dl>
      <div className="row">
        <button type="button" className="ch-btn ch-btn--secondary" onClick={rerun}>Re-run EIN check</button>
        {canVerify && np.status !== 'Suspended' && (
          <button type="button" className="ch-btn ch-btn--primary" aria-disabled={blockReason ? 'true' : undefined} aria-describedby={blockReason ? 'verify-reason' : undefined} onClick={verify}>Verify nonprofit</button>
        )}
        {(np.status === 'Invited' || np.status === 'Pending') && <button type="button" className="ch-btn ch-btn--danger" onClick={() => setRejecting(true)}>Reject nonprofit</button>}
        {np.status === 'Active' && <button type="button" className="ch-btn ch-btn--danger" onClick={suspend}>Suspend nonprofit</button>}
        {np.status === 'Suspended' && <button type="button" className="ch-btn ch-btn--primary" onClick={reinstate}>Reinstate nonprofit</button>}
      </div>
      {canVerify && np.status !== 'Suspended' && blockReason && <p id="verify-reason" className="adm-reason">Verify is unavailable. {blockReason}</p>}
      {np.status === 'Suspended' && <p className="adm-note">Suspended: its live events are blocked and donations are held. Reinstating restores the events that were blocked by the suspension.</p>}
      {np.status === 'Rejected' && <p className="adm-note">Rejected. The nonprofit can still be verified later once all three documents are approved.</p>}
      {rejecting && (
        <ReasonModal
          title={`Reject ${np.name}?`}
          intro="The nonprofit will not be able to take events or donations."
          label="Reason"
          hint="Recorded in the audit log."
          required
          requiredMessage="Add a reason so the decision can be explained later."
          submitLabel="Reject nonprofit"
          success={`${np.name} rejected`}
          danger
          onSubmit={(reason) => act('adminRejectNonprofit', { npId: np.id, reason })}
          onClose={() => setRejecting(false)}
        />
      )}
    </Section>
  )
}

/* ---------------------------------------------------------------- documents */
function DocumentsPanel({ np }) {
  const run = useRun()
  const act = useAct()
  const [viewing, setViewing] = useState(null)
  const [asking, setAsking] = useState(null)
  const doc = (id) => np.documents.find((d) => d.id === id)
  const viewed = viewing && doc(viewing)
  const askedDoc = asking && doc(asking)

  return (
    <Section title="Documents" id="documents">
      <div className="table-wrap">
        <table className="table">
          <caption className="ch-sr">Verification documents</caption>
          <thead><tr><th scope="col">Document</th><th scope="col">File</th><th scope="col">Status</th><th scope="col">Actions</th></tr></thead>
          <tbody>
            {np.documents.map((d) => (
              <tr key={d.id}>
                <td>{d.label}</td>
                <td className="adm-wrap">{d.name || <span className="ch-muted">No file yet</span>}{d.note && <span className="adm-docnote">Note to nonprofit: {d.note}</span>}</td>
                <td><StatusBadge status={d.status} /></td>
                <td>
                  <div className="table-actions">
                    <button type="button" className="ch-btn ch-btn--text ch-btn--sm" disabled={d.status === 'Missing'} aria-label={`View ${d.label}`} onClick={() => setViewing(d.id)}>View</button>
                    <button type="button" className="ch-btn ch-btn--secondary ch-btn--sm" disabled={['Missing', 'Approved', 'Reupload'].includes(d.status)} aria-label={`Approve ${d.label}`}
                      onClick={() => run('adminDocumentDecision', { npId: np.id, docId: d.id, decision: 'approve' }, { success: `${d.label} approved` })}>Approve</button>
                    <button type="button" className="ch-btn ch-btn--secondary ch-btn--sm" disabled={d.status === 'Missing'} aria-label={`Ask for re-upload of ${d.label}`} onClick={() => setAsking(d.id)}>Ask for re-upload</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {viewed && (
        <Modal title={viewed.label} onClose={() => setViewing(null)} wide labelledBy="doc-t">
          <div className="stack">
            <p><strong>{viewed.name}</strong> <StatusBadge status={viewed.status} /></p>
            <div className="adm-docpage" role="img" aria-label={`Placeholder preview of ${viewed.name}`}>
              <FileText size={40} aria-hidden="true" />
              <p className="adm-docpage__title">{viewed.label}</p>
              <p>{np.legalName}</p>
              <p>EIN {np.ein || 'not given'}</p>
              <span className="adm-docpage__line" /><span className="adm-docpage__line" /><span className="adm-docpage__line adm-docpage__line--short" />
            </div>
            <p className="ch-muted adm-note">Prototype: uploaded files are not stored, so this is a stand-in page. In the real app the nonprofit&rsquo;s file opens here.</p>
            {viewed.note && <p className="adm-docnote">Note to nonprofit: {viewed.note}</p>}
          </div>
        </Modal>
      )}
      {askedDoc && (
        <ReasonModal
          title={`Ask for a new ${askedDoc.label}`}
          intro={`${np.name} will see your note on its setup page and can upload the file again.`}
          label="What should they fix?"
          hint="Required. Be specific, for example: the letter is cropped."
          submitLabel="Ask for re-upload"
          success={`Asked ${np.name} to re-upload ${askedDoc.label}`}
          onSubmit={(note) => act('adminDocumentDecision', { npId: np.id, docId: askedDoc.id, decision: 'reupload', note })}
          onClose={() => setAsking(null)}
        />
      )}
    </Section>
  )
}

/* ---------------------------------------------------------------- invite */
function InvitePanel({ np }) {
  const s = useDomain()
  const { now } = useSession()
  const act = useAct()
  const admins = Object.values(s.users).filter((u) => u.role === 'np_admin' && u.nonprofitId === np.id)
  const pending = admins.filter((u) => u.status === 'pending')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  // Only relevant while nobody has accepted: an active admin already signs in with a password.
  if (!np.invite && admins.some((u) => u.status === 'active')) {
    return (
      <Section title="Invite" id="invite"><p>The invite was accepted, so this nonprofit&rsquo;s admin signs in with their own password.</p></Section>
    )
  }
  const issue = (e) => {
    e.preventDefault()
    const r = act('adminIssueInvite', { npId: np.id, email: email.trim() })
    if (r.ok) { setEmail(''); setError('') } else setError(r.error.message)
  }
  const expired = np.invite && new Date(np.invite.expiresAt) < now
  return (
    <Section title="Invite" id="invite">
      {np.invite ? (
        <div className="stack">
          <p>
            Single-use link{np.invite.email ? <> for <strong>{np.invite.email}</strong></> : ''}. {expired ? `It expired on ${fmtDate(np.invite.expiresAt)}.` : `It expires on ${fmtDate(np.invite.expiresAt)}.`}
          </p>
          <CopyField id="np-invite-link" label="Invite link" value={inviteUrl(np.invite.token)} />
        </div>
      ) : (
        <p className="ch-muted">There is no active invite link. {pending.length > 0 ? 'The previous link was used or replaced.' : 'Issue one so the nonprofit can set up its account.'}</p>
      )}
      <form className="adm-inline-form" onSubmit={issue} noValidate>
        <Field id="np-invite-email" label="Admin email" hint={np.invite ? 'Issuing a new link stops the old one from working.' : 'A single-use link is created for this address.'} error={error}>
          <input {...fieldProps('np-invite-email', error)} type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError('') }} autoComplete="off" />
        </Field>
        <button type="submit" className="ch-btn ch-btn--secondary">{np.invite ? 'Re-issue invite' : 'Issue invite'}</button>
      </form>
      <p className="ch-muted adm-note">Prototype: no email is sent. Copy the link to share it.</p>
    </Section>
  )
}

/* ---------------------------------------------------------------- events + accounts */
function EventsPanel({ np }) {
  const s = useDomain()
  const events = npEvents(s, np.id)
  return (
    <Section title="Events" id="np-events" aside={events.length > 0 && <Link to={`/admin/events?q=${encodeURIComponent(np.name)}`} className="adm-more">Open in Events</Link>}>
      {events.length === 0 ? (
        <Empty title="No events yet">Events appear here once someone picks this nonprofit as the beneficiary.</Empty>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <caption className="ch-sr">Events for {np.name}</caption>
            <thead><tr><th scope="col">Event</th><th scope="col">Organizer</th><th scope="col">Date</th><th scope="col">Status</th></tr></thead>
            <tbody>
              {events.map((ev) => (
                <tr key={ev.key}>
                  <td><Link to={`/events/${ev.key}`}>{ev.title}</Link></td>
                  <td>{s.users[ev.organizerId]?.name ?? 'Unknown'}</td>
                  <td>{ev.date || 'No date yet'}</td>
                  <td><StatusBadge status={ev.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Section>
  )
}

function AccountsPanel({ np }) {
  const s = useDomain()
  const admins = Object.values(s.users).filter((u) => u.role === 'np_admin' && u.nonprofitId === np.id)
  return (
    <Section title="Admin account" id="np-admins">
      {admins.length === 0 ? (
        <p className="ch-muted">No admin account yet. It is created when you issue an invite.</p>
      ) : (
        <ul className="adm-list">
          {admins.map((u) => (
            <li key={u.id}>
              <div className="adm-list__main">
                <strong>{u.name}</strong>
                <span className="ch-muted">{u.email}</span>
              </div>
              <StatusBadge status={u.status === 'pending' ? 'Pending' : u.status === 'active' ? 'Active' : 'Closed'}>{u.status === 'pending' ? 'Invite pending' : u.status === 'active' ? 'Active' : 'Anonymized'}</StatusBadge>
            </li>
          ))}
        </ul>
      )}
    </Section>
  )
}
