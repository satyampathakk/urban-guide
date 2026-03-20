import React, { useEffect, useState, useRef } from 'react';
import adminApi from '../adminApi';
import { toast } from '../AdminApp';
import AdminModal from '../AdminModal';

const EMPTY = { title: '', description: '', event_date: '', emoji: '💕', media_url: '', sort_order: 0 };

export default function AdminTimeline() {
  const [items, setItems] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  const load = () => adminApi.get('/admin/timeline').then(r => setItems(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const openNew = () => { setForm(EMPTY); setEditing(null); setModal(true); };
  const openEdit = (item) => {
    setForm({ title: item.title, description: item.description || '', event_date: item.event_date || '',
      emoji: item.emoji || '💕', media_url: item.media_url || '', sort_order: item.sort_order || 0 });
    setEditing(item.id); setModal(true);
  };

  const uploadImage = async (file) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const { data } = await adminApi.post('/admin/upload', fd);
      setForm(p => ({ ...p, media_url: data.url }));
      toast('Image uploaded ✓');
    } catch { toast('Upload failed', 'error'); }
    finally { setUploading(false); }
  };

  const save = async (e) => {
    e.preventDefault();
    try {
      editing ? await adminApi.put(`/admin/timeline/${editing}`, form) : await adminApi.post('/admin/timeline', form);
      toast(editing ? 'Event updated ✓' : 'Event created ✓');
      setModal(false); load();
    } catch { toast('Save failed', 'error'); }
  };

  const del = async (id) => {
    if (!window.confirm('Delete?')) return;
    await adminApi.delete(`/admin/timeline/${id}`);
    toast('Deleted', 'warning'); load();
  };

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-title">💞 Timeline</h1>
        <button className="admin-btn admin-btn-primary" onClick={openNew}>+ Add Event</button>
      </div>

      <div className="admin-card">
        {items.length === 0 ? (
          <div className="admin-empty"><div className="admin-empty-icon">💞</div><p>No events yet</p></div>
        ) : (
          <table className="admin-table">
            <thead><tr><th>#</th><th>Emoji</th><th>Title</th><th>Date</th><th>Image</th><th></th></tr></thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id}>
                  <td style={{ color: 'var(--am)' }}>{item.sort_order}</td>
                  <td style={{ fontSize: '1.3rem' }}>{item.emoji}</td>
                  <td style={{ fontWeight: 500 }}>{item.title}</td>
                  <td style={{ color: 'var(--am)', fontSize: '0.82rem' }}>{item.event_date}</td>
                  <td>
                    {item.media_url
                      ? <img src={item.media_url} alt="" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6 }} />
                      : <span style={{ color: 'var(--am)', fontSize: '0.8rem' }}>—</span>}
                  </td>
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

      <AdminModal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Event' : 'New Event'}>
        <form onSubmit={save}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 64px', gap: 12 }}>
            <div className="admin-form-group">
              <label>Title *</label>
              <input className="admin-input" value={form.title} onChange={e => f('title', e.target.value)} required />
            </div>
            <div className="admin-form-group">
              <label>Emoji</label>
              <input className="admin-input" value={form.emoji} onChange={e => f('emoji', e.target.value)} style={{ textAlign: 'center', fontSize: '1.2rem' }} />
            </div>
          </div>
          <div className="admin-form-group">
            <label>Description</label>
            <textarea className="admin-textarea" value={form.description} onChange={e => f('description', e.target.value)} rows={3} />
          </div>
          <div className="admin-grid-2">
            <div className="admin-form-group">
              <label>Date</label>
              <input className="admin-input" type="date" value={form.event_date} onChange={e => f('event_date', e.target.value)} />
            </div>
            <div className="admin-form-group">
              <label>Sort Order</label>
              <input className="admin-input" type="number" value={form.sort_order} onChange={e => f('sort_order', parseInt(e.target.value) || 0)} />
            </div>
          </div>

          {/* Image upload */}
          <div className="admin-form-group">
            <label>Image</label>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <button type="button" className="admin-btn admin-btn-secondary admin-btn-sm"
                onClick={() => fileRef.current.click()} disabled={uploading}>
                {uploading ? 'Uploading…' : '📷 Upload Image'}
              </button>
              {form.media_url && (
                <>
                  <img src={form.media_url} alt="" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 8 }} />
                  <button type="button" className="admin-btn admin-btn-danger admin-btn-sm"
                    onClick={() => f('media_url', '')}>Remove</button>
                </>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
              onChange={e => e.target.files[0] && uploadImage(e.target.files[0])} />
            <input className="admin-input" style={{ marginTop: 8 }} placeholder="…or paste image URL"
              value={form.media_url} onChange={e => f('media_url', e.target.value)} />
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
