import React from 'react';
import type { Alert } from '../models';
import { motion } from 'framer-motion';
import {
  Zap,
  Droplet,
  Users,
  Calendar,
  Camera,
  Settings,
  CheckCircle,
  } from 'lucide-react';

interface AlertCardProps {
  alert: Alert;
  onAcknowledge?: () => void;
  onResolve?: () => void;
}

export const AlertCard: React.FC<AlertCardProps> = ({
  alert,
  onAcknowledge,
  onResolve,
}) => {
  const severityColors = {
    low: 'border-blue-400/30 bg-blue-500/10',
    medium: 'border-amber-400/30 bg-amber-500/10',
    high: 'border-orange-400/30 bg-orange-500/10',
    critical: 'border-red-400/30 bg-red-500/10',
  };

  const statusColors = {
    new: 'bg-red-500/20 text-red-400 border-red-400/30',
    acknowledged: 'bg-amber-500/20 text-amber-400 border-amber-400/30',
    resolved: 'bg-emerald-500/20 text-emerald-400 border-emerald-400/30',
  };

  const icons = {
    energy: Zap,
    water: Droplet,
    occupancy: Users,
    booking: Calendar,
    camera: Camera,
    maintenance: Settings,
  };

  const Icon = icons[alert.type];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`glass-panel p-4 border ${severityColors[alert.severity]}`}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="p-2 bg-white/5 rounded-lg">
          <Icon className="w-5 h-5" />
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h4 className="font-semibold">{alert.title}</h4>
              {alert.location && (
                <p className="text-sm text-slate-400">{alert.location}</p>
              )}
            </div>
            <span className={`badge border text-xs ${statusColors[alert.status]}`}>
              {alert.status.toUpperCase()}
            </span>
          </div>

          <p className="text-sm text-slate-300 mb-3">{alert.description}</p>

          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span className="capitalize">{alert.severity} priority</span>
            <span>•</span>
            <span>{new Date(alert.timestamp).toLocaleString()}</span>
          </div>

          {/* Actions */}
          {alert.status === 'new' && onAcknowledge && (
            <button
              onClick={onAcknowledge}
              className="mt-3 btn-secondary text-sm"
            >
              <CheckCircle className="w-4 h-4 mr-2 inline" />
              Acknowledge
            </button>
          )}

          {alert.status === 'acknowledged' && onResolve && (
            <button
              onClick={onResolve}
              className="mt-3 btn-primary text-sm"
            >
              <CheckCircle className="w-4 h-4 mr-2 inline" />
              Mark as Resolved
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};
