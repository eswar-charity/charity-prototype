import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Flag, ScanLine } from 'lucide-react';
import AdminLayout, { Badge } from '../../components/admin/AdminLayout';
import { Toast, useToast } from '../../components/admin/useToast';
import QRScannerModal from '../../components/QRScannerModal';
import { listAdminEvents, adaptAdminEvent } from '../../api/admin';
import { statusTone } from '../../data/adminData';
import { eventLivePath } from '../../utils/eventPaths.js';

const FILTERS = ['All', 'Live', 'Submitted', 'Approved', 'Changes Requested', 'Completed', 'Cancelled'];
const money = (n) => '$' + n.toLocaleString('en-US');

export default function AdminEvents() {
  const navigate = useNavigate();
  const { msg, show } = useToast();
  const [filter, setFilter] = useState('All');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showScanner, setShowScanner] = useState(false);
  const [scannerEvent, setScannerEvent] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listAdminEvents();
      setRows((data ?? []).map(adaptAdminEvent));
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = rows.filter((e) => filter === 'All' || e.status === filter);
  const defaultScanner = rows.find((e) => e.status === 'Live')?.title ?? rows[0]?.title ?? '';

  return (
    <AdminLayout
      active="events"
      title="Events"
      actions={
        <button className="adm-btn adm-btn-ghost adm-btn-sm" onClick={() => show('Exporting event report…')}>
          <Download size={14} /> Export
        </button>
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
              <tr><th>Event</th><th>Nonprofit</th><th>Type</th><th>Status</th><th>Joined</th><th>Raised</th><th></th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="adm-td-muted">Loading events…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="adm-td-muted">No events match this filter.</td></tr>
              ) : (
                filtered.map((e) => (
                  <tr key={e.id}>
                    <td>
                      <span className="adm-td-strong" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        {e.title}
                        {e.flags > 0 && <Badge tone="danger"><Flag size={10} /> {e.flags}</Badge>}
                      </span>
                      <div className="adm-item-meta">by {e.organizer}</div>
                    </td>
                    <td className="adm-td-muted">{e.nonprofit}</td>
                    <td className="adm-td-muted">{e.kind}</td>
                    <td><Badge tone={statusTone(e.status)} dot>{e.status}</Badge></td>
                    <td>{e.joined}</td>
                    <td className="adm-td-strong">{money(e.raised)}</td>
                    <td className="adm-td-actions">
                      <button className="adm-btn adm-btn-ghost adm-btn-sm" onClick={() => navigate(eventLivePath(e.key, { loggedIn: false }))}>View</button>
                      {e.status === 'Live' && (
                        <button
                          className="adm-btn adm-btn-scan adm-btn-sm"
                          onClick={() => {
                            setScannerEvent(e.title);
                            setShowScanner(true);
                          }}
                        >
                          <ScanLine size={13} /> Scan audit
                        </button>
                      )}
                      {e.flags > 0 && (
                        <button className="adm-btn adm-btn-danger adm-btn-sm" onClick={() => show('Opened moderation for ' + e.title)}>Moderate</button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Toast msg={msg} />

      <QRScannerModal
        open={showScanner}
        onClose={() => setShowScanner(false)}
        role="admin"
        variant="desktop"
        eventTitle={scannerEvent || defaultScanner}
        onScanSuccess={(attendee) => show(`Audit logged: ${attendee.name} at ${scannerEvent || defaultScanner}`)}
      />
    </AdminLayout>
  );
}
