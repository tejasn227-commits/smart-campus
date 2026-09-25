import type { Room } from '../models';

export type BookingReadiness = {
  status: 'empty' | 'occupied';
  message: string;
};

export const shouldTriggerPowerAlert = (
  room: Pick<Room, 'currentOccupancy' | 'status' | 'lightsOnMinutes' | 'building' | 'floor' | 'name'>
): boolean => {
  const occupancy = room.currentOccupancy ?? 0;
  const lightsOnMinutes = room.lightsOnMinutes ?? 0;

  if (occupancy !== 0) {
    return false;
  }

  if (room.status === 'maintenance') {
    return false;
  }

  return lightsOnMinutes >= 5;
};

export const getBookingReadinessMessage = (
  room: Pick<Room, 'name' | 'building' | 'floor' | 'capacity' | 'currentOccupancy'>
): BookingReadiness => {
  const occupancy = room.currentOccupancy ?? 0;

  if (occupancy === 0) {
    return {
      status: 'empty',
      message: `Classroom ${room.name} appears empty on ${room.building} Floor ${room.floor}. This room is ready for booking.`,
    };
  }

  return {
    status: 'occupied',
    message: `Classroom ${room.name} is currently occupied (${occupancy}/${room.capacity}). Please wait until the class clears before booking.`,
  };
};
