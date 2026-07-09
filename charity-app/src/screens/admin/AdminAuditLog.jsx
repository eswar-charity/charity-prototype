import { useState } from 'react';
import { Download, ShieldCheck, AlertTriangle, Gavel, Flag, MessageSquare, CircleDot } from 'lucide-react';
import AdminLayout, { Badge } from '../../components/admin/AdminLayout';
import { Toast, useToast } from '../../components/admin/useToast';
import { auditLog } from '../../data/adminData';

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
  const rows = auditLog.filter((r) => cat === 'All' || r.category === cat);

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
        {rows.map((r) => (
          <div key={r.id} className="adm-item">
            <div className={`adm-item-icon ${catTone(r.category) === 'danger' ? 'danger' : catTone(r.category) === 'warn' ? 'warn' : ''}`}>{catIcon(r.category)}</div>
            <div className="adm-item-body">
              <p className="adm-item-title">{r.action} — {r.target}</p>
              <p className="adm-item-meta"><span>{r.actor}</span>·<span>{r.role}</span>·<span>{r.at}</span></p>
            </div>
            <div className="adm-item-side"><Badge tone={catTone(r.category)}>{r.category}</Badge></div>
          </div>
        ))}
      </div>

      <Toast msg={msg} />
    </AdminLayout>
  );
}
