import { BROWSE_CATEGORIES } from './categoryIcons';
import {
  buildEvents,
  buildNonprofits,
  eventDisplayTitle,
  getCommunityPhotos,
  getEventBanner,
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

// Event creator — owns the Happening now photo reel (newest content rises to the top).
export const EVENT_CREATOR = SE_ORGANIZER;

const HAPPENING_NOW_TIMES = ['Just now', '2m ago', '5m ago', '8m ago', '12m ago', '15m ago'];

/** Community reel: all unique photos except the cover/banner (which matches story). */
export function getHappeningNowReel(event = events[0]) {
  const pool = getCommunityPhotos(event);
  const fallback = pool.length ? pool : (event?.photos?.length ? [getEventBanner(event)].filter(Boolean) : []);
  return fallback.map((src, i) => ({
    src,
    user: EVENT_CREATOR.name,
    initials: EVENT_CREATOR.initials,
    color: EVENT_CREATOR.color,
    time: HAPPENING_NOW_TIMES[i] || `${(i + 1) * 2}m ago`,
    isCreator: true,
  }));
}

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

export const eventData = events[0] ? { ...events[0] } : {};

// Story-row items: main cover only per event, cycling 1,2,3,4,5,1,2,3,4,5…
function buildStoryReel(eventList) {
  const cycles = Math.max(...eventList.map((ev) => ev.photos.length), 1);
  const reel = [];
  for (let c = 0; c < cycles; c += 1) {
    for (const ev of eventList) {
      reel.push({
        id: `${ev.key}-${c}`,
        src: ev.cover,
        title: ev.title,
        category: ev.category,
        event: ev,
      });
    }
  }
  return reel;
}

export const storyReel = buildStoryReel(events);

// Unique categories from SE event data (Health, Environment, Education, Animals, Food & Hunger)
export const EVENT_CATEGORIES = [...new Set(events.map((ev) => ev.category))];

const extraEventCategories = EVENT_CATEGORIES.filter((c) => !BROWSE_CATEGORIES.includes(c));
const ALL_BROWSE_FILTERS = [...BROWSE_CATEGORIES, ...extraEventCategories];

export const SE_FEED_FILTERS = ['All', 'You', 'Live now', ...ALL_BROWSE_FILTERS];
export const GUEST_FEED_FILTERS = ['All', 'Live now', ...ALL_BROWSE_FILTERS];
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
