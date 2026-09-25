import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, Building, Bell, Palette, Database, Save } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState({
    campusName: 'Smart Campus University',
    occupancyThreshold: 75,
    detectionInterval: 3,
    alertThreshold: 85,
    emailNotifications: true,
    browserNotifications: false,
    darkMode: true,
  });

  const handleSave = () => {
    // Save settings
    alert('Settings saved successfully!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-slate-400">Configure campus monitoring preferences</p>
      </div>

      {/* Campus Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card"
      >
        <div className="flex items-center gap-3 mb-4">
          <Building className="w-6 h-6 text-cyan-400" />
          <h2 className="text-xl font-bold">Campus Configuration</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Campus Name</label>
            <input
              type="text"
              value={settings.campusName}
              onChange={(e) => setSettings({ ...settings, campusName: e.target.value })}
              className="input-field max-w-md"
            />
          </div>
        </div>
      </motion.div>

      {/* Detection Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card"
      >
        <div className="flex items-center gap-3 mb-4">
          <SettingsIcon className="w-6 h-6 text-cyan-400" />
          <h2 className="text-xl font-bold">Detection Settings</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              Occupancy Threshold (%)
            </label>
            <input
              type="number"
              value={settings.occupancyThreshold}
              onChange={(e) =>
                setSettings({ ...settings, occupancyThreshold: parseInt(e.target.value) })
              }
              className="input-field"
              min="0"
              max="100"
            />
            <p className="text-xs text-slate-400 mt-1">
              Trigger alerts when occupancy exceeds this percentage
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Detection Interval (seconds)
            </label>
            <input
              type="number"
              value={settings.detectionInterval}
              onChange={(e) =>
                setSettings({ ...settings, detectionInterval: parseInt(e.target.value) })
              }
              className="input-field"
              min="1"
              max="60"
            />
            <p className="text-xs text-slate-400 mt-1">
              How often to run people detection
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Alert Threshold (%)
            </label>
            <input
              type="number"
              value={settings.alertThreshold}
              onChange={(e) =>
                setSettings({ ...settings, alertThreshold: parseInt(e.target.value) })
              }
              className="input-field"
              min="0"
              max="100"
            />
            <p className="text-xs text-slate-400 mt-1">
              Resource usage above this level triggers alerts
            </p>
          </div>
        </div>
      </motion.div>

      {/* Notification Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card"
      >
        <div className="flex items-center gap-3 mb-4">
          <Bell className="w-6 h-6 text-cyan-400" />
          <h2 className="text-xl font-bold">Notifications</h2>
        </div>

        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.emailNotifications}
              onChange={(e) =>
                setSettings({ ...settings, emailNotifications: e.target.checked })
              }
              className="w-5 h-5 rounded border-white/20 bg-white/5 text-cyan-500 focus:ring-cyan-400"
            />
            <div>
              <p className="font-medium">Email Notifications</p>
              <p className="text-sm text-slate-400">
                Receive alert notifications via email
              </p>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.browserNotifications}
              onChange={(e) =>
                setSettings({ ...settings, browserNotifications: e.target.checked })
              }
              className="w-5 h-5 rounded border-white/20 bg-white/5 text-cyan-500 focus:ring-cyan-400"
            />
            <div>
              <p className="font-medium">Browser Notifications</p>
              <p className="text-sm text-slate-400">
                Show desktop notifications for critical alerts
              </p>
            </div>
          </label>
        </div>
      </motion.div>

      {/* Appearance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card"
      >
        <div className="flex items-center gap-3 mb-4">
          <Palette className="w-6 h-6 text-cyan-400" />
          <h2 className="text-xl font-bold">Appearance</h2>
        </div>

        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.darkMode}
              onChange={(e) => setSettings({ ...settings, darkMode: e.target.checked })}
              className="w-5 h-5 rounded border-white/20 bg-white/5 text-cyan-500 focus:ring-cyan-400"
            />
            <div>
              <p className="font-medium">Dark Mode</p>
              <p className="text-sm text-slate-400">
                Use dark theme across the application
              </p>
            </div>
          </label>
        </div>
      </motion.div>

      {/* Data & Connection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-card"
      >
        <div className="flex items-center gap-3 mb-4">
          <Database className="w-6 h-6 text-cyan-400" />
          <h2 className="text-xl font-bold">Data & Connection</h2>
        </div>

        <div className="space-y-4">
          <div className="glass-panel p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">Firebase Status</span>
              <span className="badge-live">CONNECTED</span>
            </div>
            <p className="text-sm text-slate-400">
              Real-time database connection active
            </p>
          </div>

          <div className="glass-panel p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">AI Model Status</span>
              <span className="badge-ai">LOADED</span>
            </div>
            <p className="text-sm text-slate-400">
              COCO-SSD people detection model ready
            </p>
          </div>
        </div>
      </motion.div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button onClick={handleSave} className="btn-primary">
          <Save className="w-5 h-5 mr-2 inline" />
          Save Settings
        </button>
      </div>
    </div>
  );
};
