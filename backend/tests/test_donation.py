import pytest

from app.core.config import get_settings
from app.integrations import stripe_payments
from app.repositories import nonprofit_repository as np_repo
from app.utils.receipt import compute_receipt_dollars
from tests.helpers import login_as, make_live_event, me_id


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


async def _live_event(client, db_session, email, nonprofit_id=None):
    headers = await login_as(client, email, "se")
    ev = await make_live_event(
        db_session, organizer_id=await me_id(client, headers), nonprofit_id=nonprofit_id
    )
    return headers, ev


async def _donate(client, headers, ev, amount=25, card="4242424242424242", name=None):
    body = {"event_id": ev.id, "amount": amount, "card_number": card}
    if name:
        body["public_name"] = name
    return await client.post("/api/v1/donations", headers=headers, json=body)


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
async def test_mock_provider_successful_donation_updates_event(client, db_session):
    headers, ev = await _live_event(client, db_session, "d1@e.com")
    resp = await _donate(client, headers, ev, 25, name="Generous Gus")
    assert resp.status_code == 201
    body = resp.json()
    assert body["status"] == "Successful"
    assert body["provider"] == "mock"
    assert body["donation"] == 25.0
    assert body["payment_ref"]

    detail = (await client.get(f"/api/v1/events/{ev.key}")).json()
    assert detail["raised"] == 25
    assert detail["backed"] == 1

    backers = (await client.get(f"/api/v1/events/{ev.key}/backers")).json()
    assert any(b["public_name"] == "Generous Gus" for b in backers)


@pytest.mark.asyncio
async def test_mock_provider_failed_donation_leaves_event_unchanged(client, db_session):
    headers, ev = await _live_event(client, db_session, "d2@e.com")
    resp = await _donate(client, headers, ev, 40, card="4000000000000002")
    assert resp.status_code == 201
    assert resp.json()["status"] == "Failed"

    detail = (await client.get(f"/api/v1/events/{ev.key}")).json()
    assert detail["raised"] == 0
    assert detail["backed"] == 0


@pytest.mark.asyncio
async def test_donation_amount_bounds(client, db_session):
    headers, ev = await _live_event(client, db_session, "d2b@e.com")
    assert (await _donate(client, headers, ev, 0.5)).status_code == 400
    assert (await _donate(client, headers, ev, 50_000)).status_code == 400


@pytest.mark.asyncio
async def test_donation_requires_live_event(client, db_session):
    headers = await login_as(client, "d2c@e.com", "se")
    draft = (await client.post("/api/v1/events", headers=headers, json={"story": "x"})).json()
    resp = await client.post(
        "/api/v1/donations", headers=headers, json={"event_id": draft["id"], "amount": 25}
    )
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_guest_lead_can_donate(client, db_session):
    tokens = (
        await client.post("/api/v1/auth/identity-gate", json={"phone": "+15551230000"})
    ).json()
    guest_headers = {"Authorization": f"Bearer {tokens['access_token']}"}
    _creator, ev = await _live_event(client, db_session, "d3@e.com")
    resp = await _donate(client, guest_headers, ev, 30)
    assert resp.status_code == 201
    assert resp.json()["status"] == "Successful"


@pytest.mark.asyncio
async def test_donor_can_read_receipt(client, db_session):
    headers, ev = await _live_event(client, db_session, "d4@e.com")
    created = (await _donate(client, headers, ev, 25)).json()
    got = await client.get(f"/api/v1/donations/{created['id']}", headers=headers)
    assert got.status_code == 200
    assert got.json()["id"] == created["id"]
    receipt = await client.get(f"/api/v1/donations/{created['id']}/receipt", headers=headers)
    assert receipt.status_code == 200
    assert receipt.json()["total"] == created["total"]


@pytest.mark.asyncio
async def test_receipt_is_not_public_and_not_enumerable(client, db_session):
    headers, ev = await _live_event(client, db_session, "d5@e.com")
    created = (await _donate(client, headers, ev, 25)).json()
    anon = await client.get(f"/api/v1/donations/{created['id']}")
    assert anon.status_code == 401
    stranger = await login_as(client, "stranger@e.com", "se")
    other = await client.get(f"/api/v1/donations/{created['id']}", headers=stranger)
    missing = await client.get("/api/v1/donations/999999", headers=stranger)
    assert other.status_code == 404
    assert other.json() == missing.json()  # indistinguishable from "doesn't exist"


