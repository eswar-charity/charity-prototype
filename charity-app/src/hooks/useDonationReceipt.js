import { useEffect, useState } from 'react';
import { getEvent } from '../api/events.js';
import { getReceipt } from '../api/donations.js';
import { adaptEvent } from '../api/adapters/event.js';
import { adaptReceipt } from '../utils/donationReceipt.js';

/**
 * Loads the donor's real receipt (and its event). The success screens render
 * only from this: a donation that doesn't exist, isn't the viewer's, or hasn't
 * succeeded never produces a "thank you" page.
 *
 * state: 'loading' | 'ready' | 'missing' | 'unsuccessful'
 */
export default function useDonationReceipt(donationId, eventKey) {
  const [state, setState] = useState(donationId ? 'loading' : 'missing');
  const [receipt, setReceipt] = useState(null);
  const [ev, setEv] = useState(null);

  useEffect(() => {
    if (!donationId) {
      setState('missing');
      return undefined;
    }
    let cancelled = false;
    setState('loading');
    (async () => {
      try {
        const r = adaptReceipt(await getReceipt(donationId));
        if (cancelled) return;
        setReceipt(r);
        if (eventKey) {
          try {
            const raw = await getEvent(eventKey);
            if (!cancelled) setEv(adaptEvent(raw));
          } catch {
            /* the receipt is still valid without the event card */
          }
        }
        if (!cancelled) setState(r.status === 'Successful' ? 'ready' : 'unsuccessful');
      } catch {
        if (!cancelled) setState('missing');
      }
    })();
    return () => { cancelled = true; };
  }, [donationId, eventKey]);

  return { state, receipt, ev };
}
