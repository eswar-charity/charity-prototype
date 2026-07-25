const RETURN_KEY = 'ch_guest_return_to';
const INTENT_KEY = 'ch_guest_gate_intent';

const INTENT_COPY = {
  join: {
    headline: 'Join this event',
    body: 'Create a free account to join, get updates, and be part of the story.',
  },
  donate: {
    headline: 'Back this cause',
    body: 'Sign in to contribute. Every backing helps the nonprofit do more.',
  },
  save: {
    headline: 'Save this event',
    body: 'Create an account to save events and find them later.',
  },
  follow: {
    headline: 'Follow to stay close',
    body: 'Sign in to follow this organizer or nonprofit and see their next events.',
  },
  chat: {
    headline: 'Join the conversation',
    body: 'Create an account to chat live with people backing this cause.',
  },
  like: {
    headline: 'Show your support',
    body: 'Sign in to like events and cheer the community on.',
  },
  saved: {
    headline: 'Your saved events',
    body: 'Create an account to save events and come back to them anytime.',
  },
  default: {
    headline: 'Join the movement',
    body: 'Create your account to back this event and be part of the story.',
  },
};

export function getIdentityGateCopy(intent = 'default') {
  return INTENT_COPY[intent] || INTENT_COPY.default;
}

export function stashGuestReturn({ returnTo, intent } = {}) {
  try {
    if (returnTo) sessionStorage.setItem(RETURN_KEY, returnTo);
    if (intent) sessionStorage.setItem(INTENT_KEY, intent);
  } catch {
    /* ignore quota / private mode */
  }
}

export function peekGuestReturn() {
  try {
    return {
      returnTo: sessionStorage.getItem(RETURN_KEY) || null,
      intent: sessionStorage.getItem(INTENT_KEY) || null,
    };
  } catch {
    return { returnTo: null, intent: null };
  }
}

export function consumeGuestReturn() {
  const peeked = peekGuestReturn();
  try {
    sessionStorage.removeItem(RETURN_KEY);
    sessionStorage.removeItem(INTENT_KEY);
  } catch {
    /* ignore */
  }
  return peeked;
}
