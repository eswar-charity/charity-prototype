// Charity Hub prototype domain engine.
//
// One pure-ish entry point: engine.dispatch(type, payload) → { ok, data } | { ok:false, error:{code,message,status} }.
// Every action runs against a clone of the state and only commits if it does not throw, so a refused
// action never half-applies. Rules, error codes and state machines follow specs/features (F01–F15).
import { buildSeed, DOC_TYPES, initialsOf } from './seed.js'
import { eventStart } from '../lib/format.js'

export class DomainError extends Error {
  constructor(code, message, status = 409, persist = false) { super(message); this.code = code; this.status = status; this.persist = persist }
}
const fail = (code, message, status = 409) => { throw new DomainError(code, message, status) }
/** A refusal that must still be saved (e.g. the failed-attempt counter behind account lockout). */
const failAndSave = (code, message, status = 409) => { throw new DomainError(code, message, status, true) }

export const ROLES = { GUEST: 'guest_lead', SE: 'se', NP: 'np_admin', ADMIN: 'platform_admin' }
export const homeFor = (role) => ({ guest_lead: '/', se: '/se', np_admin: '/np', platform_admin: '/admin' }[role] ?? '/')
export const ROLE_LABEL = { guest_lead: 'Guest', se: 'Social entrepreneur', np_admin: 'Nonprofit admin', platform_admin: 'Charity Hub admin' }

