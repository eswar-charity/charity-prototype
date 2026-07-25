# Real Google Auth on Create Account — Design

**Date:** 2026-07-25  
**Status:** Approved — implemented  
**Depends on:** Existing auth (`/auth/google` mock, JWT sessions), Create Account screens (mobile + desktop)

---

## 1. Objective

Replace prototype mock Google signup on **Create Account** with real **Google Identity Services (GIS)** ID-token auth. Remove **Sign up with email**. Keep email + password for existing-account **Sign in** (and for NP / Admin Continue).

Guest identity gates are **out of scope** (phone / email gate unchanged).

---

## 2. Locked decisions

| Topic | Decision |
|-------|----------|
| Approach | GIS button → Google ID token → backend verifies → issue Charity Hub JWT |
| Surfaces | `CreateAccount.jsx` + `DesktopCreateAccount.jsx` only (SE role) |
| Remove | **Sign up with email** button and its `register` path from SE signup CTAs |
| Keep | Email + password fields; **Sign in** for SE; NP/Admin/Guest role continue as today |
| Env | User supplies Client ID in env: `VITE_GOOGLE_CLIENT_ID` (app) + `GOOGLE_CLIENT_ID` (API) |
| Client secret | Not required (ID-token verify only) |
| Existing password account | Same email + Google → **409** “please log in” (preserve current mock semantics) |
| New Google user | Create `role=se`, `password_hash=None`, name from Google profile |
| Existing Google / passwordless SE | Login and issue tokens |
| Guest gates | Unchanged |

---

## 3. Backend

### 3.1 Config

Add `google_client_id: str = ""` to `Settings` (env `GOOGLE_CLIENT_ID`). Document in `backend/.env.example`.

If `GOOGLE_CLIENT_ID` is empty when `/auth/google` is called → **503** with a clear message (misconfigured).

### 3.2 Request schema

Replace `GoogleMockRequest` with `GoogleAuthRequest`:

```text
id_token: str  # required, non-empty
```

Remove accepting raw `email` / `name` from the client for this endpoint (prevents spoofing).

### 3.3 Verify + upsert

`auth_service.google_login(db, id_token: str)`:

1. Verify token with `google.oauth2.id_token.verify_oauth2_token` (audience = `GOOGLE_CLIENT_ID`).
2. Require `email` claim; prefer `email_verified` true (reject if false/missing).
3. Normalize email (lowercase/strip) as today.
4. Lookup user by email:
   - Exists + `password_hash` → 409 conflict (use email Sign in)
   - Exists + no password → issue tokens
   - Missing → create SE with Google `name` (fallback local-part), initials/color helpers, issue tokens
5. Return same `TokenResponse` shape as login.

Dependency: add `google-auth` to backend requirements.

### 3.4 Tests

- Valid token path: unit-test service with mocked verify returning claims.
- Reject invalid/expired token → 401.
- Reject unverified email → 401.
- Credentialed email conflict → 409.
- Empty `GOOGLE_CLIENT_ID` → 503.
- Remove or rewrite tests that POST `{ email, name }` to `/auth/google`.

Optional: `GOOGLE_AUTH_MOCK=1` **not** required for v1; tests mock the verifier.

### 3.5 Unchanged

- `/auth/register`, `/auth/login`, `/auth/identity-gate`
- JWT issue / refresh / logout / me

---

## 4. Frontend

### 4.1 Env

`charity-app/.env.example`:

```text
VITE_GOOGLE_CLIENT_ID=
```

User pastes real Client ID into local `.env` (not committed).

### 4.2 GIS integration

- Load Google Identity Services script once (shared helper, e.g. `utils/googleIdentity.js`).
- Custom **Continue with Google** button (existing `.google-signin-btn` + `GoogleIcon`) triggers `google.accounts.id.initialize` + `prompt` **or** `renderButton` / One Tap token client — prefer **token callback on custom button** via `google.accounts.id.initialize({ client_id, callback })` then a programmatic prompt, **or** `oauth2.initTokenClient` is wrong for ID tokens — use **ID** credential callback.
- Practical pattern: initialize GIS; on button click call `google.accounts.id.prompt()` **or** use hidden GIS button overlay. Preferred UX: keep styled button; on click use `google.accounts.oauth2` is access-token — **use ID token**: `google.accounts.id.initialize` + temporary GIS button, or FedCM prompt.
- Concrete choice for plan: use `@react-oauth/google` **or** raw GIS script with `initialize` + custom button that triggers `prompt()`. If prompt is blocked, fall back to rendering official Google button. Implementation plan picks the smallest reliable path (likely load script + `initialize` + `prompt`, toast if dismissed).

On credential:

1. `POST /auth/google` with `{ id_token: credential }`
2. Store tokens via existing `googleMock` → rename to `googleLogin` in `api/auth.js` / AuthContext
3. Navigate `/about-you`

If `VITE_GOOGLE_CLIENT_ID` missing: disable button + toast “Google sign-in is not configured”.

### 4.3 Create Account UI (SE)

- Remove **Sign up with email** and `handleEmailSignup`.
- Keep email/password inputs for **Sign in**.
- Google button no longer requires typed email.
- Desktop screen mirrors mobile.

### 4.4 Out of scope UI

- Identity gate modals / join / donate screens
- NP / Admin Google

---

## 5. Security notes

- Never trust client-supplied email for account creation on this path.
- Verify `aud` matches configured Web Client ID.
- HTTPS in production; localhost allowed for GIS authorized origins (document for user: add `http://localhost:5173` in Google Cloud Console).

---

## 6. Success criteria

- SE can create/sign in via real Google without typing email for Google path.
- **Sign up with email** gone on Create Account (mobile + desktop).
- Email/password Sign in still works for seed SE accounts.
- Spoofed `{ email }` without valid ID token rejected.
- Guest identity gates unchanged.

---

## 7. Non-goals

- Full OAuth authorization-code + client secret flow
- Supabase Auth migration
- Linking Google to existing password accounts in this iteration (409 only)
