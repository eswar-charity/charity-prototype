import { useNavigate } from 'react-router-dom';
import { X, Heart, Calendar, MapPin } from 'lucide-react';
import { useCreateEventDraft } from '../../hooks/useCreateEventDraft';
import { nonprofits } from '../../data/mockData';
import Logo from '../Logo';

const STEPS = [
  { id: 1, label: 'Media & story', path: '/event/step-1' },
  { id: 2, label: 'Choose nonprofit', path: '/event/step-2' },
  { id: 3, label: 'Date & location', path: '/event/step-3' },
  { id: 4, label: 'Preview & submit', path: '/event/step-4' },
];

function LivePreviewCard() {
  const draft = useCreateEventDraft();
  const nonprofit = nonprofits.find((n) => n.id === draft.nonprofitId);
  const hasLocation = Boolean(draft.location);

  return (
    <div className="dsk-wizard-preview-card">
      <div className="dsk-wizard-preview-hero" style={{ backgroundImage: `url(${draft.photos[0]?.src})` }}>
        <span className="dsk-wizard-draft-badge">DRAFT</span>
      </div>
      <div className="dsk-wizard-preview-body">
        <p className="dsk-wizard-preview-title">#CharityBaby</p>
        <p className="dsk-wizard-preview-sub">for {nonprofit ? nonprofit.name : '[Nonprofit]'} · by You</p>

        {hasLocation ? (
          <div className="dsk-wizard-preview-meta">
            <span><Calendar size={12} /> {draft.startDate}</span>
            {draft.location && <span><MapPin size={12} /> {draft.location}</span>}
          </div>
        ) : (
          <div className="dsk-wizard-preview-status">
            <div>
              <p className="dsk-wizard-preview-status-lbl">Status</p>
              <p className="dsk-wizard-preview-status-val">0 backing</p>
            </div>
            <Heart size={16} color="var(--primary)" />
          </div>
        )}
      </div>
    </div>
  );
}

export default function DesktopCreateEventLayout({ step, children, hidePreview = false }) {
  const navigate = useNavigate();

  return (
    <div className="dsk-page dsk-wizard-page">
      <div className="dsk-wizard-topbar">
        <Logo height={24} tone="dark" onClick={() => navigate('/guest/feed')} style={{ cursor: 'pointer' }} />
        <h2 className="dsk-wizard-topbar-title">Create an event</h2>
        <div className="dsk-wizard-topbar-actions">
          <button className="dsk-wizard-save-btn" onClick={() => navigate('/approval')}>Save draft</button>
          <button className="dsk-wizard-close-btn" onClick={() => navigate('/guest/feed')} aria-label="Close"><X size={18} /></button>
        </div>
      </div>

      <div className={`dsk-wizard-body ${hidePreview ? 'no-preview' : ''}`}>
        <nav className="dsk-wizard-rail">
          {STEPS.map((s) => (
            <div
              key={s.id}
              className={`dsk-wizard-rail-item ${step === s.id ? 'active' : ''} ${step > s.id ? 'done' : ''}`}
              onClick={() => navigate(s.path)}
            >
              <span className="dsk-wizard-rail-num">{step > s.id ? '✓' : s.id}</span>
              <span className="dsk-wizard-rail-label">{s.label}</span>
            </div>
          ))}
        </nav>

        <div className="dsk-wizard-content">{children}</div>

        {!hidePreview && (
          <aside className="dsk-wizard-preview">
            <p className="dsk-wizard-preview-lbl">LIVE PREVIEW</p>
            <LivePreviewCard />
          </aside>
        )}
      </div>
    </div>
  );
}
