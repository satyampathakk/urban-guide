import React from 'react';
import { motion } from 'framer-motion';
import './FloatingElements.css';

const FloatingElements = () => {
  const hearts = Array.from({ length: 15 }, (_, i) => i);
  const sparkles = Array.from({ length: 20 }, (_, i) => i);

  return (
    <div className="floating-elements">
      {hearts.map((heart) => (
        <motion.div
          key={`heart-${heart}`}
          className="floating-heart"
          initial={{
            x: Math.random() * window.innerWidth,
            y: window.innerHeight + 50,
            scale: Math.random() * 0.5 + 0.5,
            rotate: Math.random() * 360,
          }}
          animate={{
            y: -100,
            x: Math.random() * window.innerWidth,
            rotate: 360,
          }}
          transition={{
            duration: Math.random() * 10 + 15,
            repeat: Infinity,
            ease: "linear",
            delay: Math.random() * 5,
          }}
        >
          💕
        </motion.div>
      ))}

      {sparkles.map((sparkle) => (
        <motion.div
          key={`sparkle-${sparkle}`}
          className="floating-sparkle"
          initial={{
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            scale: 0,
            opacity: 0,
          }}
          animate={{
            scale: [0, 1, 0],
            opacity: [0, 1, 0],
            rotate: 360,
          }}
          transition={{
            duration: Math.random() * 3 + 2,
            repeat: Infinity,
            delay: Math.random() * 3,
          }}
        >
          ✨
        </motion.div>
      ))}

      {/* Animated background particles */}
      <div className="particles">
        {Array.from({ length: 50 }, (_, i) => (
          <motion.div
            key={`particle-${i}`}
            className="particle"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
            }}
            animate={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
            }}
            transition={{
              duration: Math.random() * 20 + 10,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default FloatingElements;