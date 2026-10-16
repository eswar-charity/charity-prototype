import { forwardRef, useEffect, useState } from 'react';
import { getPaymentsConfig } from '../api/payments';
import StripePaymentForm from './StripePaymentForm';
import StaticStripePaymentForm from './StaticStripePaymentForm';

/**
 * Chooses the payment UI from the API's /payments/config: real Stripe Elements
 * when a Stripe key is configured, otherwise the dev-only static form.
 * The forwarded ref exposes { mode, submit(), confirm() } to the donate flow.
 */
const PaymentForm = forwardRef(function PaymentForm(props, ref) {
  const [config, setConfig] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getPaymentsConfig()
      .then((c) => { if (!cancelled) setConfig(c); })
      .catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; };
  }, []);

  if (failed) {
    return <p className="static-stripe-hint">Payments are temporarily unavailable. Please try again shortly.</p>;
  }
  if (!config) return <div className="static-stripe" aria-busy="true" style={{ minHeight: 120 }} />;

  if (config.provider === 'stripe' && config.publishable_key) {
    return (
      <StripePaymentForm
        ref={ref}
        amount={props.amount}
        disabled={props.disabled}
        publishableKey={config.publishable_key}
      />
    );
  }
  return <StaticStripePaymentForm ref={ref} {...props} />;
});

export default PaymentForm;
