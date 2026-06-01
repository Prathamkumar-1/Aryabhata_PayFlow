from __future__ import annotations

from fastapi import FastAPI
from fastapi.testclient import TestClient

from src.api.routes.analytics import router as analytics_router
from src.api.routes.analyst import clear_store
from src.api.routes.analyst import router as analyst_router
from src.api.routes.fraud import router as fraud_router
from src.api.routes.intelligence import router as intelligence_router
from src.api.routes.simulation import router as simulation_router


def _client(*routers) -> TestClient:
    app = FastAPI()
    app.state.orchestrator = None
    for router in routers:
        app.include_router(router)
    return TestClient(app)


def test_sensitive_banking_post_routes_reject_roles_without_domain_authority():
    client = _client(fraud_router, intelligence_router, simulation_router, analyst_router)
    clear_store()

    denied = client.post(
        "/api/v1/fraud/cfr/check",
        headers={"X-Payflow-Role": "soc_analyst"},
        json={"account_id": "00420000001234"},
    )
    assert denied.status_code == 403
    assert denied.json()["detail"]["required_permission"] == "cfr:check"

    denied = client.post(
        "/api/v1/fraud/aml/integration/inflow",
        headers={"X-Payflow-Role": "branch_ops"},
        json={"account_id": "00420000001234", "amount_paisa": 1000000, "timestamp": 1700000000},
    )
    assert denied.status_code == 403
    assert "aml:cdd" in denied.json()["detail"]["required_any_permission"]

    denied = client.post(
        "/api/v1/simulation/event-lab/preview",
        headers={"X-Payflow-Role": "branch_ops"},
        json={"template_id": "digital_arrest_mule"},
    )
    assert denied.status_code == 403
    assert denied.json()["detail"]["required_permission"] == "simulation:write"

    denied = client.post(
        "/api/v1/intelligence/consortium/check",
        headers={"X-Payflow-Role": "soc_analyst"},
        json={"account_id": "00420000001234"},
    )
    assert denied.status_code == 403
    assert denied.json()["detail"]["required_permission"] == "cfr:check"

    denied = client.post(
        "/api/v1/analyst/escalation",
        headers={"X-Payflow-Role": "branch_ops"},
        json={"txn_id": "TXN-RBAC-001", "node_id": "ACC-RBAC-001"},
    )
    assert denied.status_code == 403
    assert "case:decide" in denied.json()["detail"]["required_any_permission"]


def test_operational_roles_can_reach_matching_guard_before_runtime_availability():
    client = _client(fraud_router, intelligence_router)

    cfr_allowed = client.post(
        "/api/v1/fraud/cfr/check",
        headers={"X-Payflow-Role": "branch_ops"},
        json={"account_id": "00420000001234"},
    )
    assert cfr_allowed.status_code == 200
    assert cfr_allowed.json()["error"] == "Central Fraud Registry not initialized"

    aml_allowed = client.post(
        "/api/v1/fraud/aml/integration/inflow",
        headers={"X-Payflow-Role": "aml_analyst"},
        json={"account_id": "00420000001234", "amount_paisa": 1000000, "timestamp": 1700000000},
    )
    assert aml_allowed.status_code == 200
    assert aml_allowed.json()["error"] == "IntegrationDetector not initialized"

    explain_allowed = client.post(
        "/api/v1/intelligence/explain",
        headers={"X-Payflow-Role": "internal_audit"},
        json={"txn_id": "TXN-404"},
    )
    assert explain_allowed.status_code == 200
    assert explain_allowed.json()["error"] == "Explainability engine not available"


def test_analytics_endpoints_require_analytics_scope():
    client = _client(analytics_router)

    denied = client.get(
        "/api/v1/analytics/threat-summary",
        headers={"X-Payflow-Role": "branch_ops"},
    )
    assert denied.status_code == 403
    assert denied.json()["detail"]["required_permission"] == "analytics:view"

    allowed = client.get(
        "/api/v1/analytics/threat-summary",
        headers={"X-Payflow-Role": "risk_analyst"},
    )
    assert allowed.status_code == 200
    assert allowed.json()["threat_level"] == "unknown"
