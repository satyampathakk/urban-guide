import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './EnvironmentEffects.css';

const ENVIRONMENTS = {
  none:      { label: 'Clear',     icon: '✨' },
  rain:      { label: 'Rain',      icon: '🌧️' },
  night:     { label: 'Night',     icon: '🌌' },
  fireplace: { label: 'Fireplace', icon: '🔥' },
  snow:      { label: 'Snow',      icon: '❄️' },
};

function RainEffect() {
  const drops = Array.from({ length: 60 }, (_, i) => i);
  return (
    <div className="env-layer rain-layer" aria-hidden="true">
      {drops.map(i => (
        <div key={i} className="raindrop"
          style={{ left: `${Math.random() * 100}%`, animationDuration: `${0.6 + Math.random() * 0.8}s`, animationDelay: `${Math.random() * 2}s` }} />
      ))}
      <div className="rain-overlay" />
    </div>
  );
}

function NightEffect() {
  const stars = Array.from({ length: 80 }, (_, i) => i);
  return (
    <div className="env-layer night-layer" aria-hidden="true">
      {stars.map(i => (
        <div key={i} className="star"
          style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 70}%`,
            width: `${1 + Math.random() * 2}px`, height: `${1 + Math.random() * 2}px`,
            animationDelay: `${Math.random() * 4}s`, animationDuration: `${2 + Math.random() * 3}s` }} />
      ))}
      <div className="night-overlay" />
    </div>
  );
}

function SnowEffect() {
  const flakes = Array.from({ length: 50 }, (_, i) => i);
  return (
    <div className="env-layer snow-layer" aria-hidden="true">
      {flakes.map(i => (
        <div key={i} className="snowflake"
          style={{ left: `${Math.random() * 100}%`, animationDuration: `${3 + Math.random() * 5}s`, animationDelay: `${Math.random() * 5}s`, fontSize: `${8 + Math.random() * 10}px` }}>
          ❄
        </div>
      ))}
    </div>
  );
}

function FireplaceEffect() {
  return (
    <div className="env-layer fireplace-layer" aria-hidden="true">
      <div className="fireplace-glow" />
      <div className="ember-container">
        {Array.from({ length: 20 }, (_, i) => (
          <div key={i} className="ember"
            style={{ left: `${40 + Math.random() * 20}%`, animationDuration: `${1 + Math.random() * 2}s`, animationDelay: `${Math.random() * 2}s` }} />
        ))}
      </div>
    </div>
  );
}

export default function EnvironmentEffects() {
  const [env, setEnv] = useState('none');
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Render effect */}
      <AnimatePresence>
        {env === 'rain'      && <motion.div key="rain"      initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}><RainEffect /></motion.div>}
        {env === 'night'     && <motion.div key="night"     initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}><NightEffect /></motion.div>}
        {env === 'snow'      && <motion.div key="snow"      initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}><SnowEffect /></motion.div>}
        {env === 'fireplace' && <motion.div key="fireplace" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}><FireplaceEffect /></motion.div>}
      </AnimatePresence>

      {/* Toggle button */}
      <motion.button className="env-fab" onClick={() => setOpen(o => !o)}
        whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} title="Environment">
        {ENVIRONMENTS[env].icon}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div className="env-picker glass"
            initial={{ opacity:0, scale:0.85, y:10 }}
            animate={{ opacity:1, scale:1, y:0 }}
            exit={{ opacity:0, scale:0.85, y:10 }}>
            {Object.entries(ENVIRONMENTS).map(([key, cfg]) => (
              <motion.button key={key}
                className={`env-option ${env === key ? 'active' : ''}`}
                onClick={() => { setEnv(key); setOpen(false); }}
                whileHover={{ scale: 1.05 }}>
                <span>{cfg.icon}</span><span>{cfg.label}</span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
