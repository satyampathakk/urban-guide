import React, { useState, useEffect, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './MoodSystem.css';

// ── Context ───────────────────────────────────────────────────────────────────
export const MoodContext = createContext({ mood: 'happy', setMood: () => {} });
export const useMood = () => useContext(MoodContext);

const TIME_MESSAGES = {
  morning:   ["Good morning, sunshine ☀️", "Rise and shine, my love 🌸", "A new day to love you more 💕"],
  afternoon: ["Hope your day is as beautiful as you are 🌼", "Thinking of you right now 💭", "You make every afternoon golden ✨"],
  evening:   ["The sunset reminds me of you 🌅", "Can't wait to tell you about my day 💬", "Every evening is better knowing you exist 🌙"],
  night:     ["Sweet dreams, my love 🌙", "The stars are out, just like your eyes ✨", "Goodnight from the one who loves you most 💕"],
  latenight: ["Still awake? I'm thinking of you 🌌", "The night is quiet but my heart is loud 💓", "Late nights feel less lonely knowing you're out there 🌠"],
};

const MOOD_CONFIG = {
  happy:   { emoji: '😊', label: 'Happy',      gradient: 'linear-gradient(135deg, #ff69b4, #ffd700)', messages: ["Your happiness is my happiness 💕", "Keep smiling, it lights up the world ✨", "I love seeing you this way 🌸"] },
  sad:     { emoji: '😢', label: 'Sad',        gradient: 'linear-gradient(135deg, #667eea, #764ba2)', messages: ["I'm right here with you 🤗", "This too shall pass, and I'll be holding your hand 💙", "You are never alone in this 💕"] },
  missing: { emoji: '💭', label: 'Missing You', gradient: 'linear-gradient(135deg, #c471ed, #f64f59)', messages: ["Distance means nothing when someone means everything 💌", "I feel it too, every single second 💞", "Every moment apart makes me treasure every moment together 🌹"] },
  loved:   { emoji: '🥰', label: 'Loved',      gradient: 'linear-gradient(135deg, #f093fb, #f5576c)', messages: ["You deserve all the love in the world 💖", "And I plan to give it to you 🌹", "You are so deeply, completely loved 💕"] },
  tired:   { emoji: '😴', label: 'Tired',      gradient: 'linear-gradient(135deg, #4facfe, #00f2fe)', messages: ["Rest, my love. You've done enough today 🌙", "Close your eyes, I'll be here when you wake 💤", "Even tired, you're the most beautiful thing 💕"] },
};

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h >= 5  && h < 12) return 'morning';
  if (h >= 12 && h < 17) return 'afternoon';
  if (h >= 17 && h < 21) return 'evening';
  if (h >= 21 && h < 24) return 'night';
  return 'latenight';
}

// ── Time-based greeting banner ────────────────────────────────────────────────
export function TimeGreeting() {
  const [msg, setMsg] = useState('');
  const [show, setShow] = useState(false);

  useEffect(() => {
    const tod = getTimeOfDay();
    const msgs = TIME_MESSAGES[tod];
    setMsg(msgs[Math.floor(Math.random() * msgs.length)]);
    setShow(true);
    const t = setTimeout(() => setShow(false), 5000);
    return () => clearTimeout(t);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div className="time-greeting"
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.5 }}>
          {msg}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Mood Selector ─────────────────────────────────────────────────────────────
export function MoodSelector() {
  const { mood, setMood } = useMood();
  const [open, setOpen] = useState(false);
  const [showMsg, setShowMsg] = useState(false);
  const [currentMsg, setCurrentMsg] = useState('');

  const selectMood = (key) => {
    setMood(key);
    setOpen(false);
    const msgs = MOOD_CONFIG[key].messages;
    setCurrentMsg(msgs[Math.floor(Math.random() * msgs.length)]);
    setShowMsg(true);
    setTimeout(() => setShowMsg(false), 4000);
  };

  return (
    <>
      <motion.button className="mood-fab" onClick={() => setOpen(o => !o)}
        whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
        title="How are you feeling?">
        {MOOD_CONFIG[mood]?.emoji || '💭'}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div className="mood-picker glass"
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}>
            <p className="mood-picker-title">How are you feeling?</p>
            <div className="mood-options">
              {Object.entries(MOOD_CONFIG).map(([key, cfg]) => (
                <motion.button key={key}
                  className={`mood-option ${mood === key ? 'active' : ''}`}
                  onClick={() => selectMood(key)}
                  whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}>
                  <span className="mood-emoji">{cfg.emoji}</span>
                  <span className="mood-label-text">{cfg.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showMsg && (
          <motion.div className="mood-message glass"
            initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 60 }}>
            {currentMsg}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ── Provider ──────────────────────────────────────────────────────────────────
export function MoodProvider({ children }) {
  const [mood, setMood] = useState('happy');
  const cfg = MOOD_CONFIG[mood];

  // Apply mood gradient as CSS variable
  useEffect(() => {
    document.documentElement.style.setProperty('--mood-gradient', cfg.gradient);
  }, [mood, cfg]);

  return (
    <MoodContext.Provider value={{ mood, setMood, config: cfg }}>
      {children}
    </MoodContext.Provider>
  );
}

export { MOOD_CONFIG };