@pytest.mark.asyncio
async def test_organizer_and_platform_admin_can_read_receipt(client, db_session):
    organizer, ev = await _live_event(client, db_session, "d6@e.com")
    donor = await login_as(client, "d6donor@e.com", "se")
    created = (await _donate(client, donor, ev, 25)).json()
    assert (await client.get(f"/api/v1/donations/{created['id']}", headers=organizer)).status_code == 200
    admin = await login_as(client, "d6admin@e.com", "platform_admin")
    assert (await client.get(f"/api/v1/donations/{created['id']}", headers=admin)).status_code == 200


# ----------------------------------------------------------- settlement gate

@pytest.mark.asyncio
async def test_frozen_nonprofit_cannot_receive_donations(client, db_session):
    np = await np_repo.create(
        db_session, name="Frozen NP", slug="frozen-np", category="Community",
        verified=True, status="Active", settlement_status="Frozen",
    )
    headers, ev = await _live_event(client, db_session, "d7@e.com", nonprofit_id=np.id)
    resp = await _donate(client, headers, ev, 25)
    assert resp.status_code == 409
    assert resp.json()["error"]["code"] == "settlement_unavailable"


# ------------------------------------------------------------- real Stripe

class FakeStripe:
    """Replaces integrations.stripe_payments network calls."""

    def __init__(self):
        self.intents = {}
        self.refunds = []

    async def create_payment_intent(self, **kw):
        pi_id = f"pi_test_{kw['donation_id']}"
        self.intents[pi_id] = {"status": "requires_payment_method", **kw}
        return {"id": pi_id, "client_secret": f"{pi_id}_secret", "status": "requires_payment_method"}

    async def retrieve_payment_intent(self, pi_id):
        i = self.intents[pi_id]
        return {"id": pi_id, "status": i["status"], "amount": i["amount_cents"],
                "currency": "usd", "latest_charge": None}

    async def create_refund(self, pi_id, donation_id):
        self.refunds.append(pi_id)
        return {"id": "re_1", "status": "succeeded"}


@pytest.fixture
def stripe_on(monkeypatch):
    settings = get_settings()
    monkeypatch.setattr(settings, "stripe_secret_key", "sk_test_fake")
    monkeypatch.setattr(settings, "stripe_publishable_key", "pk_test_fake")
    fake = FakeStripe()
    for name in ("create_payment_intent", "retrieve_payment_intent", "create_refund"):
        monkeypatch.setattr(stripe_payments, name, getattr(fake, name))
    return fake


async def _connected_np(db_session, slug="live-np", charges=True):
    np = await np_repo.create(
        db_session, name=slug, slug=slug, category="Community", verified=True,
        status="Active", settlement_status="Ready",
    )
    return await np_repo.update(
        db_session, np, stripe_account_id=f"acct_{slug}", stripe_charges_enabled=charges,
        stripe_payouts_enabled=charges,
    )


@pytest.mark.asyncio
async def test_payments_config(client, stripe_on):
    body = (await client.get("/api/v1/payments/config")).json()
    assert body == {"provider": "stripe", "publishable_key": "pk_test_fake"}


@pytest.mark.asyncio
async def test_stripe_donation_is_pending_until_confirmed(client, db_session, stripe_on):
    np = await _connected_np(db_session)
    headers, ev = await _live_event(client, db_session, "s1@e.com", nonprofit_id=np.id)
    resp = await _donate(client, headers, ev, 50)
    assert resp.status_code == 201
    body = resp.json()
    assert body["status"] == "Initiated"  # never trusted from the browser
    assert body["provider"] == "stripe"
    assert body["client_secret"].endswith("_secret")

    intent = stripe_on.intents[body["payment_ref"]]
    # destination charge: nonprofit receives the donation, platform keeps tip + fee
    assert intent["destination_account"] == "acct_live-np"
    assert intent["amount_cents"] == round(body["total"] * 100)
    assert intent["application_fee_cents"] == round((body["tip"] + body["processing_fee"]) * 100)

    detail = (await client.get(f"/api/v1/events/{ev.key}")).json()
    assert detail["raised"] == 0


