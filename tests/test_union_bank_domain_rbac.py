"""Union Bank domain feature and RBAC integration tests."""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.testclient import TestClient
import pytest

from src.ingestion.schemas import AccountType, Channel, EventBatch, FraudPattern, Transaction
from src.llm.tools import ToolCall, ToolExecutor
from src.ml.feature_engine import TOTAL_FEATURE_DIM, FeatureEngine


def _txn(amount_paisa: int, channel: Channel = Channel.UPI) -> Transaction:
    return Transaction(
        txn_id="TXN-UBI-DOMAIN-001",
        timestamp=2 * 3600,
        sender_id="00420000001234",
        receiver_id="05420000005678",
        amount_paisa=amount_paisa,
        channel=channel,
        sender_branch="0042",
        receiver_branch="0542",
        sender_geo_lat=28.6139,
        sender_geo_lon=77.2090,
        receiver_geo_lat=19.0760,
        receiver_geo_lon=72.8770,
        device_fingerprint="abcd1234abcd1234",
        sender_account_type=AccountType.SAVINGS,
        receiver_account_type=AccountType.SAVINGS,
        checksum=123,
        fraud_label=FraudPattern.STRUCTURING,
    )


def test_feature_engine_adds_union_bank_domain_sidecar_without_changing_model_shape():
    engine = FeatureEngine()
    txn = _txn(900_000 * 100)
    batch = EventBatch(
        transactions=[txn],
        interbank_messages=[],
        auth_events=[],
        batch_id=1,
        batch_timestamp=txn.timestamp,
        event_count=1,
    )

    result = engine.extract_batch(batch)

    assert result.features.shape == (1, TOTAL_FEATURE_DIM)
    domain_features, controls = engine._domain_feature_cache[txn.txn_id]
    assert domain_features["ubi_rbi_reportable_ge_1l"] == 1.0
    assert domain_features["ubi_structuring_watch_near_10l"] == 1.0
    assert domain_features["ubi_beneficiary_prereg_expected"] == 1.0
    assert any("RBI/MoF fraud reporting threshold" in item for item in controls)
    assert any("Structuring watch" in item for item in controls)


@pytest.mark.asyncio
async def test_llm_tool_exposes_domain_features_for_qwen_reasoning():
    engine = FeatureEngine()
    txn = _txn(900_000 * 100)
    engine.extract_batch(EventBatch([txn], [], [], 1, txn.timestamp, 1))

    result = await ToolExecutor(feature_engine=engine).execute(
        ToolCall("get_ml_feature_analysis", {"txn_id": txn.txn_id, "top_k": 5})
    )

    assert result.success is True
    assert result.data["feature_dim"] == TOTAL_FEATURE_DIM
    assert result.data["domain_feature_dim"] > 0
    assert result.data["domain_features"]["ubi_structuring_watch_near_10l"] == 1.0
    assert result.data["domain_controls"]


