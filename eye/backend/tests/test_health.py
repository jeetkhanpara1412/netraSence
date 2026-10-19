def test_health_check(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "database" in data
    assert "model" in data
    assert data["database"]["status"] in {"ok", "error"}
    assert data["model"]["status"] in {"ready", "unavailable"}
    assert "architecture" not in data["model"]
    assert "icdr_classes" not in data["model"]
