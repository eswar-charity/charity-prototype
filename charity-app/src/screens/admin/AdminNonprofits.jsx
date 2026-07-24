import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Plus } from 'lucide-react';
import AdminLayout, { Badge } from '../../components/admin/AdminLayout';
import { Toast, useToast } from '../../components/admin/useToast';
import { listAdminNonprofits, inviteNonprofit, adaptAdminNonprofit } from '../../api/admin';
import { statusTone } from '../../data/adminData';

const FILTERS = ['All', 'Active', 'Verified', 'Pending Verification', 'Submitted', 'Rejected', 'Suspended'];
const money = (n) => '$' + n.toLocaleString('en-US');

export default function AdminNonprofits() {
  const navigate = useNavigate();
  const { msg, show } = useToast();
  const [filter, setFilter] = useState('All');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);

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

  const onKey = (fn) => (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(); }
  };

  const handleInvite = async () => {
    const name = window.prompt('Nonprofit name');
    if (!name?.trim()) return;
    const category = window.prompt('Category', 'Community')?.trim() || 'Community';
    setInviting(true);
    try {
      await inviteNonprofit({ name: name.trim(), category });
      show('Invite sent to nonprofit contact');
      await load();
    } catch (err) {
      show(err?.message || 'Invite failed', { variant: 'error' });
    } finally {
      setInviting(false);
    }
  };

  return (
    <AdminLayout
      active="nonprofits"
      title="Nonprofits"
      actions={
        <>
          <button className="adm-btn adm-btn-ghost adm-btn-sm" onClick={() => show('Exporting nonprofit register…')}>
            <Download size={14} /> Export
          </button>
          <button className="adm-btn adm-btn-primary adm-btn-sm" disabled={inviting} onClick={handleInvite}>
            <Plus size={14} /> Invite nonprofit
          </button>
        </>
      }
    >
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
