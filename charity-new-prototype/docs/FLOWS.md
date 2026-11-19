# Charity Hub prototype: flow coverage

Source of truth for scope: the real app's route table (`charity-app/src/App.jsx`), `specs/features/F01–F15`, `guestflow.md`,
and the seed identities in `backend/seed`. Every flow below is built against one shared domain engine
(`src/domain`), so a journey carries across roles: an SE submits, the nonprofit approves, guests join and give,
the SE checks people in, the admin audits it.

Spec items marked ❌ Missing in the real app but described as intended behaviour (moderation F08, payouts view F10,
working autopilot F06) are built here as working prototype flows and labelled as such.

## Architecture (read before building)

| Layer | Where | Notes |
|---|---|---|
| Domain engine | `src/domain/engine.js` | One entry point: `dispatch(type, payload)` → `{ok,data}` or `{ok:false,error:{code,message,status}}`. All rules, state machines, permissions, notifications and audit live here, with 43 tests. **Read it for every action's payload and error codes.** |
| Selectors | `src/domain/selectors.js` | `visibility`, `feed`, `timing`, `leaderboard`, `npSetupSteps`, `adminMetrics`, `postsFor`, `chatFor`, `seEvents`, `npEvents`, … |
| React bindings | `src/domain/store.jsx` | `useDomain()` (whole state), `useSession()` (`{user, session, now}`), `useAct()`, `useEngineHandle()` |
| UI kit | `src/ui/kit.jsx` | `PageHeader, Section, Empty, Stat/StatRow, Field + fieldProps, Tabs, QR, Modal, StatusBadge, useRun, useToast, useConfirm`, formatters |
| Gate | `src/ui/Gate.jsx` | `const {ensureIdentity} = useGate(); if (await ensureIdentity({action:'join', event})) run(...)` |
| Shells + guards | `src/ui/RoleShell.jsx`, `Guards.jsx` | `/se`, `/np`, `/admin` are guarded shells. Wrong role → role home + notice. |
| Design system | `src/styles/tokens.css`, `ch.css`, `app.css`, `shell.css` | Official Charity Hub design system. Reuse `ch-*` classes. |
| Brand pieces | `src/components/Brand.jsx`, `Cards.jsx` | `Avatar, Attendance, CauseBadge, LivePill, Reveal`, `EventCard`, `NonprofitCard`, `JoinButton` (JoinButton/EventCard still read the OLD store: the guest build rewrites them onto the domain) |

Performing an action in a screen: `const run = useRun(); run('approveEvent', { key }, { success: 'Event approved', onOk })`.
Errors surface automatically as plain-language toasts. Never write your own error strings for engine errors.

## Roles and demo identities (from backend/seed)

| Role | Who | Home |
|---|---|---|
| Guest (anonymous → guest lead via the gate) | Marcus L., Emma J. (leads) | `/` |
| SE | Mike Rivera, Jordan Blake, Sam Okonkwo, Priya Desai | `/se` |
| NP admin | one per nonprofit, e.g. `aspca@charityhub.com`, `unitedway@charityhub.com`, `sierraclub@charityhub.com`, `stjude@charityhub.com` | `/np` |
| Platform admin | Alex Mercer `alex.mercer@charityhub.com` | `/admin` |

Demo accounts accept any password of 8+ characters. The Demo tools panel (bottom-left) switches person, moves the clock and resets data.

## Route contract (cross-links depend on these exact paths)

