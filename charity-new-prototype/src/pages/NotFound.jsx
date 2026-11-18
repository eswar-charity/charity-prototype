import { Link } from 'react-router-dom'

export default function NotFound({ what = 'page' }) {
  return (
    <section className="section">
      <div className="container narrow" style={{ textAlign: 'center' }}>
        <p className="eyebrow">404</p>
        <h1 className="h1">We couldn’t find that {what}</h1>
        <p style={{ margin: 'var(--s-md) 0 var(--s-lg)' }}>It may have moved, or the link might be wrong.</p>
        <Link to="/" className="btn btn-primary">Back to discover</Link>
      </div>
    </section>
  )
}
