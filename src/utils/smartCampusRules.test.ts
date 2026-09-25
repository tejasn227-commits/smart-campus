import { describe, expect, it } from 'vitest';
import { getBookingReadinessMessage, shouldTriggerPowerAlert } from './smartCampusRules';

describe('smart campus rules', () => {
  it('triggers a power alert when a room is empty and lights remain on for more than 5 minutes', () => {
    const room = {
      id: 'room-201',
      name: 'A-201',
      building: 'Academic Block A',
      floor: 2,
      capacity: 42,
      type: 'classroom',
      equipment: ['Projector', 'AC'],
      status: 'occupied',
      currentOccupancy: 0,
      lightsOnMinutes: 6,
    } as any;

    expect(shouldTriggerPowerAlert(room)).toBe(true);
  });

  it('marks a vacant classroom as empty and ready for booking', () => {
    const room = {
      id: 'room-305',
      name: 'B-305',
      building: 'Business Tower',
      floor: 3,
      capacity: 30,
      type: 'classroom',
      equipment: ['Whiteboard'],
      status: 'available',
      currentOccupancy: 0,
      lightsOnMinutes: 2,
    } as any;

    const readiness = getBookingReadinessMessage(room);

    expect(readiness.status).toBe('empty');
    expect(readiness.message).toContain('empty');
  });
});
