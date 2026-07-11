import { events, EVENT_CATEGORIES } from './mockData';

export const HOW_IT_WORKS_STEPS = [
  {
    step: '01',
    title: 'Discover events that matter',
    body: 'Browse The Scene — live gatherings, upcoming runs, and community moments tied to verified 501(c)(3) nonprofits.',
    icon: 'compass',
  },
  {
    step: '02',
    title: 'Host or join the movement',
    body: 'Social Entrepreneurs create free events for a chosen nonprofit. Guests back causes, join the room, and follow along in real time.',
    icon: 'users',
  },
  {
    step: '03',
    title: 'Share live moments',
    body: 'Event Creators post photos and updates that rise to the top of the timeline. Supporters add energy through chat, backing, and community posts.',
    icon: 'camera',
  },
  {
    step: '04',
    title: 'Funds reach verified nonprofits',
    body: 'Donations flow to the linked nonprofit after approval. Every gift is tracked transparently — from first backer to post-event impact.',
    icon: 'heart',
  },
];

export const HOW_IT_WORKS_ROLES = [
  {
    title: 'Social Entrepreneur',
    body: 'Pick a verified nonprofit, tell your story, and submit your event for approval. You run the experience — Charity Hub handles trust and payments.',
    cta: 'Start an event',
    route: '/',
  },
  {
    title: 'Guest',
    body: 'Explore without friction. Discover events, back causes you care about, and create an account when you are ready to join the conversation.',
    cta: 'Explore The Scene',
    route: '/guest/feed',
  },
  {
    title: 'Nonprofit',
    body: 'Review event submissions, approve fundraisers, and receive settled donations with full visibility into backers and live activity.',
    cta: 'Nonprofit Launchpad',
    route: '/np/home',
  },
];

const CAUSE_COPY = {
  Health: 'Runs, walks, and wellness gatherings that fund youth fitness, mental health, and community care programs.',
  Environment: 'Trail runs, clean-ups, and outdoor events raising awareness and dollars for conservation and climate action.',
  Education: 'Book drives, apé-ski fundraisers, and school partnerships that put learning resources in every community.',
  Animals: 'Pet-friendly 5Ks and shelter benefits that keep rescue animals fed, safe, and adopted into loving homes.',
  'Food & Hunger': 'Golf outings, meal packing, and food-bank drives that put meals on tables across your city.',
};

export function getCausesWithEvents() {
  return EVENT_CATEGORIES.map((category) => {
    const categoryEvents = events.filter((ev) => ev.category === category);
    const featured = categoryEvents.find((ev) => ev.isLive) || categoryEvents[0];
    return {
      category,
      description: CAUSE_COPY[category] || `Events and gatherings supporting ${category.toLowerCase()} causes.`,
      eventCount: categoryEvents.length,
      featured,
      totalRaised: categoryEvents.reduce((sum, ev) => sum + ev.raised, 0),
    };
  });
}
