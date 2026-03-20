import React from 'react';
import { motion } from 'framer-motion';
import MiniGame from '../components/MiniGame';

const MiniGamePage = () => (
  <motion.div initial={{ y: 16, opacity: 1 }} animate={{ y: 0 }} transition={{ duration: 0.35 }}>
    <MiniGame />
  </motion.div>
);

export default MiniGamePage;
