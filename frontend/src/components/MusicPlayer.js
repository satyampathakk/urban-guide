import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './MusicPlayer.css';

const BASE = 'https://api.032403.xyz';

// Fallback tracks if none uploaded
const FALLBACK = [
  { id: 1, title: 'Romantic Ambience', artist: '', file_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { id: 2, title: 'Soft Piano',        artist: '', file_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
];

const MusicPlayer = () => {
  const [playlist, setPlaylist]   = useState([]);
  const [playing, setPlaying]     = useState(false);
  const [trackIndex, setTrackIndex] = useState(0);
  const [volume, setVolume]       = useState(0.3);
  const [expanded, setExpanded]   = useState(false);
  const audioRef = useRef(null);

  // Load tracks from API
  useEffect(() => {
    fetch(`${BASE}/admin/music/public`)
      .then(r => r.json())
      .then(data => setPlaylist(data.length ? data : FALLBACK))
      .catch(() => setPlaylist(FALLBACK));
  }, []);

  const currentTrack = playlist[trackIndex] || null;

  useEffect(() => {
    if (!audioRef.current || !currentTrack) return;
    audioRef.current.volume = volume;
    if (playing) audioRef.current.play().catch(() => {});
    else audioRef.current.pause();
  }, [playing, trackIndex, volume, currentTrack]);

  const toggle = () => setPlaying(p => !p);
  const next   = () => { setTrackIndex(i => (i + 1) % playlist.length); setPlaying(true); };
  const prev   = () => { setTrackIndex(i => (i - 1 + playlist.length) % playlist.length); setPlaying(true); };

  if (!playlist.length) return null;

  return (
    <div className="music-player-wrap">
      <motion.div
        className={`music-player glass ${expanded ? 'expanded' : ''}`}
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 1 }}
      >
        {currentTrack && (
          <audio
            ref={audioRef}
            src={currentTrack.file_url}
            loop={false}
            onEnded={next}
          />
        )}

        <button className="music-toggle-btn" onClick={() => setExpanded(e => !e)} title="Music">
          {playing ? '🎵' : '🎶'}
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              className="music-controls"
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
            >
              <div className="track-info">
                <span className="track-name">{currentTrack?.title}</span>
                {currentTrack?.artist && <span className="track-artist">{currentTrack.artist}</span>}
              </div>
              <button className="ctrl-btn" onClick={prev} title="Previous">⏮</button>
              <button className="ctrl-btn" onClick={toggle}>{playing ? '⏸' : '▶'}</button>
              <button className="ctrl-btn" onClick={next} title="Next">⏭</button>
              <input
                type="range" min="0" max="1" step="0.05"
                value={volume}
                onChange={e => setVolume(parseFloat(e.target.value))}
                className="volume-slider"
                title="Volume"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default MusicPlayer;
