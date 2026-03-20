import React, { useState, useRef, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import './Navigation.css';

const LOVE_MESSAGES = [
  "You make every day magical ✨",
  "My heart skips a beat when I see you 💓",
  "You're my favorite person in the whole world 🌍",
  "Every moment with you is a treasure 💎",
  "You're the reason I believe in love 💕",
];

// Primary nav — always visible
const PRIMARY = [
  { path: '/memories',  label: 'Memories', icon: '📖' },
  { path: '/messages',  label: 'Messages', icon: '💬' },
  { path: '/poetry',    label: 'Poetry',   icon: '✍️'  },
  { path: '/timeline',  label: 'Timeline', icon: '💞' },
  { path: '/universe',  label: 'Universe', icon: '🌌' },
  { path: '/cinematic', label: 'Story',    icon: '🎬' },
];

// Secondary nav — inside "More" dropdown
const MORE = [
  { path: '/game',       label: 'Mini Game',   icon: '🎮' },
  { path: '/match',      label: 'Memory Match',icon: '💖' },
  { path: '/wheel',      label: 'Photo Wheel', icon: '💿' },
  { path: '/voice',      label: 'Voice Capsule', icon: 'VC' },
  { path: '/secrets',    label: 'Secrets',     icon: '🔐' },
  { path: '/timelocked', label: 'Letters',     icon: '⏳' },
];

const Navigation = () => {
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (moreRef.current && !moreRef.current.contains(e.target)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSurprise = () => {
    const msg = LOVE_MESSAGES[Math.floor(Math.random() * LOVE_MESSAGES.length)];
    alert(msg);
  };

  return (
    <motion.nav
      className="main-navigation glass"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, delay: 0.2 }}
    >
      <div className="nav-container">
        {/* Logo */}
        <div className="nav-logo">
          <span className="logo-text">Our World 💕</span>
        </div>

        {/* Primary items */}
        <div className="nav-items">
          {PRIMARY.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <motion.span
                whileHover={{ scale: 1.08, y: -2 }}
                whileTap={{ scale: 0.95 }}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </motion.span>
            </NavLink>
          ))}

          {/* More dropdown */}
          <div className="nav-more-wrap" ref={moreRef}>
            <motion.button
              className={`nav-item nav-more-btn ${moreOpen ? 'active' : ''}`}
              onClick={() => setMoreOpen(o => !o)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="nav-icon">✦</span>
              <span className="nav-label">More</span>
              <span className="nav-more-arrow" style={{ transform: moreOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</span>
            </motion.button>

            <AnimatePresence>
              {moreOpen && (
                <motion.div
                  className="nav-dropdown glass"
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.18 }}
                >
                  {MORE.map(item => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={({ isActive }) => `nav-dropdown-item${isActive ? ' active' : ''}`}
                      onClick={() => setMoreOpen(false)}
                    >
                      <span className="nav-icon">{item.icon}</span>
                      <span>{item.label}</span>
                    </NavLink>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Surprise button */}
        <motion.button
          className="surprise-button"
          onClick={handleSurprise}
          whileHover={{ scale: 1.1, rotate: 5 }}
          whileTap={{ scale: 0.9 }}
          title="Surprise!"
        >
          ✨
        </motion.button>
      </div>
    </motion.nav>
  );
};

export default Navigation;
