import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Brain, Calendar, Zap, Droplet, Users, AlertTriangle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const PredictionsPage: React.FC = () => {
  const [predictionType, setPredictionType] = useState<'energy' | 'water' | 'occupancy'>('energy');
  const [timeRange, setTimeRange] = useState<'today' | 'tomorrow' | 'week'>('tomorrow');

  // Demo prediction data
  const energyPredictions = [
    { time: '00:00', predicted: 45, actual: 42, confidence: 85 },
    { time: '04:00', predicted: 38, actual: 40, confidence: 88 },
    { time: '08:00', predicted: 120, actual: 115, confidence: 92 },
    { time: '12:00', predicted: 180, actual: 175, confidence: 90 },
    { time: '16:00', predicted: 150, actual: 155, confidence: 87 },
    { time: '20:00', predicted: 95, actual: 90, confidence: 89 },
  ];

  const waterPredictions = [
    { time: '00:00', predicted: 500, confidence: 82 },
    { time: '04:00', predicted: 400, confidence: 85 },
    { time: '08:00', predicted: 1200, confidence: 90 },
    { time: '12:00', predicted: 1800, confidence: 88 },
    { time: '16:00', predicted: 1500, confidence: 86 },
    { time: '20:00', predicted: 900, confidence: 87 },
  ];

  const occupancyPredictions = [
    { time: '08:00', predicted: 45, demand: 'High', confidence: 91 },
    { time: '09:00', predicted: 78, demand: 'Peak', confidence: 93 },
    { time: '10:00', predicted: 82, demand: 'Peak', confidence: 94 },
    { time: '11:00', predicted: 75, demand: 'High', confidence: 92 },
    { time: '12:00', predicted: 40, demand: 'Medium', confidence: 89 },
    { time: '13:00', predicted: 65, demand: 'High', confidence: 90 },
    { time: '14:00', predicted: 70, demand: 'High', confidence: 91 },
    { time: '15:00', predicted: 60, demand: 'High', confidence: 88 },
    { time: '16:00', predicted: 50, demand: 'Medium', confidence: 87 },
    { time: '17:00', predicted: 25, demand: 'Low', confidence: 85 },
  ];

  const getChartData = () => {
    switch (predictionType) {
      case 'energy':
        return energyPredictions;
      case 'water':
        return waterPredictions;
      case 'occupancy':
        return occupancyPredictions;
      default:
        return energyPredictions;
    }
  };

  const getDemandColor = (demand: string) => {
    switch (demand) {
      case 'Peak':
        return 'text-red-400 bg-red-500/20 border-red-400/30';
      case 'High':
        return 'text-amber-400 bg-amber-500/20 border-amber-400/30';
      case 'Medium':
        return 'text-cyan-400 bg-cyan-500/20 border-cyan-400/30';
      case 'Low':
        return 'text-emerald-400 bg-emerald-500/20 border-emerald-400/30';
      default:
        return 'text-slate-400 bg-slate-500/20 border-slate-400/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">AI Predictions</h1>
        <p className="text-slate-400">Forecast future resource demand and occupancy</p>
      </div>

      {/* Controls */}
      <div className="glass-card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Prediction Type</label>
            <select
              value={predictionType}
              onChange={(e) => setPredictionType(e.target.value as any)}
              className="input-field"
            >
              <option value="energy">Electricity Demand</option>
              <option value="water">Water Demand</option>
              <option value="occupancy">Classroom Demand</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Time Range</label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="input-field"
            >
              <option value="today">Today</option>
              <option value="tomorrow">Tomorrow</option>
              <option value="week">Next 7 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Prediction Chart */}
      <motion.div
        key={predictionType}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold capitalize">
            {predictionType} Predictions - {timeRange}
          </h2>
          <span className="badge-ai">AI PREDICTION</span>
        </div>

        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={getChartData()}>
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
            <Line
              type="monotone"
              dataKey="predicted"
              stroke="#a78bfa"
              strokeWidth={3}
              dot={{ fill: '#a78bfa', r: 5 }}
              name="Predicted"
            />
            {predictionType === 'energy' && (
              <Line
                type="monotone"
                dataKey="actual"
                stroke="#06b6d4"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: '#06b6d4', r: 4 }}
                name="Actual (Historical)"
              />
            )}
          </LineChart>
        </ResponsiveContainer>

        <div className="mt-4 glass-panel p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="w-5 h-5 text-purple-400" />
            <span className="font-medium text-purple-400">AI Model: Random Forest</span>
          </div>
          <p className="text-sm text-slate-400">
            Predictions based on historical patterns, time of day, day of week, and seasonal trends.
            Model accuracy: 87-94% confidence range.
          </p>
        </div>
      </motion.div>

      {/* Detailed Predictions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Prediction List */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card"
        >
          <h3 className="text-lg font-bold mb-4">Detailed Forecast</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {predictionType === 'occupancy' ? (
              occupancyPredictions.map((pred, idx) => (
                <div key={idx} className="glass-panel p-3 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{pred.time}</span>
                    <span className={`badge border ${getDemandColor(pred.demand)}`}>
                      {pred.demand}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Predicted Occupancy</span>
                    <span className="font-medium">{pred.predicted}%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-slate-400">Confidence</span>
                    <span className="text-purple-400">{pred.confidence}%</span>
                  </div>
                </div>
              ))
            ) : (
              getChartData().map((pred, idx) => (
                <div key={idx} className="glass-panel p-3 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{pred.time}</span>
                    <span className="text-purple-400">{pred.confidence}% confident</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Predicted Value</span>
                    <span className="font-medium">
                      {pred.predicted} {predictionType === 'energy' ? 'kWh' : 'L'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* Recommendations */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card"
        >
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-6 h-6 text-cyan-400" />
            <h3 className="text-lg font-bold">AI Recommendations</h3>
          </div>

          <div className="space-y-3">
            {predictionType === 'energy' && (
              <>
                <div className="glass-panel p-4 rounded-lg border-l-4 border-amber-500">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5" />
                    <div>
                      <p className="font-medium mb-1">Peak Load Expected</p>
                      <p className="text-sm text-slate-400">
                        High electricity demand predicted at 12:00 PM tomorrow. Consider
                        pre-cooling buildings or shifting non-essential loads.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="glass-panel p-4 rounded-lg border-l-4 border-emerald-500">
                  <div className="flex items-start gap-3">
                    <Zap className="w-5 h-5 text-emerald-400 mt-0.5" />
                    <div>
                      <p className="font-medium mb-1">Energy Saving Opportunity</p>
                      <p className="text-sm text-slate-400">
                        Low demand period from 2 AM - 6 AM. Schedule energy-intensive tasks
                        during this window.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {predictionType === 'water' && (
              <>
                <div className="glass-panel p-4 rounded-lg border-l-4 border-blue-500">
                  <div className="flex items-start gap-3">
                    <Droplet className="w-5 h-5 text-blue-400 mt-0.5" />
                    <div>
                      <p className="font-medium mb-1">Peak Water Usage</p>
                      <p className="text-sm text-slate-400">
                        Maximum water consumption expected between 8 AM - 2 PM. Ensure
                        adequate pressure and supply.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="glass-panel p-4 rounded-lg border-l-4 border-emerald-500">
                  <div className="flex items-start gap-3">
                    <TrendingUp className="w-5 h-5 text-emerald-400 mt-0.5" />
                    <div>
                      <p className="font-medium mb-1">Consumption Trending Down</p>
                      <p className="text-sm text-slate-400">
                        Water usage is 5.2% lower than last week. Conservation measures are
                        working effectively.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {predictionType === 'occupancy' && (
              <>
                <div className="glass-panel p-4 rounded-lg border-l-4 border-red-500">
                  <div className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-red-400 mt-0.5" />
                    <div>
                      <p className="font-medium mb-1">High Demand Period</p>
                      <p className="text-sm text-slate-400">
                        Peak classroom demand expected between 9 AM - 11 AM tomorrow. Ensure
                        all rooms are available and prepared.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="glass-panel p-4 rounded-lg border-l-4 border-cyan-500">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-cyan-400 mt-0.5" />
                    <div>
                      <p className="font-medium mb-1">Room Optimization</p>
                      <p className="text-sm text-slate-400">
                        Low occupancy predicted after 4 PM. Consider consolidating classes
                        to reduce resource usage in unused buildings.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};
