import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, CheckCircle, LogIn, LogOut } from 'lucide-react';
import { roomService } from '../services/roomService';
import { bookingService } from '../services/bookingService';
import type { Room } from '../models';
import { RoomCard } from '../components/RoomCard';
import { roomAllocationUtils } from '../utils/helpers';
import { getBookingReadinessMessage } from '../utils/smartCampusRules';

export const SmartRoomsPage: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [, setLoading] = useState(true);
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);
  const [showAllocation, setShowAllocation] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  // Search filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterBuilding, setFilterBuilding] = useState<string>('all');

  // Allocation form
  const [allocationForm, setAllocationForm] = useState({
    course: '',
    date: '',
    startTime: '',
    endTime: '',
    numberOfStudents: '',
    roomType: 'classroom',
    equipment: [] as string[],
    building: '',
  });

  const [rankedRooms, setRankedRooms] = useState<Room[]>([]);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [checkedIn, setCheckedIn] = useState(false);

  const equipmentOptions = ['Projector', 'Whiteboard', 'AC', 'Computers', 'Smart Board', 'Microphone'];

  useEffect(() => {
    loadRooms();

    const unsubscribe = roomService.subscribeToRooms((updatedRooms) => {
      setRooms(updatedRooms);
      applyFilters(updatedRooms);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    applyFilters(rooms);
  }, [searchQuery, filterType, filterStatus, filterBuilding]);

  const loadRooms = async () => {
    try {
      setLoading(true);
      const roomsData = await roomService.getRooms();
      setRooms(roomsData);
      applyFilters(roomsData);
    } catch (error) {
      console.error('Error loading rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (roomsList: Room[]) => {
    let filtered = [...roomsList];

    if (searchQuery) {
      filtered = filtered.filter(
        (r) =>
          r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.building.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterType !== 'all') {
      filtered = filtered.filter((r) => r.type === filterType);
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter((r) => r.status === filterStatus);
    }

    if (filterBuilding !== 'all') {
      filtered = filtered.filter((r) => r.building === filterBuilding);
    }

    setFilteredRooms(filtered);
  };

  const buildings = Array.from(new Set(rooms.map((r) => r.building)));

  const handleSearchRooms = async () => {
    const capacity = parseInt(allocationForm.numberOfStudents);
    if (!capacity || capacity <= 0) {
      alert('Please enter a valid number of students');
      return;
    }

    try {
      // Search for suitable rooms
      const searchResults = await roomService.searchRooms({
        capacity,
        type: allocationForm.roomType,
        building: allocationForm.building || undefined,
        equipment: allocationForm.equipment,
        status: 'available',
      });

      // Check availability for each room
      const availableRooms: Room[] = [];
      for (const room of searchResults) {
        const isAvailable = await bookingService.checkAvailability(
          room.id,
          allocationForm.date,
          allocationForm.startTime,
          allocationForm.endTime
        );
        if (isAvailable) {
          availableRooms.push(room);
        }
      }

      // Rank rooms
      const ranked = roomAllocationUtils.rankRooms(
        availableRooms,
        capacity,
        allocationForm.equipment
      );

      setRankedRooms(ranked);
    } catch (error) {
      console.error('Error searching rooms:', error);
      alert('Error searching for rooms');
    }
  };

  const handleBookRoom = async (room: Room) => {
    if (!allocationForm.course || !allocationForm.date || !allocationForm.startTime || !allocationForm.endTime) {
      alert('Please fill in all required fields');
      return;
    }

    const readiness = getBookingReadinessMessage(room);
    if (readiness.status === 'occupied') {
      alert(readiness.message);
      return;
    }

    try {
      // Final availability check
      const isAvailable = await bookingService.checkAvailability(
        room.id,
        allocationForm.date,
        allocationForm.startTime,
        allocationForm.endTime
      );

      if (!isAvailable) {
        alert('Room is no longer available for the selected time slot');
        return;
      }

      // Create booking
      const createdBookingId = await bookingService.createBooking({
        roomId: room.id,
        roomName: room.name,
        course: allocationForm.course,
        date: allocationForm.date,
        startTime: allocationForm.startTime,
        endTime: allocationForm.endTime,
        numberOfStudents: parseInt(allocationForm.numberOfStudents),
        status: 'active',
      });
      setBookingId(createdBookingId);
      setCheckedIn(false);

      // Update room status
      await roomService.updateRoomStatus(room.id, 'booked', room.sourceCollection);

      setBookingSuccess(true);
      setSelectedRoom(room);
    } catch (error) {
      console.error('Error booking room:', error);
      alert('Error booking room');
    }
  };

  const handleCheckIn = async () => {
    if (!bookingId || !selectedRoom) return;
    await bookingService.checkIn(bookingId);
    await roomService.updateRoomStatus(selectedRoom.id, 'occupied', selectedRoom.sourceCollection);
    setCheckedIn(true);
  };

  const handleCheckOut = async () => {
    if (!bookingId || !selectedRoom) return;
    await bookingService.checkOut(bookingId);
    await roomService.updateRoomStatus(selectedRoom.id, 'available', selectedRoom.sourceCollection);
    setCheckedIn(false);
    setBookingSuccess(false);
    setShowAllocation(false);
    setRankedRooms([]);
  };

  const toggleEquipment = (eq: string) => {
    setAllocationForm((prev) => ({
      ...prev,
      equipment: prev.equipment.includes(eq)
        ? prev.equipment.filter((e) => e !== eq)
        : [...prev.equipment, eq],
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Smart Rooms</h1>
          <p className="text-slate-400">Intelligent classroom allocation and management</p>
        </div>
        <button
          onClick={() => setShowAllocation(!showAllocation)}
          className="btn-primary"
        >
          {showAllocation ? 'View All Rooms' : 'Allocate Room'}
        </button>
      </div>

      {/* Room Allocation Interface */}
      <AnimatePresence>
        {showAllocation && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-card"
          >
            <h2 className="text-xl font-bold mb-4">Room Allocation</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-2">Course Name</label>
                <input
                  type="text"
                  value={allocationForm.course}
                  onChange={(e) =>
                    setAllocationForm({ ...allocationForm, course: e.target.value })
                  }
                  className="input-field"
                  placeholder="e.g., Computer Science 101"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Date</label>
                <input
                  type="date"
                  value={allocationForm.date}
                  onChange={(e) =>
                    setAllocationForm({ ...allocationForm, date: e.target.value })
                  }
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Number of Students</label>
                <input
                  type="number"
                  value={allocationForm.numberOfStudents}
                  onChange={(e) =>
                    setAllocationForm({ ...allocationForm, numberOfStudents: e.target.value })
                  }
                  className="input-field"
                  placeholder="e.g., 40"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Start Time</label>
                <input
                  type="time"
                  value={allocationForm.startTime}
                  onChange={(e) =>
                    setAllocationForm({ ...allocationForm, startTime: e.target.value })
                  }
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">End Time</label>
                <input
                  type="time"
                  value={allocationForm.endTime}
                  onChange={(e) =>
                    setAllocationForm({ ...allocationForm, endTime: e.target.value })
                  }
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Room Type</label>
                <select
                  value={allocationForm.roomType}
                  onChange={(e) =>
                    setAllocationForm({ ...allocationForm, roomType: e.target.value })
                  }
                  className="input-field"
                >
                  <option value="classroom">Classroom</option>
                  <option value="laboratory">Laboratory</option>
                  <option value="lecture-hall">Lecture Hall</option>
                  <option value="seminar-room">Seminar Room</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Building (Optional)</label>
                <select
                  value={allocationForm.building}
                  onChange={(e) =>
                    setAllocationForm({ ...allocationForm, building: e.target.value })
                  }
                  className="input-field"
                >
                  <option value="">Any Building</option>
                  {buildings.map((building) => (
                    <option key={building} value={building}>
                      {building}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Equipment selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-3">Required Equipment</label>
              <div className="flex flex-wrap gap-2">
                {equipmentOptions.map((eq) => (
                  <button
                    key={eq}
                    onClick={() => toggleEquipment(eq)}
                    className={`px-4 py-2 rounded-lg border transition-all ${
                      allocationForm.equipment.includes(eq)
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-400'
                        : 'glass-panel border-white/10 hover:bg-white/10'
                    }`}
                  >
                    {eq}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={handleSearchRooms} className="btn-primary w-full">
              <Search className="w-5 h-5 mr-2 inline" />
              Search Available Rooms
            </button>

            {/* Search Results */}
            {rankedRooms.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 space-y-4"
              >
                <h3 className="text-lg font-bold">Available Rooms (Best Match First)</h3>
                {rankedRooms.map((room) => {
                  const recommendation = roomAllocationUtils.getRecommendation(
                    room,
                    parseInt(allocationForm.numberOfStudents),
                    allocationForm.equipment
                  );
                  const readiness = getBookingReadinessMessage(room);

                  return (
                    <div key={room.id} className="glass-panel p-4 border border-cyan-400/30">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="text-lg font-bold">{room.name}</h4>
                          <p className="text-sm text-slate-400">
                            {room.building} • Floor {room.floor}
                          </p>
                        </div>
                        <span className="badge-live">BEST MATCH</span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                        <div>
                          <p className="text-xs text-slate-400">Capacity</p>
                          <p className="font-medium">{room.capacity}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400">Required</p>
                          <p className="font-medium">{allocationForm.numberOfStudents}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400">Type</p>
                          <p className="font-medium capitalize">{room.type.replace('-', ' ')}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400">Status</p>
                          <p className="font-medium text-emerald-400">Available ✓</p>
                        </div>
                      </div>

                      {room.equipment.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs text-slate-400 mb-2">Equipment</p>
                          <div className="flex flex-wrap gap-1">
                            {room.equipment.map((eq) => (
                              <span
                                key={eq}
                                className={`text-xs px-2 py-1 rounded ${
                                  allocationForm.equipment.includes(eq)
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-400/30'
                                    : 'bg-slate-800/50 text-slate-300'
                                }`}
                              >
                                {eq} {allocationForm.equipment.includes(eq) && '✓'}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="bg-cyan-500/10 border border-cyan-400/30 rounded-lg p-3 mb-3">
                        <p className="text-sm font-medium text-cyan-400 mb-1">
                          Why recommended:
                        </p>
                        <p className="text-sm text-slate-300">{recommendation}</p>
                      </div>

                      <div className={`room-readiness status-${readiness.status}`}>
                        <strong>{readiness.status === 'empty' ? 'Empty check passed' : 'Occupied'}</strong>
                        <p>{readiness.message}</p>
                      </div>

                      <button
                        onClick={() => handleBookRoom(room)}
                        className="btn-primary w-full"
                      >
                        <CheckCircle className="w-5 h-5 mr-2 inline" />
                        Book Room
                      </button>
                    </div>
                  );
                })}
              </motion.div>
            )}

            {rankedRooms.length === 0 && allocationForm.numberOfStudents && (
              <p className="text-center text-slate-400 mt-6">
                No matching rooms found. Try adjusting your requirements.
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Booking Success */}
      <AnimatePresence>
        {bookingSuccess && selectedRoom && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          >
            <div className="glass-card max-w-md w-full mx-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Booking Confirmed!</h3>
                <p className="text-slate-400 mb-4">
                  Room is reserved. Check in when you arrive, then check out when you leave.
                </p>
                <div className="glass-panel p-4 text-left">
                  <p className="text-sm text-slate-400 mb-1">Room</p>
                  <p className="font-bold mb-3">{selectedRoom.name}</p>
                  <p className="text-sm text-slate-400 mb-1">Date & Time</p>
                  <p className="font-medium mb-3">
                    {allocationForm.date} • {allocationForm.startTime} - {allocationForm.endTime}
                  </p>
                  <p className="text-sm text-slate-400 mb-1">Course</p>
                  <p className="font-medium">{allocationForm.course}</p>
                </div>
                <div className="flex gap-3 mt-4">
                  {!checkedIn ? (
                    <button onClick={handleCheckIn} className="btn-primary flex-1">
                      <LogIn className="w-5 h-5 mr-2 inline" /> Check In
                    </button>
                  ) : (
                    <button onClick={handleCheckOut} className="btn-secondary flex-1">
                      <LogOut className="w-5 h-5 mr-2 inline" /> Check Out
                    </button>
                  )}
                </div>
                <p className={`text-xs mt-3 ${checkedIn ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {checkedIn ? 'You are checked in. The room is marked occupied.' : 'Room status stays reserved until you check in.'}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters and Search */}
      {!showAllocation && (
        <>
          <div className="glass-card">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search rooms..."
                  className="input-field pl-10"
                />
              </div>

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="input-field"
              >
                <option value="all">All Types</option>
                <option value="classroom">Classroom</option>
                <option value="laboratory">Laboratory</option>
                <option value="lecture-hall">Lecture Hall</option>
                <option value="seminar-room">Seminar Room</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="input-field"
              >
                <option value="all">All Status</option>
                <option value="available">Available</option>
                <option value="occupied">Occupied</option>
                <option value="booked">Booked</option>
                <option value="maintenance">Maintenance</option>
              </select>

              <select
                value={filterBuilding}
                onChange={(e) => setFilterBuilding(e.target.value)}
                className="input-field"
              >
                <option value="all">All Buildings</option>
                {buildings.map((building) => (
                  <option key={building} value={building}>
                    {building}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Rooms Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredRooms.map((room) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>

          {filteredRooms.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-400">No rooms found matching your criteria</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};
