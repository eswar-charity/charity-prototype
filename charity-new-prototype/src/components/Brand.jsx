import { useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  PawPrint, Users, GraduationCap, HeartPulse, Palette, Landmark, Leaf, Trophy,
  HandHeart, Globe, Gift, UserRound, BookOpen, UtensilsCrossed, Heart,
} from 'lucide-react'
import { initialsOf, percent } from '../lib/format.js'
import { timelines } from '../data/index.js'

/** Official logo artwork. Full-colour on light, the provisional white version on stage navy / photography. */
export function Logo({ onStage = false, className = '' }) {
  return (
    <Link to="/" className={`ch-nav__logo ${className}`} aria-label="Charity Hub, home">
      <img
        src={onStage ? '/brand/charityhub-logo-white.png' : '/brand/charityhub-logo-transparent.png'}
        alt="Charity Hub"
        width="114"
        height="36"
      />
    </Link>
  )
}

const ICONS = {
  'paw-print': PawPrint, users: Users, 'graduation-cap': GraduationCap, 'heart-pulse': HeartPulse,
  palette: Palette, landmark: Landmark, leaf: Leaf, trophy: Trophy, 'hand-heart': HandHeart,
  globe: Globe, gift: Gift, 'user-round': UserRound, 'book-open': BookOpen,
  'utensils-crossed': UtensilsCrossed,
}
export function CategoryIcon({ name, size = 20, ...rest }) {
  const Cmp = ICONS[name] ?? Heart
  return <Cmp size={size} strokeWidth={2} aria-hidden="true" {...rest} />
}

const toneOf = (name) => 1 + ([...name].reduce((s, c) => s + c.charCodeAt(0), 0) % 4)

export function Avatar({ name, size }) {
  return (
    <span className={`ch-avatar ${size ? `ch-avatar--${size}` : ''}`} data-tone={toneOf(name)} aria-hidden="true">
      {initialsOf(name)}
    </span>
  )
}

/** Names of real community voices from the event's timeline (demo content), for the avatar stack. */
export function voicesFor(key) {
  const names = [...new Set((timelines[key] ?? []).map((p) => p.author?.name).filter(Boolean))]
  return names.length ? names : ['Priya M.', 'James L.', 'Emma T.']
}

export function Attendance({ eventKey, count, label = 'going' }) {
  const names = voicesFor(eventKey).slice(0, 3)
  return (
    <span className="ch-attend">
      <span className="ch-attend__stack">
        {names.map((n) => <Avatar key={n} name={n} />)}
      </span>
      <span className="ch-attend__count"><strong>{count}</strong> {label}</span>
    </span>
  )
}

export function CauseBadge({ name, glass = false, prefix = 'Powering' }) {
  return <span className={`ch-cause ${glass ? 'ch-cause--glass' : ''}`}>{prefix} {name}</span>
}

export function LivePill({ glass = false }) {
  return (
    <span className={`ch-pill ch-pill--live ${glass ? 'ch-pill--glass' : ''}`}>
      <span className="ch-pill__dot" aria-hidden="true" /> LIVE NOW
    </span>
  )
}

export function Progress({ raised, goal, label }) {
  const pct = percent(raised, goal)
  return (
    <div className="meter" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}
      aria-label={label ?? 'Progress toward the demo goal'}>
      <span style={{ width: `${pct}%` }} />
    </div>
  )
}

/** Section entrance (300–450ms ease-out) once visible. Content is visible without JS and when the
 *  observer is unavailable: the hidden pre-state is only applied after we know we can reveal it. */
export function Reveal({ as: Tag = 'div', className = '', children, ...rest }) {
  const ref = useRef(null)
  const [state, setState] = useState('') // '' | 'pre' | 'in'

  useLayoutEffect(() => {
    const el = ref.current
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (!el || reduce || typeof IntersectionObserver === 'undefined') return
    const r = el.getBoundingClientRect()
    if (r.top < window.innerHeight * 0.92) return // already on screen: no flash
    setState('pre')
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setState('in'); io.disconnect() } },
      { threshold: 0.12 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <Tag ref={ref} className={`${className} reveal ${state ? `reveal--${state}` : ''}`} {...rest}>
      {children}
    </Tag>
  )
}
