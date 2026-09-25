import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  onSnapshot,
} from 'firebase/firestore';
import { firestore } from '../firebase/config';
import type { Energy } from '../models';

const ENERGY_COLLECTION = 'energy';

export const energyService = {
  // Record energy consumption
  async recordEnergy(data: Omit<Energy, 'id' | 'timestamp'>): Promise<string> {
    const energyRef = collection(firestore, ENERGY_COLLECTION);
    const docRef = await addDoc(energyRef, {
      ...data,
      timestamp: Timestamp.now(),
    });
    return docRef.id;
  },

  // Get energy data for a building
  async getBuildingEnergy(buildingId: string, limitCount = 100): Promise<Energy[]> {
    const energyRef = collection(firestore, ENERGY_COLLECTION);
    const q = query(
      energyRef,
      where('buildingId', '==', buildingId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate(),
    } as Energy));
  },

  // Get energy data for a room
  async getRoomEnergy(roomId: string, limitCount = 100): Promise<Energy[]> {
    const energyRef = collection(firestore, ENERGY_COLLECTION);
    const q = query(
      energyRef,
      where('roomId', '==', roomId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate(),
    } as Energy));
  },

  // Get all energy data
  async getAllEnergy(limitCount = 500): Promise<Energy[]> {
    const energyRef = collection(firestore, ENERGY_COLLECTION);
    const q = query(energyRef, orderBy('timestamp', 'desc'), limit(limitCount));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate(),
    } as Energy));
  },

  // Calculate total consumption
  calculateTotal(energyData: Energy[]): number {
    return energyData.reduce((sum, item) => sum + item.consumption, 0);
  },

  // Calculate average consumption
  calculateAverage(energyData: Energy[]): number {
    if (energyData.length === 0) return 0;
    return this.calculateTotal(energyData) / energyData.length;
  },

  // Subscribe to energy updates
  subscribeToEnergy(callback: (energy: Energy[]) => void, limitCount = 100): () => void {
    const energyRef = collection(firestore, ENERGY_COLLECTION);
    const q = query(energyRef, orderBy('timestamp', 'desc'), limit(limitCount));
    return onSnapshot(q, (snapshot) => {
      const energy = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate(),
      } as Energy));
      callback(energy);
    });
  },
};
