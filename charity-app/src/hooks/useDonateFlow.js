import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { createDonation } from '../api/donations.js';
import { buildDonationSuccessUrl } from '../utils/donationReceipt.js';
import { STRIPE_TEST_SUCCESS } from '../utils/staticStripe.js';

export function useDonateFlow({ showToast, onNeedAuth } = {}) {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);

  const donate = async ({
    ev,
    amount,
    cardNumber,
    publicName,
    returnTo,
    donorName,
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
      const digits = String(cardNumber || '').replace(/\D/g, '') || STRIPE_TEST_SUCCESS;
      const donation = await createDonation({
        eventId: ev.id,
        amount: amt,
        publicName: publicName || user?.name || null,
        cardNumber: digits,
      });
      if (donation.status === 'Failed') {
        const msg = 'Payment declined (static Stripe). Use 4242…4242 to succeed, or a card ending in 0002 to test failure.';
        setError(msg);
        showToast?.(msg);
        return false;
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
      const msg = err.message || 'Donation failed';
      setError(msg);
      showToast?.(msg);
      return false;
    } finally {
      setPending(false);
    }
  };

  return { donate, pending, error };
}
