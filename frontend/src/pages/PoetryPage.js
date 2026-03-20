import React from 'react';
import { motion } from 'framer-motion';
import Poetry from '../components/Poetry';

const PoetryPage = () => (
  <motion.div initial={{ y: 16, opacity: 1 }} animate={{ y: 0 }} transition={{ duration: 0.35 }}>
    <Poetry />
  </motion.div>
);

export default PoetryPage;
