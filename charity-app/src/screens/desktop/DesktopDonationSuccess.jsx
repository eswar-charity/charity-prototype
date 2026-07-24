import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import DesktopHeader from '../../components/desktop/DesktopHeader';
import DonationSuccessView from '../../components/DonationSuccessView';
import { getEvent } from '../../api/events.js';
import { getReceipt } from '../../api/donations.js';
import { adaptEvent } from '../../api/adapters/event.js';
import { adaptReceipt, calcDonationReceipt } from '../../utils/donationReceipt.js';

export default function DesktopDonationSuccess() {
  const [params] = useSearchParams();
  const amount = Number(params.get('amount')) || 25;
  const eventKey = params.get('event') || 'neon-night';
  const donationId = params.get('donationId');
  const returnTo = params.get('return') || '/guest/feed';
  const donorName = params.get('donor') || 'Donor';
  const publicName = params.get('public') || donorName;
  const isSe = returnTo.startsWith('/event');

  const [ev, setEv] = useState(null);
  const [receipt, setReceipt] = useState(() => calcDonationReceipt(amount));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await getEvent(eventKey);
        if (!cancelled) setEv(adaptEvent(raw));
      } catch {
        if (!cancelled) setEv(null);
      }
      if (donationId) {
        try {
          const r = await getReceipt(donationId);
          if (!cancelled) setReceipt(adaptReceipt(r));
        } catch { /* keep calc fallback */ }
      }
    })();
    return () => { cancelled = true; };
  }, [eventKey, donationId]);

  return (
    <div className="dsk-page">
      <DesktopHeader
        active="Discover"
        loggedIn={isSe}
        homePath={isSe ? '/feed' : '/guest/feed'}
        showSearch={false}
      />
      <main className="dsk-main">
        <div className="dsk-container dsk-donate-success-wrap">
          <DonationSuccessView
            amount={receipt?.donation ?? amount}
            tip={receipt?.tip}
            total={receipt?.total}
            donorName={donorName}
            publicName={receipt?.publicName || publicName}
            eventTitle={ev?.title || 'Event'}
            nonprofit={ev?.nonprofit || 'Nonprofit'}
            returnTo={returnTo}
          />
        </div>
      </main>
    </div>
  );
}
