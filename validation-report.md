# Verification Report — Prototype vs. Business Blueprint

**Date:** 2026-07-15
**Prototype:** `charity-app/` (React 19 + Vite + react-router v7)
**Compared against:** Drive **Business Blueprint** folder — Master Product Blueprint, Social Entrepreneur, Guest/Anonymous, Nonprofit Onboarding, Event Complete Journey, Create-Event Detailed Journeys, and Product Discovery journey blueprints, plus a skim of the Nonprofit Atomic Edge-Case Compendium.

**Method note:** This covers **functionality, user flows, screens, CTAs, navigation, and business logic only** — no UI/styling/visual commentary. No files were modified. Findings are based on reading source code and blueprint text; the running app was not driven.

---

## Verdict

The prototype does **not** fully match the Business Blueprint. All four documented personas and their primary screen surfaces exist and are navigable, but there are material gaps in **field completeness, validation/business rules, and actor/permission logic** — most concentrated in the create-event wizard, the identity/donation gates, nonprofit onboarding, and payout/financials.

---

## 1. Matching flows (documented and implemented)

**Cross-product / navigation**
- All four governing personas from Master Blueprint §4 have working entry points via the role picker (`mockData.js`): Nonprofit Admin → `/np/home`, Social Entrepreneur → `/about-you`, Guest → `/guest/feed`, Platform Admin → `/admin`.
- Public discovery with no login wall; identity gates exist as distinct routes (`/guest/join`, `/guest/donate`).

**Guest / Discovery**
- Anonymous feed, public event pages (live + upcoming), nonprofit/cause discovery (`/causes`, `/guest/np/:slug`), share (sheet + QR + copy link), expired-event surface, and donation confirmation/receipt are all present and browsable without an account.
- Join/chat engagement gates trigger identity capture for guests.

**Social Entrepreneur**
- SE registration + profile (photo, bio, city, cause chips), create-event entry points, verified-501(c)(3) directory with search/filter/invite, media+story upload, dates/visibility, review→submit with a content-guidelines checklist and 24–48h SLA banner, approval-status timeline, live monitoring dashboard, and post-event impact recap.

**Nonprofit (event responsibilities)**
- SE-led event approval queue, review-before-publish detail, approve / request-changes (with required feedback), autopilot / trusted-SE auto-approval rules, live-event stats, settlement-ready signal, and verified-501(c)(3) trust badge.

**Admin portal**
- All five documented admin areas: review queue + detail (Approve/Request changes/Escalate/Reject/Reopen), nonprofit register + lifecycle (Verify/Reject/Suspend/Reinstate/Re-run EIN), event oversight, exceptions (payout/donation/content/dispute), and audit log with export.
- Lifecycle state machines in `adminData.js` mirror Blueprint §8 closely; the "EIN must resolve with no manual fallback" rule is explicitly encoded.

---

## 2. Missing elements / features (documented but absent)

### Create-Event wizard (largest cluster — Create-Event Detailed Journeys §2.1/§4.3, SE Blueprint J4)
- **Event Title field** — not collected anywhere; a hashtag is auto-synthesized from the story's first three words. Documented length/profanity/brand-safety validation therefore does not exist.
- **Fundraising Goal** and **Donation configuration** (Standard / Donate-to-Enter / Milestone Unlock) — absent; no goal input, donation-type selector, or donation CTA config.
- **Required-field validation / submit gating** — `SubmitChecklist` is informational only; `submit()` always fires. No End>Start, start≥now, or ≤90-day date checks.
- **Settlement-readiness / verification gate** on the selected nonprofit — selection is never blocked; all orgs are hard-coded verified + settlement-ready.
- **Per-event cause selection and cause-alignment cross-check** (documented as a hard block on no-overlap) — absent.
- **Starter templates**, **Event Type/format enum**, **Activity/Challenge block**, **Team mechanics**, and **Collaborator invites** — none implemented.
- **Media rules** (format/size/dimension limits, required **alt text**, auto content-filter that blocks submit) — not enforced; any `image/*,video/*` accepted.
- **Private-event configuration** — the toggle exists but no invite list, access code, or generated short-link is collected.

