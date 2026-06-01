from __future__ import annotations

from fastapi.testclient import TestClient

import src.api.app as app_module


def test_backend_root_landing_and_app_routes_serve_react_shell_when_built(tmp_path, monkeypatch):
    dist = tmp_path / "dist"
    assets = dist / "assets"
    assets.mkdir(parents=True)
    (dist / "index.html").write_text("<div id=\"root\">react-spa</div>", encoding="utf-8")
    (assets / "app.js").write_text("console.log('payflow')", encoding="utf-8")
    (tmp_path / "landing.html").write_text("<main>fallback landing</main>", encoding="utf-8")

    monkeypatch.setattr(app_module, "PROJECT_ROOT", tmp_path)
    monkeypatch.setattr(app_module, "FRONTEND_DIST", dist)

    client = TestClient(app_module.create_app())

    for path in ["/", "/landing", "/app", "/app/investigations"]:
        response = client.get(path)
        assert response.status_code == 200
        assert "react-spa" in response.text
        assert "fallback landing" not in response.text

    asset_response = client.get("/assets/app.js")
    assert asset_response.status_code == 200
    assert "payflow" in asset_response.text


def test_backend_root_landing_falls_back_to_static_file_without_react_build(tmp_path, monkeypatch):
    dist = tmp_path / "missing-dist"
    (tmp_path / "landing.html").write_text("<main>fallback landing</main>", encoding="utf-8")

    monkeypatch.setattr(app_module, "PROJECT_ROOT", tmp_path)
    monkeypatch.setattr(app_module, "FRONTEND_DIST", dist)

    client = TestClient(app_module.create_app())

    assert "fallback landing" in client.get("/").text
    assert "fallback landing" in client.get("/landing").text
