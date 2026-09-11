def test_create_and_get_session(client):
    # Create Session
    response = client.post("/api/sessions")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["status"] == "ACTIVE"
    session_id = data["session_id"]
    assert session_id.startswith("CR-")

    # Get Session
    get_res = client.get(f"/api/sessions/{session_id}")
    assert get_res.status_code == 200
    get_data = get_res.json()
    assert get_data["success"] is True
    assert get_data["session"]["session_id"] == session_id
    assert get_data["session"]["status"] == "ACTIVE"
    assert get_data["session"]["total_keystrokes"] == 0

def test_get_nonexistent_session(client):
    response = client.get("/api/sessions/CR-INVALID")
    assert response.status_code == 404
    data = response.json()
    assert data["success"] is False
    assert data["code"] == "SESSION_NOT_FOUND"

def test_end_session(client):
    create_res = client.post("/api/sessions")
    session_id = create_res.json()["session_id"]

    end_res = client.post(f"/api/sessions/{session_id}/end")
    assert end_res.status_code == 200
    end_data = end_res.json()
    assert end_data["success"] is True
    assert end_data["message"] == "Session completed."
    assert "statistics" in end_data

    # Verify session is now COMPLETED
    get_res = client.get(f"/api/sessions/{session_id}")
    assert get_res.json()["session"]["status"] == "COMPLETED"
