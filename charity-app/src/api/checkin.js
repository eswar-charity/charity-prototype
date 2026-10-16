import { apiRequest } from './client.js';

/** The signed-in attendee's ticket for an event (they must have joined). */
export function getMyTicket(eventId) {
  return apiRequest(`/events/${eventId}/ticket`);
}

/**
 * Check someone in at the door. Staff only (organizer, the event's nonprofit
 * admin, or a platform admin). Pass `code` for a scanned ticket, or `name`
 * for a walk-in. A repeat scan rejects with ApiError code `already_checked_in`
 * whose `details` is the existing attendee.
 */
export function checkIn(eventId, body) {
  return apiRequest(`/events/${eventId}/checkin`, { method: 'POST', body });
}

export function listAttendees(eventId) {
  return apiRequest(`/events/${eventId}/attendees`);
}
