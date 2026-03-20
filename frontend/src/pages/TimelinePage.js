import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import './TimelinePage.css';

const FALLBACK = [
  { id:1, event_date:'January 15, 2023',  title:'The First Hello',       description:'The moment our story began. One smile changed everything.',          emoji:'👋', media_url:'' },
  { id:2, event_date:'February 14, 2023', title:"First Valentine's Day", description:'Roses, candlelight, and the realization this was something special.', emoji:'🌹', media_url:'' },
  { id:3, event_date:'April 3, 2023',     title:'First Trip Together',   description:'We got lost on purpose and found something beautiful.',               emoji:'✈️', media_url:'' },
  { id:4, event_date:'June 21, 2023',     title:'Said "I Love You"',     description:'Three words. A thousand feelings. One perfect moment.',              emoji:'💕', media_url:'' },
  { id:5, event_date:'September 10, 2023',title:'Met the Family',        description:'Nervous hands, warm hugs, and a feeling of belonging.',              emoji:'🏡', media_url:'' },
  { id:6, event_date:'January 15, 2024',  title:'One Year Together',     description:'A whole year of laughter, growth, and endless love.',               emoji:'🎉', media_url:'' },
];

const ADMIN_TOKEN = () => localStorage.getItem('admin_token');

export default function TimelinePage() {
  const [milestones, setMilestones] = useState([]);
  const [editing, setEditing]       = useState(null); // item being edited
  const [form, setForm]             = useState({});
  const [uploading, setUploading]   = useState(false);
  const [saving, setSaving]         = useState(false);
  const [isFallback, setIsFallback] = useState(false);
  const fileRef = useRef();

  const load = () => {
    axios.get('/api/timeline')
      .then(r => {
        if (r.data.length) { setMilestones(r.data); setIsFallback(false); }
        else               { setMilestones(FALLBACK); setIsFallback(true); }
      })
      .catch(() => { setMilestones(FALLBACK); setIsFallback(true); });
  };

  useEffect(() => { load(); }, []);

  const openEdit = (item) => {
    setForm({
      title:       item.title,
      description: item.description || '',
      event_date:  item.event_date  || '',
      emoji:       item.emoji       || '💕',
      media_url:   item.media_url   || '',
      sort_order:  item.sort_order  || 0,
    });
    setEditing(item);
  };

  const uploadImage = async (file) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const { data } = await axios.post('/admin/upload', fd, {
        headers: { Authorization: `Bearer ${ADMIN_TOKEN()}` },
      });
      setForm(p => ({ ...p, media_url: data.url }));
    } catch { alert('Image upload failed'); }
    finally { setUploading(false); }
  };

  const save = async (e) => {
    e.preventDefault();
    if (isFallback) { alert('Connect to the backend to save changes.'); return; }
    setSaving(true);
    try {
      await axios.put(`/admin/timeline/${editing.id}`, form, {
        headers: { Authorization: `Bearer ${ADMIN_TOKEN()}` },
      });
      setEditing(null);
      load();
    } catch { alert('Save failed — make sure you are logged into admin.'); }
    finally { setSaving(false); }
  };

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <motion.div
      className="timeline-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.h1
        className="timeline-heading"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
      >
        Our Story 💞
      </motion.h1>
      <p className="timeline-subtitle">Every chapter of us, written in time.</p>

      <div className="timeline">
        <div className="timeline-line" />
        {milestones.map((item, i) => {
          const isLeft = i % 2 === 0;
          return (
            <motion.div
              key={item.id || i}
              className={`timeline-item ${isLeft ? 'left' : 'right'}`}
              initial={{ opacity: 0, x: isLeft ? -60 : 60 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: i * 0.15 }}
            >
              <div className="timeline-card glass">
                {item.media_url && (
                  <div className="timeline-img-wrap">
                    <img src={item.media_url} alt={item.title} className="timeline-img"
                      onError={e => { e.target.parentElement.style.display = 'none'; }} />
                  </div>
                )}
                <div className="timeline-emoji">{item.emoji}</div>
                <div className="timeline-date">{item.event_date}</div>
                <h3 className="timeline-title">{item.title}</h3>
                <p className="timeline-desc">{item.description}</p>
                <button className="tl-edit-btn" onClick={() => openEdit(item)} title="Edit">✏️</button>
              </div>
              <div className="timeline-dot" />
            </motion.div>
          );
        })}
      </div>

      {/* ── Edit modal ── */}
      <AnimatePresence>
        {editing && (
          <motion.div className="tl-edit-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setEditing(null)}>
            <motion.div className="tl-edit-modal glass"
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}>

              <h2 className="tl-edit-title">Edit Moment ✏️</h2>

              <form onSubmit={save} className="tl-edit-form">
                <div className="tl-edit-row">
                  <div className="tl-edit-group" style={{ flex: 1 }}>
                    <label>Title</label>
                    <input className="tl-edit-input" value={form.title}
                      onChange={e => f('title', e.target.value)} required />
                  </div>
                  <div className="tl-edit-group" style={{ width: 70 }}>
                    <label>Emoji</label>
                    <input className="tl-edit-input" value={form.emoji}
                      onChange={e => f('emoji', e.target.value)}
                      style={{ textAlign: 'center', fontSize: '1.3rem' }} />
                  </div>
                </div>

                <div className="tl-edit-group">
                  <label>Description</label>
                  <textarea className="tl-edit-textarea" value={form.description}
                    onChange={e => f('description', e.target.value)} rows={3} />
                </div>

                <div className="tl-edit-group">
                  <label>Date</label>
                  <input className="tl-edit-input" value={form.event_date}
                    onChange={e => f('event_date', e.target.value)}
                    placeholder="e.g. January 15, 2023" />
                </div>

                {/* Image */}
                <div className="tl-edit-group">
                  <label>Image</label>
                  <div className="tl-edit-img-row">
                    <button type="button" className="tl-upload-btn"
                      onClick={() => fileRef.current.click()} disabled={uploading}>
                      {uploading ? 'Uploading…' : '📷 Upload'}
                    </button>
                    {form.media_url && (
                      <>
                        <img src={form.media_url} alt="" className="tl-edit-thumb" />
                        <button type="button" className="tl-remove-btn"
                          onClick={() => f('media_url', '')}>✕</button>
                      </>
                    )}
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
                    onChange={e => e.target.files[0] && uploadImage(e.target.files[0])} />
                  <input className="tl-edit-input" style={{ marginTop: 8 }}
                    placeholder="…or paste image URL"
                    value={form.media_url} onChange={e => f('media_url', e.target.value)} />
                </div>

                <div className="tl-edit-actions">
                  <button type="button" className="tl-cancel-btn" onClick={() => setEditing(null)}>Cancel</button>
                  <button type="submit" className="tl-save-btn" disabled={saving}>
                    {saving ? 'Saving…' : 'Save 💕'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
