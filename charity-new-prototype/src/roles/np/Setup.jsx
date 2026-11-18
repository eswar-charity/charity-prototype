import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CircleCheck, Circle, FileUp, PartyPopper } from 'lucide-react'
import { PageHeader, Section, StatusBadge, Field, fieldProps, useRun, useToast } from '../../ui/kit.jsx'
import { npSetupSteps } from '../../domain/selectors.js'
import { useAct } from '../../domain/store.jsx'
import { useNp } from './shared.jsx'

const ACCEPT = '.pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg'
const STATUS_HINT = {
  Missing: 'No file yet.',
  Uploaded: 'Waiting for Charity Hub to review it.',
  Approved: 'Approved by Charity Hub.',
  Reupload: 'Charity Hub needs a new file.',
}

function StepHead({ n, done, title, children }) {
  return (
    <div className="np-step__head">
      <span className={`np-step__mark ${done ? 'is-done' : ''}`}>{done ? <CircleCheck size={22} aria-hidden="true" /> : <Circle size={22} aria-hidden="true" />}</span>
      <div>
        <h2 className="np-step__title"><span className="ch-muted">Step {n}.</span> {title}</h2>
        {children}
      </div>
      <span className="np-step__state">{done ? <StatusBadge status="Approved">Done</StatusBadge> : <StatusBadge status="Missing">To do</StatusBadge>}</span>
    </div>
  )
}

function DocumentRow({ doc }) {
  const run = useRun()
  const pick = (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (file) run('npUploadDocument', { type: doc.type, fileName: file.name }, { success: `${doc.label} uploaded` })
  }
  const canUpload = doc.status !== 'Approved'
  const inputId = `doc-${doc.type}`
  return (
    <li className="np-doc">
      <div className="np-doc__main">
        <p className="np-list__title">{doc.label}</p>
        <p className="ch-muted">{doc.name ? `${doc.name} · ` : ''}{STATUS_HINT[doc.status]}</p>
        {doc.status === 'Reupload' && doc.note && <p className="np-note"><strong>Note from Charity Hub:</strong> {doc.note}</p>}
      </div>
      <StatusBadge status={doc.status} />
      {canUpload && (
        <span className="np-file">
          <input id={inputId} className="ch-sr" type="file" accept={ACCEPT} onChange={pick} aria-describedby={`${inputId}-hint`} />
          <label htmlFor={inputId} className="ch-btn ch-btn--secondary ch-btn--sm">
            <FileUp size={16} aria-hidden="true" />
            {doc.status === 'Missing' ? 'Upload' : doc.status === 'Reupload' ? 'Upload again' : 'Replace'}
            <span className="ch-sr"> {doc.label}</span>
          </label>
          <span id={`${inputId}-hint`} className="ch-sr">PDF, PNG or JPG</span>
        </span>
      )}
    </li>
  )
}

