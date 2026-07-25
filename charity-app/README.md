# Charity Hub (frontend)

React + Vite app for Charity Hub.

## Live API (local)

1. Start backend: `cd backend && .venv\Scripts\uvicorn app.main:app --reload`
2. Copy `.env.example` → `.env` if needed (`VITE_API_BASE_URL=http://localhost:8000`)
3. `npm run dev` in `charity-app`
4. Unlock AccessGate, then sign in:

| Role | Email | Password |
|------|-------|----------|
| SE | mike.rivera@demo.charityhub.com | Passw0rd! |
| SE | jordan.blake@demo.charityhub.com | Passw0rd! |
| SE | sam.okonkwo@demo.charityhub.com | Passw0rd! |
| SE | priya.desai@demo.charityhub.com | Passw0rd! |
| NP | redcross@charityhub.com (and 19 other short aliases) | Passw0rd! |
| Admin | alex.mercer@charityhub.com | Passw0rd! |

Full SE list: `backend/seed/se_accounts.py`. Full NP alias list: `backend/seed/np_accounts.py`.

Guest: use Join/Donate identity gate (phone or email).
