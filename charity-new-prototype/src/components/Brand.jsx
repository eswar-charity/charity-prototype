import { Link } from 'react-router-dom'
import {
  PawPrint, Users, GraduationCap, HeartPulse, Palette, Landmark, Leaf, Trophy,
  HandHeart, Globe, Gift, UserRound, BookOpen, UtensilsCrossed, Heart,
} from 'lucide-react'
import { percent } from '../lib/format.js'

/** Wordmark per guidelines: "Charity" in Primary Blue, "Hub" white-on-orange circle, ® in blue. */
export function Logo({ light = false }) {
  return (
    <Link to="/" className="logo" aria-label="Charity Hub — home">
      <span className="logo-word" style={light ? { color: '#fff' } : undefined}>Charity</span>
      <span className="logo-hub" aria-hidden="true">Hub</span>
      <sup className="logo-reg" style={light ? { color: '#fff' } : undefined} aria-hidden="true">®</sup>
    </Link>
  )
}

const ICONS = {
  'paw-print': PawPrint, users: Users, 'graduation-cap': GraduationCap, 'heart-pulse': HeartPulse,
  palette: Palette, landmark: Landmark, leaf: Leaf, trophy: Trophy, 'hand-heart': HandHeart,
  globe: Globe, gift: Gift, 'user-round': UserRound, 'book-open': BookOpen,
  'utensils-crossed': UtensilsCrossed,
}
export function CategoryIcon({ name, size = 18, ...rest }) {
  const Cmp = ICONS[name] ?? Heart
  return <Cmp size={size} aria-hidden="true" {...rest} />
}

export function Progress({ raised, goal, label }) {
  const pct = percent(raised, goal)
  return (
    <div
      className="progress"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      aria-label={label ?? 'Fundraising progress'}
    >
      <span style={{ width: `${pct}%` }} />
    </div>
  )
}

export function Initials({ name, color = 'var(--blue)', size = 40 }) {
  const initials = name
    .replace(/[^A-Za-z ]/g, '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
  return (
    <span
      className="initials"
      aria-hidden="true"
      style={{ width: size, height: size, background: color, fontSize: size * 0.38 }}
    >
      {initials}
    </span>
  )
}
