import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './MiniGame.css';

// --- Memory Card Game ---
const CARD_EMOJIS = ['💖', '🌹', '💌', '🌙', '✨', '🦋', '💐', '🍓'];
const CARDS = [...CARD_EMOJIS, ...CARD_EMOJIS].map((emoji, i) => ({ id: i, emoji, flipped: false, matched: false }));

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

const MiniGame = () => {
  const [cards, setCards] = useState(() => shuffle(CARDS));
  const [selected, setSelected] = useState([]);
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);
  const [locked, setLocked] = useState(false);

  const resetGame = useCallback(() => {
    setCards(shuffle(CARDS.map(c => ({ ...c, flipped: false, matched: false }))));
    setSelected([]);
    setMoves(0);
    setWon(false);
    setLocked(false);
  }, []);

  const handleCardClick = (card) => {
    if (locked || card.flipped || card.matched) return;

    const newCards = cards.map(c => c.id === card.id ? { ...c, flipped: true } : c);
    setCards(newCards);
    const newSelected = [...selected, card];
    setSelected(newSelected);

    if (newSelected.length === 2) {
      setLocked(true);
      setMoves(m => m + 1);
      const [a, b] = newSelected;
      if (a.emoji === b.emoji) {
        setTimeout(() => {
          setCards(prev => prev.map(c => c.emoji === a.emoji ? { ...c, matched: true } : c));
          setSelected([]);
          setLocked(false);
        }, 500);
      } else {
        setTimeout(() => {
          setCards(prev => prev.map(c => (c.id === a.id || c.id === b.id) ? { ...c, flipped: false } : c));
          setSelected([]);
          setLocked(false);
        }, 900);
      }
    }
  };

  useEffect(() => {
    if (cards.length > 0 && cards.every(c => c.matched)) {
      setTimeout(() => setWon(true), 400);
    }
  }, [cards]);

  return (
    <div className="minigame-container">
      <motion.div
        className="minigame-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="minigame-title">💝 Memory of Love</h2>
        <p className="minigame-subtitle">Match all the pairs to unlock a surprise</p>
        <span className="minigame-moves">Moves: {moves}</span>
      </motion.div>

      <AnimatePresence>
        {won ? (
          <WinScreen moves={moves} onReplay={resetGame} />
        ) : (
          <motion.div
            className="card-grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {cards.map(card => (
              <CardTile key={card.id} card={card} onClick={() => handleCardClick(card)} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const CardTile = ({ card, onClick }) => (
  <motion.div
    className={`card-tile ${card.flipped || card.matched ? 'flipped' : ''} ${card.matched ? 'matched' : ''}`}
    onClick={onClick}
    whileHover={{ scale: card.flipped || card.matched ? 1 : 1.05 }}
    whileTap={{ scale: 0.95 }}
    layout
  >
    <div className="card-inner">
      <div className="card-front">💗</div>
      <div className="card-back">{card.emoji}</div>
    </div>
  </motion.div>
);

const WinScreen = ({ moves, onReplay }) => (
  <motion.div
    className="win-screen"
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.6, type: 'spring' }}
  >
    <div className="confetti-hearts">
      {Array.from({ length: 18 }).map((_, i) => (
        <motion.span
          key={i}
          className="confetti-heart"
          initial={{ y: -20, opacity: 0, x: Math.random() * 300 - 150 }}
          animate={{ y: 300, opacity: [1, 1, 0], rotate: Math.random() * 360 }}
          transition={{ duration: 2 + Math.random(), delay: i * 0.1, repeat: Infinity }}
        >
          {['💖', '🌹', '✨', '💌'][i % 4]}
        </motion.span>
      ))}
    </div>
    <motion.div
      className="win-content"
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3 }}
    >
      <h2 className="win-title">You did it! 💖</h2>
      <p className="win-message">
        "Every moment with you is a memory I never want to forget."
      </p>
      <p className="win-moves">Completed in {moves} moves</p>
      <motion.button
        className="replay-btn"
        onClick={onReplay}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        Play Again 🌹
      </motion.button>
    </motion.div>
  </motion.div>
);

export default MiniGame;
