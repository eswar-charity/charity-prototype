import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, MapPin, Globe, Lock, Check } from 'lucide-react';
import DesktopCreateEventLayout from '../../components/desktop/DesktopCreateEventLayout';
import { useCreateEventDraft, updateDraft } from '../../hooks/useCreateEventDraft';
import { START_DATES, END_DATES, START_TIMES, END_TIMES, cycleValue } from '../../utils/eventWizard';

export default function DesktopEventStep3() {
  const navigate = useNavigate();
  const draft = useCreateEventDraft();

  return (
    <DesktopCreateEventLayout step={3}>
      <h1 className="dsk-wizard-h1">When and where?</h1>
      <p className="dsk-wizard-sub">Set the schedule and location for your gathering.</p>

      <div className="dt-grid" style={{ marginBottom: 10 }}>
        <button type="button" className="dt-box dt-box-btn" onClick={() => updateDraft({ startDate: cycleValue(START_DATES, draft.startDate) })}>
          <div className="dt-label"><Calendar size={11} color="var(--primary)" /> Start date</div>
          <div className="dt-value">{draft.startDate}</div>
        </button>
        <button type="button" className="dt-box dt-box-btn" onClick={() => updateDraft({ endDate: cycleValue(END_DATES, draft.endDate) })}>
          <div className="dt-label"><Calendar size={11} color="var(--primary)" /> End date</div>
          <div className="dt-value">{draft.endDate}</div>
        </button>
      </div>
      <div className="dt-grid" style={{ marginBottom: 24 }}>
        <button type="button" className="dt-box dt-box-btn" onClick={() => updateDraft({ startTime: cycleValue(START_TIMES, draft.startTime) })}>
          <div className="dt-label"><Clock size={11} color="var(--text-secondary)" /> Start time</div>
          <div className="dt-value">{draft.startTime}</div>
        </button>
        <button type="button" className="dt-box dt-box-btn" onClick={() => updateDraft({ endTime: cycleValue(END_TIMES, draft.endTime) })}>
          <div className="dt-label"><Clock size={11} color="var(--text-secondary)" /> End time</div>
          <div className="dt-value">{draft.endTime}</div>
        </button>
      </div>

      <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--dark)', marginBottom: 10 }}>Location</p>
      <div className="loc-wrap" style={{ marginBottom: 8 }}>
        <MapPin size={16} className="loc-ico" />
        <input
          className="input-field"
          placeholder="Event location or virtual link"
          value={draft.location}
          onChange={(e) => updateDraft({ location: e.target.value })}
        />
      </div>
      <button
        type="button"
        className="btn-ghost"
        style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, marginBottom: 24 }}
        onClick={() => updateDraft({ location: 'Waterfront Park, San Diego' })}
      >
        <MapPin size={13} color="var(--blue)" />
        <span style={{ color: 'var(--blue)' }}>Use current location</span>
      </button>

      <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--dark)', marginBottom: 12 }}>Visibility</p>
      <button type="button" className={`vis-option vis-option-btn ${draft.visibility === 'public' ? 'selected-vis' : ''}`} onClick={() => updateDraft({ visibility: 'public' })}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: draft.visibility === 'public' ? 'var(--blue-soft)' : 'var(--primary-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Globe size={18} color={draft.visibility === 'public' ? 'var(--blue)' : 'var(--primary)'} />
        </div>
        <div style={{ flex: 1, textAlign: 'left' }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--dark)' }}>Public event</p>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>Anyone can discover this and RSVP.</p>
        </div>
        <div className={`vis-check ${draft.visibility === 'public' ? 'checked' : ''}`}>
          {draft.visibility === 'public' && <Check size={12} strokeWidth={3} />}
        </div>
      </button>
      <button type="button" className={`vis-option vis-option-btn ${draft.visibility === 'private' ? 'selected-vis' : ''}`} onClick={() => updateDraft({ visibility: 'private' })}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Lock size={18} color="var(--text-secondary)" />
        </div>
        <div style={{ flex: 1, textAlign: 'left' }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--dark)' }}>Private / invite only</p>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>Only invited people can join.</p>
        </div>
        <div className={`vis-check ${draft.visibility === 'private' ? 'checked' : ''}`}>
          {draft.visibility === 'private' && <Check size={12} strokeWidth={3} />}
        </div>
      </button>

      <div className="dsk-wizard-footer">
        <button type="button" className="dsk-wizard-back-link" onClick={() => navigate('/event/step-2')}>← Back</button>
        <button type="button" className="dsk-cta-btn" onClick={() => navigate('/event/step-4')}>Next: preview →</button>
      </div>
    </DesktopCreateEventLayout>
  );
}
