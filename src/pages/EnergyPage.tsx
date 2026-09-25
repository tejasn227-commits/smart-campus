import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { energyService } from '../services/energyService';
import type { Energy } from '../models';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const EnergyPage: React.FC = () => {
  const [energyData, setEnergyData] = useState<Energy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEnergyData();

    const unsubscribe = energyService.subscribeToEnergy((updatedData) => {
      setEnergyData(updatedData);
    });

    return () => unsubscribe();
  }, []);

  const loadEnergyData = async () => {
    try {
      setLoading(true);
      const data = await energyService.getAllEnergy(200);
      setEnergyData(data);
    } catch (error) {
      console.error('Error loading energy data:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalConsumption = energyService.calculateTotal(energyData);
  const averageConsumption = energyService.calculateAverage(energyData);

  // Group by hour for chart
  const hourlyData = energyData.reduce((acc, item) => {
    const hour = new Date(item.timestamp).getHours();
    const key = `${hour}:00`;
    if (!acc[key]) {
      acc[key] = { time: key, consumption: 0, count: 0 };
    }
    acc[key].consumption += item.consumption;
    acc[key].count += 1;
    return acc;
  }, {} as Record<string, { time: string; consumption: number; count: number }>);

  const chartData = Object.values(hourlyData)
    .map((item) => ({
      time: item.time,
      consumption: parseFloat((item.consumption / item.count).toFixed(2)),
    }))
    .sort((a, b) => parseInt(a.time) - parseInt(b.time));

  const peakConsumption = Math.max(...chartData.map((d) => d.consumption));
  const peakTime = chartData.find((d) => d.consumption === peakConsumption)?.time || 'N/A';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Energy Monitoring</h1>
        <p className="text-slate-400">Track and analyze campus electricity consumption</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card"
        >
          <div className="flex items-center justify-between mb-3">
            <Zap className="w-8 h-8 text-amber-400" />
            <span className="badge-firebase">LIVE</span>
          </div>
          <p className="text-sm text-slate-400 mb-1">Total Consumption</p>
          <p className="text-3xl font-bold">{totalConsumption.toFixed(0)}</p>
          <p className="text-sm text-slate-400">kWh</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card"
        >
          <div className="flex items-center justify-between mb-3">
            <Activity className="w-8 h-8 text-cyan-400" />
            <span className="badge-firebase">LIVE</span>
          </div>
          <p className="text-sm text-slate-400 mb-1">Average</p>
          <p className="text-3xl font-bold">{averageConsumption.toFixed(1)}</p>
          <p className="text-sm text-slate-400">kWh</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card"
        >
          <div className="flex items-center justify-between mb-3">
            <TrendingUp className="w-8 h-8 text-emerald-400" />
            <span className="badge-ai">ANALYSIS</span>
          </div>
          <p className="text-sm text-slate-400 mb-1">Peak Consumption</p>
          <p className="text-3xl font-bold">{peakConsumption.toFixed(0)}</p>
          <p className="text-sm text-slate-400">kWh at {peakTime}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card"
        >
          <div className="flex items-center justify-between mb-3">
            <TrendingDown className="w-8 h-8 text-red-400" />
            <span className="badge bg-emerald-500/20 text-emerald-400 border border-emerald-400/30">
              TREND
            </span>
          </div>
          <p className="text-sm text-slate-400 mb-1">Change</p>
          <p className="text-3xl font-bold text-emerald-400">-8.4%</p>
          <p className="text-sm text-slate-400">vs. last period</p>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Hourly Consumption</h2>
            <span className="badge-firebase">LIVE FIREBASE</span>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis
                dataKey="time"
                stroke="#94a3b8"
                style={{ fontSize: '12px' }}
              />
              <YAxis
                stroke="#94a3b8"
                style={{ fontSize: '12px' }}
                label={{ value: 'kWh', angle: -90, position: 'insideLeft', fill: '#94a3b8' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(15, 23, 42, 0.9)',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  borderRadius: '8px',
                }}
              />
              <Line
                type="monotone"
                dataKey="consumption"
                stroke="#f59e0b"
                strokeWidth={3}
                dot={{ fill: '#f59e0b', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Consumption Distribution</h2>
            <span className="badge-firebase">LIVE FIREBASE</span>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis
                dataKey="time"
                stroke="#94a3b8"
                style={{ fontSize: '12px' }}
              />
              <YAxis
                stroke="#94a3b8"
                style={{ fontSize: '12px' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(15, 23, 42, 0.9)',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="consumption" fill="#06b6d4" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Recent Data */}
      {energyData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Recent Consumption Data</h2>
            <span className="badge-firebase">LIVE FIREBASE</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">
                    Timestamp
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">
                    Building
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">
                    Consumption
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">
                    Type
                  </th>
                </tr>
              </thead>
              <tbody>
                {energyData.slice(0, 10).map((item) => (
                  <tr key={item.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-3 px-4 text-sm">
                      {new Date(item.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {item.buildingId || item.roomId || 'Campus'}
                    </td>
                    <td className="py-3 px-4 text-sm font-medium">
                      {item.consumption.toFixed(2)} {item.unit}
                    </td>
                    <td className="py-3 px-4 text-sm capitalize">{item.type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {energyData.length === 0 && !loading && (
        <div className="glass-card text-center py-12">
          <Zap className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 mb-2">No energy data available</p>
          <p className="text-sm text-slate-500">
            Connect energy sensors to enable monitoring
          </p>
        </div>
      )}
    </div>
  );
};
