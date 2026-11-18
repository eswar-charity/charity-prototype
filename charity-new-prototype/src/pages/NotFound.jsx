import { Link } from 'react-router-dom'

/** `stage` is for routes whose header floats over a navy hero (events, nonprofits), so the nav stays readable. */
export default function NotFound({ what = 'page', stage = false }) {
  return (
    <section className={`page-head page-head--center ${stage ? 'ch-stage page-head--stage' : ''}`}>
      <div className="wrap">
        <p className="ch-eyebrow">404</p>
        <h1 className="h-display-3">We couldn’t find that {what}</h1>
        <p className="lede">It may have moved, or the link might be wrong. Head back and keep looking.</p>
        <p className="page-head__cta"><Link to="/#discover" className="ch-btn ch-btn--primary">Find events</Link></p>
      </div>
    </section>
  )
}
