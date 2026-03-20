import React from 'react';
import { motion } from 'framer-motion';
import Messaging from '../components/Messaging';

const MessagingPage = () => (
  <motion.div initial={{ y: 16, opacity: 1 }} animate={{ y: 0 }} transition={{ duration: 0.35 }}>
    <Messaging />
  </motion.div>
);

export default MessagingPage;
