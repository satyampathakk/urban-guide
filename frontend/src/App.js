import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import LandingPage from './components/LandingPage';
import MainApp from './components/MainApp';
import MusicPlayer from './components/MusicPlayer';
import HeartCursor from './components/HeartCursor';
import SurpriseEngine from './components/SurpriseEngine';
import EnvironmentEffects from './components/EnvironmentEffects';
import StarBackground from './components/StarBackground';
import { MoodProvider, MoodSelector, TimeGreeting } from './components/MoodSystem';
import { RememberThisDay } from './components/MagicWidgets';
import AdminApp from './admin/AdminApp';
import AnniversaryExperience from './components/AnniversaryExperience';
import './App.css';

// Inner component so we can use useLocation inside Router
function AppRoutes() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <>
      {/* Star background only on the main app, not admin */}
      {!isAdmin && <StarBackground />}
      {!isAdmin && <HeartCursor />}

      <Routes>
        {/* ── Admin panel — completely isolated, no star bg, no romantic widgets ── */}
        <Route path="/admin/*" element={<AdminApp />} />

        {/* ── Main romantic app ── */}
        <Route
          path="/"
          element={
            !isAuthenticated
              ? <LandingPage onAuthenticated={() => setIsAuthenticated(true)} />
              : <Navigate to="/memories" replace />
          }
        />
        <Route
          path="/*"
          element={
            isAuthenticated
              ? <MainApp />
              : <Navigate to="/" replace />
          }
        />
      </Routes>

      {/* Romantic widgets — only when authenticated and not in admin */}
      {isAuthenticated && !isAdmin && (
        <>
          <AnniversaryExperience />
          <MusicPlayer />
          <SurpriseEngine />
          <MoodSelector />
          <EnvironmentEffects />
          <TimeGreeting />
          <RememberThisDay />
        </>
      )}
    </>
  );
}

function App() {
  return (
    <MoodProvider>
      <div className="App">
        <Router>
          <AppRoutes />
        </Router>
      </div>
    </MoodProvider>
  );
}

export default App;
