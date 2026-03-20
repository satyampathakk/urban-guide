import React, { useEffect, useState } from 'react';
import adminApi from '../adminApi';

const StatCard = ({ icon, label, value, color }) => (
  <div className="admin-card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
    <div style={{ fontSize: '1.8rem', background: `${color}22`, borderRadius: 10, padding: '10px 13px' }}>{icon}</div>
    <div>
      <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{value ?? '—'}</div>
      <div style={{ fontSize: '0.8rem', color: 'var(--am)', marginTop: 2 }}>{label}</div>
    </div>
  </div>
);

export default function AdminHome() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    adminApi.get('/admin/stats').then(r => setStats(r.data)).catch(() => { });
  }, []);

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-title">📊 Dashboard</h1>
        <span style={{ color: 'var(--am)', fontSize: '0.83rem' }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 14, marginBottom: 28 }}>
        <StatCard icon="📖" label="Memories" value={stats?.memories} color="#e879a0" />
        <StatCard icon="💬" label="Messages" value={stats?.messages} color="#7c3aed" />
        <StatCard icon="✍️" label="Poems" value={stats?.poems} color="#0ea5e9" />
        <StatCard icon="🔐" label="Secrets" value={stats?.secrets} color="#f59e0b" />
        <StatCard icon="💞" label="Timeline" value={stats?.timeline_events} color="#10b981" />
      </div>

      <div className="admin-card">
        <h3 style={{ marginBottom: 14, fontSize: '0.93rem', fontWeight: 600 }}>Recent Activity</h3>
        {stats?.recent_activity?.length ? (
          <table className="admin-table">
            <thead><tr><th>Action</th><th>Entity</th><th>Time</th></tr></thead>
            <tbody>
              {stats.recent_activity.map((a, i) => (
                <tr key={i}>
                  <td>
                    <span className={`admin-badge ${a.action === 'deleted' ? 'badge-red' : a.action === 'created' ? 'badge-green' : 'badge-yellow'}`}>
                      {a.action}
                    </span>
                  </td>
                  <td style={{ color: 'var(--am)' }}>{a.entity}</td>
                  <td style={{ color: 'var(--am)', fontSize: '0.78rem' }}>{new Date(a.timestamp).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="admin-empty"><div className="admin-empty-icon">📋</div><p>No activity yet</p></div>
        )}
      </div>
    </div>
  );
}
