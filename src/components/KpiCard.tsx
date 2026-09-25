import React, { type ReactNode } from 'react';
import { motion } from 'framer-motion';

interface KpiCardProps {
  title: string;
  value: string | number;
  unit?: string;
  change?: number;
  icon: ReactNode;
  source: 'live-firebase' | 'live-camera' | 'ai-prediction' | 'historical' | 'simulated';
  trend?: 'up' | 'down' | 'neutral';
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  unit,
  change,
  icon,
  source,
  trend = 'neutral',
}) => {
  const sourceLabels = {
    'live-firebase': 'LIVE FIREBASE',
    'live-camera': 'LIVE CAMERA',
    'ai-prediction': 'AI PREDICTION',
    'historical': 'HISTORICAL',
    'simulated': 'SIMULATED',
  };

  const sourceColors = {
    'live-firebase': 'badge-firebase',
    'live-camera': 'badge-camera',
    'ai-prediction': 'badge-ai',
    'historical': 'badge bg-slate-500/20 text-slate-400 border border-slate-400/30',
    'simulated': 'badge bg-yellow-500/20 text-yellow-400 border border-yellow-400/30',
  };

  const trendColors = {
    up: 'text-emerald-400',
    down: 'text-red-400',
    neutral: 'text-slate-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card hover:shadow-lg hover:shadow-cyan-500/10"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg border border-cyan-400/30">
          {icon}
        </div>
        <span className={sourceColors[source]}>{sourceLabels[source]}</span>
      </div>

      <h3 className="text-sm text-slate-400 font-medium mb-2">{title}</h3>

      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold">{value}</span>
        {unit && <span className="text-lg text-slate-400">{unit}</span>}
      </div>

      {change !== undefined && (
        <div className={`flex items-center gap-1 mt-2 text-sm font-medium ${trendColors[trend]}`}>
          <span>{trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}</span>
          <span>{Math.abs(change)}%</span>
        </div>
      )}
    </motion.div>
  );
};
