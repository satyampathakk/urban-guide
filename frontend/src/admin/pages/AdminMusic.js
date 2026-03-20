import React, { useEffect, useState, useRef } from 'react';
import adminApi from '../adminApi';
import { toast } from '../AdminApp';
import AdminModal from '../AdminModal';

const BASE = '';
const EMPTY = { title: '', artist: '', file_url: '', is_active: 1, sort_order: 0 };

export default function AdminMusic() {
  const [tracks, setTracks]       = useState([]);
  const [modal, setModal]         = useState(false);
  const [form, setForm]           = useState(EMPTY);
  const [editing, setEditing]     = useState(null);
  const [uploading, setUploading] = useState(false);
  const [playing, setPlaying]     = useState(null); // id of previewing track
  const fileRef = useRef();
  const audioRef = useRef();

  const load = () => adminApi.get('/admin/music').then(r => setTracks(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const openNew  = () => { setForm(EMPTY); setEditing(null); setModal(true); };
  const openEdit = (t) => {
    setForm({ title: t.title, artist: t.artist || '', file_url: t.file_url, is_active: t.is_active, sort_order: t.sort_order || 0 });
    setEditing(t.id); setModal(true);
  };

  const uploadFile = async (file) => {
    setUploading(true);
    const fd = new FormData(); fd.append('file', file);
    try {
      const { data } = await adminApi.post('/admin/upload', fd);
      setForm(f => ({ ...f, file_url: `${BASE}${data.url}` }));
      toast('Audio uploaded ✓');
    } catch { toast('Upload failed', 'error'); }
    finally { setUploading(false); }
  };

  const save = async (e) => {
    e.preventDefault();
    try {
      editing ? await adminApi.put(`/admin/music/${editing}`, form)
              : await adminApi.post('/admin/music', form);
      toast(editing ? 'Track updated ✓' : 'Track added ✓');
      setModal(false); load();
    } catch { toast('Save failed', 'error'); }
  };

  const del = async (id) => {
    if (!window.confirm('Delete this track?')) return;
    await adminApi.delete(`/admin/music/${id}`);
    toast('Track deleted', 'warning'); load();
  };

  const toggleActive = async (t) => {
    await adminApi.put(`/admin/music/${t.id}`, { ...t, is_active: t.is_active ? 0 : 1 });
    toast(t.is_active ? 'Track disabled' : 'Track enabled');
    load();
  };

  const preview = (t) => {
    if (playing === t.id) {
      audioRef.current?.pause();
      setPlaying(null);
    } else {
      if (audioRef.current) { audioRef.current.src = t.file_url; audioRef.current.play().catch(() => {}); }
      setPlaying(t.id);
    }
  };

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div>
      <audio ref={audioRef} onEnded={() => setPlaying(null)} style={{ display: 'none' }} />

      <div className="admin-page-header">
        <h1 className="admin-page-title">🎵 Music Playlist</h1>
        <button className="admin-btn admin-btn-primary" onClick={openNew}>+ Add Track</button>
      </div>

      <div className="admin-card" style={{ marginBottom: 16, padding: '12px 16px', background: 'rgba(232,121,160,0.08)', border: '1px solid rgba(232,121,160,0.2)' }}>
        <p style={{ fontSize: '0.83rem', color: 'rgba(255,255,255,0.7)' }}>
          🎧 Active tracks play in the app's music player. Upload MP3/OGG/WAV files or paste a URL.
          Disable tracks to hide them without deleting.
        </p>
      </div>

      <div className="admin-card">
        {tracks.length === 0 ? (
          <div className="admin-empty"><div className="admin-empty-icon">🎵</div><p>No tracks yet</p></div>
        ) : (
          <table className="admin-table">
            <thead><tr><th>#</th><th>Track</th><th>Artist</th><th>Status</th><th>Preview</th><th></th></tr></thead>
            <tbody>
              {tracks.map(t => (
                <tr key={t.id}>
                  <td style={{ color: 'var(--am)' }}>{t.sort_order}</td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{t.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--am)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.file_url}
                    </div>
                  </td>
                  <td style={{ color: 'var(--am)' }}>{t.artist || '—'}</td>
                  <td>
                    <span className={`admin-badge ${t.is_active ? 'badge-green' : 'badge-red'}`}>
                      {t.is_active ? '✓ Active' : '✗ Off'}
                    </span>
                  </td>
                  <td>
                    <button className="admin-btn admin-btn-secondary admin-btn-sm" onClick={() => preview(t)}>
                      {playing === t.id ? '⏸ Stop' : '▶ Play'}
                    </button>
                  </td>
                  <td>
                    <div className="admin-actions">
                      <button className="admin-btn admin-btn-secondary admin-btn-sm" onClick={() => toggleActive(t)}>
                        {t.is_active ? 'Disable' : 'Enable'}
                      </button>
                      <button className="admin-btn admin-btn-secondary admin-btn-sm" onClick={() => openEdit(t)}>Edit</button>
                      <button className="admin-btn admin-btn-danger admin-btn-sm" onClick={() => del(t.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <AdminModal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Track' : 'Add Track'}>
        <form onSubmit={save}>
          <div className="admin-form-group">
            <label>Track Title *</label>
            <input className="admin-input" value={form.title} onChange={e => f('title', e.target.value)} required placeholder="e.g. Our Song" />
          </div>
          <div className="admin-form-group">
            <label>Artist</label>
            <input className="admin-input" value={form.artist} onChange={e => f('artist', e.target.value)} placeholder="e.g. Ed Sheeran" />
          </div>
          <div className="admin-form-group">
            <label>Audio File — Upload or URL</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input className="admin-input" value={form.file_url} onChange={e => f('file_url', e.target.value)} placeholder="https://... or upload MP3" required />
              <input ref={fileRef} type="file" accept="audio/*" style={{ display: 'none' }}
                onChange={e => e.target.files[0] && uploadFile(e.target.files[0])} />
              <button type="button" className="admin-btn admin-btn-secondary admin-btn-sm"
                onClick={() => fileRef.current.click()} disabled={uploading}>
                {uploading ? '...' : '📁'}
              </button>
            </div>
            {form.file_url && (
              <audio src={form.file_url} controls style={{ marginTop: 8, width: '100%', height: 36 }} />
            )}
          </div>
          <div className="admin-grid-2">
            <div className="admin-form-group">
              <label>Sort Order</label>
              <input className="admin-input" type="number" value={form.sort_order} onChange={e => f('sort_order', parseInt(e.target.value) || 0)} />
            </div>
            <div className="admin-form-group">
              <label>Status</label>
              <select className="admin-select" value={form.is_active} onChange={e => f('is_active', parseInt(e.target.value))}>
                <option value={1}>✓ Active</option>
                <option value={0}>✗ Disabled</option>
              </select>
            </div>
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
