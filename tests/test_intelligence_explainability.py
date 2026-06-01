"""Regression coverage for transaction explainability API behavior."""

from types import SimpleNamespace

import numpy as np
from fastapi import FastAPI
from fastapi.testclient import TestClient

from src.api.routes.intelligence import router


class FakeClassifier:
    is_fitted = True

    def predict_proba(self, features):
        assert features.shape == (1, 3)
        return np.array([0.86], dtype=np.float32)


class FakeExplainer:
    FEATURE_DESCRIPTIONS = {"f1": "Velocity spike"}

    def __init__(self):
        self.received_feature_names = None

    def explain_transaction(self, features, txn_id, risk_score, feature_names=None):
        self.received_feature_names = feature_names
        return SimpleNamespace(
            txn_id=txn_id,
            risk_score=risk_score,
            narrative="High risk because velocity spiked.",
            contributions=[
                SimpleNamespace(
                    feature_name="f1",
                    feature_value=float(features[0, 0]),
                    shap_value=0.42,
                    direction="risk_increase",
                )
            ],
        )


def _client(orch):
    app = FastAPI()
    app.state.orchestrator = orch
    app.include_router(router)
    return TestClient(app)


def test_explain_transaction_uses_cached_pipeline_features():
    explainer = FakeExplainer()
    orch = SimpleNamespace(
        _shap_explainer=explainer,
        _classifier=FakeClassifier(),
        _engine=SimpleNamespace(
            _feature_cache={"TXN-1": (np.array([1.0, 2.0, 3.0], dtype=np.float32), ["f1", "f2", "f3"])}
        ),
    )

    response = _client(orch).post("/api/v1/intelligence/explain", json={"txn_id": "TXN-1"})

    assert response.status_code == 200
    payload = response.json()
    assert payload["feature_source"] == "feature_cache"
    assert payload["feature_count"] == 3
    assert payload["verdict"] == "FRAUD"
    assert payload["attribution_method"] == "model attribution"
    assert payload["model_reasoning"]["source"] == "classifier_attribution_and_union_bank_heuristics"
    assert payload["model_reasoning"]["risk_drivers"] == ["f1"]
    assert payload["top_features"][0]["direction"] == "increases_risk"
    assert payload["top_features"][0]["description"] == "Velocity spike"
    assert explainer.received_feature_names == ["f1", "f2", "f3"]


def test_explain_transaction_includes_domain_heuristic_sidecar_controls():
    explainer = FakeExplainer()
    orch = SimpleNamespace(
        _shap_explainer=explainer,
        _classifier=FakeClassifier(),
        _engine=SimpleNamespace(
            _feature_cache={"TXN-UBI": (np.array([1.0, 2.0, 3.0], dtype=np.float32), ["f1", "f2", "f3"])},
            _domain_feature_cache={
                "TXN-UBI": (
                    {
                        "ubi_rbi_reportable_ge_1l": 1.0,
                        "ubi_upi_mule_split_amount": 1.0,
                    },
                    [
                        "RBI/MoF fraud reporting threshold crossed: prepare police/CBI review if fraud is confirmed.",
                        "UPI mule split signal: small rapid payment requires velocity and network review.",
                    ],
                )
            },
        ),
    )

    response = _client(orch).post("/api/v1/intelligence/explain", json={"txn_id": "TXN-UBI"})

    assert response.status_code == 200
    payload = response.json()
    assert payload["feature_source"] == "feature_cache"
    assert payload["domain_feature_count"] == 2
    assert payload["domain_features"]["ubi_rbi_reportable_ge_1l"] == 1.0
    assert payload["model_reasoning"]["heuristic_control_count"] == 2
    assert "Union Bank controls fired" in payload["model_reasoning"]["summary"]
    assert any("RBI/MoF fraud reporting threshold" in item for item in payload["domain_controls"])
    assert any("UPI mule split signal" in item for item in payload["domain_controls"])


def test_explain_transaction_reports_missing_cached_features():
    orch = SimpleNamespace(
        _shap_explainer=FakeExplainer(),
        _classifier=FakeClassifier(),
        _engine=SimpleNamespace(_feature_cache={}),
    )

    response = _client(orch).post("/api/v1/intelligence/explain", json={"txn_id": "missing"})

    assert response.status_code == 200
    assert "features not found" in response.json()["error"]


def test_global_importance_uses_cached_feature_matrix_and_returns_record():
    class GlobalExplainer(FakeExplainer):
        def global_feature_importance(self, features=None, feature_names=None):
            assert features.shape == (2, 3)
            assert feature_names == ["f1", "f2", "f3"]
            return [
                {"feature": "f2", "importance": 0.7, "description": "second"},
                {"feature": "f1", "importance": 0.3, "description": "first"},
            ]

        def snapshot(self):
            return {"method": "XGBoost gain fallback"}

    orch = SimpleNamespace(
        _shap_explainer=GlobalExplainer(),
        _classifier=FakeClassifier(),
        _engine=SimpleNamespace(
            _feature_cache={
                "TXN-1": (np.array([1.0, 2.0, 3.0], dtype=np.float32), ["f1", "f2", "f3"]),
                "TXN-2": (np.array([4.0, 5.0, 6.0], dtype=np.float32), ["f1", "f2", "f3"]),
            }
        ),
    )

    response = _client(orch).get("/api/v1/intelligence/explainability/global")

    assert response.status_code == 200
    payload = response.json()
    assert payload["feature_importance"] == {"f2": 0.7, "f1": 0.3}
    assert payload["snapshot"]["feature_source"] == "feature_cache"
    assert payload["snapshot"]["sample_count"] == 2
    assert payload["snapshot"]["model_ready"] is True


def test_drift_status_reports_warming_instead_of_false_no_reference():
    class WarmingDetector:
        def check_drift(self, force=False):
            assert force is True
            return None

        def get_latest_report(self):
            return None

        def snapshot(self):
            return {"reference_size": 1009, "current_window_size": 17}

    orch = SimpleNamespace(
        _shap_explainer=FakeExplainer(),
        _classifier=FakeClassifier(),
        _engine=SimpleNamespace(_feature_cache={}),
        _drift_detector=WarmingDetector(),
    )

    response = _client(orch).get("/api/v1/intelligence/drift")

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "warming"
    assert payload["reference_size"] == 1009
    assert payload["current_size"] == 17
    assert "Reference distribution is ready" in payload["message"]


def test_drift_status_ready_uses_real_report_fields():
    severity = SimpleNamespace(name="LOW")
    report = SimpleNamespace(
        severity=severity,
        psi_score=0.1234567,
        ks_statistic=0.2,
        ks_p_value=0.03,
        js_divergence=0.04,
        window_size=500,
        recommendation="Continue monitoring.",
    )
    drifting = SimpleNamespace(feature_name="vel_txn_count_24h", psi_score=0.25, severity=severity)

    class ReadyDetector:
        def check_drift(self, force=False):
            assert force is True
            return report

        def snapshot(self):
            return {"reference_size": 1009, "current_window_size": 500}

        def get_drifting_features(self):
            return [drifting]

    orch = SimpleNamespace(
        _shap_explainer=FakeExplainer(),
        _classifier=FakeClassifier(),
        _engine=SimpleNamespace(_feature_cache={}),
        _drift_detector=ReadyDetector(),
    )

    response = _client(orch).get("/api/v1/intelligence/drift")

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "ready"
    assert payload["severity"] == "LOW"
    assert payload["psi"] == 0.123457
    assert payload["reference_size"] == 1009
    assert payload["current_size"] == 500
    assert payload["feature_drift"][0]["feature"] == "vel_txn_count_24h"
