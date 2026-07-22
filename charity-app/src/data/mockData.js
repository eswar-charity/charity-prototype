import { BROWSE_CATEGORIES } from './categoryIcons';
import {
  buildEvents,
  buildNonprofits,
  eventDisplayTitle,
  getCommunityPhotos,
} from './eventData';

export { eventDisplayTitle, EVENT_CATALOG, getEventBanner, getEventBannerFocus, getCommunityPhotos } from './eventData';

export const SE_ORGANIZER = {
  name: 'Mike Rivera',
  initials: 'MR',
  color: '#C62828',
};

export const events = buildEvents(SE_ORGANIZER);

export const nonprofits = buildNonprofits(events);

export function getNonprofitProfile(slug) {
  const org = nonprofits.find((n) => slugify(n.name) === slug);
  if (!org) return null;

  const orgEvents = events.filter((e) => e.nonprofit === org.name);
  return {
    ...org,
    slug,
    events: orgEvents,
    stats: {
      eventsHosted: orgEvents.length,
      totalRaised: orgEvents.reduce((sum, e) => sum + e.raised, 0),
      totalBacked: orgEvents.reduce((sum, e) => sum + e.backed, 0),
    },
  };
}

// Event creator — the voice behind most of the community thread's timeline.
export const EVENT_CREATOR = SE_ORGANIZER;

export const liveActivities = [
  {
    id: 1,
    type: 'join',
    user: 'Priya M.',
    initials: 'PM',
    color: '#7C3AED',
    text: 'Priya M. just joined',
    time: '12 min ago',
  },
  {
    id: 2,
    type: 'update',
    user: 'James L.',
    initials: 'JL',
    color: '#F5604A',
    text: 'The energy here is incredible — thanks for backing this cause!',
    time: '18 min ago',
    hasImage: true,
    image: events[0]?.photos[2] || events[0]?.cover,
  },
  {
    id: 3,
    type: 'update',
    user: 'Emma T.',
    initials: 'ET',
    color: '#0D7377',
    text: 'Love being part of this — cheering everyone on!',
    time: '24 min ago',
  },
  {
    id: 4,
    type: 'org',
    user: events[0]?.nonprofit || 'Nonprofit',
    initials: events[0]?.npInitials || 'NP',
    color: '#D32F2F',
    text: `Thank you for supporting ${events[0]?.nonprofit || 'this cause'}!`,
    time: '32 min ago',
    isVerified: true,
  },
];

const THREAD_REPLIERS = [
  { name: 'Sofia R.', initials: 'SR', color: '#7C3AED' },
  { name: 'Derek W.', initials: 'DW', color: '#0D7377' },
  { name: 'Aisha K.', initials: 'AK', color: '#F5604A' },
  { name: 'Tom H.', initials: 'TH', color: '#1976D2' },
  { name: 'Nina P.', initials: 'NP', color: '#C62828' },
];

const THREAD_REPLY_LINES = [
  'This made my day.',
  'So glad to see this happening.',
  'Love the energy here.',
  'Thank you for sharing this.',
  'Counting down until I can donate too.',
];

function buildThreadReplies(post, event, seed) {
  const photos = getCommunityPhotos(event);
  const count = post.mediaSize === 'post' ? 2 : post.highlight ? 3 : post.media ? 2 : 1;

  return Array.from({ length: count }, (_, i) => {
    const n = seed + i;
    const replier = THREAD_REPLIERS[n % THREAD_REPLIERS.length];
    const withImage = photos.length > 0 && n % 3 === 2;
    return {
      id: `${post.id}-reply-${i}`,
      name: replier.name,
      initials: replier.initials,
      avatarBg: replier.color,
      time: `${(i + 1) * 3}m ago`,
      text: THREAD_REPLY_LINES[n % THREAD_REPLY_LINES.length],
      media: withImage ? photos[n % photos.length] : null,
      mediaAlt: withImage ? `Photo shared by ${replier.name}` : null,
    };
  });
}

const HOUR = 60 * 60 * 1000;

/**
 * Every post the event creator (and a couple of community voices) makes
 * across the full lifecycle of an event — announcement through recap.
 * `h` is hours relative to the event's start time (negative = before,
 * beyond the start–end window = after). `image: true` claims the next
 * unused photo from that event's community-photo pool, in order, so the
 * whole pool gets used exactly once with nothing left over.
 */
