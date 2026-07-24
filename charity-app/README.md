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
| NP | np@charityhub.com | Passw0rd! |
| Admin | alex.mercer@charityhub.com | Passw0rd! |

Guest: use Join/Donate identity gate (phone or email).
