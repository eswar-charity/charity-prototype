// Lightbox for the Photos tab: Esc closes, arrow keys move, focus is trapped on its controls and restored on close.
import { useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

export default function PhotoViewer({ photos, index, title, onIndex, onClose }) {
  const closeRef = useRef(null)
  const opener = useRef(typeof document !== 'undefined' ? document.activeElement : null)
  const n = photos.length

  useEffect(() => {
    closeRef.current?.focus()
    const back = opener.current
    return () => { if (back && typeof back.focus === 'function') back.focus() }
  }, [])

  const go = (d) => onIndex((index + d + n) % n)
  const onKey = (e) => {
    if (e.key === 'Escape') onClose()
    else if (e.key === 'ArrowRight') go(1)
    else if (e.key === 'ArrowLeft') go(-1)
    else if (e.key === 'Tab') {
      const items = [...e.currentTarget.querySelectorAll('button')]
      if (!items.length) return
      const first = items[0], last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
  }

  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-label={`${title} photo viewer`} onKeyDown={onKey} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <button ref={closeRef} className="lightbox__x" onClick={onClose} aria-label="Close photo viewer"><X size={22} aria-hidden="true" /></button>
      {n > 1 && <button className="lightbox__nav lightbox__nav--prev" onClick={() => go(-1)} aria-label="Previous photo"><ChevronLeft size={24} aria-hidden="true" /></button>}
      <figure className="lightbox__fig">
        <img src={photos[index]} alt={`${title}, photo ${index + 1} of ${n}`} />
        <figcaption className="ch-muted" aria-live="polite">Photo {index + 1} of {n}</figcaption>
      </figure>
      {n > 1 && <button className="lightbox__nav lightbox__nav--next" onClick={() => go(1)} aria-label="Next photo"><ChevronRight size={24} aria-hidden="true" /></button>}
    </div>
  )
}
