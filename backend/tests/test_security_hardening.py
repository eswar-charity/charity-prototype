"""Regression tests for the auth/authorization gaps found in the audit."""
import pytest
from pydantic import ValidationError

from app.core.config import Settings, get_settings
from app.core.security import create_refresh_token
from app.repositories import nonprofit_repository as np_repo
from tests.helpers import login_as, make_live_event, me_id

PW = "Passw0rd!"


# ----------------------------------------------------- identity-gate takeover

@pytest.mark.asyncio
async def test_identity_gate_cannot_take_over_passwordless_se(client, make_user):
    # e.g. an SE who signed up with Google (no password) — role must not be reachable.
    await make_user(role="se", email="google-se@e.com", password=None)
    resp = await client.post("/api/v1/auth/identity-gate", json={"email": "google-se@e.com"})
    assert resp.status_code == 409


@pytest.mark.asyncio
@pytest.mark.parametrize("role", ["np_admin", "platform_admin", "se"])
async def test_identity_gate_never_issues_privileged_sessions(client, make_user, role):
    await make_user(role=role, email=f"{role}-x@e.com", password=None)
    resp = await client.post("/api/v1/auth/identity-gate", json={"email": f"{role}-x@e.com"})
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_identity_gate_still_works_for_guests(client):
    first = await client.post("/api/v1/auth/identity-gate", json={"email": "guest@e.com", "name": "G"})
    again = await client.post("/api/v1/auth/identity-gate", json={"email": "guest@e.com"})
    assert first.status_code == 200 and again.status_code == 200
    me = await client.get(
        "/api/v1/auth/me", headers={"Authorization": f"Bearer {first.json()['access_token']}"}
    )
    assert me.json()["role"] == "guest_lead"


# ------------------------------------------------------------ invite-only NPs

@pytest.mark.asyncio
async def test_cannot_self_register_as_np_admin_or_admin(client):
    for role in ("np_admin", "platform_admin", "guest_lead"):
        resp = await client.post(
            "/api/v1/auth/register",
            json={"name": "X", "email": f"{role}@e.com", "password": PW, "role": role},
        )
        assert resp.status_code == 422, role


@pytest.mark.asyncio
async def test_admin_invites_nonprofit_admin_end_to_end(client):
    admin = await login_as(client, "inv-admin@e.com", "platform_admin")
    created = await client.post(
        "/api/v1/admin/nonprofits/invite", headers=admin,
        json={"name": "Clean Air Alliance", "category": "Environment", "ein": "47-2029183",
              "admin_email": "Dana@CleanAir.org"},
    )
    assert created.status_code == 200
    body = created.json()
    assert body["invite"]["email"] == "dana@cleanair.org"
    url = body["invite"]["invite_url"]
    assert "/accept-invite?token=" in url
    token = url.split("token=")[1]

    preview = await client.get(f"/api/v1/auth/invites/{token}")
    assert preview.status_code == 200
    assert preview.json()["nonprofit"]["name"] == "Clean Air Alliance"

    accepted = await client.post(
        "/api/v1/auth/accept-invite", json={"token": token, "name": "Dana W", "password": PW}
    )
    assert accepted.status_code == 201
    headers = {"Authorization": f"Bearer {accepted.json()['access_token']}"}
    me = (await client.get("/api/v1/auth/me", headers=headers)).json()
    assert me["role"] == "np_admin"
    # Linked to the invited nonprofit.
    profile = await client.get("/api/v1/np/profile", headers=headers)
    assert profile.status_code == 200 and profile.json()["name"] == "Clean Air Alliance"

    # Single use.
    again = await client.post(
        "/api/v1/auth/accept-invite", json={"token": token, "name": "Eve", "password": PW}
    )
    assert again.status_code == 410
    # Password login works afterwards.
    login = await client.post("/api/v1/auth/login", json={"email": "dana@cleanair.org", "password": PW})
    assert login.status_code == 200


@pytest.mark.asyncio
async def test_invite_rejects_garbage_and_expired_tokens(client, db_session):
    assert (await client.get("/api/v1/auth/invites/not-a-real-token-123")).status_code == 404
    admin = await login_as(client, "inv2-admin@e.com", "platform_admin")
    np = await np_repo.create(db_session, name="Old NP", slug="old-np", category="Community")
    invite = (
        await client.post(f"/api/v1/admin/nonprofits/{np.id}/invite-admin", headers=admin,
                          json={"email": "late@old.org"})
    ).json()
    token = invite["invite_url"].split("token=")[1]
    # Re-issuing invalidates the earlier link.
    await client.post(f"/api/v1/admin/nonprofits/{np.id}/invite-admin", headers=admin,
                      json={"email": "late@old.org"})
    resp = await client.post(
        "/api/v1/auth/accept-invite", json={"token": token, "name": "L", "password": PW}
    )
    assert resp.status_code == 410


@pytest.mark.asyncio
async def test_only_platform_admin_can_issue_invites(client, db_session):
    se = await login_as(client, "inv3-se@e.com", "se")
    np = await np_repo.create(db_session, name="NP3", slug="np3", category="Community")
    resp = await client.post(f"/api/v1/admin/nonprofits/{np.id}/invite-admin", headers=se,
                             json={"email": "x@y.org"})
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_invite_for_existing_email_conflicts(client, db_session):
    admin = await login_as(client, "inv4-admin@e.com", "platform_admin")
    await login_as(client, "taken@e.com", "se")
    np = await np_repo.create(db_session, name="NP4", slug="np4", category="Community")
    resp = await client.post(f"/api/v1/admin/nonprofits/{np.id}/invite-admin", headers=admin,
                             json={"email": "taken@e.com"})
    assert resp.status_code == 409


