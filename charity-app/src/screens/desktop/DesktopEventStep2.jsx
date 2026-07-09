import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Check } from 'lucide-react';
import DesktopCreateEventLayout from '../../components/desktop/DesktopCreateEventLayout';
import { useCreateEventDraft, updateDraft } from '../../hooks/useCreateEventDraft';
import { nonprofits } from '../../data/mockData';

const FILTERS = ['All', 'Environment', 'Education', 'Health'];

export default function DesktopEventStep2() {
  const navigate = useNavigate();
  const draft = useCreateEventDraft();
  const [activeFilter, setActiveFilter] = useState('All');
  const [query, setQuery] = useState('');
  const [toast, setToast] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2200);
  };

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

      <div className="filter-tabs" style={{ marginBottom: 18 }}>
        {FILTERS.map((f) => (
          <button key={f} className={`filter-tab ${activeFilter === f ? 'active' : ''}`} onClick={() => setActiveFilter(f)}>
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
        <button className="btn-ghost" style={{ fontSize: 14 }} onClick={() => showToast('Invite a nonprofit — coming soon')}>Don't see your nonprofit? Invite them →</button>
      </div>

      {toast && (
        <div
          style={{
            position: 'fixed', left: '50%', bottom: 32, transform: 'translateX(-50%)',
            background: 'var(--dark)', color: 'white', padding: '12px 18px',
            borderRadius: 999, fontSize: 13, fontWeight: 600,
            boxShadow: '0 8px 24px rgba(0,0,0,0.18)', zIndex: 200, whiteSpace: 'nowrap',
          }}
        >
          {toast}
        </div>
      )}

      <div className="dsk-wizard-footer">
        <button className="dsk-wizard-back-link" onClick={() => navigate('/event/step-1')}>← Back</button>
        <button className="dsk-cta-btn" onClick={() => navigate('/event/step-3')}>Next: date & location →</button>
      </div>
    </DesktopCreateEventLayout>
  );
}
