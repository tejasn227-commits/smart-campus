import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Activity, AlertTriangle, Camera, ChevronRight, Droplet, LogIn, LogOut, PhoneCall, Search, Users, X, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { alertService } from '../services/alertService';
import { bookingService } from '../services/bookingService';
import { cameraService } from '../services/cameraService';
import { energyService } from '../services/energyService';
import { guardService } from '../services/guardService';
import { occupancyDetectorService } from '../services/occupancyDetectorService';
import { roomService } from '../services/roomService';
import { waterService } from '../services/waterService';
import type { Alert, Booking, Energy, Guard, Room, Water } from '../models';
import '../resource-dashboard.css';

const trendBars = [42, 56, 49, 68, 61, 78, 70];

export const ManagementPage: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [energy, setEnergy] = useState<Energy[]>([]);
  const [water, setWater] = useState<Water[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [guards, setGuards] = useState<Guard[]>([]);
  const [search, setSearch] = useState('');
  const [checkedIn, setCheckedIn] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [quickBookingRoomId, setQuickBookingRoomId] = useState('');
  const [quickBookingMessage, setQuickBookingMessage] = useState('');
  const [resourceFocus, setResourceFocus] = useState<'energy' | 'water' | null>(null);
  const [securityCall, setSecurityCall] = useState({ floor: '1', room: '' });
  const [securityCallMessage, setSecurityCallMessage] = useState('');
  const [liveRoomId, setLiveRoomId] = useState<string | null>(null);
  const [liveRoomMessage, setLiveRoomMessage] = useState<Record<string, string>>({});
  const [cameraPreviewStream, setCameraPreviewStream] = useState<MediaStream | null>(null);
  const cameraPreviewRef = useRef<HTMLVideoElement>(null);

  useEffect(() => roomService.subscribeToRooms(setRooms), []);
  useEffect(() => energyService.subscribeToEnergy(setEnergy, 100), []);
  useEffect(() => waterService.subscribeToWater(setWater, 100), []);
  useEffect(() => bookingService.subscribeToBookings(setBookings), []);
  useEffect(() => alertService.subscribeToAlerts(setAlerts), []);
  useEffect(() => guardService.subscribeToGuards(setGuards), []);
  useEffect(() => {
    if (!cameraPreviewRef.current || !cameraPreviewStream) return;
    cameraPreviewRef.current.srcObject = cameraPreviewStream;
    void cameraPreviewRef.current.play();
  }, [cameraPreviewStream]);
  useEffect(() => {
    if (!checkedIn) return;
    const roomId = checkedIn;
    const room = rooms.find((candidate) => candidate.id === roomId);
    const timer = window.setTimeout(() => {
      setCheckedIn(null);
      setQuickBookingMessage(`${room?.name || 'The room'} check-in expired after 10 seconds and is available again.`);
      window.setTimeout(() => setQuickBookingMessage(''), 3000);
      if (room) {
        void roomService.updateRoomStatus(room.id, 'available', room.sourceCollection);
        void roomService.updateRoomOccupancy(room.id, 0, room.sourceCollection);
      }
    }, 10000);

    return () => window.clearTimeout(timer);
  }, [checkedIn]);

  const availableRooms = useMemo(() => rooms.filter((room) => room.status === 'available').filter((room) => `${room.name} ${room.building}`.toLowerCase().includes(search.toLowerCase())), [rooms, search]);
  const visibleRooms = useMemo(() => rooms.filter((room) => `${room.name} ${room.building}`.toLowerCase().includes(search.toLowerCase())), [rooms, search]);
  const emptyRooms = rooms.filter((room) => (room.currentOccupancy ?? 0) === 0 && room.status !== 'maintenance');
  const occupiedRooms = rooms.filter((room) => room.status === 'occupied');
  const activeBookings = bookings.filter((booking) => booking.status === 'active');
  const bookedRooms = rooms.filter((room) => room.status === 'booked' || activeBookings.some((booking) => booking.roomId === room.id || booking.roomName.trim().toLowerCase() === room.name.trim().toLowerCase()));
  const classroomRooms = rooms.filter((room) => room.type === 'classroom' || room.name.toLowerCase().includes('classroom'));
  const cameraReadyRooms = rooms.filter((room) => room.hasCamera || room.cameraId);
  const quickActionRooms = checkedIn
    ? [...bookedRooms, ...rooms.filter((room) => room.id === checkedIn)].filter((room, index, list) => list.findIndex((candidate) => candidate.id === room.id) === index)
    : bookedRooms;
  const activeAlerts = alerts.filter((alert) => alert.status !== 'resolved');
  const upcomingBookings = activeBookings.sort((first, second) => `${first.date}${first.startTime}`.localeCompare(`${second.date}${second.startTime}`)).slice(0, 4);
  const totalEnergy = energyService.calculateTotal(energy);
  const totalWater = waterService.calculateTotal(water);
  const occupancy = rooms.reduce((total, room) => total + (room.currentOccupancy ?? 0), 0);
  const capacity = rooms.reduce((total, room) => total + room.capacity, 0);
  const resourceTrend = useMemo(() => {
    const recentEnergy = energy.slice(0, 7).reverse();
    if (!recentEnergy.length) return trendBars.map((height, index) => ({ height, label: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index] }));
    const peak = Math.max(...recentEnergy.map((item) => item.consumption), 1);
    return recentEnergy.map((item, index) => ({
      height: Math.max(12, Math.round((item.consumption / peak) * 100)),
      label: item.timestamp instanceof Date ? item.timestamp.toLocaleTimeString('en-US', { hour: 'numeric' }) : `R${index + 1}`,
    }));
  }, [energy]);

  const quickBookSelectedRoom = async () => {
    if (!quickBookingRoomId) {
      setQuickBookingMessage('Choose any available room to book.');
      return;
    }

    const room = rooms.find((candidate) => candidate.id === quickBookingRoomId);
    if (!room) {
      setQuickBookingMessage('That room is no longer available.');
      return;
    }

    const bookingDate = new Date().toISOString().slice(0, 10);
    const isAvailable = await bookingService.checkAvailability(room.id, bookingDate, '09:00', '10:00');
    if (!isAvailable) {
      setQuickBookingMessage(`${room.name} is already booked for that time.`);
      return;
    }

    await bookingService.createBooking({
      roomId: room.id,
      roomName: room.name,
      course: 'Quick booking',
      date: bookingDate,
      startTime: '09:00',
      endTime: '10:00',
      numberOfStudents: Math.min(room.capacity, 30),
      status: 'active',
    });

    await roomService.updateRoomStatus(room.id, 'booked', room.sourceCollection);
    setQuickBookingRoomId('');
    setQuickBookingMessage(`${room.name} booked successfully and is now visible in the dashboard.`);
  };

  const callSecurity = async () => {
    const floor = Number(securityCall.floor);
    const roomName = securityCall.room.trim();
    if (!roomName) {
      setSecurityCallMessage('Enter the classroom or room number first.');
      return;
    }

    const assignedGuards = guards.filter((candidate) => candidate.status === 'on-duty' && candidate.floors.includes(floor));
    if (!assignedGuards.length) {
      setSecurityCallMessage(`No on-duty guard is assigned to Floor ${floor} yet.`);
      return;
    }

    try {
      await alertService.createAlert({
        type: 'camera',
        severity: 'high',
        title: `Security call from ${roomName}`,
        description: `A teacher in ${roomName} on Floor ${floor} is requesting immediate security assistance.`,
        location: `${roomName} • Floor ${floor}`,
        buildingId: `floor-${floor}`,
        assignedGuardIds: assignedGuards.map((guard) => guard.id),
        assignedGuardNames: assignedGuards.map((guard) => guard.name),
        assignedGuardEmails: assignedGuards.map((guard) => guard.email),
        status: 'new',
      });
      setSecurityCallMessage(`${assignedGuards.map((guard) => guard.name).join(' and ')} were notified for ${roomName}. The alert is now live on their security desks.`);
      setSecurityCall((current) => ({ ...current, room: '' }));
    } catch (error) {
      console.error('Security call could not be sent:', error);
      setSecurityCallMessage('The security call could not be sent. Check Firebase and try again.');
    }
  };

  const toggleRoomPresence = async (room: Room) => {
    const isPresent = checkedIn === room.id;
    if (isPresent) {
      setCheckedIn(null);
      setQuickBookingMessage(`${room.name} is now marked as free again.`);
      await roomService.updateRoomStatus(room.id, 'available', room.sourceCollection);
      await roomService.updateRoomOccupancy(room.id, 0, room.sourceCollection);
      return;
    }

    setCheckedIn(room.id);
    setQuickBookingMessage(`${room.name} is now visible in the dashboard as occupied.`);
    await roomService.updateRoomStatus(room.id, 'occupied', room.sourceCollection);
    await roomService.updateRoomOccupancy(room.id, Math.max(room.currentOccupancy ?? 1, 1), room.sourceCollection);
  };

  const runRoomDetection = async (room: Room) => {
    setLiveRoomId(room.id);
    setLiveRoomMessage((current) => ({ ...current, [room.id]: `Opening camera for ${room.name}...` }));

    try {
      const stream = await cameraService.requestCameraPermission();
      setCameraPreviewStream(stream);
      const video = document.createElement('video');
      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;
      await video.play();

      setLiveRoomMessage((current) => ({ ...current, [room.id]: `Checking ${room.name} twice before confirming...` }));
      const firstCheck = await occupancyDetectorService.detect(video, room.id, room.capacity);
      await new Promise((resolve) => window.setTimeout(resolve, 350));
      const secondCheck = await occupancyDetectorService.detect(video, room.id, room.capacity);
      const detectedCount = Math.round((firstCheck.count + secondCheck.count) / 2);

      if (detectedCount === 0) {
        const floorGuards = guards.filter((guard) => guard.status === 'on-duty' && guard.floors.includes(room.floor));
        if (floorGuards.length) {
          await alertService.createAlert({
            type: 'occupancy',
            severity: 'high',
            title: `Zero people detected in ${room.name}`,
            description: `${room.name} on Floor ${room.floor} was checked twice and no people were detected. Assigned floor guards should verify the room and power state.`,
            location: `${room.building} • Floor ${room.floor}`,
            roomId: room.id,
            buildingId: room.building,
            assignedGuardIds: floorGuards.map((guard) => guard.id),
            assignedGuardNames: floorGuards.map((guard) => guard.name),
            assignedGuardEmails: floorGuards.map((guard) => guard.email),
            status: 'new',
          });
          setQuickBookingMessage(`${room.name} has zero people. ${floorGuards.map((guard) => guard.name).join(' and ')} were alerted.`);
        }
      }

      await roomService.updateRoomOccupancy(room.id, detectedCount, room.sourceCollection);
      await roomService.updateRoomStatus(room.id, detectedCount > 0 ? 'occupied' : 'available', room.sourceCollection);
      setLiveRoomMessage((current) => ({ ...current, [room.id]: `${room.name} verified twice: ${detectedCount} people are in class right now.` }));
      setQuickBookingMessage(`${room.name} was verified twice with ${detectedCount} people in the room.`);
    } catch (error) {
      console.warn('Room detection failed:', error);
      const message = error instanceof Error ? error.message : 'The room camera could not detect people.';
      setLiveRoomMessage((current) => ({ ...current, [room.id]: message }));
      setQuickBookingMessage(`${room.name} detection failed. ${message}`);
    } finally {
      cameraService.stopCamera();
      setCameraPreviewStream(null);
      setLiveRoomId(null);
    }
  };

  const confirmRoomOccupancy = async () => {
    if (!selectedRoom) return;

    setCheckedIn(selectedRoom.id);
    setSelectedRoom(null);
    setQuickBookingMessage(`${selectedRoom.name} is now visible in the dashboard as occupied.`);

    await roomService.updateRoomStatus(selectedRoom.id, 'occupied', selectedRoom.sourceCollection);
    await roomService.updateRoomOccupancy(selectedRoom.id, Math.max(selectedRoom.currentOccupancy ?? 1, 1), selectedRoom.sourceCollection);
  };

  return (
    <div className="monson-exact-page">
      <video className="monson-exact-video" src="/monson-hero.mp4" autoPlay muted loop playsInline />
      <div className="monson-exact-overlay" />
      <div className="monson-exact-vignette" />
      <div className="monson-exact-nav-wrap">
        <nav className="monson-exact-nav">
          <Link to="/management" className="monson-exact-brand management-brand-mark" aria-label="Management dashboard"><span aria-hidden="true" /></Link>
          <div className="monson-exact-nav-links"><Link to="/management">Dashboard</Link><Link to="/management/rooms">Rooms</Link><Link to="/management/operations">Operations</Link><Link to="/management/planning">Planning</Link></div>
          <Link to="/security" className="monson-exact-security">Security desk</Link>
        </nav>
      </div>

      <aside className="monson-exact-sidebar" aria-label="Management workspace"><span className="monson-sidebar-label">CAMPUS / 01</span><div className="monson-sidebar-rule" /><p>Management<br />workspace</p><div className="monson-sidebar-live"><span /> Live data</div></aside>

      <main className="management-workspace">
        <section className="management-kpis" id="dashboard">
          <article><Users size={17} /><small>Live occupancy</small><strong>{occupancy || '--'} <i>/ {capacity || '--'}</i></strong><span>{capacity ? Math.round((occupancy / capacity) * 100) : 0}% campus capacity</span></article>
          <article><DoorIcon /><small>Rooms available</small><strong>{availableRooms.length || '--'}</strong><span>{emptyRooms.length} rooms currently empty</span></article>
          <article className="management-kpi-resource" role="button" tabIndex={0} onClick={() => setResourceFocus('energy')} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') setResourceFocus('energy'); }}><Zap size={17} /><small>Electricity used</small><strong>{totalEnergy.toFixed(0)} <i>kWh</i></strong><span className="management-positive">Latest: {energy[0]?.consumption.toFixed(1) || '--'} kWh · View graph</span></article>
          <article className="management-kpi-resource" role="button" tabIndex={0} onClick={() => setResourceFocus('water')} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') setResourceFocus('water'); }}><Droplet size={17} /><small>Water used</small><strong>{totalWater.toFixed(0)} <i>L</i></strong><span>Latest: {water[0]?.consumption.toFixed(0) || '--'} L · View graph</span></article>
        </section>

        {resourceFocus && <section className="resource-detail-panel">
          <div className="resource-detail-panel__head"><div><span>Firebase resource trend</span><h2>{resourceFocus === 'energy' ? 'Electricity usage (kWh)' : 'Water usage (L)'}</h2><p>Total calculated from {resourceFocus === 'energy' ? energy.length : water.length} live readings.</p></div><button type="button" onClick={() => setResourceFocus(null)}>Close</button></div>
          <div className="resource-detail-chart">{(resourceFocus === 'energy' ? energy : water).slice(0, 8).reverse().map((reading, index, readings) => { const peak = Math.max(...readings.map((item) => item.consumption), 1); return <div key={`${reading.id}-${index}`}><span style={{ height: `${Math.max(12, (reading.consumption / peak) * 100)}%` }} /><small>{reading.timestamp instanceof Date ? reading.timestamp.toLocaleTimeString('en-US', { hour: 'numeric' }) : `R${index + 1}`}</small><b>{reading.consumption.toFixed(0)} {resourceFocus === 'energy' ? 'kWh' : 'L'}</b></div>; })}</div>
        </section>}

        <section className="management-grid management-grid--main">
          <article className="management-panel management-firebase-rooms" id="rooms">
            <div className="management-panel__head">
              <div><span className="management-eyebrow">Firebase room collection</span><h2>All campus rooms</h2></div>
              <Search size={18} />
            </div>
            <div className="management-search"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search room, building, or lab" /></div>
            <div className="room-results">{visibleRooms.length ? visibleRooms.map((room) => <div className="room-result" key={room.id}><div><strong>{room.name}</strong><span>{room.building} / Floor {room.floor} / {room.capacity} seats</span></div>{room.status === 'available' ? <button type="button" onClick={() => checkedIn === room.id ? void toggleRoomPresence(room) : setSelectedRoom(room)}>{checkedIn === room.id ? <><LogOut size={14} /> Leave room</> : <><LogIn size={14} /> I am here</>}</button> : <span className={`management-status management-status--${room.status}`}>{room.status}</span>}</div>) : <div className="management-empty"><Activity size={20} /><span>No rooms from Firebase match this search.</span></div>}</div>
          </article>

          <article className="management-panel" id="occupancy">
            <div className="management-panel__head">
              <div><span className="management-eyebrow">Real-time occupancy</span><h2>Room status</h2></div>
              <span className="management-live management-live--small"><span /> Live</span>
            </div>
            <div className="management-booking-inline__count management-booking-inline__count--compact">
              <strong>{cameraReadyRooms.length}</strong>
              <span>camera-ready rooms</span>
            </div>
            {cameraPreviewStream && <div className="management-camera-preview"><video ref={cameraPreviewRef} muted playsInline /><span>Live camera: {rooms.find((room) => room.id === liveRoomId)?.name || 'Selected room'}</span></div>}
            <div className="occupancy-list">
              {classroomRooms.slice(0, 4).map((room) => (
                <div className="occupancy-row" key={room.id}>
                  <div className={`occupancy-row__dot ${room.status === 'available' ? 'free' : 'occupied'}`} />
                  <div>
                    <strong>{room.name}</strong>
                    <span>{room.type === 'classroom' ? 'Classroom' : 'Lab'} • {room.hasCamera || room.cameraId ? 'Camera access enabled' : 'Camera not connected'}</span>
                    {liveRoomMessage[room.id] && <small>{liveRoomMessage[room.id]}</small>}
                  </div>
                  <div className="management-room-inline-actions">
                    <b>{room.status === 'available' ? 'Available' : room.status}</b>
                    <button type="button" onClick={() => void runRoomDetection(room)}>{liveRoomId === room.id ? 'Detecting...' : 'Run camera'}</button>
                  </div>
                </div>
              ))}
              {classroomRooms.length === 0 && <div className="management-empty"><Camera size={20} /><span>No classroom rooms detected.</span></div>}
            </div>
          </article>
        </section>

        <section className="management-grid management-grid--lower">
          <article className="management-panel" id="bookings-inline">
            <div className="management-panel__head">
              <div><span className="management-eyebrow">Booked rooms</span><h2>Quick booking</h2></div>
              <Users size={18} />
            </div>
            <div className="management-booking-inline">
              <div className="management-booking-inline__count"><strong>{bookedRooms.length}</strong><span>rooms booked</span></div>
              <select value={quickBookingRoomId} onChange={(event) => setQuickBookingRoomId(event.target.value)}>
                <option value="">Select room</option>
                {rooms.filter((room) => room.status === 'available').map((room) => (
                  <option key={room.id} value={room.id}>{room.name}</option>
                ))}
              </select>
              <button type="button" onClick={() => void quickBookSelectedRoom()}>Book room</button>
            </div>
            <div className="management-booking-inline__list">
              {quickActionRooms.length ? quickActionRooms.slice(0, 4).map((room) => <span key={room.id}>{room.name} · {room.status === 'booked' ? 'booked' : 'occupied'}</span>) : <span className="management-empty-inline">No rooms booked yet</span>}
            </div>
            {quickBookingMessage && <p className="management-booking-inline__message">{quickBookingMessage}</p>}
          </article>
          <article className="management-panel security-call-panel">
            <div className="management-panel__head">
              <div><span className="management-eyebrow">Teacher assistance</span><h2>Call security</h2></div>
              <PhoneCall size={18} />
            </div>
            <p className="security-call-copy">Choose your floor and room. The assigned on-duty guard will receive a live alert.</p>
            <div className="security-call-form">
              <label><span>Floor</span><select value={securityCall.floor} onChange={(event) => setSecurityCall({ ...securityCall, floor: event.target.value })}>{[1, 2, 3, 4, 5].map((floor) => <option key={floor} value={floor}>Floor {floor}</option>)}</select></label>
              <label><span>Room name or number</span><input value={securityCall.room} onChange={(event) => setSecurityCall({ ...securityCall, room: event.target.value })} placeholder="e.g. Classroom 204" /></label>
            </div>
            <button type="button" className="security-call-button" onClick={() => void callSecurity()}><PhoneCall size={14} /> Send guard alert</button>
            {securityCallMessage && <p className="security-call-message">{securityCallMessage}</p>}
          </article>

          <article className="management-panel" id="resources"><div className="management-panel__head"><div><span className="management-eyebrow">Firebase resource view</span><h2>Campus at a glance</h2></div><Activity size={18} /></div><div className="dashboard-summary"><div><strong>{emptyRooms.length}</strong><span>Empty rooms</span></div><div><strong>{occupiedRooms.length}</strong><span>Occupied rooms</span></div><div><strong>{bookedRooms.length}</strong><span>Booked rooms</span></div><div><strong>{totalEnergy.toFixed(0)}</strong><span>kWh received</span></div></div><div className="demand-chart">{resourceTrend.map((item) => <div key={item.label}><span style={{ height: `${item.height}%` }} /><small>{item.label}</small></div>)}</div></article>

          <article className="management-panel"><div className="management-panel__head"><div><span className="management-eyebrow">Teacher activity</span><h2>My room status</h2></div><Users size={18} /></div>{checkedIn ? <div className="teacher-status"><div className="occupancy-row__dot occupied" /><div><strong>{rooms.find((room) => room.id === checkedIn)?.name || 'Selected room'}</strong><span>You marked this room occupied by you.</span></div><button type="button" onClick={() => {
                  const room = rooms.find((candidate) => candidate.id === checkedIn);
                  if (room) void toggleRoomPresence(room);
                }}><LogOut size={14} /> I left</button></div> : <div className="management-empty"><Users size={20} /><span>Choose “I am here” after reaching a free room.</span></div>}<div className="resource-summary"><span><Zap size={14} /> Power watch <strong>{emptyRooms.length ? 'Attention' : 'Clear'}</strong></span><span><Droplet size={14} /> Water <strong>Live</strong></span></div></article>
          <article className="management-panel"><div className="management-panel__head"><div><span className="management-eyebrow">Firebase bookings</span><h2>Upcoming classes</h2></div><Users size={18} /></div>{upcomingBookings.length ? <div className="management-booking-feed">{upcomingBookings.map((booking) => <div key={booking.id}><div><strong>{booking.course}</strong><span>{booking.roomName} · {booking.numberOfStudents} students</span></div><b>{booking.date}<small>{booking.startTime}–{booking.endTime}</small></b></div>)}</div> : <div className="management-empty"><Users size={20} /><span>No active bookings in Firebase yet.</span></div>}<div className="resource-summary"><span><Zap size={14} /> Power watch <strong>{emptyRooms.length ? 'Attention' : 'Clear'}</strong></span><span><Droplet size={14} /> Water <strong>Live</strong></span></div></article>
        </section>


        <section className="management-alert"><AlertTriangle size={18} /><div><span className="management-eyebrow">Firebase alert feed</span><strong>{activeAlerts[0]?.title || (emptyRooms.length ? `${emptyRooms[0].name} has no detected people but may still be using power.` : 'No active campus alerts.')}</strong><p>{activeAlerts[0]?.description || 'Live room, energy, water, and occupancy signals are being monitored.'}</p></div><Link to="/alerts">Open alerts <ChevronRight size={15} /></Link></section>
      </main>
      {selectedRoom && <div className="room-confirm-backdrop" role="presentation"><div className="room-confirm" role="dialog" aria-modal="true" aria-labelledby="room-confirm-title"><button type="button" className="room-confirm__close" onClick={() => setSelectedRoom(null)} aria-label="Close"><X size={17} /></button><span className="management-eyebrow">Teacher occupancy</span><h2 id="room-confirm-title">Have you reached {selectedRoom.name}?</h2><p>Confirming marks this room as occupied by you for the live campus view.</p><div><button type="button" onClick={() => setSelectedRoom(null)}>Not yet</button><button type="button" onClick={confirmRoomOccupancy}>Yes, I occupied it</button></div></div></div>}
    </div>
  );
};

const DoorIcon = () => <span className="management-icon-door"><Users size={15} /></span>;