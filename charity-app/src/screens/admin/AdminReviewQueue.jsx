import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Clock, ShieldCheck, Flag, AlertTriangle, Users } from 'lucide-react';
import AdminLayout, { Badge } from '../../components/admin/AdminLayout';
import { reviewQueue, statusTone } from '../../data/adminData';

const FILTERS = ['All', 'New', 'In Review', 'Escalated', 'Approved', 'Rejected'];

const typeIcon = (type) => {
  if (type === 'Content Flag') return <Flag size={17} />;
  if (type === 'Payout Exception') return <AlertTriangle size={17} />;
  if (type === 'Nonprofit Verification') return <ShieldCheck size={17} />;
  if (type === 'Minor SE Consent') return <Users size={17} />;
  return <Clock size={17} />;
};

export default function AdminReviewQueue() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('All');

  const items = reviewQueue.filter((r) => filter === 'All' || r.status === filter);
  const countFor = (f) => (f === 'All' ? reviewQueue.length : reviewQueue.filter((r) => r.status === f).length);
  const onKey = (fn) => (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(); }
  };

  return (
    <AdminLayout active="review" title="Review Queue">
      <div className="adm-tabs">
        {FILTERS.map((f) => (
          <button key={f} className={`adm-tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
            {f}<span className="adm-tab-count">{countFor(f)}</span>
          </button>
        ))}
      </div>

      <div className="adm-panel">
        <div className="adm-panel-head">
          <span className="adm-panel-title">{filter === 'All' ? 'All items' : filter} · {items.length}</span>
        </div>

        {items.length === 0 ? (
          <div className="adm-empty">
            <div className="adm-empty-ico"><ShieldCheck size={26} /></div>
            <h3>Queue clear</h3>
            <p>No {filter.toLowerCase()} items right now. New submissions land here automatically.</p>
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="adm-item clickable" role="button" tabIndex={0} aria-label={`Open ${item.title}`} onClick={() => navigate(`/admin/review/${item.id}`)} onKeyDown={onKey(() => navigate(`/admin/review/${item.id}`))}>
              <div className={`adm-item-icon ${item.priority === 'High' ? 'warn' : ''}`}>{typeIcon(item.type)}</div>
              <div className="adm-item-body">
                <p className="adm-item-title">{item.title}</p>
                <p className="adm-item-meta">
                  <span>{item.id}</span>·<span>{item.type}</span>·
                  <span>{item.submittedBy} ({item.submittedRole})</span>·<span>{item.submittedAt}</span>
                </p>
              </div>
              <div className="adm-item-side">
                <Badge tone={statusTone(item.status)} dot>{item.status}</Badge>
                <span className="adm-link">Open <ArrowRight size={13} /></span>
              </div>
            </div>
          ))
        )}
      </div>
    </AdminLayout>
  );
}
