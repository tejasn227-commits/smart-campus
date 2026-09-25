import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LoadingScreenProps {
  onComplete: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);

  const steps = [
    'Initializing campus intelligence...',
    'Connecting Firebase...',
    'Loading campus resources...',
    'Synchronizing occupancy data...',
    'Loading analytics...',
    'SYSTEM READY',
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => {
        if (prev < steps.length - 1) {
          return prev + 1;
        }
        clearInterval(interval);
        setTimeout(onComplete, 500);
        return prev;
      });
    }, 600);

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-gradient-to-br from-slate-950 via-navy-950 to-slate-900"
    >
      <div className="text-center space-y-8">
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-6xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent mb-4">
            SMART CAMPUS
          </h1>
          <p className="text-slate-400 text-lg">
            AI-Powered Campus Resource Optimization
          </p>
        </motion.div>

        {/* Progress */}
        <div className="w-96 space-y-4">
          <AnimatePresence mode="wait">
            <motion.p
              key={step}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`text-sm font-medium ${
                step === steps.length - 1
                  ? 'text-emerald-400 text-lg'
                  : 'text-slate-400'
              }`}
            >
              {steps[step]}
            </motion.p>
          </AnimatePresence>

          {/* Progress bar */}
          <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${((step + 1) / steps.length) * 100}%` }}
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* Percentage */}
          <motion.p
            className="text-xs text-slate-500 text-right"
            key={step}
          >
            {Math.round(((step + 1) / steps.length) * 100)}%
          </motion.p>
        </div>

        {/* Animated dots */}
        <div className="flex justify-center gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-cyan-400 rounded-full"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.3, 1, 0.3],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
};
