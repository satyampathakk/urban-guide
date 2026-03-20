import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navigation from './Navigation';
import MemoryBookPage from '../pages/MemoryBookPage';
import MessagingPage from '../pages/MessagingPage';
import PoetryPage from '../pages/PoetryPage';
import MiniGamePage from '../pages/MiniGamePage';
import TimelinePage from '../pages/TimelinePage';
import TimeLockedPage from '../pages/TimeLockedPage';
import SecretsPage from '../pages/SecretsPage';
import UniversePage from '../pages/UniversePage';
import MemoryMatchPage from '../pages/MemoryMatchPage';
import CinematicPage from '../pages/CinematicPage';
import PhotoWheelPage from '../pages/PhotoWheelPage';
import VoiceCapsulePage from '../pages/VoiceCapsulePage';
import VideosPage from '../pages/VideosPage';
import './MainApp.css';

const MainApp = () => {
  return (
    <div className="main-app">
      <Navigation />

      <main className="app-content">
        <Routes>
          <Route path="/memories"   element={<MemoryBookPage />} />
          <Route path="/messages"   element={<MessagingPage />} />
          <Route path="/poetry"     element={<PoetryPage />} />
          <Route path="/game"       element={<MiniGamePage />} />
          <Route path="/timeline"   element={<TimelinePage />} />
          <Route path="/secrets"    element={<SecretsPage />} />
          <Route path="/timelocked" element={<TimeLockedPage />} />
          <Route path="/universe"   element={<UniversePage />} />
          <Route path="/cinematic"  element={<CinematicPage />} />
          <Route path="/match"      element={<MemoryMatchPage />} />
          <Route path="/wheel"      element={<PhotoWheelPage />} />
          <Route path="/voice"      element={<VoiceCapsulePage />} />
          <Route path="/videos"     element={<VideosPage />} />
          <Route path="*"           element={<Navigate to="/memories" replace />} />
        </Routes>
      </main>
    </div>
  );
};

export default MainApp;
