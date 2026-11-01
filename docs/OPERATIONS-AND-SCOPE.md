# Operations, Security and Project Scope

## 1. Running the application locally

The frontend and backend run as separate applications. Start PostgreSQL first, then start the backend and frontend in separate terminals.

Backend:

```powershell
cd E:\PROJECT\ris-mvp
npm run dev
```

Frontend:

```powershell
cd E:\PROJECT\ris-mvp\frontend
npm run dev
```

Open `http://localhost:5173`. The backend health endpoint is `http://localhost:5000/api/health`, and the API explorer is `http://localhost:5000/api-docs`.

For a frontend production build:

```powershell
cd E:\PROJECT\ris-mvp\frontend
npm run build
```

The backend's configured Jest command is `npm test` from the project root. Test results should be recorded only after the tests have actually been run. A successful frontend build is not the same as a successful end-to-end workflow test.

## 2. Configuration and secrets

Keep credentials and deployment-specific settings in environment files, not source code. The local setup has used:

- `DATABASE_URL` — PostgreSQL connection string.
- `JWT_SECRET` — secret used to sign/verify authentication tokens.
- `FRONTEND_BASE_URL` — frontend origin used when building staff invitation URLs.
- `VITE_API_BASE_URL` — frontend API base URL, normally `http://localhost:5000/api` for local development.

Check `src/config/env.js` for the complete backend environment contract before deploying. Do not assume that the local values are suitable for another environment. Use a long, random JWT secret; restrict database credentials; configure CORS for the actual frontend origin; and keep `.env` files out of version control.

Never put passwords, JWTs, invitation tokens, database URLs or real patient details into documentation, screenshots, source control or issue reports. The invitation URL contains a one-time secret and should be shared only with its intended recipient. It expires after 24 hours.

## 3. Security and audit behaviour

The current implementation includes the following controls:

- Protected API routes use JWT authentication.
- The authentication middleware reads the current user's role and active status from the database rather than relying only on role information from an old token.
- Backend routes enforce role permissions. Frontend button visibility is only a convenience and must not be treated as access control.
- Request bodies and query parameters are validated using Zod schemas.
- Passwords are stored as bcrypt hashes.
- Invitation tokens are stored as SHA-256 hashes; the raw token is returned only when the invitation is created.
- The report workflow prevents self-review, restricts draft editing to the author and prevents changes after finalization.
- Appointment and order status transitions are checked by the backend.
- Important operations write audit events, including patient changes, appointment changes, order changes, report actions and staff invitation actions.
- The Express application uses Helmet, CORS configuration, JSON request-size limits and a central error handler.

The current frontend keeps the JWT in application memory. A browser refresh therefore requires the staff member to sign in again. Do not describe this as persistent single sign-on or a refresh-token session.

Audit logging is useful for accountability, but it is not a substitute for a full production security review, monitoring, retention policy or access review.

## 4. Database care and recovery

Before changing the Prisma schema, applying a migration or changing the database server, make a PostgreSQL backup and verify that the backup can be read. Keep backups outside the project directory and restrict access to them.

The development database used for this project is `ris_mvp`. The Prisma schema is `prisma/schema.prisma`; migration history is in `prisma/migrations/`.

Useful Prisma commands:

```powershell
npx prisma validate
npx prisma generate
npx prisma migrate deploy
```

For a development-only schema migration, use the normal Prisma migration workflow after reviewing the schema diff and taking a backup. Do not reset the database to solve a migration or startup problem when it contains records that need to be kept.

The seed script is intended for initial setup. Review `prisma/seed.js` before running it. In the current project, rerunning the seed can change the seeded administrator password, so do not use it as a routine startup command on the existing database.

A production deployment still needs an approved backup schedule, restore rehearsal, database access policy, TLS, environment-specific CORS, monitoring and a documented rollback procedure. Those operational arrangements are not provided by the local development setup alone.

## 5. Current implementation and postponed work

