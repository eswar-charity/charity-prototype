import {
  Compass, PawPrint, Users, GraduationCap, HeartPulse, Palette, Landmark,
  Leaf, Trophy, HandHeart, Globe, Gift, UserRound, BookOpen, UtensilsCrossed,
  MapPin, UserCheck, ThumbsUp, Sparkles,
} from 'lucide-react';

// Full browse taxonomy — shown as text filter chips (All, You, Live now, …).
export const BROWSE_CATEGORIES = [
  'Animals',
  'Community',
  'Education',
  'Health',
  'Arts',
  'Religion',
  'Environment',
  'Sports',
  'Human Services',
  'Culture',
  'Gifts & Foundations',
  'Individuals',
  'Public-Society Benefit',
  'Humanities',
  'Food & Hunger',
];

// One icon + accent color per cause category — the primary navigation for
// the feed's top section, in place of circular story-style photo avatars.
const CATEGORY_ICONS = {
  All: { Icon: Compass, color: '#1A6EB5' },
  Animals: { Icon: PawPrint, color: '#C2410C' },
  Community: { Icon: Users, color: '#7C3AED' },
  Education: { Icon: GraduationCap, color: '#0D7377' },
  Health: { Icon: HeartPulse, color: '#D32F2F' },
  Arts: { Icon: Palette, color: '#DB2777' },
  Religion: { Icon: Landmark, color: '#92400E' },
  Environment: { Icon: Leaf, color: '#15803D' },
  Sports: { Icon: Trophy, color: '#EA580C' },
  'Human Services': { Icon: HandHeart, color: '#0369A1' },
  Culture: { Icon: Globe, color: '#6D28D9' },
  'Gifts & Foundations': { Icon: Gift, color: '#B45309' },
  Individuals: { Icon: UserRound, color: '#4338CA' },
  'Public-Society Benefit': { Icon: Landmark, color: '#334155' },
  Humanities: { Icon: BookOpen, color: '#78350F' },
  'Food & Hunger': { Icon: UtensilsCrossed, color: '#CA8A04' },
};

const DEFAULT_CATEGORY_ICON = { Icon: Compass, color: '#51617A' };

export function getCategoryIcon(category) {
  return CATEGORY_ICONS[category] || DEFAULT_CATEGORY_ICON;
}

// The feed's second row: HOW to surface events, not WHICH cause — a
// different axis from the category rail above it, so the two rows stop
// duplicating the same 15 categories in two visual styles.
export const DISCOVERY_FILTERS = [
  { key: 'All', label: 'All', Icon: Compass },
  { key: 'Live now', label: 'Live now', dot: true },
  { key: 'Near you', label: 'Near you', Icon: MapPin },
  { key: 'Following', label: 'Following', Icon: UserCheck },
  { key: 'Popular', label: 'Popular', Icon: ThumbsUp },
  { key: 'New', label: 'New', Icon: Sparkles },
];