const EVENT_TIMELINES = {
  'neon-night': [
    { h: -18 * 24, phase: 'before', text: "It's official — #NeonNight is happening. Grab your leg warmers, we're throwing back to the 80s for Hoboken Homeless Home. Mark your calendars.", image: true },
    { h: -12 * 24, phase: 'before', text: 'Registration is open! Every ticket goes straight to warm beds and hot meals this winter. Link in bio — let’s pack the park.' },
    { h: -6 * 24, phase: 'before', text: 'Huge thanks to the volunteer crew who spent their Saturday stringing lights and testing the sound system. Prospect Park is going to glow.', image: true },
    { h: -2 * 24, phase: 'before', text: 'Two days until #NeonNight! The synth playlist is locked, the disco ball is hung, and we’ve already got 200+ backers. Let’s make some noise for Hoboken Homeless Home.' },
    { h: 0, phase: 'during', text: 'WE ARE LIVE. Doors are open and Prospect Park already looks like 1985 threw up glitter everywhere. Let’s go!', image: true },
    { h: 0.9, phase: 'during', text: 'Just donated $75 — this room’s energy is unmatched tonight!', author: { name: 'Priya M.', initials: 'PM', color: '#7C3AED' }, highlight: 'Just donated $75' },
    { h: 1.2, phase: 'during', text: 'The dance floor filled up faster than I expected. This crowd showed UP for Hoboken Homeless Home tonight.', image: true },
    { h: 1.5, phase: 'during', text: 'Thank you Hoboken for showing up in your finest neon. Every dollar tonight keeps our shelter beds full this winter.', author: 'nonprofit', verified: true },
    { h: 1.8, phase: 'during', text: 'Halfway there and we just crossed $10,000 raised. That’s warm beds for the whole winter. Keep it coming.', image: true },
    { h: 2.2, phase: 'during', text: 'Costume contest was a DISASTER in the best way. Whoever came as Molly Ringwald, please collect your prize.', image: true },
    { h: 2.7, phase: 'during', text: 'Last call for donations before the final song — let’s see if we can hit $14K before the lights come up.', image: true },
    { h: 2.95, phase: 'during', text: 'Final numbers going up on the board now. This room raised more than I hoped for in my wildest 80s dreams.', image: true },
    { h: 5, phase: 'after', text: 'That’s a wrap on #NeonNight. Prospect Park, you partied for the people and it showed. Thank you doesn’t cover it.' },
    { h: 24, phase: 'after', text: 'Final tally: $14,280 raised and 213 backers strong. Every dollar goes to Hoboken Homeless Home’s winter shelter program. You all are the real MVPs.', image: true },
    { h: 3 * 24, phase: 'after', text: 'One more look back at the best decade-themed night Brooklyn’s seen in years. Already thinking about round two.', image: true },
  ],
  'give-now': [
    { h: -15 * 24, phase: 'before', text: 'Snow’s already falling on Windham and so is the countdown to #GiveNowApre’Later. Boards up, hearts open — let’s ride for Windham Mountain Conservatory.', image: true },
    { h: -8 * 24, phase: 'before', text: 'Lift tickets + your generosity = one epic après for conservation. Registration’s live, link in bio.' },
    { h: -3 * 24, phase: 'before', text: 'Mountain crew just finished prepping the terrain park for Saturday. Windham Mountain Conservatory, we’re bringing the whole hill out for you.', image: true },
    { h: 0, phase: 'during', text: 'Boards strapped in — #GiveNowApre’Later is officially live on the mountain!', image: true },
    { h: 0.5, phase: 'during', text: 'First run of the day and the energy on this hill is unreal.', image: true },
    { h: 1, phase: 'during', text: 'Just donated $60 — first run of the season and already raising for the mountain I love.', author: { name: 'James L.', initials: 'JL', color: '#F5604A' }, highlight: 'Just donated $60' },
    { h: 1.2, phase: 'during', text: 'Après tent is packed and the hot cocoa is flowing. Keep the donations coming for Windham Mountain Conservatory.', image: true },
    { h: 1.9, phase: 'during', text: 'We just watched someone attempt a backflip for charity. Bold. Respected.', image: true },
    { h: 2.4, phase: 'during', text: '$5K raised and counting — this mountain shows up every single year.', image: true },
    { h: 2.8, phase: 'during', text: 'Every donation today funds trail and habitat restoration on this mountain. Thank you for riding for us.', author: 'nonprofit', verified: true },
    { h: 3.2, phase: 'during', text: 'Sunset run incoming. Just wanted to say — this community is unreal.', image: true },
    { h: 3.7, phase: 'during', text: 'Final lift of the day and the leaderboard for top fundraisers is locked in.', image: true },
    { h: 6, phase: 'after', text: 'That’s a wrap on #GiveNowApre’Later — sore legs, full hearts. Thank you Windham Mountain.', image: true },
    { h: 24, phase: 'after', text: '$5,400 raised for Windham Mountain Conservatory. Every dollar protects the trails we shredded yesterday.', image: true },
  ],
  'golf-outing': [
    { h: -14 * 24, phase: 'before', text: 'Tee times are set — #CharityHubGolfOuting is on for Westchester. Bring your good times to the course, may the best shooter win, and let’s fund some sight-restoring surgeries.', image: true },
    { h: -4 * 24, phase: 'before', text: 'Course crew mowed every fairway twice this week. Center For Sight Restoration, we’re ready for you.', image: true },
    { h: 0, phase: 'during', text: 'First tee-off of the day! #CharityHubGolfOuting is live in Westchester.', image: true },
    { h: 2.5, phase: 'during', text: 'Just donated $100 — my dad had his sight restored by this team, so this one’s personal.', author: { name: 'Emma T.', initials: 'ET', color: '#0D7377' }, highlight: 'Just donated $100' },
    { h: 3, phase: 'during', text: 'Turn at the 9th and the leaderboard is already chaos. Love to see it.', image: true },
    { h: 4.5, phase: 'during', text: 'Every swing today is funding a sight-restoring surgery for someone who needs it. Thank you, golfers.', author: 'nonprofit', verified: true },
    { h: 5, phase: 'during', text: 'Closest-to-the-pin contest just raised another $800 for Center For Sight Restoration on its own.', image: true },
    { h: 10, phase: 'after', text: 'Clubs are packed up and #CharityHubGolfOuting raised $6,800 for Center For Sight Restoration. Not bad for a Saturday.', image: true },
    { h: 3 * 24, phase: 'after', text: 'Last look back at a beautiful day on the course — thank you to every golfer who showed up and swung for a good cause.', image: true },
  ],
  'dog-dad': [
    { h: -10 * 24, phase: 'before', text: 'Calling all Dog Dads — #DogDads is coming to Central Park and it’s time to give some street cred to the good boys who stepped up. Registration open now.', image: true },
    { h: -3 * 24, phase: 'before', text: 'Bergen County Rescue Shelter just sent over the list of pups still looking for their person. Bring your dog, bring your wallet, bring your heart.', image: true },
    { h: 0, phase: 'during', text: 'Central Park is FULL of dogs and their proud dads. #DogDads is live!', image: true },
    { h: 0.7, phase: 'during', text: 'Best dressed dog contest happening right now and I am not okay with how good these costumes are.', image: true },
    { h: 1, phase: 'during', text: 'Just donated $50 in honor of my rescue pup Biscuit. Adopt, don’t shop.', author: { name: 'Tom H.', initials: 'TH', color: '#1976D2' }, highlight: 'Just donated $50' },
    { h: 1.3, phase: 'during', text: 'Every Dog Dad here today is the reason we can keep rescuing. Thank you for showing up.', author: 'nonprofit', verified: true },
    { h: 1.7, phase: 'during', text: 'We just passed $3,000 raised for Bergen County Rescue Shelter. These dogs did that.', image: true },
    { h: 2.7, phase: 'during', text: 'Last lap around the park before we wrap — thank you to every dad who showed up today.', image: true },
    { h: 5, phase: 'after', text: 'That’s a wrap on #DogDads. $3,200 raised and (unofficially) 40 new best friends made.', image: true },
    { h: 2 * 24, phase: 'after', text: 'Bergen County Rescue Shelter just told us three dogs from today got adopted this week. That’s the whole point right there.', image: true },
  ],
  'breakneck-ridge-run': [
    { h: -16 * 24, phase: 'before', text: 'Registration for #BreakneckRidgeRun is open. Don’t give up and don’t break your neck — let’s raise some serious trail-maintenance money for Hudson Valley Trail Society.', image: true },
    { h: -7 * 24, phase: 'before', text: 'Trail crew just cleared the last stretch near the summit. Breakneck Ridge is ready for all of you.', image: true },
    { h: -1 * 24, phase: 'before', text: 'Tomorrow’s the day. Pack your water, tape your ankles, and get ready to climb for Hudson Valley Trail Society.', image: true },
    { h: 0, phase: 'during', text: 'Runners are off! #BreakneckRidgeRun is officially underway.', image: true },
    { h: 1, phase: 'during', text: 'First finishers cresting the summit and the views (and donations) are incredible today.', image: true },
    { h: 1.5, phase: 'during', text: 'Just donated $60 — these trails saved my sanity this year, happy to give back.', author: { name: 'Nina P.', initials: 'NP', color: '#C62828' }, highlight: 'Just donated $60' },
    { h: 2.5, phase: 'during', text: 'We just crossed $8,000 raised — every mile today is funding trail repairs for next season.', image: true },
    { h: 2.85, phase: 'during', text: 'Every runner today is funding real trail repairs for next season. Thank you for climbing for us.', author: 'nonprofit', verified: true },
    { h: 5.5, phase: 'during', text: 'Last runners coming down the ridge. What a day for Hudson Valley Trail Society.', image: true },
    { h: 8, phase: 'after', text: 'That’s a wrap on #BreakneckRidgeRun — $8,920 raised and a whole lot of sore quads. Thank you.', image: true },
    { h: 3 * 24, phase: 'after', text: 'Final gallery from the ridge is up. This trail, and this community, never disappoints.', image: true },
  ],
};

