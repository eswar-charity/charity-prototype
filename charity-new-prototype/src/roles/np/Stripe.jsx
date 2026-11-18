import { useEffect, useRef } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { PageHeader, Empty, useRun, useToast } from '../../ui/kit.jsx'
import { useNp } from './shared.jsx'

/** A clearly labelled stand-in for Stripe's hosted onboarding. Nothing here talks to Stripe. */
export function StripeHosted() {
  const { np } = useNp()
  const nav = useNavigate()
  if (np.stripe.state !== 'incomplete') return <Navigate to="/np/setup" replace />
  return (
    <>
      <PageHeader eyebrow="Payments" title="Connect Stripe" lede="In the live product this step happens on Stripe's own site." />
      <p className="np-banner" role="status"><strong>Simulated screen.</strong> This prototype stands in for Stripe-hosted onboarding. No real account, bank details or personal data are collected.</p>
      <section className="np-hosted" aria-labelledby="hosted-h">
        <div className="np-hosted__bar" aria-hidden="true"><Lock size={14} /> stripe.com / onboarding (simulated)</div>
        <div className="np-hosted__body">
          <h2 className="h-heading-sm" id="hosted-h">Set up payouts for {np.name}</h2>
          <p className="ch-muted">Stripe would ask for your organization details and a bank account here. Choose what happens next.</p>
          <dl className="np-hosted__facts">
            <div><dt>Organization</dt><dd>{np.legalName}</dd></div>
            <div><dt>EIN</dt><dd>{np.ein || 'Not provided'}</dd></div>
            <div><dt>Account</dt><dd>{np.stripe.account}</dd></div>
          </dl>
          <div className="row">
            <button className="ch-btn ch-btn--primary" onClick={() => nav('/np/stripe/callback?status=success')}>Continue</button>
            <button className="ch-btn ch-btn--secondary" onClick={() => nav('/np/stripe/callback?status=cancel')}>Cancel</button>
          </div>
        </div>
      </section>
    </>
  )
}

/** Return point from Stripe: `?status=success|cancel`. */
export function StripeCallback() {
  const { np } = useNp()
  const [params] = useSearchParams()
  const status = params.get('status')
  const run = useRun()
  const toast = useToast()
  const nav = useNavigate()
  const handled = useRef(false)
  const valid = status === 'success' || status === 'cancel'
  const started = np.stripe.state !== 'none'

  useEffect(() => {
    if (handled.current || !valid) return
    handled.current = true
    if (!started) { toast('Start Stripe setup first.', 'error'); nav('/np/setup', { replace: true }); return }
    if (status === 'success') {
      run('npStripeCallback', { success: true }, { success: 'Stripe is connected', onOk: () => nav('/np/setup', { replace: true }) })
    } else {
      run('npStripeCallback', { success: false }, { onOk: () => { toast('Stripe setup was not finished. You can pick it up again from Setup.'); nav('/np/setup', { replace: true }) } })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (!valid) {
    return <Empty title="That Stripe link is not valid" action={<Link className="ch-btn ch-btn--secondary ch-btn--sm" to="/np/setup">Back to setup</Link>}>We could not tell how Stripe setup ended. Start again from Setup.</Empty>
  }
  return <p role="status" className="ch-muted">Finishing up with Stripe…</p>
}