export const CHANGE_AREAS = {
  Photos: ['photos'],
  Story: ['title', 'story', 'mission', 'category'],
  Nonprofit: ['nonprofitId'],
  'Date & place': ['date', 'start', 'end', 'endDate', 'location'],
}
export const EVENT_STATUSES = ['Draft', 'Submitted', 'Changes Requested', 'Rejected', 'Live', 'Completed', 'Archived', 'Blocked']
const EMAIL = /^\S+@\S+\.\S+$/
const DAY = 864e5
const slugify = (s) => s.toLowerCase().replace(/^#/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'event'

/* ------------------------------------------------------------------ helpers (also used by selectors) */
export const npAdminsOf = (s, npId) => Object.values(s.users).filter((u) => u.role === ROLES.NP && u.nonprofitId === npId && u.status === 'active')
export const isOrganizer = (user, ev) => !!user && ev.organizerId === user.id
export const isNpStaffFor = (user, ev) => !!user && user.role === ROLES.NP && !!ev.nonprofitId && user.nonprofitId === ev.nonprofitId
export const endsAt = (ev) => {
  if (!ev.date || !ev.end) return null
  const e = eventStart(ev.endDate || ev.date, ev.end)
  return Number.isNaN(e.getTime()) ? null : e
}
export const startsAt = (ev) => {
  if (!ev.date || !ev.start) return null
  const e = eventStart(ev.date, ev.start)
  return Number.isNaN(e.getTime()) ? null : e
}
export function eventTotals(s, key) {
  const ev = s.events[key]
  const own = s.donations.filter((d) => d.eventKey === key && !d.seeded)
  const ok = own.filter((d) => d.status === 'Successful' || d.status === 'Disputed')
  const posts = s.posts.filter((p) => p.eventKey === key && !p.removed)
  return {
    raised: ev.baseRaised + Math.round(ok.reduce((t, d) => t + d.amountCents, 0) / 100),
    backed: ev.baseBacked + ok.length,
    joined: ev.baseJoined + ev.joinedIds.length,
    chat: ev.baseChat + (s.chat[key]?.length ?? 0),
    updates: posts.filter((p) => p.host).length,
  }
}
export function quote(amountCents, tipCents = 0) {
  if (!Number.isInteger(amountCents) || amountCents < 100 || amountCents > 1_000_000) fail('invalid_amount', 'Amounts run from $1 to $10,000.', 400)
  const fee = Math.round(amountCents * 0.029 + 30)
  return { amountCents, tipCents, feeCents: fee, totalCents: amountCents + tipCents + fee }
}

/* ------------------------------------------------------------------ engine */
export function createEngine(initial = buildSeed(), { storageKey = null } = {}) {
  let state = initial
  const listeners = new Set()
  const commit = (next) => {
    state = next
    if (storageKey && typeof localStorage !== 'undefined') {
      try { localStorage.setItem(storageKey, JSON.stringify(state)) } catch { /* private mode: keep in memory */ }
    }
    listeners.forEach((l) => l())
  }

  function dispatch(type, payload = {}) {
    const handler = handlers[type]
    if (!handler) return { ok: false, error: { code: 'unknown_action', message: `Unknown action ${type}`, status: 400 } }
    const draft = structuredClone(state)
    const ctx = makeCtx(draft)
    try {
      const data = handler(draft, payload, ctx)
      commit(draft)
      return { ok: true, data }
    } catch (e) {
      if (e instanceof DomainError) {
        if (e.persist) commit(draft)
        return { ok: false, error: { code: e.code, message: e.message, status: e.status } }
      }
      throw e
    }
  }

  return {
    getState: () => state,
    subscribe: (l) => { listeners.add(l); return () => listeners.delete(l) },
    dispatch,
    reset: (next = buildSeed()) => commit(next),
  }
}

function makeCtx(s) {
  const actor = s.session.userId ? s.users[s.session.userId] ?? null : null
  return { actor, now: new Date(s.now) }
}
const nextId = (s, p) => `${p}_${++s.seq}`
const requireAuth = (ctx) => { if (!ctx.actor) fail('unauthenticated', 'Sign in to continue.', 401); return ctx.actor }
const requireRole = (ctx, ...roles) => { const a = requireAuth(ctx); if (!roles.includes(a.role)) fail('forbidden', 'You do not have access to that.', 403); return a }
const getEvent = (s, key) => { const e = s.events[key]; if (!e || e.deletedAt) fail('not_found', 'That event does not exist.', 404); return e }
const getNp = (s, id) => { const n = s.nonprofits[id]; if (!n) fail('not_found', 'That nonprofit does not exist.', 404); return n }
const audit = (s, ctx, action, target, category) => {
  s.audit.unshift({ id: nextId(s, 'au'), at: ctx.now.toISOString(), actor: ctx.actor?.name ?? 'System', role: ctx.actor?.role ?? 'system', action, target, category })
}
const notify = (s, ctx, userIds, type, title, body, link = '') => {
  ;[...new Set(userIds)].filter(Boolean).forEach((userId) => {
    if (!s.users[userId] || s.users[userId].status === 'anonymized') return
    s.notifications.unshift({ id: nextId(s, 'n'), userId, type, title, body, link, read: false, createdAt: ctx.now.toISOString() })
  })
}
const uniqueKey = (s, title) => {
  const base = slugify(title)
  let key = base, n = 1
  while (s.events[key]) key = `${base}-${++n}` // includes deleted events
  return key
}
const normalizeTitle = (t) => { const x = (t ?? '').trim(); return x ? (x.startsWith('#') ? x : `#${x.replace(/\s+/g, '')}`) : '#Event' }
const closeReviewItem = (s, ctx, match, status) => {
  s.reviewItems.filter(match).forEach((r) => { if (!['Approved', 'Rejected', 'Closed'].includes(r.status)) { r.status = status; r.decidedAt = ctx.now.toISOString() } })
}
const addReview = (s, ctx, item) => {
  const n = s.reviewItems.length + 2043
  s.reviewItems.unshift({ id: nextId(s, 'rv'), code: `RV-${n}`, status: 'New', priority: 'Medium', checks: [], createdAt: ctx.now.toISOString(), decidedAt: null, ...item })
}
const addException = (s, ctx, item) => {
  s.exceptions.unshift({ id: nextId(s, 'ex'), code: `EX-${119 + s.exceptions.length}`, status: 'Open', createdAt: ctx.now.toISOString(), ...item })
}
const requireOwnerOrNpStaff = (ctx, ev) => {
  const a = requireAuth(ctx)
  if (!(isOrganizer(a, ev) || isNpStaffFor(a, ev))) fail('forbidden', 'Only the organizer or the nonprofit can do that.', 403)
  return a
}
const phaseFor = (ev, now) => {
  const st = startsAt(ev), en = endsAt(ev)
  if (st && now < st) return 'before'
  if (en && now > en) return 'after'
  return 'during'
}
const eventPublic = (ev) => ['Live', 'Completed', 'Archived'].includes(ev.status)

/* ------------------------------------------------------------------ handlers */
const handlers = {
  /* ---------------- identity ---------------- */
  signUpSE(s, { name, email, password, role = ROLES.SE }, ctx) {
    if (role !== ROLES.SE) fail('role_not_allowed', 'Only social entrepreneurs can sign up here.', 422)
    if (!name || name.trim().length < 2) fail('invalid_name', 'Enter your name.', 422)
    if (!EMAIL.test(email ?? '')) fail('invalid_email', 'Enter a valid email address.', 422)
    if ((password ?? '').length < 8) fail('weak_password', 'Use at least 8 characters.', 422)
    const lower = email.toLowerCase()
    if (Object.values(s.users).some((u) => u.email.toLowerCase() === lower)) fail('email_taken', 'An account with that email already exists. Sign in instead.', 409)
    const id = nextId(s, 'u')
    s.users[id] = { id, role: ROLES.SE, name: name.trim(), email: lower, phone: '', initials: initialsOf(name), color: '#007db5', bio: '', city: '', status: 'active', pw: password, failedLogins: 0 }
    s.session.userId = id
    return s.users[id]
  },

  signIn(s, { email, password }, ctx) {
    const u = Object.values(s.users).find((x) => x.email.toLowerCase() === (email ?? '').trim().toLowerCase())
    if (!u) fail('invalid_credentials', 'That email and password do not match.', 401)
    if (u.status === 'anonymized' || u.status === 'suspended') fail('account_unavailable', 'This account is not available.', 403)
    if (u.lockedUntil && new Date(u.lockedUntil) > ctx.now) fail('account_locked', 'Too many attempts. Try again in 15 minutes.', 423)
    if (u.role === ROLES.GUEST) fail('guest_no_password', 'Guests do not have a password. Join or donate on an event to continue.', 401)
    if (u.status === 'pending') fail('invite_pending', 'Accept your invite link to finish setting up this account.', 403)
    // Demo accounts (pw === undefined) accept any password of 8+ characters; created accounts check theirs.
    const ok = (password ?? '').length >= 8 && (u.pw === undefined || u.pw === password)
    if (!ok) {
      u.failedLogins = (u.failedLogins ?? 0) + 1
      if (u.failedLogins >= 5) u.lockedUntil = new Date(ctx.now.getTime() + 15 * 60 * 1000).toISOString()
      failAndSave('invalid_credentials', 'That email and password do not match.', 401)
    }
    u.failedLogins = 0; u.lockedUntil = null
    s.session.userId = u.id
    return { user: u, home: homeFor(u.role) }
  },

  googleSignIn(s, { email, name }, ctx) {
    if (!EMAIL.test(email ?? '')) fail('invalid_email', 'Google did not return a verified email.', 422)
    const u = Object.values(s.users).find((x) => x.email.toLowerCase() === email.toLowerCase())
    if (u) {
      if (u.role === ROLES.NP || u.role === ROLES.ADMIN || u.pw) fail('google_not_allowed', 'This account signs in with its password.', 409)
      if (u.status !== 'active') fail('account_unavailable', 'This account is not available.', 403)
      s.session.userId = u.id
      return { user: u, home: homeFor(u.role), created: false }
    }
    const id = nextId(s, 'u')
    s.users[id] = { id, role: ROLES.SE, name: name || email.split('@')[0], email: email.toLowerCase(), phone: '', initials: initialsOf(name || email), color: '#007db5', bio: '', city: '', status: 'active', google: true }
    s.session.userId = id
    return { user: s.users[id], home: homeFor(ROLES.SE), created: true }
  },

  signOut(s) { s.session.userId = null; s.session.pending = null },
  /** Prototype-only: the demo panel signs in as any seeded person (including guest leads, who have no password). */
  demoSignIn(s, { userId }) {
    const u = s.users[userId]
    if (!u) fail('not_found', 'That demo account does not exist.', 404)
    s.session.userId = u.id; s.session.pending = null
    return { user: u, home: homeFor(u.role) }
  },

  /** Identity gate: a guest taps Join / Donate / Comment and gives an email. Creates (or reuses) a guest lead. */
  gateIdentify(s, { email, phone = '', name = '', pending = null }, ctx) {
    if (!EMAIL.test(email ?? '')) fail('invalid_email', 'Enter a valid email address.', 422)
    if (phone && !/^[\d\s()+.-]{7,20}$/.test(phone)) fail('invalid_phone', 'That phone number does not look right.', 422)
    const lower = email.toLowerCase()
    let u = Object.values(s.users).find((x) => x.email.toLowerCase() === lower)
    if (u && u.role !== ROLES.GUEST) fail('email_belongs_to_account', 'That email belongs to an account. Sign in to continue.', 409)
    if (!u) {
      const id = nextId(s, 'u')
      const display = name.trim() || lower.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
      u = s.users[id] = { id, role: ROLES.GUEST, name: display, email: lower, phone, initials: initialsOf(display), color: '#007db5', bio: '', city: '', status: 'active', consentAt: ctx.now.toISOString() }
    } else if (phone) u.phone = phone
    s.session.userId = u.id
    s.session.pending = pending
    return { user: u, pending }
  },
  takePending(s) { const p = s.session.pending; s.session.pending = null; return p },
  setPending(s, { pending }) { s.session.pending = pending },
  setNotice(s, { notice }) { s.session.notice = notice },
  clearNotice(s) { s.session.notice = null },

  updateProfile(s, { name, bio, city, phone }, ctx) {
    const a = requireAuth(ctx)
    if (name !== undefined) { if (name.trim().length < 2) fail('invalid_name', 'Enter your name.', 422); a.name = name.trim(); a.initials = initialsOf(a.name) }
    if (bio !== undefined) a.bio = bio.slice(0, 280)
    if (city !== undefined) a.city = city
    if (phone !== undefined) a.phone = phone
    return a
  },

  /** NP admin accepts a single-use invite link, sets a password and lands on the Launchpad. */
  acceptInvite(s, { token, name, password }, ctx) {
    const np = Object.values(s.nonprofits).find((n) => n.invite?.token === token)
    if (!np) {
      const used = Object.values(s.nonprofits).some((n) => n.inviteHistory?.includes(token))
      fail(used ? 'invite_expired' : 'invite_not_found', used ? 'This invite link was already used or replaced.' : 'We could not find that invite.', used ? 410 : 404)
    }
    if (np.invite.usedAt || new Date(np.invite.expiresAt) < ctx.now) fail('invite_expired', 'This invite link was already used or has expired.', 410)
    if ((name ?? '').trim().length < 2) fail('invalid_name', 'Enter your name.', 422)
    if ((password ?? '').length < 8) fail('weak_password', 'Use at least 8 characters.', 422)
    const u = Object.values(s.users).find((x) => x.role === ROLES.NP && x.nonprofitId === np.id)
    if (!u) fail('not_found', 'No admin is linked to this invite.', 404)
    u.name = name.trim(); u.initials = initialsOf(u.name); u.pw = password; u.status = 'active'
    np.invite.usedAt = ctx.now.toISOString(); np.passwordSet = true
    np.inviteHistory = [...(np.inviteHistory ?? []), token]
    np.invite = null
    np.status = 'Pending'
    addReview(s, ctx, { type: 'Nonprofit Verification', title: `Verify ${np.name}`, entityRef: np.id, submittedBy: u.name, submittedRole: 'np_admin', priority: 'High', summary: 'Nonprofit accepted its invite and is finishing setup.', checks: [{ label: 'EIN format', ok: /^\d{2}-\d{7}$/.test(np.ein ?? '') }, { label: 'Documents uploaded (0 of 3)', ok: false }, { label: 'Stripe connected', ok: false }] })
    s.session.userId = u.id
    return { user: u, nonprofit: np }
  },

  /* ---------------- nonprofit onboarding (NP admin) ---------------- */
  npUploadDocument(s, { type, fileName }, ctx) {
    const a = requireRole(ctx, ROLES.NP)
    const np = getNp(s, a.nonprofitId)
    const doc = np.documents.find((d) => d.type === type)
    if (!doc) fail('invalid_document_type', 'Unknown document type.', 422)
    if (!/\.(pdf|png|jpe?g)$/i.test(fileName ?? '')) fail('invalid_file', 'Upload a PDF, PNG or JPG.', 400)
    doc.name = fileName; doc.status = 'Uploaded'; doc.note = ''
    const n = np.documents.filter((d) => d.status !== 'Missing' && d.status !== 'Reupload').length
    s.reviewItems.filter((r) => r.entityRef === np.id && r.type === 'Nonprofit Verification' && !['Approved', 'Rejected', 'Closed'].includes(r.status))
      .forEach((r) => { r.checks = [{ label: 'EIN format', ok: /^\d{2}-\d{7}$/.test(np.ein ?? '') }, { label: `Documents uploaded (${n} of 3)`, ok: n === 3 }, { label: 'Stripe connected', ok: np.stripe.state === 'connected' }] })
    return doc
  },
  npConnectStripe(s, { mode }, ctx) {
    const a = requireRole(ctx, ROLES.NP)
    const np = getNp(s, a.nonprofitId)
    if (!['create', 'link'].includes(mode)) fail('invalid_mode', 'Choose create or link.', 422)
    // "create" hands off to Stripe and returns through /np/stripe/callback; "link" attaches an existing account.
    np.stripe = { ...np.stripe, state: 'incomplete', mode, account: `acct_${np.id.replace(/-/g, '').slice(0, 10)}` }
    return np.stripe
  },
  npStripeCallback(s, { success = true }, ctx) {
    const a = requireRole(ctx, ROLES.NP)
    const np = getNp(s, a.nonprofitId)
    if (!success) { np.stripe.state = 'incomplete'; return np.stripe }
    np.stripe.state = 'connected'
    if (np.status === 'Active') np.settlement = 'Ready'
    else if (np.status === 'Pending') np.settlement = 'Pending'
    s.reviewItems.filter((r) => r.entityRef === np.id && r.type === 'Nonprofit Verification' && !['Approved', 'Rejected', 'Closed'].includes(r.status))
      .forEach((r) => { r.checks = r.checks.map((c) => (c.label === 'Stripe connected' ? { ...c, ok: true } : c)) })
    return np.stripe
  },
  npUpdateProfile(s, { mission, story, headquarters }, ctx) {
    const a = requireRole(ctx, ROLES.NP)
    const np = getNp(s, a.nonprofitId)
    if (mission !== undefined) { if (mission.trim().length < 10) fail('invalid_mission', 'Describe the mission in a sentence or two.', 422); np.mission = mission.trim() }
    if (story !== undefined) np.story = story.trim()
    if (headquarters !== undefined) np.headquarters = headquarters.trim()
    return np
  },
  npSetAutopilot(s, { enabled, checks, trustedSeIds }, ctx) {
    const a = requireRole(ctx, ROLES.NP)
    const np = getNp(s, a.nonprofitId)
    np.autopilot = { enabled: !!enabled, checks: checks ?? np.autopilot.checks, trustedSeIds: trustedSeIds ?? np.autopilot.trustedSeIds }
    return np.autopilot
  },

  /* ---------------- event creation + lifecycle ---------------- */
  createDraft(s, init = {}, ctx) {
    const a = requireRole(ctx, ROLES.SE, ROLES.NP)
    const title = normalizeTitle(init.title)
    const key = uniqueKey(s, title)
    const npLed = a.role === ROLES.NP
    s.events[key] = {
      key, title, story: init.story ?? '', mission: init.story ?? '', subtitle: '', category: init.category ?? '', nonprofitId: npLed ? a.nonprofitId : init.nonprofitId ?? '',
      organizerId: a.id, kind: npLed ? 'NP-led' : 'SE-led', status: 'Draft', visibility: 'public', date: init.date ?? '', start: init.start ?? '', end: init.end ?? '', endDate: '',
      location: init.location ?? '', photoKey: '', photos: init.photos ?? [], focus: 'center 30%', baseRaised: 0, baseBacked: 0, baseJoined: 0, baseChat: 0, goal: 5000,
      joinedIds: [], likedIds: [], savedIds: [], tickets: {}, checkins: [], wizardStep: 1, guidelinesAccepted: false, review: null, blocked: null,
      createdAt: ctx.now.toISOString(), submittedAt: null, liveAt: null, completedAt: null, archivedAt: null, deletedAt: null,
    }
    s.chat[key] = []
    return s.events[key]
  },

  saveDraft(s, { key, patch = {}, step }, ctx) {
    const a = requireAuth(ctx)
    const ev = getEvent(s, key)
    if (!isOrganizer(a, ev)) fail('forbidden', 'You can only edit your own events.', 403)
    if (ev.status === 'Rejected') { ev.status = 'Draft' } // first save of an edit moves it back to Draft (last rejection kept)
    if (ev.status === 'Changes Requested') {
      const open = new Set((ev.review?.areas ?? []).flatMap((area) => CHANGE_AREAS[area] ?? []))
      const locked = Object.keys(patch).filter((k) => !open.has(k) && k !== 'guidelinesAccepted')
      if (locked.length) fail('step_locked', `Only the areas flagged by the nonprofit can change: ${(ev.review?.areas ?? []).join(', ')}.`, 409)
    } else if (ev.status !== 'Draft') fail('event_locked', 'This event can no longer be edited.', 409)
    const allowed = ['title', 'story', 'mission', 'category', 'nonprofitId', 'date', 'start', 'end', 'endDate', 'location', 'photos', 'guidelinesAccepted', 'focus']
    for (const [k, v] of Object.entries(patch)) {
      if (!allowed.includes(k)) continue
      if (k === 'title') ev.title = normalizeTitle(v)
      else if (k === 'nonprofitId') { if (v && !s.nonprofits[v]) fail('not_found', 'That nonprofit does not exist.', 404); ev.nonprofitId = v }
      else ev[k] = v
    }
    if (patch.story !== undefined) { ev.mission = (patch.story ?? '').split(/\n/)[0].slice(0, 140) }
    if (step) ev.wizardStep = Math.max(ev.wizardStep ?? 1, step)
    // kind is recalculated from the beneficiary (NP-led when the organizer runs that nonprofit)
    const org = s.users[ev.organizerId]
    ev.kind = org?.role === ROLES.NP && org.nonprofitId === ev.nonprofitId ? 'NP-led' : 'SE-led'
    return ev
  },

  submitEvent(s, { key }, ctx) {
    const a = requireAuth(ctx)
    const ev = getEvent(s, key)
    if (!isOrganizer(a, ev)) fail('forbidden', 'You can only submit your own events.', 403)
    if (!['Draft', 'Changes Requested'].includes(ev.status)) fail('event_locked', 'This event is already submitted.', 409)
    if (!ev.photos?.length) fail('photos_required', 'Add at least one photo before submitting.', 422)
    if (!ev.guidelinesAccepted) fail('guidelines_required', 'Accept the community guidelines to submit.', 422)
    if (!ev.title || !ev.story?.trim()) fail('story_required', 'Tell people what the event is about.', 422)
    if (!ev.date || !ev.start || !ev.end || !ev.location?.trim()) fail('details_required', 'Add the date, times and location.', 422)
    if (!ev.nonprofitId) fail('nonprofit_required', 'Choose the nonprofit this event supports.', 422)
    const np = getNp(s, ev.nonprofitId)
    if (['Suspended', 'Rejected'].includes(np.status)) fail('nonprofit_unavailable', `${np.name} cannot take new events right now.`, 409)
    ev.submittedAt = ctx.now.toISOString()
    const npLed = a.role === ROLES.NP && a.nonprofitId === ev.nonprofitId
    if (npLed) { ev.status = 'Live'; ev.liveAt = ctx.now.toISOString(); ev.kind = 'NP-led'; return { event: ev, outcome: 'live' } }

    ev.status = 'Submitted'; ev.kind = 'SE-led'
    // Autopilot (works here, unlike the inert real feature): trusted SE + every check passes → straight to Live
    const ap = np.autopilot
    if (ap?.enabled && ap.trustedSeIds.includes(a.id) && autopilotPasses(ev, ctx.now, ap.checks)) {
      ev.status = 'Live'; ev.liveAt = ctx.now.toISOString()
      ev.review = { decision: 'auto_approved', areas: [], feedback: '', reason: '', at: ctx.now.toISOString(), by: 'autopilot' }
      notify(s, ctx, [a.id], 'event_approved', 'Your event is live', `${np.name} approved ${ev.title} automatically. It is live now.`, `/events/${ev.key}`)
      notify(s, ctx, npAdminsOf(s, np.id).map((u) => u.id), 'autopilot_approved', 'Autopilot approved an event', `${ev.title} by ${a.name} passed your checks and went live.`, '/np/approvals')
      return { event: ev, outcome: 'auto_approved' }
    }
    notify(s, ctx, npAdminsOf(s, np.id).map((u) => u.id), 'approval_requested', 'New event waiting for approval', `${ev.title} by ${a.name} is waiting for your approval.`, '/np/approvals')
    return { event: ev, outcome: 'submitted' }
  },

  approveEvent(s, { key }, ctx) {
    const a = requireRole(ctx, ROLES.NP)
    const ev = getEvent(s, key)
    if (!isNpStaffFor(a, ev)) fail('forbidden', 'Only the beneficiary nonprofit can approve this event.', 403)
    if (ev.status !== 'Submitted') fail('invalid_state', 'Only submitted events can be approved.', 409)
    const np = getNp(s, ev.nonprofitId)
    if (np.status !== 'Active') fail('nonprofit_unavailable', 'Your nonprofit must be active to approve events.', 409)
    ev.status = 'Live'; ev.liveAt = ctx.now.toISOString()
    ev.review = { decision: 'approved', areas: [], feedback: '', reason: '', at: ctx.now.toISOString(), by: a.id }
    notify(s, ctx, [ev.organizerId], 'event_approved', 'Your event is live', `${np.name} approved ${ev.title}. It is live now.`, `/se/approval/${ev.key}`)
    return ev
  },
  rejectEvent(s, { key, reason }, ctx) {
    const a = requireRole(ctx, ROLES.NP)
    const ev = getEvent(s, key)
    if (!isNpStaffFor(a, ev)) fail('forbidden', 'Only the beneficiary nonprofit can reject this event.', 403)
    if (ev.status !== 'Submitted') fail('invalid_state', 'Only submitted events can be rejected.', 409)
    if (!(reason ?? '').trim()) fail('reason_required', 'Tell the organizer why.', 422)
    ev.status = 'Rejected'
    ev.review = { decision: 'rejected', areas: [], feedback: '', reason: reason.trim(), at: ctx.now.toISOString(), by: a.id }
    notify(s, ctx, [ev.organizerId], 'event_rejected', 'Event not approved', `${ev.title} was not approved: ${reason.trim()} You can edit it and resubmit.`, `/se/approval/${ev.key}`)
    return ev
  },
  requestChanges(s, { key, areas = [], feedback }, ctx) {
    const a = requireRole(ctx, ROLES.NP)
    const ev = getEvent(s, key)
    if (!isNpStaffFor(a, ev)) fail('forbidden', 'Only the beneficiary nonprofit can request changes.', 403)
    if (ev.status !== 'Submitted') fail('invalid_state', 'Only submitted events can have changes requested.', 409)
    const valid = areas.filter((x) => CHANGE_AREAS[x])
    if (!valid.length) fail('areas_required', 'Pick at least one area to change.', 422)
    if (!(feedback ?? '').trim()) fail('feedback_required', 'Tell the organizer what to fix.', 422)
    ev.status = 'Changes Requested'
    ev.review = { decision: 'changes_requested', areas: valid, feedback: feedback.trim(), reason: '', at: ctx.now.toISOString(), by: a.id }
    notify(s, ctx, [ev.organizerId], 'changes_requested', 'Changes requested', `${s.nonprofits[ev.nonprofitId].name} asked for changes to ${ev.title}.`, `/se/approval/${ev.key}`)
    return ev
  },
  reportEvent(s, { key, reason }, ctx) {
    const a = requireRole(ctx, ROLES.NP)
    const ev = getEvent(s, key)
    if (!isNpStaffFor(a, ev)) fail('forbidden', 'Only the beneficiary nonprofit can report this event.', 403)
    if (!(reason ?? '').trim()) fail('reason_required', 'Tell Charity Hub what is wrong.', 422)
    addReview(s, ctx, { type: 'Event report', title: `Report: ${ev.title}`, entityRef: ev.key, submittedBy: a.name, submittedRole: 'np_admin', priority: 'High', summary: reason.trim(), checks: [] })
    return { reported: true }
  },
  deleteEvent(s, { key }, ctx) {
    const a = requireAuth(ctx)
    const ev = getEvent(s, key)
    if (!isOrganizer(a, ev)) fail('forbidden', 'You can only delete your own events.', 403)
    if (!['Draft', 'Rejected'].includes(ev.status)) fail('event_locked', 'Only drafts and rejected events can be deleted.', 409)
    ev.deletedAt = ctx.now.toISOString()
    return { deleted: key }
  },
  cloneEvent(s, { key }, ctx) {
    const a = requireRole(ctx, ROLES.SE, ROLES.NP)
    const src = getEvent(s, key)
    if (!isOrganizer(a, src)) fail('forbidden', 'You can only clone your own events.', 403)
    // seeded events keep their pictures under photoKey (/photos/<key>/img1..8.jpg); carry those over too
    const photos = src.photos?.length ? [...src.photos] : src.photoKey ? Array.from({ length: 8 }, (_, i) => `/photos/${src.photoKey}/img${i + 1}.jpg`) : []
    const copy = handlers.createDraft(s, { title: src.title, story: src.story, category: src.category, nonprofitId: src.nonprofitId, location: src.location, photos }, ctx)
    copy.mission = src.mission
    return copy
  },
  postUpdate(s, { eventKey, text, mediaUrl = '' }, ctx) {
    const ev = getEvent(s, eventKey)
    const a = requireOwnerOrNpStaff(ctx, ev)
    if (['Blocked', 'Archived'].includes(ev.status)) fail(ev.status === 'Blocked' ? 'event_blocked' : 'event_archived', 'Updates are closed for this event.', 409)
    if (ev.status !== 'Live' && ev.status !== 'Completed') fail('event_not_live', 'Updates open once the event is live.', 409)
    if (!(text ?? '').trim() && !mediaUrl) fail('empty_post', 'Write an update first.', 400)
    const post = { id: nextId(s, 'p'), eventKey, phase: phaseFor(ev, ctx.now), text: (text ?? '').trim(), authorId: a.id, authorName: a.name, host: true, verified: true, highlight: '', mediaUrl, createdAt: ctx.now.toISOString(), replies: [], likes: [], hidden: false, removed: false, flags: [] }
    s.posts.push(post)
    return post
  },

  /* ---------------- admin: event controls + lifecycle ---------------- */
  blockEvent(s, { key, reason, mode = 'hold' }, ctx) {
    requireRole(ctx, ROLES.ADMIN)
    const ev = getEvent(s, key)
    if (ev.status !== 'Live') fail('invalid_state', 'Only live events can be blocked.', 409)
    if (!(reason ?? '').trim()) fail('reason_required', 'Give a reason.', 422)
    if (!['hold', 'refund'].includes(mode)) fail('invalid_mode', 'Choose hold or refund.', 422)
    let refunded = 0
    if (mode === 'refund') refunded = refundAll(s, ctx, key, 'Event blocked')
    ev.blocked = { reason: reason.trim(), mode, at: ctx.now.toISOString(), expiresAt: new Date(ctx.now.getTime() + 14 * DAY).toISOString(), by: ctx.actor.id, previous: 'Live' }
    ev.status = 'Blocked'
    notify(s, ctx, [ev.organizerId, ...npAdminsOf(s, ev.nonprofitId).map((u) => u.id)], 'event_blocked', 'Event paused', `${ev.title} was paused by Charity Hub: ${reason.trim()}`, `/events/${ev.key}`)
    audit(s, ctx, mode === 'refund' ? `Blocked event and refunded ${refunded} donation(s)` : 'Blocked event (money held)', ev.title, 'Events')
    return ev
  },
  restoreEvent(s, { key }, ctx) {
    requireRole(ctx, ROLES.ADMIN)
    const ev = getEvent(s, key)
    if (ev.status !== 'Blocked') fail('invalid_state', 'Only blocked events can be restored.', 409)
    ev.status = ev.blocked?.previous ?? 'Live'; ev.blocked = null
    notify(s, ctx, [ev.organizerId, ...npAdminsOf(s, ev.nonprofitId).map((u) => u.id)], 'event_restored', 'Event is back', `${ev.title} is live again.`, `/events/${ev.key}`)
    audit(s, ctx, 'Restored event', ev.title, 'Events')
    return ev
  },
  /** The daily lifecycle job (GET /api/v1/internal/cron/lifecycle): complete, archive, expire holds, fail stale payments. */
  runLifecycle(s, _p, ctx) {
    requireRole(ctx, ROLES.ADMIN)
    const out = { completed: 0, archived: 0, expiredBlocks: 0, failedPayments: 0 }
    for (const ev of Object.values(s.events)) {
      if (ev.deletedAt) continue
      if (ev.status === 'Live') {
        const en = endsAt(ev)
        if (en && ctx.now > en) {
          ev.status = 'Completed'; ev.completedAt = ctx.now.toISOString(); out.completed++
          notify(s, ctx, [ev.organizerId, ...npAdminsOf(s, ev.nonprofitId).map((u) => u.id)], 'event_completed', 'Event completed', `${ev.title} is now closed. See the impact summary.`, ev.kind === 'NP-led' ? '/np/activity' : `/se/impact/${ev.key}`)
        }
      } else if (ev.status === 'Completed') {
        const c = ev.completedAt ? new Date(ev.completedAt) : endsAt(ev)
        if (c && ctx.now.getTime() - c.getTime() > 30 * DAY) { ev.status = 'Archived'; ev.archivedAt = ctx.now.toISOString(); out.archived++ }
      } else if (ev.status === 'Blocked' && ev.blocked && new Date(ev.blocked.expiresAt) < ctx.now) {
        refundAll(s, ctx, ev.key, 'Block expired'); ev.status = 'Archived'; ev.archivedAt = ctx.now.toISOString(); ev.blocked = null; out.expiredBlocks++
      }
    }
    for (const d of s.donations) {
      if (d.status === 'Initiated' && ctx.now.getTime() - new Date(d.createdAt).getTime() > DAY) { d.status = 'Failed'; out.failedPayments++ }
    }
    audit(s, ctx, `Ran lifecycle job (${out.completed} completed, ${out.archived} archived, ${out.expiredBlocks} block expiries)`, 'Lifecycle', 'Events')
    return out
  },
  setClock(s, { iso }, ctx) {
    requireRole(ctx, ROLES.ADMIN)
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) fail('invalid_date', 'That date is not valid.', 422)
    s.now = d.toISOString()
    return s.now
  },
  advanceClock(s, { days = 1 }, ctx) {
    requireRole(ctx, ROLES.ADMIN)
    s.now = new Date(new Date(s.now).getTime() + days * DAY).toISOString()
    return s.now
  },

  /* ---------------- admin: nonprofits ---------------- */
  adminDocumentDecision(s, { npId, docId, decision, note = '' }, ctx) {
    requireRole(ctx, ROLES.ADMIN)
    const np = getNp(s, npId)
    const doc = np.documents.find((d) => d.id === docId)
    if (!doc) fail('not_found', 'That document does not exist.', 404)
    if (doc.status === 'Missing') fail('invalid_state', 'No file has been uploaded yet.', 409)
    if (decision === 'approve') { doc.status = 'Approved'; doc.note = '' }
    else if (decision === 'reupload') { if (!note.trim()) fail('note_required', 'Say what to fix.', 422); doc.status = 'Reupload'; doc.note = note.trim(); notify(s, ctx, npAdminsOf(s, npId).map((u) => u.id), 'document_reupload', 'Please re-upload a document', `${doc.label}: ${note.trim()}`, '/np/setup') }
    else fail('invalid_decision', 'Choose approve or re-upload.', 422)
    audit(s, ctx, decision === 'approve' ? `Approved document: ${doc.label}` : `Asked for re-upload: ${doc.label}`, np.name, 'Verification')
    return doc
  },
  adminRerunEin(s, { npId }, ctx) {
    requireRole(ctx, ROLES.ADMIN)
    const np = getNp(s, npId)
    np.source = 'IRS BMF' // a stub in the real app too: no lookup, no status change
    audit(s, ctx, 'Re-ran EIN check', np.name, 'Verification')
    return np
  },
  adminVerifyNonprofit(s, { npId }, ctx) {
    requireRole(ctx, ROLES.ADMIN)
    const np = getNp(s, npId)
    if (['Active'].includes(np.status) && np.verified) fail('invalid_state', 'Already verified.', 409)
    if (np.status === 'Invited') fail('invalid_state', 'The nonprofit has not accepted its invite yet.', 409)
    if (np.documents.filter((d) => d.status === 'Approved').length < 3) fail('documents_incomplete', 'Approve all three documents before verifying.', 409)
    np.status = 'Active'; np.verified = true
    np.settlement = np.stripe.state === 'connected' ? 'Ready' : 'Not ready'
    closeReviewItem(s, ctx, (r) => r.entityRef === np.id && r.type === 'Nonprofit Verification', 'Approved')
    notify(s, ctx, npAdminsOf(s, np.id).map((u) => u.id), 'nonprofit_verified', 'You are verified', `${np.name} is verified by Charity Hub.`, '/np')
    audit(s, ctx, 'Verified nonprofit', np.name, 'Verification')
    return np
  },
  adminRejectNonprofit(s, { npId, reason = '' }, ctx) {
    requireRole(ctx, ROLES.ADMIN)
    const np = getNp(s, npId)
    if (np.status === 'Rejected') fail('invalid_state', 'Already rejected.', 409)
    np.status = 'Rejected'; np.verified = false; np.settlement = 'Not ready'
    closeReviewItem(s, ctx, (r) => r.entityRef === np.id && r.type === 'Nonprofit Verification', 'Rejected')
    audit(s, ctx, `Rejected nonprofit${reason ? `: ${reason}` : ''}`, np.name, 'Verification')
    return np
  },
  adminSuspendNonprofit(s, { npId }, ctx) {
    requireRole(ctx, ROLES.ADMIN)
    const np = getNp(s, npId)
    if (np.status !== 'Active') fail('invalid_state', 'Only active nonprofits can be suspended.', 409)
    np.status = 'Suspended'; np.settlement = 'Not ready'
    let blocked = 0
    for (const ev of Object.values(s.events)) {
      if (ev.nonprofitId === np.id && ev.status === 'Live' && !ev.deletedAt) {
        ev.status = 'Blocked'; blocked++
        ev.blocked = { reason: `${np.name} was suspended`, mode: 'hold', at: ctx.now.toISOString(), expiresAt: new Date(ctx.now.getTime() + 30 * DAY).toISOString(), by: ctx.actor.id, previous: 'Live', suspension: true }
        notify(s, ctx, [ev.organizerId], 'event_blocked', 'Event paused', `${ev.title} is paused because ${np.name} was suspended.`, `/events/${ev.key}`)
      }
    }
    audit(s, ctx, `Suspended nonprofit (${blocked} live event(s) blocked, money held)`, np.name, 'Verification')
    return np
  },
  adminReinstateNonprofit(s, { npId }, ctx) {
    requireRole(ctx, ROLES.ADMIN)
    const np = getNp(s, npId)
    if (np.status !== 'Suspended') fail('invalid_state', 'Only suspended nonprofits can be reinstated.', 409)
    np.status = 'Active'; np.settlement = np.stripe.state === 'connected' ? 'Ready' : 'Not ready'
    for (const ev of Object.values(s.events)) {
      if (ev.nonprofitId === np.id && ev.status === 'Blocked' && ev.blocked?.suspension) { ev.status = 'Live'; ev.blocked = null }
    }
    audit(s, ctx, 'Reinstated nonprofit', np.name, 'Verification')
    return np
  },
  adminInviteNonprofit(s, { name, category, ein = '', email }, ctx) {
    requireRole(ctx, ROLES.ADMIN)
    if ((name ?? '').trim().length < 2) fail('invalid_name', 'Enter the nonprofit name.', 422)
    if (!category) fail('invalid_category', 'Choose a category.', 422)
    if (ein && !/^\d{2}-\d{7}$/.test(ein)) fail('invalid_ein', 'EINs look like 12-3456789.', 422)
    if (email && !EMAIL.test(email)) fail('invalid_email', 'Enter a valid email address.', 422)
    const slug = slugify(name)
    if (Object.values(s.nonprofits).some((n) => n.slug === slug || n.name.toLowerCase() === name.trim().toLowerCase())) fail('duplicate_name', 'A nonprofit with that name already exists.', 409)
    if (email && Object.values(s.users).some((u) => u.email.toLowerCase() === email.toLowerCase())) fail('email_taken', 'That email already has an account.', 409)
    const token = `invite-${slug}-${++s.seq}`
    s.nonprofits[slug] = {
      id: slug, slug, name: name.trim(), legalName: name.trim(), ein, category, cause: category, mission: '', story: '', headquarters: '', founded: null,
      status: 'Invited', verified: false, settlement: 'Not ready', stripe: { state: 'none', mode: null, account: '', available: 0, pending: 0 },
      documents: DOC_TYPES.map((d) => ({ id: d.type, type: d.type, label: d.label, name: '', status: 'Missing', note: '' })), passwordSet: false,
      autopilot: { enabled: false, checks: ['Has cover photo', 'Story is at least 40 characters', 'Event date is in the future'], trustedSeIds: [] },
      invite: email ? { token, email, expiresAt: new Date(ctx.now.getTime() + 7 * DAY).toISOString(), usedAt: null } : null, source: 'Admin invite',
    }
    if (email) {
      const id = nextId(s, 'u')
      s.users[id] = { id, role: ROLES.NP, name: `${name.trim()} Admin`, email: email.toLowerCase(), phone: '', initials: initialsOf(name), color: '#00569d', bio: '', city: '', status: 'pending', nonprofitId: slug }
    }
    audit(s, ctx, 'Invited nonprofit', name.trim(), 'Verification')
    return s.nonprofits[slug]
  },
  adminIssueInvite(s, { npId, email }, ctx) {
    requireRole(ctx, ROLES.ADMIN)
    const np = getNp(s, npId)
    if (!EMAIL.test(email ?? '')) fail('invalid_email', 'Enter a valid email address.', 422)
    const taken = Object.values(s.users).find((u) => u.email.toLowerCase() === email.toLowerCase())
    if (taken && !(taken.role === ROLES.NP && taken.nonprofitId === npId && taken.status === 'pending')) fail('email_taken', 'That email already has an account.', 409)
    if (np.invite?.token) np.inviteHistory = [...(np.inviteHistory ?? []), np.invite.token] // the old link stops working
    const token = `invite-${np.slug}-${++s.seq}`
    np.invite = { token, email, expiresAt: new Date(ctx.now.getTime() + 7 * DAY).toISOString(), usedAt: null }
    if (!taken) {
      const id = nextId(s, 'u')
      s.users[id] = { id, role: ROLES.NP, name: `${np.name} Admin`, email: email.toLowerCase(), phone: '', initials: initialsOf(np.name), color: '#00569d', bio: '', city: '', status: 'pending', nonprofitId: np.id }
    }
    audit(s, ctx, 'Issued invite link', np.name, 'Verification')
    return np.invite
  },

  /* ---------------- participation ---------------- */
  joinEvent(s, { eventKey }, ctx) {
    const a = requireAuth(ctx)
    const ev = getEvent(s, eventKey)
    if (['Blocked', 'Archived'].includes(ev.status)) fail(ev.status === 'Blocked' ? 'event_blocked' : 'event_archived', 'This event is not open for new people.', 409)
    if (ev.status !== 'Live') fail('event_not_live', 'You can join once an event is live.', 409)
    if (!ev.joinedIds.includes(a.id)) {
      ev.joinedIds.push(a.id)
      ev.tickets[a.id] = `CH-${ev.key.replace(/[^a-z]/g, '').slice(0, 3).toUpperCase()}-${String(++s.seq).padStart(4, '0')}`
    }
    return { ticket: ev.tickets[a.id] }
  },
  leaveEvent(s, { eventKey }, ctx) {
    const a = requireAuth(ctx)
    const ev = getEvent(s, eventKey)
    ev.joinedIds = ev.joinedIds.filter((id) => id !== a.id)
    return { left: true }
  },
  toggleSaveEvent(s, { eventKey }, ctx) {
    const a = requireAuth(ctx)
    const ev = getEvent(s, eventKey)
    ev.savedIds = ev.savedIds.includes(a.id) ? ev.savedIds.filter((id) => id !== a.id) : [...ev.savedIds, a.id]
    return { saved: ev.savedIds.includes(a.id) }
  },
  toggleFollowNonprofit(s, { nonprofitId }, ctx) {
    const a = requireAuth(ctx)
    getNp(s, nonprofitId)
    const i = s.follows.findIndex((f) => f.userId === a.id && f.nonprofitId === nonprofitId)
    if (i >= 0) s.follows.splice(i, 1); else s.follows.push({ userId: a.id, nonprofitId })
    return { following: i < 0 }
  },
  toggleLike(s, { postId }, ctx) {
    const a = requireAuth(ctx)
    const p = s.posts.find((x) => x.id === postId)
    if (!p) fail('not_found', 'That post does not exist.', 404)
    p.likes = p.likes.includes(a.id) ? p.likes.filter((id) => id !== a.id) : [...p.likes, a.id]
    return { liked: p.likes.includes(a.id) }
  },
  createPost(s, { eventKey, text, mediaUrl = '' }, ctx) {
    const a = requireAuth(ctx)
    const ev = getEvent(s, eventKey)
    if (['Blocked', 'Archived'].includes(ev.status)) fail(ev.status === 'Blocked' ? 'event_blocked' : 'event_archived', 'This event is closed to new posts.', 409)
    if (!['Live', 'Completed'].includes(ev.status)) fail('event_not_live', 'The room opens when the event is live.', 409)
    if (!(text ?? '').trim() && !mediaUrl) fail('empty_post', 'Write something first.', 400)
    const post = { id: nextId(s, 'p'), eventKey, phase: phaseFor(ev, ctx.now), text: (text ?? '').trim(), authorId: a.id, authorName: a.name, host: false, verified: false, highlight: '', mediaUrl, createdAt: ctx.now.toISOString(), replies: [], likes: [], hidden: false, removed: false, flags: [] }
    s.posts.push(post)
    return post
  },
  replyToPost(s, { postId, text }, ctx) {
    const a = requireAuth(ctx)
    const p = s.posts.find((x) => x.id === postId)
    if (!p) fail('not_found', 'That post does not exist.', 404)
    const ev = getEvent(s, p.eventKey)
    if (['Blocked', 'Archived'].includes(ev.status)) fail('event_closed', 'This event is closed to replies.', 409)
    if (!(text ?? '').trim()) fail('empty_post', 'Write a reply first.', 400)
    const r = { id: nextId(s, 'r'), authorId: a.id, authorName: a.name, text: text.trim(), createdAt: ctx.now.toISOString(), hidden: false, flags: [] }
    p.replies.push(r)
    return r
  },
  sendChat(s, { eventKey, text, mediaUrl = '' }, ctx) {
    const a = requireAuth(ctx)
    const ev = getEvent(s, eventKey)
    if (['Blocked', 'Archived'].includes(ev.status)) fail(ev.status === 'Blocked' ? 'event_blocked' : 'event_archived', 'Chat is closed for this event.', 409)
    if (!(text ?? '').trim() && !mediaUrl) fail('empty_message', 'Write a message first.', 400)
    const m = { id: nextId(s, 'c'), authorId: a.id, text: (text ?? '').trim(), mediaUrl, createdAt: ctx.now.toISOString(), hidden: false, flags: [] }
    ;(s.chat[eventKey] ??= []).push(m)
    return m
  },
  flagContent(s, { kind, id, eventKey, reason }, ctx) {
    const a = requireAuth(ctx)
    if (!(reason ?? '').trim()) fail('reason_required', 'Tell us what is wrong.', 422)
    const target = findContent(s, kind, id, eventKey)
    if (target.flags.some((f) => f.by === a.id)) fail('already_flagged', 'You already reported this.', 409)
    target.flags.push({ by: a.id, reason: reason.trim(), at: ctx.now.toISOString() })
    addReview(s, ctx, { type: 'Content report', title: `Report: ${kind} in ${s.events[eventKey]?.title ?? eventKey}`, entityRef: `${kind}:${id}:${eventKey}`, submittedBy: a.name, submittedRole: a.role, priority: 'Medium', summary: reason.trim(), checks: [] })
    return { flagged: true }
  },
  moderateContent(s, { kind, id, eventKey, decision }, ctx) {
    requireRole(ctx, ROLES.ADMIN)
    const target = findContent(s, kind, id, eventKey)
    if (!['hide', 'remove', 'dismiss'].includes(decision)) fail('invalid_decision', 'Choose hide, remove or dismiss.', 422)
    if (decision === 'hide') target.hidden = true
    if (decision === 'remove') { target.hidden = true; target.removed = true }
    if (decision === 'dismiss') target.flags = []
    closeReviewItem(s, ctx, (r) => r.entityRef === `${kind}:${id}:${eventKey}`, decision === 'dismiss' ? 'Closed' : 'Approved')
    audit(s, ctx, `${decision === 'dismiss' ? 'Dismissed report on' : decision === 'hide' ? 'Hid' : 'Removed'} ${kind}`, s.events[eventKey]?.title ?? eventKey, 'Moderation')
    return target
  },

  /* ---------------- donations ---------------- */
  createDonation(s, { eventKey, amountCents, tipCents = 0, anonymous = false, name = '' }, ctx) {
    const a = requireAuth(ctx)
    const ev = getEvent(s, eventKey)
    if (ev.status === 'Blocked') fail('event_blocked', 'Donations are paused for this event.', 409)
    if (ev.status === 'Archived') fail('event_archived', 'This event is archived.', 409)
    if (ev.status !== 'Live') fail('event_not_live', 'You can give while an event is live.', 409)
    if (!ev.nonprofitId) fail('settlement_unavailable', 'This event has no nonprofit to receive donations.', 409)
    const np = getNp(s, ev.nonprofitId)
    if (['Suspended', 'Rejected'].includes(np.status)) fail('nonprofit_unavailable', `${np.name} cannot take donations right now.`, 409)
    if (np.settlement !== 'Ready') fail('settlement_unavailable', `${np.name} is still setting up payments, so it cannot receive donations yet.`, 409)
    const q = quote(amountCents, tipCents)
    // Retrying the same gift reuses the same payment (same event, donor and amount)
    const again = s.donations.find((d) => d.donorId === a.id && d.eventKey === eventKey && d.amountCents === amountCents && d.status === 'Initiated')
    if (again) return again
    const d = { id: nextId(s, 'd'), eventKey, nonprofitId: ev.nonprofitId, donorId: a.id, publicName: anonymous ? 'Anonymous' : (name.trim() || a.name), anonymous, ...q, status: 'Initiated', ref: `mock_pi_${s.seq}`, receiptNo: null, createdAt: ctx.now.toISOString(), attempts: 0 }
    s.donations.push(d)
    return d
  },
  confirmDonation(s, { id, cardLast4 = '4242' }, ctx) {
    const a = requireAuth(ctx)
    const d = s.donations.find((x) => x.id === id && x.donorId === a.id)
    if (!d) fail('not_found', 'That donation does not exist.', 404)
    if (d.status === 'Successful') return d
    if (d.status !== 'Initiated') fail('invalid_state', 'This donation cannot be confirmed.', 409)
    d.attempts = (d.attempts ?? 0) + 1
    if (cardLast4 === '0002') { d.lastError = 'Your card was declined.'; throw new DomainError('card_declined', 'Your card was declined. Try another card.', 402) }
    d.status = 'Successful'; d.receiptNo = `CH-${2000 + s.donations.length}`; d.paidAt = ctx.now.toISOString(); d.lastError = null
    const ev = s.events[d.eventKey]
    notify(s, ctx, [ev.organizerId, ...npAdminsOf(s, ev.nonprofitId).map((u) => u.id)], 'donation_received', 'New donation', `${d.publicName} gave $${(d.amountCents / 100).toFixed(0)} to ${ev.title}.`, ev.kind === 'NP-led' ? '/np/activity' : `/se/live/${ev.key}`)
    return d
  },
  refundDonation(s, { id, reason = 'Requested by admin' }, ctx) {
    requireRole(ctx, ROLES.ADMIN)
    const d = s.donations.find((x) => x.id === id)
    if (!d) fail('not_found', 'That donation does not exist.', 404)
    if (d.status !== 'Successful') fail('invalid_state', 'Only successful donations can be refunded.', 409)
    refundOne(s, ctx, d, reason)
    audit(s, ctx, `Refunded $${(d.amountCents / 100).toFixed(0)} (${reason})`, s.events[d.eventKey]?.title ?? d.eventKey, 'Payments')
    return d
  },
  disputeDonation(s, { id }, ctx) {
    requireRole(ctx, ROLES.ADMIN)
    const d = s.donations.find((x) => x.id === id)
    if (!d) fail('not_found', 'That donation does not exist.', 404)
    if (d.status !== 'Successful') fail('invalid_state', 'Only successful donations can be disputed.', 409)
    d.status = 'Disputed'
    addException(s, ctx, { type: 'Dispute', title: `Dispute on ${d.receiptNo ?? d.id}`, entityRef: s.events[d.eventKey]?.title ?? d.eventKey, severity: 'High', amount: d.amountCents / 100 })
    audit(s, ctx, 'Marked donation disputed (Stripe webhook)', s.events[d.eventKey]?.title ?? d.eventKey, 'Payments')
    return d
  },

  /* ---------------- check-in ---------------- */
  checkIn(s, { eventKey, code }, ctx) {
    const ev = getEvent(s, eventKey)
    requireOwnerOrNpStaff(ctx, ev)
    if (['Blocked', 'Archived'].includes(ev.status)) fail(ev.status === 'Blocked' ? 'event_blocked' : 'event_archived', 'Check-in is closed for this event.', 409)
    const c = (code ?? '').trim().toUpperCase()
    if (!c) fail('code_required', 'Scan or type a ticket code.', 422)
    const holder = Object.entries(ev.tickets).find(([, t]) => t.toUpperCase() === c)
    if (!holder) fail('ticket_not_found', 'That ticket code does not match this event.', 404)
    if (ev.checkins.some((x) => x.code.toUpperCase() === c)) fail('already_checked_in', 'This ticket is already checked in.', 409)
    const u = s.users[holder[0]]
    const backed = s.donations.some((d) => d.eventKey === eventKey && d.donorId === u?.id && d.status === 'Successful' && !d.seeded)
    const row = { id: nextId(s, 'k'), code: holder[1], name: u?.name ?? 'Guest', backed, walkIn: false, ticketType: 'General', at: ctx.now.toISOString() }
    ev.checkins.push(row)
    return row
  },
  walkIn(s, { eventKey, name, backed = false, ticketType = 'General' }, ctx) {
    const ev = getEvent(s, eventKey)
    requireOwnerOrNpStaff(ctx, ev)
    if (['Blocked', 'Archived'].includes(ev.status)) fail(ev.status === 'Blocked' ? 'event_blocked' : 'event_archived', 'Check-in is closed for this event.', 409)
    if (!(name ?? '').trim()) fail('name_required', 'Enter the guest’s name.', 422)
    const row = { id: nextId(s, 'k'), code: '', name: name.trim(), backed: !!backed, walkIn: true, ticketType, at: ctx.now.toISOString() }
    ev.checkins.push(row)
    return row
  },

  /* ---------------- notifications ---------------- */
  markNotificationRead(s, { id }, ctx) {
    const a = requireAuth(ctx)
    const n = s.notifications.find((x) => x.id === id && x.userId === a.id)
    if (!n) fail('not_found', 'That notification does not exist.', 404)
    n.read = true
    return n
  },
  markAllNotificationsRead(s, _p, ctx) {
    const a = requireAuth(ctx)
    s.notifications.filter((n) => n.userId === a.id).forEach((n) => { n.read = true })
  },

  /* ---------------- admin: queues, privacy ---------------- */
  reviewDecision(s, { id, status }, ctx) {
    requireRole(ctx, ROLES.ADMIN)
    const r = s.reviewItems.find((x) => x.id === id)
    if (!r) fail('not_found', 'That review item does not exist.', 404)
    if (!['In Review', 'Approved', 'Rejected', 'Closed'].includes(status)) fail('invalid_status', 'Unknown status.', 422)
    if (['Approved', 'Rejected', 'Closed'].includes(r.status)) fail('invalid_state', `This item is already ${r.status.toLowerCase()}.`, 409)
    r.status = status; r.decidedAt = ['Approved', 'Rejected', 'Closed'].includes(status) ? ctx.now.toISOString() : null
    audit(s, ctx, `${status === 'In Review' ? 'Started review of' : status} ${r.code}`, r.title, 'Approval')
    return r
  },
  exceptionAction(s, { id, action }, ctx) {
    requireRole(ctx, ROLES.ADMIN)
    const x = s.exceptions.find((e) => e.id === id)
    if (!x) fail('not_found', 'That exception does not exist.', 404)
    if (action === 'escalate') { if (x.status !== 'Open') fail('invalid_state', 'Only open exceptions can be escalated.', 409); x.status = 'Escalated' }
    else if (action === 'resolve') { if (x.status === 'Resolved') fail('invalid_state', 'Already resolved.', 409); x.status = 'Resolved' }
    else if (action === 'reopen') { if (x.status !== 'Resolved') fail('invalid_state', 'Only resolved exceptions can be reopened.', 409); x.status = 'Open' }
    else fail('invalid_action', 'Unknown action.', 400)
    audit(s, ctx, `${{ escalate: 'Escalated', resolve: 'Resolved', reopen: 'Reopened' }[action]} exception ${x.code}`, x.title, 'Exception')
    return x
  },
  /** Privacy deletion: personal data is removed, content and financial records stay. */
  anonymizeUser(s, { userId }, ctx) {
    requireRole(ctx, ROLES.ADMIN)
    const u = s.users[userId]
    if (!u) fail('not_found', 'That account does not exist.', 404)
    if (u.role === ROLES.ADMIN) fail('forbidden', 'Admin accounts cannot be anonymized here.', 403)
    const was = u.name
    u.name = 'Deleted user'; u.email = `deleted-${u.id}@anonymized.invalid`; u.phone = ''; u.bio = ''; u.city = ''; u.initials = 'DU'; u.status = 'anonymized'; u.pw = null
    audit(s, ctx, 'Anonymized account (financial records kept)', was, 'Privacy')
    return u
  },
}

