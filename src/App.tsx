import { useState, useEffect } from 'react';
import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Mail, Power, ShieldCheck } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { LoadingScreen } from './components/LoadingScreen';
import { SmartRoomsPage } from './pages/SmartRoomsPage';
import { OccupancyPage } from './pages/OccupancyPage';
import { EnergyPage } from './pages/EnergyPage';
import { WaterPage } from './pages/WaterPage';
import { PredictionsPage } from './pages/PredictionsPage';
import { AlertsPage } from './pages/AlertsPage';
import { ReportsPage } from './pages/ReportsPage';
import { CamerasPage } from './pages/CamerasPage';
import { SettingsPage } from './pages/SettingsPage';
import { ManagementPage } from './pages/ManagementPage';
import { ManagementSectionsPage } from './pages/ManagementSectionsPage';
import { SecurityPage } from './pages/SecurityPage';
import { roomService } from './services/roomService';
import { alertService } from './services/alertService';
import { guardService } from './services/guardService';
import { shouldTriggerPowerAlert } from './utils/smartCampusRules';
import type { Guard, Room } from './models';
import { collection, getDocs } from 'firebase/firestore';
import { firestore } from './firebase/config';
import './index.css';

type DemoUser = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'security' | 'guard';
  guardId?: string;
};

const loadPersistedUser = (): DemoUser | null => {
  try {
    const stored = localStorage.getItem('smart-campus-user');
    return stored ? (JSON.parse(stored) as DemoUser) : null;
  } catch {
    return null;
  }
};

