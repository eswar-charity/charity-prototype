import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Check } from 'lucide-react';
import DesktopCreateEventLayout from '../../components/desktop/DesktopCreateEventLayout';
import { useCreateEventDraft, updateDraft } from '../../hooks/useCreateEventDraft';
import { nonprofits, NP_CATEGORY_FILTERS } from '../../data/mockData';

export default function DesktopEventStep2() {
  const navigate = useNavigate();
  const draft = useCreateEventDraft();
  const [activeFilter, setActiveFilter] = useState('All');
  const [query, setQuery] = useState('');

  const filtered = nonprofits.filter((np) => {
    const matchFilter = activeFilter === 'All' || np.category === activeFilter || np.category.includes(activeFilter);
    const matchQuery = np.name.toLowerCase().includes(query.toLowerCase()) || np.category.toLowerCase().includes(query.toLowerCase());
    return matchFilter && matchQuery;
  });

  return (
    <DesktopCreateEventLayout step={2}>
      <h1 className="dsk-wizard-h1">Choose your nonprofit</h1>
      <p className="dsk-wizard-sub">Your event raises participation for a verified 501(c)(3).</p>

      <div className="search-wrap" style={{ marginBottom: 14 }}>
        <Search size={16} className="search-ico" />
        <input
          className="input-field"
          placeholder="Search nonprofits by name or cause"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="dsk-filter-row dsk-wizard-filter-row">
        {NP_CATEGORY_FILTERS.map((f) => (
          <button key={f} type="button" className={`dsk-filter-chip ${activeFilter === f ? 'active' : ''}`} onClick={() => setActiveFilter(f)}>
            {f}
          </button>
        ))}
      </div>

      <div>
        {filtered.map((np) => (
          <div
            key={np.id}
            className={`np-item ${draft.nonprofitId === np.id ? 'selected-np' : ''}`}
            onClick={() => updateDraft({ nonprofitId: np.id })}
          >
            <div className="np-logo" style={{ background: np.bg, color: 'white' }}>{np.initials}</div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--dark)' }}>{np.name}</p>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{np.category} · verified 501(c)(3)</p>
            </div>
            {draft.nonprofitId === np.id && (
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Check size={13} color="white" strokeWidth={3} />
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ marginTop: 16 }}>
        <button
          type="button"
          className="btn-ghost"
          style={{ fontSize: 14, color: draft.inviteSent ? 'var(--green)' : undefined }}
          onClick={() => updateDraft({ inviteSent: true })}
          disabled={draft.inviteSent}
        >
          {draft.inviteSent ? 'Invite sent — we’ll let you know when they join ✓' : "Don't see your nonprofit? Invite them →"}
        </button>
      </div>

      <div className="dsk-wizard-footer">
        <button type="button" className="dsk-wizard-back-link" onClick={() => navigate('/event/step-1')}>← Back</button>
        <button type="button" className="dsk-cta-btn" onClick={() => navigate('/event/step-3')}>Next: date & location →</button>
      </div>
    </DesktopCreateEventLayout>
  );
}
