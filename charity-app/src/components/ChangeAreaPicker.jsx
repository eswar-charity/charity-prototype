import { CHANGE_AREAS } from '../utils/changeRequestAreas';

/** Multi-select which wizard areas need changes (NP request-changes flow). */
export default function ChangeAreaPicker({ selected, onChange }) {
  const toggle = (id) => {
    if (selected.includes(id)) {
      onChange(selected.filter((a) => a !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
      {CHANGE_AREAS.map((area) => {
        const on = selected.includes(area.id);
        return (
          <button
            key={area.id}
            type="button"
            className={`vis-option vis-option-btn ${on ? 'selected-vis' : ''}`}
            onClick={() => toggle(area.id)}
            style={{ marginBottom: 0 }}
          >
            <div style={{ flex: 1, textAlign: 'left' }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--dark)' }}>{area.label}</p>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                Step {area.step} — organizer can edit this section only
              </p>
            </div>
            <div className={`vis-check ${on ? 'checked' : ''}`}>
              {on ? '✓' : ''}
            </div>
          </button>
        );
      })}
    </div>
  );
}
