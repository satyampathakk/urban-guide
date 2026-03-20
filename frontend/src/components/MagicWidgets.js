import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { mediaUrl } from '../utils/mediaUrl';
import './MagicWidgets.css';

// ── Mystery Box ───────────────────────────────────────────────────────────────
const BOX_SURPRISES = [
  { type: 'note',  content: "You are the best thing that ever happened to me 💕" },
  { type: 'note',  content: "I fall in love with you a little more every single day 🌹" },
  { type: 'note',  content: "You make ordinary moments feel like magic ✨" },
  { type: 'note',  content: "My heart chose you, and it would choose you again 💖" },
  { type: 'note',  content: "You are my favorite notification 📱💕" },
  { type: 'emoji', content: "🌹💕✨🦋💌🌙⭐💖" },
];

export function MysteryBox() {
  const [open, setOpen] = useState(false);
  const [surprise, setSurprise] = useState(null);
  const [shaking, setShaking] = useState(false);

  const shake = () => {
    if (open) return;
    setShaking(true);
    setTimeout(() => setShaking(false), 600);
  };

  const openBox = () => {
    const s = BOX_SURPRISES[Math.floor(Math.random() * BOX_SURPRISES.length)];
    setSurprise(s);
    setOpen(true);
  };

  const reset = () => { setOpen(false); setSurprise(null); };

  return (
    <>
      <motion.div className="mystery-box-wrap"
        animate={shaking ? { rotate: [-5, 5, -5, 5, 0] } : {}}
        transition={{ duration: 0.5 }}
        onHoverStart={shake}>
        <motion.button className="mystery-box-btn glass"
          onClick={openBox} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          disabled={open}>
          <span className="mystery-box-icon">{open ? '📭' : '🎁'}</span>
          <span className="mystery-box-label">Mystery Box</span>
        </motion.button>
      </motion.div>

      <AnimatePresence>
        {open && surprise && (
          <motion.div className="mystery-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={reset}>
            <motion.div className="mystery-reveal glass"
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0 }}
              transition={{ type: 'spring', stiffness: 200 }}
              onClick={e => e.stopPropagation()}>
              <motion.div className="mystery-sparkle"
                animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}>
                ✨
              </motion.div>
              {surprise.type === 'emoji' ? (
                <div className="mystery-emoji-burst">
                  {surprise.content.split('').map((c, i) => (
                    <motion.span key={i} initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }} transition={{ delay: i * 0.1 }}>
                      {c}
                    </motion.span>
                  ))}
                </div>
              ) : (
                <p className="mystery-note">{surprise.content}</p>
              )}
              <motion.button className="mystery-close-btn" onClick={reset}
                whileHover={{ scale: 1.05 }}>
                💕 Close
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ── "Remember This Day?" popup ────────────────────────────────────────────────
export function RememberThisDay() {
  const [memory, setMemory] = useState(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Show after 30 seconds on the app
    const t = setTimeout(async () => {
      try {
        const { data } = await axios.get('/api/memories');
        if (data.length) {
          const random = data[Math.floor(Math.random() * data.length)];
          setMemory(random);
          setShow(true);
        }
      } catch {
        // fallback
        setMemory({ title: 'Our First Hello', caption: 'The moment everything changed 💕', image_url: '', date_created: '2023-01-15' });
        setShow(true);
      }
    }, 30000);
    return () => clearTimeout(t);
  }, []);

  if (!show || !memory) return null;

  return (
    <AnimatePresence>
      <motion.div className="remember-popup glass"
        initial={{ opacity: 0, x: 100, y: 20 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        exit={{ opacity: 0, x: 100 }}
        transition={{ type: 'spring', stiffness: 150 }}>
        <button className="remember-close" onClick={() => setShow(false)}>✕</button>
        <div className="remember-header">
          <span className="remember-icon">💭</span>
          <span className="remember-label">Remember this day?</span>
        </div>
        {memory.image_url && (
          <img src={mediaUrl(memory.image_url)} alt={memory.title} className="remember-img"
            onError={e => { e.target.style.display = 'none'; }} />
        )}
        <p className="remember-title">{memory.title}</p>
        <p className="remember-caption">{memory.caption}</p>
        <p className="remember-date">
          {new Date(memory.date_created).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Countdown ─────────────────────────────────────────────────────────────────
const COUNTDOWNS = [
  { label: 'Our Anniversary', date: '2025-01-15', emoji: '🎉' },
  { label: 'Valentine\'s Day', date: '2026-02-14', emoji: '💕' },
];

export function CountdownWidget() {
  const [ticks, setTicks] = useState({});

  useEffect(() => {
    const calc = () => {
      const now = new Date();
      const result = {};
      COUNTDOWNS.forEach(c => {
        const target = new Date(c.date);
        // If past, use next year
        if (target < now) target.setFullYear(now.getFullYear() + 1);
        const diff = target - now;
        result[c.label] = {
          days:    Math.floor(diff / 86400000),
          hours:   Math.floor((diff % 86400000) / 3600000),
          minutes: Math.floor((diff % 3600000) / 60000),
        };
      });
      setTicks(result);
    };
    calc();
    const t = setInterval(calc, 60000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="countdown-widget glass">
      <p className="countdown-header">⏳ Coming Soon</p>
      {COUNTDOWNS.map(c => {
        const t = ticks[c.label];
        return (
          <div key={c.label} className="countdown-item">
            <span className="countdown-emoji">{c.emoji}</span>
            <div className="countdown-info">
              <span className="countdown-label">{c.label}</span>
              {t && (
                <span className="countdown-time">
                  {t.days}d {t.hours}h {t.minutes}m
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
