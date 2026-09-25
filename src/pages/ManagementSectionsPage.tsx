import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, ClipboardList, DoorOpen, Gauge, RefreshCw, Save, Search, ShieldCheck, Users, X, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { alertService } from '../services/alertService';
import { bookingService } from '../services/bookingService';
import { energyService } from '../services/energyService';
import { roomService } from '../services/roomService';
import { waterService } from '../services/waterService';
import type { Alert, Energy, Room, Water } from '../models';

type ManagementSection = 'rooms' | 'operations' | 'planning';

interface ManagementSectionsPageProps {
  section: ManagementSection;
}

const sectionDetails: Record<ManagementSection, { label: string; title: string; description: string }> = {
  rooms: { label: 'Space operations', title: 'Run every room with confidence.', description: 'Review availability, adjust room status, and keep teaching spaces ready for the next class.' },
  operations: { label: 'Campus operations', title: 'See what needs attention.', description: 'Bring alerts, resource usage, and live room signals into one operational view.' },
  planning: { label: 'Capacity planning', title: 'Plan tomorrow before it arrives.', description: 'Use current capacity and resource trends to shape a calmer, more efficient campus day.' },
};

export const ManagementSectionsPage: React.FC<ManagementSectionsPageProps> = ({ section }) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [energy, setEnergy] = useState<Energy[]>([]);
  const [water, setWater] = useState<Water[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [search, setSearch] = useState('');
  const [matchedRooms, setMatchedRooms] = useState<Room[]>([]);
  const [availableRoomIds, setAvailableRoomIds] = useState<string[]>([]);
  const [roomMatchSummary, setRoomMatchSummary] = useState({ total: 0, fits: 0, available: 0, occupied: 0 });
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState('');
  const [bookingForm, setBookingForm] = useState({
    course: '',
    roomType: 'classroom' as Room['type'],
    students: '',
    date: new Date().toISOString().slice(0, 10),
    startTime: '09:00',
    endTime: '10:00',
    equipment: [] as string[],
  });
  const [capacityTarget, setCapacityTarget] = useState('75');
  const [saved, setSaved] = useState(false);

  const equipmentOptions = ['Projector', 'Whiteboard', 'AC', 'Computers', 'Smart Board', 'Microphone'];

  useEffect(() => roomService.subscribeToRooms(setRooms), []);
  useEffect(() => energyService.subscribeToEnergy(setEnergy, 100), []);
  useEffect(() => waterService.subscribeToWater(setWater, 100), []);
  useEffect(() => alertService.subscribeToAlerts(setAlerts), []);

  const detail = sectionDetails[section];
  const visibleRooms = useMemo(() => rooms.filter((room) => `${room.name} ${room.building}`.toLowerCase().includes(search.toLowerCase())), [rooms, search]);
  const activeAlerts = alerts.filter((alert) => alert.status !== 'resolved');
  const totalCapacity = rooms.reduce((total, room) => total + room.capacity, 0);
  const currentOccupancy = rooms.reduce((total, room) => total + (room.currentOccupancy ?? 0), 0);
  const averageEnergy = energyService.calculateAverage(energy);
  const averageWater = waterService.calculateAverage(water);

  const updateRoomStatus = async (room: Room) => {
    const nextStatus: Room['status'] = room.status === 'maintenance' ? 'available' : 'maintenance';
    await roomService.updateRoomStatus(room.id, nextStatus, room.sourceCollection);
  };

  const updateBookingForm = (field: keyof typeof bookingForm, value: string) => {
    setBookingForm((current) => ({ ...current, [field]: value }));
    setBookingError('');
    setBookingSuccess('');
  };

  const toggleEquipment = (equipment: string) => {
    setBookingForm((current) => ({
      ...current,
      equipment: current.equipment.includes(equipment)
        ? current.equipment.filter((item) => item !== equipment)
        : [...current.equipment, equipment],
    }));
    setBookingError('');
    setBookingSuccess('');
  };

  const findMatchingRooms = async () => {
    const studentCount = Number(bookingForm.students);
    if (!bookingForm.course.trim() || !studentCount || studentCount < 1 || bookingForm.startTime >= bookingForm.endTime) {
      setBookingError('Enter a class name, a valid student count, and a time range.');
      setMatchedRooms([]);
      return;
    }

    setBookingError('');
    setBookingSuccess('');
    const candidates = rooms.filter((room) =>
      room.type === bookingForm.roomType &&
      bookingForm.equipment.every((equipment) => room.equipment.includes(equipment))
    );
    const availableRooms: Room[] = [];
    const capacityFitRooms = candidates.filter((room) => room.capacity >= studentCount);
    for (const room of capacityFitRooms) {
      let hasNoBookingConflict = true;
      if (room.status === 'available') {
        try {
          hasNoBookingConflict = await bookingService.checkAvailability(room.id, bookingForm.date, bookingForm.startTime, bookingForm.endTime);
        } catch (error) {
          console.warn('Room availability check was interrupted; using live room status:', error);
        }
      }
      if (room.status === 'available' && hasNoBookingConflict) {
        availableRooms.push(room);
      }
    }
    setAvailableRoomIds(availableRooms.map((room) => room.id));
    setRoomMatchSummary({
      total: candidates.length,
      fits: capacityFitRooms.length,
      available: availableRooms.length,
      occupied: capacityFitRooms.filter((room) => room.status === 'occupied' || room.status === 'booked').length,
    });
    setMatchedRooms(candidates.sort((first, second) => {
      const firstFits = first.capacity >= studentCount;
      const secondFits = second.capacity >= studentCount;
      if (firstFits !== secondFits) return firstFits ? -1 : 1;
      return first.capacity - second.capacity;
    }));
    if (!availableRooms.length) {
      setBookingError('No room is available for that request right now. Occupied rooms are shown below.');
    }
  };

  const bookRoom = async (room: Room) => {
    if (!availableRoomIds.includes(room.id)) return;
    try {
      const isAvailable = await bookingService.checkAvailability(room.id, bookingForm.date, bookingForm.startTime, bookingForm.endTime);
      if (!isAvailable) {
        setBookingError(`${room.name} was just booked for that time. Search again for fresh results.`);
        setMatchedRooms((current) => current.filter((candidate) => candidate.id !== room.id));
        return;
      }
      await bookingService.createBooking({
        roomId: room.id,
        roomName: room.name,
        course: bookingForm.course.trim(),
        date: bookingForm.date,
        startTime: bookingForm.startTime,
        endTime: bookingForm.endTime,
        numberOfStudents: Number(bookingForm.students),
        status: 'active',
      });
      await roomService.updateRoomStatus(room.id, 'booked', room.sourceCollection);
      setMatchedRooms((current) => current.filter((candidate) => candidate.id !== room.id));
      setAvailableRoomIds((current) => current.filter((roomId) => roomId !== room.id));
      setBookingSuccess(`${room.name} is booked and now marked booked across the campus dashboard.`);
    } catch (error) {
      console.error('Error booking management room:', error);
      setBookingError('The booking could not be saved. Please try again.');
    }
  };

  const savePlan = () => {
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2200);
  };

  return (
    <div className="monson-exact-page">
      <video className="monson-exact-video" src="/monson-hero.mp4" autoPlay muted loop playsInline />
      <div className="monson-exact-overlay" />
      <div className="monson-exact-vignette" />
      <div className="monson-exact-nav-wrap">
        <nav className="monson-exact-nav">
          <Link to="/management" className="monson-exact-brand management-brand-mark" aria-label="Management dashboard"><span aria-hidden="true" /></Link>
          <div className="monson-exact-nav-links">
            <Link to="/management">Dashboard</Link>
            <Link className={section === 'rooms' ? 'active' : ''} to="/management/rooms">Rooms</Link>
            <Link className={section === 'operations' ? 'active' : ''} to="/management/operations">Operations</Link>
            <Link className={section === 'planning' ? 'active' : ''} to="/management/planning">Planning</Link>
          </div>
          <Link to="/security" className="monson-exact-security">Security desk</Link>
        </nav>
      </div>
      <aside className="monson-exact-sidebar" aria-label="Management workspace"><span className="monson-sidebar-label">CAMPUS / 01</span><div className="monson-sidebar-rule" /><p>Management<br />workspace</p><div className="monson-sidebar-live"><span /> Live data</div></aside>

      <main className="management-workspace management-section-page">
        <header className="management-section-heading">
          <div><span className="management-eyebrow">{detail.label}</span><h1>{detail.title}</h1><p>{detail.description}</p></div>
          <span className="management-live"><span /> Live data</span>
        </header>

        {section === 'rooms' && (
          <>
            <section className="management-booking-panel management-panel"><div className="management-panel__head"><div><span className="management-eyebrow">Teacher request</span><h2>Tell us what the class needs</h2></div><Search size={18} /></div><div className="management-booking-form"><label><span>Class or lab name</span><input value={bookingForm.course} onChange={(event) => updateBookingForm('course', event.target.value)} placeholder="e.g. Physics 204" /></label><label><span>Space type</span><select value={bookingForm.roomType} onChange={(event) => updateBookingForm('roomType', event.target.value)}><option value="classroom">Classroom</option><option value="laboratory">Laboratory</option></select></label><label><span>Students</span><input type="number" min="1" value={bookingForm.students} onChange={(event) => updateBookingForm('students', event.target.value)} placeholder="e.g. 32" /></label><label><span>Date</span><input type="date" value={bookingForm.date} onChange={(event) => updateBookingForm('date', event.target.value)} /></label><label><span>Starts</span><input type="time" value={bookingForm.startTime} onChange={(event) => updateBookingForm('startTime', event.target.value)} /></label><label><span>Ends</span><input type="time" value={bookingForm.endTime} onChange={(event) => updateBookingForm('endTime', event.target.value)} /></label></div><div className="management-equipment-picker"><span>Required equipment</span><div>{equipmentOptions.map((equipment) => <button className={bookingForm.equipment.includes(equipment) ? 'selected' : ''} key={equipment} type="button" onClick={() => toggleEquipment(equipment)}>{bookingForm.equipment.includes(equipment) ? <CheckCircle2 size={13} /> : <span className="management-equipment-dot" />}{equipment}</button>)}</div></div><button className="management-search-button" type="button" onClick={() => void findMatchingRooms()}><Search size={14} /> Show available {bookingForm.roomType === 'laboratory' ? 'labs' : 'classrooms'}</button>{bookingError && <p className="management-booking-message management-booking-message--error"><X size={14} /> {bookingError}</p>}{bookingSuccess && <p className="management-booking-message management-booking-message--success"><CheckCircle2 size={14} /> {bookingSuccess}</p>}</section>
            {matchedRooms.length > 0 && <><section className="management-fit-summary"><div><strong>{roomMatchSummary.total}</strong><span>matching rooms</span></div><div><strong>{roomMatchSummary.fits}</strong><span>fit {bookingForm.students} students</span></div><div><strong>{roomMatchSummary.available}</strong><span>fit and available</span></div><div><strong>{roomMatchSummary.occupied}</strong><span>fit but occupied</span></div></section><section className="management-section-list management-panel"><div className="management-panel__head"><div><span className="management-eyebrow">Matches for {bookingForm.students} students</span><h2>All matching rooms</h2></div><DoorOpen size={18} /></div><div className="management-room-table">{matchedRooms.map((room) => { const capacityFits = room.capacity >= Number(bookingForm.students); const isAvailable = capacityFits && availableRoomIds.includes(room.id); const isOccupied = room.status === 'occupied' || room.status === 'booked'; return <div className="management-room-line" key={room.id}><div><strong>{room.name}</strong><span>{room.building} / Floor {room.floor} / {room.capacity} seats / {room.equipment.join(', ')}</span><small className={capacityFits ? 'management-fit-label' : 'management-fit-label management-fit-label--muted'}>{capacityFits ? 'Fits request' : `Too small for ${bookingForm.students} students`}</small></div><span className={`management-status management-status--${isAvailable ? 'available' : isOccupied ? 'occupied' : room.status}`}>{isAvailable ? 'available' : isOccupied ? 'occupied' : room.status}</span>{isAvailable ? <button type="button" onClick={() => void bookRoom(room)}>Book room</button> : <span className="management-room-locked">{isOccupied ? 'Occupied' : capacityFits ? room.status : 'Not fit'}</span>}</div>; })}</div></section></>}
            <section className="management-section-list management-panel"><div className="management-panel__head"><div><span className="management-eyebrow">Live inventory</span><h2>Room readiness</h2></div><DoorOpen size={18} /></div><div className="management-search management-inventory-search"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search room or building" /></div><div className="management-room-table">{visibleRooms.length ? visibleRooms.map((room) => <div className="management-room-line" key={room.id}><div><strong>{room.name}</strong><span>{room.building} / Floor {room.floor} / {room.capacity} seats</span></div><span className={`management-status management-status--${room.status}`}>{room.status}</span><button type="button" onClick={() => void updateRoomStatus(room)}><RefreshCw size={13} /> {room.status === 'maintenance' ? 'Mark ready' : 'Maintenance'}</button></div>) : <div className="management-empty"><DoorOpen size={20} /> No rooms match that search.</div>}</div></section>
          </>
        )}

        {section === 'operations' && (
          <>
            <section className="management-operations-grid"><article className="management-panel"><div className="management-panel__head"><div><span className="management-eyebrow">Resource pulse</span><h2>Today so far</h2></div><Gauge size={18} /></div><div className="management-operation-metrics"><div><Zap size={15} /><strong>{averageEnergy.toFixed(1)} <small>kWh avg</small></strong><span>per reading</span></div><div><Users size={15} /><strong>{currentOccupancy} <small>/ {totalCapacity}</small></strong><span>people inside</span></div><div><ClipboardList size={15} /><strong>{averageWater.toFixed(1)} <small>L avg</small></strong><span>water reading</span></div></div></article><article className="management-panel"><div className="management-panel__head"><div><span className="management-eyebrow">Needs review</span><h2>{activeAlerts.length} active alerts</h2></div><AlertTriangle size={18} /></div><div className="management-alert-list">{activeAlerts.slice(0, 5).map((alert) => <div key={alert.id}><span className={`management-status management-status--${alert.severity}`}>{alert.severity}</span><strong>{alert.title}</strong><small>{alert.location || 'Campus wide'}</small></div>)}{!activeAlerts.length && <div className="management-empty"><CheckCircle2 size={20} /> Everything is clear.</div>}</div><Link className="management-section-link" to="/alerts">Open alert center</Link></article></section>
            <section className="management-panel"><div className="management-panel__head"><div><span className="management-eyebrow">Operator checklist</span><h2>Keep the next shift moving</h2></div><ShieldCheck size={18} /></div><div className="management-checklist"><span><CheckCircle2 size={15} /> Room readiness sync <b>Complete</b></span><span><CheckCircle2 size={15} /> Camera coverage review <b>Complete</b></span><span><AlertTriangle size={15} /> Maintenance queue <b>{rooms.filter((room) => room.status === 'maintenance').length} rooms</b></span></div></section>
          </>
        )}

        {section === 'planning' && (
          <>
            <section className="management-planning-grid"><article className="management-panel"><div className="management-panel__head"><div><span className="management-eyebrow">Capacity target</span><h2>Tomorrow's operating range</h2></div><Gauge size={18} /></div><p className="management-plan-copy">Set the occupancy level you want operations to plan around. This stays local to this planning session.</p><label className="management-plan-input"><span>Target campus capacity (%)</span><input type="number" min="1" max="100" value={capacityTarget} onChange={(event) => setCapacityTarget(event.target.value)} /><strong>{capacityTarget}%</strong></label><button className="management-save-button" type="button" onClick={savePlan}><Save size={14} /> {saved ? 'Plan saved' : 'Save planning target'}</button></article><article className="management-panel"><div className="management-panel__head"><div><span className="management-eyebrow">Suggested moves</span><h2>Make space deliberately</h2></div><ClipboardList size={18} /></div><div className="management-plan-list"><div><strong>{Math.max(0, Math.ceil(rooms.length * 0.2))} rooms</strong><span>hold as flexible overflow</span></div><div><strong>{rooms.filter((room) => room.hasCamera).length}</strong><span>camera-ready rooms</span></div><div><strong>{Math.max(0, totalCapacity - currentOccupancy)}</strong><span>open seats right now</span></div></div></article></section>
            <section className="management-panel"><div className="management-panel__head"><div><span className="management-eyebrow">Planning note</span><h2>Prioritize rooms with live signals</h2></div><Users size={18} /></div><p className="management-plan-copy">Use the room readiness page to move maintenance spaces out of the teaching pool before publishing tomorrow's allocation.</p><Link className="management-section-link" to="/management/rooms">Review room readiness</Link></section>
          </>
        )}
      </main>
    </div>
  );
};