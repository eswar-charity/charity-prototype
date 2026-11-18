// Seed state for the prototype, derived from the existing project data:
//   - events.json / nonprofits.json / categories.json / timelines.json  (generated from backend/seed)
//   - demo identities from backend/seed/se_accounts.py, np_accounts.py and the admin in seed.py
// A handful of extra events exist ONLY so every lifecycle state (Draft, Submitted, Changes Requested,
// Rejected, Live now, NP-led) can be walked through. They are demo content and labelled as such in the UI.
import rawEvents from '../data/events.json'
import rawNonprofits from '../data/nonprofits.json'
import timelines from '../data/timelines.json'
import categories from '../data/categories.json'
import { eventStart } from '../lib/format.js'

export const SCHEMA_VERSION = 3
/** The prototype's clock starts at the real current time and can be moved by the admin demo clock. */
export const initialNow = () => new Date().toISOString()

const COLORS = ['#007db5', '#00569d', '#0e2b47', '#5cb8e6']
const colorOf = (s) => COLORS[[...s].reduce((a, c) => a + c.charCodeAt(0), 0) % COLORS.length]
export const initialsOf = (name) =>
  name.replace(/[^A-Za-z ]/g, '').split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase()

const user = (id, role, name, email, extra = {}) => ({
  id, role, name, email, phone: '', initials: initialsOf(name), color: colorOf(name),
  bio: '', city: '', status: 'active', ...extra,
})

/** SE demo accounts (backend/seed/se_accounts.py) */
export const SE_ACCOUNTS = [
  user('u_mike', 'se', 'Mike Rivera', 'mike.rivera@demo.charityhub.com', { city: 'Brooklyn, NY', bio: 'I throw events people remember: neon nights, trail runs and dog-friendly mornings.' }),
  user('u_jordan', 'se', 'Jordan Blake', 'jordan.blake@demo.charityhub.com', { city: 'Hoboken, NJ', bio: 'Pet-friendly community events.' }),
  user('u_sam', 'se', 'Sam Okonkwo', 'sam.okonkwo@demo.charityhub.com', { city: 'Newark, NJ', bio: 'Book drives and school fundraisers.' }),
  user('u_priya', 'se', 'Priya Desai', 'priya.desai@demo.charityhub.com', { city: 'Jersey City, NJ', bio: 'Karaoke, quiz nights and family fun.' }),
]

/** NP admin demo accounts (backend/seed/np_accounts.py): email → nonprofit common name */
const NP_ADMINS = [
  ['redcross', 'American Red Cross'], ['feedingamerica', 'Feeding America'], ['stjude', "St. Jude Children's Research Hospital"],
  ['habitat', 'Habitat for Humanity'], ['unitedway', 'United Way'], ['goodwill', 'Goodwill'],
  ['bgca', 'Boys & Girls Clubs of America'], ['ymca', 'YMCA of the USA'], ['bbbs', 'Big Brothers Big Sisters'],
  ['makeawish', 'Make-A-Wish America'], ['rmhc', 'Ronald McDonald House Charities'], ['komen', 'Susan G. Komen'],
  ['acs', 'American Cancer Society'], ['alz', "Alzheimer's Association"], ['nature', 'The Nature Conservancy'],
  ['sierraclub', 'Sierra Club Foundation'], ['charitywater', 'charity: water'], ['wwf', 'World Wildlife Fund (WWF-US)'],
  ['aspca', 'ASPCA'], ['msf', 'Doctors Without Borders USA'],
]

/** Nonprofits that stay in a non-Active state so verification and invites can be demonstrated. */
const INVITED_SLUG = 'doctors-without-borders-usa' // invited, never accepted
const PENDING_SLUG = 'world-wildlife-fund-wwf-us' // accepted + documents uploaded, awaiting admin
const STRIPE_READY = new Set(['united-way', 'st-jude-children-s-research-hospital', 'the-nature-conservancy', 'sierra-club-foundation', 'aspca', 'goodwill', 'feeding-america', 'american-red-cross'])

export const DOC_TYPES = [
  { type: 'irs', label: 'IRS determination letter' },
  { type: 'w9', label: 'Form W-9' },
  { type: 'authority', label: 'Authorization to act for the nonprofit' },
]
const docs = (status) => DOC_TYPES.map((d) => ({ id: `${d.type}`, type: d.type, label: d.label, name: status === 'Missing' ? '' : `${d.type}-document.pdf`, status, note: '' }))

