# UI staff applications

## Meta
- Area: staff
- Priority: P2
- Type: manual

## Preconditions
- App running at the shop origin
- Signed in as staff: `staff@marlow.test` / `datalab` (or admin)
- Optional: submit an application via careers apply first so the list is non-empty

## Cases

### TC-1: Applications list shows submitted applications
**Steps**
1. Ensure at least one application exists (complete careers apply with resume if the list is empty).
2. Open `/staff/applications` (or `[data-testid=nav-applications]`).
3. Confirm `[data-testid=applications-title]` and `[data-testid=applications-table]`.
4. Confirm a row `[data-testid=application-{id}]` and resume control `[data-testid=resume-{id}]` when present.

**Expected**
- Applications render without `[data-testid=applications-error]`.
- Resume link/download is available for applications that included a file.

### TC-2: Empty applications state
**Steps**
1. Prefer a clean environment or stub where no applications exist; otherwise note if seed already has applications.
2. Open `/staff/applications`.

**Expected**
- When empty: `[data-testid=applications-empty]` shows `No applications yet.` and no table rows.
- When not empty on seed: document actual count; use stubbed/integ intercept for deterministic empty coverage.

### TC-3: Customer denied applications page (negative)
**Steps**
1. Sign in as `customer@marlow.test` / `datalab`.
2. Navigate to `/staff/applications`.

**Expected**
- Redirected away from staff applications; table not shown.
- Unauthenticated or customer `GET /api/applications` is rejected (401/403).

## Notes
- Resume download: `GET /api/applications/:id/resume`.
- **Automation map:** TC-1 → e2e + API applications GET; TC-2 → stubbed UI / integ empty fixture; TC-3 → e2e role gate + API auth.
