import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Plus } from 'lucide-react';
import AdminLayout, { Badge } from '../../components/admin/AdminLayout';
import { Toast, useToast } from '../../components/admin/useToast';
import { listAdminNonprofits, adaptAdminNonprofit } from '../../api/admin';
import InvitePanel from '../../components/admin/InvitePanel';
import { statusTone } from '../../utils/adminStatus';

const FILTERS = ['All', 'Active', 'Verified', 'Pending Verification', 'Submitted', 'Rejected', 'Suspended'];
const money = (n) => '$' + n.toLocaleString('en-US');

export default function AdminNonprofits() {
  const navigate = useNavigate();
  const { msg, show } = useToast();
  const [filter, setFilter] = useState('All');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const status = filter === 'All' ? undefined : filter;
      const res = await listAdminNonprofits({ status, limit: 100 });
      setRows((res?.items ?? []).map(adaptAdminNonprofit));
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const exportCsv = () => {
    const header = ['Organization', 'EIN', 'Category', 'Status', 'Settlement'];
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const csv = [header, ...rows.map((n) => [n.name, n.ein, n.category, n.status, n.settlement])]
      .map((r) => r.map(esc).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nonprofits.csv';
    a.click();
    URL.revokeObjectURL(url);
    show(`Exported ${rows.length} nonprofits`);
  };

  const onKey = (fn) => (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(); }
  };

  return (
    <AdminLayout
      active="nonprofits"
      title="Nonprofits"
      actions={
        <>
          <button className="adm-btn adm-btn-ghost adm-btn-sm" onClick={exportCsv}>
            <Download size={14} /> Export
          </button>
          <button className="adm-btn adm-btn-primary adm-btn-sm" onClick={() => setShowInvite((v) => !v)}>
            <Plus size={14} /> Invite nonprofit
          </button>
        </>
      }
    >
      {showInvite && (
        <InvitePanel onClose={() => setShowInvite(false)} onDone={load} notify={show} />
      )}

      <div className="adm-tabs">
        {FILTERS.map((f) => (
          <button key={f} className={`adm-tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>{f}</button>
        ))}
      </div>

      <div className="adm-panel">
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Organization</th><th>EIN</th><th>Category</th>
                <th>Status</th><th>Settlement</th><th>Events</th><th>Raised</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="adm-td-muted">Loading nonprofits…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={7} className="adm-td-muted">No nonprofits match this filter.</td></tr>
              ) : (
                rows.map((n) => (
                  <tr key={n.id} className="adm-row-click" role="button" tabIndex={0} aria-label={`View ${n.name}`} onClick={() => navigate(`/admin/nonprofits/${n.id}`)} onKeyDown={onKey(() => navigate(`/admin/nonprofits/${n.id}`))}>
                    <td>
                      <div className="adm-entity">
                        <span className="adm-ava">{n.initials}</span>
                        <span className="adm-td-strong">{n.name}</span>
                      </div>
                    </td>
                    <td className="adm-td-muted">{n.ein}</td>
                    <td className="adm-td-muted">{n.category}</td>
                    <td><Badge tone={statusTone(n.status)} dot>{n.status}</Badge></td>
                    <td><Badge tone={statusTone(n.settlement)}>{n.settlement}</Badge></td>
                    <td>{n.events}</td>
                    <td className="adm-td-strong">{money(n.raised)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Toast msg={msg} />
    </AdminLayout>
  );
}
