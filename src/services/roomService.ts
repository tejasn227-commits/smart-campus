import { collection, doc, getDoc, getDocs, onSnapshot, query, updateDoc, where } from 'firebase/firestore';
import { firestore } from '../firebase/config';
import type { Room } from '../models';

const ROOM_COLLECTIONS = ['rooms', 'classrooms'] as const;

const toRoom = (roomDocument: { id: string; data: () => Record<string, unknown> }, sourceCollection: Room['sourceCollection']): Room => {
  const data = roomDocument.data();
  const rawStatus = String(data.status ?? 'available').toLowerCase();
  const status = ['available', 'occupied', 'booked', 'maintenance', 'unavailable'].includes(rawStatus) ? rawStatus : 'available';
  const rawType = String(data.type ?? 'classroom').toLowerCase().replaceAll(' ', '-');
  const type = ['classroom', 'laboratory', 'lecture-hall', 'seminar-room'].includes(rawType) ? rawType : 'classroom';

  return {
    ...data,
    id: roomDocument.id,
    name: String(data.name ?? data.room_name ?? data.roomName ?? data.classroomName ?? data.roomNumber ?? data.code ?? roomDocument.id),
    building: String(data.building ?? data.block ?? 'Campus'),
    floor: Number(data.floor ?? data.level ?? 0),
    capacity: Number(data.capacity ?? data.seats ?? data.maxCapacity ?? 0),
    type,
    equipment: Array.isArray(data.equipment) ? data.equipment.map(String) : [],
    status,
    sourceCollection,
  } as Room;
};

const roomKey = (room: Room): string => `${room.sourceCollection ?? 'rooms'}:${room.id}`;

export const roomService = {
  // Get all rooms
  async getRooms(): Promise<Room[]> {
    const snapshots = await Promise.all(ROOM_COLLECTIONS.map((sourceCollection) => getDocs(collection(firestore, sourceCollection))));
    return snapshots.flatMap((snapshot, index) => snapshot.docs.map((roomDocument) => toRoom(roomDocument, ROOM_COLLECTIONS[index])));
  },

  // Get room by ID
  async getRoom(roomId: string, sourceCollection: Room['sourceCollection'] = 'rooms'): Promise<Room | null> {
    const roomRef = doc(firestore, sourceCollection, roomId);
    const snapshot = await getDoc(roomRef);
    return snapshot.exists() ? toRoom(snapshot, sourceCollection) : null;
  },

  // Search rooms by criteria
  async searchRooms(criteria: {
    capacity?: number;
    type?: string;
    building?: string;
    equipment?: string[];
    status?: string;
  }): Promise<Room[]> {
    const snapshots = await Promise.all(ROOM_COLLECTIONS.map(async (sourceCollection) => {
      let q = query(collection(firestore, sourceCollection));

      if (criteria.type) q = query(q, where('type', '==', criteria.type));
      if (criteria.building) q = query(q, where('building', '==', criteria.building));
      if (criteria.status) q = query(q, where('status', '==', criteria.status));
      if (criteria.capacity) q = query(q, where('capacity', '>=', criteria.capacity));

      const snapshot = await getDocs(q);
      return snapshot.docs.map((roomDocument) => toRoom(roomDocument, sourceCollection));
    }));
    let rooms = snapshots.flat();

    // Filter by equipment if specified
    if (criteria.equipment && criteria.equipment.length > 0) {
      rooms = rooms.filter(room =>
        criteria.equipment!.every(eq => room.equipment?.includes(eq))
      );
    }

    return rooms;
  },

  // Update room status
  async updateRoomStatus(roomId: string, status: Room['status'], sourceCollection: Room['sourceCollection'] = 'rooms'): Promise<void> {
    const roomRef = doc(firestore, sourceCollection, roomId);
    await updateDoc(roomRef, { status });
  },

  // Update room occupancy
  async updateRoomOccupancy(roomId: string, occupancy: number, sourceCollection: Room['sourceCollection'] = 'rooms'): Promise<void> {
    const roomRef = doc(firestore, sourceCollection, roomId);
    await updateDoc(roomRef, { currentOccupancy: occupancy });
  },

  // Listen to room changes
  subscribeToRooms(callback: (rooms: Room[]) => void): () => void {
    const roomsBySource = new Map<string, Room>();
    const emitRooms = () => callback(Array.from(roomsBySource.values()));
    const unsubscribe = ROOM_COLLECTIONS.map((sourceCollection) => onSnapshot(collection(firestore, sourceCollection), (snapshot) => {
      for (const key of roomsBySource.keys()) {
        if (key.startsWith(`${sourceCollection}:`)) roomsBySource.delete(key);
      }
      snapshot.docs.forEach((roomDocument) => {
        const room = toRoom(roomDocument, sourceCollection);
        roomsBySource.set(roomKey(room), room);
      });
      emitRooms();
    }));

    return () => unsubscribe.forEach((stop) => stop());
  },

  // Listen to specific room
  subscribeToRoom(roomId: string, callback: (room: Room | null) => void, sourceCollection: Room['sourceCollection'] = 'rooms'): () => void {
    const roomRef = doc(firestore, sourceCollection, roomId);
    return onSnapshot(roomRef, (snapshot) => {
      const room = snapshot.exists() ? toRoom(snapshot, sourceCollection) : null;
      callback(room);
    });
  },
};
