import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, MoreHorizontal } from 'lucide-react';
import NpBottomNav from '../../components/NpBottomNav';

const ACTIVITY_ITEMS = [
  {
    id: 1,
    tab: 'activity',
    avatar: 'PM',
    avatarBg: 'linear-gradient(135deg,#7B1FA2,#AB47BC)',
    text: 'Priya M. just joined',
    link: 'Weekend Park Cleanup',
    time: '2 mins ago',
    flagged: false,
  },
  {
    id: 2,
    tab: 'activity',
    avatar: 'ME',
    avatarBg: 'linear-gradient(135deg,#F57C00,#FFB300)',
    text: 'Maya E. posted a photo',
    time: '15 mins ago',
    flagged: true,
    reports: '1 REPORT',
  },
];

const FLAGGED_ITEMS = [
  {
    id: 3,
    tab: 'flagged',
    avatar: 'ME',
    avatarBg: 'linear-gradient(135deg,#F57C00,#FFB300)',
    text: 'Maya E. posted a photo',
    time: '15 mins ago',
    flagged: true,
    reports: '1 REPORT',
  },
];

export default function NpActivity() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('activity');

  const items = activeTab === 'activity' ? ACTIVITY_ITEMS : FLAGGED_ITEMS;

  return (
    <div className="phone-shell">
      <div className="screen">
        {/* Header */}
        <div style={{ padding: '52px 18px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <button className="back-btn" onClick={() => navigate('/np/home')}>
              <ChevronLeft size={18} />
            </button>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--dark)' }}>Content & Activity</h1>
          </div>

          {/* Tabs */}
          <div className="tab-row">
            <button
              className={`tab-item ${activeTab === 'activity' ? 'active' : ''}`}
              onClick={() => setActiveTab('activity')}
            >
              Activity
            </button>
            <button
              className={`tab-item ${activeTab === 'flagged' ? 'active' : ''}`}
              onClick={() => setActiveTab('flagged')}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              Flagged
              <span style={{
                width: 18, height: 18, borderRadius: '50%', background: 'var(--primary)',
                color: 'white', fontSize: 10, fontWeight: 700,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              }}>1</span>
            </button>
          </div>
        </div>

        <div style={{ padding: '0 18px 20px' }}>
          {items.map((item) => (
            <div key={item.id} className={`activity-row ${item.flagged ? 'flagged' : ''}`}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                background: item.avatarBg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, color: 'white',
              }}>
                {item.avatar}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, color: 'var(--dark)', lineHeight: 1.4 }}>
                  <span style={{ fontWeight: 700 }}>{item.text}</span>
                  {item.link && (
                    <>
                      {' '}
                      <span style={{ color: 'var(--blue)', fontWeight: 600, textDecoration: 'underline', cursor: 'pointer' }}>
                        {item.link}
                      </span>
                    </>
                  )}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{item.time}</span>
                  {item.reports && (
                    <span style={{
                      background: 'var(--primary)', color: 'white',
                      fontSize: 10, fontWeight: 700, padding: '2px 7px',
                      borderRadius: 'var(--radius-pill)',
                    }}>
                      {item.reports}
                    </span>
                  )}
                </div>
              </div>
              {item.flagged && (
                <button style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-light)', padding: '4px',
                }}>
                  <MoreHorizontal size={18} />
                </button>
              )}
            </div>
          ))}

          {items.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--dark)', marginBottom: 6 }}>All clear</p>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>No flagged content right now.</p>
            </div>
          )}
        </div>

        <NpBottomNav active="activity" />
      </div>
    </div>
  );
}
