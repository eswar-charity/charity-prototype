import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Plus } from 'lucide-react';
import AdminLayout, { Badge } from '../../components/admin/AdminLayout';
import { Toast, useToast } from '../../components/admin/useToast';
import { adminNonprofits, statusTone } from '../../data/adminData';

const FILTERS = ['All', 'Active', 'Verified', 'Pending Verification', 'Submitted', 'Rejected', 'Suspended'];
const money = (n) => '$' + n.toLocaleString('en-US');

export default function AdminNonprofits() {
  const navigate = useNavigate();
  const { msg, show } = useToast();
  const [filter, setFilter] = useState('All');

  const rows = adminNonprofits.filter((n) => filter === 'All' || n.status === filter);

  return (
    <AdminLayout
      active="nonprofits"
      title="Nonprofits"
      actions={
        <>
          <button className="adm-btn adm-btn-ghost adm-btn-sm" onClick={() => show('Exporting nonprofit register…')}>
            <Download size={14} /> Export
          </button>
          <button className="adm-btn adm-btn-primary adm-btn-sm" onClick={() => show('Invite sent to nonprofit contact')}>
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
              {rows.map((n) => (
                <tr key={n.id} className="adm-row-click" onClick={() => navigate(`/admin/nonprofits/${n.id}`)}>
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
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Toast msg={msg} />
    </AdminLayout>
  );
}
