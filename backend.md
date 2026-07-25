Build a complete FastAPI backend for the Charity Hub prototype by analyzing the entire frontend, Master Blueprint, and all implemented user flows. Do not skip or simplify any functionality. Create APIs for every flow and screen across all user roles: Social Enterprise (SE), Non-Profit (NP), Guest, and Admin.

Use Supabase PostgreSQL as the database and implement JWT-based authentication with role-based authorization. The Non-Profit approval process should be implemented as a simple status validation (Pending → Approved/Rejected) without any real document verification or third-party integration. Implement Stripe payment as a static/mock payment flow that simulates successful and failed transactions without integrating the actual Stripe API.

For media management, use Cloudinary for storing and serving all uploaded images and videos (event banners, galleries, profile images, organization logos, chat media, posts, and other assets). Store only the Cloudinary metadata (public_id, secure_url, resource_type, file size, etc.) in the Supabase PostgreSQL database instead of storing media files directly in Supabase Storage. Implement secure upload, update, delete, and retrieval APIs with proper validation, file size limits, and supported file type checks. Ensure every flow that requires media uploads (SE, Non-Profit, Admin, and other applicable modules) uses the same reusable Cloudinary service.

Design a production-ready backend using FastAPI, SQLAlchemy (Async), Alembic, Pydantic, and a clean architecture (routers, services, repositories, models, schemas, dependencies, middleware, utilities). Implement all CRUD operations, validation, pagination, filtering, search, role-based permissions, file uploads, notifications, dashboard statistics, event management, donations, volunteering, chat (where applicable), QR scanner support, reports, and every other feature required by the prototype.

Before implementation, analyze the complete prototype and Master Blueprint to identify every required endpoint. If any frontend screen or action is missing a backend API, create it. Ensure there are no missing APIs, no broken flows, and no unimplemented actions. Generate the complete database schema, relationships, API documentation (OpenAPI/Swagger), seed data, and folder structure so the backend can support the entire Charity Hub application end-to-end using static/demo integrations where specified.

.venv\Scripts\uvicorn app.main:app --reload

SE
mike.rivera@demo.charityhub.com
jordan.blake@demo.charityhub.com
sam.okonkwo@demo.charityhub.com
priya.desai@demo.charityhub.com
(password Passw0rd! for all — see backend/seed/se_accounts.py)

NP (password Passw0rd! for all — one admin per USA_20 org)
redcross@charityhub.com
feedingamerica@charityhub.com
stjude@charityhub.com
habitat@charityhub.com
unitedway@charityhub.com
goodwill@charityhub.com
bgca@charityhub.com
ymca@charityhub.com
bbbs@charityhub.com
makeawish@charityhub.com
rmhc@charityhub.com
komen@charityhub.com
acs@charityhub.com
alz@charityhub.com
nature@charityhub.com
sierraclub@charityhub.com
charitywater@charityhub.com
wwf@charityhub.com
aspca@charityhub.com
msf@charityhub.com
(full list: backend/seed/np_accounts.py / docs/superpowers/specs/2026-07-24-np-accounts-from-xlsx-design.md)
Admin
alex.mercer@charityhub.com