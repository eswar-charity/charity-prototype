# Frontend API Integration — Slice B0 Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the frontend API client, JWT AuthProvider (under AccessGate), shared toast, demo seed passwords, and wire register/login/identity-gate entry screens so later slices can call live APIs.

**Architecture:** Thin `fetch` wrapper in `charity-app/src/api/client.js` talking to `http://localhost:8000/api/v1` with Bearer + one-shot refresh. `AuthProvider` stores tokens in `localStorage` and exposes auth actions. AccessGate remains the outer unlock. Seed demo passwords for Mike/Alex so login works.

**Tech Stack:** Vite + React 19, native `fetch`, existing React Router; Node built-in `node:test` for pure client unit tests (no new npm deps). Backend seed tweak via existing pytest.

**Spec:** `docs/superpowers/specs/2026-07-24-frontend-api-integration-design.md` (slice B0 only).

**Follow-on:** Separate plans for B1–B5 after B0 lands.

## Global Constraints

- AccessGate stays layered; do not remove unlock codes.
- Default API base: `http://localhost:8000` via `VITE_API_BASE_URL`.
- No React Query / SWR / axios — native `fetch` only.
- Preserve UI/UX; no hero/card redesigns.
- Demo passwords (document + seed): SE/Admin/NP all use `Passw0rd!` for B0 convenience (NP already has this).
- Stage only task-scoped paths; commit each task.
- Frontend tests: `node --test` on pure modules under `charity-app/src/api/`. Backend: `cd backend && .venv\Scripts\python -m pytest …`.
- Do not wire Guest feed / SE wizard / NP / Admin data in this plan (B1+).

## File structure

| Path | Responsibility |
|------|----------------|
| `charity-app/.env.example` | `VITE_API_BASE_URL` |
| `charity-app/src/api/client.js` | `apiRequest`, tokens, refresh, `ApiError` |
| `charity-app/src/api/auth.js` | register/login/refresh/logout/me/identityGate/googleMock |
| `charity-app/src/api/users.js` | GET/PATCH profile |
| `charity-app/src/api/client.test.js` | node:test for ApiError + header helpers |
| `charity-app/src/auth/AuthContext.jsx` | Provider + `useAuth` |
| `charity-app/src/components/Toast.jsx` | Shared success/error toast (lifted from admin) |
| `charity-app/src/components/admin/useToast.jsx` | Re-export shared toast for admin screens |
| `charity-app/src/main.jsx` / `App.jsx` | Wrap AuthProvider inside AccessGate tree |
| `charity-app/src/screens/CreateAccount.jsx` (+ desktop twin) | Register / google mock / navigate |
| `charity-app/src/screens/TellAboutYou.jsx` (+ desktop) | PATCH profile causes after session |
| Identity gate screens (join/donate, mobile+desktop) | `POST /auth/identity-gate` then continue |
| `backend/seed/seed.py` | Set Mike + Alex passwords to `Passw0rd!` |
| `charity-app/README.md` or short note in root — demo login table |

---

### Task 1: Demo passwords on seed users (backend)

**Files:**
- Modify: `backend/seed/seed.py`
- Modify: `backend/tests/test_seed.py` (assert password_hash is set for mike + alex)
- Optional live SQL note in report (controller may update live users)

**Interfaces:**
- Produces: All three demo users login with password `Passw0rd!`.

- [ ] **Step 1: Update seed user creation**

In `backend/seed/seed.py`, pass password to Mike and Alex:

```python
    admin = await get_or_create_user(
        "platform_admin", "alex.mercer@charityhub.com", "Alex Mercer", "Passw0rd!"
    )
    mike = await get_or_create_user(
        "se", "mike.rivera@demo.charityhub.com", "Mike Rivera", "Passw0rd!"
    )
    np_admin = await get_or_create_user(
        "np_admin", "np@charityhub.com", "Nonprofit Admin", "Passw0rd!"
    )
```

Also update `get_or_create_user` so if the user exists but `password_hash` is `None`, set it:

```python
    async def get_or_create_user(role, email, name, password=None):
        u = (
            await session.execute(select(User).where(User.email == email))
        ).scalar_one_or_none()
        if u:
            if password and not u.password_hash:
                u.password_hash = hash_password(password)
            return u
        u = _user(role, email, name, password)
        session.add(u)
        await session.flush()
        return u
```

