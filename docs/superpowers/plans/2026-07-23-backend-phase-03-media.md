# Charity Hub Backend — Phase 3: Media (Cloudinary) Implementation Plan

> Executed inline in the main loop (subagent orchestration paused due to org spend limit). TDD per task, commit each. Steps tracked in the SDD ledger.

**Goal:** A reusable Cloudinary media layer — signed direct uploads, metadata persistence (Cloudinary metadata only, per spec), retrieval, and authorized delete — usable by avatars, event photos/videos, NP logo/cover, and posts.

**Architecture:** `media_assets` table (polymorphic loose reference via `entity_type`/`entity_id`), a reusable `app/integrations/cloudinary.py` (offline signing + monkeypatch-able destroy), `media_repository`, `media_service` (validation + authz), `media` router mounted in `api_router`, and Alembic `0002_media_assets`. Tests run on SQLite and never touch the Cloudinary network (signing is offline crypto; destroy is monkeypatched).

**Tech Stack:** Python 3.12, FastAPI, SQLAlchemy 2.0 async, Pydantic v2, cloudinary 1.41.0, pytest (aiosqlite).

## Global Constraints
- Reuse `backend/.venv`; NO `pip install`. Tests: `cd backend && .venv/Scripts/python -m pytest -v`.
- Dialect-portable models only (SQLite tests): integer PK, String/Text/Integer/DateTime/Boolean/JSON. No Postgres ARRAY/native ENUM/UUID.
- Tests must NOT hit the network. Signing is offline; `destroy` is monkeypatched.
- Create/modify only `backend/` files; commits stage only task-scoped paths.
- Reuse: `get_settings()` (cloudinary_* fields), `Base`, `get_db`, `AppError`, `api_router`, `get_current_user`; conftest fixtures `db_session`, `client`, `make_user`, `auth_header`.
- Alembic migration authored for Supabase, NOT run in tests.
- `users.avatar_media_id` stays a plain int (NO FK to media_assets) to avoid a circular dependency; media associates loosely via `entity_type`/`entity_id`.

## Validation rules (server-side, on persist)
- `resource_type` in {image, video} else 400 `unsupported_resource_type`.
- image formats {jpg,jpeg,png,webp,gif,heic}; video {mp4,mov,webm} else 400 `unsupported_format`.
- image bytes ≤ 10MB, video bytes ≤ 100MB else 400 `file_too_large`.

## Tasks
1. **MediaAsset model + enums** — `ResourceType`, `MediaEntityType` StrEnums; `MediaAsset` table; register in `models/__init__`. Test: persist + fetch on aiosqlite.
   - Produces: `app.models.media.MediaAsset`; `app.models.enums.ResourceType`, `MediaEntityType`.
2. **Cloudinary integration** — `app/integrations/__init__.py`, `app/integrations/cloudinary.py`: `configure()`, `generate_signed_upload_params(folder, resource_type="image") -> dict`, `destroy(public_id, resource_type="image") -> dict`. Tests: sign offline (asserts fields); destroy via monkeypatch.
3. **media_repository** — async `create`, `get_by_id`, `delete`, `list_by_entity(entity_type, entity_id)`. Tests on db_session.
4. **media schemas + media_service** — `SignRequest/SignResponse`, `MediaCreateRequest`, `MediaRead`; `sign_upload`, `create_asset` (validation), `get_asset` (404), `delete_asset` (404/403 owner-or-admin, calls cloudinary.destroy then repo.delete). Tests: validation 400s, delete authz 403, destroy monkeypatched.
   - Produces: `app.services.media_service.{sign_upload,create_asset,get_asset,delete_asset}`.
5. **media router + mount** — `POST /api/v1/media/sign` (auth), `POST /api/v1/media` (auth, 201), `GET /api/v1/media/{id}`, `DELETE /api/v1/media/{id}` (auth). Mount in `api_router` (keep health/auth/users). API tests via client incl. 401/403/400/404.
6. **Alembic 0002_media_assets** — handwritten, down_revision `0001_users`. Discovery check; suite unaffected.

## Deferred / out of scope
Actual event/nonprofit/post entities (later phases); media references them loosely by `entity_type`/`entity_id`. No seeding.
