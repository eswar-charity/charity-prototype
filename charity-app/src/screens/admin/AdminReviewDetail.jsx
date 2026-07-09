import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Check, X, ArrowUpRight, MessageSquare, ChevronLeft, Ban } from 'lucide-react';
import AdminLayout, { Badge } from '../../components/admin/AdminLayout';
import { Toast, useToast } from '../../components/admin/useToast';
import { reviewQueue, statusTone } from '../../data/adminData';

export default function AdminReviewDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { msg, show } = useToast();
  const base = reviewQueue.find((r) => r.id === id) || reviewQueue[0];
  const [status, setStatus] = useState(base.status);

  const decide = (next, label) => { setStatus(next); show(label); };

  const decided = ['Approved', 'Rejected', 'Closed'].includes(status);

  return (
    <AdminLayout active="review" title="Review Item">
      <button className="adm-back" onClick={() => navigate('/admin/review')}>
        <ChevronLeft size={16} /> Back to queue
      </button>

      <div className="adm-detail-grid">
        {/* Left — item detail */}
        <div>
          <div className="adm-panel">
            <div className="adm-panel-head">
              <div>
                <span className="adm-eyebrow">{base.type} · {base.id}</span>
                <p className="adm-panel-title" style={{ marginTop: 2 }}>{base.title}</p>
              </div>
              <Badge tone={statusTone(status)} dot>{status}</Badge>
            </div>
            <div className="adm-panel-body">
              <div className="adm-summary-box">{base.summary}</div>

              <div className="adm-field">
                <span className="adm-field-label">Entity</span>
                <span className="adm-field-value">{base.entity}</span>
              </div>
              <div className="adm-field">
                <span className="adm-field-label">Submitted by</span>
                <span className="adm-field-value">{base.submittedBy} · {base.submittedRole}</span>
              </div>
              <div className="adm-field">
                <span className="adm-field-label">Submitted</span>
                <span className="adm-field-value">{base.submittedAt}</span>
              </div>
              <div className="adm-field">
                <span className="adm-field-label">Priority</span>
                <span className="adm-field-value">
                  <Badge tone={base.priority === 'High' ? 'warn' : 'muted'}>{base.priority}</Badge>
                </span>
              </div>
            </div>
          </div>

          <div className="adm-panel">
            <div className="adm-panel-head"><span className="adm-panel-title">Verification checks</span></div>
            <div className="adm-panel-body">
              {base.checks.map((c, i) => (
                <div className="adm-check" key={i}>
                  <span className={`adm-check-ico ${c.ok ? 'ok' : 'no'}`}>{c.ok ? <Check size={13} /> : <X size={13} />}</span>
                  <span style={{ flex: 1 }}>{c.label}</span>
                  <Badge tone={c.ok ? 'ok' : 'danger'}>{c.ok ? 'Pass' : 'Needs attention'}</Badge>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right — decision rail */}
        <div className="adm-action-card">
          <h4>Decision</h4>
          {decided ? (
            <>
              <div className="adm-summary-box" style={{ marginBottom: 14 }}>
                This item is <strong>{status.toLowerCase()}</strong> and closed. Reopen it to change the outcome.
              </div>
              <button className="adm-btn adm-btn-ghost" onClick={() => { setStatus('In Review'); show('Item reopened'); }}>
                Reopen item
              </button>
            </>
          ) : (
            <div className="adm-action-stack">
              <button className="adm-btn adm-btn-primary" onClick={() => decide('Approved', 'Item approved — entity notified')}>
                <Check size={15} /> Approve
              </button>
              <button className="adm-btn adm-btn-secondary" onClick={() => decide('In Review', 'Changes requested — sent to submitter')}>
                <MessageSquare size={15} /> Request changes
              </button>
              <button className="adm-btn adm-btn-ghost" onClick={() => decide('Escalated', 'Escalated to Founder / Operator')}>
                <ArrowUpRight size={15} /> Escalate
              </button>
              <button className="adm-btn adm-btn-danger" onClick={() => decide('Rejected', 'Item rejected')}>
                <Ban size={15} /> Reject
              </button>
            </div>
          )}

          <p className="adm-item-meta" style={{ marginTop: 16 }}>
            Decisions are logged to the <button className="adm-link" onClick={() => navigate('/admin/audit')}>audit trail</button>.
          </p>
        </div>
      </div>

      <Toast msg={msg} />
    </AdminLayout>
  );
}
