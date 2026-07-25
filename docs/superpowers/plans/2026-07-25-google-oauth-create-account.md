# Real Google Auth on Create Account — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace mock Google signup on Create Account with verified Google ID tokens; remove Sign up with email; keep email/password Sign in.

**Architecture:** GIS issues an ID token in the browser; `POST /auth/google` verifies it with `google-auth` against `GOOGLE_CLIENT_ID`, then upserts an SE user and returns Charity Hub JWTs.

**Tech Stack:** FastAPI, `google-auth`, Vite React, Google Identity Services script

## Global Constraints

- Create Account only (mobile + desktop); guest identity gates unchanged
- Never accept client-supplied email/name on `/auth/google`
- No `VITE_GOOGLE_CLIENT_SECRET` (secrets must not ship to the browser)
- Credentialed email + Google → 409 “please log in”
- Env: `GOOGLE_CLIENT_ID` (backend), `VITE_GOOGLE_CLIENT_ID` (frontend)

## File map

| File | Role |
|------|------|
| `backend/requirements.txt` | Add `google-auth` |
| `backend/app/core/config.py` | `google_client_id` |
| `backend/app/schemas/auth.py` | `GoogleAuthRequest(id_token)` |
| `backend/app/services/auth_service.py` | `google_login` replaces `google_mock` |
| `backend/app/api/v1/auth.py` | Wire new schema/service |
| `backend/tests/test_auth_service.py` | Mocked verifier tests |
| `backend/tests/test_auth_api.py` | API contract tests |
| `backend/.env.example` | Document `GOOGLE_CLIENT_ID` |
| `charity-app/.env.example` | Document `VITE_GOOGLE_CLIENT_ID` |
| `charity-app/src/utils/googleIdentity.js` | Load GIS + request credential |
| `charity-app/src/api/auth.js` | `googleLogin({ id_token })` |
| `charity-app/src/auth/AuthContext.jsx` | `googleLogin` |
| `charity-app/src/screens/CreateAccount.jsx` | GIS button; drop email signup |
| `charity-app/src/screens/desktop/DesktopCreateAccount.jsx` | Same |

---

### Task 1: Backend Google ID-token verify

**Files:**
- Modify: `backend/requirements.txt`, `backend/app/core/config.py`, `backend/app/schemas/auth.py`, `backend/app/services/auth_service.py`, `backend/app/api/v1/auth.py`, `backend/.env.example`
- Test: `backend/tests/test_auth_service.py`, `backend/tests/test_auth_api.py`

**Interfaces:**
- Produces: `async def google_login(db, id_token: str) -> tuple[User, dict]`
- Produces: `GoogleAuthRequest(id_token: str)`
- Consumes: `Settings.google_client_id`

- [ ] **Step 1:** Add `google-auth==2.37.0` to requirements; add `google_client_id: str = ""` to Settings; document in `.env.example`

- [ ] **Step 2:** Replace schema + service:

```python
# schemas/auth.py
class GoogleAuthRequest(BaseModel):
    id_token: str = Field(min_length=1)

# auth_service.py — verify with google.oauth2.id_token.verify_oauth2_token
# requests.Request() as clock skew transport; aud=settings.google_client_id
# require email + email_verified; then same upsert rules as former google_mock
```

- [ ] **Step 3:** Route: `auth_service.google_login(db, payload.id_token)`

- [ ] **Step 4:** Tests — monkeypatch verifier:
  - missing client id → 503
  - invalid token → 401
  - unverified email → 401
  - new user → se + tokens
  - credentialed email → 409
  - existing passwordless → tokens

- [ ] **Step 5:** Run `pytest tests/test_auth_service.py tests/test_auth_api.py -q`

---

### Task 2: Frontend GIS + Create Account UI

**Files:**
- Create: `charity-app/src/utils/googleIdentity.js`
- Modify: `charity-app/src/api/auth.js`, `charity-app/src/auth/AuthContext.jsx`, `charity-app/src/screens/CreateAccount.jsx`, `charity-app/src/screens/desktop/DesktopCreateAccount.jsx`, `charity-app/.env.example`
- Fix: remove `VITE_GOOGLE_CLIENT_SECRET` from local `charity-app/.env` if present

**Interfaces:**
- Consumes: `POST /auth/google` `{ id_token }`
- Produces: `requestGoogleIdToken(): Promise<string>`, `googleLogin({ id_token })`

- [ ] **Step 1:** `googleIdentity.js` — load `https://accounts.google.com/gsi/client`, `initialize` + Promise that resolves with `credential` via One Tap / prompt, or reject if no client id

- [ ] **Step 2:** Rename API/context `googleMock` → `googleLogin({ id_token })`

- [ ] **Step 3:** Create Account SE: remove Sign up with email; Google click → `requestGoogleIdToken` → `googleLogin` → `/about-you`

- [ ] **Step 4:** Mirror on desktop; update `.env.example`

- [ ] **Step 5:** Manual smoke: open Create Account, Google popup, land on Tell about you

---

### Spec coverage

| Spec item | Task |
|-----------|------|
| GIS + id_token | 2 |
| Backend verify | 1 |
| Remove email signup | 2 |
| Keep password Sign in | 2 (unchanged handlers) |
| 409 credentialed | 1 |
| Env docs | 1 + 2 |
| Guest gates out of scope | — |
