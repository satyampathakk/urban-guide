import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import './VoiceCapsule.css';

const API = 'http://localhost:8000';

const VoiceCapsule = () => {
  const [capsules, setCapsules] = useState([]);
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [recording, setRecording] = useState(false);
  const [preview, setPreview] = useState(null); // { url, file, name }
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const previewUrlRef = useRef(null);

  useEffect(() => {
    const fetchCapsules = async () => {
      try {
        const res = await axios.get('/api/voice-capsules');
        setCapsules(res.data || []);
      } catch (err) {
        setCapsules([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCapsules();
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  const setPreviewSafe = (next) => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = next?.url || null;
    setPreview(next);
  };

  const startRecording = async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => chunksRef.current.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setPreviewSafe({ url, file, name: file.name });
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setRecording(true);
    } catch (err) {
      setError('Microphone access denied. Please allow mic access or upload an audio file.');
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const toggleRecording = () => {
    if (recording) stopRecording();
    else startRecording();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('audio')) {
      setError('Please choose an audio file.');
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewSafe({ url, file, name: file.name });
    e.target.value = '';
  };

  const clearPreview = () => {
    setPreviewSafe(null);
  };

  const saveCapsule = async () => {
    if (!preview?.file) return;
    setSaving(true);
    setError('');
    try {
      const form = new FormData();
      form.append('file', preview.file);
      form.append('title', title.trim());
      form.append('note', note.trim());
      const res = await axios.post('/api/voice-capsules', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res?.data) setCapsules(prev => [res.data, ...prev]);
      setTitle('');
      setNote('');
      setPreviewSafe(null);
    } catch (err) {
      setError('Could not save your voice capsule. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const deleteCapsule = async (id) => {
    if (!window.confirm('Delete this voice capsule?')) return;
    try {
      await axios.delete(`/api/voice-capsules/${id}`);
      setCapsules(prev => prev.filter(c => c.id !== id));
    } catch {
      setError('Could not delete. Please try again.');
    }
  };
    if (!value) return '';
    return new Date(value).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="vc-container">
      <motion.h1
        className="romantic-title section-title"
        initial={{ y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        Voice Capsule
      </motion.h1>
      <p className="vc-subtitle">Record a message, save it, and revisit it anytime.</p>

      <div className="vc-composer glass">
        <div className="vc-form">
          <label className="vc-label">Title</label>
          <input
            className="romantic-input"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="A short title for this capsule"
          />

          <label className="vc-label">Note</label>
          <textarea
            className="vc-textarea"
            rows={4}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a little context or dedication"
          />

          <div className="vc-actions">
            <button
              type="button"
              className={`vc-record-btn ${recording ? 'recording' : ''}`}
              onClick={toggleRecording}
            >
              {recording ? 'Stop Recording' : 'Start Recording'}
            </button>

            <button
              type="button"
              className="romantic-button"
              onClick={() => fileInputRef.current?.click()}
            >
              Upload Audio
            </button>

            <button
              type="button"
              className="romantic-button"
              onClick={saveCapsule}
              disabled={!preview?.file || saving}
            >
              {saving ? 'Saving...' : 'Save Capsule'}
            </button>

            {preview && (
              <button type="button" className="vc-clear-btn" onClick={clearPreview}>
                Clear
              </button>
            )}
          </div>

          {error && <p className="vc-error">{error}</p>}
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </div>

        <div className="vc-preview">
          {preview ? (
            <>
              <div className="vc-preview-title">Preview</div>
              <div className="vc-preview-name">{preview.name}</div>
              <audio controls src={preview.url} />
            </>
          ) : (
            <div className="vc-preview-empty">No audio selected yet.</div>
          )}
        </div>
      </div>

      <div className="vc-list">
        {loading ? (
          <div className="vc-loading">Loading voice capsules...</div>
        ) : capsules.length === 0 ? (
          <div className="vc-empty">No voice capsules yet. Record one to begin.</div>
        ) : (
          <div className="vc-grid">
            {capsules.map((cap) => (
              <div key={cap.id} className="vc-card glass">
                <div className="vc-card-header">
                  <div className="vc-card-title">{cap.title || 'Untitled Capsule'}</div>
                  <button className="vc-delete-btn" onClick={() => deleteCapsule(cap.id)} title="Delete">🗑</button>
                </div>
                {cap.note && <div className="vc-card-note">{cap.note}</div>}
                <div className="vc-card-date">{formatDate(cap.created_at)}</div>
                {cap.media_url && (
                  <audio controls src={`${API}${cap.media_url}`} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceCapsule;
