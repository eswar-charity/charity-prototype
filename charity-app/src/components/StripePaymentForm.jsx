import { forwardRef, useEffect, useImperativeHandle, useMemo } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import DonationQuote from './DonationQuote';
import useDonationQuote from '../hooks/useDonationQuote';

const MIN_CENTS = 100;

const APPEARANCE = {
  theme: 'stripe',
  variables: { colorPrimary: '#1A6EB5', borderRadius: '10px', fontFamily: 'inherit' },
};

/**
 * Inside <Elements>: exposes the two calls the donate flow needs.
 *   submit()  → validates the form, resolves to an error message or null
 *   confirm() → confirms the PaymentIntent created by POST /donations
 */
const Inner = forwardRef(function Inner({ amountCents }, ref) {
  const stripe = useStripe();
  const elements = useElements();

  useEffect(() => {
    if (elements) elements.update({ amount: amountCents });
  }, [elements, amountCents]);

  useImperativeHandle(ref, () => ({
    mode: 'stripe',
    async submit() {
      if (!stripe || !elements) return 'Payment form is still loading';
      const { error } = await elements.submit();
      return error ? error.message || 'Check your payment details' : null;
    },
    async confirm(clientSecret, returnUrl) {
      return stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: { return_url: returnUrl },
        redirect: 'if_required',
      });
    },
  }), [stripe, elements]);

  return <PaymentElement options={{ layout: 'tabs' }} />;
});

/** Real Stripe Elements card form (deferred intent: the intent is created on Donate). */
const StripePaymentForm = forwardRef(function StripePaymentForm(
  { amount, publishableKey, disabled = false },
  ref,
) {
  const quote = useDonationQuote(amount);
  const amountCents = Math.max(MIN_CENTS, Math.round(quote.total * 100));
  const stripePromise = useMemo(() => loadStripe(publishableKey), [publishableKey]);
  const options = useMemo(
    () => ({ mode: 'payment', amount: amountCents, currency: 'usd', appearance: APPEARANCE }),
    // Only the initial amount seeds the options; later changes go through elements.update().
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <div className="static-stripe" style={disabled ? { opacity: 0.6, pointerEvents: 'none' } : undefined}>
      <DonationQuote quote={quote} />
      <p className="static-stripe-label">Pay with card</p>
      <Elements stripe={stripePromise} options={options}>
        <Inner ref={ref} amountCents={amountCents} />
      </Elements>
      <p className="static-stripe-powered">Secured by Stripe</p>
    </div>
  );
});

export default StripePaymentForm;
