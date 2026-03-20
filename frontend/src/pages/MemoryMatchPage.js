import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import './MemoryMatchPage.css';

// ── Difficulty config ─────────────────────────────────────────────────────────
const DIFFICULTIES = {
  easy:   { label: 'Easy',   pairs: 4,  cols: 4,  time: 0  },
  medium: { label: 'Medium', pairs: 6,  cols: 4,  time: 90 },
  hard:   { label: 'Hard',   pairs: 10, cols: 5,  time: 120 },
};

// ── Fallback memory cards if API returns nothing ──────────────────────────────
const FALLBACK = [
  { id:1, title:'First Hello',    caption:'The moment everything changed 💕',          image_url:'' },
  { id:2, title:'Valentine\'s',   caption:'Roses and candlelight 🌹',                  image_url:'' },
  { id:3, title:'First Trip',     caption:'We got lost and found something beautiful ✈️', image_url:'' },
  { id:4, title:'I Love You',     caption:'Three words. A thousand feelings 💕',       image_url:'' },
  { id:5, title:'Beach Sunset',   caption:'Walking hand in hand 🌅',                  image_url:'' },
  { id:6, title:'Anniversary',    caption:'One whole year of us 🎉',                  image_url:'' },
  { id:7, title:'Morning Coffee', caption:'My favourite kind of morning ☕',           image_url:'' },
  { id:8, title:'Stargazing',     caption:'Just us and the whole universe 🌌',         image_url:'' },
  { id:9, title:'First Dance',    caption:'I never wanted the song to end 🎵',         image_url:'' },
  { id:10,title:'Our Song',       caption:'Every note reminds me of you 🎶',           image_url:'' },
];

// ── Emoji fallback when no image ──────────────────────────────────────────────
const EMOJIS = ['💕','🌹','✨','💌','🦋','🌙','⭐','💖','🌸','🎵'];

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

function buildDeck(memories, pairs) {
  const pool = memories.slice(0, pairs);
  // Duplicate each card to make pairs
  const deck = pool.flatMap((mem, i) => [
    { uid: `${mem.id}-a`, memId: mem.id, title: mem.title, caption: mem.caption, image_url: mem.image_url, emoji: EMOJIS[i % EMOJIS.length], matched: false, flipped: false },
    { uid: `${mem.id}-b`, memId: mem.id, title: mem.title, caption: mem.caption, image_url: mem.image_url, emoji: EMOJIS[i % EMOJIS.length], matched: false, flipped: false },
  ]);
  return shuffle(deck);
}

// ── Sound effects (Web Audio API — no files needed) ───────────────────────────
function playTone(freq, duration, type = 'sine', vol = 0.15) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = type; osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start(); osc.stop(ctx.currentTime + duration);
  } catch {}
}

const sfx = {
  flip:  () => playTone(440, 0.08, 'sine', 0.1),
  match: () => { playTone(523, 0.12); setTimeout(() => playTone(659, 0.12), 120); setTimeout(() => playTone(784, 0.2), 240); },
  miss:  () => playTone(220, 0.15, 'sawtooth', 0.08),
  win:   () => { [523,659,784,1047].forEach((f,i) => setTimeout(() => playTone(f, 0.3), i*150)); },
};

