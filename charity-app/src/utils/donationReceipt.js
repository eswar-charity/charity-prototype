export function calcDonationReceipt(amount) {
  const donation = typeof amount === 'number' && amount > 0 ? amount : 25;
  const tip = donation >= 25 ? 3 : Math.max(1, Math.round(donation * 0.12 * 100) / 100);
  const subtotal = donation + tip;
  const processingFee = Math.round(subtotal * 0.03964 * 100) / 100;
  const total = Math.round((subtotal + processingFee) * 100) / 100;
  return { donation, tip, processingFee, total };
}

export function buildDonationSuccessUrl({
  amount = 25,
  eventKey = 'neon-night',
  returnTo = `/guest/event/live/${eventKey}`,
  donorName = 'Sarah King',
  publicName = 'Sarah K.',
  donationId,
} = {}) {
  const params = new URLSearchParams({
    amount: String(amount),
    event: eventKey,
    return: returnTo,
    donor: donorName,
    public: publicName,
  });
  if (donationId != null) params.set('donationId', String(donationId));
  return `/donate/success?${params.toString()}`;
}

/** Map API ReceiptResponse / DonationRead money fields → UI camelCase. */
export function adaptReceipt(api) {
  if (!api) return null;
  return {
    donation: api.donation,
    tip: api.tip,
    processingFee: api.processing_fee ?? api.processingFee,
    total: api.total,
    status: api.status,
    publicName: api.public_name ?? api.publicName,
    id: api.id,
    paymentRef: api.payment_ref ?? api.paymentRef,
  };
}
