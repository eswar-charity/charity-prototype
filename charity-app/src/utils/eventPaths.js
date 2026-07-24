export { eventDisplayTitle } from '../data/eventData.js';

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
