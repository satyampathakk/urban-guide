import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import './PhotoWheelPage.css';

const FALLBACK = [
  { id:1, title:'First Hello',   caption:'The moment everything changed 💕',    image_url:'' },
  { id:2, title:'Valentine\'s',  caption:'Roses and candlelight 🌹',            image_url:'' },
  { id:3, title:'First Trip',    caption:'We got lost and found something ✈️',  image_url:'' },
  { id:4, title:'I Love You',    caption:'Three words. A thousand feelings 💕', image_url:'' },
  { id:5, title:'Beach Sunset',  caption:'Walking hand in hand 🌅',             image_url:'' },
  { id:6, title:'Anniversary',   caption:'One whole year of us 🎉',             image_url:'' },
];

const EMOJIS = ['💕','🌹','✨','💌','🦋','🌙'];

const PANELS = [
  { row:0, col:0 },
  { row:0, col:1 },
  { row:1, col:0 },
  { row:1, col:1 },
];

// ── Draggable Rotating Disc ───────────────────────────────────────────────────
function RotatingDisc({ memories, onActiveChange }) {
  const [rotation, setRotation] = useState(0);
  const [dragging, setDragging] = useState(false);

  const discRef   = useRef(null);
  const lastAngle = useRef(null);
  const lastTime  = useRef(null);
  const velRef    = useRef(0);
  const rafRef    = useRef(null);
  const rotRef    = useRef(0);
  const lastActive = useRef(-1);

  // Compute active index and fire callback whenever rotation changes
  const getActiveIndex = useCallback((rot) => {
    const segAngle  = 360 / Math.max(memories.length, 1);
    const normalized = ((rot % 360) + 360) % 360;
    const topIndex   = Math.round(normalized / segAngle) % memories.length;
    return (memories.length - topIndex) % memories.length;
  }, [memories.length]);

  const updateRotation = useCallback((rot) => {
    rotRef.current = rot;
    setRotation(rot);
    const idx = getActiveIndex(rot);
    if (idx !== lastActive.current) {
      lastActive.current = idx;
      onActiveChange(idx);
    }
  }, [getActiveIndex, onActiveChange]);

  const startMomentum = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    const tick = () => {
      velRef.current *= 0.96;
      if (Math.abs(velRef.current) < 0.05) { velRef.current = 0; return; }
      updateRotation(rotRef.current + velRef.current);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [updateRotation]);

  const getAngle = (e, rect) => {
    const cx = rect.left + rect.width  / 2;
    const cy = rect.top  + rect.height / 2;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return Math.atan2(clientY - cy, clientX - cx) * (180 / Math.PI);
  };

  const onPointerDown = (e) => {
    e.preventDefault();
    cancelAnimationFrame(rafRef.current);
    velRef.current = 0;
    setDragging(true);
    const rect = discRef.current.getBoundingClientRect();
    lastAngle.current = getAngle(e, rect);
    lastTime.current  = Date.now();
  };

  const onPointerMove = useCallback((e) => {
    if (!dragging) return;
    const rect = discRef.current.getBoundingClientRect();
    const angle = getAngle(e, rect);
    let diff = angle - lastAngle.current;
    if (diff >  180) diff -= 360;
    if (diff < -180) diff += 360;
    const dt = (Date.now() - lastTime.current) || 1;
    velRef.current = diff / dt * 16;
    updateRotation(rotRef.current + diff);
    lastAngle.current = angle;
    lastTime.current  = Date.now();
  }, [dragging, updateRotation]);

  const onPointerUp = useCallback(() => {
    if (!dragging) return;
    setDragging(false);
    startMomentum();
  }, [dragging, startMomentum]);

  const onWheel = (e) => {
    e.preventDefault();
    cancelAnimationFrame(rafRef.current);
    velRef.current += e.deltaY * 0.08;
    startMomentum();
  };

  useEffect(() => {
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup',   onPointerUp);
    window.addEventListener('touchmove', onPointerMove, { passive: false });
    window.addEventListener('touchend',  onPointerUp);
    return () => {
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('mouseup',   onPointerUp);
      window.removeEventListener('touchmove', onPointerMove);
      window.removeEventListener('touchend',  onPointerUp);
    };
  }, [onPointerMove, onPointerUp]);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  const segAngle  = 360 / Math.max(memories.length, 1);
  const activeMem = memories[getActiveIndex(rotation)];

  const segments = memories.map((mem, i) => ({
    mem, angle: (i * segAngle) - 90,
  }));

  return (
    <div className="rd-wrap">
      <div
        ref={discRef}
        className={`rd-disc ${dragging ? 'grabbing' : 'grab'}`}
        onMouseDown={onPointerDown}
        onTouchStart={onPointerDown}
        onWheel={onWheel}
        style={{ transform: `rotate(${rotation}deg)` }}
      >
        {segments.map(({ mem, angle }, i) => (
          <div key={i} className="rd-segment" style={{ transform: `rotate(${angle}deg)` }}>
            <div className="rd-segment-content">
              {mem.image_url ? (
                <img src={mem.image_url} alt={mem.title} className="rd-seg-img"
                  onError={e => { e.target.style.display='none'; }} />
              ) : (
                <div className="rd-seg-emoji" style={{ background:`hsl(${i*60+280}deg,50%,20%)` }}>
                  {EMOJIS[i % EMOJIS.length]}
                </div>
              )}
            </div>
          </div>
        ))}
        <div className="rd-hub"><div className="rd-hub-icon">💕</div></div>
      </div>

      <div className="rd-pointer">▼</div>

      <AnimatePresence mode="wait">
        {activeMem && (
          <motion.div key={activeMem.id} className="rd-label glass"
            initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
            exit={{ opacity:0 }} transition={{ duration:0.25 }}>
            <span className="rd-label-title">{activeMem.title}</span>
            <span className="rd-label-caption">{activeMem.caption}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="rd-hint">Drag or scroll to spin</p>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function PhotoWheelPage() {
  const [memories, setMemories] = useState([]);
  const [current, setCurrent]   = useState(0);
  const [prev, setPrev]         = useState(0);
  const [flipping, setFlipping] = useState(false);
  const prevIndex = useRef(0);

  useEffect(() => {
    axios.get('/api/memories')
      .then(r => setMemories(r.data.length ? r.data : FALLBACK))
      .catch(() => setMemories(FALLBACK));
  }, []);

  const handleActiveChange = useCallback((idx) => {
    if (idx === prevIndex.current) return;
    const oldIdx = prevIndex.current;
    prevIndex.current = idx;

    // Start flip: show old image, flip away to reveal new
    setPrev(oldIdx);
    setCurrent(idx);
    setFlipping(true);
    setTimeout(() => setFlipping(false), 520);
  }, []);

  const curMem  = memories[current];
  const prevMem = memories[prev];

  return (
    <div className="pw-page">
      <motion.h1 className="pw-page-title"
        initial={{ opacity:0, y:-16 }} animate={{ opacity:1, y:0 }}>
        💿 Photo Wheel
      </motion.h1>

      <div className="pw-layout">
        {/* ── LEFT: Wooden box ── */}
        <div className="pw-box-side">
          <div className="pw-wooden-box">
            <div className="pw-frame">
              <div className="pw-notch">▼</div>

              {/* Single image fills the whole frame — no stretch, no crop */}
              <div className="pw-panels">
                {curMem?.image_url && (
                  <img
                    key={curMem.id}
                    src={curMem.image_url}
                    alt={curMem?.title}
                    className="pw-full-img"
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                )}
                {!curMem?.image_url && (
                  <div className="pw-full-fallback">
                    <span style={{ fontSize: '3rem' }}>💕</span>
                  </div>
                )}

                {/* 4 flip-panel overlays — only visible during transition */}
                {PANELS.map((panel, i) => (
                  <PanelSlot
                    key={i}
                    row={panel.row}
                    col={panel.col}
                    prevMem={prevMem}
                    flipping={flipping}
                  />
                ))}
              </div>

              {/* Center seam lines */}
              <div className="pw-seam-h" />
              <div className="pw-seam-v" />

              <div className="pw-screw pw-screw-tl" />
              <div className="pw-screw pw-screw-tr" />
              <div className="pw-screw pw-screw-bl" />
              <div className="pw-screw pw-screw-br" />
            </div>
          </div>
        </div>

        {/* ── RIGHT: Draggable rotating disc ── */}
        <RotatingDisc memories={memories} onActiveChange={handleActiveChange} />
      </div>
    </div>
  );
}

// ── One quadrant panel ────────────────────────────────────────────────────────
// Each panel is just a visual slot — the actual image lives in pw-panels as a
// single <img> stretched across all 4 quadrants (object-fit: contain).
// The flip animation clips each half-panel independently.
// row=0 → top panels  → flip DOWN (rotateX: 0 → -90)
// row=1 → bottom panels → flip UP  (rotateX: 0 → +90)
function PanelSlot({ row, col, prevMem, flipping }) {
  const flipDir = row === 0 ? -90 : 90;
  const origin  = row === 0 ? 'bottom center' : 'top center';

  // Each slot clips to its quadrant of the shared image via clip-path
  const clipX = col === 0 ? '0% 0% 0% 50%' : '0% 50% 0% 0%'; // not used — overflow:hidden on slot handles it

  const fallbackColor = `hsl(${(row * 2 + col) * 80 + 280}deg, 45%, 18%)`;

  return (
    <div className="pw-panel-slot">
      {/* Fallback colour when no image */}
      {!prevMem?.image_url && (
        <div className="pw-quadrant-fallback" style={{ background: fallbackColor }}>
          <span className="pw-fallback-emoji">{['💕','🌹','✨','💌'][row*2+col]}</span>
        </div>
      )}

      {/* Flip overlay — covers this quadrant with the OLD image slice, then flips away */}
      {flipping && prevMem?.image_url && (
        <motion.div
          className="pw-flip-page"
          style={{ transformOrigin: origin }}
          initial={{ rotateX: 0 }}
          animate={{ rotateX: flipDir }}
          transition={{ duration: 0.45, ease: 'easeIn' }}
        >
          {/* 
            Scale the image to 2× and shift it so only the correct quadrant
            is visible through this slot's overflow:hidden boundary.
            col=0 → left half  → translateX(0%)
            col=1 → right half → translateX(-50%)
            row=0 → top half   → translateY(0%)
            row=1 → bottom half→ translateY(-50%)
          */}
          <img
            src={prevMem.image_url}
            alt=""
            className="pw-slot-img"
            style={{
              transform: `translate(${col === 0 ? '0%' : '-50%'}, ${row === 0 ? '0%' : '-50%'})`,
            }}
          />
        </motion.div>
      )}
    </div>
  );
}