# ------------------------------------------------------- tokens & lockout

async def _tokens(client, email):
    await client.post("/api/v1/auth/register", json={"name": "T", "email": email, "password": PW})
    return (await client.post("/api/v1/auth/login", json={"email": email, "password": PW})).json()


@pytest.mark.asyncio
async def test_refresh_rotates_and_old_token_is_dead(client):
    t1 = await _tokens(client, "rot@e.com")
    r1 = await client.post("/api/v1/auth/refresh", json={"refresh_token": t1["refresh_token"]})
    assert r1.status_code == 200
    t2 = r1.json()
    assert t2["refresh_token"] != t1["refresh_token"]
    # Replaying the old token is treated as theft: it fails AND kills the new one.
    replay = await client.post("/api/v1/auth/refresh", json={"refresh_token": t1["refresh_token"]})
    assert replay.status_code == 401
    after = await client.post("/api/v1/auth/refresh", json={"refresh_token": t2["refresh_token"]})
    assert after.status_code == 401


@pytest.mark.asyncio
async def test_logout_revokes_refresh_token(client):
    t = await _tokens(client, "lo@e.com")
    out = await client.post("/api/v1/auth/logout", json={"refresh_token": t["refresh_token"]})
    assert out.status_code == 200
    resp = await client.post("/api/v1/auth/refresh", json={"refresh_token": t["refresh_token"]})
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_logout_without_body_is_ok(client):
    assert (await client.post("/api/v1/auth/logout")).status_code == 200


@pytest.mark.asyncio
async def test_unknown_refresh_token_rejected(client):
    # Validly signed but never recorded server-side (e.g. minted before rotation shipped).
    resp = await client.post("/api/v1/auth/refresh", json={"refresh_token": create_refresh_token("1")})
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_account_locks_after_repeated_failures(client, monkeypatch):
    monkeypatch.setattr(get_settings(), "login_max_failures", 3)
    await _tokens(client, "lock@e.com")
    for _ in range(3):
        bad = await client.post("/api/v1/auth/login", json={"email": "lock@e.com", "password": "wrong-pw"})
        assert bad.status_code == 401
    # Even the right password is refused while locked.
    locked = await client.post("/api/v1/auth/login", json={"email": "lock@e.com", "password": PW})
    assert locked.status_code == 429
    assert locked.json()["error"]["code"] == "account_locked"


@pytest.mark.asyncio
async def test_successful_login_resets_failure_count(client, monkeypatch):
    monkeypatch.setattr(get_settings(), "login_max_failures", 3)
    await _tokens(client, "reset@e.com")
    for _ in range(2):
        await client.post("/api/v1/auth/login", json={"email": "reset@e.com", "password": "nope-nope"})
    assert (await client.post("/api/v1/auth/login", json={"email": "reset@e.com", "password": PW})).status_code == 200
    for _ in range(2):
        await client.post("/api/v1/auth/login", json={"email": "reset@e.com", "password": "nope-nope"})
    assert (await client.post("/api/v1/auth/login", json={"email": "reset@e.com", "password": PW})).status_code == 200


@pytest.mark.asyncio
async def test_rate_limit_on_identity_gate(client):
    codes = [
        (await client.post("/api/v1/auth/identity-gate", json={"phone": f"+1555000{i:04d}"})).status_code
        for i in range(20)
    ]
    assert 429 in codes
    assert codes[0] == 200


# ------------------------------------------------- np_admin scoping (QR/dashboard)

async def _np_admin(client, db_session, email, slug):
    np = await np_repo.create(db_session, name=slug, slug=slug, category="Community",
                              verified=True, status="Verified", settlement_status="Ready")
    headers = await login_as(client, email, "np_admin")
    await np_repo.link_admin(db_session, await me_id(client, headers), np.id)
    return headers, np


@pytest.mark.asyncio
async def test_np_admin_cannot_staff_another_orgs_event(client, db_session):
    a_headers, a_np = await _np_admin(client, db_session, "npa@e.com", "np-a")
    b_headers, _b_np = await _np_admin(client, db_session, "npb@e.com", "np-b")
    organizer = await login_as(client, "org@e.com", "se")
    ev = await make_live_event(db_session, organizer_id=await me_id(client, organizer),
                               nonprofit_id=a_np.id)

    assert (await client.get(f"/api/v1/events/{ev.id}/attendees", headers=a_headers)).status_code == 200
    assert (await client.get(f"/api/v1/events/{ev.id}/attendees", headers=b_headers)).status_code == 403
    assert (await client.post(f"/api/v1/events/{ev.id}/checkin", headers=b_headers,
                              json={"name": "Walk In"})).status_code == 403
    assert (await client.get(f"/api/v1/se/live-dashboard/{ev.key}", headers=b_headers)).status_code == 403
    assert (await client.get(f"/api/v1/se/live-dashboard/{ev.key}", headers=a_headers)).status_code == 200


# ------------------------------------------------------------------ config

def test_production_rejects_weak_jwt_secret():
    with pytest.raises(ValidationError):
        Settings(environment="production", jwt_secret="change-me")
    with pytest.raises(ValidationError):
        Settings(environment="production", jwt_secret="short")
    ok = Settings(environment="production", jwt_secret="x" * 40)
    assert ok.is_production


def test_dev_allows_default_secret():
    assert not Settings(environment="development", jwt_secret="change-me").is_production
