import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { mediaUrl } from '../utils/mediaUrl';
import './VideosPage.css';

export default function VideosPage() {
  const [videos, setVideos]   = useState([]);
  const [playing, setPlaying] = useState(null); // selected video object
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      axios.get('/api/story/slides').catch(() => ({ data: [] })),
      axios.get('/api/story/chapters').catch(() => ({ data: [] })),
    ]).then(([sl, ch]) => {
      // Collect video slides
      const slideVideos = (sl.data || [])
        .filter(s => s.slide_type === 'video' && s.media_url)
        .map(s => ({ id: `slide-${s.id}`, title: s.title || 'Our Moment', caption: s.caption || '', url: s.media_url }));

      // Collect chapter background videos
      const chapterVideos = (ch.data || [])
        .filter(c => c.video_url)
        .map(c => ({ id: `ch-${c.id}`, title: c.title, caption: c.subtitle || '', url: c.video_url }));

      setVideos([...chapterVideos, ...slideVideos]);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="vp-loading">
      <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1, repeat: Infinity }}>🎬</motion.div>
      <p>Loading videos…</p>
    </div>
  );

  return (
    <div className="vp-page">
      <motion.h1 className="vp-heading"
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        🎬 Our Videos
      </motion.h1>
      <p className="vp-subtitle">Every moment we captured together</p>

      {videos.length === 0 ? (
        <div className="vp-empty">
          <div className="vp-empty-icon">🎥</div>
          <p>No videos yet. Upload them in the admin panel under Story.</p>
        </div>
      ) : (
        <div className="vp-grid">
          {videos.map((v, i) => (
            <motion.div key={v.id} className="vp-card glass"
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              whileHover={{ scale: 1.03, y: -4 }}
              onClick={() => setPlaying(v)}>
              <div className="vp-thumb">
                <video src={mediaUrl(v.url)} className="vp-thumb-video" muted preload="metadata" />
                <div className="vp-play-overlay">
                  <div className="vp-play-btn">▶</div>
                </div>
              </div>
              <div className="vp-info">
                <p className="vp-title">{v.title}</p>
                {v.caption && <p className="vp-caption">{v.caption}</p>}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Lightbox player */}
      <AnimatePresence>
        {playing && (
          <motion.div className="vp-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setPlaying(null)}>
            <motion.div className="vp-player glass"
              initial={{ scale: 0.88, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.88, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 220, damping: 22 }}
              onClick={e => e.stopPropagation()}>
              <button className="vp-close" onClick={() => setPlaying(null)}>✕</button>
              <video
                src={mediaUrl(playing.url)}
                className="vp-video"
                controls
                autoPlay
              />
              <div className="vp-player-info">
                <p className="vp-title">{playing.title}</p>
                {playing.caption && <p className="vp-caption">{playing.caption}</p>}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
