"use client";

export default function Header({ state, apiOnline }) {
  const isDanger = state === 'WARNING' || state === 'PURGING';

  return (
    <header className={`header ${isDanger ? 'danger' : ''}`}>
      <div className="header-left">
        <div className={`header-dot ${isDanger ? 'danger' : ''}`} />
        <span className="header-title">CODE RED</span>
      </div>

      <div className="header-right">
        <div className={`status-pill ${isDanger ? 'danger' : 'normal'}`}>
          {isDanger ? '🚨 CODE RED: IDLE DETECTED' : '● NORMAL'}
        </div>

        <div className={`api-status ${apiOnline ? '' : 'offline'}`}>
          {apiOnline ? 'API ONLINE' : 'API OFFLINE — LOCAL MODE'}
        </div>
      </div>
    </header>
  );
}
