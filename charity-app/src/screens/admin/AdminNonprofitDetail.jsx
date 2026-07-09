import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, ShieldCheck, Ban, RefreshCw, Building2 } from 'lucide-react';
import AdminLayout, { Badge } from '../../components/admin/AdminLayout';
import { Toast, useToast } from '../../components/admin/useToast';
import { adminNonprofits, adminEvents, statusTone } from '../../data/adminData';

const money = (n) => '$' + n.toLocaleString('en-US');

export default function AdminNonprofitDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { msg, show } = useToast();
  const np = adminNonprofits.find((n) => String(n.id) === id) || adminNonprofits[0];
  const [status, setStatus] = useState(np.status);

  const setAndToast = (next, label) => { setStatus(next); show(label); };
  const events = adminEvents.filter((e) => e.nonprofit === np.name);

  const canVerify = ['Submitted', 'Pending Verification'].includes(status);
  const isSuspended = status === 'Suspended';

  return (
    <AdminLayout active="nonprofits" title="Nonprofit">
      <button className="adm-back" onClick={() => navigate('/admin/nonprofits')}>
        <ChevronLeft size={16} /> Back to nonprofits
      </button>

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
              <div className="adm-field"><span className="adm-field-label">Events hosted</span><span className="adm-field-value">{np.events}</span></div>
              <div className="adm-field"><span className="adm-field-label">Total raised</span><span className="adm-field-value">{money(np.raised)}</span></div>
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

        {/* Governance actions */}
        <div className="adm-action-card">
          <h4>Governance</h4>
          <div className="adm-action-stack">
            {canVerify && (
              <button className="adm-btn adm-btn-primary" onClick={() => setAndToast('Active', 'Nonprofit verified & activated')}>
                <ShieldCheck size={15} /> Verify &amp; activate
              </button>
            )}
            {canVerify && (
              <button className="adm-btn adm-btn-danger" onClick={() => setAndToast('Rejected', 'Verification rejected')}>
                <Ban size={15} /> Reject verification
              </button>
            )}
            {!canVerify && !isSuspended && (
              <button className="adm-btn adm-btn-danger" onClick={() => setAndToast('Suspended', 'Nonprofit suspended — payouts frozen')}>
                <Ban size={15} /> Suspend nonprofit
              </button>
            )}
            {isSuspended && (
              <button className="adm-btn adm-btn-primary" onClick={() => setAndToast('Active', 'Nonprofit reinstated')}>
                <RefreshCw size={15} /> Reinstate
              </button>
            )}
            <button className="adm-btn adm-btn-ghost" onClick={() => show('Re-ran EIN check against IRS / GuideStar')}>
              <RefreshCw size={15} /> Re-run EIN check
            </button>
          </div>
          <p className="adm-item-meta" style={{ marginTop: 16 }}>
            EIN must resolve against IRS, GuideStar, FDO, or Charity Navigator. No manual fallback.
          </p>
        </div>
      </div>

      <Toast msg={msg} />
    </AdminLayout>
  );
}
