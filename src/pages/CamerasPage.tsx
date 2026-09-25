import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, Video, Wifi, WifiOff, Plus, Settings as SettingsIcon } from 'lucide-react';

interface CameraConfig {
  id: string;
  name: string;
  roomId: string;
  roomName: string;
  type: 'laptop' | 'ip-camera' | 'rtsp';
  url?: string;
  status: 'online' | 'offline';
}

export const CamerasPage: React.FC = () => {
  const [cameras, setCameras] = useState<CameraConfig[]>([
    {
      id: '1',
      name: 'Laptop Camera',
      roomId: 'demo',
      roomName: 'Testing',
      type: 'laptop',
      status: 'online',
    },
  ]);

  const [showAddCamera, setShowAddCamera] = useState(false);
  const [newCamera, setNewCamera] = useState({
    name: '',
    roomId: '',
    roomName: '',
    type: 'ip-camera' as const,
    url: '',
  });

  const handleAddCamera = () => {
    const camera: CameraConfig = {
      id: Date.now().toString(),
      ...newCamera,
      status: 'offline',
    };
    setCameras([...cameras, camera]);
    setShowAddCamera(false);
    setNewCamera({
      name: '',
      roomId: '',
      roomName: '',
      type: 'ip-camera',
      url: '',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Camera Management</h1>
          <p className="text-slate-400">Configure and monitor classroom cameras</p>
        </div>
        <button
          onClick={() => setShowAddCamera(!showAddCamera)}
          className="btn-primary"
        >
          <Plus className="w-5 h-5 mr-2 inline" />
          Add Camera
        </button>
      </div>

      {/* Add Camera Form */}
      {showAddCamera && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="glass-card"
        >
          <h2 className="text-xl font-bold mb-4">Add New Camera</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Camera Name</label>
              <input
                type="text"
                value={newCamera.name}
                onChange={(e) => setNewCamera({ ...newCamera, name: e.target.value })}
                className="input-field"
                placeholder="e.g., Classroom A-204 Camera"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Room Number</label>
              <input
                type="text"
                value={newCamera.roomId}
                onChange={(e) => setNewCamera({ ...newCamera, roomId: e.target.value })}
                className="input-field"
                placeholder="e.g., A-204"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Room Name</label>
              <input
                type="text"
                value={newCamera.roomName}
                onChange={(e) => setNewCamera({ ...newCamera, roomName: e.target.value })}
                className="input-field"
                placeholder="e.g., Computer Lab 1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Camera Type</label>
              <select
                value={newCamera.type}
                onChange={(e) => setNewCamera({ ...newCamera, type: e.target.value as any })}
                className="input-field"
              >
                <option value="ip-camera">IP Camera</option>
                <option value="rtsp">RTSP Stream</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">Stream URL / API Endpoint</label>
              <input
                type="text"
                value={newCamera.url}
                onChange={(e) => setNewCamera({ ...newCamera, url: e.target.value })}
                className="input-field"
                placeholder="e.g., rtsp://192.168.1.100:554/stream or http://camera-api/stream"
              />
              <p className="text-xs text-slate-400 mt-2">
                Note: RTSP streams require backend processing. Configure the backend API endpoint instead.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={handleAddCamera} className="btn-primary">
              Add Camera
            </button>
            <button onClick={() => setShowAddCamera(false)} className="btn-secondary">
              Cancel
            </button>
          </div>
        </motion.div>
      )}

      {/* Camera Grid */}
      <div>
        <h2 className="text-xl font-bold mb-4">Registered Cameras ({cameras.length})</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cameras.map((camera) => (
            <motion.div
              key={camera.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-lg ${
                    camera.status === 'online'
                      ? 'bg-emerald-500/20 border border-emerald-400/30'
                      : 'bg-slate-500/20 border border-slate-400/30'
                  }`}>
                    <Camera className={`w-6 h-6 ${
                      camera.status === 'online' ? 'text-emerald-400' : 'text-slate-400'
                    }`} />
                  </div>
                  <div>
                    <h3 className="font-semibold">{camera.name}</h3>
                    <p className="text-sm text-slate-400">{camera.roomName}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Room ID</span>
                  <span className="font-medium">{camera.roomId}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Type</span>
                  <span className="font-medium capitalize">{camera.type.replace('-', ' ')}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Status</span>
                  <div className="flex items-center gap-2">
                    {camera.status === 'online' ? (
                      <>
                        <Wifi className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-400 font-medium">Online</span>
                      </>
                    ) : (
                      <>
                        <WifiOff className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-400 font-medium">Offline</span>
                      </>
                    )}
                  </div>
                </div>

                {camera.url && (
                  <div className="pt-3 border-t border-white/10">
                    <p className="text-xs text-slate-400 mb-1">Stream URL</p>
                    <p className="text-xs font-mono text-slate-300 truncate">{camera.url}</p>
                  </div>
                )}

                <div className="flex gap-2 pt-3 border-t border-white/10">
                  {camera.type === 'laptop' ? (
                    <button className="btn-primary text-sm flex-1">
                      <Video className="w-4 h-4 mr-2 inline" />
                      Test Camera
                    </button>
                  ) : (
                    <button className="btn-secondary text-sm flex-1">
                      <SettingsIcon className="w-4 h-4 mr-2 inline" />
                      Configure
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Info Box */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card bg-cyan-500/10 border border-cyan-400/30"
      >
        <div className="flex items-start gap-4">
          <Camera className="w-6 h-6 text-cyan-400 mt-1" />
          <div>
            <h3 className="font-semibold text-cyan-400 mb-2">Camera Integration Notes</h3>
            <ul className="text-sm text-slate-300 space-y-1">
              <li>• <strong>Laptop Camera:</strong> Uses browser webcam via getUserMedia() for testing</li>
              <li>• <strong>IP Camera:</strong> Configure camera API endpoint for backend processing</li>
              <li>• <strong>RTSP Streams:</strong> Require backend server to convert streams to browser-compatible format</li>
              <li>• RTSP/CCTV streams cannot be displayed directly in browsers due to protocol limitations</li>
              <li>• Backend should handle stream conversion and people detection before sending to frontend</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
