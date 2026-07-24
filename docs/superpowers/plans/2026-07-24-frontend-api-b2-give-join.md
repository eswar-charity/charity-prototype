# Frontend API Integration — Slice B2 Guest Give / Join Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire guest join + mock donation end-to-end against live FastAPI so authenticated users call `POST /events/{id}/join` and `POST /donations` (quote + create + receipt), with identity-gate when unauthenticated, and success screens fed by live event + API receipt fields.

**Architecture:** Add `api/donations.js` + pure receipt helpers moved off `mockData`. Extend event detail Support tabs to collect card digits and call a shared `useDonateFlow` (auth gate → create donation → navigate success with `donationId`). Join already lives in `useEventActions`; verify and ensure post-gate retry. Preserve UI; no redesign.

**Tech Stack:** Existing Vite/React, B0/B1 `api/client.js`, `useAuth`, `useAppToast`/`Toast`, `joinEvent` in `api/events.js`. Node `node:test` for receipt helper parity with backend.

**Spec:** `docs/superpowers/specs/2026-07-24-frontend-api-integration-design.md` §B2.

**Depends on:** B0 + B1 complete. Branch: **`thread-test` only** (do not create a new branch). Backend `http://localhost:8000`.

## Global Constraints

- Preserve UI/UX (mobile + desktop twins); no redesign.
- Do not remove AccessGate or invent backend endpoints.
- Mock Stripe: any card ending in `0002` fails; other cards succeed (pass `card_number` through).
- Default demo success card in UI placeholder: `4242424242424242` (or leave blank — backend treats missing card as success).
- Unauthorized donate/join → existing identity-gate modal/screens; after success, retry action when possible.
- Stage only task-scoped paths; commit per task on `thread-test`.
- Tests: `node --test` for receipt helpers; manual smoke with uvicorn + Vite when available.
- Out of scope: chat/posts still mock; SE/NP/Admin screens (B3–B5).

## File structure

| Path | Responsibility |
|------|----------------|
| `charity-app/src/api/donations.js` | `quoteDonation`, `createDonation`, `getDonation`, `getReceipt` |
| `charity-app/src/utils/donationReceipt.js` | `calcDonationReceipt`, `buildDonationSuccessUrl` (moved from mockData; re-export from mockData for compat) |
| `charity-app/src/utils/donationReceipt.test.js` | parity with backend tip/fee rules |
| `charity-app/src/hooks/useDonateFlow.js` | auth gate + create + navigate |
| Event detail Support tabs (mobile + desktop) | controlled card fields + donate CTA |
| `DonationSuccess.jsx` / `DesktopDonationSuccess.jsx` / `DonationSuccessView.jsx` | live event + optional donation id |
| Desktop join/donate gate modals | drop `events[0]` default from mockData |

---

### Task 1: Donations API + receipt helpers

**Files:**
- Create: `charity-app/src/api/donations.js`
- Create: `charity-app/src/utils/donationReceipt.js`
- Create: `charity-app/src/utils/donationReceipt.test.js`
- Modify: `charity-app/src/data/mockData.js` — re-export helpers from utils (keep existing importers working)

**Interfaces:**
- Consumes: `apiRequest` from `./client.js`
- Produces:
  - `quoteDonation(amount)` → `POST /donations/quote` body `{ amount }` → `{ donation, tip, processing_fee, total }`
  - `createDonation({ eventId, amount, publicName, cardNumber })` → `POST /donations` auth
  - `getDonation(id)` / `getReceipt(id)` → `GET /donations/{id}` / `.../receipt`
  - `calcDonationReceipt(amount)` → `{ donation, tip, processingFee, total }` (camelCase for UI; map `processing_fee` when adapting API)
  - `buildDonationSuccessUrl({ amount, eventKey, returnTo, donorName, publicName, donationId? })`

- [ ] **Step 1: Write failing receipt test**

```js
// charity-app/src/utils/donationReceipt.test.js
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calcDonationReceipt } from './donationReceipt.js';

describe('calcDonationReceipt', () => {
  it('uses $3 tip when donation >= 25', () => {
    const r = calcDonationReceipt(25);
    assert.equal(r.donation, 25);
    assert.equal(r.tip, 3);
    assert.equal(r.processingFee, 1.11); // round(28 * 0.03964, 2)
    assert.equal(r.total, 29.11);
  });

  it('uses 12% tip (min $1) when donation < 25', () => {
    const r = calcDonationReceipt(10);
    assert.equal(r.tip, 1.2);
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

```powershell
cd charity-app; node --test src/utils/donationReceipt.test.js
```

Expected: FAIL (module missing).

- [ ] **Step 3: Implement donationReceipt.js**

```js
export function calcDonationReceipt(amount) {
  const donation = typeof amount === 'number' && amount > 0 ? amount : 25;
  const tip = donation >= 25 ? 3 : Math.max(1, Math.round(donation * 0.12 * 100) / 100);
  const subtotal = donation + tip;
  const processingFee = Math.round(subtotal * 0.03964 * 100) / 100;
  const total = Math.round((subtotal + processingFee) * 100) / 100;
  return { donation, tip, processingFee, total };
}

