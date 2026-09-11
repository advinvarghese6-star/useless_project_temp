"use client";

export default function StatsBar({ code, purgeCount, charsLost }) {
  const lines = code.split('\n').length;
  const words = code.trim() === '' ? 0 : code.trim().split(/\s+/).length;
  const characters = code.length;

  return (
    <div className="stats-bar">
      <div className="stat-item">
        <span className="stat-label">Lines</span>
        <span className="stat-value">{lines}</span>
      </div>
      <div className="stat-item">
        <span className="stat-label">Words</span>
        <span className="stat-value">{words}</span>
      </div>
      <div className="stat-item">
        <span className="stat-label">Characters</span>
        <span className="stat-value">{characters}</span>
      </div>
      <div className="stat-item">
        <span className="stat-label">Purges</span>
        <span className={`stat-value ${purgeCount > 0 ? 'danger' : ''}`}>{purgeCount}</span>
      </div>
      <div className="stat-item">
        <span className="stat-label">Lost</span>
        <span className={`stat-value ${charsLost > 0 ? 'danger' : ''}`}>{charsLost}</span>
      </div>
    </div>
  );
}
