import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { mediaUrl } from '../utils/mediaUrl';
import './TimeLockedPage.css';

// Fallback sample data
const SAMPLE_UNLOCKED = [
  {
    id: 1,
    title: "On Our First Anniversary 🎉",
    content: "One year ago today, everything changed. You walked into my life and made it infinitely better. Here's to forever with you.",
    unlock_at: "2024-01-15T00:00:00",
    occasion: "Anniversary"
  },
  {
    id: 2,
    title: "For Your Birthday 🎂",
    content: "Happy birthday, my love. Today the world got a little brighter because you're in it. I hope this year brings you everything you deserve.",
    unlock_at: "2024-03-10T00:00:00",
    occasion: "Birthday"
  },
];

const SAMPLE_LOCKED = [
  { id: 3, title: "For When You Feel Sad 💔", unlock_at: "2027-01-01T00:00:00", occasion: "Anytime" },
  { id: 4, title: "Our Next Adventure ✈️", unlock_at: "2027-06-01T00:00:00", occasion: "Travel" },
];

const TimeLockedPage = () => {
  const [unlocked, setUnlocked] = useState([]);
  const [locked, setLocked] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      axios.get('/api/time-messages').catch(() => ({ data: SAMPLE_UNLOCKED })),
      axios.get('/api/time-messages/locked').catch(() => ({ data: SAMPLE_LOCKED })),
    ]).then(([u, l]) => {
      setUnlocked(u.data.length ? u.data : SAMPLE_UNLOCKED);
      setLocked(l.data.length ? l.data : SAMPLE_LOCKED);
    }).finally(() => setLoading(false));
  }, []);

  const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const countdown = (d) => {
    const diff = new Date(d) - new Date();
    if (diff <= 0) return 'Unlocked!';
    const days = Math.floor(diff / 86400000);
    return `${days} day${days !== 1 ? 's' : ''} away`;
  };

  if (loading) return (
    <div className="tl-loading">
      <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }}>⏳</motion.div>
    </div>
  );

  return (
    <motion.div
      className="tl-page"
      initial={{ y: 16, opacity: 1 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <h1 className="tl-heading">⏳ Time-Locked Messages</h1>
      <p className="tl-subtitle">Messages that unlock at special moments in time</p>

      {/* Unlocked */}
      {unlocked.length > 0 && (
        <section className="tl-section">
          <h2 className="tl-section-title">💌 Unlocked Messages</h2>
          <div className="tl-grid">
            {unlocked.map((msg, i) => (
              <motion.div
                key={msg.id}
                className="tl-card glass unlocked"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ scale: 1.02, y: -4 }}
                onClick={() => setSelected(msg)}
              >
                <div className="tl-card-icon">💌</div>
                <h3 className="tl-card-title">{msg.title}</h3>
                <p className="tl-card-date">{formatDate(msg.unlock_at)}</p>
                {msg.occasion && <span className="tl-badge">{msg.occasion}</span>}
                <p className="tl-read-more">Click to read ✨</p>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Locked */}
      {locked.length > 0 && (
        <section className="tl-section">
          <h2 className="tl-section-title">🔒 Coming Soon</h2>
          <div className="tl-grid">
            {locked.map((msg, i) => (
              <motion.div
                key={msg.id}
                className="tl-card glass locked"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="tl-card-icon">🔒</div>
                <h3 className="tl-card-title">{msg.title}</h3>
                <p className="tl-card-date">Unlocks: {formatDate(msg.unlock_at)}</p>
                <p className="tl-countdown">{countdown(msg.unlock_at)}</p>
                {msg.occasion && <span className="tl-badge locked-badge">{msg.occasion}</span>}
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Message modal */}
      <AnimatePresence>
        {selected && (
          <motion.div
            className="tl-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelected(null)}
          >
            <motion.div
              className="tl-modal glass"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="tl-modal-icon">💌</div>
              <h2 className="tl-modal-title">{selected.title}</h2>
              <p className="tl-modal-date">{formatDate(selected.unlock_at)}</p>
              {selected.image_url && (
                <img
                  src={mediaUrl(selected.image_url)}
                  alt={selected.title}
                  className="tl-modal-img"
                  onError={e => { e.target.style.display = 'none'; }}
                />
              )}
              <div className="tl-modal-content">{selected.content}</div>
              <motion.button
                className="romantic-button"
                onClick={() => setSelected(null)}
                whileHover={{ scale: 1.05 }}
              >
                Close 💕
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default TimeLockedPage;
