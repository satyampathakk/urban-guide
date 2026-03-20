import React from 'react';
import { motion } from 'framer-motion';
import MemoryBook from '../components/MemoryBook';

const MemoryBookPage = () => (
  <motion.div initial={{ y: 16, opacity: 1 }} animate={{ y: 0 }} transition={{ duration: 0.35 }}>
    <MemoryBook />
  </motion.div>
);

export default MemoryBookPage;
