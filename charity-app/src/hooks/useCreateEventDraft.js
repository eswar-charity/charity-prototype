import { useSyncExternalStore } from 'react';
import { formatDisplayDate } from '../utils/datePicker.js';

// Lightweight external store shared by create-event wizard steps (mobile + desktop).

export function buildDefaultDraft() {
  const today = formatDisplayDate(new Date());
  return {
    serverEventId: null,
    serverKey: null,
    coverMediaId: null,
    title: '',
    photos: [],
    story: '',
    nonprofitId: null,
    category: null,
    startDate: today,
    endDate: today,
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
    guidelinesReviewed: false,
    wizardStep: 1,
  };
}

function freshDraft() {
  return { ...buildDefaultDraft(), photos: [] };
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

export function getDraft() {
  return state;
}

export function useCreateEventDraft() {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
    () => state
  );
}
