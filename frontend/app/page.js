"use client";

import { useState, useRef, useCallback, useEffect } from 'react';
import Header from '../components/Header';
import MenuBar from '../components/MenuBar';
import CodeEditor from '../components/CodeEditor';
import WarningModal from '../components/WarningModal';
import NewFileModal from '../components/NewFileModal';
import PurgeToast from '../components/PurgeToast';
import StatsBar from '../components/StatsBar';
import ActivityIndicator from '../components/ActivityIndicator';
import { createSession, recordAudit } from '../lib/api';

const IDLE_THRESHOLD = 4000;
const WARNING_DURATION = 5;

const CODE_SNIPPETS = [
`function saveProject() {
  console.log("Building something amazing...");
}

function calculateProductivity() {
  return "100%";
}

saveProject();`,

`class GravityEngine {
  constructor() {
    this.force = 9.81;
    this.active = true;
  }

  simulate() {
    while (this.active) {
      this.force -= 0.01;
      console.log("Gravity:", this.force);
    }
  }
}

new GravityEngine().simulate();`,

`const express = require('express');
const app = express();

app.get('/api/status', (req, res) => {
  res.json({ alive: true, morale: 'low' });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});`,

`import React, { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);
  return (
    <button onClick={() => setCount(c => c + 1)}>
      Clicked {count} times
    </button>
  );
}

export default Counter;`,

`async function fetchWeather(city) {
  const response = await fetch(
    \`https://api.weather.dev/\${city}\`
  );
  const data = await response.json();
  console.log(data.temperature);
  return data;
}

fetchWeather('Tokyo');`,

`def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

for i in range(10):
    print(f"fib({i}) = {fibonacci(i)}")

print("Done computing!")`,
];

const INITIAL_CODE = CODE_SNIPPETS[0];

function getRandomSnippet(excludeCode) {
  const pool = CODE_SNIPPETS.filter(s => s !== excludeCode);
  return pool[Math.floor(Math.random() * pool.length)];
}

/* ============================================================
   WEB AUDIO ENGINE — Procedural sounds, zero external files
   ============================================================ */
function getAudioContext() {
  if (typeof window === 'undefined') return null;
  if (!window.__codeRedAudioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    window.__codeRedAudioCtx = new AC();
  }
  const ctx = window.__codeRedAudioCtx;
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
  return ctx;
}

function playAlertSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Buzzer burst chord
    [330, 440, 554].forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.linearRampToValueAtTime(freq * 1.08, now + 0.35);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.45);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.45);
    });

    // White noise applause burst
    const bufLen = ctx.sampleRate * 1.2;
    const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = buf;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1100;
    bp.Q.value = 1.2;
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0.08, now);
    ng.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
    noise.connect(bp).connect(ng).connect(ctx.destination);
    noise.start(now);
  } catch (_) { /* audio unavailable */ }
}

function playPurgeSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Descending buzz (shredder)
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(500, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.8);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 1.0);

    // Filtered noise whoosh
    const bufLen = ctx.sampleRate * 1.0;
    const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = buf;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(2500, now);
    lp.frequency.exponentialRampToValueAtTime(80, now + 1.0);
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0.18, now);
    ng.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
    noise.connect(lp).connect(ng).connect(ctx.destination);
    noise.start(now);
  } catch (_) { /* audio unavailable */ }
}

/* ============================================================
   MAIN PAGE COMPONENT
   ============================================================ */
