import { useCallback, useEffect, useState } from 'react';
import { Download, ShieldCheck, AlertTriangle, Gavel, Flag, MessageSquare, CircleDot } from 'lucide-react';
import AdminLayout, { Badge } from '../../components/admin/AdminLayout';
import { Toast, useToast } from '../../components/admin/useToast';
import { listAdminAudit, adaptAuditEntry } from '../../api/admin';

const CATS = ['All', 'Approval', 'Verification', 'Exception', 'Moderation', 'Governance'];

const catIcon = (c) => {
  switch (c) {
    case 'Verification': return <ShieldCheck size={15} />;
    case 'Exception': return <AlertTriangle size={15} />;
    case 'Governance': return <Gavel size={15} />;
    case 'Moderation': return <Flag size={15} />;
    case 'Approval': return <MessageSquare size={15} />;
    default: return <CircleDot size={15} />;
  }
};
const catTone = (c) => ({ Verification: 'ok', Exception: 'danger', Governance: 'warn', Moderation: 'warn', Approval: 'info' }[c] || 'muted');

export default function AdminAuditLog() {
  const { msg, show } = useToast();
  const [cat, setCat] = useState('All');
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const category = cat === 'All' ? undefined : cat;
      const data = await listAdminAudit({ category });
      setEntries((data ?? []).map(adaptAuditEntry));
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [cat]);

  useEffect(() => { load(); }, [load]);

  return (
    <AdminLayout
      active="audit"
      title="Audit Log"
      actions={
        <button className="adm-btn adm-btn-ghost adm-btn-sm" onClick={() => show('Exporting audit log (CSV)…')}>
          <Download size={14} /> Export
        </button>
      }
    >
      <div className="adm-tabs">
        {CATS.map((c) => (
          <button key={c} className={`adm-tab ${cat === c ? 'active' : ''}`} onClick={() => setCat(c)}>{c}</button>
        ))}
      </div>

      <div className="adm-panel">
        <div className="adm-panel-head"><span className="adm-panel-title">Action history</span></div>
        {loading ? (
          <p className="adm-item-meta" style={{ padding: 16 }}>Loading audit log…</p>
        ) : entries.length === 0 ? (
          <div className="adm-empty">
            <h3>No audit entries</h3>
            <p>Platform actions will appear here as admins take decisions.</p>
          </div>
        ) : (
          entries.map((r) => (
            <div key={r.id} className="adm-item">
              <div className={`adm-item-icon ${catTone(r.category) === 'danger' ? 'danger' : catTone(r.category) === 'warn' ? 'warn' : ''}`}>{catIcon(r.category)}</div>
              <div className="adm-item-body">
                <p className="adm-item-title">{r.action} — {r.target}</p>
                <p className="adm-item-meta"><span>{r.actor}</span>·<span>{r.role}</span>·<span>{r.at}</span></p>
              </div>
              <div className="adm-item-side"><Badge tone={catTone(r.category)}>{r.category}</Badge></div>
            </div>
          ))
        )}
      </div>

      <Toast msg={msg} />
    </AdminLayout>
  );
}
