import { useSyncExternalStore } from 'react';

// Lightweight external store (no context/provider needed) that lets the
// desktop "Create an event" wizard steps share one draft so the sidebar
// "Live preview" card updates as the SE fills out each step. Scoped only
// to the desktop wizard screens — the mobile EventStep* screens keep
// their own local state and never read this.

const DEFAULT_DRAFT = {
  photos: [
    { id: 1, src: '/events/neon-night/img1.jpg' },
    { id: 2, src: '/events/neon-night/img2.jpg' },
    { id: 3, src: '/events/neon-night/img3.jpg' },
  ],
  story: '',
  nonprofitId: 1,
  startDate: 'Oct 14, 2025',
  endDate: 'Oct 14, 2025',
  startTime: '9:00 AM',
  endTime: '9:00 PM',
  location: '',
  visibility: 'public',
};

let state = { ...DEFAULT_DRAFT };
const listeners = new Set();

export function updateDraft(patch) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

export function resetDraft() {
  state = { ...DEFAULT_DRAFT };
  listeners.forEach((l) => l());
}

export function useCreateEventDraft() {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
    () => state
  );
}