@pytest.mark.asyncio
async def test_confirm_finalizes_only_when_stripe_says_succeeded(client, db_session, stripe_on):
    np = await _connected_np(db_session, "np-confirm")
    headers, ev = await _live_event(client, db_session, "s2@e.com", nonprofit_id=np.id)
    created = (await _donate(client, headers, ev, 50)).json()

    still = await client.post(f"/api/v1/donations/{created['id']}/confirm", headers=headers)
    assert still.json()["status"] == "Initiated"

    stripe_on.intents[created["payment_ref"]]["status"] = "succeeded"
    done = await client.post(f"/api/v1/donations/{created['id']}/confirm", headers=headers)
    assert done.json()["status"] == "Successful"
    # Idempotent: confirming again must not double count.
    await client.post(f"/api/v1/donations/{created['id']}/confirm", headers=headers)
    detail = (await client.get(f"/api/v1/events/{ev.key}")).json()
    assert detail["raised"] == 50 and detail["backed"] == 1


@pytest.mark.asyncio
async def test_confirm_only_by_donor(client, db_session, stripe_on):
    np = await _connected_np(db_session, "np-confirm2")
    headers, ev = await _live_event(client, db_session, "s3@e.com", nonprofit_id=np.id)
    created = (await _donate(client, headers, ev, 25)).json()
    other = await login_as(client, "s3other@e.com", "se")
    resp = await client.post(f"/api/v1/donations/{created['id']}/confirm", headers=other)
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_unconnected_nonprofit_blocked_unless_allowed(client, db_session, stripe_on, monkeypatch):
    np = await np_repo.create(
        db_session, name="Unconnected", slug="unconnected", category="Community",
        verified=True, status="Active", settlement_status="Ready",
    )
    headers, ev = await _live_event(client, db_session, "s4@e.com", nonprofit_id=np.id)
    blocked = await _donate(client, headers, ev, 25)
    assert blocked.status_code == 409
    assert blocked.json()["error"]["code"] == "settlement_unavailable"

    monkeypatch.setattr(get_settings(), "allow_unconnected_nonprofits", True)
    allowed = await _donate(client, headers, ev, 25)
    assert allowed.status_code == 201
    assert stripe_on.intents[allowed.json()["payment_ref"]]["destination_account"] is None


# ----------------------------------------------------------------- webhooks

def _webhook(monkeypatch, event):
    monkeypatch.setattr(stripe_payments, "construct_event", lambda payload, sig: event)


@pytest.mark.asyncio
async def test_webhook_requires_valid_signature(client):
    resp = await client.post(
        "/api/v1/webhooks/stripe", content=b"{}", headers={"stripe-signature": "bad"}
    )
    assert resp.status_code in (400, 503)  # unconfigured secret or bad signature


@pytest.mark.asyncio
async def test_webhook_payment_succeeded_then_refund_and_dispute(client, db_session, stripe_on, monkeypatch):
    np = await _connected_np(db_session, "np-hook")
    headers, ev = await _live_event(client, db_session, "w1@e.com", nonprofit_id=np.id)
    created = (await _donate(client, headers, ev, 50)).json()
    pi = created["payment_ref"]

    succeeded = {"type": "payment_intent.succeeded", "data": {"object": {
        "id": pi, "amount": round(created["total"] * 100), "currency": "usd"}}}
    _webhook(monkeypatch, succeeded)
    for _ in range(2):  # Stripe retries deliveries; handler must be idempotent
        assert (await client.post("/api/v1/webhooks/stripe", content=b"{}")).status_code == 200
    detail = (await client.get(f"/api/v1/events/{ev.key}")).json()
    assert detail["raised"] == 50 and detail["backed"] == 1
    got = await client.get(f"/api/v1/donations/{created['id']}", headers=headers)
    assert got.json()["status"] == "Successful"

    _webhook(monkeypatch, {"type": "charge.dispute.created", "data": {"object": {
        "payment_intent": pi, "amount": 5000}}})
    await client.post("/api/v1/webhooks/stripe", content=b"{}")
    got = await client.get(f"/api/v1/donations/{created['id']}", headers=headers)
    assert got.json()["status"] == "Disputed"
    admin = await login_as(client, "w1admin@e.com", "platform_admin")
    excs = (await client.get("/api/v1/admin/exceptions", headers=admin)).json()
    assert any(e["type"] == "Dispute" for e in excs)


