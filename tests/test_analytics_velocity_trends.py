"""Regression coverage for backend-backed velocity trend sparklines."""

from types import SimpleNamespace
import time

import networkx as nx
from fastapi import FastAPI
from fastapi.testclient import TestClient

from src.api.routes.analytics import router


def _client(graph):
    app = FastAPI()
    app.state.orchestrator = SimpleNamespace(_graph=SimpleNamespace(_graph=graph))
    app.include_router(router)
    return TestClient(app)


def test_velocity_trends_returns_bucketed_backend_series():
    now = time.time()
    graph = nx.MultiDiGraph()
    graph.add_edge(
        "ACCT-A",
        "ACCT-B",
        key="TXN-1",
        timestamp=now - 60,
        amount_paisa=1000,
        fraud_label=1,
    )
    graph.add_edge(
        "ACCT-A",
        "ACCT-C",
        key="TXN-2",
        timestamp=now - 120,
        amount_paisa=2000,
        fraud_label=0,
    )
    graph.add_edge(
        "ACCT-B",
        "ACCT-C",
        key="TXN-OLD",
        timestamp=now - 7200,
        amount_paisa=9000,
        fraud_label=1,
    )

    response = _client(graph).get(
        "/api/v1/analytics/velocity-trends?window_minutes=5&top_n=3&buckets=5"
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["window_minutes"] == 5
    assert payload["bucket_seconds"] == 60
    assert payload["generated_at"] > 0

    account_a = next(item for item in payload["accounts"] if item["account_id"] == "ACCT-A")
    assert account_a["count"] == 2
    assert account_a["volume_paisa"] == 3000
    assert account_a["fraud_count"] == 1
    assert len(account_a["sparkline"]) == 5
    assert len(account_a["fraud_sparkline"]) == 5
    assert sum(account_a["sparkline"]) == 2
    assert sum(account_a["fraud_sparkline"]) == 1
    assert "latest_bucket_count" in account_a
    assert "previous_bucket_count" in account_a


def test_threat_summary_returns_backend_generated_at_when_orchestrator_unavailable():
    app = FastAPI()
    app.state.orchestrator = None
    app.include_router(router)

    response = TestClient(app).get("/api/v1/analytics/threat-summary")

    assert response.status_code == 200
    payload = response.json()
    assert payload["threat_level"] == "unknown"
    assert payload["severity_score"] == 0.0
    assert payload["frozen_count"] == 0
    assert payload["active_attacks"] == 0
    assert payload["indicators"] == []
    assert payload["generated_at"] > 0
