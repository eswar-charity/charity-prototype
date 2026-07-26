import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import MobileAppHeader from '../components/MobileAppHeader';
import { useAppToast, ToastHost } from '../components/Toast';
import { listMyEvents } from '../api/events';
import { beginEventDraft } from '../utils/beginEventDraft';
import { beginEventFix } from '../utils/beginEventFix';
import { wizardStepPath } from '../utils/changeRequestAreas';
import { resetDraft } from '../hooks/useCreateEventDraft';

function displayTitle(ev) {
  const title = (ev.title || '').trim();
  if (!title || /^#?untitled/i.test(title) || title === 'Untitled event') {
    return 'Untitled draft';
  }
  return title.replace(/^#/, '');
}

function snippet(ev) {
  const parts = [];
  if (ev.date) parts.push(ev.date);
  if (ev.location) parts.push(ev.location);
  return parts.join(' · ');
}

export default function EventDrafts() {
  const navigate = useNavigate();
  const { toast, show } = useAppToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listMyEvents({ statuses: ['Draft', 'Changes Requested'] });
      setItems(res.items ?? []);
    } catch (err) {
      setError(err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openEvent = (ev) => {
    try {
      if (ev.status === 'Changes Requested') {
        beginEventFix(ev);
        navigate('/event/step-4');
        return;
      }
      const result = beginEventDraft(ev);
      navigate(wizardStepPath(result?.wizardStep || 1));
    } catch (err) {
      show(err?.message || 'Could not open draft', { variant: 'error' });
    }
  };

  return (
    <div className="phone-shell">
      <div className="screen screen--split">
        <div className="screen-scroll">
          <MobileAppHeader
            layout="bar"
            homePath="/feed"
            left={(
              <button type="button" className="back-btn" aria-label="Go back" onClick={() => navigate('/feed')}>
                <ChevronLeft size={18} />
              </button>
            )}
            title="Your drafts"
            subtitle="Reopen a draft to edit, save, or submit for approval."
          />

          <div style={{ padding: '0 18px 24px' }}>
            {loading && (
              <div className="feed-loader"><span className="feed-spinner" /> Loading drafts…</div>
            )}

            {error && !loading && (
              <div className="discovery-empty" role="alert">
                <p className="discovery-empty-title">Couldn&apos;t load drafts</p>
                <p className="discovery-empty-copy">{error.message || 'Something went wrong.'}</p>
                <button type="button" className="guest-signup-btn" style={{ marginTop: 12 }} onClick={load}>
                  Try again
                </button>
              </div>
            )}

            {!loading && !error && items.length === 0 && (
              <div className="discovery-empty">
                <p className="discovery-empty-title">No drafts yet</p>
                <p className="discovery-empty-copy">Start a new event and save it anytime — it will show up here.</p>
                <button
                  type="button"
                  className="btn-primary"
                  style={{ marginTop: 16 }}
                  onClick={() => { resetDraft(); navigate('/event/step-1'); }}
                >
                  Create an event
                </button>
              </div>
            )}

            {!loading && !error && items.length > 0 && (
              <div className="card" style={{ marginTop: 4 }}>
                {items.map((ev) => {
                  const isFix = ev.status === 'Changes Requested';
                  return (
                    <div
                      key={ev.id ?? ev.key}
                      className="recent-event-row"
                      role="button"
                      tabIndex={0}
                      aria-label={`${isFix ? 'Fix' : 'Edit'} ${displayTitle(ev)}`}
                      onClick={() => openEvent(ev)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          openEvent(ev);
                        }
                      }}
                    >
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 10,
                          background: 'var(--primary-soft, #fde8e8)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <FileText size={20} color="var(--primary)" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--dark)', marginBottom: 2 }}>
                          {displayTitle(ev)}
                        </p>
                        <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                          {ev.status}
                          {snippet(ev) ? ` · ${snippet(ev)}` : ''}
                        </p>
                        <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--blue)', marginTop: 4 }}>
                          {isFix ? 'Fix & resubmit' : 'Edit draft'}
                        </p>
                      </div>
                      <ChevronRight size={16} color="var(--text-light)" />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
      <ToastHost toast={toast} />
    </div>
  );
}
