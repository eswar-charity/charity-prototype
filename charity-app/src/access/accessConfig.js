// Prototype access control — a lightweight deterrent for a link that gets
// forwarded outside the founders' trusted circle, NOT enterprise security.
// Anyone who reads the deployed JS bundle can find these values; the goal is
// to discourage casual/permanent forwarding, not to stop a determined leak.
//
// To add a reviewer: add a { code, label } entry below and redeploy.
// To revoke a reviewer: delete (or comment out) their entry and redeploy —
// anyone who unlocked with that code is locked out again on their next visit.
export const ACCESS_CODES = [
  { code: 'CHARITYHUB-PREVIEW', label: 'General preview link' },
];

// The shared passphrase rotates automatically every ROTATION_DAYS days, so
// nobody has to remember to change it by hand. Share today's word; move the
// rotation forward (or shorten ROTATION_DAYS) whenever you want a clean break
// from anyone who currently has it.
const ROTATION_DAYS = 1;
const WORDS_A = ['amber', 'coral', 'harbor', 'lantern', 'meadow', 'summit', 'willow', 'ember'];
const WORDS_B = ['anchor', 'beacon', 'canyon', 'drift', 'ferry', 'grove', 'ridge', 'tide'];

function dayIndex(date) {
  const startOfYear = Date.UTC(date.getUTCFullYear(), 0, 1);
  const startOfDay = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  return Math.floor((startOfDay - startOfYear) / 86400000);
}

/** Deterministic passphrase for a given date — same formula everywhere, no server round-trip needed. */
export function getRotatingPassword(date = new Date()) {
  const period = Math.floor(dayIndex(date) / ROTATION_DAYS);
  const a = WORDS_A[period % WORDS_A.length];
  const b = WORDS_B[Math.floor(period / WORDS_A.length) % WORDS_B.length];
  return `${a}-${b}`;
}

// A longer-lived key, separate from the rotating passphrase and the reviewer
// codes, so the team can always get back in and see today's/tomorrow's
// passphrase from the gate itself without reading source.
export const FOUNDER_KEY = 'CHARITYHUB-FOUNDER';