/* ------------------------------------------------------------------ internals used by handlers */
/** The checks a nonprofit can ask autopilot to run (labels are what `np.autopilot.checks` stores). */
export const AUTOPILOT_CHECKS = ['Has cover photo', 'Story is at least 40 characters', 'Event date is in the future']
function autopilotPasses(ev, now, checks = AUTOPILOT_CHECKS) {
  const tests = {
    'Has cover photo': () => ev.photos?.length > 0,
    'Story is at least 40 characters': () => (ev.story ?? '').trim().length >= 40,
    'Event date is in the future': () => (startsAt(ev) ?? 0) > now,
  }
  return checks.every((label) => (tests[label] ? tests[label]() : true))
}
function refundOne(s, ctx, d, reason) {
  d.status = 'Refunded'; d.refundReason = reason; d.refundedAt = ctx.now.toISOString()
  notify(s, ctx, [d.donorId], 'donation_refunded', 'Your donation was refunded', `Your $${(d.amountCents / 100).toFixed(0)} donation to ${s.events[d.eventKey]?.title} was refunded.`, '')
}
function refundAll(s, ctx, key, reason) {
  const list = s.donations.filter((d) => d.eventKey === key && d.status === 'Successful' && !d.seeded)
  list.forEach((d) => refundOne(s, ctx, d, reason))
  return list.length
}
function findContent(s, kind, id, eventKey) {
  if (kind === 'post') { const p = s.posts.find((x) => x.id === id); if (!p) fail('not_found', 'That post does not exist.', 404); return p }
  if (kind === 'chat') { const m = (s.chat[eventKey] ?? []).find((x) => x.id === id); if (!m) fail('not_found', 'That message does not exist.', 404); return m }
  if (kind === 'reply') { for (const p of s.posts) { const r = p.replies.find((x) => x.id === id); if (r) return r } fail('not_found', 'That reply does not exist.', 404) }
  return fail('invalid_kind', 'Unknown content type.', 422)
}
