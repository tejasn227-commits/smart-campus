// Room model
export interface Room {
  id: string;
  name: string;
  building: string;
  floor: number;
  capacity: number;
  type: 'classroom' | 'laboratory' | 'lecture-hall' | 'seminar-room';
  equipment: string[];
  status: 'available' | 'occupied' | 'booked' | 'maintenance' | 'unavailable';
  currentOccupancy?: number;
  lightsOnMinutes?: number;
  energyConsumption?: number;
  hasCamera?: boolean;
  cameraId?: string;
  sourceCollection?: 'rooms' | 'classrooms';
}

// Booking model
export interface Booking {
  id: string;
  roomId: string;
  roomName: string;
  course: string;
  instructor?: string;
  date: string;
  startTime: string;
  endTime: string;
  numberOfStudents: number;
  status: 'active' | 'cancelled' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

// Occupancy model
export interface Occupancy {
  id: string;
  roomId: string;
  timestamp: Date;
  peopleCount: number;
  capacity: number;
  occupancyPercentage: number;
  cameraSource: string;
  detectionConfidence?: number;
}

// Energy model
export interface Energy {
  id: string;
  buildingId?: string;
  roomId?: string;
  timestamp: Date;
  consumption: number; // kWh
  unit: 'kWh';
  type: 'electricity';
}

// Water model
export interface Water {
  id: string;
  buildingId?: string;
  timestamp: Date;
  consumption: number; // Liters
  unit: 'liters';
}

// Alert model
export interface Alert {
  id: string;
  type: 'energy' | 'water' | 'occupancy' | 'booking' | 'camera' | 'maintenance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  location?: string;
  roomId?: string;
  buildingId?: string;
  assignedGuardId?: string;
  assignedGuardName?: string;
  assignedGuardEmail?: string;
  assignedGuardIds?: string[];
  assignedGuardNames?: string[];
  assignedGuardEmails?: string[];
  timestamp: Date;
  status: 'new' | 'acknowledged' | 'resolved';
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolvedBy?: string;
  resolvedAt?: Date;
}

export interface Guard {
  id: string;
  name: string;
  email: string;
  password?: string;
  phone: string;
  floors: number[];
  status: 'on-duty' | 'off-duty';
}

// Prediction model
export interface Prediction {
  id: string;
  type: 'energy' | 'water' | 'occupancy' | 'demand';
  targetDate: string;
  targetTime?: string;
  predictedValue: number;
  unit: string;
  confidence: number;
  createdAt: Date;
  method: 'historical-average' | 'random-forest' | 'neural-network';
}

// Building model
export interface Building {
  id: string;
  name: string;
  totalRooms: number;
  totalCapacity: number;
  currentOccupancy: number;
  energyConsumption: number;
  waterConsumption: number;
}

// Camera model
export interface Camera {
  id: string;
  name: string;
  roomId: string;
  status: 'online' | 'offline';
  type: 'laptop' | 'ip-camera' | 'usb' | 'rtsp';
  url?: string;
  lastUpdate?: Date;
}

// User model
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'security' | 'viewer';
  createdAt: Date;
}

// Recommendation model
export interface Recommendation {
  id: string;
  type: 'energy' | 'water' | 'room' | 'booking';
  priority: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  actionable: boolean;
  relatedId?: string;
  createdAt: Date;
}
