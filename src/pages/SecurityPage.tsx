import React, { useEffect, useState } from 'react';
import { ArrowUpRight, LogOut, PhoneCall, ShieldAlert, UserRound } from 'lucide-react';
import { alertService } from '../services/alertService';
import type { Alert } from '../models';
import '../security-profile.css';

export const SecurityPage: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [dismissedCallId, setDismissedCallId] = useState<string | null>(null);
  const [alertsExpanded, setAlertsExpanded] = useState(false);
  const [responsePopupOpen, setResponsePopupOpen] = useState(false);

  useEffect(() => alertService.subscribeToAlerts(setAlerts), []);

  const storedUser = localStorage.getItem('smart-campus-user');
  let guardEmail = '';
  let profileName = 'Security guard';
  try {
    const sessionUser = storedUser ? JSON.parse(storedUser) as { role?: string; email?: string; name?: string } : null;
    guardEmail = sessionUser?.role === 'guard' ? sessionUser.email || '' : '';
    profileName = sessionUser?.name || sessionUser?.email?.split('@')[0] || profileName;
  } catch {
    guardEmail = '';
  }

  const visibleAlerts = guardEmail ? alerts.filter((alert) => alert.assignedGuardEmail === guardEmail || alert.assignedGuardEmails?.includes(guardEmail)) : alerts;
  const activeAlerts = visibleAlerts.filter((alert) => alert.status !== 'resolved');
  const critical = activeAlerts.filter((alert) => alert.severity === 'critical' || alert.severity === 'high');
  const incomingCall = activeAlerts.find((alert) => alert.type === 'camera' && (alert.assignedGuardName || alert.assignedGuardNames?.length));

  const acknowledgeIncomingCall = async () => {
    if (!incomingCall) return;
    setDismissedCallId(incomingCall.id);
    await alertService.deleteAlert(incomingCall.id);
  };

  const logout = () => {
    localStorage.removeItem('smart-campus-user');
    window.location.assign('/login');
  };

  return (
    <>
      <div className="security-profile-bar">
        <div className="security-profile-bar__brand"><ShieldAlert size={18} /><div><strong>Security command desk</strong><small>Live campus response dashboard</small></div></div>
        <div className="security-profile-bar__identity"><span><UserRound size={17} /></span><div><strong>{profileName}</strong><small>{guardEmail || 'Security Lead'} · Live desk</small></div></div>
        <button type="button" onClick={logout}><LogOut size={15} /> Log out</button>
      </div>
      {incomingCall && dismissedCallId !== incomingCall.id && <div className="security-call-popup" role="alertdialog" aria-modal="true" aria-labelledby="security-call-title">
        <div className="security-call-popup__card">
          <div className="security-call-popup__icon"><PhoneCall size={22} /></div>
          <div><span className="security-kicker">Incoming room call</span><h2 id="security-call-title">{incomingCall.location || 'A classroom'} is calling you</h2><p>{incomingCall.description}</p><strong>Assigned guards: {incomingCall.assignedGuardNames?.join(', ') || incomingCall.assignedGuardName}</strong></div>
          <button type="button" onClick={() => void acknowledgeIncomingCall()}>Acknowledge call <ArrowUpRight size={15} /></button>
        </div>
      </div>}
      <div className={`security-alert-div ${critical.length ? 'security-alert-div--critical' : ''} ${alertsExpanded ? 'security-alert-div--expanded' : ''}`} role="button" tabIndex={0} onClick={() => setAlertsExpanded((expanded) => !expanded)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') setAlertsExpanded((expanded) => !expanded); }}>
        <div className="security-alert-div__signal"><ShieldAlert size={18} /></div>
        <div className="security-alert-div__body"><span>{activeAlerts.length ? 'Click to view alerts' : 'Security status'}</span><strong>{activeAlerts.length ? `${activeAlerts.length} active alerts` : 'No active room calls'}</strong><p>{activeAlerts.length ? `${critical.length} high-priority alerts need attention.` : 'This alert panel is listening for live Firebase room calls.'}</p>{alertsExpanded && <div className="security-alert-list">{activeAlerts.map((alert) => <div key={alert.id}><b>{alert.title}</b><small>{alert.location || 'Campus wide'} · {alert.description}</small></div>)}</div>}</div>
        <span className="security-alert-div__pulse" />
      </div>
      <div className="security-response-panel">
        <div className="security-response-panel__heading"><div><span>Operator workspace</span><strong>Response queue</strong><small>Keep the next guard action visible.</small></div><button type="button" onClick={() => setResponsePopupOpen((open) => !open)}>{responsePopupOpen ? 'Close queue' : 'Open queue'} <ArrowUpRight size={14} /></button></div>
        {responsePopupOpen && <div className="security-response-popup"><span className="security-response-popup__count">{activeAlerts.length}</span><div><strong>Active response items</strong><p>{critical.length ? `${critical.length} high-priority alerts need a guard response.` : 'No high-priority response is waiting.'}</p></div><div className="security-response-popup__list">{activeAlerts.slice(0, 5).map((alert) => <span key={alert.id}>{alert.title}<small>{alert.location || 'Campus wide'}</small></span>)}</div></div>}
      </div>
    </>
  );
};