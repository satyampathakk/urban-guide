import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { mediaUrl } from '../utils/mediaUrl';
import './UniversePage.css';

const FALLBACK_MEMORIES = [
  { id:1, title:'Our First Hello',    caption:'The moment everything changed 💕',            image_url:'', date_created:'2023-01-15' },
  { id:2, title:'First Valentine\'s', caption:'Roses and candlelight 🌹',                    image_url:'', date_created:'2023-02-14' },
  { id:3, title:'First Trip',         caption:'We got lost and found something beautiful ✈️', image_url:'', date_created:'2023-04-03' },
  { id:4, title:'Said I Love You',    caption:'Three words. A thousand feelings 💕',          image_url:'', date_created:'2023-06-21' },
  { id:5, title:'Beach Sunset',       caption:'Walking hand in hand 🌅',                     image_url:'', date_created:'2023-08-10' },
  { id:6, title:'Anniversary',        caption:'One whole year of us 🎉',                     image_url:'', date_created:'2024-01-15' },
];

const EMOJIS = ['💕','🌹','✨','💌','🦋','🌙'];

function seededRandom(seed) {
  let s = seed;
  return () => { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646; };
}

// ── Wooden box — controlled from outside via `memIdx` ────────────────────────
function MemoryBox({ memories, memIdx }) {
  const [prevIdx, setPrevIdx] = useState(null);
  const [fading, setFading]   = useState(false);
  const prevMemIdx = useRef(memIdx);

  // Trigger crossfade whenever memIdx changes
  useEffect(() => {
    if (prevMemIdx.current === memIdx) return;
    setPrevIdx(prevMemIdx.current);
    prevMemIdx.current = memIdx;
    setFading(true);
    const t = setTimeout(() => setFading(false), 700);
    return () => clearTimeout(t);
  }, [memIdx]);

  const cur = memories[memIdx];
  const old = prevIdx !== null ? memories[prevIdx] : null;

  const imgOrEmoji = (mem, i) =>
    mem?.image_url
      ? <img src={mediaUrl(mem.image_url)} alt={mem?.title} className="uv-box-img"
          onError={e => { e.target.style.display = 'none'; }} />
      : <div className="uv-box-emoji" style={{ background: `hsl(${(i * 60 + 280) % 360}deg,40%,14%)` }}>
          {EMOJIS[i % EMOJIS.length]}
        </div>;

  return (
    <div className="uv-wooden-box">
      <div className="uv-frame">
        <div className="uv-notch">▼</div>

        <div className="uv-display">
          {/* New image — always underneath */}
          <div className="uv-layer">{imgOrEmoji(cur, memIdx)}</div>

          {/* Old image — fades out on top */}
          <AnimatePresence>
            {fading && old && (
              <motion.div className="uv-layer uv-layer-top" key={prevIdx}
                initial={{ opacity: 1 }} animate={{ opacity: 0 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.65, ease: 'easeInOut' }}>
                {imgOrEmoji(old, prevIdx)}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="uv-screw uv-screw-tl" />
        <div className="uv-screw uv-screw-tr" />
        <div className="uv-screw uv-screw-bl" />
        <div className="uv-screw uv-screw-br" />
      </div>
    </div>
  );
}

export default function UniversePage() {
  const [memories, setMemories] = useState([]);
  const [boxIdx, setBoxIdx]     = useState(0);
  const [shooting, setShooting] = useState(null);
  const canvasRef = useRef();

  useEffect(() => {
    axios.get('/api/memories')
      .then(r => setMemories(r.data.length ? r.data : FALLBACK_MEMORIES))
      .catch(() => setMemories(FALLBACK_MEMORIES));
  }, []);

  // Draw background star field on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const rng = seededRandom(42);
    // Background stars
    for (let i = 0; i < 200; i++) {
      const x = rng() * canvas.width;
      const y = rng() * canvas.height;
      const r = rng() * 1.5;
      const alpha = 0.2 + rng() * 0.6;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.fill();
    }
  }, []);

  // Shooting star effect
  useEffect(() => {
    const interval = setInterval(() => {
      setShooting({ id: Date.now(), x: Math.random() * 80 + 10, y: Math.random() * 40 });
      setTimeout(() => setShooting(null), 1200);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  // Place memory stars in a constellation pattern
  const getStarPosition = (index, total) => {
    const rng = seededRandom(index * 137);
    const cols = Math.ceil(Math.sqrt(total * 1.5));
    const col = index % cols;
    const row = Math.floor(index / cols);
    const baseX = (col / cols) * 80 + 5;
    const baseY = (row / Math.ceil(total / cols)) * 70 + 8;
    const x = baseX + (rng() - 0.5) * 12;
    const y = baseY + (rng() - 0.5) * 10;
    // seeded size: 18–34px so stars are clearly visible
    const size = 18 + rng() * 16;
    return { x, y, size };
  };

  return (
    <div className="universe-page">
      {/* Star field canvas */}
      <canvas ref={canvasRef} className="universe-canvas" />

      {/* Nebula glow */}
      <div className="nebula nebula-1" />
      <div className="nebula nebula-2" />
      <div className="nebula nebula-3" />

      {/* Shooting star */}
      <AnimatePresence>
        {shooting && (
          <motion.div key={shooting.id} className="shooting-star"
            style={{ left: `${shooting.x}%`, top: `${shooting.y}%` }}
            initial={{ scaleX: 0, opacity: 1 }}
            animate={{ scaleX: 1, opacity: [1, 1, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2 }} />
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div className="universe-header"
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <h1 className="universe-title">🌌 Our Universe</h1>
        <p className="universe-subtitle">Click a star to see its memory in the box ✨</p>
      </motion.div>

      {/* Wooden memory box — bottom-left, driven by star clicks */}
      {memories.length > 0 && (
        <motion.div className="uv-box-anchor"
          initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 }}>
          <MemoryBox memories={memories} memIdx={boxIdx} />

          {/* Info below box */}
          <AnimatePresence mode="wait">
            <motion.div key={boxIdx} className="uv-box-info"
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              <p className="uv-box-label">{memories[boxIdx]?.title}</p>
              <p className="uv-box-caption">{memories[boxIdx]?.caption}</p>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      )}

      {/* Memory stars — click sends image to box */}
      {memories.map((mem, i) => {
        const pos = getStarPosition(i, memories.length);
        const isActive = i === boxIdx;
        return (
          <motion.button
            key={mem.id}
            className={`memory-star${isActive ? ' star-active' : ''}`}
            style={{ left: `${pos.x}%`, top: `${pos.y}%`, width: pos.size, height: pos.size }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: isActive ? 1.5 : 1 }}
            transition={{ delay: i * 0.08, type: 'spring' }}
            whileHover={{ scale: 2, zIndex: 10 }}
            onClick={() => setBoxIdx(i)}
          >
            <div className="star-glow" />
            <div className="star-label">{mem.title}</div>
          </motion.button>
        );
      })}

      {/* Constellation lines between nearby stars */}
      <svg className="constellation-svg">
        {memories.map((mem, i) => {
          if (i === 0) return null;
          const a = getStarPosition(i - 1, memories.length);
          const b = getStarPosition(i, memories.length);
          const dist = Math.hypot(b.x - a.x, b.y - a.y);
          if (dist > 20) return null;
          return (
            <motion.line key={i}
              x1={`${a.x}%`} y1={`${a.y}%`}
              x2={`${b.x}%`} y2={`${b.y}%`}
              stroke="rgba(255,255,255,0.12)" strokeWidth="1"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ delay: i * 0.1, duration: 0.8 }} />
          );
        })}
      </svg>

    </div>
  );
}
