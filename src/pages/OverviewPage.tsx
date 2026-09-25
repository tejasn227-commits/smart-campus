import React, { useState, useEffect } from 'react';
import { KpiCard } from '../components/KpiCard';
import { RoomCard } from '../components/RoomCard';
import { Zap, Droplet, Bell, DoorOpen, Users, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { roomService } from '../services/roomService';
import { alertService } from '../services/alertService';
import { energyService } from '../services/energyService';
import { waterService } from '../services/waterService';
import type { Room, Alert } from '../models';

export const OverviewPage: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [totalEnergy, setTotalEnergy] = useState(0);
  const [totalWater, setTotalWater] = useState(0);

  useEffect(() => {
    loadDashboardData();

    // Subscribe to real-time updates
    const unsubscribeRooms = roomService.subscribeToRooms((updatedRooms) => {
      setRooms(updatedRooms);
    });

    const unsubscribeAlerts = alertService.subscribeToAlerts((updatedAlerts) => {
      setAlerts(updatedAlerts);
    });

    return () => {
      unsubscribeRooms();
      unsubscribeAlerts();
    };
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load rooms
      const roomsData = await roomService.getRooms();
      setRooms(roomsData);

      // Load alerts
      const alertsData = await alertService.getAlerts(10);
      setAlerts(alertsData);

      // Load energy data
      const energyData = await energyService.getAllEnergy(100);
      const energyTotal = energyService.calculateTotal(energyData);
      setTotalEnergy(energyTotal);

      // Load water data
      const waterData = await waterService.getAllWater(100);
      const waterTotal = waterService.calculateTotal(waterData);
      setTotalWater(waterTotal);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const availableRooms = rooms.filter((r) => r.status === 'available');
  const occupiedRooms = rooms.filter((r) => r.status === 'occupied');
  const bookedRooms = rooms.filter((r) => r.status === 'booked');
  const newAlerts = alerts.filter((a) => a.status === 'new');

  const totalOccupancy = rooms.reduce((sum, r) => sum + (r.currentOccupancy || 0), 0);
  const totalCapacity = rooms.reduce((sum, r) => sum + r.capacity, 0);
  const occupancyPercentage = totalCapacity > 0 ? (totalOccupancy / totalCapacity) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Campus Overview</h1>
        <p className="text-slate-400">Real-time campus resource monitoring and analytics</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <KpiCard
          title="Electricity Consumption"
          value={totalEnergy.toFixed(0)}
          unit="kWh"
          change={-8.4}
          trend="down"
          icon={<Zap className="w-6 h-6 text-amber-400" />}
          source="live-firebase"
        />
        <KpiCard
          title="Water Consumption"
          value={totalWater.toFixed(0)}
          unit="L"
          change={-5.2}
          trend="down"
          icon={<Droplet className="w-6 h-6 text-blue-400" />}
          source="live-firebase"
        />
        <KpiCard
          title="Active Alerts"
          value={newAlerts.length}
          unit=""
          icon={<Bell className="w-6 h-6 text-red-400" />}
          source="live-firebase"
        />
        <KpiCard
          title="Available Rooms"
          value={availableRooms.length}
          unit={`/ ${rooms.length}`}
          icon={<DoorOpen className="w-6 h-6 text-emerald-400" />}
          source="live-firebase"
        />
        <KpiCard
          title="Occupied Classrooms"
          value={occupiedRooms.length}
          unit=""
          icon={<Users className="w-6 h-6 text-purple-400" />}
          source="live-firebase"
        />
        <KpiCard
          title="Booked Rooms"
          value={bookedRooms.length}
          unit=""
          icon={<Activity className="w-6 h-6 text-cyan-400" />}
          source="live-firebase"
        />
        <KpiCard
          title="Campus Occupancy"
          value={occupancyPercentage.toFixed(1)}
          unit="%"
          icon={<Users className="w-6 h-6 text-indigo-400" />}
          source="live-firebase"
        />
        <KpiCard
          title="Total Capacity"
          value={totalCapacity}
          unit="seats"
          icon={<DoorOpen className="w-6 h-6 text-slate-400" />}
          source="live-firebase"
        />
      </div>

      {/* Campus Status Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Available Rooms */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Available Rooms</h3>
            <span className="badge-live">LIVE</span>
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {availableRooms.length === 0 ? (
              <p className="text-center text-slate-400 py-8">No available rooms</p>
            ) : (
              availableRooms.slice(0, 5).map((room) => (
                <div
                  key={room.id}
                  className="p-3 bg-emerald-500/10 border border-emerald-400/30 rounded-lg"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{room.name}</p>
                      <p className="text-sm text-slate-400">{room.building}</p>
                    </div>
                    <span className="text-sm text-emerald-400">
                      {room.capacity} seats
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* Occupied Rooms */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Occupied Rooms</h3>
            <span className="badge-live">LIVE</span>
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {occupiedRooms.length === 0 ? (
              <p className="text-center text-slate-400 py-8">No occupied rooms</p>
            ) : (
              occupiedRooms.slice(0, 5).map((room) => (
                <div
                  key={room.id}
                  className="p-3 bg-blue-500/10 border border-blue-400/30 rounded-lg"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{room.name}</p>
                      <p className="text-sm text-slate-400">{room.building}</p>
                    </div>
                    <span className="text-sm text-blue-400">
                      {room.currentOccupancy || 0}/{room.capacity}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* Recent Alerts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Recent Alerts</h3>
            <span className="badge-live">LIVE</span>
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {newAlerts.length === 0 ? (
              <p className="text-center text-slate-400 py-8">
                No active alerts
              </p>
            ) : (
              newAlerts.slice(0, 5).map((alert) => (
                <div
                  key={alert.id}
                  className="p-3 bg-red-500/10 border border-red-400/30 rounded-lg"
                >
                  <p className="font-medium text-sm mb-1">{alert.title}</p>
                  <p className="text-xs text-slate-400 mb-2">
                    {alert.description}
                  </p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-red-400 capitalize">
                      {alert.severity}
                    </span>
                    <span className="text-slate-500">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>

      {/* Room Cards */}
      {rooms.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">All Rooms</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {rooms.slice(0, 8).map((room) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
