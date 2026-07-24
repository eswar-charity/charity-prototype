import { apiRequest } from './client.js';

export function quoteDonation(amount) {
  return apiRequest('/donations/quote', {
    method: 'POST',
    auth: false,
    body: { amount },
  });
}

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

export function getDonation(donationId) {
  return apiRequest(`/donations/${donationId}`, { auth: false });
}

export function getReceipt(donationId) {
  return apiRequest(`/donations/${donationId}/receipt`, { auth: false });
}
