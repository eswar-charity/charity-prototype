import { BROWSE_CATEGORIES } from './categoryIcons';

export const SE_ORGANIZER = {
  name: 'Mike Rivera',
  initials: 'MR',
  color: '#C62828',
};

export const events = [
  {
    id: 1,
    key: 'neon-night',
    title: 'Neon Night Run',
    subtitle: 'Light up the night for a great cause. A glowing 5K to fund youth fitness programs.',
    organizer: SE_ORGANIZER.name,
    initials: SE_ORGANIZER.initials,
    nonprofit: 'Youth Health Fund',
    npInitials: 'YH',
    npBg: 'linear-gradient(135deg,#0A2E52,#1A6EB5)',
    category: 'Health',
    catColor: '#1A6EB5',
    catBg: '#E3F0FB',
    date: 'Nov 8, 2025',
    startTime: '7:00 PM',
    endTime: '10:00 PM',
    location: 'Prospect Park, Brooklyn NY',
    backed: 213,
    joined: 87,
    updates: 38,
    chatCount: 212,
    raised: 14280,
    isLive: true,
    cover: '/events/neon-night/img1.jpg',
    photos: [
      '/events/neon-night/img1.jpg',
      '/events/neon-night/img2.jpg',
      '/events/neon-night/img3.jpg',
      '/events/neon-night/img4.jpg',
      '/events/neon-night/img5.jpg',
    ],
    mission: 'Light up the night for a great cause. A glowing 5K to fund youth fitness programs.',
    story: "What started as a small neighborhood 5K has grown into Brooklyn's biggest after-dark run. Tonight we're not just racing — we're raising funds to keep youth fitness programs free and open for every kid in the borough.",
    tags: ['5K Run', 'Community'],
  },
  {
    id: 2,
    key: 'breakneck-ridge-run',
    title: 'Breakneck Ridge Run',
    subtitle: 'A trail run through the Hudson Valley raising awareness for clean waterways.',
    organizer: SE_ORGANIZER.name,
    initials: SE_ORGANIZER.initials,
    nonprofit: 'Ocean Conservancy',
    npInitials: 'OC',
    npBg: 'linear-gradient(135deg,#0D4A8A,#1A6EB5)',
    category: 'Environment',
    catColor: '#1A6EB5',
    catBg: '#E3F0FB',
    date: 'Oct 28, 2025',
    startTime: '8:00 AM',
    endTime: '2:00 PM',
    location: 'Hudson Valley, NY',
    backed: 145,
    joined: 62,
    updates: 24,
    chatCount: 89,
    raised: 8920,
    isLive: true,
    cover: '/events/breakneck-ridge-run/img1.jpg',
    photos: [
      '/events/breakneck-ridge-run/img1.jpg',
      '/events/breakneck-ridge-run/img2.jpg',
      '/events/breakneck-ridge-run/img3.jpg',
      '/events/breakneck-ridge-run/img4.jpg',
      '/events/breakneck-ridge-run/img5.jpg',
      '/events/breakneck-ridge-run/img6.jpg',
    ],
  },
  {
    id: 3,
    key: 'give-now',
    title: "Give Now, Apré Later",
    subtitle: 'Support cold-weather essentials for those in need — then celebrate with friends.',
    organizer: SE_ORGANIZER.name,
    initials: SE_ORGANIZER.initials,
    nonprofit: 'Books for Communities',
    npInitials: 'BC',
    npBg: 'linear-gradient(135deg,#14507F,#2E86C1)',
    category: 'Education',
    catColor: '#1A6EB5',
    catBg: '#E3F0FB',
    date: 'Dec 14, 2025',
    startTime: '4:00 PM',
    endTime: '8:00 PM',
    location: 'Stowe, Vermont',
    backed: 89,
    joined: 44,
    updates: 12,
    chatCount: 56,
    raised: 5400,
    isLive: true,
    cover: '/events/give-now/img1.jpg',
    photos: [
      '/events/give-now/img1.jpg',
      '/events/give-now/img2.jpg',
      '/events/give-now/img3.jpg',
      '/events/give-now/img4.jpg',
      '/events/give-now/img5.jpg',
    ],
  },
  {
    id: 4,
    key: 'dog-dad',
    title: 'Dog Dad 5K',
    subtitle: 'Bring your pup for a charity walk-run benefiting local animal shelters.',
    organizer: SE_ORGANIZER.name,
    initials: SE_ORGANIZER.initials,
    nonprofit: 'Youth Health Fund',
    npInitials: 'YH',
    npBg: 'linear-gradient(135deg,#0A2E52,#1A6EB5)',
    category: 'Animals',
    catColor: '#1A6EB5',
    catBg: '#E3F0FB',
    date: 'Nov 22, 2025',
    startTime: '10:00 AM',
    endTime: '1:00 PM',
    location: 'Central Park, NYC',
    backed: 56,
    joined: 28,
    updates: 8,
    chatCount: 34,
    raised: 3200,
    isLive: true,
    cover: '/events/dog-dad/img1.jpg',
    photos: [
      '/events/dog-dad/img1.jpg',
      '/events/dog-dad/img2.jpg',
      '/events/dog-dad/img3.jpg',
      '/events/dog-dad/img4.jpg',
      '/events/dog-dad/img5.png',
    ],
  },
  {
    id: 5,
    key: 'golf-outing',
    title: 'Charity Hub Golf Outing',
    subtitle: 'A charity golf scramble supporting local food banks. Lunch included.',
    organizer: SE_ORGANIZER.name,
    initials: SE_ORGANIZER.initials,
    nonprofit: 'Food Bank NYC',
    npInitials: 'FB',
    npBg: 'linear-gradient(135deg,#1976D2,#42A5F5)',
    category: 'Food & Hunger',
    catColor: '#1A6EB5',
    catBg: '#E3F0FB',
    date: 'Oct 14, 2025',
    startTime: '7:00 AM',
    endTime: '3:00 PM',
    location: 'Westchester, NY',
    backed: 72,
    joined: 36,
    updates: 15,
    chatCount: 48,
    raised: 6800,
    isLive: true,
    cover: '/events/golf-outing/img1.jpg',
    photos: ['/events/golf-outing/img1.jpg'],
  },
];

