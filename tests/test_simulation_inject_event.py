from __future__ import annotations

from types import SimpleNamespace

from fastapi import FastAPI
from fastapi.testclient import TestClient

from src.api.routes.simulation import router


class FakePipeline:
    def __init__(self) -> None:
        self.events = []

    async def ingest(self, event) -> None:
        self.events.append(event)


def _client(pipeline: FakePipeline) -> TestClient:
    app = FastAPI()
    app.state.orchestrator = SimpleNamespace(_pipeline=pipeline)
    app.include_router(router)
    return TestClient(app)


def test_custom_event_normalizes_human_device_fingerprint_before_pipeline() -> None:
    pipeline = FakePipeline()
    response = _client(pipeline).post(
        "/api/v1/simulation/inject-event",
        headers={"X-Payflow-Role": "fraud_analyst"},
        json={
            "event_type": "transaction",
            "sender_id": "UBI900100000001",
            "receiver_id": "MULE900100000099",
            "amount_inr": 425000,
            "channel": "UPI",
            "fraud_label": 3,
            "device_fingerprint": "probe-device-branch-rbac",
        },
    )

    assert response.status_code == 200
    payload = response.json()["event"]
    assert payload["device_fingerprint_normalized"] is True
    assert payload["device_fingerprint_generated"] is False
    assert len(payload["device_fingerprint"]) == 16
    int(payload["device_fingerprint"], 16)
    assert len(pipeline.events) == 1
    assert pipeline.events[0].device_fingerprint == payload["device_fingerprint"]


def test_custom_event_rejects_invalid_enum_values_as_client_errors() -> None:
    response = _client(FakePipeline()).post(
        "/api/v1/simulation/inject-event",
        headers={"X-Payflow-Role": "fraud_analyst"},
        json={
            "event_type": "transaction",
            "sender_id": "UBI900100000001",
            "receiver_id": "MULE900100000099",
            "amount_inr": 425000,
            "channel": "NOT_A_BANK_CHANNEL",
            "fraud_label": 3,
        },
    )

    assert response.status_code == 400
    assert "Invalid channel" in response.json()["detail"]
