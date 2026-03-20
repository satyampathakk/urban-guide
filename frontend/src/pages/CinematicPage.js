import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { mediaUrl } from '../utils/mediaUrl';
import './CinematicPage.css';

export default function CinematicPage() {
  const [chapters, setChapters] = useState([]);
  const [slides, setSlides] = useState([]);
  const [memories, setMemories] = useState([]);
  const [playing, setPlaying] = useState(false);
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [builtSlides, setBuiltSlides] = useState([]);

  useEffect(() => {
    Promise.all([
      axios.get('/api/story/chapters').catch(() => ({ data: [] })),
      axios.get('/api/story/slides').catch(() => ({ data: [] })),
      axios.get('/api/memories').catch(() => ({ data: [] })),
    ]).then(([ch, sl, mem]) => {
      setChapters(ch.data);
      setSlides(sl.data);
      setMemories(mem.data);
    });
  }, []);

  const buildSlides = useCallback(() => {
    const all = [];
    const sorted = [...chapters].sort((a, b) => a.sort_order - b.sort_order);

    sorted.forEach((ch, ci) => {
      // Chapter title card
      all.push({ type: 'chapter', id: `ch-${ch.id}`, title: ch.title, subtitle: ch.subtitle, emoji: ch.emoji, video_url: ch.video_url || '' });

      // Custom slides for this chapter
      const chSlides = slides
        .filter(s => s.chapter_id === ch.id)
        .sort((a, b) => a.sort_order - b.sort_order);

      if (chSlides.length > 0) {
        chSlides.forEach(sl => {
          if (sl.slide_type === 'memory') {
            // Use memories from the memories API, distributed across chapters
            const chunkSize = Math.ceil(memories.length / sorted.length);
            const chMems = memories.slice(ci * chunkSize, (ci + 1) * chunkSize);
            chMems.forEach(m => all.push({ type: 'memory', id: `mem-${m.id}`, title: m.title, caption: m.caption, image_url: m.image_url }));
          } else {
            all.push({ type: sl.slide_type, id: `sl-${sl.id}`, title: sl.title, caption: sl.caption, media_url: sl.media_url });
          }
        });
      } else {
        // Fallback: distribute memories evenly across chapters
        const chunkSize = Math.ceil(memories.length / sorted.length);
        const chMems = memories.slice(ci * chunkSize, (ci + 1) * chunkSize);
        chMems.forEach(m => all.push({ type: 'memory', id: `mem-${m.id}`, title: m.title, caption: m.caption, image_url: m.image_url }));
      }
    });

    all.push({ type: 'end', id: 'end' });
    return all;
  }, [chapters, slides, memories]);

  const start = () => {
    const s = buildSlides();
    setBuiltSlides(s);
    setStep(0);
    setDone(false);
    setPlaying(true);
  };

  const next = useCallback(() => {
    setStep(s => {
      if (s >= builtSlides.length - 1) { setDone(true); return s; }
      return s + 1;
    });
  }, [builtSlides.length]);

  const prev = () => setStep(s => Math.max(0, s - 1));

  // Auto-advance
  useEffect(() => {
    if (!playing || done) return;
    const current = builtSlides[step];
    const delay = current?.type === 'chapter' ? 3000 : current?.type === 'video' ? 8000 : 5000;
    const t = setTimeout(next, delay);
    return () => clearTimeout(t);
  }, [playing, step, builtSlides, done, next]);

  const current = builtSlides[step];
  const progress = builtSlides.length ? ((step + 1) / builtSlides.length) * 100 : 0;

  // ── Start screen ──
  if (!playing) {
    return (
      <div className="cinematic-start">
        <motion.div className="cinematic-start-card glass"
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <div className="cinematic-icon">🎬</div>
          <h1 className="cinematic-start-title">Our Story</h1>
          <p className="cinematic-start-sub">A cinematic journey through our memories</p>

          {chapters.length === 0 ? (
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', fontStyle: 'italic', margin: '20px 0' }}>
              No story chapters yet. Add them in the admin panel.
            </p>
          ) : (
            <>
              <div className="chapter-preview">
                {chapters.slice(0, 5).map((ch, i) => (
                  <div key={i} className="chapter-preview-item">
                    <span>{ch.emoji}</span>
                    <div>
                      <div className="cp-title">{ch.title}</div>
                      <div className="cp-sub">{ch.subtitle}</div>
                    </div>
                  </div>
                ))}
              </div>
              <motion.button className="cinematic-play-btn" onClick={start}
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                ▶ Play Our Story
              </motion.button>
            </>
          )}
        </motion.div>
      </div>
    );
  }

  // ── Player ──
  return (
    <div className="cinematic-player" onClick={next}>
      <div className="cinematic-progress">
        <motion.div className="cinematic-progress-fill"
          animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }} />
      </div>

      <div className="cinematic-controls" onClick={e => e.stopPropagation()}>
        <button className="cin-ctrl-btn" onClick={prev} disabled={step === 0}>‹</button>
        <button className="cin-ctrl-btn" onClick={() => setPlaying(false)}>✕</button>
        <button className="cin-ctrl-btn" onClick={next}>›</button>
      </div>

      <AnimatePresence mode="wait">
        {!done && current?.type === 'chapter' && (
          <motion.div key={current.id} className="cinematic-slide chapter-slide"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 1 }}>
            {/* Chapter background video */}
            {current.video_url && (
              <video
                src={mediaUrl(current.video_url)}
                autoPlay muted loop playsInline
                className="chapter-bg-video"
              />
            )}
            <div className="chapter-slide-content">
              <motion.div className="chapter-emoji"
                initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: 'spring' }}>
                {current.emoji}
              </motion.div>
              <motion.h2 className="chapter-title"
                initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}>
                {current.title}
              </motion.h2>
              <motion.p className="chapter-subtitle"
                initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.8 }}>
                {current.subtitle}
              </motion.p>
            </div>
          </motion.div>
        )}

        {!done && current?.type === 'memory' && (
          <motion.div key={current.id} className="cinematic-slide memory-slide"
            initial={{ opacity: 0, scale: 1.05 }} animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 1.2 }}>
            {current.image_url
              ? <img src={mediaUrl(current.image_url)} alt={current.title} className="cinematic-img" onError={e => { e.target.style.display = 'none'; }} />
              : <div className="cinematic-img-placeholder">💕</div>}
            <div className="cinematic-text-overlay">
              <motion.h2 className="cinematic-memory-title"
                initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }}>
                {current.title}
              </motion.h2>
              <motion.p className="cinematic-memory-caption"
                initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 1 }}>
                {current.caption}
              </motion.p>
            </div>
          </motion.div>
        )}

        {!done && current?.type === 'image' && (
          <motion.div key={current.id} className="cinematic-slide memory-slide"
            initial={{ opacity: 0, scale: 1.05 }} animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 1.2 }}>
            {current.media_url
              ? <img src={mediaUrl(current.media_url)} alt={current.title} className="cinematic-img" />
              : <div className="cinematic-img-placeholder">🖼️</div>}
            <div className="cinematic-text-overlay">
              <motion.h2 className="cinematic-memory-title"
                initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }}>
                {current.title}
              </motion.h2>
              {current.caption && (
                <motion.p className="cinematic-memory-caption"
                  initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 1 }}>
                  {current.caption}
                </motion.p>
              )}
            </div>
          </motion.div>
        )}

        {!done && current?.type === 'video' && (
          <motion.div key={current.id} className="cinematic-slide video-slide"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            exit={{ opacity: 0 }} transition={{ duration: 0.8 }}
            onClick={e => e.stopPropagation()}>
            <video
              src={mediaUrl(current.media_url)}
              className="cinematic-video"
              autoPlay
              controls
              onEnded={next}
            />
            {(current.title || current.caption) && (
              <div className="cinematic-text-overlay">
                {current.title && <motion.h2 className="cinematic-memory-title"
                  initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}>
                  {current.title}
                </motion.h2>}
                {current.caption && <motion.p className="cinematic-memory-caption"
                  initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.8 }}>
                  {current.caption}
                </motion.p>}
              </div>
            )}
          </motion.div>
        )}

        {done && (
          <motion.div key="end" className="cinematic-slide end-slide"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.5 }}>
            <motion.div className="end-hearts"
              animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }}>
              💕
            </motion.div>
            <h2 className="end-title">The story continues…</h2>
            <p className="end-sub">Every day with you is a new chapter.</p>
            <motion.button className="cinematic-play-btn"
              onClick={() => { setPlaying(false); setDone(false); }}
              whileHover={{ scale: 1.05 }}>
              Watch Again 🎬
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="cinematic-hint">Click anywhere to advance</p>
    </div>
  );
}