export function buildDonationSuccessUrl({
  amount = 25,
  eventKey = 'neon-night',
  returnTo = `/guest/event/live/${eventKey}`,
  donorName = 'Sarah King',
  publicName = 'Sarah K.',
  donationId,
} = {}) {
  const params = new URLSearchParams({
    amount: String(amount),
    event: eventKey,
    return: returnTo,
    donor: donorName,
    public: publicName,
  });
  if (donationId != null) params.set('donationId', String(donationId));
  return `/donate/success?${params.toString()}`;
}

/** Map API ReceiptResponse / DonationRead money fields → UI camelCase. */
export function adaptReceipt(api) {
  if (!api) return null;
  return {
    donation: api.donation,
    tip: api.tip,
    processingFee: api.processing_fee ?? api.processingFee,
    total: api.total,
    status: api.status,
    publicName: api.public_name ?? api.publicName,
    id: api.id,
    paymentRef: api.payment_ref ?? api.paymentRef,
  };
}
```

Note: backend `compute_receipt_dollars` uses `round(donation * TIP_RATE, 2)` for tip when &lt; 25 — mirror that (`Math.round(donation * 0.12 * 100) / 100`), not integer `Math.round(donation * 0.12)` alone if that diverges. Align test expected values with a quick Python check if assert fails: `from app.utils.receipt import compute_receipt_dollars; print(compute_receipt_dollars(25))`.

- [ ] **Step 4: Implement donations.js**

```js
import { apiRequest } from './client.js';

export function quoteDonation(amount) {
  return apiRequest('/donations/quote', {
    method: 'POST',
    auth: false,
    body: { amount },
  });
}

export function createDonation({ eventId, amount, publicName, cardNumber }) {
  return apiRequest('/donations', {
    method: 'POST',
    body: {
      event_id: eventId,
      amount,
      public_name: publicName ?? null,
      card_number: cardNumber ?? null,
    },
  });
}

export function getDonation(donationId) {
  return apiRequest(`/donations/${donationId}`, { auth: false });
}

export function getReceipt(donationId) {
  return apiRequest(`/donations/${donationId}/receipt`, { auth: false });
}
```

Confirm `apiRequest` accepts `body` as object and JSON-stringifies (B0 client). If it uses `json:` instead, match existing `auth.js` pattern.

- [ ] **Step 5: Re-export from mockData.js**

Replace the bodies of `calcDonationReceipt` and `buildDonationSuccessUrl` in `mockData.js` with:

```js
export { calcDonationReceipt, buildDonationSuccessUrl } from '../utils/donationReceipt.js';
```

Remove the old function implementations to avoid duplication. Keep other mockData exports unchanged.

- [ ] **Step 6: Run tests — expect PASS**

```powershell
cd charity-app; node --test src/utils/donationReceipt.test.js
```

- [ ] **Step 7: Commit on thread-test**

```bash
git add charity-app/src/api/donations.js charity-app/src/utils/donationReceipt.js charity-app/src/utils/donationReceipt.test.js charity-app/src/data/mockData.js
git commit -m "feat(app): add donations API module and receipt helpers"
```

---

### Task 2: useDonateFlow hook

**Files:**
- Create: `charity-app/src/hooks/useDonateFlow.js`

**Interfaces:**
- Consumes: `useAuth`, `createDonation`, `buildDonationSuccessUrl`, `useNavigate`
- Produces: `{ donate, pending, error }` where `donate({ ev, amount, cardNumber, publicName, returnTo, onNeedAuth })` returns Promise&lt;boolean&gt;

- [ ] **Step 1: Implement hook**

```js
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { createDonation } from '../api/donations.js';
import { buildDonationSuccessUrl } from '../utils/donationReceipt.js';

