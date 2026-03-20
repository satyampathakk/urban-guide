import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './SurpriseEngine.css';

const LOVE_MESSAGES = [
  "Every moment with you is my favorite moment 💕",
  "You are my sunshine on the cloudiest days ☀️",
  "I fall in love with you a little more every day 🌹",
  "You make the ordinary feel extraordinary ✨",
  "My heart found its home in you 🏡",
  "You are the poem I never knew how to write 📝",
  "Loving you is the best thing I've ever done 💖",
  "You are my today and all of my tomorrows 🌙",
];

const MOOD_MESSAGES = {
  happy: [
    "Your smile lights up the whole world 🌟",
    "I love seeing you this happy — it makes me happy too 😊",
    "Keep shining, my love ✨",
  ],
  sad: [
    "I'm right here with you, always 🤗",
    "Even on your darkest days, you are loved beyond measure 💕",
    "This too shall pass — and I'll be holding your hand through it 🌈",
  ],
  missing: [
    "Distance means nothing when someone means everything 💌",
    "I'm thinking of you right now, this very second 💭",
    "Every second apart makes me appreciate every second together 💞",
  ],
};

const SurpriseEngine = () => {
  const [show, setShow] = useState(false);
  const [message, setMessage] = useState('');
  const [confetti, setConfetti] = useState(false);
  const [mood, setMood] = useState(null);

  const surprise = () => {
    const msg = LOVE_MESSAGES[Math.floor(Math.random() * LOVE_MESSAGES.length)];
    setMessage(msg);
    setMood(null);
    setShow(true);
    setConfetti(true);
    setTimeout(() => setConfetti(false), 2500);
  };

  const selectMood = (m) => {
    const msgs = MOOD_MESSAGES[m];
    setMessage(msgs[Math.floor(Math.random() * msgs.length)]);
    setMood(m);
    setShow(true);
  };

  return (
    <>
      {/* Floating surprise button */}
      <motion.div
        className="surprise-fab glass"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={surprise}
        title="Surprise Me!"
      >
        🎁
      </motion.div>

      {/* Mood selector */}
      <div className="mood-bar glass">
        <span className="mood-label">How are you feeling?</span>
        {[['happy','😊'],['sad','😢'],['missing','💭']].map(([key, emoji]) => (
          <motion.button
            key={key}
            className="mood-btn"
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => selectMood(key)}
          >
            {emoji}
          </motion.button>
        ))}
      </div>

      {/* Message modal */}
      <AnimatePresence>
        {show && (
          <motion.div
            className="surprise-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShow(false)}
          >
            {confetti && (
              <div className="confetti-burst">
                {Array.from({ length: 20 }).map((_, i) => (
                  <motion.span
                    key={i}
                    className="confetti-piece"
                    initial={{ y: 0, x: 0, opacity: 1 }}
                    animate={{
                      y: Math.random() * -300 - 50,
                      x: (Math.random() - 0.5) * 400,
                      opacity: 0,
                      rotate: Math.random() * 720,
                    }}
                    transition={{ duration: 1.5 + Math.random(), ease: 'easeOut' }}
                  >
                    {['💖','🌹','✨','💌','🦋'][i % 5]}
                  </motion.span>
                ))}
              </div>
            )}
            <motion.div
              className="surprise-card glass"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 200 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="surprise-icon">{mood === 'sad' ? '🤗' : mood === 'missing' ? '💌' : '💖'}</div>
              <p className="surprise-message">{message}</p>
              <motion.button
                className="surprise-close romantic-button"
                onClick={() => setShow(false)}
                whileHover={{ scale: 1.05 }}
              >
                Close 💕
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default SurpriseEngine;