- [ ] **Step 2: Extend seed test**

In `test_seed.py`, after seed:

```python
    from app.core.security import verify_password
    mike = (
        await db_session.execute(
            select(User).where(User.email == "mike.rivera@demo.charityhub.com")
        )
    ).scalar_one()
    assert mike.password_hash
    assert verify_password("Passw0rd!", mike.password_hash)
```

- [ ] **Step 3: Run tests**

```powershell
cd backend
.venv\Scripts\python -m pytest tests/test_seed.py -v
```

Expected: PASS.

- [ ] **Step 4: Commit**

```powershell
git add backend/seed/seed.py backend/tests/test_seed.py
git commit -m "fix(backend): set demo passwords for SE and admin seed users"
```

- [ ] **Step 5: Live DB (controller or implementer with MCP)**

```sql
-- Only if password_hash is null; use app hash via seed re-run preferred:
-- Prefer: run `python -m seed.seed` against DATABASE_URL if reachable.
-- Else document that local login works after reseed.
```

If live update is blocked, note in commit/PR body: reseed or set hashes before demoing against Supabase.

---

### Task 2: `api/client.js` + unit tests

**Files:**
- Create: `charity-app/src/api/client.js`
- Create: `charity-app/src/api/client.test.js`
- Create: `charity-app/.env.example`

**Interfaces:**
- Produces:
  - `export class ApiError extends Error { constructor(code, message, details, status) }`
  - `export function getAccessToken(): string | null`
  - `export function getRefreshToken(): string | null`
  - `export function setTokens({ access_token, refresh_token })`
  - `export function clearTokens()`
  - `export async function apiRequest(path, { method, body, auth=true, headers } = {}): Promise<any>`
  - Storage keys: `ch_access_token`, `ch_refresh_token`
  - Base: `import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'` + `/api/v1`

- [ ] **Step 1: Write failing node tests**

`charity-app/src/api/client.test.js`:

```js
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ApiError } from './client.js';

describe('ApiError', () => {
  it('exposes code message status', () => {
    const err = new ApiError('unauthorized', 'Nope', null, 401);
    assert.equal(err.code, 'unauthorized');
    assert.equal(err.message, 'Nope');
    assert.equal(err.status, 401);
    assert.equal(err.name, 'ApiError');
  });
});
```

Note: `client.js` must use exports that work under both Vite and `node --test`. Prefer plain ESM without `import.meta.env` in the test path — read base URL via:

```js
export function getApiBase() {
  try {
    return (import.meta.env && import.meta.env.VITE_API_BASE_URL) || 'http://localhost:8000';
  } catch {
    return process.env.VITE_API_BASE_URL || 'http://localhost:8000';
  }
}
```

Or split `errors.js` for ApiError-only tests. **Prefer:** put `ApiError` in `client.js` and run tests with Node that supports `import.meta` (Node 20+). If `import.meta.env` throws under node, guard as above.

- [ ] **Step 2: Run test — expect FAIL (module missing)**

```powershell
cd charity-app
node --test src/api/client.test.js
```

- [ ] **Step 3: Implement `client.js`**

```js
const ACCESS_KEY = 'ch_access_token';
const REFRESH_KEY = 'ch_refresh_token';

export class ApiError extends Error {
  constructor(code, message, details = null, status = 0) {
    super(message || code || 'request_failed');
    this.name = 'ApiError';
    this.code = code || 'request_failed';
    this.details = details;
    this.status = status;
  }
}

export function getApiBase() {
  const fromVite = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL;
  return fromVite || 'http://localhost:8000';
}

export function getAccessToken() {
  return localStorage.getItem(ACCESS_KEY);
}
export function getRefreshToken() {
  return localStorage.getItem(REFRESH_KEY);
}
export function setTokens({ access_token, refresh_token }) {
  if (access_token) localStorage.setItem(ACCESS_KEY, access_token);
  if (refresh_token) localStorage.setItem(REFRESH_KEY, refresh_token);
}
export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

async function parseError(res) {
  let payload = null;
  try {
    payload = await res.json();
  } catch {
    /* ignore */
  }
  const err = payload && payload.error;
  throw new ApiError(
    err?.code || 'http_error',
    err?.message || res.statusText || 'Request failed',
    err?.details ?? null,
    res.status,
  );
}

let refreshPromise = null;

async function refreshAccessToken() {
  const refresh_token = getRefreshToken();
  if (!refresh_token) throw new ApiError('unauthorized', 'Not signed in', null, 401);
  const res = await fetch(`${getApiBase()}/api/v1/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token }),
  });
  if (!res.ok) {
    clearTokens();
    await parseError(res);
  }
  const data = await res.json();
  setTokens(data);
  return data.access_token;
}

