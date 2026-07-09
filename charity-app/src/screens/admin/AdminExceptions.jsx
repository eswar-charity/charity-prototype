import { useState } from 'react';
import { RotateCcw, ArrowUpRight, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AdminLayout, { Badge } from '../../components/admin/AdminLayout';
import { Toast, useToast } from '../../components/admin/useToast';
import { exceptions as seed, statusTone } from '../../data/adminData';

const money = (n) => '$' + n.toLocaleString('en-US');

export default function AdminExceptions() {
  const navigate = useNavigate();
  const { msg, show } = useToast();
  const [rows, setRows] = useState(seed);

  const update = (id, status, label) => {
    setRows((r) => r.map((x) => (x.id === id ? { ...x, status } : x)));
    show(label);
  };

  return (
    <AdminLayout active="exceptions" title="Exceptions">
      <p className="adm-summary-box" style={{ maxWidth: 720 }}>
        Payment, payout, donation, and content edge cases that need human resolution. Escalate anything that
        touches settlement or compliance to the Founder / Operator.
      </p>

      <div className="adm-panel">
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr><th>ID</th><th>Issue</th><th>Type</th><th>Entity</th><th>Severity</th><th>Amount</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {rows.map((ex) => {
                const resolved = ex.status === 'Resolved';
                return (
                  <tr key={ex.id}>
                    <td className="adm-td-muted">{ex.id}</td>
                    <td className="adm-td-strong">{ex.title}</td>
                    <td className="adm-td-muted">{ex.type}</td>
                    <td className="adm-td-muted">{ex.entity}</td>
                    <td><Badge tone={ex.severity === 'High' ? 'danger' : ex.severity === 'Medium' ? 'warn' : 'muted'}>{ex.severity}</Badge></td>
                    <td>{ex.amount > 0 ? money(ex.amount) : '—'}</td>
                    <td><Badge tone={statusTone(ex.status)} dot>{ex.status}</Badge></td>
                    <td className="adm-td-actions">
                      {!resolved ? (
                        <>
                          <button className="adm-btn adm-btn-ghost adm-btn-sm" onClick={() => update(ex.id, 'Escalated', `${ex.id} escalated to Founder / Operator`)}>
                            <ArrowUpRight size={13} /> Escalate
                          </button>
                          <button className="adm-btn adm-btn-primary adm-btn-sm" onClick={() => update(ex.id, 'Resolved', `${ex.id} marked resolved`)}>
                            <Check size={13} /> Resolve
                          </button>
                        </>
                      ) : (
                        <button className="adm-btn adm-btn-ghost adm-btn-sm" onClick={() => update(ex.id, 'In Review', `${ex.id} reopened`)}>
                          <RotateCcw size={13} /> Reopen
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p className="adm-item-meta">
        Every resolution is written to the <button className="adm-link" onClick={() => navigate('/admin/audit')}>audit trail</button>.
      </p>

      <Toast msg={msg} />
    </AdminLayout>
  );
}
