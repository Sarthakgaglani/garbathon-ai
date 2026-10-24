import json
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_health_endpoint():
    resp = client.get("/api/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "healthy"
    assert "gemini_model" in data


def test_calls_manifest_endpoint():
    resp = client.get("/api/calls")
    assert resp.status_code == 200
    calls = resp.json()
    assert len(calls) == 4
    ids = [c["id"] for c in calls]
    assert "scam_digital_arrest" in ids
    assert "genuine_swiggy_delivery" in ids


def test_emergency_alert_stub():
    payload = {
        "contact_phone": "+91 98765 43210",
        "relationship": "Son",
        "elder_name": "Father",
        "detected_flags": ["threat", "money_request"],
    }
    resp = client.post("/api/alerts/emergency", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["simulated"] is True
    assert "Son" in data["relationship"]
    assert "+91 98765 43210" in data["contact"]


def test_scam_replay_stream_events():
    """
    Verifies that scam call stream emits typed SSE events in chronological order:
    call_started -> chunk_analysis -> level_changed -> scam_detected -> alert_sent -> call_ended
    and finishes at Level SCAM.
    """
    events = []
    with client.stream("GET", "/api/calls/scam_digital_arrest/stream?mode=replay&delay_per_chunk=0.01") as resp:
        assert resp.status_code == 200
        current_event = None
        for line in resp.iter_lines():
            line = line.strip()
            if line.startswith("event:"):
                current_event = line.replace("event:", "").strip()
            elif line.startswith("data:") and current_event:
                data_str = line.replace("data:", "").strip()
                events.append((current_event, json.loads(data_str)))
                current_event = None

    event_names = [e[0] for e in events]
    assert "call_started" in event_names
    assert "chunk_analysis" in event_names
    assert "level_changed" in event_names
    assert "scam_detected" in event_names
    assert "alert_sent" in event_names
    assert "call_ended" in event_names

    # Verify final level is SCAM
    call_ended_event = [e[1] for e in events if e[0] == "call_ended"][0]
    assert call_ended_event["final_level"] == "SCAM"


def test_genuine_swiggy_replay_stream_stays_safe():
    """
    Verifies that genuine Swiggy delivery call stream remains SAFE the whole time,
    never emits scam_detected or alert_sent, and finishes at Level SAFE.
    """
    events = []
    with client.stream("GET", "/api/calls/genuine_swiggy_delivery/stream?mode=replay&delay_per_chunk=0.01") as resp:
        assert resp.status_code == 200
        current_event = None
        for line in resp.iter_lines():
            line = line.strip()
            if line.startswith("event:"):
                current_event = line.replace("event:", "").strip()
            elif line.startswith("data:") and current_event:
                data_str = line.replace("data:", "").strip()
                events.append((current_event, json.loads(data_str)))
                current_event = None

    event_names = [e[0] for e in events]
    assert "call_started" in event_names
    assert "chunk_analysis" in event_names
    assert "scam_detected" not in event_names
    assert "alert_sent" not in event_names
    assert "call_ended" in event_names

    call_ended_event = [e[1] for e in events if e[0] == "call_ended"][0]
    assert call_ended_event["final_level"] == "SAFE"
