import { useCallback, useEffect, useState } from 'react';
import { RotateCcw, ArrowUpRight, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AdminLayout, { Badge } from '../../components/admin/AdminLayout';
import { Toast, useToast } from '../../components/admin/useToast';
import { listAdminExceptions, adminExceptionAction, adaptExceptionItem } from '../../api/admin';
import { statusTone } from '../../utils/adminStatus';

const money = (n) => '$' + n.toLocaleString('en-US');

const ACTION_MAP = {
  escalate: (code) => `${code} escalated to Founder / Operator`,
  resolve: (code) => `${code} marked resolved`,
  reopen: (code) => `${code} reopened`,
};

export default function AdminExceptions() {
  const navigate = useNavigate();
  const { msg, show } = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingId, setPendingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listAdminExceptions();
      setRows((data ?? []).map(adaptExceptionItem));
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const act = async (ex, actionKey) => {
    if (pendingId) return;
    setPendingId(ex.rawId);
    try {
      const updated = await adminExceptionAction(ex.rawId, actionKey);
      setRows((r) => r.map((x) => (x.rawId === ex.rawId ? adaptExceptionItem(updated) : x)));
      show(ACTION_MAP[actionKey]?.(ex.id) ?? 'Exception updated');
    } catch (err) {
      show(err?.message || 'Action failed', { variant: 'error' });
    } finally {
      setPendingId(null);
    }
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
              {loading ? (
                <tr><td colSpan={8} className="adm-td-muted">Loading exceptions…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={8} className="adm-td-muted">No open exceptions.</td></tr>
              ) : (
                rows.map((ex) => {
                  const resolved = ex.status === 'Resolved';
                  const busy = pendingId === ex.rawId;
                  return (
                    <tr key={ex.rawId}>
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
                            <button className="adm-btn adm-btn-ghost adm-btn-sm" disabled={busy} onClick={() => act(ex, 'escalate')}>
                              <ArrowUpRight size={13} /> Escalate
                            </button>
                            <button className="adm-btn adm-btn-primary adm-btn-sm" disabled={busy} onClick={() => act(ex, 'resolve')}>
                              <Check size={13} /> Resolve
                            </button>
                          </>
                        ) : (
                          <button className="adm-btn adm-btn-ghost adm-btn-sm" disabled={busy} onClick={() => act(ex, 'reopen')}>
                            <RotateCcw size={13} /> Reopen
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
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
