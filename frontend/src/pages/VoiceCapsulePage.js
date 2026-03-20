import React from 'react';
import { motion } from 'framer-motion';
import VoiceCapsule from '../components/VoiceCapsule';

const VoiceCapsulePage = () => (
  <motion.div initial={{ y: 16, opacity: 1 }} animate={{ y: 0 }} transition={{ duration: 0.35 }}>
    <VoiceCapsule />
  </motion.div>
);

export default VoiceCapsulePage;
