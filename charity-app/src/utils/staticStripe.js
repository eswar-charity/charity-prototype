/** Demo cards for static/mock Stripe (backend mock_stripe). */
export const STRIPE_TEST_SUCCESS = '4242424242424242';
export const STRIPE_TEST_FAIL = '4000000000000002';

export function digitsOnly(value) {
  return String(value || '').replace(/\D/g, '');
}

export function formatCardNumber(value) {
  const d = digitsOnly(value).slice(0, 16);
  return d.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
}
