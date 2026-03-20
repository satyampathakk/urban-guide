import React from 'react';
import { motion } from 'framer-motion';
import SecretTrigger from '../components/SecretTrigger';

const SecretsPage = () => (
  <motion.div
    initial={{ y: 16, opacity: 1 }}
    animate={{ y: 0 }}
    transition={{ duration: 0.35 }}
    style={{ padding: '40px 20px', maxWidth: '700px', margin: '0 auto' }}
  >
    <SecretTrigger />
  </motion.div>
);

export default SecretsPage;