def test_rbac_profile_and_explicit_low_privilege_denial():
    from src.api.routes.intel import router as intel_router
    from src.api.routes.rbac import router as rbac_router
    from src.domain.union_bank import ROLE_POLICIES, has_permission

    app = FastAPI()
    app.include_router(intel_router)
    app.include_router(rbac_router)
    client = TestClient(app)

    profile = client.get("/api/v1/rbac/profile", headers={"X-Payflow-Role": "branch_ops"})
    assert profile.status_code == 200
    branch_profile = profile.json()
    assert branch_profile["role"] == "branch_ops"
    assert "customer:contact" in branch_profile["permissions"]
    assert branch_profile["tool_stack"]
    assert branch_profile["decision_authority"]
    assert branch_profile["workflow_steps"]

    denied = client.post("/api/v1/intel/refresh", headers={"X-Payflow-Role": "soc_analyst"})
    assert denied.status_code == 403
    assert denied.json()["detail"]["required_permission"] == "intel:write"

    allowed = client.post("/api/v1/intel/refresh", headers={"X-Payflow-Role": "fraud_analyst"})
    assert allowed.status_code == 200
    assert "signals_added" in allowed.json()

    roles = client.get("/api/v1/rbac/roles")
    assert roles.status_code == 200
    roles_payload = roles.json()
    role_ids = {item["role"] for item in roles_payload["roles"]}
    assert {
        "aml_analyst",
        "principal_officer",
        "efrms_specialist",
        "transaction_officer",
        "fraud_investigator",
        "internal_audit",
    }.issubset(role_ids)
    unit_ids = {item["id"] for item in roles_payload["operating_units"]}
    assert {"aml_kyc", "principal_officer", "internal_audit", "transaction_monitoring"}.issubset(unit_ids)
    assert ROLE_POLICIES["aml_analyst"].reporting_line == "AML Manager / Principal Officer"
    assert has_permission("aml_analyst", "aml:str:draft")
    assert not has_permission("aml_analyst", "regulatory:file")
    assert has_permission("principal_officer", "aml:str:authorize")
    assert has_permission("soc_l2_incident_responder", "soc:isolate")

    workflows = client.get("/api/v1/rbac/workflows")
    assert workflows.status_code == 200
    workflow_ids = {item["id"] for item in workflows.json()["workflows"]}
    assert {"upi_remote_access_scam", "mule_layering_network", "phishing_malware_intrusion"}.issubset(workflow_ids)

    reality = client.get("/api/v1/rbac/reality-check", headers={"X-Payflow-Role": "branch_ops"})
    assert reality.status_code == 200
    reality_payload = reality.json()
    assert reality_payload["floor_level_owner"] is True
    hierarchy_levels = {item["level"] for item in reality_payload["organizational_hierarchy"]}
    assert {"Board Committees", "Executive", "Operational Floor"}.issubset(hierarchy_levels)
    upi_handoff = next(
        item for item in reality_payload["scenario_handoffs"]
        if item["workflow_id"] == "upi_remote_access_scam"
    )
    assert upi_handoff["receives_from"] == "Transaction Officer"
    assert upi_handoff["hands_to"] == "Compliance Officer"
    assert "Confirm customer contact" in upi_handoff["action"]

    model_governance = client.get("/api/v1/rbac/reality-check", headers={"X-Payflow-Role": "data_scientist"})
    assert model_governance.status_code == 200
    assert model_governance.json()["floor_level_owner"] is False
    assert "human authority remains segmented" in model_governance.json()["governance_note"]


def test_rbac_operating_model_exposes_practical_bank_authority_boundaries():
    from src.api.routes.rbac import router as rbac_router

    app = FastAPI()
    app.include_router(rbac_router)
    client = TestClient(app)

    aml = client.get("/api/v1/rbac/operating-model", headers={"X-Payflow-Role": "aml_analyst"})
    assert aml.status_code == 200
    aml_payload = aml.json()
    aml_units = {item["id"] for item in aml_payload["primary_units"]}
    assert {"aml_kyc", "principal_officer"}.issubset(aml_units)
    assert any("No tipping-off" in item["label"] for item in aml_payload["regulatory_obligations"])
    assert any("Principal Officer" in item for item in aml_payload["authority_boundaries"])
    assert aml_payload["source"] == "Uploaded Indian Bank Fraud & Cyber Team Structure operating model"

    fraud = client.get("/api/v1/rbac/operating-model", headers={"X-Payflow-Role": "fraud_analyst"})
    assert fraud.status_code == 200
    fraud_payload = fraud.json()
    assert any("temporary" in item.lower() for item in fraud_payload["authority_boundaries"])
    assert any("committee" in item.lower() for item in fraud_payload["authority_boundaries"])
    assert any(item["id"] == "temporary_vs_enterprise_freeze" for item in fraud_payload["regulatory_obligations"])

    audit = client.get("/api/v1/rbac/operating-model", headers={"X-Payflow-Role": "internal_audit"})
    assert audit.status_code == 200
    audit_payload = audit.json()
    assert any(unit["id"] == "internal_audit" for unit in audit_payload["primary_units"])
    assert any("read-only" in item.lower() for item in audit_payload["authority_boundaries"])
    assert any(item["id"] == "audit_independence" for item in audit_payload["regulatory_obligations"])
    assert any(item["level"] == "Board Committees" for item in audit_payload["organizational_hierarchy"])
