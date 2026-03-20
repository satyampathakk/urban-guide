import React, { useEffect, useState } from 'react';
import adminApi from '../adminApi';
import { toast } from '../AdminApp';
import AdminModal from '../AdminModal';

const EMPTY = { title: '', content: '' };

export default function AdminPoems() {
  const [items, setItems] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');

  const load = () => adminApi.get('/admin/poems').then(r => setItems(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const openNew = () => { setForm(EMPTY); setEditing(null); setModal(true); };
  const openEdit = (item) => { setForm({ title: item.title, content: item.content }); setEditing(item.id); setModal(true); };

  const save = async (e) => {
    e.preventDefault();
    try {
      editing ? await adminApi.put(`/admin/poems/${editing}`, form) : await adminApi.post('/admin/poems', form);
      toast(editing ? 'Poem updated ✓' : 'Poem created ✓');
      setModal(false); load();
    } catch { toast('Save failed', 'error'); }
  };

  const del = async (id) => {
    if (!window.confirm('Delete this poem?')) return;
    await adminApi.delete(`/admin/poems/${id}`);
    toast('Deleted', 'warning'); load();
  };

  const filtered = items.filter(i => i.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-title">✍️ Poetry & Shayari</h1>
        <div style={{ display: 'flex', gap: 10 }}>
          <input className="admin-search" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
          <button className="admin-btn admin-btn-primary" onClick={openNew}>+ Add Poem</button>
        </div>
      </div>

      <div className="admin-card">
        {filtered.length === 0 ? (
          <div className="admin-empty"><div className="admin-empty-icon">✍️</div><p>No poems yet</p></div>
        ) : (
          <table className="admin-table">
            <thead><tr><th>Title</th><th>Preview</th><th>Date</th><th></th></tr></thead>
            <tbody>
              {filtered.map(item => (
                <tr key={item.id}>
                  <td style={{ fontWeight: 500 }}>{item.title}</td>
                  <td style={{ color: 'var(--am)', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontStyle: 'italic' }}>
                    {item.content?.split('\n')[0]}
                  </td>
                  <td style={{ color: 'var(--am)', fontSize: '0.78rem' }}>{item.date_created?.slice(0, 10)}</td>
                  <td>
                    <div className="admin-actions">
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

      <AdminModal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Poem' : 'New Poem'}>
        <form onSubmit={save}>
          <div className="admin-form-group">
            <label>Title *</label>
            <input className="admin-input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
          </div>
          <div className="admin-form-group">
            <label>Content *</label>
            <textarea className="admin-textarea" value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              rows={12} required style={{ fontFamily: 'Georgia, serif', lineHeight: 1.8 }} />
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
