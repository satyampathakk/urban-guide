import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './SecretTrigger.css';

const SECRET_WORD = 'forever';
const HEART_COUNT = 5;

const SecretTrigger = () => {
  const [heartsClicked, setHeartsClicked] = useState([]);
  const [secretInput, setSecretInput] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [mode, setMode] = useState(null); // 'hearts' | 'word'

  const clickHeart = (i) => {
    const next = [...heartsClicked, i];
    setHeartsClicked(next);
    if (next.length === HEART_COUNT) {
      setTimeout(() => { setRevealed(true); setHeartsClicked([]); }, 300);
    }
  };

  const checkWord = (e) => {
    e.preventDefault();
    if (secretInput.trim().toLowerCase() === SECRET_WORD) {
      setRevealed(true);
      setSecretInput('');
    }
  };

  return (
    <div className="secret-section glass">
      <h3 className="secret-title">🔐 Hidden Secrets</h3>
      <p className="secret-hint">Unlock a hidden love letter...</p>

      <div className="secret-methods">
        <motion.button
          className={`method-btn ${mode === 'hearts' ? 'active' : ''}`}
          onClick={() => { setMode('hearts'); setHeartsClicked([]); }}
          whileHover={{ scale: 1.05 }}
        >
          Click 5 Hearts 💕
        </motion.button>
        <motion.button
          className={`method-btn ${mode === 'word' ? 'active' : ''}`}
          onClick={() => setMode('word')}
          whileHover={{ scale: 1.05 }}
        >
          Type Secret Word 🔑
        </motion.button>
      </div>

      <AnimatePresence mode="wait">
        {mode === 'hearts' && (
          <motion.div
            key="hearts"
            className="hearts-row"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {Array.from({ length: HEART_COUNT }).map((_, i) => (
              <motion.button
                key={i}
                className={`secret-heart ${heartsClicked.includes(i) ? 'clicked' : ''}`}
                onClick={() => !heartsClicked.includes(i) && clickHeart(i)}
                whileHover={{ scale: 1.3 }}
                whileTap={{ scale: 0.8 }}
                animate={heartsClicked.includes(i) ? { scale: [1, 1.4, 1] } : {}}
              >
                {heartsClicked.includes(i) ? '❤️' : '🤍'}
              </motion.button>
            ))}
            <p className="hearts-progress">{heartsClicked.length}/{HEART_COUNT}</p>
          </motion.div>
        )}

        {mode === 'word' && (
          <motion.form
            key="word"
            className="secret-form"
            onSubmit={checkWord}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <input
              type="text"
              value={secretInput}
              onChange={e => setSecretInput(e.target.value)}
              placeholder="Type the secret word..."
              className="romantic-input secret-input"
            />
            <motion.button
              type="submit"
              className="romantic-button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Unlock 🔓
            </motion.button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Revealed letter */}
      <AnimatePresence>
        {revealed && (
          <motion.div
            className="love-letter-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setRevealed(false)}
          >
            <motion.div
              className="love-letter glass"
              initial={{ scale: 0.7, rotate: -5, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              exit={{ scale: 0.7, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 180 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="letter-seal">💌</div>
              <h2 className="letter-heading">A Letter Just For You</h2>
              <div className="letter-body">
                <p>My dearest love,</p>
                <p>
                  If you're reading this, you found the secret — just like you found your way into my heart.
                  Every day with you is a gift I never expected and always treasure.
                </p>
                <p>
                  You are the reason I believe in magic. The way you laugh, the way you care,
                  the way you make everything feel safe and warm — it's all you.
                </p>
                <p>
                  I wrote this for the moments when you need to be reminded:
                  you are deeply, completely, endlessly loved.
                </p>
                <p className="letter-sign">Forever yours 💕</p>
              </div>
              <motion.button
                className="romantic-button"
                onClick={() => setRevealed(false)}
                whileHover={{ scale: 1.05 }}
              >
                Close 🌹
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SecretTrigger;