### SE registration (Create-Event §4.2, SE Blueprint J3)
- No **18+ age gate**, no **terms acceptance**, no **email verification**.

### Guest / Donation (Guest Blueprint J7/J10, Discovery §9.2)
- **Restricted/unavailable link states** — no invalid-link, private/unpublished, cancelled, removed, or under-review states. Events carry only `isLive`; there is no status/cancelled/published field.
- **"Donation unavailable / settlement not ready" state** — no settlement concept exists; donation is always enabled.
- **Referral / UTM / source attribution** — share links are static strings; no campaign/source parameters generated or read.
- **Guest→create-event conversion gate** — clicking create routes straight to signup with no "identity/SE-profile required" explanation screen.
- **Duplicate-join / "already joined"** state and **post-conversion next-action prompts** (share/follow/explore-similar) — absent.

### Nonprofit persona (Nonprofit Onboarding §4.1–4.10; Event §6)
- **Entire nonprofit self-service onboarding (Stages 0–6, 8–9)** — no registration, EIN/legal-name pre-check, signer verification/MFA, TOS/DPA/AUP acceptance, attestations, W-9, profile-completion wizard, or Stripe Connect KYB. Onboarding/verification exists only from the **Admin** reviewer's side; the nonprofit user starts already-activated.
- **Reject-with-reason** — Reject removes the card / navigates away with no reason capture or SE notification (only Request-changes captures feedback).
- **Complete / Cancel event controls** for the Nonprofit Admin (Event §6.9) — absent.
- **Nonprofit-side moderation queue** (Event §6.6, keep/hide/remove) — only a "Moderate →" link routing into approvals; no moderation UI.
- **Re-approval on SE edit after approval** — not modeled.
- **Editable profile-completion fields** (NTEE, subsector, budget tier, secondary-admin roles) — static/mock only.

