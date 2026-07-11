import { useState } from 'react';
import { Calendar } from 'lucide-react';
import DatePickerSheet from './DatePickerSheet';

export default function DatePickerField({
  label,
  value,
  onChange,
  variant = 'mobile',
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="dt-box dt-box-btn"
        aria-label={`${label}: ${value}. Open calendar`}
        onClick={() => setOpen(true)}
      >
        <div className="dt-label">
          <Calendar size={11} color="var(--primary)" />
          {label}
        </div>
        <div className="dt-value">{value}</div>
      </button>

      <DatePickerSheet
        open={open}
        onClose={() => setOpen(false)}
        value={value}
        onChange={onChange}
        title={label}
        variant={variant}
      />
    </>
  );
}
