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
import type { Water } from '../models';

const WATER_COLLECTION = 'water';

export const waterService = {
  // Record water consumption
  async recordWater(data: Omit<Water, 'id' | 'timestamp'>): Promise<string> {
    const waterRef = collection(firestore, WATER_COLLECTION);
    const docRef = await addDoc(waterRef, {
      ...data,
      timestamp: Timestamp.now(),
    });
    return docRef.id;
  },

  // Get water data for a building
  async getBuildingWater(buildingId: string, limitCount = 100): Promise<Water[]> {
    const waterRef = collection(firestore, WATER_COLLECTION);
    const q = query(
      waterRef,
      where('buildingId', '==', buildingId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate(),
    } as Water));
  },

  // Get all water data
  async getAllWater(limitCount = 500): Promise<Water[]> {
    const waterRef = collection(firestore, WATER_COLLECTION);
    const q = query(waterRef, orderBy('timestamp', 'desc'), limit(limitCount));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate(),
    } as Water));
  },

  // Calculate total consumption
  calculateTotal(waterData: Water[]): number {
    return waterData.reduce((sum, item) => sum + item.consumption, 0);
  },

  // Calculate average consumption
  calculateAverage(waterData: Water[]): number {
    if (waterData.length === 0) return 0;
    return this.calculateTotal(waterData) / waterData.length;
  },

  // Subscribe to water updates
  subscribeToWater(callback: (water: Water[]) => void, limitCount = 100): () => void {
    const waterRef = collection(firestore, WATER_COLLECTION);
    const q = query(waterRef, orderBy('timestamp', 'desc'), limit(limitCount));
    return onSnapshot(q, (snapshot) => {
      const water = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate(),
      } as Water));
      callback(water);
    });
  },
};
