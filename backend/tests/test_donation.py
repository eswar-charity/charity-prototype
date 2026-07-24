import pytest

from app.utils.receipt import compute_receipt_dollars


def test_receipt_flat_tip_over_25():
    r = compute_receipt_dollars(50)
    assert r["donation"] == 50.0
    assert r["tip"] == 3.0
    assert r["processing_fee"] == round(53 * 0.03964, 2)
    assert r["total"] == round(50 + 3 + r["processing_fee"], 2)


def test_receipt_percent_tip_under_25():
    r = compute_receipt_dollars(10)
    assert r["tip"] == 1.2  # max($1, 12% of 10)
    assert r["processing_fee"] == round(11.2 * 0.03964, 2)


def test_receipt_min_tip_floor():
    r = compute_receipt_dollars(5)
    assert r["tip"] == 1.0  # max($1, $0.60)


async def _login(client, email, role="se"):
    await client.post(
        "/api/v1/auth/register",
        json={"name": "U", "email": email, "password": "Passw0rd!", "role": role},
    )
    tokens = (
        await client.post(
            "/api/v1/auth/login", json={"email": email, "password": "Passw0rd!"}
        )
    ).json()
    return {"Authorization": f"Bearer {tokens['access_token']}"}


async def _make_event(client, headers):
    return (
        await client.post(
            "/api/v1/events", headers=headers,
            json={"story": "Donate here", "category": "Community"},
        )
    ).json()


@pytest.mark.asyncio
async def test_quote_endpoint(client):
    resp = await client.post("/api/v1/donations/quote", json={"amount": 50})
    assert resp.status_code == 200
    assert resp.json()["tip"] == 3.0


@pytest.mark.asyncio
async def test_donate_requires_auth(client):
    resp = await client.post("/api/v1/donations", json={"event_id": 1, "amount": 25})
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_successful_donation_updates_event(client):
    headers = await _login(client, "d1@e.com", "se")
    ev = await _make_event(client, headers)
    resp = await client.post(
        "/api/v1/donations", headers=headers,
        json={"event_id": ev["id"], "amount": 25, "public_name": "Generous Gus",
              "card_number": "4242424242424242"},
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["status"] == "Successful"
    assert body["donation"] == 25.0
    assert body["payment_ref"]

    detail = (await client.get(f"/api/v1/events/{ev['key']}")).json()
    assert detail["raised"] == 25
    assert detail["backed"] == 1

    backers = (await client.get(f"/api/v1/events/{ev['key']}/backers")).json()
    assert any(b["public_name"] == "Generous Gus" for b in backers)


@pytest.mark.asyncio
async def test_failed_donation_leaves_event_unchanged(client):
    headers = await _login(client, "d2@e.com", "se")
    ev = await _make_event(client, headers)
    resp = await client.post(
        "/api/v1/donations", headers=headers,
        json={"event_id": ev["id"], "amount": 40, "card_number": "4000000000000002"},
    )
    assert resp.status_code == 201
    assert resp.json()["status"] == "Failed"

    detail = (await client.get(f"/api/v1/events/{ev['key']}")).json()
    assert detail["raised"] == 0
    assert detail["backed"] == 0


@pytest.mark.asyncio
async def test_guest_lead_can_donate(client):
    tokens = (
        await client.post("/api/v1/auth/identity-gate", json={"phone": "+15551230000"})
    ).json()
    guest_headers = {"Authorization": f"Bearer {tokens['access_token']}"}
    creator = await _login(client, "d3@e.com", "se")
    ev = await _make_event(client, creator)
    resp = await client.post(
        "/api/v1/donations", headers=guest_headers,
        json={"event_id": ev["id"], "amount": 30, "card_number": "4242424242424242"},
    )
    assert resp.status_code == 201
    assert resp.json()["status"] == "Successful"


@pytest.mark.asyncio
async def test_get_donation_and_receipt(client):
    headers = await _login(client, "d4@e.com", "se")
    ev = await _make_event(client, headers)
    created = (
        await client.post(
            "/api/v1/donations", headers=headers,
            json={"event_id": ev["id"], "amount": 25, "card_number": "4242424242424242"},
        )
    ).json()
    got = await client.get(f"/api/v1/donations/{created['id']}")
    assert got.status_code == 200
    assert got.json()["id"] == created["id"]
    receipt = await client.get(f"/api/v1/donations/{created['id']}/receipt")
    assert receipt.status_code == 200
    assert receipt.json()["total"] == created["total"]
