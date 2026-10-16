import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Check, AlertCircle } from 'lucide-react';
import { getStripeStatus, startStripeOnboarding } from '../api/payments';

const money = (n) => `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/**
 * Payout readiness for the signed-in nonprofit, straight from Stripe Connect
 * (via the API): onboarding link, charges/payouts flags and real balance.
 */
export default function StripeConnectCard({ variant = 'mobile' }) {
  const [params] = useSearchParams();
  const [status, setStatus] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setStatus(await getStripeStatus());
      setError('');
    } catch (err) {
      setError(err?.message || 'Could not load payout status');
    }
  }, []);

  // Re-check when returning from Stripe's hosted onboarding (?stripe=return).
  useEffect(() => { load(); }, [load, params]);

  const connect = async () => {
    setBusy(true);
    try {
      const { url } = await startStripeOnboarding();
      window.location.assign(url);
    } catch (err) {
      setError(err?.message || 'Could not start Stripe setup');
      setBusy(false);
    }
  };

  const ready = status?.charges_enabled && status?.payouts_enabled;
  let title = 'Checking payout setup…';
  let detail = '';
  if (error) {
    title = 'Payout status unavailable';
    detail = error;
  } else if (status && !status.enabled) {
    title = 'Payments run in development mode';
    detail = 'No Stripe key is configured, so donations are simulated and nothing is paid out.';
  } else if (status && ready) {
    title = 'Payouts active';
    detail = 'Donations transfer to your Stripe account automatically.';
  } else if (status?.connected) {
    title = 'Finish Stripe setup';
    detail = 'Stripe still needs a few details before you can receive donations.';
  } else if (status) {
    title = 'Set up payouts';
    detail = 'Connect a Stripe account so donations to your events can reach you.';
  }

  const canConnect = status?.enabled && !ready;
  const Wrapper = variant === 'desktop' ? 'div' : 'div';
  const wrapperClass = variant === 'desktop' ? 'dsk-np-panel' : 'card';

  return (
    <Wrapper className={wrapperClass} style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
          background: ready ? 'var(--blue-soft)' : '#FFF4E5',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {ready
            ? <Check size={18} color="var(--blue)" strokeWidth={2.5} />
            : <AlertCircle size={18} color="#B45309" />}
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--dark)' }}>{title}</p>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{detail}</p>
        </div>
        {canConnect && (
          <button type="button" className="btn-ghost" style={{ fontSize: 13 }} disabled={busy} onClick={connect}>
            {busy ? 'Opening…' : status.connected ? 'Continue' : 'Set up'}
          </button>
        )}
      </div>
      {ready && status.balance && (
        <div style={{ borderTop: '1px solid var(--border)', marginTop: 14, paddingTop: 14 }}>
          <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--dark)' }}>
            {money(status.balance.available)} available for payout
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
            {money(status.balance.pending)} pending · payout schedule is managed by Stripe
          </p>
        </div>
      )}
    </Wrapper>
  );
}
