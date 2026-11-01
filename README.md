# Radiology Information System (RIS MVP)

## What this project does

This project is a web-based Radiology Information System for managing the main day-to-day work of a diagnostic centre. Staff can sign in, register patients, schedule appointments, create radiology orders, follow examination progress and prepare radiology reports. The dashboard reads its figures from the application database.

The current application is focused on the staff-operated workflow. The independent patient portal, pharmacy, contrast-agent workflow and external imaging integrations are not part of the current working build; they are listed as future work in `docs/OPERATIONS-AND-SCOPE.md`.

## Main features in the current build

- Staff login and logout.
- Staff invitations, account activation and invitation revocation.
- Role-based access enforced by the backend.
- Patient registration, search, patient profile, appointment/order history and demographic editing.
- Appointment scheduling, rescheduling, cancellation and permitted status changes.
- Radiology order creation, accession number generation, filters, order details and status tracking.
- Radiology report drafts, editing, independent review and finalization.
- Dashboard statistics based on saved patient, appointment, order and report records.
- Audit events for important changes.

## Technology

- Frontend: React, Vite, React Router, Axios, Tailwind CSS and Lucide icons.
- Backend: Node.js and Express.
- Database access: Prisma ORM.
- Database: PostgreSQL.
- Validation: Zod.
- Authentication: JSON Web Tokens and bcrypt password hashing.

## Project structure

```text
ris-mvp/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.js
├── src/
│   ├── config/                 # Environment and Prisma configuration
│   ├── middleware/             # Authentication, authorization, validation
│   ├── modules/                # Auth, patients, appointments, orders, reports, staff, dashboard
│   ├── services/               # Shared services, including audit logging
│   ├── app.js
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   └── services/
│   └── vite.config.js
├── docs/
└── README.md
```

## Requirements

Install the following on the development machine:

- Node.js and npm.
- PostgreSQL.
- Git (recommended).
- A code editor such as Visual Studio Code.

The backend and frontend are separate npm applications. Install dependencies in both folders.

## Local setup

### 1. Prepare PostgreSQL

Create a PostgreSQL database for the project. The database name used during development is `ris_mvp`.

### 2. Configure the backend

From the project root, create or update the backend `.env` file using the variable names expected by `src/config/env.js` and the Prisma configuration. At a minimum, the application needs a database connection string, a JWT signing secret and the frontend URL used for CORS/invitation links.

The project has used these settings during local development:

```env
DATABASE_URL=postgresql://USER:PASSWORD@127.0.0.1:5432/ris_mvp
JWT_SECRET=REPLACE_WITH_A_LONG_RANDOM_SECRET
FRONTEND_BASE_URL=http://localhost:5173
```

Use your own database username, password and strong secret. Do not copy real passwords or tokens into this document, source control, screenshots or messages. Check `src/config/env.js` before adding any other environment variables; that file is the source of truth for the backend configuration.

Install backend dependencies and prepare Prisma:

```powershell
cd E:\PROJECT\ris-mvp
npm install
npx prisma generate
npx prisma migrate deploy
```

For a completely new database, run the seed command only after reading `prisma/seed.js` and understanding which initial administrator account it creates:

```powershell
npm run db:seed
```

**Important:** Do not rerun the seed command against an existing working database just to start the application. The current seed script can reset the seeded administrator password. Keep a backup before making database or migration changes.

### 3. Configure the frontend

Create `frontend/.env` with the API base URL:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

Install frontend dependencies:

```powershell
cd E:\PROJECT\ris-mvp\frontend
npm install
```

### 4. Start the application

Open one terminal for the backend:

```powershell
cd E:\PROJECT\ris-mvp
npm run dev
```

Open another terminal for the frontend:

```powershell
cd E:\PROJECT\ris-mvp\frontend
npm run dev
```

The local development URLs are:

- Frontend: `http://localhost:5173`
- Backend health check: `http://localhost:5000/api/health`
- Swagger API documentation: `http://localhost:5000/api-docs`

The health endpoint should report that the API is running and the database is connected. Swagger is useful for inspecting and exercising the backend endpoints.

## Useful commands

Run these from the relevant folder:

| Command | Folder | Purpose |
|---|---|---|
| `npm run dev` | Project root | Start the backend in development mode |
| `npm start` | Project root | Start the backend without the development watcher |
| `npm test` | Project root | Run the configured Jest test suite |
| `npm run db:seed` | Project root | Run the database seed script; review its effects first |
| `npx prisma generate` | Project root | Generate Prisma Client |
| `npx prisma migrate deploy` | Project root | Apply committed migrations |
| `npm run dev` | `frontend` | Start the Vite development server |
| `npm run build` | `frontend` | Build the frontend for production |

## Where to find the technical details

- `docs/SYSTEM-GUIDE.md` explains the application structure, roles, database relationships, workflow rules and API routes.
- `docs/OPERATIONS-AND-SCOPE.md` explains operating practices, security notes, the final handover checklist and features that are not included yet.

## Important note

This is an MVP and development project. Use synthetic/demo data. It has not been established as a production clinical system. Do not use it to make clinical decisions or to manage real patient care until the organisation has completed the required clinical, privacy, security, regulatory and operational reviews.
