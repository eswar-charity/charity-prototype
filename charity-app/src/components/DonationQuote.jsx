function formatMoney(n) {
  return `$${Number(n || 0).toFixed(2)}`;
}

export default function DonationQuote({ quote }) {
  return (
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
  );
}
