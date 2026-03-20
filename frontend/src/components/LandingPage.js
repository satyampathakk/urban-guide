import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import FloatingElements from './FloatingElements';
import './LandingPage.css';

const LandingPage = ({ onAuthenticated }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [typedText, setTypedText] = useState('');
  
  const welcomeText = "A place made just for you...";

  useEffect(() => {
    let index = 0;
    const timer = setInterval(() => {
      if (index < welcomeText.length) {
        setTypedText(welcomeText.slice(0, index + 1));
        index++;
      } else {
        clearInterval(timer);
      }
    }, 100);

    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/login', { password });
      if (response.data.success) {
        setTimeout(() => {
          onAuthenticated();
        }, 1000);
      }
    } catch (err) {
      setError('Incorrect password. Try again with love 💕');
      setPassword('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      className="landing-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 1 }}
    >
      <FloatingElements />
      
      <div className="landing-content">
        <motion.div
          className="welcome-section"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          <h1 className="romantic-title main-title">
            Our Memory World
          </h1>
          
          <motion.p 
            className="elegant-text typing-text"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            {typedText}
            <span className="cursor">|</span>
          </motion.p>
        </motion.div>

        <motion.div
          className="login-section glass"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.8 }}
        >
          <form onSubmit={handleSubmit} className="login-form">
            <div className="input-group">
              <motion.input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter the magic words..."
                className="romantic-input"
                whileFocus={{ scale: 1.02 }}
                disabled={isLoading}
              />
            </div>
            
            {error && (
              <motion.p 
                className="error-message"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {error}
              </motion.p>
            )}
            
            <motion.button
              type="submit"
              className="romantic-button enter-button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="loading-text">Opening our world...</span>
              ) : (
                'Enter Our World 💕'
              )}
            </motion.button>
          </form>
          
          <motion.p 
            className="hint-text"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.5 }}
          >
            Hint: Three words that mean everything ✨
          </motion.p>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default LandingPage;