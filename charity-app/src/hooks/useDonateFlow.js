import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { createDonation, confirmDonation } from '../api/donations.js';
import { buildDonationSuccessUrl } from '../utils/donationReceipt.js';
import { STRIPE_TEST_SUCCESS } from '../utils/staticStripe.js';

/**
 * Donate flow for both providers.
 *   stripe: validate Elements → create donation (PaymentIntent) → confirm card
 *           → reconcile with the API → success page.
 *   mock (dev only): create donation with the typed test card → success page.
 * `payment` is the ref handle exposed by <PaymentForm>.
 */
export function useDonateFlow({ showToast, onNeedAuth } = {}) {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);

  const fail = (msg) => {
    setError(msg);
    showToast?.(msg);
    return false;
  };

  const donate = async ({
    ev,
    amount,
    cardNumber,
    publicName,
    returnTo,
    donorName,
    payment,
  }) => {
    const amt = typeof amount === 'number' && amount > 0 ? amount : 25;
    if (!isAuthenticated) {
      onNeedAuth?.({ amount: amt, intent: 'donate' });
      return false;
    }
    if (!ev?.id) {
      showToast?.('Event not loaded');
      return false;
    }
    setPending(true);
    setError(null);
    try {
      const useStripe = payment?.mode === 'stripe';
      if (useStripe) {
        const problem = await payment.submit();
        if (problem) return fail(problem);
      }

      let donation = await createDonation({
        eventId: ev.id,
        amount: amt,
        publicName: publicName || user?.name || null,
        cardNumber: useStripe ? null : String(cardNumber || '').replace(/\D/g, '') || STRIPE_TEST_SUCCESS,
      });

      if (useStripe) {
        const result = await payment.confirm(donation.client_secret, window.location.href);
        if (result?.error) return fail(result.error.message || 'Payment was declined');
        donation = await confirmDonation(donation.id);
      }

      if (donation.status === 'Failed') {
        return fail(
          useStripe
            ? 'Payment failed. Please try another card.'
            : 'Payment declined (dev mock). Use 4242…4242 to succeed, or a card ending in 0002 to test failure.',
        );
      }
      if (donation.status !== 'Successful') {
        // e.g. the card is still processing: don't show a success page yet.
        return fail('Your payment is still processing. We’ll email a receipt once it clears.');
      }

      const name = donorName || user?.name || 'Donor';
      navigate(
        buildDonationSuccessUrl({
          amount: amt,
          eventKey: ev.key,
          returnTo: returnTo || `/guest/event/live/${ev.key}`,
          donorName: name,
          publicName: donation.public_name || publicName || name,
          donationId: donation.id,
        }),
      );
      return true;
    } catch (err) {
      return fail(err.message || 'Donation failed');
    } finally {
      setPending(false);
    }
  };

  return { donate, pending, error };
}
