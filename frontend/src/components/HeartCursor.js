import { useEffect } from 'react';
import './HeartCursor.css';

const HeartCursor = () => {
  useEffect(() => {
    const hearts = [];

    const spawn = (x, y) => {
      const el = document.createElement('div');
      el.className = 'cursor-heart';
      el.textContent = ['❤️', '💕', '✨', '💖'][Math.floor(Math.random() * 4)];
      el.style.left = x + 'px';
      el.style.top = y + 'px';
      document.body.appendChild(el);
      hearts.push(el);
      setTimeout(() => { el.remove(); }, 900);
    };

    let last = 0;
    const onMove = (e) => {
      const now = Date.now();
      if (now - last < 80) return;
      last = now;
      spawn(e.clientX, e.clientY);
    };

    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  return null;
};

export default HeartCursor;
