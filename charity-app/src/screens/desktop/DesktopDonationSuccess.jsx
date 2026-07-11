import { useSearchParams } from 'react-router-dom';
import DesktopHeader from '../../components/desktop/DesktopHeader';
import DonationSuccessView from '../../components/DonationSuccessView';
import { getEventByKey } from '../../data/mockData';

export default function DesktopDonationSuccess() {
  const [params] = useSearchParams();
  const amount = Number(params.get('amount')) || 25;
  const event = getEventByKey(params.get('event') || 'neon-night');
  const returnTo = params.get('return') || '/guest/event/live';
  const donorName = params.get('donor') || 'Sarah King';
  const publicName = params.get('public') || 'Sarah K.';
  const isSe = returnTo.startsWith('/event');
  const receiptsPath = isSe ? '/profile' : '/guest/feed';

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
            amount={amount}
            donorName={donorName}
            publicName={publicName}
            eventTitle={event.title}
            nonprofit={event.nonprofit}
            returnTo={returnTo}
            receiptsPath={receiptsPath}
          />
        </div>
      </main>
    </div>
  );
}
