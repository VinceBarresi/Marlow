# API session and catalog

## Meta

- Area: api
- Priority: P0
- Type: manual

## Preconditions

- API / shop stack running (`npm run dev` or e2e stack)
- Seed users: `customer@marlow.test`, `staff@marlow.test`, `admin@marlow.test` / password `datalab`
- HTTP client that can send cookies (or browser DevTools)

## Cases

### TC-1: Health check

**Steps**

1. `GET /api/health` without auth.

**Expected**

- `200` with body including `ok`, `postgres`, `redis` (healthy seed stack → truthy / ok indicators).

### TC-2: Login then me

**Steps**

1. `POST /api/login` with JSON `{ "email": "customer@marlow.test", "password": "datalab" }`.
2. Capture session cookie (`datalab_session`).
3. `GET /api/me` with that cookie.

**Expected**

- Login `200` with user payload (email/role); session cookie set.
- Me `200` with matching email `customer@marlow.test` and customer role; display name Mina Adler when present.

### TC-3: Logout clears session

**Steps**

1. Sign in as in TC-2.
2. `POST /api/logout` with session cookie.
3. `GET /api/me` with the same cookie jar after logout.

**Expected**

- Logout succeeds (`200` or documented success).
- Subsequent me returns `401` (unsigned).

### TC-4: Products and categories require session (happy with auth)

**Steps**

1. Sign in as customer.
2. `GET /api/categories`.
3. `GET /api/products?page=1&pageSize=12`.
4. `GET /api/products/KIT-10001` (or another seed SKU).

**Expected**

- Categories `200` with the eight seed category names.
- Products list `200` with paging fields and product rows.
- Product by SKU `200` with sku/name/price/stock fields.

### TC-5: Inventory is staff-only (negative)

**Steps**

1. As customer session: `GET /api/inventory`.
2. As staff session (`staff@marlow.test`): `GET /api/inventory?page=1&pageSize=20`.
3. Without session: `GET /api/inventory`.

**Expected**

- Customer: `403` with staff-only style error (`Staff only.`).
- Staff/admin: `200` with inventory rows.
- Unauthenticated: `401`.

### TC-6: Wrong password / missing product (edge)

**Steps**

1. `POST /api/login` with wrong password for `customer@marlow.test`.
2. Authenticated: `GET /api/products/NOT-A-REAL-SKU`.

**Expected**

- Login `401` with `Email or password is wrong.` (or equivalent).
- Product `404` with `Product not found.`

## Notes

- Prefer cookie-based session as the browser does; avoid inventing bearer tokens.
- Catalog microservice may sit on `:4001` with `x-datalab-user`; prefer gateway `/api/*` for manual shop QA.
- **Automation map:** All TCs → Cypress/Playwright API suites + shared `fixtures/endpoints` / models; no e2e required except when verifying cookie wiring in browser.
