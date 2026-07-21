import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * A horizontally-scrolling row of pill filters with edge scroll arrows that
 * only appear once (and while) there's more to scroll to. Shared between the
 * mobile and desktop feed screens since the scroll-position tracking is real
 * logic, not just markup — worth one implementation instead of four.
 */
export default function FilterPillRow({ filters, active, onSelect, rowClassName = 'pill-filter-row', chipClassName = 'pill-filter-chip' }) {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    updateScrollState();
    const el = scrollRef.current;
    if (!el) return undefined;
    el.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [updateScrollState, filters.length]);

  const scrollByPage = (direction) => {
    scrollRef.current?.scrollBy({ left: direction * 220, behavior: 'smooth' });
  };

  return (
    <div className="pill-filter-wrap">
      {canScrollLeft && (
        <button
          type="button"
          className="pill-filter-nav pill-filter-nav--prev"
          aria-label="Scroll filters left"
          onClick={() => scrollByPage(-1)}
        >
          <ChevronLeft size={16} />
        </button>
      )}

      <div className={rowClassName} ref={scrollRef}>
        {filters.map((f) => {
          const isActive = active === f.key;
          return (
            <button
              key={f.key}
              type="button"
              className={`${chipClassName}${isActive ? ' active' : ''}`}
              aria-pressed={isActive}
              onClick={() => onSelect(f.key)}
            >
              {f.dot ? (
                <span className="pill-filter-dot" style={{ background: isActive ? 'white' : 'var(--primary)' }} />
              ) : (
                <f.Icon size={16} aria-hidden="true" />
              )}
              {f.label}
            </button>
          );
        })}
      </div>

      {canScrollRight && (
        <button
          type="button"
          className="pill-filter-nav pill-filter-nav--next"
          aria-label="Scroll filters right"
          onClick={() => scrollByPage(1)}
        >
          <ChevronRight size={16} />
        </button>
      )}
    </div>
  );
}
