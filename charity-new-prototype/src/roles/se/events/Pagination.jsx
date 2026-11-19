import { ChevronLeft, ChevronRight } from 'lucide-react'
import { PAGE_SIZES, pageWindow } from './model.js'

export default function Pagination({ page, onPage, size, onSize }) {
  const { page: p, pages, from, to, total } = page
  return (
    <nav className="pager" aria-label="Pagination">
      <p className="pager__count" role="status">Showing <strong>{from.toLocaleString()}–{to.toLocaleString()}</strong> of <strong>{total.toLocaleString()}</strong></p>
      <ul className="pager__pages">
        <li><button type="button" className="pager__btn" onClick={() => onPage(p - 1)} disabled={p <= 1} aria-label="Previous page"><ChevronLeft size={18} aria-hidden="true" /></button></li>
        {pageWindow(p, pages).map((n, i) => n == null
          ? <li key={`gap-${i}`} className="pager__gap" aria-hidden="true">…</li>
          : <li key={n}><button type="button" className={`pager__btn ${n === p ? 'is-on' : ''}`} onClick={() => onPage(n)} aria-label={`Page ${n}`} aria-current={n === p ? 'page' : undefined}>{n}</button></li>)}
        <li><button type="button" className="pager__btn" onClick={() => onPage(p + 1)} disabled={p >= pages} aria-label="Next page"><ChevronRight size={18} aria-hidden="true" /></button></li>
      </ul>
      <label className="pager__size">
        <span>Per page</span>
        <select value={size} onChange={(e) => onSize(Number(e.target.value))}>
          {PAGE_SIZES.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </label>
    </nav>
  )
}
