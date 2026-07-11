import { useNavigate } from 'react-router-dom';
import {
  Clock, ShieldCheck, AlertTriangle, Flag, ArrowRight,
  Building2, CalendarRange, ScrollText,
} from 'lucide-react';
import AdminLayout, { Badge } from '../../components/admin/AdminLayout';
import { adminStats, reviewQueue, exceptions, statusTone } from '../../data/adminData';

const money = (n) => '$' + n.toLocaleString('en-US');

export default function AdminDashboard() {
  const navigate = useNavigate();
  const actionItems = reviewQueue.filter((r) => ['New', 'In Review', 'Escalated'].includes(r.status)).slice(0, 4);
  const openExceptions = exceptions.filter((e) => e.status !== 'Resolved');
  const onKey = (fn) => (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(); }
  };

  const iconFor = (type) => {
    if (type === 'Content Flag') return <Flag size={17} />;
    if (type === 'Payout Exception') return <AlertTriangle size={17} />;
    if (type === 'Nonprofit Verification') return <ShieldCheck size={17} />;
    return <Clock size={17} />;
  };

  return (
    <AdminLayout
      active="dashboard"
      title="Operations Dashboard"
      actions={<button className="adm-btn adm-btn-primary" onClick={() => navigate('/admin/review')}>Open review queue</button>}
    >
      {/* Operational counters */}
      <div className="adm-stats">
        <div className="adm-stat clickable warn" role="button" tabIndex={0} onClick={() => navigate('/admin/review')} onKeyDown={onKey(() => navigate('/admin/review'))}>
          <p className="adm-stat-lbl">Review queue</p>
          <p className="adm-stat-num">{adminStats.reviewQueue}</p>
          <p className="adm-stat-sub">{adminStats.pendingVerification} verifications pending</p>
        </div>
        <div className="adm-stat clickable danger" role="button" tabIndex={0} onClick={() => navigate('/admin/exceptions')} onKeyDown={onKey(() => navigate('/admin/exceptions'))}>
          <p className="adm-stat-lbl">Open exceptions</p>
          <p className="adm-stat-num">{adminStats.openExceptions}</p>
          <p className="adm-stat-sub">{adminStats.payoutsPending} payouts pending</p>
        </div>
        <div className="adm-stat clickable" role="button" tabIndex={0} onClick={() => navigate('/admin/events')} onKeyDown={onKey(() => navigate('/admin/events'))}>
          <p className="adm-stat-lbl">Live events</p>
          <p className="adm-stat-num">{adminStats.liveEvents}</p>
          <p className="adm-stat-sub">Across verified nonprofits</p>
        </div>
        <div className="adm-stat ok">
          <p className="adm-stat-lbl">GMV this week</p>
          <p className="adm-stat-num">{money(adminStats.gmvWeek)}</p>
          <p className="adm-stat-sub">Donations captured</p>
        </div>
      </div>

      {/* Action required — top of the review queue */}
      <div className="adm-panel">
        <div className="adm-panel-head">
          <span className="adm-panel-title">Action required</span>
          <button className="adm-link" onClick={() => navigate('/admin/review')}>View all <ArrowRight size={14} /></button>
        </div>
        {actionItems.map((item) => (
          <div key={item.id} className="adm-item clickable" role="button" tabIndex={0} aria-label={`Review ${item.title}`} onClick={() => navigate(`/admin/review/${item.id}`)} onKeyDown={onKey(() => navigate(`/admin/review/${item.id}`))}>
            <div className={`adm-item-icon ${item.priority === 'High' ? 'warn' : ''}`}>{iconFor(item.type)}</div>
            <div className="adm-item-body">
              <p className="adm-item-title">{item.title}</p>
              <p className="adm-item-meta">
                <span>{item.id}</span>·<span>{item.type}</span>·<span>{item.submittedAt}</span>
              </p>
            </div>
            <div className="adm-item-side">
              <Badge tone={statusTone(item.status)} dot>{item.status}</Badge>
              <span className="adm-link">Review <ArrowRight size={13} /></span>
            </div>
          </div>
        ))}
      </div>

      {/* Open exceptions */}
      <div className="adm-panel">
        <div className="adm-panel-head">
          <span className="adm-panel-title">Open exceptions</span>
          <button className="adm-link" onClick={() => navigate('/admin/exceptions')}>Manage <ArrowRight size={14} /></button>
        </div>
        {openExceptions.map((ex) => (
          <div key={ex.id} className="adm-item clickable" role="button" tabIndex={0} aria-label={`Open exception ${ex.title}`} onClick={() => navigate('/admin/exceptions')} onKeyDown={onKey(() => navigate('/admin/exceptions'))}>
            <div className="adm-item-icon danger"><AlertTriangle size={17} /></div>
            <div className="adm-item-body">
              <p className="adm-item-title">{ex.title}</p>
              <p className="adm-item-meta"><span>{ex.id}</span>·<span>{ex.type}</span>·<span>{ex.entity}</span></p>
            </div>
            <div className="adm-item-side">
              <Badge tone={statusTone(ex.status)}>{ex.status}</Badge>
              <span className="adm-item-meta">{ex.severity} severity</span>
            </div>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className="adm-section-head"><span className="adm-section-title">Jump to</span></div>
      <div className="adm-stats" style={{ marginBottom: 0 }}>
        <div className="adm-stat clickable" role="button" tabIndex={0} onClick={() => navigate('/admin/nonprofits')} onKeyDown={onKey(() => navigate('/admin/nonprofits'))}>
          <p className="adm-item-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Building2 size={17} /> Nonprofits</p>
          <p className="adm-stat-sub">Verification &amp; lifecycle</p>
        </div>
        <div className="adm-stat clickable" role="button" tabIndex={0} onClick={() => navigate('/admin/events')} onKeyDown={onKey(() => navigate('/admin/events'))}>
          <p className="adm-item-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><CalendarRange size={17} /> Events</p>
          <p className="adm-stat-sub">Monitor &amp; moderate</p>
        </div>
        <div className="adm-stat clickable" role="button" tabIndex={0} onClick={() => navigate('/admin/audit')} onKeyDown={onKey(() => navigate('/admin/audit'))}>
          <p className="adm-item-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><ScrollText size={17} /> Audit log</p>
          <p className="adm-stat-sub">Full action history</p>
        </div>
        <div className="adm-stat clickable" role="button" tabIndex={0} onClick={() => navigate('/admin/review')} onKeyDown={onKey(() => navigate('/admin/review'))}>
          <p className="adm-item-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><ShieldCheck size={17} /> Review queue</p>
          <p className="adm-stat-sub">{adminStats.reviewQueue} items waiting</p>
        </div>
      </div>
    </AdminLayout>
  );
}
