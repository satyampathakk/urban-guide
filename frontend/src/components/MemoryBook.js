import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { mediaUrl } from '../utils/mediaUrl';
import './MemoryBook.css';

const FALLBACK = [
  { id:1, title:'Our First Date',      caption:'The day everything changed 💕',           image_url:'', date_created:'2024-01-15' },
  { id:2, title:'Beach Sunset',        caption:'Walking hand in hand as the sun set 🌅',  image_url:'', date_created:'2024-02-20' },
  { id:3, title:'Anniversary Dinner',  caption:'One year of pure happiness 🎉',           image_url:'', date_created:'2024-03-10' },
  { id:4, title:'First Trip',          caption:'We got lost and loved every second ✈️',   image_url:'', date_created:'2024-04-05' },
  { id:5, title:'Said I Love You',     caption:'Three words. A thousand feelings 💕',     image_url:'', date_created:'2024-05-14' },
  { id:6, title:'Rainy Day In',        caption:'Hot cocoa and your laugh 🍫',             image_url:'', date_created:'2024-06-01' },
];

// Fisher-Yates shuffle — returns a new array
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function MemoryCard({ mem, i, onClick }) {
  const [imgFailed, setImgFailed] = useState(false);
  const showImg = mem.image_url && !imgFailed;

  return (
    <motion.div
      className="mb-card"
      style={{ '--tilt': `${TILTS[i % TILTS.length]}deg` }}
      initial={{ opacity: 0, y: 40, rotate: TILTS[i % TILTS.length] }}
      animate={{ opacity: 1, y: 0, rotate: TILTS[i % TILTS.length] }}
      transition={{ duration: 0.5, delay: i * 0.07 }}
      whileHover={{ scale: 1.06, rotate: 0, zIndex: 10 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
    >
      <div className="mb-photo">
        {showImg ? (
          <img src={mediaUrl(mem.image_url)} alt={mem.title} className="mb-img"
            onError={() => setImgFailed(true)} />
        ) : (
          <div className="mb-emoji-fill"
            style={{ background: `hsl(${(i * 47 + 280) % 360}deg, 40%, 18%)` }}>
            {EMOJI_FALLBACKS[i % EMOJI_FALLBACKS.length]}
          </div>
        )}
      </div>
      <div className="mb-caption-strip">
        <span className="mb-card-title">{mem.title}</span>
        <span className="mb-card-date">
          {mem.date_created ? new Date(mem.date_created).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''}
        </span>
      </div>
    </motion.div>
  );
}
const TILTS = [-3, -1.5, 0, 1.5, 3, -2, 2, -1, 1, -2.5, 2.5, 0.5];

const EMOJI_FALLBACKS = ['💕','🌹','✨','💌','🦋','🌙','🎀','🌸','💫','🎶','🌺','💝'];

export default function MemoryBook() {
  const [raw, setRaw]         = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/memories')
      .then(r => setRaw(r.data.length ? r.data : FALLBACK))
      .catch(() => setRaw(FALLBACK))
      .finally(() => setLoading(false));
  }, []);

  // Shuffle once when data arrives — useMemo so it doesn't re-shuffle on re-render
  const memories = useMemo(() => shuffle(raw), [raw]);

  if (loading) return (
    <div className="mb-loading">
      <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1, repeat: Infinity }}>
        💕
      </motion.div>
      <p>Loading our precious memories…</p>
    </div>
  );

  return (
    <div className="mb-page">
      <motion.h1 className="romantic-title section-title"
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        Our Memory Book
      </motion.h1>
      <p className="mb-subtitle">Every moment we've shared, scattered like stars ✨</p>

      {/* Polaroid grid */}
      <div className="mb-grid">
        {memories.map((mem, i) => (
          <motion.div
            key={mem.id}
            className="mb-card"
            style={{ '--tilt': `${TILTS[i % TILTS.length]}deg` }}
            initial={{ opacity: 0, y: 40, rotate: TILTS[i % TILTS.length] }}
            animate={{ opacity: 1, y: 0,  rotate: TILTS[i % TILTS.length] }}
            transition={{ duration: 0.5, delay: i * 0.07 }}
            whileHover={{ scale: 1.06, rotate: 0, zIndex: 10 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setSelected(mem)}
          >
            <div className="mb-photo">
              {mem.image_url ? (
                <img src={mediaUrl(mem.image_url)} alt={mem.title} className="mb-img"
                  onError={e => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }} />
              ) : null}
              <div className="mb-emoji-fill" style={{
                display: mem.image_url ? 'none' : 'flex',
                background: `hsl(${(i * 47 + 280) % 360}deg, 40%, 18%)`
              }}>
                {EMOJI_FALLBACKS[i % EMOJI_FALLBACKS.length]}
              </div>
            </div>
            <div className="mb-caption-strip">
              <span className="mb-card-title">{mem.title}</span>
              <span className="mb-card-date">
                {mem.date_created ? new Date(mem.date_created).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selected && (
          <motion.div className="mb-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSelected(null)}>
            <motion.div className="mb-lightbox glass"
              initial={{ scale: 0.85, opacity: 0, y: 30 }}
              animate={{ scale: 1,    opacity: 1, y: 0 }}
              exit={{    scale: 0.85, opacity: 0, y: 30 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              onClick={e => e.stopPropagation()}>

              {selected.image_url ? (
                <img src={mediaUrl(selected.image_url)} alt={selected.title} className="mb-lb-img"
                  onError={e => { e.target.style.display = 'none'; }} />
              ) : (
                <div className="mb-lb-emoji" style={{ background: `hsl(${(memories.findIndex(m=>m.id===selected.id)*47+280)%360}deg,40%,18%)` }}>
                  {EMOJI_FALLBACKS[memories.findIndex(m => m.id === selected.id) % EMOJI_FALLBACKS.length]}
                </div>
              )}

              <div className="mb-lb-body">
                <h2 className="mb-lb-title">{selected.title}</h2>
                <p className="mb-lb-caption">{selected.caption}</p>
                {selected.date_created && (
                  <p className="mb-lb-date">
                    {new Date(selected.date_created).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                )}
              </div>

              <button className="mb-lb-close" onClick={() => setSelected(null)}>✕</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