export const nonprofits = [
  {
    id: 1,
    name: 'Ocean Conservancy',
    category: 'Environment',
    verified: true,
    color: '#0D4A8A',
    initials: 'OC',
    bg: 'linear-gradient(135deg, #0D4A8A, #1A6EB5)',
    mission: 'Protecting clean waterways and coastlines through community-powered cleanups and conservation events.',
  },
  {
    id: 2,
    name: 'Food Bank NYC',
    category: 'Food & Hunger',
    verified: true,
    color: '#1976D2',
    initials: 'FB',
    bg: 'linear-gradient(135deg, #1976D2, #42A5F5)',
    mission: 'Putting meals on tables across the city through food drives and community fundraising events.',
  },
  {
    id: 3,
    name: 'Books for Communities',
    category: 'Education',
    verified: true,
    color: '#14507F',
    initials: 'BC',
    bg: 'linear-gradient(135deg, #14507F, #2E86C1)',
    mission: 'Putting learning resources within reach through book drives and school partnership events.',
  },
  {
    id: 4,
    name: 'Clean Air Alliance',
    category: 'Environment',
    verified: true,
    color: '#1A6EB5',
    initials: 'CA',
    bg: 'linear-gradient(135deg, #1A6EB5, #5BC0EB)',
    mission: 'Advocating for cleaner air and climate action through awareness campaigns and community events.',
  },
  {
    id: 5,
    name: 'Youth Health Fund',
    category: 'Health',
    verified: true,
    color: '#0A2E52',
    initials: 'YH',
    bg: 'linear-gradient(135deg, #0A2E52, #1A6EB5)',
    mission: 'Funding free youth fitness and wellness programs through runs, walks, and community events.',
  },
];

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

const HAPPENING_NOW_TIMES = ['Just now', '2m ago', '5m ago', '8m ago'];

export function getHappeningNowReel(event = events[0]) {
  const pool = event.photos.length > 1 ? event.photos.slice(1, 5) : event.photos;
  return pool.map((src, i) => ({
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
    text: 'Setting up the start line now! See you all at Prospect Park — the neon glow is unreal.',
    time: '18 min ago',
    hasImage: true,
    image: '/events/neon-night/img3.jpg',
  },
  {
    id: 3,
    type: 'update',
    user: 'Emma T.',
    initials: 'ET',
    color: '#0D7377',
    text: 'Love the energy out here — cheering everyone on at the start line!',
    time: '24 min ago',
  },
  {
    id: 4,
    type: 'org',
    user: 'Youth Health Fund',
    initials: 'YH',
    color: '#D32F2F',
    text: "Incredible energy tonight! Let's hit 100 backers before the finish line!",
    time: '32 min ago',
    isVerified: true,
  },
];

export const eventData = {
  title: 'Neon Night Run',
  subtitle: 'Light up the night for a great cause.',
  organizer: SE_ORGANIZER.name,
  nonprofit: 'Youth Health Fund',
  category: 'Health',
  date: 'Nov 8, 2025',
  startTime: '7:00 PM',
  endTime: '10:00 PM',
  backed: 213,
  joined: 87,
  updates: 38,
  cover: '/events/neon-night/img1.jpg',
};

// Story-row items interleaved batch-wise across events (1,2,3,4,5 then repeat)
// so the reel cycles through every event before showing the next photo round.
function buildStoryReel(eventList) {
  const maxPhotos = Math.max(...eventList.map((ev) => ev.photos.length), 0);
  const reel = [];
  for (let i = 0; i < maxPhotos; i += 1) {
    for (const ev of eventList) {
      if (ev.photos[i]) {
        reel.push({
          id: `${ev.key}-${i}`,
          src: ev.photos[i],
          title: ev.title,
          category: ev.category,
          event: ev,
        });
      }
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
      eventsHosted: 5,
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
  return events.find((e) => e.title === title)?.key || events[0].key;
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
