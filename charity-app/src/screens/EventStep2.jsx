import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Search, Check } from 'lucide-react';
import { nonprofits } from '../data/mockData';

const FILTERS = ['All', 'Environment', 'Education', 'Health'];

export default function EventStep2() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('All');
  const [selected, setSelected] = useState(1);
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
    <div className="phone-shell">
      <div className="screen">
        {/* Step header */}
        <div className="step-bar">
          <button className="back-btn" onClick={() => navigate('/event/step-1')}>
            <ChevronLeft size={18} />
          </button>
          <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--dark)' }}>Lumen</span>
          <div style={{ width: 38 }} />
        </div>

        <div className="screen-inner">
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>2 of 4</p>
          <h1 className="screen-title" style={{ marginBottom: 6 }}>Choose your nonprofit</h1>
          <p className="screen-subtitle" style={{ marginBottom: 18 }}>
            Your event raises participation for a verified 501(c)(3).
          </p>

          {/* Search */}
          <div className="search-wrap" style={{ marginBottom: 14 }}>
            <Search size={16} className="search-ico" />
            <input
              className="input-field"
              type="text"
              placeholder="Search nonprofits by name or cause"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          {/* Filter tabs */}
          <div className="filter-tabs" style={{ marginBottom: 16 }}>
            {FILTERS.map((f) => (
              <button
                key={f}
                className={`filter-tab ${activeFilter === f ? 'active' : ''}`}
                onClick={() => setActiveFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Nonprofit list */}
          <div>
            {filtered.map((np) => (
              <div
                key={np.id}
                className={`np-item ${selected === np.id ? 'selected-np' : ''}`}
                onClick={() => setSelected(np.id)}
              >
                <div
                  className="np-logo"
                  style={{ background: np.bg, color: 'white' }}
                >
                  {np.initials}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--dark)' }}>{np.name}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                    {np.category} · verified 501(c)(3)
                  </p>
                </div>
                {selected === np.id && (
                  <div style={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    background: 'var(--blue)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Check size={13} color="white" strokeWidth={3} />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Invite link */}
          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <button
              className="btn-ghost"
              style={{ fontSize: 14 }}
              onClick={() => showToast('Invite sent — we’ll let you know when they join')}
            >
              Don't see your nonprofit? Invite them →
            </button>
          </div>

          {/* Next */}
          <div style={{ marginTop: 24 }}>
            <button className="btn-primary" onClick={() => navigate('/event/step-3')}>
              Next →
            </button>
          </div>
        </div>
      </div>

      {toast && (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            bottom: 90,
            transform: 'translateX(-50%)',
            background: 'var(--dark)',
            color: '#fff',
            padding: '10px 18px',
            borderRadius: 'var(--radius-pill)',
            fontSize: 13,
            fontWeight: 600,
            zIndex: 100,
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            maxWidth: '80%',
            textAlign: 'center',
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}
