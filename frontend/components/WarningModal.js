"use client";

import { useEffect } from 'react';

export default function WarningModal({ countdown, onTypeEscape }) {

  useEffect(() => {
    function handleKeyDown(e) {
      const ignoredKeys = ['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'NumLock', 'ScrollLock'];
      if (ignoredKeys.includes(e.key)) return;
      onTypeEscape();
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onTypeEscape]);

  return (
    <div className="warning-overlay" role="alertdialog" aria-label="Code Red Warning">
      <div className="warning-box">
        <div className="warning-icon">⚠️</div>
        <div className="warning-title">CODE RED</div>
        <div className="warning-subtitle">PRODUCTIVITY DEFICIT DETECTED</div>
        <div className="warning-desc">
          You paused for 4 seconds! Resume typing now or your code gets flushed.
        </div>
        <div className="countdown-number">{countdown}</div>
        <div className="countdown-label">SECONDS</div>
        <div className="warning-escape">▶ TYPE TO ESCAPE ◀</div>
      </div>
    </div>
  );
}
