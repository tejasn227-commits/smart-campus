import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  DoorOpen,
  Users,
  Zap,
  Droplet,
  TrendingUp,
  Bell,
  FileText,
  Camera,
  Settings,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
  { path: '/', label: 'Overview', icon: LayoutDashboard },
  { path: '/smart-rooms', label: 'Smart Rooms', icon: DoorOpen },
  { path: '/occupancy', label: 'Occupancy', icon: Users },
  { path: '/energy', label: 'Energy', icon: Zap },
  { path: '/water', label: 'Water', icon: Droplet },
  { path: '/predictions', label: 'Predictions', icon: TrendingUp },
  { path: '/alerts', label: 'Alerts', icon: Bell },
  { path: '/reports', label: 'Reports', icon: FileText },
  { path: '/cameras', label: 'Cameras', icon: Camera },
  { path: '/settings', label: 'Settings', icon: Settings },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ x: isOpen ? 0 : -320 }}
        className="sidebar fixed left-0 top-0 z-50 h-full w-80 glass-panel border-r border-white/10 lg:static lg:translate-x-0"
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  SMART CAMPUS
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  AI-Powered Resource Optimization
                </p>
              </div>
              <button
                onClick={onClose}
                className="lg:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 overflow-y-auto">
            <ul className="space-y-1">
              {navItems.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                        isActive
                          ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-400/30'
                          : 'text-slate-300 hover:bg-white/10 hover:text-white'
                      }`
                    }
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-white/10">
            <div className="glass-panel p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="status-online" />
                <span className="text-xs font-medium text-emerald-400">
                  FIREBASE CONNECTED
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Real-time campus monitoring active
              </p>
            </div>
          </div>
        </div>
      </motion.aside>
    </>
  );
};
