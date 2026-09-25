import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download } from 'lucide-react';
import { downloadCSV } from '../utils/helpers';

export const ReportsPage: React.FC = () => {
  const [reportType, setReportType] = useState('daily');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const generateReport = () => {
    // Demo data for reports
    const reportData = [
      {
        date: '2026-09-24',
        rooms_available: 45,
        rooms_occupied: 32,
        rooms_booked: 8,
        total_occupancy: 1240,
        energy_kwh: 1850,
        water_liters: 12400,
        alerts: 3,
      },
      {
        date: '2026-09-23',
        rooms_available: 48,
        rooms_occupied: 28,
        rooms_booked: 9,
        total_occupancy: 1180,
        energy_kwh: 1920,
        water_liters: 13100,
        alerts: 5,
      },
      {
        date: '2026-09-22',
        rooms_available: 42,
        rooms_occupied: 35,
        rooms_booked: 8,
        total_occupancy: 1320,
        energy_kwh: 1780,
        water_liters: 11900,
        alerts: 2,
      },
    ];

    const filename = `smart-campus-${reportType}-report-${new Date().toISOString().split('T')[0]}.csv`;
    downloadCSV(reportData, filename);
  };

  const reportTypes = [
    { value: 'daily', label: 'Daily Campus Report', description: 'Daily summary of all campus activities' },
    { value: 'weekly', label: 'Weekly Resource Report', description: 'Weekly energy and water consumption' },
    { value: 'energy', label: 'Energy Report', description: 'Detailed electricity usage analysis' },
    { value: 'water', label: 'Water Report', description: 'Detailed water consumption analysis' },
    { value: 'occupancy', label: 'Occupancy Report', description: 'Room utilization and occupancy trends' },
    { value: 'alerts', label: 'Alert Report', description: 'Summary of all campus alerts' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Reports</h1>
        <p className="text-slate-400">Generate and download campus analytics reports</p>
      </div>

      {/* Report Configuration */}
      <div className="glass-card">
        <h2 className="text-xl font-bold mb-4">Generate Report</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="input-field"
            >
              {reportTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-400 mt-2">
              {reportTypes.find((t) => t.value === reportType)?.description}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Date Range</label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="input-field"
                placeholder="From"
              />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="input-field"
                placeholder="To"
              />
            </div>
          </div>
        </div>

        <button onClick={generateReport} className="btn-primary w-full">
          <Download className="w-5 h-5 mr-2 inline" />
          Generate & Download Report
        </button>
      </div>

      {/* Available Reports */}
      <div>
        <h2 className="text-xl font-bold mb-4">Available Reports</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reportTypes.map((type, idx) => (
            <motion.div
              key={type.value}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="glass-card hover:border-cyan-400/30 transition-all cursor-pointer"
              onClick={() => setReportType(type.value)}
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-cyan-500/20 rounded-lg">
                  <FileText className="w-6 h-6 text-cyan-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">{type.label}</h3>
                  <p className="text-sm text-slate-400">{type.description}</p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      generateReport();
                    }}
                    className="mt-3 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    Download CSV →
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Recent Reports */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card"
      >
        <h2 className="text-xl font-bold mb-4">Recent Reports</h2>
        <div className="space-y-3">
          {[
            { name: 'Daily Campus Report', date: '2026-09-24', size: '45 KB' },
            { name: 'Weekly Resource Report', date: '2026-09-23', size: '128 KB' },
            { name: 'Occupancy Report', date: '2026-09-22', size: '89 KB' },
          ].map((report, idx) => (
            <div
              key={idx}
              className="glass-panel p-4 rounded-lg flex items-center justify-between hover:bg-white/10 transition-all"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="font-medium">{report.name}</p>
                  <p className="text-sm text-slate-400">
                    {report.date} • {report.size}
                  </p>
                </div>
              </div>
              <button className="btn-secondary text-sm">
                <Download className="w-4 h-4 mr-2 inline" />
                Download
              </button>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};
