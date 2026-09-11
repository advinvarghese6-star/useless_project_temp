# Code Red — FastAPI Backend Service

A lightweight, high-performance Python FastAPI backend service for the **Code Red** hackathon application.

The backend serves as the **Session, Audit, and Statistics Engine**, managing user coding sessions, recording watchdog events (`IDLE_DETECTED`, `WARNING_ESCAPED`, `PURGE`), aggregating global & session metrics, and keeping audit logs.

---

## 🏗️ Architecture & Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py            # FastAPI App & CORS setup
│   ├── database.py        # SQLAlchemy Engine & Session provider
│   ├── models/            # SQLAlchemy Database Models
│   │   ├── __init__.py
│   │   ├── session.py     # SessionModel & SessionStatus Enum
│   │   └── audit.py       # AuditEventModel & AuditEventType Enum
│   ├── schemas/           # Pydantic Request/Response Validation Schemas
│   │   ├── __init__.py
│   │   ├── session.py
│   │   └── audit.py
│   ├── services/          # Business Logic & Database Transactions
│   │   ├── __init__.py
│   │   ├── session_service.py
│   │   └── audit_service.py
│   └── routes/            # REST API Route Handlers
│       ├── __init__.py
│       ├── health.py      # Health check endpoints
│       ├── sessions.py    # Session management routes
│       ├── audits.py      # Audit logging routes
│       └── statistics.py  # Aggregated statistics routes
├── tests/                 # Automated Test Suite (Pytest + TestClient)
│   ├── __init__.py
│   ├── conftest.py        # Pytest fixtures & isolated SQLite test DB
│   ├── test_health.py
│   ├── test_sessions.py
│   └── test_audits.py
├── .env                   # Environment variables
├── .gitignore
├── requirements.txt       # Python dependencies
├── run.py                 # Uvicorn entrypoint
└── README.md
```

---

## ⚙️ Requirements & Dependencies

* **Python 3.11+**
* `fastapi`
* `uvicorn`
* `sqlalchemy`
* `pydantic`
* `python-dotenv`
* `pytest` & `httpx` (for testing)

---

## 🚀 Quickstart & Installation

### 1. Change to the backend directory
```bash
cd backend
```

### 2. Create & activate a virtual environment
```bash
# On Windows PowerShell
python -m venv venv
.\venv\Scripts\Activate.ps1

# On Linux / macOS
python3 -m venv venv
source venv/bin/activate
```

### 3. Install dependencies
```bash
pip install -r requirements.txt
```

### 4. Run the application
```bash
python run.py
```

The application will start on `http://localhost:8000`. Interactive OpenAPI documentation will be available at:
* **Swagger UI:** [http://localhost:8000/docs](http://localhost:8000/docs)
* **ReDoc:** [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## 🛠️ Environment Configuration

Create a `.env` file in the `backend/` directory:

```env
DATABASE_URL=sqlite:///./code_red.db
FRONTEND_URL=http://localhost:3000
```

---

## 📡 API Endpoints & Contract

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | Root welcome status |
| `GET` | `/api/health` | Health check API |
| `POST` | `/api/sessions` | Create a new coding session (`CR-XXXXXX`) |
| `GET` | `/api/sessions/{session_id}` | Get session status & statistics |
| `POST` | `/api/sessions/{session_id}/end` | End active session |
| `POST` | `/api/audits` | Log an audit event (`KEYSTROKE`, `IDLE_DETECTED`, `WARNING_ESCAPED`, `PURGE`) |
| `GET` | `/api/audits/{session_id}` | Retrieve audit history for a session |
| `GET` | `/api/statistics` | Retrieve global aggregated statistics |
| `GET` | `/api/statistics/{session_id}` | Retrieve session-specific statistics |

---

## 📝 Request & Response Examples

### 1. Create Session
`POST /api/sessions`

**Response (`200 OK`):**
```json
{
  "success": true,
  "session_id": "CR-A7X29K",
  "status": "ACTIVE",
  "started_at": "2026-09-11T21:00:00.000Z"
}
```

### 2. Log Purge Audit Event
`POST /api/audits`

**Request:**
```json
{
  "session_id": "CR-A7X29K",
  "event_type": "PURGE",
  "message": "Efficiency Audit Complete",
  "characters_deleted": 7
}
```

**Response (`200 OK`):**
```json
{
  "success": true,
  "event": {
    "event_type": "PURGE",
    "message": "Efficiency Audit Complete",
    "characters_deleted": 7,
    "created_at": "2026-09-11T21:04:30.000Z"
  }
}
```

---

## 🧪 Running Tests

The test suite runs against an isolated, in-memory/temporary SQLite database (`test_code_red.db`) and clears it automatically after execution.

Run tests using `pytest`:
```bash
pytest
```

---

## 🔗 Frontend Integration (Next.js)

1. Start session on workspace initialization: `POST /api/sessions`. Save returned `session_id`.
2. When 4 seconds of idle time passes: `POST /api/audits` with `event_type: "IDLE_DETECTED"`.
3. If user resumes typing during 5s countdown: `POST /api/audits` with `event_type: "WARNING_ESCAPED"`.
4. If countdown hits 0 and code is purged: `POST /api/audits` with `event_type: "PURGE"`, sending `characters_deleted`.
5. On session end / page unload: `POST /api/sessions/{session_id}/end`.
