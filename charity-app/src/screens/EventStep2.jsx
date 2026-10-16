import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Search, Check } from 'lucide-react';
import { useCreateEventDraft, updateDraft } from '../hooks/useCreateEventDraft';
import { useNonprofitList, useSelectedNonprofit } from '../hooks/useNonprofitList';
import { useWizardStepAccess } from '../hooks/useWizardStepAccess';
import { backWizardPath, nextWizardPath } from '../utils/changeRequestAreas';
import { isStepComplete } from '../utils/eventDraftValidation';
import useCategories from '../hooks/useCategories';
import MobileAppHeader from '../components/MobileAppHeader';

export default function EventStep2() {
  const { npFilters: NP_CATEGORY_FILTERS } = useCategories();
  const navigate = useNavigate();
  const draft = useCreateEventDraft();
  const { fixMode, allowedSteps } = useWizardStepAccess(2);
  const [activeFilter, setActiveFilter] = useState('All');
  const [query, setQuery] = useState('');
  const { nonprofits: filtered } = useNonprofitList({ q: query, category: activeFilter });
  const { nonprofit } = useSelectedNonprofit(draft.nonprofitId);
  const canNext = isStepComplete(2, draft, nonprofit);

  return (
    <div className="phone-shell">
      <div className="screen">
        <MobileAppHeader
          layout="bar"
          homePath="/feed"
          left={(
            <button type="button" className="back-btn" aria-label="Go back" onClick={() => navigate(backWizardPath(fixMode, allowedSteps, 2))}>
              <ChevronLeft size={18} />
            </button>
          )}
          meta="Step 2 of 4"
          title="Choose your nonprofit"
          subtitle="Your event raises participation for a verified 501(c)(3)."
        />

        <div className="screen-inner">
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

          <div className="filter-tabs" style={{ marginBottom: 16 }}>
            {NP_CATEGORY_FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                className={`filter-tab ${activeFilter === f ? 'active' : ''}`}
                onClick={() => setActiveFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>

          <div>
            {filtered.map((np) => (
              <div
                key={np.id}
                className={`np-item ${draft.nonprofitId === np.id ? 'selected-np' : ''}`}
                role="button"
                tabIndex={0}
                aria-pressed={draft.nonprofitId === np.id}
                aria-label={`Select ${np.name}`}
                onClick={() => updateDraft({ nonprofitId: np.id, category: np.category || null })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    updateDraft({ nonprofitId: np.id, category: np.category || null });
                  }
                }}
              >
                <div className="np-logo" style={{ background: np.bg, color: 'white' }}>
                  {np.initials}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--dark)' }}>{np.name}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                    {np.category} · verified 501(c)(3)
                  </p>
                </div>
                {draft.nonprofitId === np.id && (
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%', background: 'var(--blue)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Check size={13} color="white" strokeWidth={3} />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div style={{ marginTop: 16, textAlign: 'center' }}>
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

          <div style={{ marginTop: 24 }}>
            <button
              type="button"
              className="btn-primary"
              disabled={!canNext}
              onClick={() => {
                updateDraft({ wizardStep: 3 });
                navigate(nextWizardPath(fixMode, allowedSteps, 2));
              }}
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
