const API_BASE = 'http://localhost:8000';

async function safeFetch(url, options = {}) {
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return { success: false, error: errorData.error || res.statusText, offline: false };
    }
    return await res.json();
  } catch (err) {
    return { success: false, error: err.message, offline: true };
  }
}

export async function createSession() {
  return safeFetch(`${API_BASE}/api/sessions`, { method: 'POST' });
}

export async function getSession(sessionId) {
  return safeFetch(`${API_BASE}/api/sessions/${sessionId}`);
}

export async function endSession(sessionId) {
  return safeFetch(`${API_BASE}/api/sessions/${sessionId}/end`, { method: 'POST' });
}

export async function recordAudit(data) {
  return safeFetch(`${API_BASE}/api/audits`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getAuditHistory(sessionId) {
  return safeFetch(`${API_BASE}/api/audits/${sessionId}`);
}

export async function getStatistics() {
  return safeFetch(`${API_BASE}/api/statistics`);
}

export async function getSessionStatistics(sessionId) {
  return safeFetch(`${API_BASE}/api/statistics/${sessionId}`);
}
