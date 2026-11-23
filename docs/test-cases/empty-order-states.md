# Empty order and cart states

## Meta

- Area: orders
- Priority: P1
- Type: manual
- Automate: API + e2e + stubbed UI

## Preconditions

- App running with catalog **and** orders remotes (`frontends/orders` on :5175)
- Seed DB loaded
- Customer: `customer@marlow.test` / `datalab` (has seeded orders; cart starts empty per session)
- Staff: `staff@marlow.test` / `datalab`

## Cases

### TC-1: Fresh session cart is empty (API + UI)

**Steps**

1. Sign in as customer (API or `[data-testid=login-form]`).
2. `GET /api/cart` (or open `/cart`).
3. Confirm empty cart UI: `[data-testid=cart-empty]` and `[data-testid=cart-browse]`.

**Expected**

- API: `200`, body `{ items: [], subtotalCents: 0 }` (exact keys).
- UI: `[data-testid=cart-title]` is `Cart`; empty message with browse link; no `[data-testid=cart-table]`.

### TC-2: Orders list empty for unknown status filter (API + UI)

**Steps**

1. Sign in as customer.
2. `GET /api/orders?status=no_such_status&page=1&pageSize=20` (or open `/orders` and set `[data-testid=orders-status]` to a status with no matches—if needed use a filter that yields zero).
3. Confirm `[data-testid=orders-empty]` shows filtered empty copy.

**Expected**

- API: `200`, `orders: []`, `total: 0`, plus paging fields.
- UI: `[data-testid=orders-title]` / `[data-testid=orders-count]` show `0 orders`; `[data-testid=orders-empty]` is `No orders with that status.`

### TC-3: Staff fulfillment empty for unknown status (UI)

**Steps**

1. Sign in as staff.
2. Open `/staff/orders`.
3. Filter status so no rows match (same idea as TC-2).

**Expected**

- `[data-testid=fulfillment-title]` is `All orders`.
- `[data-testid=fulfillment-empty]` shows `No orders with that status.` (when filtered) or staff empty copy when none exist.

### TC-4: Unauthenticated cart/orders API

**Steps**

1. Without a session cookie, `GET /api/cart` and `GET /api/orders`.

**Expected**

- Both return `401` with an error payload (sign in required).

### TC-5: Integ — stubbed empty orders response drives empty UI

**Steps**

1. Sign in as customer (or staff/admin for fulfillment).
2. Stub `GET /api/orders*` (integ: `cy.intercept` / `page.route`) with the empty list fixture (`orders: []`, `total: 0`).
3. Open `/orders` (or `/staff/orders`).

**Expected**

- Customer: `[data-testid=orders-empty]` is `You have no orders yet.`; no orders table.
- Staff: `[data-testid=fulfillment-empty]` is `No orders yet.`; no fulfillment table.
- Count shows `0 orders`.

## Notes

- Seeded customer has orders—do not expect an unfiltered empty orders list for that user unless the API is stubbed in an integ test (TC-5).
- Cart emptiness is session/Redis-scoped; start from a fresh login for TC-1.
- Stubbed UI should mock `{ orders: [], total: 0 }` and `{ items: [], subtotalCents: 0 }` without the live shop.
- Integ specs (stubbed network) live in `cypress/tests/e2e/integ/` and `playwright/e2e/integ/` (`cy.intercept` / `page.route`, body `emptyOrdersListResponseModel`).
