# API cart, checkout, orders, fulfillment

## Meta
- Area: api
- Priority: P0
- Type: manual

## Preconditions
- API stack running with Redis cart + orders data
- Customer session: `customer@marlow.test` / `datalab`
- Staff session: `staff@marlow.test` / `datalab` for pick/ship
- Prefer a disposable cart session; avoid cancelling orders you still need for other tests

## Cases

### TC-1: Cart mutations
**Steps**
1. Sign in as customer; `GET /api/cart` (expect empty or note prior items).
2. `PUT /api/cart/items` with `{ "sku": "KIT-10001", "quantity": 2 }` (adjust SKU if needed).
3. `GET /api/cart` and confirm line + `subtotalCents`.
4. `PUT /api/cart/items` with quantity `1` (or `DELETE /api/cart/items/KIT-10001` for remove).

**Expected**
- Put `200`; get shows updated qty/subtotal.
- Qty `0` or DELETE removes the line.
- Invalid body → `400` (`Send a sku and a whole-number quantity.`); overstock → `409`.

### TC-2: Checkout creates an order
**Steps**
1. Ensure cart has ≥1 in-stock item.
2. `POST /api/checkout` with ship payload, e.g. `{ "fulfillment": "ship", "shipName": "Mina Adler", "shipLine1": "100 Market St", "shipCity": "Austin", "shipRegion": "TX", "shipPostalCode": "78701" }`.
3. `GET /api/orders/{number}` for the returned order number.

**Expected**
- Checkout `200` with new `MRW-…` number.
- Order detail matches ship address, lines, totals.
- Cart is empty after successful checkout.

### TC-3: Empty cart checkout error (negative)
**Steps**
1. Ensure cart is empty (`GET /api/cart` → no items).
2. `POST /api/checkout` with a valid-looking ship body.

**Expected**
- `400` (empty cart) — no new order created.

### TC-4: Order detail and cancel
**Steps**
1. Create an order via checkout (or pick a seeded `paid`/`picking` order owned by the customer).
2. `GET /api/orders/{number}`.
3. `POST /api/orders/{number}/cancel`.
4. Optionally cancel again or cancel a `shipped`/`delivered` order.

**Expected**
- Get `200` with status/lines.
- Cancel on `paid`/`picking` succeeds; status becomes `cancelled`.
- Cancel when not allowed → `409`.

### TC-5: Staff pick and ship
**Steps**
1. As customer, create a ship order left in `paid` (or locate one).
2. As staff: `POST /api/orders/{number}/pick`.
3. As staff: `POST /api/orders/{number}/ship` with `{ "carrier": "UPS", "service": "Ground" }` (allowed carriers: UPS/FedEx/USPS/DHL; services Ground/Express).

**Expected**
- Pick and ship succeed with progressing status.
- Customer cannot call pick/ship (403) — optional negative.
- Pickup flow uses `POST /api/orders/{number}/collect` instead of ship when fulfillment is pickup.

### TC-6: Unauthenticated cart/orders (edge)
**Steps**
1. Without session: `GET /api/cart`, `GET /api/orders`, `POST /api/checkout`.

**Expected**
- All return `401` requiring sign-in.

## Notes
- Further staff endpoints: `out-for-delivery`, `deliver`, `tracking` (tracking number min length 6).
- Shared fixtures: `fixtures/endpoints/ordersEndpoints.ts` (`cart`, `orders`).
- **Automation map:** All TCs → API suites (Cypress + Playwright); browser e2e covers UI wrappers in `ui-cart.md` / `ui-checkout.md` / `ui-order-detail.md`.
