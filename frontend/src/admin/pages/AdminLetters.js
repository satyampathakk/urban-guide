import React, { useEffect, useState, useRef } from 'react';
import adminApi from '../adminApi';
import { toast } from '../AdminApp';
import AdminModal from '../AdminModal';

const EMPTY = { title: '', content: '', unlock_at: '', occasion: '', image_url: '' };

export default function AdminLetters() {
  const [items, setItems] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  const load = () => adminApi.get('/admin/letters').then(r => setItems(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const openNew = () => { setForm(EMPTY); setEditing(null); setModal(true); };
  const openEdit = (item) => {
    // datetime-local input needs "YYYY-MM-DDTHH:MM" format
    const dt = item.unlock_at ? item.unlock_at.slice(0, 16) : '';
    setForm({ title: item.title, content: item.content || '', unlock_at: dt,
      occasion: item.occasion || '', image_url: item.image_url || '' });
    setEditing(item.id); setModal(true);
  };

  const uploadImage = async (file) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const { data } = await adminApi.post('/admin/upload', fd);
      setForm(p => ({ ...p, image_url: data.url }));
      toast('Image uploaded ✓');
    } catch { toast('Upload failed', 'error'); }
    finally { setUploading(false); }
  };

  const save = async (e) => {
    e.preventDefault();
    try {
      editing
        ? await adminApi.put(`/admin/letters/${editing}`, form)
        : await adminApi.post('/admin/letters', form);
      toast(editing ? 'Letter updated ✓' : 'Letter created ✓');
      setModal(false); load();
    } catch { toast('Save failed', 'error'); }
  };

  const del = async (id) => {
    if (!window.confirm('Delete this letter?')) return;
    await adminApi.delete(`/admin/letters/${id}`);
    toast('Deleted', 'warning'); load();
  };

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';
  const isUnlocked = (d) => d && new Date(d) <= new Date();

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-title">⏳ Time-Locked Letters</h1>
        <button className="admin-btn admin-btn-primary" onClick={openNew}>+ Add Letter</button>
      </div>

      <div className="admin-card">
        {items.length === 0 ? (
          <div className="admin-empty"><div className="admin-empty-icon">💌</div><p>No letters yet</p></div>
        ) : (
          <table className="admin-table">
            <thead><tr><th>Title</th><th>Occasion</th><th>Unlocks</th><th>Status</th><th>Image</th><th></th></tr></thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id}>
                  <td style={{ fontWeight: 500 }}>{item.title}</td>
                  <td style={{ color: 'var(--am)', fontSize: '0.82rem' }}>{item.occasion || '—'}</td>
                  <td style={{ color: 'var(--am)', fontSize: '0.82rem' }}>{formatDate(item.unlock_at)}</td>
                  <td>
                    <span style={{
                      fontSize: '0.75rem', padding: '2px 8px', borderRadius: 10,
                      background: isUnlocked(item.unlock_at) ? 'rgba(100,220,100,0.2)' : 'rgba(255,200,0,0.2)',
                      color: isUnlocked(item.unlock_at) ? '#6ddc6d' : '#ffd700',
                    }}>
                      {isUnlocked(item.unlock_at) ? '💌 Unlocked' : '🔒 Locked'}
                    </span>
                  </td>
                  <td>
                    {item.image_url
                      ? <img src={item.image_url} alt="" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6 }} />
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

      <AdminModal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Letter' : 'New Letter'}>
        <form onSubmit={save}>
          <div className="admin-form-group">
            <label>Title *</label>
            <input className="admin-input" value={form.title} onChange={e => f('title', e.target.value)} required />
          </div>
          <div className="admin-form-group">
            <label>Message *</label>
            <textarea className="admin-textarea" value={form.content} onChange={e => f('content', e.target.value)} rows={5} required />
          </div>
          <div className="admin-grid-2">
            <div className="admin-form-group">
              <label>Unlock Date & Time *</label>
              <input className="admin-input" type="datetime-local" value={form.unlock_at}
                onChange={e => f('unlock_at', e.target.value)} required />
            </div>
            <div className="admin-form-group">
              <label>Occasion</label>
              <input className="admin-input" value={form.occasion} placeholder="e.g. Anniversary"
                onChange={e => f('occasion', e.target.value)} />
            </div>
          </div>

          {/* Image upload */}
          <div className="admin-form-group">
            <label>Image (optional)</label>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <button type="button" className="admin-btn admin-btn-secondary admin-btn-sm"
                onClick={() => fileRef.current.click()} disabled={uploading}>
                {uploading ? 'Uploading…' : '📷 Upload Image'}
              </button>
              {form.image_url && (
                <>
                  <img src={form.image_url} alt="" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 8 }} />
                  <button type="button" className="admin-btn admin-btn-danger admin-btn-sm"
                    onClick={() => f('image_url', '')}>Remove</button>
                </>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
              onChange={e => e.target.files[0] && uploadImage(e.target.files[0])} />
            <input className="admin-input" style={{ marginTop: 8 }} placeholder="…or paste image URL"
              value={form.image_url} onChange={e => f('image_url', e.target.value)} />
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