The following describes the present project scope. “Not implemented” means the relevant feature should not be represented as available in a demo or handover.

### Included in the current staff-operated MVP

- Staff authentication and role-based access.
- Staff invitation, acceptance and revocation.
- Patient registration, search, profile, demographic editing and duplicate checks.
- Appointment creation, listing, rescheduling and permitted status changes.
- Radiology order creation, listing, filtering, details, accession number and status workflow.
- Radiology report draft, edit, independent review and finalization workflow.
- Dashboard statistics based on stored records.
- Audit events for important operations.
- Staff invitation management interface.

### Not implemented / future scope

| Feature | Current position |
|---|---|
| Independent patient registration and patient login | Not implemented. The current patient record is not linked to a patient login account. |
| Patient self-service portal | Not implemented. Patients cannot book, reschedule or cancel appointments through a separate portal. |
| Password reset and patient email/phone verification | Not implemented. |
| Full staff directory, role editing, suspension and reactivation | Not implemented. The current staff page handles invitations only. |
| Medication and allergy records | Not implemented. |
| Contrast-agent inventory and administration/reaction workflow | Not implemented. |
| Pharmacy catalogue, batches, stock movements and low-stock alerts | Not implemented. |
| Prescription and dispensing | Not implemented. |
| Live PACS/DICOM integration or image viewer | Not implemented. A `StudyLink` record exists in the schema, but that does not mean a PACS is connected or a study can be opened. |
| HIS/EHR, HL7/FHIR and billing integrations | Not implemented. |
| Production deployment and operational monitoring | Not established by the local development build. |

The original project plan distinguishes the core RIS workflow from pharmacy, prescription and external integration work. It also calls for medication provenance, contrast workflow controls and verified PACS study links if those features are delivered. Those requirements remain future work here rather than completed functionality.

## 6. Final workflow to demonstrate

Use synthetic records and show the main path through the application:

1. An authorized staff member registers a patient.
2. Receptionist schedules an appointment for that patient.
3. Authorized staff creates a radiology order and links it to the patient/appointment where appropriate.
4. Technician advances the order through permitted statuses and marks the examination completed.
5. A radiologist creates a draft report with findings and impression.
6. A different radiologist reviews the draft.
7. An authorized radiologist finalizes the reviewed report.
8. The dashboard reflects the saved records and report status.

Use synthetic names, contact details and clinical text only. Do not record real patient data in the walkthrough.

## 7. Final handover checklist

Before handing over the project, complete and retain evidence for the following:

- [ ] Backend starts and `/api/health` reports database connectivity.
- [ ] Frontend production build completes successfully.
- [ ] Staff login and invitation activation work.
- [ ] Patient creation, search, profile and editing work.
- [ ] Possible duplicate patient registration is handled clearly.
- [ ] Appointment scheduling, rescheduling, cancellation and status rules work.
- [ ] Order creation, patient/appointment association and status transitions work.
- [ ] Administrator order override requires a reason and is audited.
- [ ] Report draft editing, independent review and finalization permissions work.
- [ ] Finalized report editing is rejected.
- [ ] Unauthorized API requests are rejected by the backend.
- [ ] Records remain after application restart.
- [ ] Error handling does not expose credentials, tokens or unnecessary patient details.
- [ ] API and database documentation match the running code.
- [ ] Postponed features are clearly identified in the handover.
- [ ] Demo video and screenshots use synthetic data only.

Record the actual result, date, evidence location and any defect for each test when final QA is performed. Do not mark a check as passed based only on a successful build or the presence of a UI screen.

## 8. Safe-use boundary

This project is a development MVP, not a validated clinical information system. The report editor is a workflow interface and does not validate clinical interpretation. Medication, contrast administration and dispensing features are not implemented. Use synthetic data for demonstrations. Real clinical use requires appropriate clinical governance, privacy and security assessment, regulatory review, integration validation, backup/recovery planning and formal operational approval.
