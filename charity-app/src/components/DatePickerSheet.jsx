import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import {
  WEEKDAY_LABELS,
  buildCalendarCells,
  formatDisplayDate,
  monthLabel,
  parseDisplayDate,
  sameCalendarDay,
} from '../utils/datePicker';

export default function DatePickerSheet({
  open,
  onClose,
  value,
  onChange,
  title = 'Select date',
  variant = 'mobile',
}) {
  const selected = parseDisplayDate(value);
  const [viewYear, setViewYear] = useState(selected.getFullYear());
  const [viewMonth, setViewMonth] = useState(selected.getMonth());

  useEffect(() => {
    if (!open) return;
    const parsed = parseDisplayDate(value);
    setViewYear(parsed.getFullYear());
    setViewMonth(parsed.getMonth());
  }, [open, value]);

  if (!open) return null;

  const cells = buildCalendarCells(viewYear, viewMonth);
  const today = new Date();

  const shiftMonth = (delta) => {
    const next = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  };

  const pickDate = (date) => {
    onChange(formatDisplayDate(date));
    onClose();
  };

  const panel = (
    <div
      className={`date-picker-panel ${variant === 'desktop' ? 'date-picker-panel--desktop' : ''}`}
      onClick={(e) => e.stopPropagation()}
      role="dialog"
      aria-label={title}
    >
      <div className="date-picker-head">
        <p className="date-picker-title">{title}</p>
        <button type="button" className="date-picker-close" aria-label="Close" onClick={onClose}>
          <X size={18} />
        </button>
      </div>

      <div className="date-picker-nav">
        <button type="button" className="date-picker-nav-btn" aria-label="Previous month" onClick={() => shiftMonth(-1)}>
          <ChevronLeft size={18} />
        </button>
        <span className="date-picker-month">{monthLabel(viewYear, viewMonth)}</span>
        <button type="button" className="date-picker-nav-btn" aria-label="Next month" onClick={() => shiftMonth(1)}>
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="date-picker-weekdays">
        {WEEKDAY_LABELS.map((label) => (
          <span key={label} className="date-picker-weekday">{label}</span>
        ))}
      </div>

      <div className="date-picker-grid">
        {cells.map((date, idx) => {
          if (!date) {
            return <span key={`empty-${idx}`} className="date-picker-day date-picker-day--empty" />;
          }
          const isSelected = sameCalendarDay(date, selected);
          const isToday = sameCalendarDay(date, today);
          return (
            <button
              key={date.toISOString()}
              type="button"
              className={`date-picker-day ${isSelected ? 'date-picker-day--selected' : ''} ${isToday ? 'date-picker-day--today' : ''}`}
              onClick={() => pickDate(date)}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );

  if (variant === 'desktop') {
    return (
      <div className="date-picker-overlay date-picker-overlay--desktop" onClick={onClose}>
        {panel}
      </div>
    );
  }

  return (
    <div className="overlay-bg" onClick={onClose}>
      <div className="bottom-sheet date-picker-sheet">
        <div className="sheet-handle" />
        {panel}
      </div>
    </div>
  );
}
