import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import './StarBackground.css';

// Deterministic pseudo-random so stars don't re-randomize on re-render
function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export default function StarBackground() {
  const canvasRef = useRef();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const draw = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      const ctx = canvas.getContext('2d');
      const rng = seededRandom(42);

      // Deep space gradient
      const grad = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, canvas.width * 0.8
      );
      grad.addColorStop(0,   '#0d0d1f');
      grad.addColorStop(0.5, '#080814');
      grad.addColorStop(1,   '#020208');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Stars — three size tiers
      const tiers = [
        { count: 300, maxR: 0.8,  alphaMin: 0.3, alphaMax: 0.7 },
        { count: 120, maxR: 1.4,  alphaMin: 0.5, alphaMax: 0.9 },
        { count:  40, maxR: 2.2,  alphaMin: 0.7, alphaMax: 1.0 },
      ];

      tiers.forEach(({ count, maxR, alphaMin, alphaMax }) => {
        for (let i = 0; i < count; i++) {
          const x = rng() * canvas.width;
          const y = rng() * canvas.height;
          const r = rng() * maxR + 0.3;
          const a = alphaMin + rng() * (alphaMax - alphaMin);

          // Slight color tint — some warm, some cool
          const tint = rng();
          let color;
          if (tint < 0.15)      color = `rgba(255,200,180,${a})`;   // warm
          else if (tint < 0.25) color = `rgba(180,200,255,${a})`;   // cool blue
          else                  color = `rgba(255,255,255,${a})`;    // white

          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.fill();

          // Glow on larger stars
          if (r > 1.5) {
            const glow = ctx.createRadialGradient(x, y, 0, x, y, r * 4);
            glow.addColorStop(0, `rgba(255,255,255,${a * 0.3})`);
            glow.addColorStop(1, 'transparent');
            ctx.beginPath();
            ctx.arc(x, y, r * 4, 0, Math.PI * 2);
            ctx.fillStyle = glow;
            ctx.fill();
          }
        }
      });
    };

    draw();
    window.addEventListener('resize', draw);
    return () => window.removeEventListener('resize', draw);
  }, []);

  return (
    <div className="star-bg" aria-hidden="true">
      {/* Canvas star field */}
      <canvas ref={canvasRef} className="star-canvas" />

      {/* Nebula layers */}
      <div className="nebula nb-pink"  />
      <div className="nebula nb-purple"/>
      <div className="nebula nb-blue"  />

      {/* Shooting stars */}
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          className="shooting-star-bg"
          initial={{ opacity: 0, scaleX: 0, x: `${20 + i * 25}vw`, y: `${10 + i * 12}vh` }}
          animate={{ opacity: [0, 1, 0], scaleX: [0, 1, 1] }}
          transition={{
            duration: 1.4,
            delay: 4 + i * 7,
            repeat: Infinity,
            repeatDelay: 18 + i * 5,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  );
}
