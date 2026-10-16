import { apiRequest } from './client.js';

export function quoteDonation(amount) {
  return apiRequest('/donations/quote', {
    method: 'POST',
    auth: false,
    body: { amount },
  });
}

/**
 * Start a donation. With Stripe the response carries a `client_secret` and
 * status "Initiated" — the charge only completes after the browser confirms
 * the payment (and Stripe's webhook / confirmDonation record it).
 * `cardNumber` is used by the dev-only mock provider and ignored by Stripe.
 */
export function createDonation({ eventId, amount, publicName, cardNumber }) {
  return apiRequest('/donations', {
    method: 'POST',
    body: {
      event_id: eventId,
      amount,
      public_name: publicName ?? null,
      card_number: cardNumber ?? null,
    },
  });
}

/** Reconcile with Stripe after the browser confirms payment. */
export function confirmDonation(donationId) {
  return apiRequest(`/donations/${donationId}/confirm`, { method: 'POST' });
}

// Receipts are private to the donor (and the event's staff / platform admins).
export function getDonation(donationId) {
  return apiRequest(`/donations/${donationId}`);
}

export function getReceipt(donationId) {
  return apiRequest(`/donations/${donationId}/receipt`);
}
