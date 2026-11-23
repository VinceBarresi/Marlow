# UI careers and apply

## Meta
- Area: careers
- Priority: P1
- Type: manual

## Preconditions
- App running at the shop origin
- Signed in as customer: `customer@marlow.test` / `datalab` (or any authenticated user)
- Seed jobs available (e.g. `software-engineer`)

## Cases

### TC-1: Job board loads and filters work
**Steps**
1. Open `/careers`.
2. Confirm `[data-testid=careers-title]`, `[data-testid=careers-grid]`, and at least one `[data-testid^=job-card-]`.
3. In `[data-testid=careers-filters]`, set `[data-testid=careers-department]` (e.g. engineering), optionally workplace/location.
4. Click `[data-testid=careers-filter-submit]`.

**Expected**
- Filtered job cards match the selected department/workplace/location.
- Clearing filters restores a broader list.
- `[data-testid=careers-empty]` appears when filters match nothing.

### TC-2: Apply form happy path with resume
**Steps**
1. Open `/careers/software-engineer` (or another seed job).
2. Confirm `[data-testid=apply-title]`, `[data-testid=apply-description]`, `[data-testid=apply-form]`.
3. Fill `[data-testid=apply-name]`, `[data-testid=apply-email]`, `[data-testid=apply-phone]`, `[data-testid=apply-city]`.
4. Set `[data-testid=apply-authorization]` to `yes`, fill `[data-testid=apply-start]`, `[data-testid=apply-letter]` (≥ 20 characters).
5. Attach a small PDF/text file via `[data-testid=apply-resume]`.
6. Click `[data-testid=apply-submit]`.

**Expected**
- Success UI: `[data-testid=apply-sent]` / `[data-testid=apply-confirmation]`.
- `[data-testid=apply-error]` is not shown.
- Optional fields (LinkedIn/website) may be left blank.

### TC-3: Apply without resume is rejected (negative)
**Steps**
1. Open a job apply page.
2. Fill required text fields including a long enough cover letter.
3. Leave `[data-testid=apply-resume]` empty.
4. Click `[data-testid=apply-submit]`.

**Expected**
- Submission does not show success confirmation.
- Browser validation and/or `[data-testid=apply-error]` indicates resume (or required fields) missing.
- User remains on the apply form.

## Notes
- Seed remote slugs: `software-engineer`, `frontend-engineer`, `brand-marketing-manager`, etc.
- Departments: marketing, sales, engineering, retail; workplace: remote, store.
- Admin job create/remove forms may appear on `/careers` for `admin@marlow.test` (`job-form`, `job-remove-{slug}`)—out of scope unless extending.
- **Automation map:** TC-1 → e2e + API `GET /api/jobs`; TC-2–3 → e2e multipart apply + API `POST /api/jobs/:slug/applications`; stubbed UI for form validation / sent state.
