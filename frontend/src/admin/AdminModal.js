import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminModal({ open, onClose, title, children }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="admin-modal-overlay"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}>
          <motion.div className="admin-modal"
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>{title}</h3>
              <button className="admin-modal-close" onClick={onClose}>✕</button>
            </div>
            <div className="admin-modal-body">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
