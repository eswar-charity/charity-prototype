import { useSearchParams } from 'react-router-dom';
import DonationSuccessView from '../../components/DonationSuccessView';
import { getEventByKey } from '../../data/mockData';

export default function DonationSuccess() {
  const [params] = useSearchParams();
  const amount = Number(params.get('amount')) || 25;
  const event = getEventByKey(params.get('event') || 'neon-night');
  const returnTo = params.get('return') || '/guest/event/live';
  const donorName = params.get('donor') || 'Sarah King';
  const publicName = params.get('public') || 'Sarah K.';
  const receiptsPath = returnTo.startsWith('/event') ? '/profile' : '/guest/feed';

  return (
    <div className="phone-shell">
      <div className="screen donate-success-screen">
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
    </div>
  );
}
