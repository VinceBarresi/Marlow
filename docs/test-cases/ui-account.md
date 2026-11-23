# UI account

## Meta
- Area: account
- Priority: P1
- Type: manual

## Preconditions
- App running at the shop origin
- Seed users available

## Cases

### TC-1: Account page shows name, email, and role (customer)
**Steps**
1. Sign in as `customer@marlow.test` / `datalab`.
2. Open `/account` (or `[data-testid=nav-account]`).
3. Confirm `[data-testid=account-title]`, `[data-testid=account-card]`.
4. Read `[data-testid=account-name]`, `[data-testid=account-email]`, `[data-testid=account-role]`.

**Expected**
- Name is `Mina Adler` (seed display name).
- Email is `customer@marlow.test`.
- Role indicates customer (exact label as rendered).
- `[data-testid=account-lede]` may describe the page; no error state.

### TC-2: Signed-out user cannot view account (negative)
**Steps**
1. Sign out via `[data-testid=nav-logout]` (or clear session).
2. Navigate to `/account`.

**Expected**
- Redirected to `/login` (or auth gate); account card with seed PII is not shown.
- After login as staff (`staff@marlow.test`) or admin (`admin@marlow.test`), `/account` shows that user’s name/email/role (Jordan Walsh / Avery Chen).

## Notes
- Data source: `GET /api/me` (session).
- No profile edit mutations on this page.
- **Automation map:** TC-1 → e2e + API `/api/me`; TC-2 → e2e auth gate; stubbed UI for card fields from mocked me payload.
