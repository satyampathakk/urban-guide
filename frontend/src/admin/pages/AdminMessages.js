import React, { useEffect, useState } from 'react';
import adminApi from '../adminApi';
import { toast } from '../AdminApp';

const BASE = 'https://api.032403.xyz';
const typeIcon = t => ({ image: '🖼️', video: '🎬', audio: '🎤', file: '📎' }[t] || '💬');

export default function AdminMessages() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');

  const load = () => adminApi.get('/admin/messages').then(r => setItems(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const del = async (id) => {
    if (!window.confirm('Delete this message?')) return;
    await adminApi.delete(`/admin/messages/${id}`);
    toast('Message deleted', 'warning'); load();
  };

  const filtered = items.filter(i =>
    (i.content || '').toLowerCase().includes(search.toLowerCase()) ||
    (i.sender || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-title">💬 Messages</h1>
        <input className="admin-search" placeholder="Search sender or content..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="admin-card">
        {filtered.length === 0 ? (
          <div className="admin-empty"><div className="admin-empty-icon">💬</div><p>No messages</p></div>
        ) : (
          <table className="admin-table">
            <thead><tr><th>Type</th><th>Sender</th><th>Content</th><th>Time</th><th></th></tr></thead>
            <tbody>
              {filtered.map(msg => (
                <tr key={msg.id}>
                  <td title={msg.msg_type}>{typeIcon(msg.msg_type)}</td>
                  <td style={{ fontWeight: 500 }}>{msg.sender}</td>
                  <td style={{ color: 'var(--am)', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {msg.msg_type !== 'text' && msg.media_url
                      ? <a href={`${BASE}${msg.media_url}`} target="_blank" rel="noreferrer" style={{ color: 'var(--ap)' }}>View media ↗</a>
                      : msg.content}
                  </td>
                  <td style={{ color: 'var(--am)', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                    {new Date(msg.timestamp).toLocaleString()}
                  </td>
                  <td>
                    <button className="admin-btn admin-btn-danger admin-btn-sm" onClick={() => del(msg.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
