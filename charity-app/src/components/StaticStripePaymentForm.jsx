import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import DonationQuote from './DonationQuote';
import useDonationQuote from '../hooks/useDonationQuote';
import {
  STRIPE_TEST_SUCCESS,
  digitsOnly,
  formatCardNumber,
} from '../utils/staticStripe.js';

export { STRIPE_TEST_SUCCESS, STRIPE_TEST_FAIL } from '../utils/staticStripe.js';

/**
 * Dev-only stand-in used when the API reports provider "mock" (no Stripe key
 * configured). The card number goes to POST /donations; 4242… succeeds,
 * cards ending 0002 decline. Never shown when real Stripe is configured.
 */
const StaticStripePaymentForm = forwardRef(function StaticStripePaymentForm({
  amount,
  disabled = false,
  onCardChange,
  initialCardNumber = STRIPE_TEST_SUCCESS,
}, ref) {
  const [cardNumber, setCardNumber] = useState(formatCardNumber(initialCardNumber));
  const [expiry, setExpiry] = useState('12 / 30');
  const [cvc, setCvc] = useState('123');
  const [nameOnCard, setNameOnCard] = useState('');
  const quote = useDonationQuote(amount);

  useImperativeHandle(ref, () => ({
    mode: 'mock',
    submit: async () => null,
    confirm: async () => ({}),
  }), []);

  useEffect(() => {
    onCardChange?.(digitsOnly(cardNumber) || STRIPE_TEST_SUCCESS);
  }, [cardNumber]); // eslint-disable-line react-hooks/exhaustive-deps -- notify parent on card edits only

  const brand = digitsOnly(cardNumber).startsWith('4') ? 'VISA' : 'CARD';

  return (
    <div className="static-stripe">
      <DonationQuote quote={quote} />

      <p className="static-stripe-label">Pay with card</p>
      <div className="support-card-fields static-stripe-fields">
        <div className="static-stripe-card-wrap">
          <input
            className="support-field"
            style={{ width: '100%' }}
            inputMode="numeric"
            autoComplete="cc-number"
            placeholder="Card number"
            value={cardNumber}
            disabled={disabled}
            onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
            aria-label="Card number"
          />
          <span className="static-stripe-brand" aria-hidden="true">{brand}</span>
        </div>
        <div className="support-card-row">
          <input
            className="support-field"
            inputMode="numeric"
            autoComplete="cc-exp"
            placeholder="MM / YY"
            value={expiry}
            disabled={disabled}
            onChange={(e) => setExpiry(e.target.value)}
            aria-label="Expiry"
          />
          <input
            className="support-field"
            inputMode="numeric"
            autoComplete="cc-csc"
            placeholder="CVC"
            value={cvc}
            disabled={disabled}
            maxLength={4}
            onChange={(e) => setCvc(digitsOnly(e.target.value).slice(0, 4))}
            aria-label="CVC"
          />
        </div>
        <input
          className="support-field"
          style={{ width: '100%' }}
          autoComplete="cc-name"
          placeholder="Name on card"
          value={nameOnCard}
          disabled={disabled}
          onChange={(e) => setNameOnCard(e.target.value)}
          aria-label="Name on card"
        />
      </div>

      <p className="static-stripe-hint">
        Development mode (no Stripe key configured): <code>4242…4242</code> succeeds · cards ending in{' '}
        <code>0002</code> decline. No real charges.
      </p>
    </div>
  );
});

export default StaticStripePaymentForm;
