import { useEffect } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export const VARIANTS = [
  { key: 'A', name: 'Card grid' },
  { key: 'B', name: 'Spotlight' },
  { key: 'C', name: 'Mosaic' },
]

export function useVariant() {
  const [params] = useSearchParams()
  const v = (params.get('variant') ?? 'A').toUpperCase()
  return VARIANTS.some((x) => x.key === v) ? v : 'A'
}

/** Pure helper so the wrap-around logic is testable. */
export function cycle(current, dir) {
  const i = VARIANTS.findIndex((v) => v.key === current)
  return VARIANTS[(i + dir + VARIANTS.length) % VARIANTS.length].key
}

const typing = (el) =>
  el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable)

/** Floating bottom bar (from the /prototype UI workflow). Only mounts on the Discover route,
 *  where the variants live. Set VITE_HIDE_SWITCHER=1 to remove it. */
export default function PrototypeSwitcher() {
  const [params, setParams] = useSearchParams()
  const current = useVariant()
  const onDiscover = useLocation().pathname === '/'
  const hidden = import.meta.env.VITE_HIDE_SWITCHER === '1'

  const go = (dir) => {
    const next = new URLSearchParams(params)
    next.set('variant', cycle(current, dir))
    setParams(next, { replace: true, preventScrollReset: true })
  }

  useEffect(() => {
    if (!onDiscover || hidden) return
    const onKey = (e) => {
      if (typing(document.activeElement) || e.altKey || e.ctrlKey || e.metaKey) return
      if (e.key === 'ArrowLeft') go(-1)
      if (e.key === 'ArrowRight') go(1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (!onDiscover || hidden) return null
  const name = VARIANTS.find((v) => v.key === current).name

  return (
    <div className="switcher ch-glass" role="group" aria-label="Prototype variant switcher">
      <button onClick={() => go(-1)} aria-label="Previous variant"><ChevronLeft size={18} aria-hidden="true" /></button>
      <span aria-live="polite"><strong>{current}</strong> · {name}</span>
      <button onClick={() => go(1)} aria-label="Next variant"><ChevronRight size={18} aria-hidden="true" /></button>
    </div>
  )
}