function parseEventStart(event) {
  return new Date(`${event.date} ${event.startTime}`);
}

/** Same-day posts show just a time; anything on a different day shows its date too. */
function formatThreadTimestamp(date, eventStart) {
  const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  if (date.toDateString() === eventStart.toDateString()) return time;
  const day = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${day} · ${time}`;
}

/**
 * Community tab thread: the event creator's full before/during/after
 * lifecycle — announcement through recap — plus a couple of community
 * voices. Every photo in the event's gallery is used exactly once, and
 * each post carries a small set of replies so it can be opened
 * Reddit/Stack-Overflow style to reveal its child conversation.
 */
export function buildCommunityThread(event = events[0]) {
  const timeline = EVENT_TIMELINES[event?.key] || [];
  const pool = getCommunityPhotos(event).slice();
  const eventStart = parseEventStart(event);

  const specs = timeline.map((spec) => ({ ...spec, at: eventStart.getTime() + spec.h * HOUR }));

  // Safety net: if a timeline under-claims images, or an event has more
  // photos than the hand-authored timeline expects, nothing gets dropped —
  // any leftover photos become extra during-phase moments.
  const claimed = specs.filter((s) => s.image).length;
  if (pool.length > claimed) {
    const lastDuring = specs.filter((s) => s.phase === 'during').at(-1);
    const anchor = lastDuring ? lastDuring.at : eventStart.getTime();
    for (let i = claimed; i < pool.length; i += 1) {
      specs.push({ phase: 'during', text: 'Another moment from today.', image: true, at: anchor + (i - claimed + 1) * 6 * 60000 });
    }
  }

  const posts = specs
    .sort((a, b) => a.at - b.at)
    .map((spec, i) => {
      const author = spec.author === 'nonprofit'
        ? { name: event.nonprofit, initials: event.npInitials, color: event.catColor }
        : (spec.author && typeof spec.author === 'object' ? spec.author : { name: EVENT_CREATOR.name, initials: EVENT_CREATOR.initials, color: EVENT_CREATOR.color });
      const media = spec.image ? pool.shift() : null;

      return {
        id: `${event.key}-post-${i}`,
        phase: spec.phase,
        name: author.name,
        initials: author.initials,
        avatarBg: spec.author === 'nonprofit' ? author.color : `linear-gradient(135deg, ${author.color}, ${author.color}99)`,
        time: formatThreadTimestamp(new Date(spec.at), eventStart),
        host: !spec.author,
        verified: !!spec.verified,
        highlight: spec.highlight || null,
        text: spec.text,
        media,
        mediaAlt: media ? `Photo shared by ${author.name}` : null,
        mediaSize: 'attachment',
      };
    });

  return posts.map((post, i) => ({ ...post, replies: buildThreadReplies(post, event, i) }));
}

export const eventData = events[0] ? { ...events[0] } : {};

// Unique categories from SE event data (Health, Environment, Education, Animals, Food & Hunger)
export const EVENT_CATEGORIES = [...new Set(events.map((ev) => ev.category))];

const extraEventCategories = EVENT_CATEGORIES.filter((c) => !BROWSE_CATEGORIES.includes(c));
export const ALL_BROWSE_FILTERS = [...BROWSE_CATEGORIES, ...extraEventCategories];

export const NP_CATEGORY_FILTERS = ['All', ...ALL_BROWSE_FILTERS];

export const causes = [...ALL_BROWSE_FILTERS];

export const accountRoles = [
  { id: 'se', label: 'Social Entrepreneur', route: '/about-you', title: 'Create your account', subtitle: "You're one step from starting your first event." },
  { id: 'guest', label: 'Guest', route: '/guest/feed', title: 'Continue as a guest', subtitle: 'Discover and support events happening near you.' },
  { id: 'np', label: 'Non-profit', route: '/np/home', title: 'Continue as a nonprofit', subtitle: "Manage your organization's events and approvals." },
  { id: 'admin', label: 'Charity Hub Admin', route: '/admin', title: 'Continue as an admin', subtitle: 'Governance, approvals, and platform operations.' },
];

export function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export function getOrganizerProfile(slug) {
  const hosted = events.filter((e) => slugify(e.organizer) === slug);
  const primary = hosted[0];
  if (!primary) return null;

  return {
    slug,
    name: primary.organizer,
    initials: primary.initials,
    role: 'Event Presenter · Charity Hub',
    location: 'San Francisco, CA',
    bio: 'Creating events that bring communities together for causes that matter. Dedicated to building community through shared experiences and impactful giving.',
    causes: [...new Set(hosted.map((e) => e.category))],
    stats: {
      eventsHosted: hosted.length,
      peopleReached: 847,
      raised: 12000,
    },
    events: hosted,
  };
}

export function getEventByKey(key) {
  return events.find((e) => e.key === key) || events[0];
}

export function eventLivePath(eventKey, { loggedIn = false } = {}) {
  const prefix = loggedIn ? '/event' : '/guest/event';
  return `${prefix}/live/${eventKey}`;
}

export function eventUpcomingPath(eventKey, { loggedIn = false } = {}) {
  const prefix = loggedIn ? '/event' : '/guest/event';
  return `${prefix}/upcoming/${eventKey}`;
}

export function eventDetailPath(ev, { loggedIn = false } = {}) {
  return ev.isLive
    ? eventLivePath(ev.key, { loggedIn })
    : eventUpcomingPath(ev.key, { loggedIn });
}

export function getNonprofitForEvent(ev) {
  return nonprofits.find((n) => n.name === ev.nonprofit);
}

export function getEventKeyByTitle(title) {
  return events.find((e) => e.title === title || eventDisplayTitle(e.title) === title)?.key || events[0].key;
}

export function calcDonationReceipt(amount) {
  const donation = typeof amount === 'number' && amount > 0 ? amount : 25;
  const tip = donation >= 25 ? 3 : Math.max(1, Math.round(donation * 0.12));
  const subtotal = donation + tip;
  const processingFee = Math.round(subtotal * 0.03964 * 100) / 100;
  const total = Math.round((subtotal + processingFee) * 100) / 100;
  return { donation, tip, processingFee, total };
}

export function buildDonationSuccessUrl({
  amount = 25,
  eventKey = 'neon-night',
  returnTo = eventLivePath(eventKey, { loggedIn: false }),
  donorName = 'Sarah King',
  publicName = 'Sarah K.',
} = {}) {
  const params = new URLSearchParams({
    amount: String(amount),
    event: eventKey,
    return: returnTo,
    donor: donorName,
    public: publicName,
  });
  return `/donate/success?${params.toString()}`;
}
