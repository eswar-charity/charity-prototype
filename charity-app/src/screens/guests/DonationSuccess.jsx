import { useNavigate, useSearchParams } from 'react-router-dom';
import DonationSuccessView from '../../components/DonationSuccessView';
import useDonationReceipt from '../../hooks/useDonationReceipt';

function ReceiptProblem({ state, onBack }) {
  return (
    <div style={{ padding: 32, textAlign: 'center' }}>
      <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>
        {state === 'unsuccessful' ? 'This donation hasn’t completed' : 'We couldn’t find that donation'}
      </h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
        {state === 'unsuccessful'
          ? 'No payment was taken for it. You can try again from the event page.'
          : 'Receipts are private — sign in with the account you donated from.'}
      </p>
      <button type="button" className="btn-primary" onClick={onBack}>Back to events</button>
    </div>
  );
}

export default function DonationSuccess() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const eventKey = params.get('event');
  const donationId = params.get('donationId');
  const returnTo = params.get('return') || '/guest/feed';
  const donorName = params.get('donor') || 'Donor';
  const { state, receipt, ev } = useDonationReceipt(donationId, eventKey);

  return (
    <div className="phone-shell">
      <div className="screen donate-success-screen">
        {state === 'loading' && <p style={{ padding: 32, textAlign: 'center' }}>Loading your receipt…</p>}
        {(state === 'missing' || state === 'unsuccessful') && (
          <ReceiptProblem state={state} onBack={() => navigate(returnTo)} />
        )}
        {state === 'ready' && (
          <DonationSuccessView
            amount={receipt.donation}
            tip={receipt.tip}
            total={receipt.total}
            donorName={donorName}
            publicName={receipt.publicName || donorName}
            eventTitle={ev?.title || 'Event'}
            nonprofit={ev?.nonprofit || 'Nonprofit'}
            donationId={receipt.id}
            paymentRef={receipt.paymentRef}
            returnTo={returnTo}
          />
        )}
      </div>
    </div>
  );
}
