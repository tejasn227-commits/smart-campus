import React from 'react';
import { Bell, Menu, User } from 'lucide-react';
import { motion } from 'framer-motion';

interface TopBarProps {
  onMenuClick: () => void;
  alertCount?: number;
  user?: {
    name: string;
    role: 'admin' | 'security' | 'guard';
  } | null;
}

export const TopBar: React.FC<TopBarProps> = ({ onMenuClick, alertCount = 0, user }) => {
  const roleLabel = user?.role === 'security' ? 'Security Lead' : user?.role === 'guard' ? 'Floor Guard' : 'Campus Manager';

  return (
    <header className="top-bar glass-panel sticky top-0 z-30 border-b border-white/10">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div>
            <h2 className="text-lg font-semibold">Campus Command Center</h2>
            <p className="text-sm text-slate-400">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button className="relative p-2 hover:bg-white/10 rounded-lg transition-colors" type="button">
            <Bell className="w-6 h-6" />
            {alertCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center font-bold"
              >
                {alertCount > 9 ? '9+' : alertCount}
              </motion.span>
            )}
          </button>

          <button className="flex items-center gap-3 px-4 py-2 hover:bg-white/10 rounded-lg transition-colors" type="button">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-medium">{user?.name || 'Admin'}</p>
              <p className="text-xs text-slate-400">{roleLabel}</p>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};
