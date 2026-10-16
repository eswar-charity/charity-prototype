import { apiRequest } from './client.js';

let configPromise = null;

/**
 * Which payment provider the API is running ("stripe" or the dev-only "mock")
 * and the Stripe publishable key. Fetched once per page load.
 */
export function getPaymentsConfig() {
  if (!configPromise) {
    configPromise = apiRequest('/payments/config', { auth: false }).catch((err) => {
      configPromise = null; // let a later attempt retry
      throw err;
    });
  }
  return configPromise;
}

/** Nonprofit admin: current Stripe Connect readiness for their organization. */
export function getStripeStatus() {
  return apiRequest('/np/stripe/status');
}

/** Nonprofit admin: hosted Stripe onboarding link ({ url }). */
export function startStripeOnboarding() {
  return apiRequest('/np/stripe/onboarding', { method: 'POST' });
}