export async function apiRequest(path, options = {}) {
  const { method = 'GET', body, auth = true, headers = {}, _retried = false } = options;
  const url = path.startsWith('http') ? path : `${getApiBase()}/api/v1${path.startsWith('/') ? path : `/${path}`}`;
  const finalHeaders = { ...headers };
  if (body !== undefined && !(body instanceof FormData)) {
    finalHeaders['Content-Type'] = finalHeaders['Content-Type'] || 'application/json';
  }
  if (auth) {
    const token = getAccessToken();
    if (token) finalHeaders.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(url, {
    method,
    headers: finalHeaders,
    body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body),
  });
  if (res.status === 401 && auth && !_retried) {
    refreshPromise = refreshPromise || refreshAccessToken().finally(() => { refreshPromise = null; });
    await refreshPromise;
    return apiRequest(path, { ...options, _retried: true });
  }
  if (!res.ok) await parseError(res);
  if (res.status === 204) return null;
  const text = await res.text();
  if (!text) return null;
  return JSON.parse(text);
}
```

- [ ] **Step 4: `.env.example`**

```
VITE_API_BASE_URL=http://localhost:8000
```

- [ ] **Step 5: Re-run tests — PASS**

```powershell
node --test src/api/client.test.js
```

- [ ] **Step 6: Commit**

```powershell
git add charity-app/src/api/client.js charity-app/src/api/client.test.js charity-app/.env.example
git commit -m "feat(app): add API client with JWT refresh and ApiError"
```

---

### Task 3: `api/auth.js` + `api/users.js`

**Files:**
- Create: `charity-app/src/api/auth.js`
- Create: `charity-app/src/api/users.js`

**Interfaces:**
- Produces:
  - `login({ email, password })` → TokenResponse (sets tokens)
  - `register({ name, email, password, role })` → UserRead
  - `refresh()` → TokenResponse
  - `logout()` → clear + POST logout if token present
  - `me()` → UserRead
  - `identityGate({ email, phone, name })` → TokenResponse (sets tokens)
  - `googleMock({ email, name })` → TokenResponse (sets tokens)
  - `getProfile()` / `updateProfile(patch)`

- [ ] **Step 1: Implement auth.js**

```js
import { apiRequest, setTokens, clearTokens } from './client.js';

export async function login(body) {
  const data = await apiRequest('/auth/login', { method: 'POST', body, auth: false });
  setTokens(data);
  return data;
}

export async function register(body) {
  return apiRequest('/auth/register', { method: 'POST', body, auth: false });
}

export async function refresh() {
  const { getRefreshToken, setTokens: set } = await import('./client.js');
  const data = await apiRequest('/auth/refresh', {
    method: 'POST',
    body: { refresh_token: getRefreshToken() },
    auth: false,
  });
  set(data);
  return data;
}

export async function logout() {
  try {
    await apiRequest('/auth/logout', { method: 'POST' });
  } catch {
    /* ignore */
  }
  clearTokens();
}

export async function me() {
  return apiRequest('/auth/me');
}

export async function identityGate(body) {
  const data = await apiRequest('/auth/identity-gate', { method: 'POST', body, auth: false });
  setTokens(data);
  return data;
}

export async function googleMock(body) {
  const data = await apiRequest('/auth/google', { method: 'POST', body, auth: false });
  setTokens(data);
  return data;
}
```

Simplify `refresh` to use already-imported `setTokens` / `getRefreshToken` from `./client.js` (no dynamic import).

- [ ] **Step 2: Implement users.js**

```js
import { apiRequest } from './client.js';

export function getProfile() {
  return apiRequest('/me/profile');
}

