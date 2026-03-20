import React, { useEffect, useState } from 'react';
import adminApi from '../adminApi';
import { toast } from '../AdminApp';
import AdminModal from '../AdminModal';

const EMPTY = { title: '', content: '', secret_type: 'message', unlock_condition: 'password', unlock_value: '', is_locked: 1, media_url: '' };

export default function AdminSecrets() {
  const [items, setItems] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);

  const load = () => adminApi.get('/admin/secrets').then(r => setItems(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const openNew = () => { setForm(EMPTY); setEditing(null); setModal(true); };
  const openEdit = (item) => {
    setForm({ title: item.title, content: item.content || '', secret_type: item.secret_type,
      unlock_condition: item.unlock_condition, unlock_value: item.unlock_value || '',
      is_locked: item.is_locked, media_url: item.media_url || '' });
    setEditing(item.id); setModal(true);
  };

  const toggleLock = async (item) => {
    await adminApi.put(`/admin/secrets/${item.id}`, { ...item, is_locked: item.is_locked ? 0 : 1 });
    toast(item.is_locked ? '🔓 Secret unlocked' : '🔒 Secret locked');
    load();
  };

  const save = async (e) => {
    e.preventDefault();
    try {
      editing ? await adminApi.put(`/admin/secrets/${editing}`, form) : await adminApi.post('/admin/secrets', form);
      toast(editing ? 'Secret updated ✓' : 'Secret created ✓');
      setModal(false); load();
    } catch { toast('Save failed', 'error'); }
  };

  const del = async (id) => {
    if (!window.confirm('Delete?')) return;
    await adminApi.delete(`/admin/secrets/${id}`);
    toast('Deleted', 'warning'); load();
  };

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-title">🔐 Secrets</h1>
        <button className="admin-btn admin-btn-primary" onClick={openNew}>+ Add Secret</button>
      </div>

      <div className="admin-card">
        {items.length === 0 ? (
          <div className="admin-empty"><div className="admin-empty-icon">🔐</div><p>No secrets yet</p></div>
        ) : (
          <table className="admin-table">
            <thead><tr><th>Title</th><th>Type</th><th>Unlock</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id}>
                  <td style={{ fontWeight: 500 }}>{item.title}</td>
                  <td><span className="admin-badge badge-purple">{item.secret_type}</span></td>
                  <td style={{ color: 'var(--am)', fontSize: '0.82rem' }}>{item.unlock_condition}: <em>{item.unlock_value}</em></td>
                  <td>
                    <span className={`admin-badge ${item.is_locked ? 'badge-red' : 'badge-green'}`}>
                      {item.is_locked ? '🔒 Locked' : '🔓 Unlocked'}
                    </span>
                  </td>
                  <td>
                    <div className="admin-actions">
                      <button className="admin-btn admin-btn-secondary admin-btn-sm" onClick={() => toggleLock(item)}>
                        {item.is_locked ? 'Unlock' : 'Lock'}
                      </button>
                      <button className="admin-btn admin-btn-secondary admin-btn-sm" onClick={() => openEdit(item)}>Edit</button>
                      <button className="admin-btn admin-btn-danger admin-btn-sm" onClick={() => del(item.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <AdminModal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Secret' : 'New Secret'}>
        <form onSubmit={save}>
          <div className="admin-form-group">
            <label>Title *</label>
            <input className="admin-input" value={form.title} onChange={e => f('title', e.target.value)} required />
          </div>
          <div className="admin-form-group">
            <label>Content</label>
            <textarea className="admin-textarea" value={form.content} onChange={e => f('content', e.target.value)} rows={4} />
          </div>
          <div className="admin-grid-2">
            <div className="admin-form-group">
              <label>Type</label>
              <select className="admin-select" value={form.secret_type} onChange={e => f('secret_type', e.target.value)}>
                <option value="message">Message</option>
                <option value="image">Image</option>
                <option value="surprise">Surprise</option>
              </select>
            </div>
            <div className="admin-form-group">
              <label>Unlock Condition</label>
              <select className="admin-select" value={form.unlock_condition} onChange={e => f('unlock_condition', e.target.value)}>
                <option value="password">Password</option>
                <option value="click_count">Click Count</option>
                <option value="game_win">Game Win</option>
                <option value="time">Time-based</option>
              </select>
            </div>
          </div>
          <div className="admin-form-group">
            <label>Unlock Value</label>
            <input className="admin-input" value={form.unlock_value} onChange={e => f('unlock_value', e.target.value)} placeholder="password / count / 2025-01-01T00:00" />
          </div>
          <div className="admin-form-group">
            <label>Status</label>
            <select className="admin-select" value={form.is_locked} onChange={e => f('is_locked', parseInt(e.target.value))}>
              <option value={1}>🔒 Locked</option>
              <option value={0}>🔓 Unlocked</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setModal(false)}>Cancel</button>
            <button type="submit" className="admin-btn admin-btn-primary">Save</button>
          </div>
        </form>
      </AdminModal>
    </div>
  );
}
