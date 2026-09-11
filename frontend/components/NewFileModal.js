"use client";

export default function NewFileModal({ onActivate }) {
  return (
    <div className="warning-overlay" role="dialog" aria-label="Deploy New File">
      <div className="warning-box new-file-box">
        <div className="warning-icon">📄</div>
        <div className="warning-title" style={{ color: "var(--accent-cyan)" }}>WORKSPACE EMPTY</div>
        <div className="warning-subtitle">ALL CODE HAS BEEN PURGED</div>
        <div className="warning-desc">
          Your editor contains no serviceable code. You must request a new file to continue.
        </div>
        <button className="deploy-button" onClick={onActivate}>
          DEPLOY NEW FILE
        </button>
      </div>
    </div>
  );
}
