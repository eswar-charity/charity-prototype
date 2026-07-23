# Charity Hub API

FastAPI backend for the Charity Hub prototype.

## Setup

```bash
cd backend
python -m venv .venv && .venv\Scripts\Activate.ps1   # Windows PowerShell
pip install -r requirements.txt
cp .env.example .env   # then fill in Supabase + Cloudinary values
```

## Run local Postgres (dev + tests)

```bash
docker compose up -d
```

## Run the API

```bash
uvicorn app.main:app --reload
# Swagger UI at http://localhost:8000/docs
```

## Migrations

```bash
alembic revision --autogenerate -m "message"
alembic upgrade head
```

## Tests

```bash
python -m pytest -v
```
