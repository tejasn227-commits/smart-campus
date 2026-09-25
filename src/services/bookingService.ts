import {
  collection,
  doc,
getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { firestore } from '../firebase/config';
import type { Booking } from '../models';

const BOOKINGS_COLLECTION = 'bookings';

export const bookingService = {
  // Create a booking
  async createBooking(booking: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const bookingsRef = collection(firestore, BOOKINGS_COLLECTION);
    const docRef = await addDoc(bookingsRef, {
      ...booking,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  },

  // Get all bookings
  async getBookings(): Promise<Booking[]> {
    const bookingsRef = collection(firestore, BOOKINGS_COLLECTION);
    const snapshot = await getDocs(bookingsRef);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    } as Booking));
  },

  // Get bookings for a specific room
  async getRoomBookings(roomId: string): Promise<Booking[]> {
    const bookingsRef = collection(firestore, BOOKINGS_COLLECTION);
    const q = query(bookingsRef, where('roomId', '==', roomId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    } as Booking));
  },

  // Check room availability
  async checkAvailability(
    roomId: string,
    date: string,
    startTime: string,
    endTime: string
  ): Promise<boolean> {
    const bookingsRef = collection(firestore, BOOKINGS_COLLECTION);
    const q = query(bookingsRef, where('roomId', '==', roomId));
    const snapshot = await getDocs(q);

    // Check for time conflicts
    for (const doc of snapshot.docs) {
      const booking = doc.data();
      if (booking.date !== date || booking.status !== 'active') continue;
      if (this.hasTimeConflict(startTime, endTime, booking.startTime, booking.endTime)) {
        return false;
      }
    }
    return true;
  },

  // Helper: Check time conflict
  hasTimeConflict(start1: string, end1: string, start2: string, end2: string): boolean {
    return (start1 < end2 && end1 > start2);
  },

  // Update booking status
  async updateBookingStatus(bookingId: string, status: Booking['status']): Promise<void> {
    const bookingRef = doc(firestore, BOOKINGS_COLLECTION, bookingId);
    await updateDoc(bookingRef, {
      status,
      updatedAt: Timestamp.now(),
    });
  },

  async checkIn(bookingId: string): Promise<void> {
    const bookingRef = doc(firestore, BOOKINGS_COLLECTION, bookingId);
    await updateDoc(bookingRef, {
      checkedIn: true,
      checkedInAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  },

  async checkOut(bookingId: string): Promise<void> {
    const bookingRef = doc(firestore, BOOKINGS_COLLECTION, bookingId);
    await updateDoc(bookingRef, {
      checkedIn: false,
      checkedOutAt: Timestamp.now(),
      status: 'completed',
      updatedAt: Timestamp.now(),
    });
  },

  // Cancel booking
  async cancelBooking(bookingId: string): Promise<void> {
    await this.updateBookingStatus(bookingId, 'cancelled');
  },

  // Delete booking
  async deleteBooking(bookingId: string): Promise<void> {
    const bookingRef = doc(firestore, BOOKINGS_COLLECTION, bookingId);
    await deleteDoc(bookingRef);
  },

  // Subscribe to bookings
  subscribeToBookings(callback: (bookings: Booking[]) => void): () => void {
    const bookingsRef = collection(firestore, BOOKINGS_COLLECTION);
    return onSnapshot(bookingsRef, (snapshot) => {
      const bookings = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      } as Booking));
      callback(bookings);
    });
  },
};
