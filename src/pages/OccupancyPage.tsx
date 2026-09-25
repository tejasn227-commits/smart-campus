import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Camera, Video, StopCircle, Users, Activity } from 'lucide-react';
import { cameraService } from '../services/cameraService';
import { occupancyService } from '../services/occupancyService';
import { occupancyDetectorService } from '../services/occupancyDetectorService';
import { alertService } from '../services/alertService';
import { roomService } from '../services/roomService';
import type { Room, Occupancy } from '../models';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const OccupancyPage: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [peopleCount, setPeopleCount] = useState(0);
  const [confidence, setConfidence] = useState(0);
  const [occupancyHistory, setOccupancyHistory] = useState<Occupancy[]>([]);
  const [modelLoading, setModelLoading] = useState(false);
  const [detectorSource, setDetectorSource] = useState<'yolov8-bytetrack' | 'demo'>('demo');
  const [detectorMessage, setDetectorMessage] = useState('Start the YOLO backend to enable live occupancy.');
  const emptySinceRef = useRef<number | null>(null);
  const energyAlertCreatedRef = useRef(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const detectionIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    loadRooms();
    return () => {
      stopCamera();
    };
  }, []);

  useEffect(() => {
    if (selectedRoom) {
      loadOccupancyHistory(selectedRoom.id);
    }
  }, [selectedRoom]);

  const loadRooms = async () => {
    try {
      const roomsData = await roomService.getRooms();
      setRooms(roomsData);
      if (roomsData.length > 0) {
        setSelectedRoom(roomsData[0]);
      }
    } catch (error) {
      console.error('Error loading rooms:', error);
    }
  };

  const loadOccupancyHistory = async (roomId: string) => {
    try {
      const history = await occupancyService.getRoomOccupancyHistory(roomId, 50);
      setOccupancyHistory(history);
    } catch (error) {
      console.error('Error loading occupancy history:', error);
    }
  };

  const startCamera = async () => {
    try {
      setModelLoading(true);
      const stream = await cameraService.requestCameraPermission();

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      setCameraActive(true);
      setModelLoading(false);
    } catch (error) {
      console.error('Error starting camera:', error);
      alert('Camera access denied. Please allow camera access in your browser settings.');
      setModelLoading(false);
    }
  };

  const stopCamera = () => {
    cameraService.stopCamera();
    setCameraActive(false);
    setDetecting(false);

    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const startDetection = () => {
    if (!videoRef.current || !selectedRoom) return;

    setDetecting(true);

    // Send browser frames to the cloned YOLOv8/ByteTrack backend every 3 seconds.
    detectionIntervalRef.current = setInterval(async () => {
      if (videoRef.current) {
        try {
          const result = await occupancyDetectorService.detect(videoRef.current, selectedRoom.id, selectedRoom.capacity);
          setPeopleCount(result.count);
          setConfidence(result.confidence);
          setDetectorSource(result.source);
          setDetectorMessage('Live YOLOv8 + ByteTrack detection is connected.');

          if (result.source === 'yolov8-bytetrack' && result.count === 0 && (selectedRoom.energyConsumption || 0) > 0) {
            emptySinceRef.current ??= Date.now();
            if (!energyAlertCreatedRef.current && Date.now() - emptySinceRef.current >= 5 * 60 * 1000) {
              await alertService.createAlert({
                type: 'energy',
                severity: 'high',
                title: 'Possible Energy Waste',
                description: `${selectedRoom.name} (${selectedRoom.id}) has had no detected occupants for 5+ minutes while electricity usage is recorded.`,
                location: `Floor ${selectedRoom.floor}`,
                roomId: selectedRoom.id,
                status: 'new',
              });
              energyAlertCreatedRef.current = true;
            }
          } else if (result.count > 0) {
            emptySinceRef.current = null;
            energyAlertCreatedRef.current = false;
          }

          // Save to Firebase
          if (selectedRoom) {
            const occupancyPercentage = (result.count / selectedRoom.capacity) * 100;

            await occupancyService.recordOccupancy({
              roomId: selectedRoom.id,
              peopleCount: result.count,
              capacity: selectedRoom.capacity,
              occupancyPercentage,
              cameraSource: 'laptop-camera',
              detectionConfidence: result.confidence,
            });

            // Update room occupancy
            await roomService.updateRoomOccupancy(selectedRoom.id, result.count);

            // Refresh history
            loadOccupancyHistory(selectedRoom.id);
          }
        } catch (error) {
          console.warn('YOLO backend unavailable; demo mode remains explicit.', error);
          setDetectorSource('demo');
          setDetectorMessage('YOLO backend unavailable. Start backend/api.py for live detection.');
        }
      }
    }, 3000);
  };

  const stopDetection = () => {
    setDetecting(false);
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
  };

  const occupancyPercentage = selectedRoom
    ? (peopleCount / selectedRoom.capacity) * 100
    : 0;

  const getOccupancyStatus = (percentage: number) => {
    if (percentage === 0) return { label: 'EMPTY', color: 'text-slate-400' };
    if (percentage <= 25) return { label: 'LOW', color: 'text-blue-400' };
    if (percentage <= 50) return { label: 'MODERATE', color: 'text-cyan-400' };
    if (percentage <= 75) return { label: 'HIGH', color: 'text-amber-400' };
    return { label: 'FULL', color: 'text-red-400' };
  };

  const status = getOccupancyStatus(occupancyPercentage);

  // Prepare chart data
  const chartData = occupancyHistory
    .slice()
    .reverse()
    .map((item) => ({
      time: new Date(item.timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      }),
      count: item.peopleCount,
      percentage: item.occupancyPercentage,
    }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Occupancy Monitoring</h1>
        <p className="text-slate-400">Real-time classroom occupancy detection and tracking</p>
      </div>

      {/* Room Selection */}
      <div className="glass-card">
        <label className="block text-sm font-medium mb-2">Select Room</label>
        <select
          value={selectedRoom?.id || ''}
          onChange={(e) => {
            const room = rooms.find((r) => r.id === e.target.value);
            setSelectedRoom(room || null);
            setPeopleCount(0);
            setConfidence(0);
          }}
          className="input-field max-w-md"
        >
          {rooms.map((room) => (
            <option key={room.id} value={room.id}>
              {room.name} - {room.building} (Capacity: {room.capacity})
            </option>
          ))}
        </select>
      </div>

      {/* Live Detection */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Camera Feed */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Live Camera</h2>
            {cameraActive && <span className="badge-camera">LIVE CAMERA</span>}
          </div>

          <div className="relative bg-slate-900 rounded-lg overflow-hidden aspect-video mb-4">
            {!cameraActive ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <Camera className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400 mb-4">Camera not started</p>
                  <button
                    onClick={startCamera}
                    disabled={modelLoading}
                    className="btn-primary"
                  >
                    {modelLoading ? (
                      <>Loading AI Model...</>
                    ) : (
                      <>
                        <Video className="w-5 h-5 mr-2 inline" />
                        Start Browser Camera
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            )}

            {cameraActive && detecting && (
              <div className="absolute top-4 left-4 glass-panel px-3 py-2 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="status-online" />
                  <span className="text-sm font-medium text-emerald-400">DETECTING</span>
                </div>
              </div>
            )}
          </div>

          {cameraActive && (
            <div className="space-y-3">
              {!detecting ? (
                <button onClick={startDetection} className="btn-primary w-full">
                  <Activity className="w-5 h-5 mr-2 inline" />
                  Start People Detection
                </button>
              ) : (
                <button onClick={stopDetection} className="btn-secondary w-full">
                  <StopCircle className="w-5 h-5 mr-2 inline" />
                  Stop Detection
                </button>
              )}
              <button onClick={stopCamera} className="btn-secondary w-full">
                Stop Camera
              </button>
            </div>
          )}
        </motion.div>

        {/* Detection Results */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Detection Results</h2>
            {detecting && <span className={detectorSource === 'yolov8-bytetrack' ? 'badge-ai' : 'badge-camera'}>{detectorSource === 'yolov8-bytetrack' ? 'YOLOV8 + BYTETRACK' : 'DEMO MODE'}</span>}
          </div>

          {selectedRoom && (
            <div className="space-y-6">
              {/* People Count */}
              <div className="text-center glass-panel p-6 rounded-lg">
                <Users className="w-12 h-12 text-cyan-400 mx-auto mb-3" />
                <p className="text-sm text-slate-400 mb-2">People Detected</p>
                <p className="text-6xl font-bold mb-4">{peopleCount}</p>
                {confidence > 0 && (
                  <p className="text-sm text-slate-400">
                    Confidence: {(confidence * 100).toFixed(1)}%
                  </p>
                )}
                <p className="text-xs text-slate-500 mt-3">{detectorMessage}</p>
              </div>

              {/* Capacity Info */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-400">Room Capacity</span>
                  <span className="font-medium">{selectedRoom.capacity}</span>
                </div>
                <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(occupancyPercentage, 100)}%` }}
                    className={`h-full ${
                      occupancyPercentage > 75
                        ? 'bg-red-500'
                        : occupancyPercentage > 50
                        ? 'bg-amber-500'
                        : 'bg-cyan-500'
                    }`}
                  />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm text-slate-400">
                    {occupancyPercentage.toFixed(1)}% Occupied
                  </span>
                  <span className={`text-sm font-bold ${status.color}`}>
                    {status.label}
                  </span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="glass-panel p-4 rounded-lg">
                  <p className="text-xs text-slate-400 mb-1">Current</p>
                  <p className="text-2xl font-bold">{peopleCount}</p>
                </div>
                <div className="glass-panel p-4 rounded-lg">
                  <p className="text-xs text-slate-400 mb-1">Available</p>
                  <p className="text-2xl font-bold">
                    {Math.max(0, selectedRoom.capacity - peopleCount)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {!detecting && (
            <div className="text-center py-8 text-slate-400">
              <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Start detection to see results</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Occupancy History */}
      {occupancyHistory.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Occupancy History</h2>
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
                dataKey="count"
                stroke="#06b6d4"
                strokeWidth={2}
                dot={{ fill: '#06b6d4', r: 4 }}
                name="People Count"
              />
            </LineChart>
          </ResponsiveContainer>

          {/* Recent entries */}
          <div className="mt-6 space-y-2">
            <h3 className="text-sm font-medium text-slate-400">Recent Detections</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {occupancyHistory.slice(0, 6).map((item) => (
                <div key={item.id} className="glass-panel p-3 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{item.peopleCount} people</span>
                    <span className="text-xs text-slate-400">
                      {item.occupancyPercentage.toFixed(0)}%
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {new Date(item.timestamp).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
