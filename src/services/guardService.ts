import { collection, getDocs, onSnapshot, orderBy, query } from 'firebase/firestore';
import { firestore } from '../firebase/config';
import type { Guard } from '../models';

const GUARDS_COLLECTION = 'guards';

const normalizeGuard = (id: string, data: Record<string, unknown>): Guard => ({
  id,
  name: String(data.name || 'Campus guard'),
  email: String(data.email || ''),
  password: typeof data.password === 'string' ? data.password : undefined,
  phone: String(data.phone || ''),
  floors: Array.isArray(data.floors) ? data.floors.map(Number).filter(Number.isFinite) : [],
  status: data.status === 'off-duty' ? 'off-duty' : 'on-duty',
});

export const guardService = {
  async getGuards(): Promise<Guard[]> {
    const snapshot = await getDocs(query(collection(firestore, GUARDS_COLLECTION), orderBy('name')));
    return snapshot.docs.map((guard) => normalizeGuard(guard.id, guard.data()));
  },

  subscribeToGuards(callback: (guards: Guard[]) => void): () => void {
    const guardsQuery = query(collection(firestore, GUARDS_COLLECTION), orderBy('name'));
    return onSnapshot(guardsQuery, (snapshot) => {
      callback(snapshot.docs.map((guard) => normalizeGuard(guard.id, guard.data())));
    });
  },
};
