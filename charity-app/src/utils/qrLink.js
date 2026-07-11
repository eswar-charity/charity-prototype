// Fixed to the deployed demo domain so QR codes always resolve on a phone,
// regardless of what's running locally (localhost/LAN IP aren't reachable
// off-network, but this Vercel deployment always is).
const DEMO_ORIGIN = 'https://charity-prototype.vercel.app';

export function buildAppUrl(path) {
  return `${DEMO_ORIGIN}${path}`;
}