// ── Main component ────────────────────────────────────────────────────────────
export default function MemoryMatchPage() {
  const [screen, setScreen]       = useState('menu');   // menu | playing | reveal | win
  const [difficulty, setDiff]     = useState('easy');
  const [memories, setMemories]   = useState([]);
  const [cards, setCards]         = useState([]);
  const [selected, setSelected]   = useState([]);       // max 2 uids
  const [locked, setLocked]       = useState(false);
  const [moves, setMoves]         = useState(0);
  const [matches, setMatches]     = useState(0);
  const [timeLeft, setTimeLeft]   = useState(0);
  const [revealCard, setRevealCard] = useState(null);   // card shown in reveal modal
  const timerRef = useRef(null);

  // Load memories
  useEffect(() => {
    axios.get('/api/memories/game')
      .then(r => setMemories(r.data.length >= 4 ? r.data : FALLBACK))
      .catch(() => setMemories(FALLBACK));
  }, []);

  // Timer
  useEffect(() => {
    if (screen !== 'playing') return;
    const cfg = DIFFICULTIES[difficulty];
    if (!cfg.time) return; // easy = no timer
    setTimeLeft(cfg.time);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); setScreen('win'); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [screen, difficulty]);

  const startGame = useCallback(() => {
    const cfg = DIFFICULTIES[difficulty];
    const deck = buildDeck(memories, cfg.pairs);
    setCards(deck);
    setSelected([]);
    setLocked(false);
    setMoves(0);
    setMatches(0);
    setScreen('playing');
  }, [difficulty, memories]);

  const flipCard = (uid) => {
    if (locked) return;
    const card = cards.find(c => c.uid === uid);
    if (!card || card.matched || card.flipped) return;
    if (selected.includes(uid)) return;

    sfx.flip();
    const newSelected = [...selected, uid];
    setCards(prev => prev.map(c => c.uid === uid ? { ...c, flipped: true } : c));
    setSelected(newSelected);

    if (newSelected.length === 2) {
      setLocked(true);
      setMoves(m => m + 1);
      const [a, b] = newSelected.map(id => cards.find(c => c.uid === id));

      if (a.memId === b.memId) {
        // Match!
        sfx.match();
        setTimeout(() => {
          setCards(prev => prev.map(c => c.memId === a.memId ? { ...c, matched: true } : c));
          setSelected([]);
          setLocked(false);
          const newMatches = matches + 1;
          setMatches(newMatches);
          // Show reveal modal
          setRevealCard(a);
          setScreen('reveal');
          // Check win after reveal closes
        }, 400);
      } else {
        // Miss
        sfx.miss();
        setTimeout(() => {
          setCards(prev => prev.map(c =>
            (c.uid === newSelected[0] || c.uid === newSelected[1]) && !c.matched
              ? { ...c, flipped: false } : c
          ));
          setSelected([]);
          setLocked(false);
        }, 900);
      }
    }
  };

  const closeReveal = () => {
    const cfg = DIFFICULTIES[difficulty];
    const totalMatched = cards.filter(c => c.matched).length / 2;
    if (totalMatched >= cfg.pairs) {
      clearInterval(timerRef.current);
      sfx.win();
      setScreen('win');
    } else {
      setScreen('playing');
    }
    setRevealCard(null);
  };

  const cfg = DIFFICULTIES[difficulty];
  const totalPairs = cfg.pairs;
  const matchedPairs = cards.filter(c => c.matched).length / 2;
  const progress = totalPairs ? (matchedPairs / totalPairs) * 100 : 0;

  // ── Menu ──────────────────────────────────────────────────────────────────
  if (screen === 'menu') return (
    <div className="mm-page">
      <motion.div className="mm-menu glass"
        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mm-menu-icon">💖</div>
        <h1 className="mm-menu-title">Memory Match</h1>
        <p className="mm-menu-sub">Our Moments</p>
        <p className="mm-menu-desc">Flip cards to find matching memories.<br />Each match reveals a special moment.</p>

        <div className="mm-diff-grid">
          {Object.entries(DIFFICULTIES).map(([key, d]) => (
            <motion.button key={key}
              className={`mm-diff-btn ${difficulty === key ? 'active' : ''}`}
              onClick={() => setDiff(key)}
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
              <span className="mm-diff-label">{d.label}</span>
              <span className="mm-diff-info">{d.pairs * 2} cards{d.time ? ` · ${d.time}s` : ' · No timer'}</span>
            </motion.button>
          ))}
        </div>

        <motion.button className="mm-start-btn" onClick={startGame}
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          ▶ Start Game
        </motion.button>
      </motion.div>
    </div>
  );

  // ── Win screen ────────────────────────────────────────────────────────────
  if (screen === 'win') return (
    <div className="mm-page">
      <div className="mm-confetti">
        {Array.from({ length: 24 }).map((_, i) => (
          <motion.span key={i} className="mm-confetti-piece"
            initial={{ y: -20, x: (Math.random() - 0.5) * 400, opacity: 1, rotate: 0 }}
            animate={{ y: 500, opacity: [1, 1, 0], rotate: Math.random() * 720 }}
            transition={{ duration: 2 + Math.random(), delay: i * 0.08, repeat: Infinity, repeatDelay: 3 }}>
            {['💖','🌹','✨','💌','🦋'][i % 5]}
          </motion.span>
        ))}
      </div>

      <motion.div className="mm-win glass"
        initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 160 }}>
        <motion.div className="mm-win-heart"
          animate={{ scale: [1, 1.15, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}>
          💖
        </motion.div>
        <h2 className="mm-win-title">You found them all!</h2>
        <p className="mm-win-msg">
          "You just unlocked all our memories…<br />but the best one is still you ❤️"
        </p>
        <div className="mm-win-stats">
          <div className="mm-stat"><span className="mm-stat-val">{moves}</span><span className="mm-stat-lbl">Moves</span></div>
          <div className="mm-stat"><span className="mm-stat-val">{matchedPairs}</span><span className="mm-stat-lbl">Pairs</span></div>
          {cfg.time > 0 && <div className="mm-stat"><span className="mm-stat-val">{timeLeft}s</span><span className="mm-stat-lbl">Left</span></div>}
        </div>

        {/* Memory collage */}
        <div className="mm-collage">
          {cards.filter((c, i, arr) => arr.findIndex(x => x.memId === c.memId) === i).map(c => (
            <div key={c.memId} className="mm-collage-item">
              {c.image_url
                ? <img src={c.image_url} alt={c.title} onError={e => { e.target.style.display='none'; }} />
                : <span className="mm-collage-emoji">{c.emoji}</span>}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <motion.button className="mm-start-btn" onClick={startGame}
            whileHover={{ scale: 1.05 }}>Play Again 🌹</motion.button>
          <motion.button className="mm-start-btn secondary" onClick={() => setScreen('menu')}
            whileHover={{ scale: 1.05 }}>Change Level</motion.button>
        </div>
      </motion.div>
    </div>
  );

  // ── Game board ────────────────────────────────────────────────────────────
  return (
    <div className="mm-page">
      {/* HUD */}
      <div className="mm-hud">
        <div className="mm-hud-item">
          <span className="mm-hud-val">{moves}</span>
          <span className="mm-hud-lbl">Moves</span>
        </div>
        <div className="mm-progress-wrap">
          <div className="mm-progress-bar">
            <motion.div className="mm-progress-fill" animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }} />
          </div>
          <span className="mm-progress-lbl">{matchedPairs}/{totalPairs} pairs</span>
        </div>
        {cfg.time > 0 && (
          <div className={`mm-hud-item ${timeLeft <= 15 ? 'danger' : ''}`}>
            <span className="mm-hud-val">{timeLeft}s</span>
            <span className="mm-hud-lbl">Time</span>
          </div>
        )}
        <button className="mm-quit-btn" onClick={() => { clearInterval(timerRef.current); setScreen('menu'); }}>✕</button>
      </div>

      {/* Card grid */}
      <div className="mm-grid" style={{ '--cols': cfg.cols }}>
        {cards.map(card => (
          <motion.div key={card.uid}
            className={`mm-card ${card.flipped || card.matched ? 'flipped' : ''} ${card.matched ? 'matched' : ''}`}
            onClick={() => flipCard(card.uid)}
            whileHover={!card.flipped && !card.matched ? { scale: 1.05 } : {}}
            whileTap={!card.flipped && !card.matched ? { scale: 0.95 } : {}}
            layout>
            <div className="mm-card-inner">
              {/* Back */}
              <div className="mm-card-back">
                <span className="mm-card-back-icon">💕</span>
              </div>
              {/* Front */}
              <div className="mm-card-front">
                {card.image_url
                  ? <img src={card.image_url} alt={card.title} className="mm-card-img"
                      onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} />
                  : null}
                <div className="mm-card-emoji-fallback" style={{ display: card.image_url ? 'none' : 'flex' }}>
                  {card.emoji}
                </div>
                {card.matched && <div className="mm-card-matched-glow" />}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Match reveal modal */}
      <AnimatePresence>
        {screen === 'reveal' && revealCard && (
          <motion.div className="mm-reveal-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={closeReveal}>
            <motion.div className="mm-reveal-card glass"
              initial={{ scale: 0.6, opacity: 0, rotate: -8 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.6, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 200 }}
              onClick={e => e.stopPropagation()}>

              {/* Sparkles */}
              {Array.from({ length: 8 }).map((_, i) => (
                <motion.span key={i} className="mm-reveal-sparkle"
                  style={{ '--angle': `${i * 45}deg` }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: [0, 1.2, 0], opacity: [0, 1, 0] }}
                  transition={{ delay: 0.2 + i * 0.05, duration: 0.6 }}>
                  ✨
                </motion.span>
              ))}

              <div className="mm-reveal-match-badge">💕 Match!</div>

              {revealCard.image_url ? (
                <img src={revealCard.image_url} alt={revealCard.title} className="mm-reveal-img"
                  onError={e => { e.target.style.display='none'; }} />
              ) : (
                <div className="mm-reveal-emoji">{revealCard.emoji}</div>
              )}

              <h3 className="mm-reveal-title">{revealCard.title}</h3>
              <p className="mm-reveal-caption">{revealCard.caption}</p>

              <motion.button className="mm-reveal-btn" onClick={closeReveal}
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                Continue 💖
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
