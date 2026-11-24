# API locations, jobs, applications

## Meta

- Area: api
- Priority: P1
- Type: manual

## Preconditions

- API stack running
- Customer session for read/apply; admin session for mutating locations/jobs
- Staff/admin for listing applications
- Seed locations and jobs loaded

## Cases

### TC-1: List locations and fetch detail

**Steps**

1. Sign in as customer.
2. `GET /api/locations`.
3. `GET /api/locations/austin-domain` (optional `?q=` / `?category=` / `?page=`).

**Expected**

- List `200` with seed stores (slugs such as `austin-domain`, `houston-heights`, …).
- Detail `200` with address and inventory paging/rows.
- Unknown slug → `404`.

### TC-2: Admin location create (and customer denied)

**Steps**

1. As customer: `POST /api/locations` with a valid body (name, address, geo, etc.).
2. As admin (`admin@marlow.test`): `POST /api/locations` with a unique test store payload.
3. Optionally `DELETE /api/locations/{slug}` as admin for cleanup (skip if store has orders → expect `409`).

**Expected**

- Customer create → `403` (or unauthorized for admin-only).
- Admin create → `200`/`201` and store appears in subsequent GET.
- Delete succeeds only when allowed; `409` if store has orders.

### TC-3: Jobs list, detail, and filters

**Steps**

1. `GET /api/jobs`.
2. `GET /api/jobs?department=engineering` (and/or `workplace=remote`).
3. `GET /api/jobs/software-engineer`.

**Expected**

- List includes seed remote jobs; filters narrow results.
- Detail `200` with title/summary/description.
- Unknown slug → `404`.

### TC-4: Submit application (happy) and missing resume (negative)

**Steps**

1. As authenticated user, `POST /api/jobs/software-engineer/applications` as multipart with name, email, phone, city, authorization, start, letter (≥20 chars), and a small resume file.
2. Repeat without the resume file (or with incomplete required fields).

**Expected**

- With resume: `200`/`201` success.
- Without resume / invalid payload: `400` (or documented validation error)—no silent success.

### TC-5: Staff applications list

**Steps**

1. As staff: `GET /api/applications`.
2. As customer: `GET /api/applications`.
3. If an application id exists: `GET /api/applications/{id}/resume`.

**Expected**

- Staff/admin: `200` with application rows (may be empty array).
- Customer: `403`/`401`.
- Resume download returns file bytes for staff when id is valid.

### TC-6: Admin job create/delete overview (edge)

**Steps**

1. As admin: `POST /api/jobs` with a unique job payload.
2. `DELETE /api/jobs/{slug}` for that job.
3. As customer: attempt the same POST/DELETE.

**Expected**

- Admin mutations succeed; customer denied.
- Deleted slug no longer returns detail `200`.

## Notes

- Prefer unique slugs/names for create tests to avoid colliding with seed data.
- UI counterparts: `ui-locations.md`, `ui-careers.md`, `ui-staff-applications.md`.
- **Automation map:** All TCs → API suites; multipart apply may need fixture file in repo; e2e/stubbed cover form UX separately.
