import React, { useEffect, useState, useRef, useCallback } from 'react';
import adminApi from '../adminApi';
import { toast } from '../AdminApp';
import AdminModal from '../AdminModal';
import { mediaUrl } from '../../utils/mediaUrl';
import './AdminMemories.css';

const EMPTY = { title: '', caption: '', image_url: '', date_created: '' };

export default function AdminMemories() {
  const [items, setItems] = useState([]);
  const [editModal, setEditModal] = useState(false);
  const [bulkModal, setBulkModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');

  // Bulk upload state
  const [bulkFiles, setBulkFiles] = useState([]); // [{ file, preview, url, uploading, done, error }]
  const [bulkUploading, setBulkUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const fileRef = useRef();
  const bulkFileRef = useRef();

  const load = () => adminApi.get('/admin/memories').then(r => setItems(r.data)).catch(() => { });
  useEffect(() => { load(); }, []);

  // ── Edit single memory ────────────────────────────────────────────────────
  const openEdit = (item) => {
    setForm({
      title: item.title,
      caption: item.caption || '',
      image_url: item.image_url || '',
      date_created: item.date_created ? item.date_created.slice(0, 10) : '',
    });
    setEditing(item.id);
    setEditModal(true);
  };

  const uploadSingleFile = async (file) => {
    const fd = new FormData(); fd.append('file', file);
    const { data } = await adminApi.post('/admin/upload', fd);
    return data.url;
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    try {
      await adminApi.put(`/admin/memories/${editing}`, form);
      toast('Memory updated ✓');
      setEditModal(false); load();
    } catch { toast('Save failed', 'error'); }
  };

  const del = async (id) => {
    if (!window.confirm('Delete this memory?')) return;
    await adminApi.delete(`/admin/memories/${id}`);
    toast('Deleted', 'warning'); load();
  };

  // ── Bulk upload ───────────────────────────────────────────────────────────
  const addFiles = useCallback((fileList) => {
    const newEntries = Array.from(fileList)
      .filter(f => f.type.startsWith('image/'))
      .map(file => ({
        id: Math.random().toString(36).slice(2),
        file,
        preview: URL.createObjectURL(file),
        url: '',
        uploading: false,
        done: false,
        error: false,
      }));
    setBulkFiles(prev => [...prev, ...newEntries]);
  }, []);

  const onDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    addFiles(e.dataTransfer.files);
  };

  const removeFile = (id) => setBulkFiles(prev => prev.filter(f => f.id !== id));

  const uploadAll = async () => {
    const pending = bulkFiles.filter(f => !f.done && !f.error);
    if (!pending.length) return;
    setBulkUploading(true);

    for (const entry of pending) {
      // Mark as uploading
      setBulkFiles(prev => prev.map(f => f.id === entry.id ? { ...f, uploading: true } : f));
      try {
        const url = await uploadSingleFile(entry.file);
        // Create memory with filename as placeholder title
        const title = entry.file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
        await adminApi.post('/admin/memories', { title, caption: '', image_url: url });
        setBulkFiles(prev => prev.map(f => f.id === entry.id ? { ...f, uploading: false, done: true, url } : f));
      } catch {
        setBulkFiles(prev => prev.map(f => f.id === entry.id ? { ...f, uploading: false, error: true } : f));
      }
    }

    setBulkUploading(false);
    toast(`${pending.length} image${pending.length > 1 ? 's' : ''} uploaded ✓`);
    load();
  };

  const closeBulk = () => {
    setBulkFiles([]);
    setBulkModal(false);
  };

  const allDone = bulkFiles.length > 0 && bulkFiles.every(f => f.done || f.error);

  const filtered = items.filter(i =>
    i.title.toLowerCase().includes(search.toLowerCase()) ||
    (i.caption || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-title">📖 Memories</h1>
        <div style={{ display: 'flex', gap: 10 }}>
          <input className="admin-search" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
          <button className="admin-btn admin-btn-secondary" onClick={() => setBulkModal(true)}>
            📁 Bulk Upload
          </button>
        </div>
      </div>

      {/* Memories grid */}
      <div className="admin-card">
        {filtered.length === 0 ? (
          <div className="admin-empty">
            <div className="admin-empty-icon">📖</div>
            <p>No memories yet — use Bulk Upload to add images</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr><th>Image</th><th>Title</th><th>Caption</th><th>Date</th><th></th></tr>
            </thead>
            <tbody>
              {filtered.map(item => (
                <tr key={item.id}>
                  <td>
                    {item.image_url
                      ? <img src={mediaUrl(item.image_url)} alt="" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 8 }} />
                      : <div style={{ width: 48, height: 48, background: 'var(--as2)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>📷</div>
                    }
                  </td>
                  <td style={{ fontWeight: 500 }}>
                    {item.title || <em style={{ color: 'var(--am)' }}>untitled</em>}
                  </td>
                  <td style={{ color: 'var(--am)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.caption || <em>no caption</em>}
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

      {/* ── Edit modal ── */}
      <AdminModal open={editModal} onClose={() => setEditModal(false)} title="Edit Memory">
        <form onSubmit={saveEdit}>
          <div className="admin-form-group">
            <label>Title *</label>
            <input className="admin-input" value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
          </div>
          <div className="admin-form-group">
            <label>Caption</label>
            <textarea className="admin-textarea" value={form.caption}
              onChange={e => setForm(f => ({ ...f, caption: e.target.value }))} rows={3}
              placeholder="Write something about this memory..." />
          </div>
          <div className="admin-form-group">
            <label>Date</label>
            <input className="admin-input" type="date"
              value={form.date_created}
              onChange={e => setForm(f => ({ ...f, date_created: e.target.value }))} />
          </div>
          <div className="admin-form-group">
            <label>Image URL</label>
            <input className="admin-input" value={form.image_url}
              onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))}
              placeholder="https://..." />
            {form.image_url && (
              <img src={mediaUrl(form.image_url)} alt="preview"
                style={{ marginTop: 8, maxHeight: 120, borderRadius: 8, objectFit: 'cover' }} />
            )}
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setEditModal(false)}>Cancel</button>
            <button type="submit" className="admin-btn admin-btn-primary">Save Changes</button>
          </div>
        </form>
      </AdminModal>

      {/* ── Bulk upload modal ── */}
      <AdminModal open={bulkModal} onClose={closeBulk} title="📁 Bulk Upload Images">
        {/* Drop zone */}
        <div
          className={`bulk-dropzone ${dragOver ? 'drag-over' : ''}`}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => bulkFileRef.current.click()}
        >
          <input
            ref={bulkFileRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={e => addFiles(e.target.files)}
          />
          <div className="bulk-dropzone-icon">🖼️</div>
          <p className="bulk-dropzone-text">
            {dragOver ? 'Drop images here' : 'Click or drag & drop images here'}
          </p>
          <p className="bulk-dropzone-sub">Supports JPG, PNG, WEBP, GIF — multiple files at once</p>
        </div>

        {/* Preview grid */}
        {bulkFiles.length > 0 && (
          <>
            <div className="bulk-preview-grid">
              {bulkFiles.map(entry => (
                <div key={entry.id} className={`bulk-preview-item ${entry.done ? 'done' : ''} ${entry.error ? 'error' : ''}`}>
                  <img src={entry.preview} alt="" className="bulk-preview-img" />
                  <div className="bulk-preview-overlay">
                    {entry.uploading && <div className="bulk-spinner" />}
                    {entry.done && <span className="bulk-status-icon">✓</span>}
                    {entry.error && <span className="bulk-status-icon error">✗</span>}
                    {!entry.uploading && !entry.done && !entry.error && (
                      <button className="bulk-remove-btn" onClick={() => removeFile(entry.id)}>✕</button>
                    )}
                  </div>
                  <p className="bulk-preview-name">{entry.file.name.slice(0, 18)}{entry.file.name.length > 18 ? '…' : ''}</p>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--am)' }}>
                {bulkFiles.filter(f => f.done).length}/{bulkFiles.length} uploaded
                {bulkFiles.some(f => f.error) && <span style={{ color: 'var(--err)', marginLeft: 8 }}>• {bulkFiles.filter(f => f.error).length} failed</span>}
              </span>
              <div style={{ display: 'flex', gap: 10 }}>
                {allDone ? (
                  <button className="admin-btn admin-btn-primary" onClick={closeBulk}>
                    Done — Edit titles in the table ✓
                  </button>
                ) : (
                  <>
                    <button className="admin-btn admin-btn-secondary" onClick={closeBulk}>Cancel</button>
                    <button className="admin-btn admin-btn-primary" onClick={uploadAll} disabled={bulkUploading}>
                      {bulkUploading ? 'Uploading...' : `Upload ${bulkFiles.filter(f => !f.done && !f.error).length} Image${bulkFiles.filter(f => !f.done && !f.error).length !== 1 ? 's' : ''}`}
                    </button>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </AdminModal>
    </div>
  );
}
