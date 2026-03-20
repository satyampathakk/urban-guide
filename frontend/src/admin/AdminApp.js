import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import adminApi from './adminApi';
import AdminHome from './pages/AdminHome';
import AdminMemories from './pages/AdminMemories';
import AdminPoems from './pages/AdminPoems';
import AdminMessages from './pages/AdminMessages';
import AdminSecrets from './pages/AdminSecrets';
import AdminTimeline from './pages/AdminTimeline';
import AdminSettings from './pages/AdminSettings';
import AdminStory from './pages/AdminStory';
import AdminMusic from './pages/AdminMusic';
import AdminGameCards from './pages/AdminGameCards';
import AdminLetters from './pages/AdminLetters';
import AdminAnniversary from './pages/AdminAnniversary';
import './AdminApp.css';

// ── Toast system ──────────────────────────────────────────────────────────────
let _addToast = null;
export const toast = (msg, type = 'success') => {
  if (_addToast) _addToast({ id: Date.now(), msg, type });
};

function Toasts() {
  const [toasts, setToasts] = useState([]);
  useEffect(() => {
    _addToast = (t) => {
      setToasts(p => [...p, t]);
      setTimeout(() => setToasts(p => p.filter(x => x.id !== t.id)), 3000);
    };
  }, []);
  return (
    <div className="toast-container">
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div key={t.id} className={`toast toast-${t.type}`}
            initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 60 }}>
            {t.msg}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ── Login ─────────────────────────────────────────────────────────────────────
function AdminLogin({ onLogin }) {
  const [form, setForm] = useState({ username: '', password: '' });
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setErr('');
    try {
      const { data } = await adminApi.post('/admin/login', form);
      localStorage.setItem('admin_token', data.token);
      onLogin();
    } catch {
      setErr('Invalid credentials');
    } finally { setLoading(false); }
  };

  return (
    <div className="admin-login-wrap">
      <motion.div className="admin-login-card"
        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
        <div className="admin-login-icon">🔐</div>
        <h1 className="admin-login-title">Admin Panel</h1>
        <p className="admin-login-sub">Romantic Memory World</p>
        <form onSubmit={submit} className="admin-login-form">
          <input className="admin-input" value={form.username}
            onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
            placeholder="Username" required autoComplete="username" />
          <input className="admin-input" type="password" value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            placeholder="Password" required autoComplete="current-password" />
          {err && <p className="admin-login-err">{err}</p>}
          <button className="admin-btn admin-btn-primary" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <p className="admin-login-hint">Default: admin / admin123</p>
      </motion.div>
    </div>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
const NAV = [
  { path: '/admin',          icon: '📊', label: 'Dashboard', end: true },
  { path: '/admin/memories', icon: '📖', label: 'Memories' },
  { path: '/admin/poems',    icon: '✍️',  label: 'Poetry' },
  { path: '/admin/messages', icon: '💬', label: 'Messages' },
  { path: '/admin/secrets',  icon: '🔐', label: 'Secrets' },
  { path: '/admin/timeline', icon: '💞', label: 'Timeline' },
  { path: '/admin/story',     icon: '🎬', label: 'Story' },
  { path: '/admin/music',     icon: '🎵', label: 'Music' },
  { path: '/admin/gamecards', icon: '💖', label: 'Game Cards' },
  { path: '/admin/letters',   icon: '⏳', label: 'Letters' },
  { path: '/admin/anniversary', icon: 'A', label: 'Anniversary' },
  { path: '/admin/settings',  icon: '⚙️',  label: 'Settings' },
];

function Sidebar({ onLogout }) {
  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-logo">
        <span>💕</span><span className="admin-logo-text">Admin</span>
      </div>
      <nav className="admin-sidebar-nav">
        {NAV.map(item => (
          <NavLink key={item.path} to={item.path} end={item.end}
            className={({ isActive }) => `admin-nav-link${isActive ? ' active' : ''}`}>
            <span>{item.icon}</span><span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="admin-sidebar-footer">
        <a href="/" className="admin-nav-link" style={{ marginBottom: 6 }}>← Back to App</a>
        <button className="admin-logout-btn" onClick={onLogout}>🚪 Logout</button>
      </div>
    </aside>
  );
}

// ── Main AdminApp ─────────────────────────────────────────────────────────────
export default function AdminApp() {
  const [authed, setAuthed] = useState(!!localStorage.getItem('admin_token'));

  const logout = () => {
    localStorage.removeItem('admin_token');
    setAuthed(false);
  };

  if (!authed) return <><Toasts /><AdminLogin onLogin={() => setAuthed(true)} /></>;

  return (
    <div className="admin-layout">
      <Toasts />
      <Sidebar onLogout={logout} />
      <main className="admin-main">
        <Routes>
          <Route index                element={<AdminHome />} />
          <Route path="memories"      element={<AdminMemories />} />
          <Route path="poems"         element={<AdminPoems />} />
          <Route path="messages"      element={<AdminMessages />} />
          <Route path="secrets"       element={<AdminSecrets />} />
          <Route path="timeline"      element={<AdminTimeline />} />
          <Route path="story"         element={<AdminStory />} />
          <Route path="music"         element={<AdminMusic />} />
          <Route path="gamecards"     element={<AdminGameCards />} />
          <Route path="letters"       element={<AdminLetters />} />
          <Route path="anniversary"   element={<AdminAnniversary />} />
          <Route path="settings"      element={<AdminSettings />} />
          <Route path="*"             element={<Navigate to="/admin" replace />} />
        </Routes>
      </main>
    </div>
  );
}