function StripeStep({ np }) {
  const act = useAct()
  const run = useRun()
  const toast = useToast()
  const nav = useNavigate()
  const [linking, setLinking] = useState(false)
  const [account, setAccount] = useState('')
  const [err, setErr] = useState('')
  const state = np.stripe.state

  const create = () => run('npConnectStripe', { mode: 'create' }, { onOk: () => nav('/np/stripe/hosted') })
  const link = (e) => {
    e.preventDefault()
    const id = account.trim()
    if (!/^acct_[A-Za-z0-9]{6,}$/.test(id)) { setErr('Account IDs look like acct_1A2B3C4D5E.'); return }
    setErr('')
    const r = act('npConnectStripe', { mode: 'link' })
    if (!r.ok) { toast(r.error.message, 'error'); return }
    const done = act('npStripeCallback', { success: true })
    if (!done.ok) { toast(done.error.message, 'error'); return }
    toast('Stripe account linked')
    setLinking(false); setAccount('')
  }

  if (state === 'connected') {
    return <p className="ch-muted">Connected{np.stripe.account ? ` (account ${np.stripe.account})` : ''}. Gifts to your events are paid out to this account.</p>
  }
  return (
    <div className="stack">
      {state === 'incomplete' && (
        <p className="np-note">Stripe setup was started but not finished. {np.stripe.mode === 'create' ? 'Pick up where you left off.' : 'Link the account again to finish.'}</p>
      )}
      <div className="row">
        {state === 'incomplete' && np.stripe.mode === 'create'
          ? <Link className="ch-btn ch-btn--primary ch-btn--sm" to="/np/stripe/hosted">Resume Stripe setup</Link>
          : <button type="button" className="ch-btn ch-btn--primary ch-btn--sm" onClick={create}>Create a Stripe account in the app</button>}
        <button type="button" className="ch-btn ch-btn--secondary ch-btn--sm" aria-expanded={linking} onClick={() => setLinking((v) => !v)}>Link an existing Stripe account</button>
      </div>
      {linking && (
        <form className="np-form" onSubmit={link} noValidate aria-label="Link an existing Stripe account">
          <Field id="stripe-account" label="Stripe account ID" hint="Find it in Stripe under Settings, then Account details." error={err}>
            <input {...fieldProps('stripe-account', err)} value={account} onChange={(e) => setAccount(e.target.value)} placeholder="acct_1A2B3C4D5E" autoComplete="off" />
          </Field>
          <div><button className="ch-btn ch-btn--primary ch-btn--sm" type="submit">Link account</button></div>
        </form>
      )}
    </div>
  )
}

export default function Setup() {
  const { np } = useNp()
  const steps = npSetupSteps(np)
  const [pw, docs, stripe, verified] = steps
  const allDone = steps.every((x) => x.done)
  const docsReady = docs.done
  const doneCount = steps.filter((x) => x.done).length

  return (
    <>
      <PageHeader eyebrow="Setup" title={allDone ? 'Setup complete' : 'Finish setup'} lede={allDone ? 'Everything is in place.' : `${doneCount} of ${steps.length} steps done. Supporters can give once all four are finished.`} />

      {allDone && (
        <section className="np-done" aria-labelledby="done-h">
          <PartyPopper size={28} aria-hidden="true" />
          <div className="np-grow">
            <h2 className="h-heading-sm" id="done-h">You are verified and ready for gifts</h2>
            <p className="ch-muted">{np.name} is verified by Charity Hub and payments are connected. Approve events or run your own.</p>
          </div>
          <div className="row">
            <Link className="ch-btn ch-btn--primary ch-btn--sm" to="/np/events/new">Create an event</Link>
            <Link className="ch-btn ch-btn--secondary ch-btn--sm" to="/np">Back to Launchpad</Link>
          </div>
        </section>
      )}

      <Section>
        <StepHead n={1} done={pw.done} title="Set your password">
          <p className="ch-muted">{pw.done ? 'Your password is set.' : 'Accept your invite link to set a password.'}</p>
        </StepHead>
      </Section>

      <Section>
        <StepHead n={2} done={docs.done} title="Upload your three documents">
          <p className="ch-muted">{docs.detail}. PDF, PNG or JPG. Charity Hub reviews each one.</p>
        </StepHead>
        <ul className="np-list" aria-label="Documents">
          {np.documents.map((d) => <DocumentRow key={d.id} doc={d} />)}
        </ul>
      </Section>

      <Section>
        <StepHead n={3} done={stripe.done} title="Connect Stripe">
          <p className="ch-muted">Stripe pays gifts out to your bank account. Charity Hub never holds the money.</p>
        </StepHead>
        <StripeStep np={np} />
      </Section>

      <Section>
        <StepHead n={4} done={verified.done} title="Verified by Charity Hub">
          <p className="ch-muted">
            {verified.done
              ? 'Charity Hub has verified your nonprofit.'
              : docsReady && stripe.done
                ? 'Waiting for Charity Hub. A person reviews your documents, usually within a few days. We will notify you.'
                : 'Charity Hub reviews your documents once all three are uploaded and Stripe is connected.'}
          </p>
        </StepHead>
        {!verified.done && docsReady && stripe.done && <p className="np-note" role="status">In review. Nothing more for you to do right now.</p>}
      </Section>
    </>
  )
}
