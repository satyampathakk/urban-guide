import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './Messaging.css';

const API = 'http://localhost:8000';

const Messaging = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sender, setSender] = useState(() => localStorage.getItem('chat_name') || '');
  const [ws, setWs] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null); // { type, url, file }

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Persist sender name
  useEffect(() => {
    if (sender) localStorage.setItem('chat_name', sender);
  }, [sender]);

  useEffect(() => {
    const websocket = new WebSocket(`ws://localhost:8000/ws`);
    websocket.onopen = () => { setIsConnected(true); setWs(websocket); };
    websocket.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      setMessages(prev => {
        // avoid duplicate if we already added it optimistically
        if (prev.find(m => m.id && m.id === msg.id)) return prev;
        return [...prev, { ...msg, id: msg.id || Date.now() }];
      });
    };
    websocket.onclose = () => setIsConnected(false);
    websocket.onerror = () => setIsConnected(false);

    fetch('/api/messages')
      .then(r => r.json())
      .then(data => setMessages(data))
      .catch(() => {});

    return () => websocket.close();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendText = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !sender.trim() || !ws) return;
    const msg = { content: newMessage, sender, msg_type: 'text', timestamp: new Date().toISOString() };
    ws.send(JSON.stringify(msg));
    setNewMessage('');
  };

  const uploadMedia = useCallback(async (file, type) => {
    if (!sender.trim()) { alert('Please enter your name first'); return; }
    setUploading(true);
    const form = new FormData();
    form.append('file', file);
    form.append('sender', sender);
    form.append('msg_type', type);
    try {
      await fetch(`${API}/api/upload`, { method: 'POST', body: form });
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
      setPreview(null);
    }
  }, [sender]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const type = file.type.startsWith('image') ? 'image'
      : file.type.startsWith('video') ? 'video'
      : file.type.startsWith('audio') ? 'audio'
      : 'file';
    const url = URL.createObjectURL(file);
    setPreview({ type, url, file });
    e.target.value = '';
  };

  const confirmSend = () => {
    if (!preview) return;
    uploadMedia(preview.file, preview.type);
  };

  // Voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mr.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setPreview({ type: 'audio', url, file });
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setRecording(true);
    } catch {
      alert('Microphone access denied');
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const formatTime = (ts) => new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const isOwn = (msg) => msg.sender === sender;

  return (
    <div className="messaging-container">
      <motion.h1
        className="romantic-title section-title"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        Our Private Messages 💬
      </motion.h1>

      {/* Name input */}
      <div className="name-row">
        <input
          type="text"
          value={sender}
          onChange={e => setSender(e.target.value)}
          placeholder="Your name..."
          className="romantic-input sender-input"
        />
        <div className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`} title={isConnected ? 'Connected' : 'Disconnected'} />
      </div>

      <div className="chat-container glass">
        {/* Messages */}
        <div className="messages-area">
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => (
              <motion.div
                key={msg.id || i}
                className={`message ${isOwn(msg) ? 'own-message' : 'other-message'}`}
                initial={{ opacity: 0, y: 16, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.25 }}
              >
                <div className="message-bubble">
                  <div className="message-header">
                    <span className="sender-name">{msg.sender}</span>
                    <span className="message-time">{formatTime(msg.timestamp)}</span>
                  </div>
                  <MessageContent msg={msg} />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* Preview before send */}
        <AnimatePresence>
          {preview && (
            <motion.div
              className="preview-bar glass"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
            >
              <div className="preview-content">
                {preview.type === 'image' && <img src={preview.url} alt="preview" className="preview-img" />}
                {preview.type === 'video' && <video src={preview.url} className="preview-img" controls />}
                {preview.type === 'audio' && <audio src={preview.url} controls className="preview-audio" />}
                {preview.type === 'file' && <span className="preview-file">📎 {preview.file.name}</span>}
              </div>
              <div className="preview-actions">
                <motion.button className="romantic-button" onClick={confirmSend} disabled={uploading} whileHover={{ scale: 1.05 }}>
                  {uploading ? 'Sending...' : 'Send 💕'}
                </motion.button>
                <button className="cancel-btn" onClick={() => setPreview(null)}>✕</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input bar */}
        <form className="message-form" onSubmit={sendText}>
          <div className="input-row">
            {/* Attachment */}
            <input ref={fileInputRef} type="file" accept="image/*,video/*,audio/*,.pdf,.doc,.docx" onChange={handleFileChange} style={{ display: 'none' }} />
            <motion.button type="button" className="icon-btn" onClick={() => fileInputRef.current.click()} whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} title="Attach file">
              📎
            </motion.button>

            {/* Voice note */}
            <motion.button
              type="button"
              className={`icon-btn ${recording ? 'recording' : ''}`}
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onTouchStart={startRecording}
              onTouchEnd={stopRecording}
              whileHover={{ scale: 1.15 }}
              title="Hold to record voice"
            >
              {recording ? '🔴' : '🎤'}
            </motion.button>

            <input
              type="text"
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              placeholder={recording ? 'Recording...' : 'Type a message...'}
              className="romantic-input message-input"
              disabled={recording}
            />

            <motion.button
              type="submit"
              className="romantic-button send-btn"
              disabled={!isConnected || !newMessage.trim()}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              💕
            </motion.button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Renders the right content based on message type
const MessageContent = ({ msg }) => {
  const base = 'http://localhost:8000';
  const url = msg.media_url ? `${base}${msg.media_url}` : null;

  if (msg.msg_type === 'image' && url) {
    return (
      <a href={url} target="_blank" rel="noreferrer">
        <img src={url} alt="shared" className="msg-image" />
      </a>
    );
  }
  if (msg.msg_type === 'video' && url) {
    return <video src={url} controls className="msg-video" />;
  }
  if (msg.msg_type === 'audio' && url) {
    return (
      <div className="msg-audio">
        <span>🎤 Voice note</span>
        <audio src={url} controls />
      </div>
    );
  }
  if (msg.msg_type === 'file' && url) {
    return (
      <a href={url} target="_blank" rel="noreferrer" className="msg-file">
        📎 {msg.content}
      </a>
    );
  }
  return <div className="message-content">{msg.content}</div>;
};

export default Messaging;
