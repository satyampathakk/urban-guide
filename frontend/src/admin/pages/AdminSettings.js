import React, { useEffect, useState } from 'react';
import adminApi from '../adminApi';
import { toast } from '../AdminApp';

export default function AdminSettings() {
  const [s, setS] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminApi.get('/admin/settings').then(r => { setS(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const set = (k, v) => setS(p => ({ ...p, [k]: v }));

  const save = async (e) => {
    e.preventDefault(); setSaving(true);
    try { await adminApi.put('/admin/settings', s); toast('Settings saved ✓'); }
    catch { toast('Save failed', 'error'); }
    finally { setSaving(false); }
  };

  if (loading) return <div style={{ padding: 40, color: 'var(--am)' }}>Loading...</div>;

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-title">⚙️ Settings</h1>
      </div>

      <form onSubmit={save}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(380px,1fr))', gap: 18 }}>

          <div className="admin-card">
            <h3 style={{ marginBottom: 16, fontSize: '0.9rem', fontWeight: 600, color: 'var(--ap)' }}>🔐 App Access</h3>
            <div className="admin-form-group">
              <label>Main App Password</label>
              <input className="admin-input" value={s.app_password || ''} onChange={e => set('app_password', e.target.value)} />
            </div>
            <div className="admin-form-group">
              <label>Her Name</label>
              <input className="admin-input" value={s.her_name || ''} onChange={e => set('her_name', e.target.value)} />
            </div>
          </div>

          <div className="admin-card">
            <h3 style={{ marginBottom: 16, fontSize: '0.9rem', fontWeight: 600, color: 'var(--ap)' }}>🎛️ Feature Toggles</h3>
            {[['music_enabled', '🎵 Background Music'], ['surprise_enabled', '🎁 Surprise Button'], ['game_enabled', '🎮 Mini Game']].map(([key, label]) => (
              <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <span style={{ fontSize: '0.88rem' }}>{label}</span>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="checkbox" checked={s[key] === 'true'}
                    onChange={e => set(key, e.target.checked ? 'true' : 'false')}
                    style={{ width: 16, height: 16, accentColor: 'var(--ap)' }} />
                  <span style={{ fontSize: '0.8rem', color: 'var(--am)' }}>{s[key] === 'true' ? 'On' : 'Off'}</span>
                </label>
              </div>
            ))}
          </div>

          <div className="admin-card">
            <h3 style={{ marginBottom: 16, fontSize: '0.9rem', fontWeight: 600, color: 'var(--ap)' }}>🎮 Game Reward</h3>
            <div className="admin-form-group">
              <label>Win Message</label>
              <textarea className="admin-textarea" rows={3} value={s.game_reward_message || ''} onChange={e => set('game_reward_message', e.target.value)} />
            </div>
          </div>

          <div className="admin-card">
            <h3 style={{ marginBottom: 16, fontSize: '0.9rem', fontWeight: 600, color: 'var(--ap)' }}>🎨 Theme</h3>
            <div className="admin-form-group">
              <label>Primary Color</label>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <input type="color" value={s.primary_color || '#ff69b4'} onChange={e => set('primary_color', e.target.value)}
                  style={{ width: 42, height: 34, border: 'none', background: 'none', cursor: 'pointer', borderRadius: 6 }} />
                <input className="admin-input" value={s.primary_color || ''} onChange={e => set('primary_color', e.target.value)} style={{ flex: 1 }} />
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 22 }}>
          <button type="submit" className="admin-btn admin-btn-primary" disabled={saving}>
            {saving ? 'Saving...' : '💾 Save All Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
