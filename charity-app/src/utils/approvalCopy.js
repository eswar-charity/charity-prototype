import { DEFAULT_EVENT_COVER } from './eventPhotos.js';

export const NO_PHOTO_BACKGROUND = 'linear-gradient(135deg,#0A2E52,#1A6EB5)';

/** Hero background: the event's own photo, or a plain brand gradient (never the logo, cropped). */
export function heroBackground(cover, { scrim = false } = {}) {
  const hasPhoto = cover && cover !== DEFAULT_EVENT_COVER;
  if (!hasPhoto) return NO_PHOTO_BACKGROUND;
  return scrim
    ? `linear-gradient(to top, rgba(13,42,74,0.78), rgba(13,42,74,0.15)), url(${cover})`
    : `url(${cover})`;
}

/** The timeline's decision step must reflect what the nonprofit actually decided. */
export function decisionNode(apiStatus, nonprofitName, approved) {
  const np = nonprofitName || 'the nonprofit';
  if (apiStatus === 'Rejected') return { label: 'Not approved', sub: `Declined by ${np}` };
  if (apiStatus === 'Changes Requested') return { label: 'Changes requested', sub: 'Update the event and resubmit' };
  return { label: 'Approved', sub: approved ? `Approved by ${np}` : 'Awaiting nonprofit approval' };
}

/** Badge on the event photo. */
export function statusBadge(uiState, apiStatus) {
  if (uiState === 'completed') return 'COMPLETED';
  if (uiState === 'approved') return 'APPROVED';
  if (apiStatus === 'Draft') return 'DRAFT';
  if (apiStatus === 'Changes Requested') return 'CHANGES REQUESTED';
  if (apiStatus === 'Rejected') return 'NOT APPROVED';
  return 'IN REVIEW';
}

export function liveNodeSub(apiStatus) {
  return apiStatus === 'Rejected' ? 'Not published' : 'Publish once approved';
}

/**
 * Headline + sub-line for the SE's "Approval status" screen.
 * Keyed by the event's real status, not just the coarse UI state: a Rejected or
 * Changes Requested event must not read "Submitted! They are reviewing it".
 * No response-time promise is made: nonprofits have no deadline.
 */
export function approvalCopy(uiState, apiStatus, nonprofitName) {
  const np = nonprofitName || 'The nonprofit';

  if (uiState === 'review') {
    switch (apiStatus) {
      case 'Draft':
        return { title: 'Draft saved', sub: 'This event has not been sent yet. Finish it and submit it for approval.' };
      case 'Changes Requested':
        return { title: 'Changes requested', sub: `${np} asked for updates. Make the changes and resubmit.` };
      case 'Rejected':
        return { title: 'Not approved', sub: `${np} declined this event. You can create a new one.` };
      default:
        return { title: 'Submitted!', sub: `${np} is reviewing your event. You’ll get a notification when they decide.` };
    }
  }
  return {
    approved: { title: 'You’re approved', sub: `${np} approved your event.` },
    live: { title: 'You’re live!', sub: 'Your event is published and open for people to join and back.' },
    completed: { title: 'Event complete', sub: 'Thanks for running a great event. Your impact recap is ready to share.' },
  }[uiState];
}

/** Which secondary action (if any) the SE may take for an event in the review state. */
export function reviewAction(apiStatus) {
  if (apiStatus === 'Changes Requested') return 'update';   // fix flagged steps and resubmit
  if (apiStatus === 'Draft') return 'drafts';               // continue from Your drafts
  if (apiStatus === 'Rejected') return 'new';               // final: start a new event
  return null;                                              // Submitted: under review, not editable
}
