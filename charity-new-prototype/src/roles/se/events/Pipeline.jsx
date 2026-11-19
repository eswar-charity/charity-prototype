import { PIPELINE } from './model.js'

/**
 * The pipeline: one bar showing how your events are spread across their life, and a filter at the same time.
 * Width follows the count (with a floor so empty stages stay readable); the count and name are always written out.
 */
export default function Pipeline({ counts, active, onPick }) {
  const total = Math.max(1, counts.total)
  return (
    <nav className="pipe" aria-label="Your events by stage">
      <ul>
        {PIPELINE.map((seg) => {
          const n = seg.stages.reduce((t, id) => t + counts.stages[id], 0)
          const on = active === seg.id
          return (
            <li key={seg.id} style={{ flexGrow: Math.max(n, total * 0.07), flexBasis: 0 }} className={`pipe__seg pipe__seg--${seg.id} ${on ? 'is-on' : ''} ${n === 0 ? 'is-empty' : ''}`}>
              <button type="button" aria-pressed={on} onClick={() => onPick(on ? null : seg)} aria-label={`${seg.label}: ${n.toLocaleString()}`}>
                <span className="pipe__bar" aria-hidden="true" />
                <span className="pipe__n">{n.toLocaleString()}</span>
                <span className="pipe__label">{seg.id === 'live' && n > 0 && <span className="ch-pill__dot" aria-hidden="true" />}{seg.label}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
