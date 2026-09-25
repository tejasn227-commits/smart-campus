import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, addDoc, doc, updateDoc, Timestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyAuLmYChqTUN63UXk4zVikpLtmDfEWef4g',
  authDomain: 'college-structure.firebaseapp.com',
  projectId: 'college-structure',
  storageBucket: 'college-structure.firebasestorage.app',
  messagingSenderId: '935182796727',
  appId: '1:935182796727:web:9df94f9fac967fd7df8a32',
  measurementId: 'G-3VJ9Q12W73',
};

const db = getFirestore(initializeApp(firebaseConfig));
const guards = [
  { name: 'Arun Kumar', email: 'arun.guard@college-structure.com', password: 'guard123', phone: '+91 90000 10001', floors: [1, 2], status: 'on-duty' },
  { name: 'Meena Raj', email: 'meena.guard@college-structure.com', password: 'guard123', phone: '+91 90000 10002', floors: [2, 3], status: 'on-duty' },
  { name: 'David Joseph', email: 'david.guard@college-structure.com', password: 'guard123', phone: '+91 90000 10003', floors: [3, 4, 5], status: 'on-duty' },
];
const users = [
  { userId: 'admin-1', name: 'Campus Admin', email: 'campusadmin@gmail.com', password: 'admin123', role: 'admin' },
  { userId: 'security-1', name: 'Security Lead', email: 'campussecurity@gmail.com', password: 'secure123', role: 'security' },
];
const rooms = [
  { name: 'A-204', building: 'Building A', floor: 2, capacity: 50, type: 'classroom', equipment: ['Projector', 'Whiteboard', 'AC'], status: 'available', currentOccupancy: 0, hasCamera: true },
  { name: 'A-205', building: 'Building A', floor: 2, capacity: 40, type: 'classroom', equipment: ['Projector', 'Whiteboard', 'AC', 'Smart Board'], status: 'occupied', currentOccupancy: 35, hasCamera: true },
  { name: 'B-102', building: 'Building B', floor: 1, capacity: 30, type: 'laboratory', equipment: ['Computers', 'Projector', 'AC'], status: 'available', currentOccupancy: 0, hasCamera: true },
  { name: 'B-304', building: 'Building B', floor: 3, capacity: 60, type: 'classroom', equipment: ['Projector', 'Whiteboard', 'AC', 'Microphone'], status: 'booked', currentOccupancy: 0, hasCamera: false },
  { name: 'C-101', building: 'Building C', floor: 1, capacity: 100, type: 'lecture-hall', equipment: ['Projector', 'Microphone', 'AC', 'Smart Board'], status: 'available', currentOccupancy: 0, hasCamera: true },
  { name: 'C-201', building: 'Building C', floor: 2, capacity: 25, type: 'seminar-room', equipment: ['Whiteboard', 'AC'], status: 'maintenance', currentOccupancy: 0, hasCamera: false },
];

const guardsSnapshot = await getDocs(collection(db, 'guards'));
if (guardsSnapshot.empty) {
  for (const guard of guards) await addDoc(collection(db, 'guards'), guard);
  console.log('Seeded 3 demo guards.');
} else {
  for (const guard of guards) {
    const existingGuard = guardsSnapshot.docs.find((item) => item.data().email === guard.email);
    if (existingGuard) await updateDoc(doc(db, 'guards', existingGuard.id), guard);
  }
  console.log(`Skipped: guards already contains ${guardsSnapshot.size} document(s).`);
}

const roomsSnapshot = await getDocs(collection(db, 'rooms'));
const usersSnapshot = await getDocs(collection(db, 'users'));
if (usersSnapshot.empty) {
  for (const user of users) await addDoc(collection(db, 'users'), user);
  console.log(`Seeded ${users.length} demo users.`);
} else {
  console.log(`Skipped: users already contains ${usersSnapshot.size} document(s).`);
}

if (roomsSnapshot.empty) {
  for (const room of rooms) await addDoc(collection(db, 'rooms'), room);
  console.log(`Seeded ${rooms.length} rooms.`);
} else {
  console.log(`Skipped: rooms already contains ${roomsSnapshot.size} document(s).`);
}
for (const alert of [
  { type: 'energy', severity: 'high', title: 'Abnormal Energy Consumption', description: 'Building B is consuming 55% more electricity than yesterday.', location: 'Building B', buildingId: 'building-b', status: 'new' },
  { type: 'booking', severity: 'medium', title: 'Room Booked but Empty', description: 'Room B-304 is booked but has no detected occupancy.', location: 'B-304', roomId: 'b-304', status: 'new' },
  { type: 'water', severity: 'medium', title: 'High Water Usage', description: 'Building C water consumption is above the normal baseline.', location: 'Building C', buildingId: 'building-c', status: 'acknowledged' },
]) await addDoc(collection(db, 'alerts'), { ...alert, timestamp: Timestamp.fromDate(new Date()) });

const now = Date.now();
for (let index = 0; index < 24; index += 1) {
  const timestamp = Timestamp.fromDate(new Date(now - index * 3600000));
  await addDoc(collection(db, 'energy'), { buildingId: 'building-a', consumption: Math.round((Math.random() * 100 + 50) * 10) / 10, unit: 'kWh', type: 'electricity', timestamp });
  await addDoc(collection(db, 'water'), { buildingId: 'building-a', consumption: Math.round(Math.random() * 1000 + 500), unit: 'liters', timestamp });
}
console.log('Seeded college-structure with rooms, alerts, 24 energy records, and 24 water records.');