export function updateProfile(patch) {
  return apiRequest('/me/profile', { method: 'PATCH', body: patch });
}
```

Confirm users router prefix: backend mounts at `/api/v1` + users routes — check `users.py` for path (`/me/profile` vs `/users/profile`). **Use the actual OpenAPI paths** from `backend/app/api/v1/users.py` (currently `GET/PATCH /profile` under a router prefix — verify).

If router is `prefix="/me"` and route `/profile`, path is `/me/profile`. If only `/profile`, path is `/profile`. Read file before coding and match exactly.

- [ ] **Step 3: Manual smoke (backend running)**

```powershell
# terminal A
cd backend
.venv\Scripts\uvicorn app.main:app --reload

# terminal B — after seed passwords exist
curl -s -X POST http://localhost:8000/api/v1/auth/login -H "Content-Type: application/json" -d "{\"email\":\"np@charityhub.com\",\"password\":\"Passw0rd!\"}"
```

Expected: JSON with `access_token`.

- [ ] **Step 4: Commit**

```powershell
git add charity-app/src/api/auth.js charity-app/src/api/users.js
git commit -m "feat(app): add auth and profile API modules"
```

---

### Task 4: Shared Toast + AuthProvider

**Files:**
- Create: `charity-app/src/components/Toast.jsx` (hook + UI, success/error)
- Modify: `charity-app/src/components/admin/useToast.jsx` → re-export from shared
- Create: `charity-app/src/auth/AuthContext.jsx`
- Modify: `charity-app/src/App.jsx` (or `main.jsx`) — mount `AuthProvider` **inside** AccessGate children

**Interfaces:**
- Produces: `useAuth()` → `{ user, loading, error, login, register, logout, identityGate, googleMock, refreshUser, isAuthenticated }`
- Produces: `useAppToast()` / `ToastHost` with `show(message, { variant: 'success'|'error' })`

- [ ] **Step 1: Shared toast**

Move logic from admin `useToast` into `components/Toast.jsx`. Support `variant: 'error'` (red) vs success (existing). Keep `adm-toast` class for admin; add `app-toast` / `app-toast--error` in `index.css` (minimal).

Update admin imports to:

```js
export { useToast, Toast } from '../Toast';
```

Or keep `useToast.jsx` as thin re-export so admin screens need no path changes.

- [ ] **Step 2: AuthContext**

```jsx
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import * as authApi from '../api/auth';
import { clearTokens, getAccessToken } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    if (!getAccessToken()) {
      setUser(null);
      return null;
    }
    const me = await authApi.me();
    setUser(me);
    return me;
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (getAccessToken()) {
          const me = await authApi.me();
          if (!cancelled) setUser(me);
        }
      } catch {
        clearTokens();
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    async login(creds) {
      await authApi.login(creds);
      return refreshUser();
    },
    async register(payload) {
      await authApi.register(payload);
      await authApi.login({ email: payload.email, password: payload.password });
      return refreshUser();
    },
    async logout() {
      await authApi.logout();
      setUser(null);
    },
    async identityGate(payload) {
      await authApi.identityGate(payload);
      return refreshUser();
    },
    async googleMock(payload) {
      await authApi.googleMock(payload);
      return refreshUser();
    },
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth requires AuthProvider');
  return ctx;
}
```

- [ ] **Step 3: Mount provider**

Read `App.jsx` AccessGate usage. Wrap the routed app **inside** AccessGate’s unlocked tree so gate still runs first:

```jsx
<AccessGate>
  <AuthProvider>
    <BrowserRouter>…</BrowserRouter>
  </AuthProvider>
