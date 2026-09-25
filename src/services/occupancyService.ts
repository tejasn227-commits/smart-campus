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
import type { Occupancy } from '../models';

const OCCUPANCY_COLLECTION = 'occupancy';

export const occupancyService = {
  // Record occupancy data
  async recordOccupancy(data: Omit<Occupancy, 'id' | 'timestamp'>): Promise<string> {
    const occupancyRef = collection(firestore, OCCUPANCY_COLLECTION);
    const docRef = await addDoc(occupancyRef, {
      ...data,
      timestamp: Timestamp.now(),
    });
    return docRef.id;
  },

  // Get occupancy history for a room
  async getRoomOccupancyHistory(roomId: string, limitCount = 100): Promise<Occupancy[]> {
    const occupancyRef = collection(firestore, OCCUPANCY_COLLECTION);
    const q = query(
      occupancyRef,
      where('roomId', '==', roomId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate(),
    } as Occupancy));
  },

  // Get latest occupancy for a room
  async getLatestOccupancy(roomId: string): Promise<Occupancy | null> {
    const occupancyRef = collection(firestore, OCCUPANCY_COLLECTION);
    const q = query(
      occupancyRef,
      where('roomId', '==', roomId),
      orderBy('timestamp', 'desc'),
      limit(1)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate(),
    } as Occupancy;
  },

  // Subscribe to room occupancy updates
  subscribeToRoomOccupancy(roomId: string, callback: (occupancy: Occupancy | null) => void): () => void {
    const occupancyRef = collection(firestore, OCCUPANCY_COLLECTION);
    const q = query(
      occupancyRef,
      where('roomId', '==', roomId),
      orderBy('timestamp', 'desc'),
      limit(1)
    );
    return onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        callback(null);
        return;
      }
      const doc = snapshot.docs[0];
      callback({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate(),
      } as Occupancy);
    });
  },

  // Get all current occupancies
  async getAllCurrentOccupancy(): Promise<Map<string, Occupancy>> {
    const occupancyRef = collection(firestore, OCCUPANCY_COLLECTION);
    const snapshot = await getDocs(occupancyRef);

    const occupancyMap = new Map<string, Occupancy>();
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const occupancy: Occupancy = {
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toDate(),
      } as Occupancy;

      const existing = occupancyMap.get(occupancy.roomId);
      if (!existing || occupancy.timestamp > existing.timestamp) {
        occupancyMap.set(occupancy.roomId, occupancy);
      }
    });

    return occupancyMap;
  },
};