@pytest.mark.asyncio
async def test_webhook_amount_mismatch_is_rejected(client, db_session, stripe_on, monkeypatch):
    np = await _connected_np(db_session, "np-mismatch")
    headers, ev = await _live_event(client, db_session, "w2@e.com", nonprofit_id=np.id)
    created = (await _donate(client, headers, ev, 50)).json()
    _webhook(monkeypatch, {"type": "payment_intent.succeeded", "data": {"object": {
        "id": created["payment_ref"], "amount": 100, "currency": "usd"}}})
    resp = await client.post("/api/v1/webhooks/stripe", content=b"{}")
    assert resp.status_code == 200  # acknowledged so Stripe stops retrying
    detail = (await client.get(f"/api/v1/events/{ev.key}")).json()
    assert detail["raised"] == 0  # ...but nothing was credited
    admin = await login_as(client, "w2admin@e.com", "platform_admin")
    excs = (await client.get("/api/v1/admin/exceptions", headers=admin)).json()
    assert any(e["type"] == "Amount mismatch" for e in excs)


@pytest.mark.asyncio
async def test_admin_refund_reverses_totals(client, db_session, stripe_on, monkeypatch):
    np = await _connected_np(db_session, "np-refund")
    headers, ev = await _live_event(client, db_session, "w3@e.com", nonprofit_id=np.id)
    created = (await _donate(client, headers, ev, 50)).json()
    stripe_on.intents[created["payment_ref"]]["status"] = "succeeded"
    await client.post(f"/api/v1/donations/{created['id']}/confirm", headers=headers)

    non_admin = await client.post(f"/api/v1/admin/donations/{created['id']}/refund", headers=headers)
    assert non_admin.status_code == 403
    admin = await login_as(client, "w3admin@e.com", "platform_admin")
    resp = await client.post(f"/api/v1/admin/donations/{created['id']}/refund", headers=admin)
    assert resp.status_code == 200
    assert resp.json()["status"] == "Refunded"
    assert stripe_on.refunds == [created["payment_ref"]]
    detail = (await client.get(f"/api/v1/events/{ev.key}")).json()
    assert detail["raised"] == 0 and detail["backed"] == 0


@pytest.mark.asyncio
async def test_account_updated_webhook_marks_nonprofit_ready(client, db_session, monkeypatch):
    np = await np_repo.create(
        db_session, name="Onboarding", slug="onboarding", category="Community",
        verified=True, status="Active", settlement_status="Not ready",
    )
    await np_repo.update(db_session, np, stripe_account_id="acct_onb")
    _webhook(monkeypatch, {"type": "account.updated", "data": {"object": {
        "id": "acct_onb", "charges_enabled": True, "payouts_enabled": True}}})
    assert (await client.post("/api/v1/webhooks/stripe", content=b"{}")).status_code == 200
    fresh = await np_repo.get_by_id(db_session, np.id)
    await db_session.refresh(fresh)
    assert fresh.stripe_charges_enabled and fresh.settlement_status == "Ready"


@pytest.mark.asyncio
async def test_production_without_stripe_refuses_payments(client, db_session, monkeypatch):
    headers, ev = await _live_event(client, db_session, "prod1@e.com")
    monkeypatch.setattr(get_settings(), "environment", "production")
    resp = await _donate(client, headers, ev, 25)
    assert resp.status_code == 503


# ---------------------------------------------------- nonprofit Connect onboarding

