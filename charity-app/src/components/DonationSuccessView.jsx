import { useNavigate } from 'react-router-dom';
import { Check, Mail, Clock } from 'lucide-react';
import { calcDonationReceipt } from '../data/mockData';

function formatMoney(value) {
  return `$${value.toFixed(2)}`;
}

export default function DonationSuccessView({
  donorName = 'Sarah King',
  publicName = 'Sarah K.',
  eventTitle = 'Neon Night Run',
  nonprofit = 'Youth Health Fund',
  amount = 25,
  returnTo = '/guest/event/live',
  receiptsPath = '/guest/feed',
}) {
  const navigate = useNavigate();
  const { donation, tip, total } = calcDonationReceipt(amount);

  return (
    <div className="donate-success">
      <div className="donate-success-hero">
        <div className="donate-success-confetti" aria-hidden="true">
          <span className="donate-confetti-piece" />
          <span className="donate-confetti-piece" />
          <span className="donate-confetti-piece" />
          <span className="donate-confetti-piece" />
        </div>
        <div className="donate-success-check" aria-hidden="true">
          <Check size={28} color="white" strokeWidth={3} />
        </div>
        <h1 className="donate-success-title">Thank you, {donorName}!</h1>
        <p className="donate-success-lead">
          Your <strong>{formatMoney(total)}</strong> is on its way to{' '}
          <strong>{nonprofit}</strong> for <strong>{eventTitle}</strong>.
        </p>
      </div>

      <div className="donate-success-receipt">
        <div className="donate-receipt-row">
          <span>Donation</span>
          <span>{formatMoney(donation)}</span>
        </div>
        <div className="donate-receipt-row">
          <span>Tip to Charity Hub</span>
          <span>{formatMoney(tip)}</span>
        </div>
        <div className="donate-receipt-divider" />
        <div className="donate-receipt-row donate-receipt-total">
          <span>Total charged</span>
          <span>{formatMoney(total)}</span>
        </div>
        <div className="donate-receipt-row donate-receipt-public">
          <span>Shown publicly as</span>
          <span>{publicName}</span>
        </div>
      </div>

      <div className="donate-success-email">
        <Mail size={16} color="var(--primary)" aria-hidden="true" />
        <p>A confirmation email with your receipt is already on its way.</p>
      </div>

      <p className="donate-success-pending">
        <Clock size={14} aria-hidden="true" />
        The event&apos;s raised total updates once funds settle — your gift shows as pending until then.
      </p>

      <button type="button" className="btn-primary donate-success-cta" onClick={() => navigate(receiptsPath)}>
        VIEW MY RECEIPTS
      </button>
      <button type="button" className="btn-outline donate-success-back" onClick={() => navigate(returnTo)}>
        Back to event
      </button>
    </div>
  );
}