export function useDonateFlow({ showToast, onNeedAuth } = {}) {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);

  const donate = async ({
    ev,
    amount,
    cardNumber,
    publicName,
    returnTo,
    donorName,
  }) => {
    const amt = typeof amount === 'number' && amount > 0 ? amount : 25;
    if (!isAuthenticated) {
      onNeedAuth?.({ amount: amt, intent: 'donate' });
      return false;
    }
    if (!ev?.id) {
      showToast?.('Event not loaded');
      return false;
    }
    setPending(true);
    setError(null);
    try {
      const donation = await createDonation({
        eventId: ev.id,
        amount: amt,
        publicName: publicName || user?.name || null,
        cardNumber: cardNumber || null,
      });
      if (donation.status === 'Failed') {
        const msg = 'Payment declined. Try another card (cards ending in 0002 fail).';
        setError(msg);
        showToast?.(msg);
        return false;
      }
      const name = donorName || user?.name || 'Donor';
      navigate(
        buildDonationSuccessUrl({
          amount: amt,
          eventKey: ev.key,
          returnTo: returnTo || `/guest/event/live/${ev.key}`,
          donorName: name,
          publicName: donation.public_name || publicName || name,
          donationId: donation.id,
        }),
      );
      return true;
    } catch (err) {
      const msg = err.message || 'Donation failed';
      setError(msg);
      showToast?.(msg);
      return false;
    } finally {
      setPending(false);
    }
  };

  return { donate, pending, error };
}
```

- [ ] **Step 2: Commit**

```bash
git add charity-app/src/hooks/useDonateFlow.js
git commit -m "feat(app): add useDonateFlow for mock Stripe donations"
```

---

### Task 3: Wire mobile event detail donate + post-auth join polish

**Files:**
- Modify: `charity-app/src/screens/guests/EventDetailLive.jsx`
- Modify: `charity-app/src/screens/guests/EventDetailUpcoming.jsx` (if it has Support/donate; if only join/save, skip donate wiring)
- Modify: `charity-app/src/hooks/useEventDetail.js` only if join needs post-gate retry helper (prefer keep as-is)

**Interfaces:**
- Consumes: `useDonateFlow`, `useEventActions` (join already API-backed)

- [ ] **Step 1: SupportTab — controlled card number (Live)**

In `EventDetailLive.jsx` `SupportTab`, add local state for card number (and optional name on card). Pass `cardNumber` into `onDonate`. Keep amount chips. Disable primary button while parent `donatePending`.

Wire parent:

```js
const { donate, pending: donatePending } = useDonateFlow({
  showToast,
  onNeedAuth: () => setShowJoin(true), // or setShowDonateGate if separate
});

const handleDonate = async (amount, cardNumber) => {
  await donate({
    ev,
    amount: amount === 'other' ? 25 : amount,
    cardNumber,
    returnTo: eventLivePath(ev.key, { loggedIn }),
  });
};
```

Remove direct `navigate(buildDonationSuccessUrl(...))` that skips the API.

Optional: after identity gate closes with `isAuthenticated`, do not auto-donate (user taps Donate again) — acceptable UX.

- [ ] **Step 2: Confirm join path**

`handleJoin` via `useEventActions` already calls `joinEvent`. Ensure Join CTA still uses it. No change required unless broken.

- [ ] **Step 3: Commit**

```bash
git add charity-app/src/screens/guests/EventDetailLive.jsx charity-app/src/screens/guests/EventDetailUpcoming.jsx
git commit -m "feat(app): wire mobile event donate to live donations API"
```

---

### Task 4: Wire desktop event detail donate

**Files:**
- Modify: `charity-app/src/screens/guests/desktop/DesktopEventDetail.jsx`
- Modify: `charity-app/src/screens/guests/desktop/DesktopEventDetailUpcoming.jsx` if donate exists

- [ ] **Step 1: Controlled card fields in SupportTab**

Replace uncontrolled card inputs with `value`/`onChange` for card number at minimum. Pass card number to `onDonate(amount, cardNumber)`.

- [ ] **Step 2: useDonateFlow in DesktopEventDetail**

Same pattern as mobile. On unauthenticated: `setShowJoinGate(true)` or existing donate gate modal. Prefer join gate for identity (already wired) unless `DesktopDonateGateModal` is already shown for donate — keep existing modal choice; both use `useIdentityGateFlow`.

- [ ] **Step 3: Commit**

```bash
git add charity-app/src/screens/guests/desktop/DesktopEventDetail.jsx charity-app/src/screens/guests/desktop/DesktopEventDetailUpcoming.jsx
git commit -m "feat(app): wire desktop event donate to live donations API"
```

---

### Task 5: Donation success screens + gate modal mock cleanup

**Files:**
- Modify: `charity-app/src/components/DonationSuccessView.jsx`
- Modify: `charity-app/src/screens/guests/DonationSuccess.jsx`
- Modify: `charity-app/src/screens/desktop/DesktopDonationSuccess.jsx`
- Modify: `charity-app/src/components/desktop/DesktopJoinGateModal.jsx`
- Modify: `charity-app/src/components/desktop/DesktopDonateGateModal.jsx`

- [ ] **Step 1: DonationSuccess — live event + optional receipt**

```js
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import DonationSuccessView from '../../components/DonationSuccessView';
import { getEvent } from '../../api/events.js';
import { getReceipt } from '../../api/donations.js';
import { adaptEvent } from '../../api/adapters/event.js';
import { adaptReceipt, calcDonationReceipt } from '../../utils/donationReceipt.js';

