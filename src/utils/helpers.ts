import type { Room } from '../models';

export const roomAllocationUtils = {
  // Calculate fit score for a room
  calculateFitScore(room: Room, requiredCapacity: number, requiredEquipment: string[]): number {
    let score = 100;

    // Capacity scoring (prefer smallest room that fits)
    const capacityDiff = room.capacity - requiredCapacity;
    if (capacityDiff < 0) {
      return 0; // Room too small
    }

    // Penalize large capacity differences
    const capacityPenalty = Math.min(capacityDiff * 2, 40);
    score -= capacityPenalty;

    // Equipment scoring
    const missingEquipment = requiredEquipment.filter(eq => !room.equipment.includes(eq));
    score -= missingEquipment.length * 15;

    // Status bonus
    if (room.status === 'available') {
      score += 10;
    }

    return Math.max(0, score);
  },

  // Rank rooms by fit
  rankRooms(rooms: Room[], requiredCapacity: number, requiredEquipment: string[]): Room[] {
    return rooms
      .map(room => ({
        room,
        score: this.calculateFitScore(room, requiredCapacity, requiredEquipment),
      }))
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(item => item.room);
  },

  // Get allocation recommendation
  getRecommendation(room: Room, requiredCapacity: number, requiredEquipment: string[]): string {
    const reasons: string[] = [];

    const capacityDiff = room.capacity - requiredCapacity;
    if (capacityDiff <= 10) {
      reasons.push('Optimal capacity match');
    } else if (capacityDiff <= 20) {
      reasons.push('Good capacity match');
    }

    const hasAllEquipment = requiredEquipment.every(eq => room.equipment.includes(eq));
    if (hasAllEquipment && requiredEquipment.length > 0) {
      reasons.push('All required equipment available');
    }

    if (room.status === 'available') {
      reasons.push('Currently available');
    }

    return reasons.join(' • ');
  },
};

export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatTime = (time: string): string => {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
};

export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const calculateOccupancyPercentage = (current: number, capacity: number): number => {
  return Math.round((current / capacity) * 100);
};

export const getOccupancyStatus = (percentage: number): string => {
  if (percentage === 0) return 'EMPTY';
  if (percentage <= 25) return 'LOW';
  if (percentage <= 50) return 'MODERATE';
  if (percentage <= 75) return 'HIGH';
  return 'FULL';
};

export const downloadCSV = (data: any[], filename: string): void => {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header => {
        const value = row[header];
        return typeof value === 'string' && value.includes(',')
          ? `"${value}"`
          : value;
      }).join(',')
    ),
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};