@pytest.mark.asyncio
async def test_np_stripe_status_reports_real_state_and_balance(client, db_session, stripe_on, monkeypatch):
    np = await np_repo.create(
        db_session, name="Connect NP", slug="connect-np", category="Community",
        verified=True, status="Active", settlement_status="Not ready",
    )
    headers = await login_as(client, "connect-admin@e.com", "np_admin")
    await np_repo.link_admin(db_session, await me_id(client, headers), np.id)

    before = (await client.get("/api/v1/np/stripe/status", headers=headers)).json()
    assert before["connected"] is False and before["balance"] is None

    async def fake_create_account(**kw):
        return "acct_new123"

    async def fake_link(account_id, *, refresh_url, return_url):
        assert account_id == "acct_new123"
        assert return_url.endswith("/np/financials?stripe=return")
        return "https://connect.stripe.com/setup/e/acct_new123"

    monkeypatch.setattr(stripe_payments, "create_connect_account", fake_create_account)
    monkeypatch.setattr(stripe_payments, "create_account_link", fake_link)
    link = await client.post("/api/v1/np/stripe/onboarding", headers=headers)
    assert link.status_code == 200
    assert link.json()["url"].startswith("https://connect.stripe.com/")

    async def fake_account(account_id):
        return {"charges_enabled": True, "payouts_enabled": True, "details_submitted": True}

    async def fake_balance(account_id):
        return {"available": 1250.5, "pending": 40.0}

    monkeypatch.setattr(stripe_payments, "retrieve_account", fake_account)
    monkeypatch.setattr(stripe_payments, "retrieve_balance", fake_balance)
    after = (await client.get("/api/v1/np/stripe/status", headers=headers)).json()
    assert after["connected"] and after["charges_enabled"] and after["payouts_enabled"]
    assert after["settlement_status"] == "Ready"
    assert after["balance"] == {"available": 1250.5, "pending": 40.0}


@pytest.mark.asyncio
async def test_np_stripe_endpoints_are_np_admin_only(client, stripe_on):
    se = await login_as(client, "connect-se@e.com", "se")
    assert (await client.get("/api/v1/np/stripe/status", headers=se)).status_code == 403
    assert (await client.post("/api/v1/np/stripe/onboarding", headers=se)).status_code == 403


@pytest.mark.asyncio
async def test_admin_frozen_settlement_survives_stripe_sync(client, db_session, stripe_on, monkeypatch):
    np = await np_repo.create(
        db_session, name="Frozen Sync", slug="frozen-sync", category="Community",
        verified=True, status="Active", settlement_status="Frozen",
    )
    await np_repo.update(db_session, np, stripe_account_id="acct_fz")
    headers = await login_as(client, "fz-admin@e.com", "np_admin")
    await np_repo.link_admin(db_session, await me_id(client, headers), np.id)

    async def ok_account(account_id):
        return {"charges_enabled": True, "payouts_enabled": True, "details_submitted": True}

    async def bal(account_id):
        return {"available": 0.0, "pending": 0.0}

    monkeypatch.setattr(stripe_payments, "retrieve_account", ok_account)
    monkeypatch.setattr(stripe_payments, "retrieve_balance", bal)
    body = (await client.get("/api/v1/np/stripe/status", headers=headers)).json()
    assert body["settlement_status"] == "Frozen"  # an admin freeze is never auto-lifted


# ------------------------------------------------- webhook signature verification

def _signed(secret: str, payload: bytes) -> str:
    import hashlib
    import hmac
    import time

    ts = int(time.time())
    sig = hmac.new(secret.encode(), f"{ts}.".encode() + payload, hashlib.sha256).hexdigest()
    return f"t={ts},v1={sig}"


@pytest.mark.asyncio
async def test_webhook_accepts_platform_and_connect_secrets_and_rejects_others(client, monkeypatch):
    import json

    settings = get_settings()
    monkeypatch.setattr(settings, "stripe_webhook_secret", "whsec_platform")
    monkeypatch.setattr(settings, "stripe_connect_webhook_secret", "whsec_connect")
    body = json.dumps({"id": "evt_1", "object": "event", "type": "ping.unknown",
                       "data": {"object": {}}}).encode()

    for secret in ("whsec_platform", "whsec_connect"):
        ok = await client.post("/api/v1/webhooks/stripe", content=body,
                               headers={"stripe-signature": _signed(secret, body)})
        assert ok.status_code == 200, secret
    bad = await client.post("/api/v1/webhooks/stripe", content=body,
                            headers={"stripe-signature": _signed("whsec_wrong", body)})
    assert bad.status_code == 400
    assert bad.json()["error"]["code"] == "invalid_signature"
    missing = await client.post("/api/v1/webhooks/stripe", content=body)
    assert missing.status_code == 400
