// Prototype access control — a lightweight deterrent for a link that gets
// forwarded outside the founders' trusted circle, NOT enterprise security.
// Anyone who reads the deployed JS bundle can find these values; the goal is
// to discourage casual/permanent forwarding, not to stop a determined leak.
//
// To add a standing reviewer code: add a { code, label } entry below and
// redeploy. To revoke one: delete (or comment out) its entry and redeploy —
// anyone who unlocked with that code is locked out again on their next visit.
export const ACCESS_CODES = [
  { code: 'CHARITYHUB-PREVIEW', label: 'General preview link' },
];

// A longer-lived key for the founders themselves — unlocks the app and also
// reveals the "Generate an access password" panel (see AccessGate.jsx) used
// to hand investors a password that expires on its own.
export const FOUNDER_KEY = 'CHARITYHUB-FOUNDER';

const TOKEN_WORDS = [
  'amber', 'coral', 'harbor', 'lantern', 'meadow', 'summit', 'willow', 'ember',
  'anchor', 'beacon', 'canyon', 'drift', 'ferry', 'grove', 'ridge', 'tide',
];

// Not a real cryptographic secret — it ships in the JS bundle like everything
// else on this page. It only stops someone from hand-editing the expiry
// inside a password they were legitimately given; it can't stop someone
// reading the source from minting their own.
const TOKEN_SALT = 'chub-2026-preview';

function checksum(input) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (Math.imul(31, hash) + input.charCodeAt(i)) | 0;
  }
  return (hash >>> 0).toString(36).slice(0, 4).padStart(4, '0');
}

/**
 * Generates a password that carries its own expiry, encoded and checksummed
 * into the string itself — so any browser can validate it on its own, which
 * is the only way "this expires in 24/48 hours" works with no backend to
 * keep a shared list of what's currently valid.
 */
export function generateAccessPassword(hours) {
  const expiresAt = Date.now() + hours * 60 * 60 * 1000;
  const stamp = Math.round(expiresAt / 60000).toString(36); // minute resolution
  const word = TOKEN_WORDS[Math.floor(Math.random() * TOKEN_WORDS.length)];
  const password = `${word}-${stamp}-${checksum(`${TOKEN_SALT}:${stamp}`)}`;
  return { password, expiresAt };
}

/** Returns { expiresAt } for a well-formed generated password, or null if it's not one. */
export function decodeGeneratedPassword(rawPassword) {
  const parts = String(rawPassword || '').trim().toLowerCase().split('-');
  if (parts.length !== 3) return null;
  const [, stamp, sum] = parts;
  if (!stamp || checksum(`${TOKEN_SALT}:${stamp}`) !== sum) return null;
  const minutes = parseInt(stamp, 36);
  if (!Number.isFinite(minutes)) return null;
  return { expiresAt: minutes * 60000 };
}