**Public (owner: guest build)**: `/`, `/events/:key`, `/nonprofits`, `/nonprofits/:slug`, `/causes`, `/how-it-works`, `/organizers/:id`, `/donate/success/:id`, `/saved`
**Auth (owner: guest build)**: `/signin`, `/signup`, `/about-you`, `/accept-invite?token=`
**Shared (done)**: `/notifications`
**SE (owner: SE build)**: `/se`, `/se/create`, `/se/create/:key/:step` (1–4), `/se/drafts`, `/se/approval/:key`, `/se/live/:key`, `/se/impact/:key`, `/se/profile`
**NP (owner: NP build)**: `/np`, `/np/setup`, `/np/stripe/callback`, `/np/profile`, `/np/activity`, `/np/financials`, `/np/approvals`, `/np/approvals/:key`, `/np/approvals/:key/request-changes`, `/np/settings/autopilot`, `/np/events`, `/np/events/new`, `/np/events/:key/:step`, `/np/live/:key`
**Admin (owner: admin build)**: `/admin`, `/admin/review`, `/admin/review/:id`, `/admin/nonprofits`, `/admin/nonprofits/:id`, `/admin/events`, `/admin/exceptions`, `/admin/audit`, `/admin/moderation`, `/admin/payments`, `/admin/privacy`

Shared components built once by the SE build and reused by NP (prop `base` sets the route prefix):
`src/roles/se/wizard/EventWizard.jsx` (`<EventWizard base="/se" />` or `base="/np/events"`) and `src/roles/se/live/LiveDashboard.jsx` (`<LiveDashboard base="/se" />` or `base="/np"`).

## Flow checklists (every item must work, with empty/error/permission states)

### Guest + auth
- [x] Home `/`: stage hero (feed events), Discover (3 variants A/B/C via `?variant=`), journey, leaderboard (`selectors.leaderboard`), cause layer, invite form. Search + cause filter. **Empty state** when nothing matches.
- [x] Event page `/events/:key` by `visibility()`: `hidden` → not found; `unavailable` (blocked) → "Temporarily unavailable"; Blocked-for-organizer shows the reason; Archived → read-only banner; Completed → ended; upcoming vs running vs ended framing.
- [x] Tabs About / The room (posts by Before/During/After, replies, likes, host badge, media) / Photos (lightbox); chat panel.
- [x] Gated actions via `ensureIdentity` with contextual copy and resume: Join (then **ticket** modal with QR, in `/saved`), Donate, Save, Like, Post, Reply, Chat, Report content, Follow nonprofit.
- [x] Donation flow: amount presets/custom ($1–$10,000), fee quote (`quote()`), anonymous toggle, name, card form (4242… succeeds, 0002 declines with retry), `createDonation` → `confirmDonation`; success page `/donate/success/:id` with printable receipt and backers.
- [x] Share sheet (ungated): copy link, QR, native share when available.
- [x] Affordance strip for people with extra rights on that event: organizer (Live dashboard / Approval status / Edit), beneficiary NP staff (Review / Live dashboard), admin (Block / Restore link).
- [x] Nonprofit profile: story, mission, stats, public events, Follow (gated); NP admin of it sees a Manage link. Directory with search + cause filter. Causes page. How it works page. Organizer public profile. Saved events + My tickets.
- [x] `/signin`: email + password, Google simulation, errors (invalid, locked, guest has no password, invite pending), role-aware redirect (`?next` only when allowed, else role home + notice). `/signup` (SE only) + Google. `/about-you` edit profile. `/accept-invite?token=`: nonprofit name, name + password, 404 / 410 states, lands on `/np`.

### SE
- [x] `/se` home: next event card + stats, needs-attention (changes requested / rejected), my events by status, recent notifications, create button.
- [x] Wizard 4 steps with save on every step change; photos (upload via file input → object URL, or pick from sample library, remove/reorder, ≥1 to continue); nonprofit picker (only Active + settlement-ready selectable, others disabled with the reason); date/time/location; preview + guidelines + submit. Outcomes: submitted → approval page, auto-approved → live, NP-led → live. **Fix mode** (changes requested: banner + only flagged steps editable) and **rejected edit** (reason banner, first save returns it to Draft). Resume at saved step.
- [x] `/se/drafts`: default Draft / Changes Requested / Rejected, toggle all; Resume, Delete (confirm; Draft/Rejected only), Clone, View status.
- [x] `/se/approval/:key`: status timeline, feedback/reason, Edit & resubmit, Delete, Clone, public page link when Live.
- [x] `/se/live/:key`: summary + five stats, recent donations, post an update (text + media), check-in (scan/type code, duplicate/not-found feedback), walk-in, roster, share QR; non-live banner.
- [x] `/se/impact/:key`: raised, backers, participants, updates, photos; thank-you post; "run it again" (clone).
- [x] `/se/profile`: name, bio, city, phone; public profile link.

