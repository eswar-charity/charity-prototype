import { useEffect, useState } from 'react';
import { quoteDonation } from '../api/donations.js';
import { calcDonationReceipt } from '../utils/donationReceipt.js';
import {
  STRIPE_TEST_SUCCESS,
  digitsOnly,
  formatCardNumber,
} from '../utils/staticStripe.js';

export { STRIPE_TEST_SUCCESS, STRIPE_TEST_FAIL } from '../utils/staticStripe.js';

function formatMoney(n) {
  return `$${Number(n || 0).toFixed(2)}`;
}

/**
 * Static Stripe-style payment fields for mock donations.
 * No real Stripe.js — card_number is sent to POST /donations (mock_stripe).
 */
export default function StaticStripePaymentForm({
  amount,
  disabled = false,
  onCardChange,
  initialCardNumber = STRIPE_TEST_SUCCESS,
}) {
  const [cardNumber, setCardNumber] = useState(formatCardNumber(initialCardNumber));
  const [expiry, setExpiry] = useState('12 / 30');
  const [cvc, setCvc] = useState('123');
  const [nameOnCard, setNameOnCard] = useState('');
  const [quote, setQuote] = useState(() => calcDonationReceipt(
    typeof amount === 'number' && amount > 0 ? amount : 25,
  ));

  useEffect(() => {
    onCardChange?.(digitsOnly(cardNumber) || STRIPE_TEST_SUCCESS);
  }, [cardNumber]); // eslint-disable-line react-hooks/exhaustive-deps -- notify parent on card edits only

  useEffect(() => {
    const amt = typeof amount === 'number' && amount > 0 ? amount : 25;
    let cancelled = false;
    setQuote(calcDonationReceipt(amt));
    quoteDonation(amt)
      .then((data) => {
        if (cancelled || !data) return;
        setQuote({
          donation: data.donation,
          tip: data.tip,
          processingFee: data.processing_fee ?? data.processingFee,
          total: data.total,
        });
      })
      .catch(() => {
        /* keep local calc */
      });
    return () => { cancelled = true; };
  }, [amount]);

  const brand = digitsOnly(cardNumber).startsWith('4') ? 'VISA' : 'CARD';

  return (
    <div className="static-stripe">
      <div className="static-stripe-quote" aria-live="polite">
        <div className="static-stripe-quote-row">
          <span>Donation</span>
          <span>{formatMoney(quote.donation)}</span>
        </div>
        <div className="static-stripe-quote-row">
          <span>Tip to Charity Hub</span>
          <span>{formatMoney(quote.tip)}</span>
        </div>
        <div className="static-stripe-quote-row">
          <span>Processing fee</span>
          <span>{formatMoney(quote.processingFee)}</span>
        </div>
        <div className="static-stripe-quote-row static-stripe-quote-total">
          <span>Total charge</span>
          <span>{formatMoney(quote.total)}</span>
        </div>
      </div>

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
        Demo (static Stripe): <code>4242…4242</code> succeeds · cards ending in <code>0002</code> decline.
        No real charges.
      </p>
      <p className="static-stripe-powered">Powered by Stripe · test mode</p>
    </div>
  );
}
