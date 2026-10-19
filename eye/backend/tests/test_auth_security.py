def test_register_and_login_user(client):
    payload = {
        "email": "patient@example.com",
        "full_name": "Test Patient",
        "password": "TestPassword123!",
    }

    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 201
    body = response.json()
    assert body["user"]["email"] == payload["email"]
    assert body["user"]["role"] == "PATIENT"
    assert "access_token" in body

    bad_login = client.post(
        "/api/auth/login",
        json={"email": payload["email"], "password": "WrongPassword123!"},
    )
    assert bad_login.status_code == 401

    good_login = client.post(
        "/api/auth/login",
        json={"email": payload["email"], "password": payload["password"]},
    )
    assert good_login.status_code == 200
    token = good_login.json()["access_token"]
    assert token

    patients = client.get("/api/patients", headers={"Authorization": f"Bearer {token}"})
    assert patients.status_code == 403


def test_registration_rejects_privileged_roles(client):
    response = client.post(
        "/api/auth/register",
        json={
            "email": "attacker@example.com",
            "full_name": "Untrusted User",
            "password": "TestPassword123!",
            "role": "ADMIN",
        },
    )
    assert response.status_code == 422


def test_protected_endpoints_require_auth(client):
    response = client.get("/api/patients")
    assert response.status_code == 401
    assert response.json()["detail"] == "Authentication required."
