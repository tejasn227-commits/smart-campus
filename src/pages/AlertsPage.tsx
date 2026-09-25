import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Filter } from 'lucide-react';
import { alertService } from '../services/alertService';
import type { Alert } from '../models';
import { AlertCard } from '../components/AlertCard';

export const AlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    loadAlerts();

    const unsubscribe = alertService.subscribeToAlerts((updatedAlerts) => {
      setAlerts(updatedAlerts);
    });

    return () => unsubscribe();
  }, []);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const alertsData = await alertService.getAlerts(100);
      setAlerts(alertsData);
    } catch (error) {
      console.error('Error loading alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (alertId: string) => {
    try {
      await alertService.acknowledgeAlert(alertId, 'admin');
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  };

  const handleResolve = async (alertId: string) => {
    try {
      await alertService.resolveAlert(alertId, 'admin');
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  };

  const filteredAlerts = alerts.filter((alert) => {
    if (filterStatus !== 'all' && alert.status !== filterStatus) return false;
    if (filterSeverity !== 'all' && alert.severity !== filterSeverity) return false;
    if (filterType !== 'all' && alert.type !== filterType) return false;
    return true;
  });

  const newCount = alerts.filter((a) => a.status === 'new').length;
  const acknowledgedCount = alerts.filter((a) => a.status === 'acknowledged').length;
  const resolvedCount = alerts.filter((a) => a.status === 'resolved').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Alert Center</h1>
        <p className="text-slate-400">Monitor and manage campus alerts</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card border-l-4 border-red-500"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 mb-1">New Alerts</p>
              <p className="text-3xl font-bold text-red-400">{newCount}</p>
            </div>
            <AlertTriangle className="w-10 h-10 text-red-400 opacity-20" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card border-l-4 border-amber-500"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 mb-1">Acknowledged</p>
              <p className="text-3xl font-bold text-amber-400">{acknowledgedCount}</p>
            </div>
            <AlertTriangle className="w-10 h-10 text-amber-400 opacity-20" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card border-l-4 border-emerald-500"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 mb-1">Resolved</p>
              <p className="text-3xl font-bold text-emerald-400">{resolvedCount}</p>
            </div>
            <AlertTriangle className="w-10 h-10 text-emerald-400 opacity-20" />
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="glass-card">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-slate-400" />
          <h3 className="font-semibold">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input-field"
            >
              <option value="all">All Status</option>
              <option value="new">New</option>
              <option value="acknowledged">Acknowledged</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Severity</label>
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="input-field"
            >
              <option value="all">All Severity</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="input-field"
            >
              <option value="all">All Types</option>
              <option value="energy">Energy</option>
              <option value="water">Water</option>
              <option value="occupancy">Occupancy</option>
              <option value="booking">Booking</option>
              <option value="camera">Camera</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">
            Alerts ({filteredAlerts.length})
          </h2>
          <span className="badge-firebase">LIVE FIREBASE</span>
        </div>

        {filteredAlerts.length === 0 ? (
          <div className="glass-card text-center py-12">
            <AlertTriangle className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No alerts found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAlerts.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onAcknowledge={
                  alert.status === 'new'
                    ? () => handleAcknowledge(alert.id)
                    : undefined
                }
                onResolve={
                  alert.status === 'acknowledged'
                    ? () => handleResolve(alert.id)
                    : undefined
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
