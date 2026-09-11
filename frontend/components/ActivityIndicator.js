"use client";

export default function ActivityIndicator({ state, idleTime }) {
  const isDanger = state === 'WARNING' || state === 'PURGING';
  const remaining = Math.max(0, 4.0 - idleTime);

  let statusLabel = 'WATCHDOG ARMED';
  let timerClass = '';
  let devStatus = 'DEVELOPER STATUS: PRODUCTIVE';

  if (state === 'WARNING') {
    statusLabel = 'WATCHDOG TRIGGERED';
    devStatus = 'DEVELOPER STATUS: PANICKING';
  } else if (state === 'PURGING' || state === 'PURGED') {
    statusLabel = 'WATCHDOG RESET';
    devStatus = 'DEVELOPER STATUS: DEVASTATED';
  } else {
    if (remaining < 1.5) {
      timerClass = 'critical';
      devStatus = 'DEVELOPER STATUS: SWEATING';
    } else if (remaining < 2.5) {
      timerClass = 'warning';
      devStatus = 'DEVELOPER STATUS: QUESTIONABLE';
    }
  }

  return (
    <div className={`activity-bar ${isDanger ? 'danger' : ''}`}>
      <div className="activity-left">
        <div className={`watchdog-dot ${isDanger ? 'danger' : ''}`} />
        <span className={`watchdog-label ${isDanger ? 'danger' : ''}`}>
          {statusLabel}
        </span>
      </div>

      <div className="activity-right">
        {state === 'NORMAL' && (
          <span className={`timer-display ${timerClass}`}>
            NEXT AUDIT: {remaining.toFixed(1)}s
          </span>
        )}
        <span className="dev-status">{devStatus}</span>
      </div>
    </div>
  );
}
