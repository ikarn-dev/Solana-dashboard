'use client';

import { motion } from 'framer-motion';

export default function Reloading() {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <motion.div
        className="relative w-16 h-16"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Outer ring */}
        <motion.div
          className="absolute inset-0 rounded-full border-4 border-purple-200/30"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        
        {/* Middle ring */}
        <motion.div
          className="absolute inset-2 rounded-full border-4 border-indigo-300/50"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.5, 0.7, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.2,
          }}
        />
        
        {/* Inner ring */}
        <motion.div
          className="absolute inset-4 rounded-full border-4 border-teal-400/70"
          animate={{
            scale: [1, 1.05, 1],
            opacity: [0.7, 0.9, 0.7],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.4,
          }}
        />
        
        {/* Center dot */}
        <motion.div
          className="absolute inset-[14px] rounded-full bg-gradient-to-r from-purple-500 to-indigo-600"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.8, 1, 0.8],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.6,
          }}
        />
      </motion.div>
    </div>
  );
} 