export default function DonationSuccess() {
  const [params] = useSearchParams();
  const amount = Number(params.get('amount')) || 25;
  const eventKey = params.get('event') || 'neon-night';
  const donationId = params.get('donationId');
  const returnTo = params.get('return') || '/guest/feed';
  const donorName = params.get('donor') || 'Donor';
  const publicName = params.get('public') || donorName;

  const [ev, setEv] = useState(null);
  const [receipt, setReceipt] = useState(() => calcDonationReceipt(amount));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await getEvent(eventKey);
        if (!cancelled) setEv(adaptEvent(raw));
      } catch {
        if (!cancelled) setEv(null);
      }
      if (donationId) {
        try {
          const r = await getReceipt(donationId);
          if (!cancelled) setReceipt(adaptReceipt(r));
        } catch { /* keep calc fallback */ }
      }
    })();
    return () => { cancelled = true; };
  }, [eventKey, donationId]);

  return (
    <div className="phone-shell">
      <div className="screen donate-success-screen">
        <DonationSuccessView
          amount={receipt?.donation ?? amount}
          tip={receipt?.tip}
          total={receipt?.total}
          donorName={donorName}
          publicName={receipt?.publicName || publicName}
          eventTitle={ev?.title || 'Event'}
          nonprofit={ev?.nonprofit || 'Nonprofit'}
          returnTo={returnTo}
        />
      </div>
    </div>
  );
}
```

Update `DonationSuccessView` to accept optional `tip`/`total` props and use them instead of always calling `calcDonationReceipt(amount)` when provided. Stop importing `events` from mockData; remove `DEFAULT_EVENT`.

Mirror the same data loading in `DesktopDonationSuccess.jsx`.

- [ ] **Step 2: Gate modals — remove mockData events[0]**

Use empty-string / neutral defaults when props omitted:

```js
eventTitle = 'this event',
nonprofit = 'the nonprofit',
npInitials = 'NP',
npBg = 'var(--primary)',
```

Remove `import { events } from '...mockData'`.

- [ ] **Step 3: Commit**

```bash
git add charity-app/src/components/DonationSuccessView.jsx charity-app/src/screens/guests/DonationSuccess.jsx charity-app/src/screens/desktop/DesktopDonationSuccess.jsx charity-app/src/components/desktop/DesktopJoinGateModal.jsx charity-app/src/components/desktop/DesktopDonateGateModal.jsx
git commit -m "feat(app): live donation success + drop mock defaults from gate modals"
```

---

### Task 6: B2 exit criteria check

**Files:** none required (verification only; fix only if gaps found)

- [ ] **Step 1: Grep for remaining donate/join mock paths**

```powershell
rg -n "buildDonationSuccessUrl|calcDonationReceipt|getEventByKey" charity-app/src/screens/guests charity-app/src/screens/desktop/DesktopDonationSuccess.jsx charity-app/src/components/DonationSuccessView.jsx
rg -n "from ['\"].*mockData" charity-app/src/components/MobileJoinModal.jsx charity-app/src/components/desktop/DesktopJoinGateModal.jsx charity-app/src/components/desktop/DesktopDonateGateModal.jsx
```

Expected: success/donation helpers from `utils/donationReceipt` or API; no mockData in gate modals.

- [ ] **Step 2: Unit tests**

```powershell
cd charity-app; node --test src/utils/donationReceipt.test.js
```

- [ ] **Step 3: Optional live smoke** (skip if API down)

```powershell
# login identity-gate or password, then:
# POST /api/v1/donations/quote {"amount":25}
# POST /api/v1/donations with Bearer + event_id
```

- [ ] **Step 4: If fixes needed, commit; else note N/A in report**

Write `.superpowers/sdd/b2-exit-report.md` with pass/fail checklist.

---

## Self-review (plan vs spec §B2)

| Spec item | Task |
|-----------|------|
| Identity gate → tokens | B0 done; Task 3–4 onNeedAuth |
| Join POST | B1 `useEventActions`; Task 3 verify |
| Donate quote + create + receipt | Tasks 1–5 |
| Join/donate modals | Tasks 3–5 |
| Loading/error/toast | `useDonateFlow` pending + toast |
| Mobile + desktop | Tasks 3–4 + 5 |

No placeholders remaining. Types: `event_id` int, `processing_fee` snake on wire / `processingFee` in UI.
