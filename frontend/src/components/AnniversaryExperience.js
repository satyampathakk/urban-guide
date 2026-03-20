import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { mediaUrl } from '../utils/mediaUrl';
import './AnniversaryExperience.css';

const REDIRECT_TARGET = '/cinematic';
const AUTO_REDIRECT_MS = 9000;

const getTodayKey = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const isVideoUrl = (url) => /\.(mp4|webm|ogg)$/i.test(url || '');

export default function AnniversaryExperience() {
  const [event, setEvent] = useState(null);
  const [show, setShow] = useState(false);
  const [countdown, setCountdown] = useState(Math.ceil(AUTO_REDIRECT_MS / 1000));
  const audioRef = useRef(null);
  const navigate = useNavigate();
  const goToCelebration = useCallback(() => {
    setShow(false);
    navigate(REDIRECT_TARGET);
  }, [navigate]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const { data } = await axios.get('/api/anniversaries');
        if (cancelled) return;
        const now = new Date();
        const month = now.getMonth() + 1;
        const day = now.getDate();
        const match = (data || []).find(e => Number(e.month) === month && Number(e.day) === day);
        setEvent(match || null);
      } catch {
        setEvent(null);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!event) {
      document.body.classList.remove('anniversary-mode');
      return;
    }
    document.body.classList.add('anniversary-mode');
    return () => document.body.classList.remove('anniversary-mode');
  }, [event]);

  useEffect(() => {
    if (!event) return;
    const key = `anniversary_seen_${getTodayKey()}`;
    if (!localStorage.getItem(key)) {
      setShow(true);
      localStorage.setItem(key, '1');
    }
  }, [event]);

  useEffect(() => {
    if (!show) return;
    setCountdown(Math.ceil(AUTO_REDIRECT_MS / 1000));
    const start = Date.now();
    const t = setInterval(() => {
      const elapsed = Date.now() - start;
      const left = Math.max(0, Math.ceil((AUTO_REDIRECT_MS - elapsed) / 1000));
      setCountdown(left);
    }, 250);
    const redirect = setTimeout(() => goToCelebration(), AUTO_REDIRECT_MS);
    return () => {
      clearTimeout(redirect);
      clearInterval(t);
    };
  }, [show, goToCelebration]);

  useEffect(() => {
    if (!show || !event?.music_url || !audioRef.current) return;
    const play = async () => {
      try {
        await audioRef.current.play();
      } catch {
        // Autoplay might be blocked; user can press play in controls
      }
    };
    play();
  }, [show, event]);

  const mediaType = useMemo(() => {
    if (!event?.media_url) return '';
    if (event.media_type) return event.media_type;
    return isVideoUrl(event.media_url) ? 'video' : 'image';
  }, [event]);

  if (!event) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="anniv-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="anniv-media">
            {mediaType === 'video' && event.media_url && (
              <video src={mediaUrl(event.media_url)} autoPlay muted loop playsInline />
            )}
            {mediaType === 'image' && event.media_url && (
              <img src={mediaUrl(event.media_url)} alt={event.title} />
            )}
            {!event.media_url && <div className="anniv-media-fallback">LOVE</div>}
          </div>

          <motion.div
            className="anniv-card glass"
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <div className="anniv-badge">Anniversary Mode</div>
            <h2 className="anniv-title">{event.title || 'A Special Day'}</h2>
            <p className="anniv-message">{event.message || 'Today is a day to celebrate our love.'}</p>

            {event.music_url && (
              <div className="anniv-audio">
                <audio ref={audioRef} src={mediaUrl(event.music_url)} controls loop />
              </div>
            )}

            <div className="anniv-actions">
              <button className="romantic-button" onClick={goToCelebration}>
                Enter Celebration
              </button>
              <span className="anniv-countdown">Auto-opening in {countdown}s</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