function App() {
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<DemoUser | null>(() => window.location.pathname === '/login' ? null : loadPersistedUser());
  const [rooms, setRooms] = useState<Room[]>([]);
  const [guards, setGuards] = useState<Guard[]>([]);
  const [users, setUsers] = useState<DemoUser[]>([]);
  const [securityAlert, setSecurityAlert] = useState<Room | null>(null);
  const [loginForm, setLoginForm] = useState({ email: 'campusadmin@gmail.com', password: 'admin123' });
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 1800);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    guardService.getGuards().then(setGuards).catch((error) => console.warn('Guard records could not be loaded:', error));
  }, []);

  useEffect(() => {
    getDocs(collection(firestore, 'users')).then((snapshot) => {
      setUsers(snapshot.docs.map((userDocument) => {
        const data = userDocument.data();
        return {
          id: userDocument.id,
          name: String(data.name || 'Campus user'),
          email: String(data.email || ''),
          password: String(data.password || ''),
          role: data.role === 'security' ? 'security' : 'admin',
        };
      }));
    }).catch((error) => console.warn('User records could not be loaded:', error));
  }, []);

  useEffect(() => {
    const unsubscribe = roomService.subscribeToRooms((updatedRooms) => {
      const normalizedRooms = updatedRooms.map((room) => ({
        ...room,
        currentOccupancy: room.currentOccupancy ?? 0,
        lightsOnMinutes:
          room.lightsOnMinutes ?? ((room.currentOccupancy ?? 0) === 0 && room.status !== 'maintenance' ? 6 : 0),
      }));

      setRooms(normalizedRooms);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const emptyRoomWithLightsOn = rooms.find((room) => shouldTriggerPowerAlert(room));
    setSecurityAlert(emptyRoomWithLightsOn ?? null);
  }, [rooms]);

  useEffect(() => {
    if (!securityAlert) {
      return;
    }

    const createPowerAlert = async () => {
      try {
        await alertService.createAlert({
          type: 'maintenance',
          severity: 'critical',
          title: `Power shutdown required in ${securityAlert.name}`,
          description: `${securityAlert.name} on ${securityAlert.building} Floor ${securityAlert.floor} is empty but the lights have stayed on for over 5 minutes. Security must cut power to this room.`,
          location: `${securityAlert.building} • Floor ${securityAlert.floor}`,
          roomId: securityAlert.id,
          buildingId: securityAlert.building,
          status: 'new',
        });
      } catch (error) {
        console.warn('Security power alert could not be saved:', error);
      }
    };

    createPowerAlert();
  }, [securityAlert]);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();

    const matchedUser = users.find(
      (candidate) =>
        candidate.email.toLowerCase() === loginForm.email.trim().toLowerCase() &&
        candidate.password === loginForm.password
    );
    const databaseGuards = await guardService.getGuards().catch(() => guards);
    const matchedGuard = databaseGuards.find(
      (guard) => guard.email.toLowerCase() === loginForm.email.trim().toLowerCase() && guard.password === loginForm.password
    );
    const authenticatedUser = matchedUser || (matchedGuard ? {
      id: matchedGuard.id,
      guardId: matchedGuard.id,
      name: matchedGuard.name,
      email: matchedGuard.email,
      password: matchedGuard.password || loginForm.password,
      role: 'guard' as const,
    } : null);

    if (!authenticatedUser) {
      setLoginError('Use the campus demo account or your registered Gmail address.');
      return;
    }

    setUser(authenticatedUser);
    localStorage.setItem('smart-campus-user', JSON.stringify(authenticatedUser));
    window.history.replaceState({}, '', authenticatedUser.role === 'security' || authenticatedUser.role === 'guard' ? '/security' : '/management');
    setLoginError('');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('smart-campus-user');
  };

  const alertCount = securityAlert ? 1 : 0;

  if (loading) {
    return <LoadingScreen onComplete={() => setLoading(false)} />;
  }

  if (!user) {
    return (
      <div className="auth-shell tx-login-shell">
        <div className="auth-backdrop" aria-hidden="true">
          <video className="auth-backdrop__video" src="/hero-loop.mp4" autoPlay muted loop playsInline preload="auto" />
          <div className="auth-backdrop__overlay" />
        </div>

        <div className="auth-panel glass-card tx-auth-panel">
          <div className="auth-badge">Smart Campus Intelligence</div>

          <div className="mb-8">
            <p className="eyebrow-text">Secure access</p>
            <h1>Smart campus dashboard</h1>
            <p className="auth-copy">
              Monitor occupancy, booking readiness, and energy anomalies across every floor.
            </p>
          </div>

          <div className="demo-account-box">
            <div className="demo-label">
              <Mail className="w-4 h-4" />
              Demo Gmail access
            </div>
            <div className="demo-grid">
              {users.map((demoUser) => <div key={demoUser.id}>
                <span>{demoUser.role === 'security' ? 'Security' : 'Admin'}</span>
                <strong>{demoUser.email}</strong>
                <small>{demoUser.password}</small>
              </div>)}
              {guards.map((guard) => <div key={guard.id}>
                <span>{guard.name} / Floors {guard.floors.join(', ')}</span>
                <strong>{guard.email}</strong>
                <small>{guard.password || 'Password unavailable'}</small>
              </div>)}
            </div>
          </div>

          <form onSubmit={handleLogin} className="auth-form">
            <label>
              Gmail or campus email
              <input
                type="email"
                value={loginForm.email}
                onChange={(event) => setLoginForm({ ...loginForm, email: event.target.value })}
                placeholder="name@gmail.com"
              />
            </label>

            <label>
              Password
              <input
                type="password"
                value={loginForm.password}
                onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })}
                placeholder="Enter password"
              />
            </label>

            {loginError && <p className="auth-error">{loginError}</p>}

            <button type="submit" className="btn-primary auth-button">
              <ShieldCheck className="w-4 h-4" />
              Sign in to control center
            </button>
          </form>
        </div>
      </div>
    );
  }

  if ((user.role === 'security' || user.role === 'guard') && window.location.pathname === '/security') {
    return <SecurityPage />;
  }

  return (
    <BrowserRouter>
      <div className="app-shell flex h-screen overflow-hidden">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex-1 flex flex-col overflow-hidden">
          <TopBar
            onMenuClick={() => setSidebarOpen(!sidebarOpen)}
            alertCount={alertCount}
            user={{ name: user.name, role: user.role }}
          />

          <AnimatePresence>
            {securityAlert && (
              <motion.div
                initial={{ opacity: 0, y: -18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -18 }}
                className="security-toast"
              >
                <div className="security-toast__icon">
                  <Power className="w-5 h-5" />
                </div>
                <div className="security-toast__content">
                  <span className="security-toast__label">Security action required</span>
                  <strong>{securityAlert.name}</strong>
                  <p>
                    {securityAlert.building} • Floor {securityAlert.floor} is empty with lights still on for more than 5 minutes.
                  </p>
                </div>
                <button type="button" onClick={() => setSecurityAlert(null)} className="security-toast__button">
                  <AlertTriangle className="w-4 h-4" />
                  Acknowledge
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <main className="flex-1 overflow-y-auto p-6">
            <Routes>
              <Route path="/" element={<Navigate to={user.role === 'security' || user.role === 'guard' ? '/security' : '/management'} replace />} />
              <Route path="/management" element={<ManagementPage />} />
              <Route path="/management/rooms" element={<ManagementSectionsPage section="rooms" />} />
              <Route path="/management/operations" element={<ManagementSectionsPage section="operations" />} />
              <Route path="/management/planning" element={<ManagementSectionsPage section="planning" />} />
              <Route path="/security" element={<SecurityPage />} />
              <Route path="/smart-rooms" element={<SmartRoomsPage />} />
              <Route path="/occupancy" element={<OccupancyPage />} />
              <Route path="/energy" element={<EnergyPage />} />
              <Route path="/water" element={<WaterPage />} />
              <Route path="/predictions" element={<PredictionsPage />} />
              <Route path="/alerts" element={<AlertsPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/cameras" element={<CamerasPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </main>
        </div>
      </div>
      <button type="button" className="logout-button" onClick={handleLogout}>Log out</button>
    </BrowserRouter>
  );
}

export default App;
