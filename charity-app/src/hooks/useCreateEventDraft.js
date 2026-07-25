import { useSyncExternalStore } from 'react';

// Lightweight external store shared by create-event wizard steps (mobile + desktop).

const DEFAULT_DRAFT = {
  serverEventId: null,
  serverKey: null,
  coverMediaId: null,
  title: '',
  photos: [],
  story: '',
  nonprofitId: null,
  category: null,
  startDate: 'Oct 14, 2025',
  endDate: 'Oct 14, 2025',
  startTime: '9:00 AM',
  endTime: '9:00 PM',
  location: 'Central Park, New York NY',
  visibility: 'public',
  previewLiked: false,
  inviteSent: false,
  // When true, SE is fixing NP-requested changes — only allowedSteps are editable.
  fixMode: false,
  allowedSteps: null,
  changeFeedback: '',
};

function freshDraft() {
  return { ...DEFAULT_DRAFT, photos: [] };
}

let state = freshDraft();
const listeners = new Set();

export function updateDraft(patch) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

export function resetDraft() {
  state = freshDraft();
  listeners.forEach((l) => l());
}

export function useCreateEventDraft() {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
    () => state
  );
}
