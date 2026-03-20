import React, { useEffect, useState, useRef, useCallback } from 'react';
import adminApi from '../adminApi';
import { toast } from '../AdminApp';
import AdminModal from '../AdminModal';
import './AdminGameCards.css';

const BASE = 'http://localhost:8000';

export default function AdminGameCards() {
  const [cards, setCards]           = useState([]);
  const [editModal, setEditModal]   = useState(false);
  const [bulkModal, setBulkModal]   = useState(false);
  const [editForm, setEditForm]     = useState({ title: '', caption: '' });
  const [editId, setEditId]         = useState(null);
  const [search, setSearch]         = useState('');
  const [filter, setFilter]         = useState('all'); // all | in | out

  // Bulk upload state
  const [bulkFiles, setBulkFiles]       = useState([]);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [dragOver, setDragOver]         = useState(false);
  const bulkRef = useRef();

  const load = () =>
    adminApi.get('/admin/game-cards').then(r => setCards(r.data)).catch(() => {});

  useEffect(() => { load(); }, []);

  // ── Toggle single card in/out of game ──────────────────────────────────────
  const toggle = async (id) => {
    await adminApi.put(`/admin/game-cards/${id}/toggle`);
    setCards(prev => prev.map(c => c.id === id ? { ...c, in_game: c.in_game ? 0 : 1 } : c));
  };

  // ── Enable / disable all ───────────────────────────────────────────────────
  const setAll = async (val) => {
    const ids = cards.map(c => c.id);
    await adminApi.put('/admin/game-cards/bulk-toggle', { ids, in_game: val });
    setCards(prev => prev.map(c => ({ ...c, in_game: val })));
    toast(val ? 'All cards enabled ✓' : 'All cards disabled');
  };

  // ── Edit title/caption ─────────────────────────────────────────────────────
  const openEdit = (card) => {
    setEditForm({ title: card.title, caption: card.caption || '' });
    setEditId(card.id);
    setEditModal(true);
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    try {
      await adminApi.put(`/admin/memories/${editId}`, {
        title: editForm.title,
        caption: editForm.caption,
        image_url: cards.find(c => c.id === editId)?.image_url || '',
      });
      toast('Card updated ✓');
      setEditModal(false);
      load();
    } catch { toast('Save failed', 'error'); }
  };

  // ── Bulk upload ────────────────────────────────────────────────────────────
  const addFiles = useCallback((fileList) => {
    const entries = Array.from(fileList)
      .filter(f => f.type.startsWith('image/'))
      .map(file => ({
        id:        Math.random().toString(36).slice(2),
        file,
        preview:   URL.createObjectURL(file),
        done:      false,
        uploading: false,
        error:     false,
      }));
    setBulkFiles(prev => [...prev, ...entries]);
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
      setBulkFiles(prev => prev.map(f => f.id === entry.id ? { ...f, uploading: true } : f));
      try {
        const fd = new FormData();
        fd.append('file', entry.file);
        fd.append('title', entry.file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '));
        fd.append('caption', '');
        await adminApi.post('/admin/game-cards/upload', fd);
        setBulkFiles(prev => prev.map(f => f.id === entry.id ? { ...f, uploading: false, done: true } : f));
      } catch {
        setBulkFiles(prev => prev.map(f => f.id === entry.id ? { ...f, uploading: false, error: true } : f));
      }
    }

    setBulkUploading(false);
    toast(`${pending.length} card${pending.length > 1 ? 's' : ''} uploaded ✓`);
    load();
  };

  const closeBulk = () => { setBulkFiles([]); setBulkModal(false); };
  const allDone = bulkFiles.length > 0 && bulkFiles.every(f => f.done || f.error);

  // ── Filtered view ──────────────────────────────────────────────────────────
  const filtered = cards.filter(c => {
    const matchSearch = c.title.toLowerCase().includes(search.toLowerCase()) ||
                        (c.caption || '').toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || (filter === 'in' ? c.in_game : !c.in_game);
    return matchSearch && matchFilter;
  });

  const inCount  = cards.filter(c => c.in_game).length;
  const outCount = cards.length - inCount;

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-title">💖 Game Cards</h1>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input className="admin-search" placeholder="Search..." value={search}
            onChange={e => setSearch(e.target.value)} />
          <button className="admin-btn admin-btn-secondary" onClick={() => setBulkModal(true)}>
            📁 Upload Images
          </button>
        </div>
      </div>

      {/* Info banner */}
      <div className="gc-info-banner">
        <span>🎮 These images appear as cards in the Memory Match game.</span>
        <span className="gc-counts">
          <span className="gc-count in">{inCount} active</span>
          <span className="gc-count out">{outCount} hidden</span>
        </span>
      </div>

      {/* Filter + bulk actions */}
      <div className="gc-toolbar">
        <div className="gc-filter-tabs">
          {[['all','All'], ['in','In Game'], ['out','Hidden']].map(([val, lbl]) => (
            <button key={val} className={`gc-tab ${filter === val ? 'active' : ''}`}
              onClick={() => setFilter(val)}>{lbl}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="admin-btn admin-btn-secondary admin-btn-sm" onClick={() => setAll(1)}>Enable All</button>
          <button className="admin-btn admin-btn-secondary admin-btn-sm" onClick={() => setAll(0)}>Disable All</button>
        </div>
      </div>

      {/* Card grid */}
      {filtered.length === 0 ? (
        <div className="admin-card admin-empty">
          <div className="admin-empty-icon">💖</div>
          <p>No cards yet — upload images to get started</p>
        </div>
      ) : (
        <div className="gc-grid">
          {filtered.map(card => (
            <div key={card.id} className={`gc-card ${card.in_game ? 'active' : 'inactive'}`}>
              {/* Image */}
              <div className="gc-card-img-wrap">
                {card.image_url
                  ? <img src={card.image_url.startsWith('http') ? card.image_url : `${BASE}${card.image_url}`}
                      alt={card.title} className="gc-card-img"
                      onError={e => { e.target.style.display = 'none'; }} />
                  : <div className="gc-card-no-img">💕</div>
                }
                {/* Toggle overlay */}
                <button
                  className={`gc-toggle-btn ${card.in_game ? 'on' : 'off'}`}
                  onClick={() => toggle(card.id)}
                  title={card.in_game ? 'Click to hide from game' : 'Click to add to game'}>
                  {card.in_game ? '✓ In Game' : '+ Add'}
                </button>
              </div>

              {/* Info */}
              <div className="gc-card-info">
                <p className="gc-card-title">{card.title || <em>untitled</em>}</p>
                <p className="gc-card-caption">{card.caption || <em style={{ color: 'var(--am)' }}>no caption</em>}</p>
              </div>

              {/* Edit button */}
              <button className="gc-edit-btn admin-btn admin-btn-secondary admin-btn-sm"
                onClick={() => openEdit(card)}>
                ✏️ Edit
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── Edit modal ── */}
      <AdminModal open={editModal} onClose={() => setEditModal(false)} title="Edit Card">
        <form onSubmit={saveEdit}>
          <div className="admin-form-group">
            <label>Title *</label>
            <input className="admin-input" value={editForm.title}
              onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} required />
          </div>
          <div className="admin-form-group">
            <label>Caption <span style={{ color: 'var(--am)', fontWeight: 400 }}>(shown when matched)</span></label>
            <textarea className="admin-textarea" value={editForm.caption}
              onChange={e => setEditForm(f => ({ ...f, caption: e.target.value }))}
              rows={3} placeholder="Write something about this memory..." />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setEditModal(false)}>Cancel</button>
            <button type="submit" className="admin-btn admin-btn-primary">Save</button>
          </div>
        </form>
      </AdminModal>

      {/* ── Bulk upload modal ── */}
      <AdminModal open={bulkModal} onClose={closeBulk} title="📁 Upload Game Card Images">
        <div
          className={`bulk-dropzone ${dragOver ? 'drag-over' : ''}`}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => bulkRef.current.click()}>
          <input ref={bulkRef} type="file" accept="image/*" multiple style={{ display: 'none' }}
            onChange={e => addFiles(e.target.files)} />
          <div className="bulk-dropzone-icon">🖼️</div>
          <p className="bulk-dropzone-text">
            {dragOver ? 'Drop images here' : 'Click or drag & drop images'}
          </p>
          <p className="bulk-dropzone-sub">All uploaded images are automatically added to the game</p>
        </div>

        {bulkFiles.length > 0 && (
          <>
            <div className="bulk-preview-grid">
              {bulkFiles.map(entry => (
                <div key={entry.id} className={`bulk-preview-item ${entry.done ? 'done' : ''} ${entry.error ? 'error' : ''}`}>
                  <img src={entry.preview} alt="" className="bulk-preview-img" />
                  <div className="bulk-preview-overlay">
                    {entry.uploading && <div className="bulk-spinner" />}
                    {entry.done     && <span className="bulk-status-icon">✓</span>}
                    {entry.error    && <span className="bulk-status-icon error">✗</span>}
                    {!entry.uploading && !entry.done && !entry.error && (
                      <button className="bulk-remove-btn" onClick={() => removeFile(entry.id)}>✕</button>
                    )}
                  </div>
                  <p className="bulk-preview-name">
                    {entry.file.name.slice(0, 16)}{entry.file.name.length > 16 ? '…' : ''}
                  </p>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--am)' }}>
                {bulkFiles.filter(f => f.done).length}/{bulkFiles.length} uploaded
                {bulkFiles.some(f => f.error) && (
                  <span style={{ color: 'var(--err)', marginLeft: 8 }}>
                    • {bulkFiles.filter(f => f.error).length} failed
                  </span>
                )}
              </span>
              <div style={{ display: 'flex', gap: 10 }}>
                {allDone ? (
                  <button className="admin-btn admin-btn-primary" onClick={closeBulk}>
                    Done — Edit captions in the grid ✓
                  </button>
                ) : (
                  <>
                    <button className="admin-btn admin-btn-secondary" onClick={closeBulk}>Cancel</button>
                    <button className="admin-btn admin-btn-primary" onClick={uploadAll} disabled={bulkUploading}>
                      {bulkUploading
                        ? 'Uploading...'
                        : `Upload ${bulkFiles.filter(f => !f.done && !f.error).length} Image${bulkFiles.filter(f => !f.done && !f.error).length !== 1 ? 's' : ''}`}
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