export function buildSeed(now = initialNow()) {
  const nowMs = new Date(now).getTime()
  const iso = (ms) => new Date(ms).toISOString()
  const day = 864e5

  // ---------- users ----------
  const users = {}
  const add = (u) => { users[u.id] = u; return u }
  const admin = add(user('u_admin', 'platform_admin', 'Alex Mercer', 'alex.mercer@charityhub.com'))
  SE_ACCOUNTS.forEach(add)
  const marcus = add(user('u_marcus', 'guest_lead', 'Marcus L.', 'marcus.l@demo.charityhub.com'))
  const emma = add(user('u_emma', 'guest_lead', 'Emma J.', 'emma.j@demo.charityhub.com'))

  // ---------- nonprofits ----------
  const nonprofits = {}
  const npBySlug = {}
  rawNonprofits.forEach((n) => {
    const invited = n.slug === INVITED_SLUG
    const pending = n.slug === PENDING_SLUG
    const ready = STRIPE_READY.has(n.slug)
    const np = {
      id: n.slug, slug: n.slug, name: n.name, legalName: n.legalName, ein: n.ein, category: n.category, cause: n.cause,
      mission: n.mission, story: `${n.name} has been at this since ${n.founded ?? 'the beginning'}. ${n.mission}`,
      headquarters: n.headquarters, founded: n.founded,
      status: invited ? 'Invited' : pending ? 'Pending' : 'Active',
      verified: !invited && !pending,
      settlement: ready ? 'Ready' : invited ? 'Not ready' : pending ? 'Pending' : 'Not ready',
      stripe: ready
        ? { state: 'connected', mode: 'link', account: `acct_${n.slug.replace(/-/g, '').slice(0, 10)}`, available: 0, pending: 0 }
        : { state: 'none', mode: null, account: '', available: 0, pending: 0 },
      documents: invited ? docs('Missing') : pending ? docs('Uploaded') : docs('Approved'),
      passwordSet: !invited,
      autopilot: { enabled: false, checks: ['Has cover photo', 'Story is at least 40 characters', 'Event date is in the future'], trustedSeIds: [] },
      invite: invited ? { token: 'invite-msf-demo', expiresAt: iso(nowMs + 7 * day), usedAt: null } : null,
      source: 'ProPublica / IRS BMF',
    }
    nonprofits[np.id] = np
    npBySlug[np.slug] = np
  })
  NP_ADMINS.forEach(([handle, common]) => {
    const np = rawNonprofits.find((n) => n.name === common)
    if (!np) return
    const status = nonprofits[np.slug].status
    add(user(`u_np_${handle}`, 'np_admin', `${common} Admin`, `${handle}@charityhub.com`, {
      nonprofitId: np.slug, status: status === 'Invited' ? 'pending' : 'active',
    }))
  })

  // ---------- events ----------
  const events = {}
  const posts = []
  const chat = {}
  const donations = []
  const notifications = []
  let pid = 0
  const uid = (p) => `${p}_${++pid}`

  const baseEvent = (e, over = {}) => ({
    key: e.key, title: e.title, story: e.mission, mission: e.mission, subtitle: e.mission, category: e.category,
    nonprofitId: e.nonprofit, organizerId: 'u_mike', kind: 'SE-led', status: 'Live', visibility: 'public',
    date: e.date, start: e.start, end: e.end, endDate: '', location: e.location,
    photoKey: e.key, photos: [], focus: e.focus,
    baseRaised: e.raised, baseBacked: e.backed, baseJoined: e.joined, baseChat: e.chat,
    goal: Math.ceil((e.raised * 1.35) / 1000) * 1000,
    joinedIds: [], likedIds: [], savedIds: [], tickets: {}, checkins: [],
    wizardStep: 4, guidelinesAccepted: true, review: null, blocked: null,
    createdAt: iso(nowMs - 40 * day), submittedAt: iso(nowMs - 38 * day), liveAt: iso(nowMs - 37 * day),
    completedAt: null, archivedAt: null, deletedAt: null, ...over,
  })

  rawEvents.forEach((e) => {
    events[e.key] = baseEvent(e)
    // community timeline (demo content) → posts
    const start = eventStart(e.date, e.start).getTime()
    ;(timelines[e.key] ?? []).forEach((p, i) => {
      const voice = p.author && typeof p.author === 'object' ? p.author : null
      posts.push({
        id: `p_${e.key}_${i}`, eventKey: e.key, phase: p.phase, text: p.text,
        authorId: voice ? `v_${voice.name}` : p.author === 'nonprofit' ? `np:${e.nonprofit}` : 'u_mike',
        authorName: voice ? voice.name : p.author === 'nonprofit' ? null : 'Mike Rivera',
        host: !voice, verified: !voice, highlight: p.highlight ?? '',
        mediaUrl: p.image ? `/photos/${e.key}/img${(i % 8) + 1}.jpg` : '',
        createdAt: iso(start + p.h * 36e5), replies: [], likes: [], hidden: false, removed: false, flags: [],
      })
    })
    chat[e.key] = [
      { id: `c_${e.key}_1`, authorId: 'u_marcus', text: 'Counting down the days. Who else is coming?', mediaUrl: '', createdAt: iso(nowMs - 3 * day), hidden: false, flags: [] },
      { id: `c_${e.key}_2`, authorId: 'u_emma', text: 'First Charity Hub event for me, so excited.', mediaUrl: '', createdAt: iso(nowMs - 2 * day), hidden: false, flags: [] },
    ]
  })

  // Extra demo events: every lifecycle state, so approval / fix / resubmit / live flows are walkable.
  const fmt = (ms) => new Date(ms).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const dogs = rawEvents.find((e) => e.key === 'dog-dad')
  const run = rawEvents.find((e) => e.key === 'breakneck-ridge-run')
  const neon = rawEvents.find((e) => e.key === 'neon-night')
  const golf = rawEvents.find((e) => e.key === 'golf-outing')
  const giveNow = rawEvents.find((e) => e.key === 'give-now')
  const extra = (key, title, srcEvent, np, over) => {
    events[key] = baseEvent({ ...srcEvent, key, title, nonprofit: np, raised: 0, backed: 0, joined: 0, chat: 0 }, {
      photoKey: srcEvent.key, baseRaised: 0, baseBacked: 0, baseJoined: 0, baseChat: 0, goal: 5000, ...over,
    })
    chat[key] = []
  }
  // Live right now, NP-led by Sierra Club Foundation (starts earlier today, ends tonight)
  const todayStart = new Date(nowMs); todayStart.setHours(9, 0, 0, 0)
  extra('river-cleanup', '#RiverCleanupDay', run, 'sierra-club-foundation', {
    organizerId: 'u_np_sierraclub', kind: 'NP-led', date: fmt(todayStart.getTime()), start: '9:00 AM', end: '11:59 PM',
    location: 'Hudson River Waterfront Park, NY', category: 'Environment', mission: 'Gloves, grabbers and a whole lot of river.',
    story: 'Gloves, grabbers and a whole lot of river. Join the Sierra Club crew for a day on the water front.',
    baseJoined: 41, baseBacked: 17, baseRaised: 1260, goal: 3000, liveAt: iso(todayStart.getTime() - 5 * day),
  })
  extra('paws-in-the-park', '#PawsInThePark', dogs, 'aspca', {
    organizerId: 'u_jordan', status: 'Submitted', date: fmt(nowMs + 26 * day), start: '10:00 AM', end: '1:00 PM',
    location: 'Pier A Park, Hoboken NJ', mission: 'A sunny walk for every wagging tail.', story: 'A sunny walk for every wagging tail. Bring your dog, bring your friends and walk the pier together for the ASPCA.',
    submittedAt: iso(nowMs - 1 * day), liveAt: null,
  })
  extra('book-drive-bash', '#BookDriveBash', giveNow, 'united-way', {
    organizerId: 'u_sam', status: 'Changes Requested', category: 'Education', date: fmt(nowMs + 40 * day), start: '2:00 PM', end: '6:00 PM',
    location: 'Newark Public Library, NJ', mission: 'Stack the shelves, win the night.', story: 'Stack the shelves, win the night.',
    review: { decision: 'changes_requested', areas: ['Photos', 'Story'], feedback: 'Please add two clearer photos and tell us how the books reach classrooms.', reason: '', at: iso(nowMs - 2 * day), by: 'u_np_unitedway' },
    submittedAt: iso(nowMs - 4 * day), liveAt: null, wizardStep: 4,
  })
  extra('karaoke-for-kids', '#KaraokeForKids', neon, 'st-jude-children-s-research-hospital', {
    organizerId: 'u_priya', status: 'Rejected', category: 'Health', date: fmt(nowMs + 33 * day), start: '7:00 PM', end: '10:00 PM',
    location: 'Journal Square, Jersey City NJ', mission: 'Sing loud for a good cause.', story: 'Sing loud for a good cause.',
    review: { decision: 'rejected', areas: [], feedback: '', reason: 'The venue is not confirmed yet. Please resubmit once it is booked.', at: iso(nowMs - 3 * day), by: 'u_np_stjude' },
    submittedAt: iso(nowMs - 5 * day), liveAt: null,
  })
  extra('spring-sprint', '#SpringSprint', run, '', {
    organizerId: 'u_mike', status: 'Draft', wizardStep: 2, guidelinesAccepted: false, category: 'Sports', date: '', start: '', end: '',
    location: '', mission: 'A 5K that ends with pancakes.', story: 'A 5K that ends with pancakes.',
    createdAt: iso(nowMs - 1 * day), submittedAt: null, liveAt: null,
  })
  // an SE-led Live event for Mike on a trusted partner, so dashboards have a second running event
  void golf

  // seeded donations (already counted in each event's base totals) so lists and receipts have history
  const names = ['Kind Kim', 'Anonymous', 'Marcus L.', 'Emma J.']
  rawEvents.forEach((e, ei) => {
    ;[25, 50, 75, 100].forEach((amt, i) => {
      const fee = Math.round(amt * 100 * 0.029 + 30)
      donations.push({
        id: `d_seed_${e.key}_${i}`, eventKey: e.key, nonprofitId: e.nonprofit, donorId: i === 2 ? 'u_marcus' : i === 3 ? 'u_emma' : null,
        publicName: names[i], anonymous: names[i] === 'Anonymous', amountCents: amt * 100, tipCents: 0, feeCents: fee,
        totalCents: amt * 100 + fee, status: 'Successful', ref: `mock_${amt}_4242`, receiptNo: `CH-${1000 + ei * 10 + i}`,
        createdAt: iso(nowMs - (ei + i + 2) * day), seeded: true,
      })
    })
  })

  // approval-request notification for the ASPCA admin, and an outcome for Sam / Priya
  const note = (userId, type, title, body, link, ageDays = 0) =>
    notifications.push({ id: uid('n'), userId, type, title, body, link, read: false, createdAt: iso(nowMs - ageDays * day) })
  note('u_np_aspca', 'approval_requested', 'New event waiting for approval', '#PawsInThePark by Jordan Blake is waiting for your approval.', '/np/approvals', 1)
  note('u_sam', 'changes_requested', 'Changes requested', 'United Way asked for changes to #BookDriveBash.', '/se/approval/book-drive-bash', 2)
  note('u_priya', 'event_rejected', 'Event not approved', '#KaraokeForKids was not approved. You can edit and resubmit it.', '/se/approval/karaoke-for-kids', 3)

  // ---------- admin queues ----------
  const reviewItems = [
    { id: 'rv_2041', code: 'RV-2041', type: 'Nonprofit Verification', title: 'Verify World Wildlife Fund (WWF-US)', entityRef: PENDING_SLUG, submittedBy: 'System', submittedRole: 'system', status: 'New', priority: 'High', summary: 'Nonprofit accepted its invite and uploaded three documents.', checks: [{ label: 'EIN format', ok: true }, { label: 'Documents uploaded (3 of 3)', ok: true }, { label: 'Stripe connected', ok: false }], createdAt: iso(nowMs - 1 * day), decidedAt: null },
    { id: 'rv_2042', code: 'RV-2042', type: 'SE Event', title: 'Review #DogDads', entityRef: 'dog-dad', submittedBy: 'Mike Rivera', submittedRole: 'se', status: 'In Review', priority: 'Medium', summary: 'SE-created event awaiting brand-safety review.', checks: [{ label: 'Has cover photo', ok: true }, { label: 'Nonprofit active', ok: true }], createdAt: iso(nowMs - 2 * day), decidedAt: null },
  ]
  const exceptions = [
    { id: 'ex_118', code: 'EX-118', type: 'Payout', title: 'Payout hold on golf outing', entityRef: "St. Jude Children's Research Hospital", severity: 'High', status: 'Open', amount: 6800, createdAt: iso(nowMs - 6 * day) },
  ]
  const audit = [
    { id: 'au_1', at: iso(nowMs - 9 * day), actor: 'Alex Mercer', role: 'platform_admin', action: 'Verified nonprofit', target: 'American Red Cross', category: 'Verification' },
  ]

  // Order matters for nothing, but keep admin id reachable
  void admin

  return {
    version: SCHEMA_VERSION, now, seq: pid + 1000,
    session: { userId: null, pending: null, notice: null },
    users, nonprofits, events, posts, chat, donations, notifications, reviewItems, exceptions, audit,
    follows: [], // { userId, nonprofitId }
    categories,
  }
}

export const NP_ACCOUNT_BY_NONPROFIT = Object.fromEntries(NP_ADMINS.map(([h, c]) => [rawNonprofits.find((n) => n.name === c)?.slug, `${h}@charityhub.com`]))
