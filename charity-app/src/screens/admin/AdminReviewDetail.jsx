import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Check, X, ArrowUpRight, MessageSquare, ChevronLeft, Ban } from 'lucide-react';
import AdminLayout, { Badge } from '../../components/admin/AdminLayout';
import { Toast, useToast } from '../../components/admin/useToast';
import { getAdminReview, adminReviewAction, adaptReviewItem } from '../../api/admin';
import { statusTone } from '../../data/adminData';

const DECIDED = ['Approved', 'Rejected'];

const ACTION_MAP = {
  approve: { status: 'Approved', toast: 'Item approved — entity notified' },
  'request-changes': { status: 'In Review', toast: 'Changes requested — sent to submitter' },
  escalate: { status: 'Escalated', toast: 'Escalated to Founder / Operator' },
  reject: { status: 'Rejected', toast: 'Item rejected' },
  reopen: { status: 'New', toast: 'Item reopened' },
};

export default function AdminReviewDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { msg, show } = useToast();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const raw = await getAdminReview(id);
      setItem(adaptReviewItem(raw));
    } catch {
      setItem(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const decide = async (actionKey) => {
    if (!item || pending) return;
    const spec = ACTION_MAP[actionKey];
    if (!spec) return;
    setPending(true);
    try {
      const updated = await adminReviewAction(item.id, actionKey);
      setItem(adaptReviewItem(updated));
      show(spec.toast);
    } catch (err) {
      show(err?.message || 'Action failed', { variant: 'error' });
    } finally {
      setPending(false);
    }
  };

  const status = item?.status ?? '';
  const decided = DECIDED.includes(status);

  return (
    <AdminLayout active="review" title="Review Item">
      <button className="adm-back" onClick={() => navigate('/admin/review')}>
        <ChevronLeft size={16} /> Back to queue
      </button>

      {loading ? (
        <p className="adm-item-meta">Loading review item…</p>
      ) : !item ? (
        <div className="adm-empty">
          <h3>Review item not found</h3>
          <p>This item may have been removed or the link is invalid.</p>
        </div>
      ) : (
        <div className="adm-detail-grid">
          {/* Left — item detail */}
          <div>
            <div className="adm-panel">
              <div className="adm-panel-head">
                <div>
                  <span className="adm-eyebrow">{item.type} · {item.code ?? item.id}</span>
                  <p className="adm-panel-title" style={{ marginTop: 2 }}>{item.title}</p>
                </div>
                <Badge tone={statusTone(status)} dot>{status}</Badge>
              </div>
              <div className="adm-panel-body">
                <div className="adm-summary-box">{item.summary}</div>

                <div className="adm-field">
                  <span className="adm-field-label">Entity</span>
                  <span className="adm-field-value">{item.entity}</span>
                </div>
                <div className="adm-field">
                  <span className="adm-field-label">Submitted by</span>
                  <span className="adm-field-value">{item.submittedBy} · {item.submittedRole}</span>
                </div>
                <div className="adm-field">
                  <span className="adm-field-label">Priority</span>
                  <span className="adm-field-value">
                    <Badge tone={item.priority === 'High' ? 'warn' : 'muted'}>{item.priority}</Badge>
                  </span>
                </div>
              </div>
            </div>

            <div className="adm-panel">
              <div className="adm-panel-head"><span className="adm-panel-title">Verification checks</span></div>
              <div className="adm-panel-body">
                {item.checks.map((c, i) => (
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
                <button className="adm-btn adm-btn-ghost" disabled={pending} onClick={() => decide('reopen')}>
                  Reopen item
                </button>
              </>
            ) : (
              <div className="adm-action-stack">
                <button className="adm-btn adm-btn-primary" disabled={pending} onClick={() => decide('approve')}>
                  <Check size={15} /> Approve
                </button>
                <button className="adm-btn adm-btn-secondary" disabled={pending} onClick={() => decide('request-changes')}>
                  <MessageSquare size={15} /> Request changes
                </button>
                <button className="adm-btn adm-btn-ghost" disabled={pending} onClick={() => decide('escalate')}>
                  <ArrowUpRight size={15} /> Escalate
                </button>
                <button className="adm-btn adm-btn-danger" disabled={pending} onClick={() => decide('reject')}>
                  <Ban size={15} /> Reject
                </button>
              </div>
            )}

            <p className="adm-item-meta" style={{ marginTop: 16 }}>
              Decisions are logged to the <button className="adm-link" onClick={() => navigate('/admin/audit')}>audit trail</button>.
            </p>
          </div>
        </div>
      )}

      <Toast msg={msg} />
    </AdminLayout>
  );
}
