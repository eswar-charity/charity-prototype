// Where each account type belongs after signing in, and which sign-in card it matches.
// Routing follows the account's real role (from the API), never the card that was picked.
const HOME = {
  se: '/feed',
  np_admin: '/np/home',
  platform_admin: '/admin/dashboard',
  guest_lead: '/guest/feed',
};

const LABEL = {
  se: 'a Social Entrepreneur',
  np_admin: 'a nonprofit admin',
  platform_admin: 'a Charity Hub admin',
  guest_lead: 'a guest',
};

// Sign-in card id -> the account role it is meant for.
const CARD_ROLE = { se: 'se', np: 'np_admin', admin: 'platform_admin', guest: 'guest_lead' };

export function roleHome(role) {
  return HOME[role] || '/guest/feed';
}

/** Message shown when the account's role isn't the one the person picked; null when they match. */
export function roleMismatchNotice(selectedCardId, actualRole) {
  const expected = CARD_ROLE[selectedCardId];
  if (!expected || expected === actualRole) return null;
  return `You signed in as ${LABEL[actualRole] || 'a different account type'}, so we took you to the right place.`;
}

export function roleDeniedNotice(actualRole) {
  return `That area isn't available to ${LABEL[actualRole] || 'this account'}.`;
}
