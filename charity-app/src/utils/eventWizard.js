export const START_DATES = ['Oct 14, 2025', 'Oct 21, 2025', 'Nov 8, 2025'];
export const END_DATES = ['Oct 14, 2025', 'Oct 22, 2025', 'Nov 9, 2025'];
export const START_TIMES = ['9:00 AM', '10:00 AM', '6:00 PM'];
export const END_TIMES = ['9:00 PM', '12:00 PM', '10:00 PM'];

export function previewHashtag(story, fallback = 'CharityBaby') {
  const words = story.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return `#${fallback}`;
  return `#${words.slice(0, 3).join('')}`;
}

export function cycleValue(list, current) {
  const idx = list.indexOf(current);
  return list[(idx + 1) % list.length];
}