### Nonprofit admin
- [x] `/np` Launchpad: setup nudge (n of 4), stats, live events, action items (approvals waiting, documents to re-upload, Stripe), recent donations.
- [x] `/np/setup`: password ✓; three documents (upload pdf/png/jpg; statuses Missing/Uploaded/Approved/Reupload with the admin's note); Stripe create (hosted-onboarding simulation → `/np/stripe/callback`) or link existing; "Verified by Charity Hub" waiting state; done state.
- [x] `/np/stripe/callback` (`?status=success|cancel`), `/np/profile` (edit mission, story, HQ; legal name + EIN read-only; public preview link).
- [x] `/np/activity` and `/np/financials`: totals per event, supporters (respect anonymity), Stripe card (none / incomplete / connected with balance), donations table, payouts (derived weekly from successful donations: Paid / In transit), refunds.
- [x] `/np/approvals`: queue (cover, organizer, date, place, excerpt, age) + decided history; `/np/approvals/:key` full review: Approve, Reject (reason), Request changes (areas + feedback), Report to Charity Hub (reason).
- [x] `/np/settings/autopilot`: enable, checks, trusted SEs, save, explains behaviour, lists recent auto-approvals.
- [x] `/np/events`: all events for the nonprofit with status; create NP-led event (wizard → straight to Live); manage `/np/live/:key` (post updates, check-in).

### Platform admin
- [x] `/admin` dashboard: six metrics, action items, open exceptions, clock + lifecycle job card.
- [x] `/admin/review` filters (status/type/priority) + detail with checks and actions (Start review / Approve / Reject / Close; closed items cannot be re-decided); links to the entity.
- [x] `/admin/nonprofits` list + filters + **invite** (name, category, EIN, email → single-use link with copy); detail: facts, documents panel (view, approve, ask re-upload with note), re-run EIN, Verify (disabled until 3 approved docs, with reason), Reject, Suspend (confirm: blocks live events, holds money), Reinstate, issue/re-issue invite, its events.
- [x] `/admin/events`: filter by status; Block a Live event (reason, hold or refund); Restore (days left until block expiry).
- [x] `/admin/exceptions`: filter; Escalate / Resolve / Reopen. `/admin/audit`: all seven categories + search.
- [x] `/admin/moderation`: content reports with preview; Hide / Remove / Dismiss. `/admin/payments`: donations table + Refund + Mark disputed; per-nonprofit settlement overview. `/admin/privacy`: find a person, anonymize (shows what stays).

## Rules for every screen
- Brand voice from the design system README: sentence case, plain verbs, no donation-led headlines, no "every dollar counts", no invented statistics. Label demo content.
- Status is never colour alone (`StatusBadge` always carries text). Every control reachable by keyboard, visible focus, 44px targets, labelled fields with inline errors (`Field`).
- Responsive down to 390px. Role shells collapse to a menu; tables scroll inside `.table-wrap`.
- Permissions come from the engine (it returns `forbidden`/`unauthenticated`); screens additionally hide actions the person cannot take.
- Tests: each role build ships `src/roles/<role>/<role>.test.jsx` driving the real UI through `renderApp(route, { as })` (`src/test-utils.jsx`), covering the checklist above including error and permission cases.
- Run tests from **PowerShell with an uppercase `C:\` path** (`cd C:\charity-prototype\charity-new-prototype; npx vitest run src/roles/se`), not Git Bash.

## Coverage status

Every checklist item above is built and covered by a test that drives the real UI.

| Suite | Where | Tests |
|---|---|---|
| Domain engine (state machines, permissions, money, notifications, audit) | `src/domain/engine.test.js` | 43 |
| Guest + auth | `src/roles/guest/guest.test.jsx` | 81 |
| Social entrepreneur | `src/roles/se/se.test.jsx` | 37 |
| Nonprofit admin | `src/roles/np/np.test.jsx` | 48 |
| Platform admin | `src/roles/admin/admin.test.jsx` | 38 |
| One event across all four roles + role walls | `src/journey.test.jsx` | 2 |
| Link integrity (no internal link leads to a 404, 7 personas) | `src/links.test.jsx` | 7 |

Routes added beyond the contract: `/np/stripe/hosted` (the clearly labelled simulated Stripe onboarding screen) and `/se/impact` (a list of finished events).

### Prototype behaviour you should know about
- **State** lives in the browser (`localStorage`), so a journey carries across roles on one device. *Demo tools → Reset* restores the seed. Deep links can sign in as a demo person: `/np?as=u_np_aspca`, `/admin?as=u_admin`, `/se?as=u_mike`, `?as=guest`.
- **Payments are simulated** (card 4242… succeeds, 0002 declines). Stripe onboarding, the document viewer and the "open Stripe dashboard" modal are labelled stand-ins. No money moves and no email is sent.
- **Working beyond the real app:** autopilot actually approves trusted SEs (inert in the real app, F06); content moderation (flag → admin hide/remove/dismiss) and a payouts view exist as prototype flows for specs marked missing (F08, F10).
- **Not built:** minor-SE parental consent (F16) and competitions/challenges (F17). The real app does not have them either, and the specs list them as missing and undecided.
- **Photos** a user uploads are temporary browser links and do not survive a reload; the sample library does.
- **Seed events** are demo content (several are status Live though their dates passed): run the lifecycle job from the admin dashboard to complete them.

## SE events console (`/se`)

The SE home is an event-management console built to stay usable at 1,000+ events. All view state lives in the URL, so any view can be bookmarked or shared (`/se?tab=upcoming&cat=Health&sort=going-desc&page=2&view=table`).

- **Pipeline bar:** one bar of Drafts, Needs changes, Waiting for approval, Live now, Upcoming, Closed and Archived, sized by count and clickable as a filter.
- **Overview:** Needs your attention, then Live now, Upcoming, Drafts and Waiting for approval, six events each with "See all N".
- **Workspace:** tabs (Overview, Drafts, Live now, Upcoming, Closed, Archived, All events), search (name, place, nonprofit, cause, status), filters (status, cause, nonprofit, date range or custom dates), sort (date, newest, title, most going, most raised), Cards or Table, pagination (12/24/48/96, windowed page numbers).
- **Cards show what matters for the stage:** drafts show step and what is still missing, waiting shows who and for how long, changes requested show the feedback and flagged areas, rejected shows the reason, live and closed events show raised, going and backers.
- **Actions:** Create, Continue/Edit/Fix and resubmit, Preview, Submit for approval (when a draft is complete), Duplicate, Archive, Restore from archive, Delete (drafts and rejected only). Bulk Duplicate, Archive and Delete on a selection, with the count of events it applies to and why the rest are skipped.
- **Demo data:** *Demo tools → Add 1,000 sample events*, or open `/se?as=u_mike&samples=1000`. Sample events show only in their organizer's own console, never in public feeds, leaderboards, nonprofit queues or admin lists, and send no notifications.
- **Engine additions:** `archiveEvent`, `unarchiveEvent`, `bulkEvents`, `demoGenerateEvents`, `demoRemoveGenerated` (manage.test.js); logic in `src/roles/se/events/model.js` (model.test.js); UI at 1,000+ events in `events.test.jsx`.

## Event wizard stepper (`/se/create`, `/np/events/new`)

A connected stepper replaces the row of step cards: round nodes on a track that fills as steps are finished, with one status per step (Current step, Done, Not done, Locked in fix mode, Needs attention). Finished steps are clickable to go back; the panel slides forward or backward with the direction of travel (off under reduced motion). Step 4 is a checklist of every step with a summary and an Edit or Fix link. On narrow screens it shrinks to nodes and track with the current step named underneath. Tests: `src/roles/se/wizard/stepper.test.jsx`; styles: `src/styles/wizard.css`.
