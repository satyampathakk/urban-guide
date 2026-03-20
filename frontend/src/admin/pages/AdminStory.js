import React, { useEffect, useState, useRef } from 'react';
import adminApi from '../adminApi';
import { toast } from '../AdminApp';
import AdminModal from '../AdminModal';

const BASE = '';
const EMPTY_CH = { title: '', subtitle: '', emoji: '💕', video_url: '', sort_order: 0 };
const EMPTY_SL = { chapter_id: '', slide_type: 'memory', title: '', caption: '', media_url: '', sort_order: 0 };

export default function AdminStory() {
  const [chapters, setChapters]   = useState([]);
  const [slides, setSlides]       = useState([]);
  const [chModal, setChModal]     = useState(false);
  const [slModal, setSlModal]     = useState(false);
  const [chForm, setChForm]       = useState(EMPTY_CH);
  const [slForm, setSlForm]       = useState(EMPTY_SL);
  const [editCh, setEditCh]       = useState(null);
  const [editSl, setEditSl]       = useState(null);
  const [uploading, setUploading] = useState(false);
  const [chUploading, setChUploading] = useState(false);
  const [activeChapter, setActiveChapter] = useState(null);
  const fileRef   = useRef();
  const chFileRef = useRef();

  const loadAll = async () => {
    const [c, s] = await Promise.all([
      adminApi.get('/admin/story/chapters').then(r => r.data).catch(() => []),
      adminApi.get('/admin/story/slides').then(r => r.data).catch(() => []),
    ]);
    setChapters(c);
    setSlides(s);
    if (!activeChapter && c.length) setActiveChapter(c[0].id);
  };

  useEffect(() => { loadAll(); }, []);

  // ── Chapter CRUD ──
  const openNewCh  = () => { setChForm(EMPTY_CH); setEditCh(null); setChModal(true); };
  const openEditCh = (ch) => {
    setChForm({ title:ch.title, subtitle:ch.subtitle||'', emoji:ch.emoji||'💕', video_url:ch.video_url||'', sort_order:ch.sort_order||0 });
    setEditCh(ch.id); setChModal(true);
  };

  const uploadChapterVideo = async (file) => {
    setChUploading(true);
    const fd = new FormData(); fd.append('file', file);
    try {
      const { data } = await adminApi.post('/admin/upload', fd);
      setChForm(f => ({ ...f, video_url: `${BASE}${data.url}` }));
      toast('Video uploaded ✓');
    } catch { toast('Upload failed', 'error'); }
    finally { setChUploading(false); }
  };

  const saveCh = async (e) => {
    e.preventDefault();
    try {
      editCh ? await adminApi.put(`/admin/story/chapters/${editCh}`, chForm)
             : await adminApi.post('/admin/story/chapters', chForm);
      toast(editCh ? 'Chapter updated ✓' : 'Chapter created ✓');
      setChModal(false); loadAll();
    } catch { toast('Save failed', 'error'); }
  };

  const delCh = async (id) => {
    if (!window.confirm('Delete chapter and all its slides?')) return;
    await adminApi.delete(`/admin/story/chapters/${id}`);
    toast('Chapter deleted', 'warning'); loadAll();
  };

  // ── Slide CRUD ──
  const openNewSl  = (chId) => { setSlForm({ ...EMPTY_SL, chapter_id: chId }); setEditSl(null); setSlModal(true); };
  const openEditSl = (sl) => {
    setSlForm({ chapter_id:sl.chapter_id, slide_type:sl.slide_type, title:sl.title||'', caption:sl.caption||'', media_url:sl.media_url||'', sort_order:sl.sort_order||0 });
    setEditSl(sl.id); setSlModal(true);
  };

  const uploadMedia = async (file) => {
    setUploading(true);
    const fd = new FormData(); fd.append('file', file);
    try {
      const { data } = await adminApi.post('/admin/upload', fd);
      setSlForm(f => ({ ...f, media_url: `${BASE}${data.url}` }));
      toast('File uploaded ✓');
    } catch { toast('Upload failed', 'error'); }
    finally { setUploading(false); }
  };

  const saveSl = async (e) => {
    e.preventDefault();
    try {
      editSl ? await adminApi.put(`/admin/story/slides/${editSl}`, slForm)
             : await adminApi.post('/admin/story/slides', slForm);
      toast(editSl ? 'Slide updated ✓' : 'Slide created ✓');
      setSlModal(false); loadAll();
    } catch { toast('Save failed', 'error'); }
  };

  const delSl = async (id) => {
    if (!window.confirm('Delete slide?')) return;
    await adminApi.delete(`/admin/story/slides/${id}`);
    toast('Slide deleted', 'warning'); loadAll();
  };

  const chSlides = slides.filter(s => s.chapter_id === activeChapter);
  const typeIcon = t => ({ memory:'📖', video:'🎬', image:'🖼️' }[t] || '📄');

  const f = (k, v) => setSlForm(p => ({ ...p, [k]: v }));

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-title">🎬 Story Mode</h1>
        <button className="admin-btn admin-btn-primary" onClick={openNewCh}>+ Add Chapter</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 18, alignItems: 'start' }}>

        {/* Chapter list */}
        <div className="admin-card">
          <p style={{ fontSize: '0.8rem', color: 'var(--am)', marginBottom: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Chapters</p>
          {chapters.length === 0 && <div className="admin-empty" style={{ padding: '20px 0' }}><p>No chapters yet</p></div>}
          {chapters.map(ch => (
            <div key={ch.id}
              onClick={() => setActiveChapter(ch.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                borderRadius: 10, marginBottom: 4, cursor: 'pointer',
                background: activeChapter === ch.id ? 'rgba(232,121,160,0.15)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${activeChapter === ch.id ? 'rgba(232,121,160,0.3)' : 'transparent'}`,
              }}>
              <span style={{ fontSize: '1.2rem' }}>{ch.emoji}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.88rem', fontWeight: 500, color: activeChapter === ch.id ? 'var(--ap)' : 'var(--at)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ch.title}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--am)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {ch.subtitle}
                  {ch.video_url && <span style={{ color: '#a78bfa', fontSize: '0.7rem' }}>🎬 video</span>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button className="admin-btn admin-btn-secondary admin-btn-sm" onClick={e => { e.stopPropagation(); openEditCh(ch); }}>✏️</button>
                <button className="admin-btn admin-btn-danger admin-btn-sm" onClick={e => { e.stopPropagation(); delCh(ch.id); }}>🗑</button>
              </div>
            </div>
          ))}
        </div>

        {/* Slides for active chapter */}
        <div>
          {activeChapter ? (
            <>
              <div className="admin-page-header" style={{ marginBottom: 14 }}>
                <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--at)' }}>
                  Slides — {chapters.find(c => c.id === activeChapter)?.title}
                </p>
                <button className="admin-btn admin-btn-primary admin-btn-sm" onClick={() => openNewSl(activeChapter)}>+ Add Slide</button>
              </div>

              <div className="admin-card">
                {chSlides.length === 0 ? (
                  <div className="admin-empty"><div className="admin-empty-icon">🎬</div><p>No slides yet — add images, videos or memory references</p></div>
                ) : (
                  <table className="admin-table">
                    <thead><tr><th>#</th><th>Type</th><th>Title</th><th>Media</th><th></th></tr></thead>
                    <tbody>
                      {chSlides.sort((a,b) => a.sort_order - b.sort_order).map(sl => (
                        <tr key={sl.id}>
                          <td style={{ color: 'var(--am)' }}>{sl.sort_order}</td>
                          <td><span className="admin-badge badge-purple">{typeIcon(sl.slide_type)} {sl.slide_type}</span></td>
                          <td style={{ fontWeight: 500 }}>{sl.title || <em style={{ color: 'var(--am)' }}>untitled</em>}</td>
                          <td>
                            {sl.media_url && sl.slide_type === 'video' && (
                              <video src={sl.media_url} style={{ height: 40, borderRadius: 6 }} />
                            )}
                            {sl.media_url && sl.slide_type === 'image' && (
                              <img src={sl.media_url} alt="" style={{ height: 40, borderRadius: 6, objectFit: 'cover' }} />
                            )}
                            {sl.slide_type === 'memory' && <span style={{ color: 'var(--am)', fontSize: '0.8rem' }}>from memories</span>}
                          </td>
                          <td>
                            <div className="admin-actions">
                              <button className="admin-btn admin-btn-secondary admin-btn-sm" onClick={() => openEditSl(sl)}>Edit</button>
                              <button className="admin-btn admin-btn-danger admin-btn-sm" onClick={() => delSl(sl.id)}>Delete</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          ) : (
            <div className="admin-card admin-empty"><div className="admin-empty-icon">👈</div><p>Select a chapter</p></div>
          )}
        </div>
      </div>

      {/* Chapter modal */}
      <AdminModal open={chModal} onClose={() => setChModal(false)} title={editCh ? 'Edit Chapter' : 'New Chapter'}>
        <form onSubmit={saveCh}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px', gap: 12 }}>
            <div className="admin-form-group">
              <label>Title *</label>
              <input className="admin-input" value={chForm.title} onChange={e => setChForm(f => ({ ...f, title: e.target.value }))} required />
            </div>
            <div className="admin-form-group">
              <label>Emoji</label>
              <input className="admin-input" value={chForm.emoji} onChange={e => setChForm(f => ({ ...f, emoji: e.target.value }))} style={{ textAlign: 'center', fontSize: '1.2rem' }} />
            </div>
          </div>
          <div className="admin-form-group">
            <label>Subtitle</label>
            <input className="admin-input" value={chForm.subtitle} onChange={e => setChForm(f => ({ ...f, subtitle: e.target.value }))} placeholder="e.g. How it started" />
          </div>

          {/* Chapter video */}
          <div className="admin-form-group">
            <label>🎬 Chapter Video <span style={{ color: 'var(--am)', fontWeight: 400 }}>(plays on the chapter title card)</span></label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input className="admin-input" value={chForm.video_url}
                onChange={e => setChForm(f => ({ ...f, video_url: e.target.value }))}
                placeholder="https://... or upload MP4" />
              <input ref={chFileRef} type="file" accept="video/*" style={{ display: 'none' }}
                onChange={e => e.target.files[0] && uploadChapterVideo(e.target.files[0])} />
              <button type="button" className="admin-btn admin-btn-secondary admin-btn-sm"
                onClick={() => chFileRef.current.click()} disabled={chUploading}
                title="Upload video file">
                {chUploading ? '⏳' : '📁'}
              </button>
              {chForm.video_url && (
                <button type="button" className="admin-btn admin-btn-danger admin-btn-sm"
                  onClick={() => setChForm(f => ({ ...f, video_url: '' }))} title="Remove video">
                  ✕
                </button>
              )}
            </div>
            {chForm.video_url && (
              <video src={chForm.video_url} controls
                style={{ marginTop: 10, width: '100%', maxHeight: 160, borderRadius: 10, background: '#000' }} />
            )}
            {!chForm.video_url && (
              <p style={{ fontSize: '0.76rem', color: 'var(--am)', marginTop: 6 }}>
                Optional — if set, this video plays as the background when the chapter title appears in Story Mode.
              </p>
            )}
          </div>

          <div className="admin-form-group">
            <label>Sort Order</label>
            <input className="admin-input" type="number" value={chForm.sort_order} onChange={e => setChForm(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))} />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setChModal(false)}>Cancel</button>
            <button type="submit" className="admin-btn admin-btn-primary">Save Chapter</button>
          </div>
        </form>
      </AdminModal>

      {/* Slide modal */}
      <AdminModal open={slModal} onClose={() => setSlModal(false)} title={editSl ? 'Edit Slide' : 'New Slide'}>
        <form onSubmit={saveSl}>
          <div className="admin-form-group">
            <label>Slide Type</label>
            <select className="admin-select" value={slForm.slide_type} onChange={e => f('slide_type', e.target.value)}>
              <option value="memory">📖 Memory (from memories list)</option>
              <option value="image">🖼️ Image</option>
              <option value="video">🎬 Video</option>
            </select>
          </div>
          <div className="admin-form-group">
            <label>Title</label>
            <input className="admin-input" value={slForm.title} onChange={e => f('title', e.target.value)} placeholder="Slide title" />
          </div>
          <div className="admin-form-group">
            <label>Caption</label>
            <textarea className="admin-textarea" value={slForm.caption} onChange={e => f('caption', e.target.value)} rows={3} placeholder="Text shown on this slide" />
          </div>

          {slForm.slide_type !== 'memory' && (
            <div className="admin-form-group">
              <label>{slForm.slide_type === 'video' ? 'Video' : 'Image'} — URL or Upload</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input className="admin-input" value={slForm.media_url} onChange={e => f('media_url', e.target.value)} placeholder="https://... or upload" />
                <input ref={fileRef} type="file"
                  accept={slForm.slide_type === 'video' ? 'video/*' : 'image/*'}
                  style={{ display: 'none' }}
                  onChange={e => e.target.files[0] && uploadMedia(e.target.files[0])} />
                <button type="button" className="admin-btn admin-btn-secondary admin-btn-sm"
                  onClick={() => fileRef.current.click()} disabled={uploading}>
                  {uploading ? '...' : '📁'}
                </button>
              </div>
              {/* Preview */}
              {slForm.media_url && slForm.slide_type === 'image' && (
                <img src={slForm.media_url} alt="preview" style={{ marginTop: 8, maxHeight: 100, borderRadius: 8 }} />
              )}
              {slForm.media_url && slForm.slide_type === 'video' && (
                <video src={slForm.media_url} controls style={{ marginTop: 8, maxHeight: 120, borderRadius: 8, width: '100%' }} />
              )}
            </div>
          )}

          <div className="admin-form-group">
            <label>Sort Order</label>
            <input className="admin-input" type="number" value={slForm.sort_order} onChange={e => f('sort_order', parseInt(e.target.value) || 0)} />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setSlModal(false)}>Cancel</button>
            <button type="submit" className="admin-btn admin-btn-primary">Save</button>
          </div>
        </form>
      </AdminModal>
    </div>
  );
}
