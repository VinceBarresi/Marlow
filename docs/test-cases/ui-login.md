# UI login

## Meta
- Area: account
- Priority: P0
- Type: manual

## Preconditions
- App running (`npm run dev` or e2e stack) at the shop origin
- Signed out (no session cookie / open `/login`)
- Seed DB users available (customer, staff, admin)

## Cases

### TC-1: Customer signs in from the login form
**Steps**
1. Open `/login` and confirm `[data-testid=login-page]` is shown.
2. Confirm `[data-testid=login-title]` shows `Marlow`.
3. Clear or set `[data-testid=login-email]` to `customer@marlow.test`.
4. Set `[data-testid=login-password]` to `datalab`.
5. Click `[data-testid=login-submit]`.

**Expected**
- `[data-testid=login-error]` is not shown.
- Browser navigates away from `/login` to `/`.
- `[data-testid=nav-user]` contains `customer@marlow.test`.
- Shop shell is visible (e.g. `[data-testid=shop-title]` shows `Shop` when catalog loads).

### TC-2: Wrong password shows an error and stays on login
**Steps**
1. Open `/login`.
2. Set `[data-testid=login-email]` to `customer@marlow.test`.
3. Set `[data-testid=login-password]` to `wrong-password`.
4. Click `[data-testid=login-submit]`.

**Expected**
- `[data-testid=login-error]` appears with a failure message (e.g. email/password wrong).
- URL remains `/login`.
- `[data-testid=login-form]` is still visible; user is not signed in.

### TC-3: Empty credentials are rejected
**Steps**
1. Open `/login`.
2. Clear `[data-testid=login-email]` and `[data-testid=login-password]`.
3. Click `[data-testid=login-submit]`.

**Expected**
- Sign-in does not succeed; user stays on `/login`.
- An error is shown via `[data-testid=login-error]` (or equivalent API/validation message).
- `[data-testid=nav-user]` is not present for a signed-in customer.

### TC-4: Already signed-in user visiting `/login` is redirected
**Steps**
1. Complete TC-1 so a customer session exists.
2. Navigate to `/login` again (address bar or link).

**Expected**
- User is redirected to `/` (login form is not shown).
- `[data-testid=nav-user]` still shows `customer@marlow.test`.

## Notes
- Default form values may already be `customer@marlow.test` / `datalab`; overwrite when testing other roles.
- Staff: `staff@marlow.test` / `datalab`. Admin: `admin@marlow.test` / `datalab`.
- Hint copy lives in `[data-testid=login-hint]` for customer and staff only.
- **Automation map:** TC-1–3 → API (`/api/login`) + e2e form; TC-4 → e2e only; stubbed UI covers form defaults / error display.
