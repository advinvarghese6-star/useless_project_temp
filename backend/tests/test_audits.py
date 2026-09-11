def test_audit_event_flow_and_purge(client):
    # 1. Create Session
    session_id = client.post("/api/sessions").json()["session_id"]

    # 2. Record Keystroke Event
    ks_res = client.post("/api/audits", json={
        "session_id": session_id,
        "event_type": "KEYSTROKE",
        "message": "User typed character",
        "characters_deleted": 0
    })
    assert ks_res.status_code == 200

    # 3. Record Idle Event
    idle_res = client.post("/api/audits", json={
        "session_id": session_id,
        "event_type": "IDLE_DETECTED",
        "message": "Productivity deficit detected",
        "characters_deleted": 0
    })
    assert idle_res.status_code == 200

    # 4. Record Warning Escaped Event
    escape_res = client.post("/api/audits", json={
        "session_id": session_id,
        "event_type": "WARNING_ESCAPED",
        "message": "Developer escaped the audit",
        "characters_deleted": 0
    })
    assert escape_res.status_code == 200

    # 5. Record Purge Event with 7 characters deleted
    purge_res = client.post("/api/audits", json={
        "session_id": session_id,
        "event_type": "PURGE",
        "message": "Efficiency Audit Complete",
        "characters_deleted": 7
    })
    assert purge_res.status_code == 200

    # 6. Verify Session Aggregates
    session_res = client.get(f"/api/sessions/{session_id}")
    session_data = session_res.json()["session"]
    assert session_data["total_keystrokes"] == 1
    assert session_data["total_purges"] == 1
    assert session_data["characters_deleted"] == 7

    # 7. Audit History
    history_res = client.get(f"/api/audits/{session_id}")
    assert history_res.status_code == 200
    history_data = history_res.json()
    assert history_data["success"] is True
    assert len(history_data["events"]) == 5  # SESSION_STARTED + 4 events

    # 8. Session Statistics
    stats_res = client.get(f"/api/statistics/{session_id}")
    assert stats_res.status_code == 200
    stats = stats_res.json()["statistics"]
    assert stats["keystrokes"] == 1
    assert stats["purges"] == 1
    assert stats["characters_deleted"] == 7
    assert stats["idle_events"] == 1
    assert stats["warnings_escaped"] == 1

    # 9. Global Statistics
    global_stats_res = client.get("/api/statistics")
    assert global_stats_res.status_code == 200
    global_stats = global_stats_res.json()["statistics"]
    assert global_stats["total_sessions"] >= 1
    assert global_stats["total_purges"] >= 1
    assert global_stats["total_characters_deleted"] >= 7

def test_audit_validation_failures(client):
    session_id = client.post("/api/sessions").json()["session_id"]

    # Invalid characters_deleted (> 10)
    res1 = client.post("/api/audits", json={
        "session_id": session_id,
        "event_type": "PURGE",
        "message": "Too many deleted",
        "characters_deleted": 11
    })
    assert res1.status_code == 422

    # Invalid characters_deleted (< 0)
    res2 = client.post("/api/audits", json={
        "session_id": session_id,
        "event_type": "PURGE",
        "message": "Negative deleted",
        "characters_deleted": -1
    })
    assert res2.status_code == 422

    # Invalid event_type
    res3 = client.post("/api/audits", json={
        "session_id": session_id,
        "event_type": "INVALID_EVENT",
        "message": "Bad type",
        "characters_deleted": 0
    })
    assert res3.status_code == 422
