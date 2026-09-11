"use client";

import { useEffect } from 'react';

export default function PurgeToast({ message, charsDeleted, onDismiss }) {

  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const isMenuToast = charsDeleted === -1;

  return (
    <div className="purge-toast" role="alert" aria-label="Notification">
      <div className="purge-toast-header">
        {isMenuToast ? '⚠ SYSTEM NOTICE' : '✓ EFFICIENCY AUDIT COMPLETE'}
      </div>
      <div className="purge-toast-body">
        {isMenuToast ? (
          <>{message}</>
        ) : charsDeleted > 0 ? (
          <>
            Purged <strong>{charsDeleted} character{charsDeleted !== 1 ? 's' : ''}</strong> of
            uninspired syntax to optimize repository throughput.
          </>
        ) : (
          <>{message || 'PURGE FAILED: NOTHING LEFT TO DESTROY.'}</>
        )}
      </div>
    </div>
  );
}
