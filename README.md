# PG Management System

A full-stack PGMS application with:

- FastAPI backend
- MongoDB via PyMongo
- React + Vite frontend
- JWT authentication with `ADMIN` and `TENANT` roles
- Local image uploads for QR codes, ID proofs, and payment screenshots

## What Was Added

- Role-based authentication with hashed passwords and JWT tokens
- Tenant accounts linked to tenant profiles in the same MongoDB database
- QR-based payment submission with admin approval and rejection
- Notice management for admin and tenant notice board access
- Admin-tenant messaging with conversation threads
- Tenant dashboard and admin dashboard with role-aware navigation

## Updated Folder Structure

```text
pgms-project/
|-- client/
|   |-- src/
|   |   |-- components/
|   |   |   |-- dashboard/
|   |   |   |-- messages/
|   |   |   `-- notices/
|   |   |-- context/
|   |   |-- hooks/
|   |   |-- pages/
|   |   |-- utils/
|   |   |-- App.jsx
|   |   |-- api.js
|   |   |-- index.css
|   |   `-- main.jsx
|   |-- .env.example
|   `-- package.json
|-- server/
|   |-- app/
|   |   |-- routers/
|   |   |-- schemas/
|   |   `-- services/
|   |-- uploads/
|   |-- .env.example
|   |-- database.py
|   |-- main.py
|   |-- models.py
|   `-- requirements.txt
`-- README.md
```

## Backend Modules

- `server/app/routers/auth.py`: login and current-user endpoints
- `server/app/routers/admin.py`: admins, tenants, floors, rooms, beds, PG map, QR upload
- `server/app/routers/payments.py`: tenant payment upload, tenant history, admin approval
- `server/app/routers/notices.py`: notice CRUD and read endpoints
- `server/app/routers/messages.py`: send messages, list threads, load conversation
- `server/app/routers/dashboard.py`: admin and tenant dashboard data

## Database Design

This project remains on the existing MongoDB database. No new database is created.

Because the app uses MongoDB + PyMongo, the schema is implemented as MongoDB collections plus Pydantic request/response models instead of SQLAlchemy ORM tables.

Main collections:

- `users`
  - `name`
  - `email` (unique)
  - `password_hash`
  - `role` (`ADMIN` or `TENANT`)
  - `room_number`
  - `tenant_profile_id`
  - `created_at`
- `tenants`
  - `user_id`
  - `name`
  - `email`
  - `phone`
  - `address`
  - `profession`
  - `join_date`
  - `emergency_contact`
  - `id_proof_number`
  - `id_proof_file`
  - `room_id`
  - `room_number`
  - `bed_number`
  - `rent`
  - `payment_status`
  - `last_payment_month`
  - `created_at`
- `payments`
  - `tenant_id`
  - `amount`
  - `month`
  - `screenshot_file`
  - `transaction_id`
  - `status`
  - `created_at`
  - `updated_at`
- `notices`
  - `title`
  - `content`
  - `created_at`
  - `updated_at`
- `messages`
  - `sender_id`
  - `receiver_id`
  - `participants`
  - `message`
  - `timestamp`
- `settings`
  - stores payment QR metadata under key `payment_qr`

## Auth

- Login endpoint: `POST /auth/login`
- Current user endpoint: `GET /auth/me`
- Password hashing: bcrypt via Passlib
- Session auth: JWT bearer token

Default seeded admin:

- Email: `admin@pgms.local`
- Password: `admin123`

## Key API Endpoints

Auth:

- `POST /auth/login`
- `GET /auth/me`

Dashboards:

- `GET /dashboard`
- `GET /tenant/dashboard`

Admin management:

- `GET /admins`
- `POST /admins`
- `GET /tenants`
- `POST /tenants`
- `DELETE /tenants/{tenant_id}`
- `GET /floors`
- `POST /floors`
- `GET /rooms`
- `POST /rooms`
- `POST /rooms/{room_id}/beds`
- `GET /pg-map`

Payments:

- `GET /payments/qr`
- `POST /admin/payments/qr`
- `POST /payments/upload`
- `GET /payments/my`
- `GET /admin/payments`
- `PUT /admin/payments/{payment_id}/approve`
- `PUT /admin/payments/{payment_id}/reject`

Notices:

- `GET /notices`
- `POST /admin/notices`
- `PUT /admin/notices/{notice_id}`
- `DELETE /admin/notices/{notice_id}`

Messages:

- `GET /messages/threads`
- `POST /messages/send`
- `GET /messages/{user_id}`

## File Uploads

Stored locally under:

- `server/uploads/payments/`
- `server/uploads/id-proofs/`
- `server/uploads/qr/`

Supported types:

- `.jpg`
- `.jpeg`
- `.png`

## Run Backend

1. Open a terminal in `server`.
2. Create and activate a virtual environment:

```powershell
python -m venv .venv
.venv\Scripts\activate
```

3. Install dependencies:

```powershell
pip install -r requirements.txt
```

4. Create `.env` from `server/.env.example`.
5. Start the backend:

```powershell
uvicorn main:app --reload
```

Backend URL: `http://localhost:8000`

## Run Frontend

1. Open another terminal in `client`.
2. Install dependencies:

```powershell
npm install
```

3. Create `.env` from `client/.env.example`.
4. Start the frontend:

```powershell
npm run dev
```

Frontend URL: `http://localhost:5173`

## Environment Variables

Backend `server/.env`:

```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
DB_NAME=pg_management
FRONTEND_URL=http://localhost:5173
SECRET_KEY=change-this-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=1440
DEFAULT_ADMIN_NAME=System Admin
DEFAULT_ADMIN_EMAIL=admin@pgms.local
DEFAULT_ADMIN_PASSWORD=admin123
MAX_UPLOAD_SIZE_BYTES=5242880
```

Frontend `client/.env`:

```env
VITE_API_URL=http://localhost:8000
```

## Verification Completed

- `python -m compileall server`
- `npm run build`

# pgms