</AccessGate>
```

(Adjust to match actual AccessGate children structure.)

- [ ] **Step 4: Manual check**

Unlock AccessGate → DevTools: no crash; `useAuth().loading` settles; no token ⇒ `user === null`.

- [ ] **Step 5: Commit**

```powershell
git add charity-app/src/components/Toast.jsx charity-app/src/components/admin/useToast.jsx charity-app/src/auth/AuthContext.jsx charity-app/src/App.jsx charity-app/src/index.css
git commit -m "feat(app): add AuthProvider and shared toast under AccessGate"
```

---

### Task 5: Wire CreateAccount + TellAboutYou (+ desktop twins)

**Files:**
- Modify: `CreateAccount.jsx`, `DesktopCreateAccount.jsx`
- Modify: `TellAboutYou.jsx`, `DesktopTellAboutYou.jsx`

**Interfaces:**
- Consumes: `useAuth().register | googleMock | login`, `useAppToast`, `updateProfile`
- SE email path: collect email/password (minimal fields — add inputs if screen currently only navigates) → `register({ role:'se', … })` → `/about-you`
- Google button → `googleMock({ email, name })` then `/about-you` (use placeholder email only if UI has no fields — prefer small email/name fields or prompt)
- TellAboutYou Continue → `updateProfile({ name, bio, city, causes })` then navigate `/feed`
- Toast errors; disable buttons while pending

**Keep UI layout**; only add necessary inputs if missing for register (email + password for SE email signup). Guest/NP/Admin role “Continue” can keep route navigation for now (NP/Admin login can be a follow-up mini form or navigate to feed with documented credentials — for B0, add a simple email/password sign-in when role is np/admin, calling `login` then `role.route`).

- [ ] **Step 1: Implement mobile CreateAccount auth actions**
- [ ] **Step 2: Mirror desktop CreateAccount**
- [ ] **Step 3: TellAboutYou PATCH profile on submit**
- [ ] **Step 4: Mirror desktop TellAboutYou**
- [ ] **Step 5: Manual E2E with API up**

1. Unlock AccessGate  
2. Register new SE email or login `mike.rivera@demo.charityhub.com` / `Passw0rd!`  
3. Complete about-you → lands on feed (still mock data — OK for B0)  
4. Confirm `GET /auth/me` works (Network tab)

- [ ] **Step 6: Commit**

```powershell
git commit -m "feat(app): wire create-account and about-you to live auth/profile APIs"
```

---

### Task 6: Wire identity-gate screens (join + donate, mobile + desktop)

**Files:**
- Modify: `IdentityGateJoin.jsx`, `IdentityGateDonate.jsx`, desktop twins, and any shared gate modals that submit phone/email

**Interfaces:**
- On primary CTA: `await identityGate({ phone and/or email, name })` then navigate to existing success/next route
- Toast on failure; loading on button

- [ ] **Step 1–4:** Wire four screens/modals consistently  
- [ ] **Step 5: Manual** — submit phone → tokens in localStorage → `user.role === 'guest_lead'`  
- [ ] **Step 6: Commit**

```powershell
git commit -m "feat(app): wire identity gates to live auth identity-gate API"
```

---

### Task 7: Document demo logins

**Files:**
- Create or modify: `charity-app/README.md` (short runbook)

```markdown
## Live API (local)

1. Start backend: `cd backend && .venv\Scripts\uvicorn app.main:app --reload`
2. Copy `.env.example` → `.env` if needed (`VITE_API_BASE_URL=http://localhost:8000`)
3. `npm run dev` in `charity-app`
4. Unlock AccessGate, then sign in:

| Role | Email | Password |
|------|-------|----------|
| SE | mike.rivera@demo.charityhub.com | Passw0rd! |
| NP | np@charityhub.com | Passw0rd! |
| Admin | alex.mercer@charityhub.com | Passw0rd! |

Guest: use Join/Donate identity gate (phone or email).
```

- [ ] **Step 1: Write README section**
- [ ] **Step 2: Commit**

```powershell
git commit -m "docs(app): document local API and demo login credentials"
```

---

## B0 exit criteria

- [ ] `api/client` + auth/users modules exist; node test for ApiError passes
- [ ] AuthProvider restores session; AccessGate still required
- [ ] CreateAccount / TellAboutYou / identity gates call live APIs
- [ ] Demo users login with `Passw0rd!` against local API
- [ ] Shared toast shows API errors on those flows
- [ ] Guest feed still mock (deferred to B1) — expected

## Plan self-review

| Spec B0 item | Task |
|--------------|------|
| client + JWT refresh | Task 2 |
| auth/users modules | Task 3 |
| AuthProvider under AccessGate | Task 4 |
| Shared toast | Task 4 |
| `.env.example` | Task 2 |
| CreateAccount / TellAboutYou / identity-gate | Tasks 5–6 |
| Demo passwords | Task 1 + 7 |
| No B1+ mock replacement | Explicitly deferred |
