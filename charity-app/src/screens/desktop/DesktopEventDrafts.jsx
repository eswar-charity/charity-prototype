import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, ChevronRight } from 'lucide-react';
import DesktopHeader from '../../components/desktop/DesktopHeader';
import DesktopFooter from '../../components/desktop/DesktopFooter';
import { useAppToast, ToastHost } from '../../components/Toast';
import { listMyEvents } from '../../api/events';
import { beginEventDraft } from '../../utils/beginEventDraft';
import { beginEventFix } from '../../utils/beginEventFix';
import { wizardStepPath } from '../../utils/changeRequestAreas';
import { resetDraft } from '../../hooks/useCreateEventDraft';

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

export default function DesktopEventDrafts() {
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
    <div className="dsk-page">
      <DesktopHeader active="Discover" loggedIn homePath="/feed" />
      <main className="dsk-main" style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px 64px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--dark)', marginBottom: 8 }}>Your drafts</h1>
        <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 28, lineHeight: 1.5 }}>
          Reopen a draft to edit, save, or submit for approval.
        </p>

        {loading && (
          <div className="feed-loader"><span className="feed-spinner" /> Loading drafts…</div>
        )}

        {error && !loading && (
          <div role="alert">
            <p style={{ fontWeight: 700, color: 'var(--dark)' }}>Couldn&apos;t load drafts</p>
            <p style={{ color: 'var(--text-secondary)', marginTop: 6 }}>{error.message || 'Something went wrong.'}</p>
            <button type="button" className="dsk-btn-primary" style={{ marginTop: 12 }} onClick={load}>
              Try again
            </button>
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div>
            <p style={{ fontWeight: 700, color: 'var(--dark)' }}>No drafts yet</p>
            <p style={{ color: 'var(--text-secondary)', marginTop: 6 }}>
              Start a new event and save it anytime — it will show up here.
            </p>
            <button
              type="button"
              className="dsk-cta-btn"
              style={{ marginTop: 16 }}
              onClick={() => { resetDraft(); navigate('/event/step-1'); }}
            >
              Create an event
            </button>
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <div className="dsk-card" style={{ padding: 0, overflow: 'hidden' }}>
            {items.map((ev) => {
              const isFix = ev.status === 'Changes Requested';
              return (
                <button
                  key={ev.id ?? ev.key}
                  type="button"
                  onClick={() => openEvent(ev)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '16px 18px',
                    border: 'none',
                    borderBottom: '1px solid var(--border)',
                    background: 'white',
                    cursor: 'pointer',
                    textAlign: 'left',
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
                    <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--dark)', marginBottom: 2 }}>
                      {displayTitle(ev)}
                    </p>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                      {ev.status}
                      {snippet(ev) ? ` · ${snippet(ev)}` : ''}
                    </p>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--blue)', marginTop: 4 }}>
                      {isFix ? 'Fix & resubmit' : 'Edit draft'}
                    </p>
                  </div>
                  <ChevronRight size={16} color="var(--text-light)" />
                </button>
              );
            })}
          </div>
        )}
      </main>
      <DesktopFooter />
      <ToastHost toast={toast} />
    </div>
  );
}