export default function HomePage() {
  // ---- Application State ----
  const [code, setCode] = useState(INITIAL_CODE);
  const [appState, setAppState] = useState('NORMAL'); // NORMAL | WARNING | PURGING | PURGED
  const [countdown, setCountdown] = useState(WARNING_DURATION);
  const [purgeCount, setPurgeCount] = useState(0);
  const [charsLost, setCharsLost] = useState(0);
  const [idleTime, setIdleTime] = useState(0);
  const [shaking, setShaking] = useState(false);
  const [toastInfo, setToastInfo] = useState(null);
  const [apiOnline, setApiOnline] = useState(true);
  const [sessionId, setSessionId] = useState(null);

  // ---- Refs for timers (prevents race conditions) ----
  const watchdogRef = useRef(null);
  const countdownRef = useRef(null);
  const idleTickRef = useRef(null);
  const editorRef = useRef(null);
  const stateRef = useRef('NORMAL');
  const codeRef = useRef(code);

  // Keep refs in sync
  useEffect(() => { stateRef.current = appState; }, [appState]);
  useEffect(() => { codeRef.current = code; }, [code]);

  // ---- Initialize session with backend ----
  useEffect(() => {
    async function initSession() {
      const result = await createSession();
      if (result.success && result.session_id) {
        setSessionId(result.session_id);
        setApiOnline(true);
      } else {
        setApiOnline(false);
        setSessionId('LOCAL-' + Math.random().toString(36).substring(2, 8).toUpperCase());
      }
    }
    initSession();
  }, []);

  // ---- Send audit event (fire-and-forget, never blocks UI) ----
  const sendAudit = useCallback((eventType, message, charsDeleted = 0) => {
    if (!sessionId) return;
    recordAudit({
      session_id: sessionId,
      event_type: eventType,
      message,
      characters_deleted: Math.min(charsDeleted, 10),
    }).then((res) => {
      if (res.offline) setApiOnline(false);
    }).catch(() => {});
  }, [sessionId]);

  // ---- Clear all timers helper ----
  const clearAllTimers = useCallback(() => {
    if (watchdogRef.current) { clearTimeout(watchdogRef.current); watchdogRef.current = null; }
    if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
    if (idleTickRef.current) { clearInterval(idleTickRef.current); idleTickRef.current = null; }
  }, []);

  // ---- STAGE 2: Execute Purge ----
  const executePurge = useCallback(() => {
    clearAllTimers();
    setAppState('PURGING');

    const currentCode = codeRef.current;
    const maxDelete = Math.min(currentCode.length, Math.floor(Math.random() * 10) + 1);
    const actualDeleted = maxDelete;

    // Apply deletion
    const newCode = currentCode.slice(0, currentCode.length - actualDeleted);
    setCode(newCode);
    codeRef.current = newCode;

    // Update statistics
    setPurgeCount((prev) => prev + 1);
    setCharsLost((prev) => prev + actualDeleted);

    // Play shredder sound
    playPurgeSound();

    // Screen shake
    setShaking(true);
    setTimeout(() => setShaking(false), 650);

    // Show toast
    setToastInfo({
      message: actualDeleted > 0 ? 'Efficiency Audit Complete' : 'PURGE FAILED: NOTHING LEFT TO DESTROY',
      charsDeleted: actualDeleted,
    });

    // Send audit to backend
    sendAudit('PURGE', 'Efficiency Audit Complete', actualDeleted);

    // If editor is now empty → auto-load a fresh code file after a short delay
    const isEmptyAfterPurge = newCode.trim().length === 0;

    // Transition to PURGED then back to NORMAL or NEW_FILE_PENDING
    setTimeout(() => {
      if (isEmptyAfterPurge) {
        setAppState('NEW_FILE_PENDING');
      } else {
        setAppState('NORMAL');
        setCountdown(WARNING_DURATION);
        setIdleTime(0);
        startWatchdog();
      }
    }, 800);
  }, [clearAllTimers, sendAudit]);

  // ---- STAGE 1: Start Warning with countdown ----
  const triggerWarning = useCallback(() => {
    if (stateRef.current !== 'NORMAL') return;

    setAppState('WARNING');
    setCountdown(WARNING_DURATION);

    // Play sarcastic alert sound
    playAlertSound();

    // Send IDLE_DETECTED audit
    sendAudit('IDLE_DETECTED', 'Productivity deficit detected');

    // Stop idle tick
    if (idleTickRef.current) { clearInterval(idleTickRef.current); idleTickRef.current = null; }

    // Start 1-second countdown interval
    let remaining = WARNING_DURATION;
    countdownRef.current = setInterval(() => {
      remaining -= 1;
      setCountdown(remaining);

      if (remaining <= 0) {
        if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
        executePurge();
      }
    }, 1000);
  }, [sendAudit, executePurge]);

  // ---- Start the 4-second watchdog ----
  const startWatchdog = useCallback(() => {
    // Clear any existing watchdog & idle tick
    if (watchdogRef.current) { clearTimeout(watchdogRef.current); watchdogRef.current = null; }
    if (idleTickRef.current) { clearInterval(idleTickRef.current); idleTickRef.current = null; }

    setIdleTime(0);

    // Visual idle timer (updates every 100ms for the UI)
    const startTime = Date.now();
    idleTickRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      setIdleTime(elapsed);
    }, 100);

    // The real watchdog: fires after exactly 4 seconds
    watchdogRef.current = setTimeout(() => {
      triggerWarning();
    }, IDLE_THRESHOLD);
  }, [triggerWarning]);

  // ---- Handle user activity (typing / mouse / cursor) ----
  const handleActivity = useCallback(() => {
    const currentState = stateRef.current;

    if (currentState === 'PURGING' || currentState === 'NEW_FILE_PENDING') return;

    // If user types during WARNING → escape!
    if (currentState === 'WARNING') {
      clearAllTimers();
      setAppState('NORMAL');
      setCountdown(WARNING_DURATION);
      setIdleTime(0);
      sendAudit('WARNING_ESCAPED', 'Developer escaped the audit');
      startWatchdog();

      // Refocus the editor
      setTimeout(() => {
        if (editorRef.current) editorRef.current.focus();
      }, 50);
      return;
    }

    // Normal state: just reset watchdog
    startWatchdog();
  }, [clearAllTimers, startWatchdog, sendAudit]);

  // ---- Start watchdog on mount ----
  useEffect(() => {
    startWatchdog();
    return () => clearAllTimers();
  }, [startWatchdog, clearAllTimers]);

  // ---- Type-to-escape callback for WarningModal ----
  const handleTypeEscape = useCallback(() => {
    if (stateRef.current === 'WARNING') {
      handleActivity();
    }
  }, [handleActivity]);

  // ---- Dismiss toast ----
  const dismissToast = useCallback(() => {
    setToastInfo(null);
  }, []);

  // ---- Deploy New File ----
  const handleDeployNewFile = useCallback(() => {
    const currentCode = codeRef.current;
    const freshCode = getRandomSnippet(currentCode);
    setCode(freshCode);
    codeRef.current = freshCode;
    
    setAppState('NORMAL');
    setCountdown(WARNING_DURATION);
    setIdleTime(0);
    startWatchdog();
    
    // Toast notification
    setToastInfo({
      message: 'NEW FILE LOADED — Code deployed. Don\'t stop typing!',
      charsDeleted: 0,
    });
    
    // Focus the editor immediately
    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.focus();
        editorRef.current.selectionStart = freshCode.length;
        editorRef.current.selectionEnd = freshCode.length;
      }
    }, 50);
  }, [startWatchdog]);

  // ---- Snarky menu bar toast ----
  const handleSnarkyToast = useCallback((msg) => {
    setToastInfo({ message: msg, charsDeleted: -1 });
  }, []);

  // ---- Determine container classes ----
  const isDanger = appState === 'WARNING' || appState === 'PURGING';
  let containerClass = 'app-container';
  if (isDanger) containerClass += ' danger';
  if (shaking) containerClass += ' shake';

  return (
    <div className={containerClass}>
      <Header state={appState} apiOnline={apiOnline} />
      <MenuBar onSnarkyToast={handleSnarkyToast} />

      <main className="main-content">
        <ActivityIndicator state={appState} idleTime={idleTime} />

        <CodeEditor
          code={code}
          onCodeChange={setCode}
          onActivity={handleActivity}
          state={appState}
          editorRef={editorRef}
        />

        <StatsBar code={code} purgeCount={purgeCount} charsLost={charsLost} />
      </main>

      <footer className="app-footer">
        <span>EXECUTIVE OVERSIGHT: ACTIVE &nbsp;|&nbsp; REPOSITORY MORALE: {Math.max(0, 100 - purgeCount * 12)}%</span>
        <span>CODE RED v1.0 &nbsp;|&nbsp; TinkerHub Useless Projects 3.0</span>
      </footer>

      {appState === 'WARNING' && (
        <WarningModal countdown={countdown} onTypeEscape={handleTypeEscape} />
      )}

      {appState === 'NEW_FILE_PENDING' && (
        <NewFileModal onActivate={handleDeployNewFile} />
      )}

      {toastInfo && (
        <PurgeToast
          message={toastInfo.message}
          charsDeleted={toastInfo.charsDeleted}
          onDismiss={dismissToast}
        />
      )}
    </div>
  );
}
