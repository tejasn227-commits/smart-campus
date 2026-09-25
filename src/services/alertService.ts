import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  onSnapshot,
} from 'firebase/firestore';
import { firestore } from '../firebase/config';
import type { Alert } from '../models';

const ALERTS_COLLECTION = 'alerts';

export const alertService = {
  // Create an alert
  async createAlert(alert: Omit<Alert, 'id' | 'timestamp'>): Promise<string> {
    const alertsRef = collection(firestore, ALERTS_COLLECTION);
    const docRef = await addDoc(alertsRef, {
      ...alert,
      timestamp: Timestamp.now(),
      status: 'new',
    });
    return docRef.id;
  },

  // Get all alerts
  async getAlerts(limitCount = 100): Promise<Alert[]> {
    const alertsRef = collection(firestore, ALERTS_COLLECTION);
    const q = query(alertsRef, orderBy('timestamp', 'desc'), limit(limitCount));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate(),
      acknowledgedAt: doc.data().acknowledgedAt?.toDate(),
      resolvedAt: doc.data().resolvedAt?.toDate(),
    } as Alert));
  },

  // Get alerts by status
  async getAlertsByStatus(status: Alert['status']): Promise<Alert[]> {
    const alertsRef = collection(firestore, ALERTS_COLLECTION);
    const q = query(
      alertsRef,
      where('status', '==', status),
      orderBy('timestamp', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate(),
      acknowledgedAt: doc.data().acknowledgedAt?.toDate(),
      resolvedAt: doc.data().resolvedAt?.toDate(),
    } as Alert));
  },

  // Acknowledge alert
  async acknowledgeAlert(alertId: string, userId: string): Promise<void> {
    const alertRef = doc(firestore, ALERTS_COLLECTION, alertId);
    await updateDoc(alertRef, {
      status: 'acknowledged',
      acknowledgedBy: userId,
      acknowledgedAt: Timestamp.now(),
    });
  },

  // Resolve alert
  async resolveAlert(alertId: string, userId: string): Promise<void> {
    const alertRef = doc(firestore, ALERTS_COLLECTION, alertId);
    await updateDoc(alertRef, {
      status: 'resolved',
      resolvedBy: userId,
      resolvedAt: Timestamp.now(),
    });
  },

  async deleteAlert(alertId: string): Promise<void> {
    await deleteDoc(doc(firestore, ALERTS_COLLECTION, alertId));
  },

  // Subscribe to alerts
  subscribeToAlerts(callback: (alerts: Alert[]) => void): () => void {
    const alertsRef = collection(firestore, ALERTS_COLLECTION);
    const q = query(alertsRef, orderBy('timestamp', 'desc'), limit(50));
    return onSnapshot(q, (snapshot) => {
      const alerts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate(),
        acknowledgedAt: doc.data().acknowledgedAt?.toDate(),
        resolvedAt: doc.data().resolvedAt?.toDate(),
      } as Alert));
      callback(alerts);
    });
  },

  // Get new alerts count
  async getNewAlertsCount(): Promise<number> {
    const alertsRef = collection(firestore, ALERTS_COLLECTION);
    const q = query(alertsRef, where('status', '==', 'new'));
    const snapshot = await getDocs(q);
    return snapshot.size;
  },
};
