import { useEffect, useState } from 'react';
import { quoteDonation } from '../api/donations.js';
import { calcDonationReceipt } from '../utils/donationReceipt.js';

/** Server-priced breakdown (donation + tip + processing fee) for an amount. */
export default function useDonationQuote(amount) {
  const amt = typeof amount === 'number' && amount > 0 ? amount : 25;
  const [quote, setQuote] = useState(() => calcDonationReceipt(amt));

  useEffect(() => {
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
        /* keep the local estimate; the server recomputes on charge */
      });
    return () => { cancelled = true; };
  }, [amt]);

  return quote;
}
