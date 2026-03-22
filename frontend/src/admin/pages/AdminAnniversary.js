import React, { useEffect, useRef, useState } from 'react';
import adminApi from '../adminApi';
import { toast } from '../AdminApp';
import AdminModal from '../AdminModal';
import { mediaUrl } from '../../utils/mediaUrl';

const EMPTY = { title: '', message: '', month: '', day: '', media_url: '', media_type: '', music_url: '' };

const isVideoUrl = (url) => /\.(mp4|webm|ogg)$/i.test(url || '');

export default function AdminAnniversary() {
  const [items, setItems] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadingMusic, setUploadingMusic] = useState(false);
  const mediaRef = useRef();
  const musicRef = useRef();

  const load = () => adminApi.get('/admin/anniversaries').then(r => setItems(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const openNew = () => { setForm(EMPTY); setEditing(null); setModal(true); };
  const openEdit = (item) => {
    setForm({
      title: item.title || '',
      message: item.message || '',
      month: item.month || '',
      day: item.day || '',
      media_url: item.media_url || '',
      media_type: item.media_type || '',
      music_url: item.music_url || '',
    });
    setEditing(item.id); setModal(true);
  };

  const uploadMedia = async (file) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const { data } = await adminApi.post('/admin/upload', fd);
      const mediaType = file.type.startsWith('video') ? 'video' : 'image';
      setForm(p => ({ ...p, media_url: data.url, media_type: mediaType }));
      toast('Media uploaded');
    } catch { toast('Upload failed', 'error'); }
    finally { setUploading(false); }
  };

  const uploadMusic = async (file) => {
    setUploadingMusic(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const { data } = await adminApi.post('/admin/upload', fd);
      setForm(p => ({ ...p, music_url: data.url }));
      toast('Music uploaded');
    } catch { toast('Upload failed', 'error'); }
    finally { setUploadingMusic(false); }
  };

  const save = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      month: Number(form.month),
      day: Number(form.day),
      media_type: form.media_url
        ? (form.media_type || (isVideoUrl(form.media_url) ? 'video' : 'image'))
        : '',
    };
    try {
      editing
        ? await adminApi.put(`/admin/anniversaries/${editing}`, payload)
        : await adminApi.post('/admin/anniversaries', payload);
      toast(editing ? 'Anniversary updated' : 'Anniversary created');
      setModal(false); load();
    } catch {
      toast('Save failed', 'error');
    }
  };

  const del = async (id) => {
    if (!window.confirm('Delete this anniversary event?')) return;
    await adminApi.delete(`/admin/anniversaries/${id}`);
    toast('Deleted', 'warning'); load();
  };

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const formatDate = (m, d) => {
    if (!m || !d) return '-';
    const dt = new Date(2024, Number(m) - 1, Number(d));
    return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Anniversary Mode</h1>
        <button className="admin-btn admin-btn-primary" onClick={openNew}>+ Add Date</button>
      </div>

      <div className="admin-card">
        {items.length === 0 ? (
          <div className="admin-empty"><div className="admin-empty-icon">A</div><p>No anniversary events yet</p></div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Date</th>
                <th>Media</th>
                <th>Music</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id}>
                  <td style={{ fontWeight: 500 }}>{item.title}</td>
                  <td style={{ color: 'var(--am)', fontSize: '0.82rem' }}>{formatDate(item.month, item.day)}</td>
                  <td>
                    {item.media_url
                      ? ((item.media_type || (isVideoUrl(item.media_url) ? 'video' : 'image')) === 'video'
                        ? <span style={{ fontSize: '0.8rem', color: 'var(--am)' }}>Video</span>
                        : <img src={mediaUrl(item.media_url)} alt="" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6 }} />)
                      : <span style={{ color: 'var(--am)', fontSize: '0.8rem' }}>-</span>}
                  </td>
                  <td>
                    {item.music_url
                      ? <span style={{ fontSize: '0.8rem', color: '#ffd700' }}>Music</span>
                      : <span style={{ color: 'var(--am)', fontSize: '0.8rem' }}>-</span>}
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

      <AdminModal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Anniversary' : 'New Anniversary'}>
        <form onSubmit={save}>
          <div className="admin-form-group">
            <label>Title *</label>
            <input className="admin-input" value={form.title} onChange={e => f('title', e.target.value)} required />
          </div>
          <div className="admin-form-group">
            <label>Message *</label>
            <textarea className="admin-textarea" value={form.message} onChange={e => f('message', e.target.value)} rows={4} required />
          </div>
          <div className="admin-grid-2">
            <div className="admin-form-group">
              <label>Month (1-12) *</label>
              <input className="admin-input" type="number" min="1" max="12" value={form.month}
                onChange={e => f('month', e.target.value)} required />
            </div>
            <div className="admin-form-group">
              <label>Day (1-31) *</label>
              <input className="admin-input" type="number" min="1" max="31" value={form.day}
                onChange={e => f('day', e.target.value)} required />
            </div>
          </div>

          <div className="admin-grid-2">
            <div className="admin-form-group">
              <label>Media Type</label>
              <select className="admin-select" value={form.media_type} onChange={e => f('media_type', e.target.value)}>
                <option value="">Auto detect</option>
                <option value="image">Image</option>
                <option value="video">Video</option>
              </select>
            </div>
            <div className="admin-form-group">
              <label>Music (audio)</label>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <button type="button" className="admin-btn admin-btn-secondary admin-btn-sm"
                  onClick={() => musicRef.current.click()} disabled={uploadingMusic}>
                  {uploadingMusic ? 'Uploading...' : 'Upload Music'}
                </button>
                {form.music_url && (
                  <>
                    <audio src={mediaUrl(form.music_url)} controls style={{ height: 32 }} />
                    <button type="button" className="admin-btn admin-btn-danger admin-btn-sm"
                      onClick={() => f('music_url', '')}>Remove</button>
                  </>
                )}
              </div>
              <input ref={musicRef} type="file" accept="audio/*" style={{ display: 'none' }}
                onChange={e => e.target.files[0] && uploadMusic(e.target.files[0])} />
              <input className="admin-input" style={{ marginTop: 8 }} placeholder="...or paste music URL"
                value={form.music_url} onChange={e => f('music_url', e.target.value)} />
            </div>
          </div>

          <div className="admin-form-group">
            <label>Media (image/video)</label>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <button type="button" className="admin-btn admin-btn-secondary admin-btn-sm"
                onClick={() => mediaRef.current.click()} disabled={uploading}>
                  {uploading ? 'Uploading...' : 'Upload Media'}
              </button>
              {form.media_url && (
                <>
                  {form.media_type === 'video'
                    ? <span style={{ fontSize: '0.85rem', color: 'var(--am)' }}>Video attached</span>
                    : <img src={mediaUrl(form.media_url)} alt="" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 8 }} />}
                  <button type="button" className="admin-btn admin-btn-danger admin-btn-sm"
                    onClick={() => f('media_url', '')}>Remove</button>
                </>
              )}
            </div>
            <input ref={mediaRef} type="file" accept="image/*,video/*" style={{ display: 'none' }}
              onChange={e => e.target.files[0] && uploadMedia(e.target.files[0])} />
            <input className="admin-input" style={{ marginTop: 8 }} placeholder="...or paste media URL"
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
