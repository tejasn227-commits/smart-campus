import React from 'react';
import type { Room } from '../models';
import { motion } from 'framer-motion';
import { Users, Wifi, WifiOff } from 'lucide-react';

interface RoomCardProps {
  room: Room;
  onClick?: () => void;
}

export const RoomCard: React.FC<RoomCardProps> = ({ room, onClick }) => {
  const statusColors = {
    available: 'bg-emerald-500/20 text-emerald-400 border-emerald-400/30',
    occupied: 'bg-blue-500/20 text-blue-400 border-blue-400/30',
    booked: 'bg-amber-500/20 text-amber-400 border-amber-400/30',
    maintenance: 'bg-orange-500/20 text-orange-400 border-orange-400/30',
    unavailable: 'bg-red-500/20 text-red-400 border-red-400/30',
  };

  const occupancyPercentage = room.currentOccupancy
    ? (room.currentOccupancy / room.capacity) * 100
    : 0;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      className="glass-card cursor-pointer"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold">{room.name}</h3>
          <p className="text-sm text-slate-400">
            {room.building} • Floor {room.floor}
          </p>
        </div>
        <span className={`badge border ${statusColors[room.status]}`}>
          {room.status.toUpperCase()}
        </span>
      </div>

      <div className="space-y-3">
        {/* Capacity */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Users className="w-4 h-4" />
            <span>Capacity</span>
          </div>
          <span className="font-medium">
            {room.currentOccupancy || 0} / {room.capacity}
          </span>
        </div>

        {/* Occupancy bar */}
        {room.currentOccupancy !== undefined && (
          <div className="space-y-1">
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${occupancyPercentage}%` }}
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
              />
            </div>
            <p className="text-xs text-slate-400 text-right">
              {occupancyPercentage.toFixed(0)}% occupied
            </p>
          </div>
        )}

        {/* Type */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-400">Type</span>
          <span className="text-sm font-medium capitalize">
            {room.type.replace('-', ' ')}
          </span>
        </div>

        {/* Equipment */}
        {room.equipment && room.equipment.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-2 border-t border-white/10">
            {room.equipment.slice(0, 3).map((eq, idx) => (
              <span
                key={idx}
                className="text-xs px-2 py-1 bg-slate-800/50 rounded text-slate-300"
              >
                {eq}
              </span>
            ))}
            {room.equipment.length > 3 && (
              <span className="text-xs px-2 py-1 text-slate-400">
                +{room.equipment.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Camera status */}
        {room.hasCamera && (
          <div className="flex items-center gap-2 pt-2 border-t border-white/10">
            {room.cameraId ? (
              <>
                <Wifi className="w-4 h-4 text-emerald-400" />
                <span className="text-xs text-emerald-400">Camera Online</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-slate-400" />
                <span className="text-xs text-slate-400">Camera Offline</span>
              </>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};
