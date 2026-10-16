import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, ShieldCheck, Ban, RefreshCw, Building2 } from 'lucide-react';
import AdminLayout, { Badge } from '../../components/admin/AdminLayout';
import { Toast, useToast } from '../../components/admin/useToast';
import InvitePanel from '../../components/admin/InvitePanel';
import {
  getAdminNonprofit, adminNonprofitAction, listAdminEvents, adaptAdminNonprofit, adaptAdminEvent,
} from '../../api/admin';
import { statusTone } from '../../utils/adminStatus';

const money = (n) => '$' + n.toLocaleString('en-US');

const ACTION_MAP = {
  verify: { toast: 'Nonprofit verified & activated' },
  reject: { toast: 'Verification rejected' },
  suspend: { toast: 'Nonprofit suspended — payouts frozen' },
  reinstate: { toast: 'Nonprofit reinstated' },
  'rerun-ein': { toast: 'Re-ran EIN check against IRS / GuideStar' },
};

export default function AdminNonprofitDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { msg, show } = useToast();
  const [np, setNp] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [showInvite, setShowInvite] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [raw, allEvents] = await Promise.all([
        getAdminNonprofit(id),
        listAdminEvents().catch(() => []),
      ]);
      const adapted = adaptAdminNonprofit(raw);
      setNp(adapted);
      const npId = Number(id);
      setEvents(
        (allEvents ?? [])
          .map(adaptAdminEvent)
          .filter((e) => e.nonprofitId === npId || e.nonprofit === adapted.name),
      );
    } catch {
      setNp(null);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const act = async (actionKey) => {
    if (!np || pending) return;
    const spec = ACTION_MAP[actionKey];
    if (!spec) return;
    setPending(true);
    try {
      const updated = await adminNonprofitAction(np.id, actionKey);
      setNp(adaptAdminNonprofit(updated));
      show(spec.toast);
    } catch (err) {
      show(err?.message || 'Action failed', { variant: 'error' });
    } finally {
      setPending(false);
    }
  };

  const status = np?.status ?? '';
  const canVerify = ['Submitted', 'Pending Verification'].includes(status);
  const isSuspended = status === 'Suspended';

  return (
    <AdminLayout active="nonprofits" title="Nonprofit">
      <button className="adm-back" onClick={() => navigate('/admin/nonprofits')}>
        <ChevronLeft size={16} /> Back to nonprofits
      </button>

      {showInvite && np && (
        <InvitePanel nonprofit={np} onClose={() => setShowInvite(false)} notify={show} />
      )}

      {loading ? (
        <p className="adm-item-meta">Loading nonprofit…</p>
      ) : !np ? (
        <div className="adm-empty">
          <h3>Nonprofit not found</h3>
          <p>This organization may have been removed or the link is invalid.</p>
        </div>
      ) : (
        <div className="adm-detail-grid">
          <div>
            <div className="adm-panel">
              <div className="adm-panel-head">
                <div className="adm-entity">
                  <span className="adm-ava navy" style={{ width: 44, height: 44, fontSize: 15 }}>{np.initials}</span>
                  <div>
                    <p className="adm-panel-title">{np.name}</p>
                    <p className="adm-item-meta">{np.category} · Submitted {np.submittedAt}</p>
                  </div>
                </div>
                <Badge tone={statusTone(status)} dot>{status}</Badge>
              </div>
              <div className="adm-panel-body">
                <div className="adm-field"><span className="adm-field-label">EIN</span><span className="adm-field-value">{np.ein}</span></div>
                <div className="adm-field"><span className="adm-field-label">Verification source</span><span className="adm-field-value">{np.source}</span></div>
                <div className="adm-field"><span className="adm-field-label">Settlement readiness</span><span className="adm-field-value"><Badge tone={statusTone(np.settlement)}>{np.settlement}</Badge></span></div>
                <div className="adm-field"><span className="adm-field-label">Events hosted</span><span className="adm-field-value">{events.length || np.events}</span></div>
                <div className="adm-field"><span className="adm-field-label">Total raised</span><span className="adm-field-value">{money(events.reduce((s, e) => s + e.raised, 0) || np.raised)}</span></div>
              </div>
            </div>

            <div className="adm-panel">
              <div className="adm-panel-head">
                <span className="adm-panel-title">Events</span>
                <button className="adm-link" onClick={() => navigate('/admin/events')}>All events</button>
              </div>
              {events.length === 0 ? (
                <div className="adm-empty">
                  <div className="adm-empty-ico"><Building2 size={24} /></div>
                  <h3>No events yet</h3>
                  <p>This nonprofit has not published any events.</p>
                </div>
              ) : (
                <div className="adm-table-wrap">
                  <table className="adm-table">
                    <thead><tr><th>Event</th><th>Type</th><th>Status</th><th>Raised</th></tr></thead>
                    <tbody>
                      {events.map((e) => (
                        <tr key={e.id}>
                          <td className="adm-td-strong">{e.title}</td>
                          <td className="adm-td-muted">{e.kind}</td>
                          <td><Badge tone={statusTone(e.status)} dot>{e.status}</Badge></td>
                          <td>{money(e.raised)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="adm-action-card">
            <h4>Governance</h4>
            <div className="adm-action-stack">
              {canVerify && (
                <button className="adm-btn adm-btn-primary" disabled={pending} onClick={() => act('verify')}>
                  <ShieldCheck size={15} /> Verify &amp; activate
                </button>
              )}
              {canVerify && (
                <button className="adm-btn adm-btn-danger" disabled={pending} onClick={() => act('reject')}>
                  <Ban size={15} /> Reject verification
                </button>
              )}
              {!canVerify && !isSuspended && (
                <button className="adm-btn adm-btn-danger" disabled={pending} onClick={() => act('suspend')}>
                  <Ban size={15} /> Suspend nonprofit
                </button>
              )}
              {isSuspended && (
                <button className="adm-btn adm-btn-primary" disabled={pending} onClick={() => act('reinstate')}>
                  <RefreshCw size={15} /> Reinstate
                </button>
              )}
              <button className="adm-btn adm-btn-ghost" onClick={() => setShowInvite(true)}>
                <ShieldCheck size={15} /> Invite nonprofit admin
              </button>
              <button className="adm-btn adm-btn-ghost" disabled={pending} onClick={() => act('rerun-ein')}>
                <RefreshCw size={15} /> Re-run EIN check
              </button>
            </div>
            <p className="adm-item-meta" style={{ marginTop: 16 }}>
              EIN must resolve against IRS, GuideStar, FDO, or Charity Navigator. No manual fallback.
            </p>
          </div>
        </div>
      )}

      <Toast msg={msg} />
    </AdminLayout>
  );
}
