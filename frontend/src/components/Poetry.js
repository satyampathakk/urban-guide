import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import './Poetry.css';

const Poetry = () => {
  const [poems, setPoems] = useState([]);
  const [selectedPoem, setSelectedPoem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPoems();
  }, []);

  const fetchPoems = async () => {
    try {
      const response = await axios.get('/api/poems');
      setPoems(response.data);
    } catch (error) {
      console.error('Error fetching poems:', error);
      // Fallback data if API fails
      setPoems([
        {
          id: 1,
          title: "Forever Yours",
          content: `In your eyes I see tomorrow,
In your smile I find my home,
Every heartbeat whispers softly,
You're the one I'll never roam.

Through the seasons we will wander,
Hand in hand through joy and tears,
Building dreams and sharing laughter,
Growing stronger through the years.`,
          date_created: "2024-01-10"
        },
        {
          id: 2,
          title: "Morning Light",
          content: `When morning light touches your face,
I'm reminded of love's sweet grace,
Every dawn brings something new,
But my heart belongs to you.

Coffee shared in quiet moments,
Gentle kisses, soft and true,
Life's most beautiful components
Are the ones I share with you.`,
          date_created: "2024-02-14"
        },
        {
          id: 3,
          title: "Our Song",
          content: `We dance to melodies unheard,
Move to rhythms of the heart,
Every step and every word
Shows we'll never be apart.

Music plays in whispered secrets,
Harmonies in how we laugh,
Love's the song that never ceases,
You're my better, sweeter half.`,
          date_created: "2024-03-01"
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="poetry-loading">
        <motion.div
          className="loading-quill"
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          ✍️
        </motion.div>
        <p>Loading heartfelt words...</p>
      </div>
    );
  }

  return (
    <div className="poetry-container">
      <motion.h1
        className="romantic-title section-title"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        Poetry & Writings ✍️
      </motion.h1>

      <div className="poetry-content">
        <div className="poems-grid">
          {poems.map((poem, index) => (
            <motion.div
              key={poem.id}
              className="poem-card glass"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ scale: 1.02, y: -5 }}
              onClick={() => setSelectedPoem(poem)}
            >
              <div className="poem-header">
                <h3 className="poem-title">{poem.title}</h3>
                <span className="poem-date">{formatDate(poem.date_created)}</span>
              </div>

              <div className="poem-preview">
                {poem.content.split('\n').slice(0, 2).map((line, i) => (
                  <p key={i} className="preview-line">{line}</p>
                ))}
                <div className="read-more">Click to read more...</div>
              </div>

              <motion.div
                className="poem-decoration"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity, delay: index * 0.5 }}
              >
                🌹
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {selectedPoem && (
          <motion.div
            className="poem-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedPoem(null)}
          >
            <motion.div
              className="poem-modal glass"
              initial={{ opacity: 0, scale: 0.8, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 50 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2 className="modal-title">{selectedPoem.title}</h2>
                <motion.button
                  className="close-button"
                  onClick={() => setSelectedPoem(null)}
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                >
                  ✕
                </motion.button>
              </div>

              <div className="modal-content">
                <div className="poem-full-text">
                  {selectedPoem.content.split('\n').map((line, index) => (
                    <motion.p
                      key={index}
                      className="poem-line"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                    >
                      {line}
                    </motion.p>
                  ))}
                </div>

                <div className="poem-footer">
                  <span className="poem-date-full">
                    Written on {formatDate(selectedPoem.date_created)}
                  </span>
                  <motion.div
                    className="heart-signature"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    💕
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Poetry;