### Platform / governance (Master Blueprint §4/§8; Compendium)
- **Minor SE parent/guardian consent journey** — high-severity documented capability exists only as an admin review *item*; there is no minor-indication or guardian-consent route in SE onboarding, and no minor path in the role picker.
- **Founder/Operator role** — repeatedly named as escalation target but has no route, screen, or picker entry; escalations dead-end.
- **Payout / Reconciliation journey** (Journey #7, payout state machine) — no payout-execution/evidence/reconciliation UI for admin or nonprofit.
- **Donation lifecycle beyond happy path** — no failed/refunded/disputed/receipt states for donors.
- **Compendium governance edge cases** — OFAC/PEP/adverse-media/fraud-scoring/Stripe-rejection/DSAR-deletion/admin-security checks have no representation; admin checks model only EIN-format/IRS-BMF/GuideStar/settlement. *(Compendium skimmed, not read line-by-line.)*
- **AI Support (Journey #11)** and **SaaS/Commercial (Journey #12)** — no presence.

---

## 3. Extra elements (in prototype, not in the Business Blueprint)

- **QR attendee check-in scanner** — SE `LiveDashboard`, Admin events ("Scan audit"), nonprofit "Show my QR". Blueprints describe QR/deep-link *generation and share*, not attendance scanning.
- **Standalone organizer public profile** (`/guest/organizer/:slug`) with follow/message/tabs — blueprints define nonprofit/cause discovery, not an SE public profile.
- **"Follow organiser" and "Save/Bookmark event"** guest actions — not enumerated in the guest permission boundary.
- **Donation "Tip to Charity Hub"** receipt line item — not in the documented donation journey.
- **Admin "Invite nonprofit"** action and **GMV-this-week KPI** — onboarding is documented as self-serve; no GMV metric is specified.
- **SE "Official Event Organiser" badge** and **SE-posts-official-update** on LiveDashboard — both listed as *open decisions* in the blueprints but implemented as confirmed.
- **CSV export buttons**, **NotificationBell**, **autopilot candidate-SE add-flow**, **EmptyFeed** notify state, **HowItWorks** marketing page — beyond documented scope.

---

## 4. Flow mismatches / inconsistencies

### Permission / actor logic (most significant)
- **SE self-approves and self-publishes.** In `ApprovalStatus.jsx` the SE clicks "Approve event" → "Go live" → "Complete event," walking their own event through the full lifecycle. Contradicts the confirmed rule that an SE cannot approve/publish a nonprofit-linked event before Nonprofit Admin approval.
- **Auto-publish vs. manual-publish** is internally inconsistent — the approval timeline says "auto-publishes once approved" while the CTA is a manual "Go live"; the two source docs also disagree.
- **Donation identity gate bypassed on the live event page.** In `EventDetailLive.jsx` the Support tab collects card details inline and navigates straight to `/donate/success` with no identity capture — a guest can donate anonymously. The dedicated `IdentityGateDonate` screen exists but the primary donation path never routes through it (the two donation entry points gate differently).
- **Guest "like" is ungated**, contradicting the rule that likes require identity (a code comment even states the deviation).
- **Identity gates don't return the user to the originating action** — join/donate gates route to `/about-you` (SE onboarding) instead of back to the event/donation; no participation record is created; gate inputs accept any/empty value (no validation-error state).
- **Minor SE** is a confirmed persona-variant but is not a selectable onboarding path.

### Wizard / data flow
- **Submitted draft is discarded**; `ApprovalStatus` renders a hard-coded "Coastal Cleanup Drive / Ocean Conservancy" event regardless of what the SE built — the chosen nonprofit and story never carry through.
- **Step order diverges** — prototype is Media+Story → Nonprofit → Dates/Visibility → Preview (4 steps), vs. the documented nonprofit-first, multi-step wizard; several documented steps are dropped in the collapse to 4.
- **"Invite a nonprofit" is cosmetic** — sets a flag but still lets the SE submit as if a real org were selected (blueprint keeps the event in Draft until the org onboards).
- No **autosave + 48h resume reminder**; "Save as draft" just navigates away.

### Nonprofit / Admin data consistency
- **Broken cross-reference:** `AdminNonprofitDetail.jsx` filters events by nonprofit name, but `adminNonprofits` and `adminEvents` share no names — so every nonprofit detail page shows "No events yet" despite non-zero event counts.
- **Counters don't reconcile:** dashboard `openExceptions=4` vs. 3 in the array; NP Launchpad "Pending Approvals: 3" vs. 2 seeded approval cards.
- **Invalid event key resolves to a real event** — `getEventByKey()` returns `events[0]` for any unknown key, so broken links silently open an unrelated live event instead of an error state.
- **All admin events are identical mock rows** (all SE-led/Live/0-flags), so the Events status filters and flag-driven "Moderate" button are unreachable.
- **Verification skips the documented "Verified" state**, moving Submitted/Pending directly to Active.
- **Financials screen is dead code** — `NpFinancials.jsx` (the richest payout surface) is never routed; `/np/financials` redirects to `/np/activity`, which shows a reduced, and divergent, settlement panel.
- **Autopilot enable-state and approval counts differ across screens** (independent local states show the same feature in conflicting on/off states); NP bottom-nav "Events" routes to the SE/guest feed rather than an NP-owned events list; the changes-requested approval card opens an unrelated hard-coded review.

---

## Coverage caveats
- The **Nonprofit Atomic Edge-Case Compendium** (~5 MB) and the **Founder Clarification Questions Workbook** (.xlsm) were only skimmed for headline rules, not exhaustively cross-checked line-by-line.
- The SE Complete Journey doc's tail (traceability/permission matrices, PlantUML appendix) was not fully read, but adds no functional field beyond §1–§6.
