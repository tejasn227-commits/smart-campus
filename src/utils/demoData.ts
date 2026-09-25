import { collection, addDoc, getDocs } from 'firebase/firestore';
import { firestore } from '../firebase/config';

export const initializeDemoData = async () => {
  try {
    // Check if data already exists
    const roomsSnapshot = await getDocs(collection(firestore, 'rooms'));
    if (!roomsSnapshot.empty) {
      console.log('Demo data already exists');
      return;
    }

    console.log('Initializing demo data...');

    // Demo rooms
    const rooms = [
      {
        name: 'A-204',
        building: 'Building A',
        floor: 2,
        capacity: 50,
        type: 'classroom',
        equipment: ['Projector', 'Whiteboard', 'AC'],
        status: 'available',
        currentOccupancy: 0,
        hasCamera: true,
      },
      {
        name: 'A-205',
        building: 'Building A',
        floor: 2,
        capacity: 40,
        type: 'classroom',
        equipment: ['Projector', 'Whiteboard', 'AC', 'Smart Board'],
        status: 'occupied',
        currentOccupancy: 35,
        hasCamera: true,
      },
      {
        name: 'B-102',
        building: 'Building B',
        floor: 1,
        capacity: 30,
        type: 'laboratory',
        equipment: ['Computers', 'Projector', 'AC'],
        status: 'available',
        currentOccupancy: 0,
        hasCamera: true,
      },
      {
        name: 'B-304',
        building: 'Building B',
        floor: 3,
        capacity: 60,
        type: 'classroom',
        equipment: ['Projector', 'Whiteboard', 'AC', 'Microphone'],
        status: 'booked',
        currentOccupancy: 0,
        hasCamera: false,
      },
      {
        name: 'C-101',
        building: 'Building C',
        floor: 1,
        capacity: 100,
        type: 'lecture-hall',
        equipment: ['Projector', 'Microphone', 'AC', 'Smart Board'],
        status: 'available',
        currentOccupancy: 0,
        hasCamera: true,
      },
      {
        name: 'C-201',
        building: 'Building C',
        floor: 2,
        capacity: 25,
        type: 'seminar-room',
        equipment: ['Whiteboard', 'AC'],
        status: 'maintenance',
        currentOccupancy: 0,
        hasCamera: false,
      },
    ];

    const roomsCollection = collection(firestore, 'rooms');
    for (const room of rooms) {
      await addDoc(roomsCollection, room);
    }
    console.log('Rooms added');

    // Demo alerts
    const alerts = [
      {
        type: 'energy',
        severity: 'high',
        title: 'Abnormal Energy Consumption',
        description: 'Building B is consuming 55% more electricity than expected baseline.',
        location: 'Building B',
        buildingId: 'building-b',
        timestamp: new Date(),
        status: 'new',
      },
      {
        type: 'booking',
        severity: 'medium',
        title: 'Room Booked but Empty',
        description: 'Room B-304 has been booked but shows no occupancy for 10 minutes.',
        location: 'B-304',
        roomId: 'b-304',
        timestamp: new Date(Date.now() - 600000),
        status: 'new',
      },
      {
        type: 'water',
        severity: 'medium',
        title: 'High Water Usage',
        description: 'Building C water consumption is 40% above normal levels.',
        location: 'Building C',
        buildingId: 'building-c',
        timestamp: new Date(Date.now() - 1800000),
        status: 'acknowledged',
      },
    ];

    const alertsCollection = collection(firestore, 'alerts');
    for (const alert of alerts) {
      await addDoc(alertsCollection, alert);
    }
    console.log('Alerts added');

    // Demo energy data
    const energyCollection = collection(firestore, 'energy');
    const now = Date.now();
    for (let i = 0; i < 24; i++) {
      await addDoc(energyCollection, {
        buildingId: 'building-a',
        consumption: Math.random() * 100 + 50,
        unit: 'kWh',
        type: 'electricity',
        timestamp: new Date(now - i * 3600000),
      });
    }
    console.log('Energy data added');

    // Demo water data
    const waterCollection = collection(firestore, 'water');
    for (let i = 0; i < 24; i++) {
      await addDoc(waterCollection, {
        buildingId: 'building-a',
        consumption: Math.random() * 1000 + 500,
        unit: 'liters',
        timestamp: new Date(now - i * 3600000),
      });
    }
    console.log('Water data added');

    console.log('Demo data initialization complete!');
  } catch (error) {
    console.error('Error initializing demo data:', error);
  }
};
