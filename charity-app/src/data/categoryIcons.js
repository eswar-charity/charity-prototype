import {
  Compass, PawPrint, Users, GraduationCap, HeartPulse, Palette, Landmark,
  Leaf, Trophy, HandHeart, Globe, Gift, UserRound, BookOpen, UtensilsCrossed,
  MapPin, UserCheck, ThumbsUp, Sparkles,
} from 'lucide-react';

// Icon registry: the API stores an icon *key* per category (categories.icon);
// the actual glyph is a presentation concern and lives here.
const ICONS_BY_KEY = {
  'paw-print': PawPrint,
  users: Users,
  'graduation-cap': GraduationCap,
  'heart-pulse': HeartPulse,
  palette: Palette,
  landmark: Landmark,
  leaf: Leaf,
  trophy: Trophy,
  'hand-heart': HandHeart,
  globe: Globe,
  gift: Gift,
  'user-round': UserRound,
  'book-open': BookOpen,
  'utensils-crossed': UtensilsCrossed,
  compass: Compass,
};

const ALL_ICON = { Icon: Compass, color: '#1A6EB5' };
const DEFAULT_CATEGORY_ICON = { Icon: Compass, color: '#51617A' };

// Filled by useCategories() once /categories has loaded.
let registry = {};

export function registerCategories(categories) {
  registry = Object.fromEntries(
    (categories || []).map((c) => [c.name, { Icon: ICONS_BY_KEY[c.icon] || Compass, color: c.color || '#51617A' }]),
  );
}

export function getCategoryIcon(category) {
  if (category === 'All') return ALL_ICON;
  return registry[category] || DEFAULT_CATEGORY_ICON;
}

// The feed's second row: HOW to surface events, not WHICH cause — a
// different axis from the category rail above it. These are view modes,
// not data, so they stay in code.
export const DISCOVERY_FILTERS = [
  { key: 'All', label: 'All', Icon: Compass },
  { key: 'Live now', label: 'Live now', dot: true },
  { key: 'Near you', label: 'Near you', Icon: MapPin },
  { key: 'Following', label: 'Following', Icon: UserCheck },
  { key: 'Popular', label: 'Popular', Icon: ThumbsUp },
  { key: 'New', label: 'New', Icon: Sparkles },
];
