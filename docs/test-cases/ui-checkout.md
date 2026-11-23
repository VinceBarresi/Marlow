# UI checkout

## Meta

- Area: checkout
- Priority: P0
- Type: manual

## Preconditions

- App running with catalog and orders remotes as needed
- Signed in as customer: `customer@marlow.test` / `datalab`
- For happy paths: cart has at least one in-stock item
- Seed locations available for pickup (e.g. `austin-domain`)

## Cases

### TC-1: Ship checkout completes and shows receipt

**Steps**

1. Add an in-stock item to the cart and open `/checkout`.
2. Confirm `[data-testid=checkout-title]` and `[data-testid=checkout-form]`.
3. Select `[data-testid=checkout-ship]` under `[data-testid=checkout-fulfillment]`.
4. Fill ship fields if empty: `[data-testid=checkout-name]`, `[data-testid=checkout-address]`, `[data-testid=checkout-city]`, `[data-testid=checkout-state]`, `[data-testid=checkout-postal]` (defaults may be Mina Adler / Austin TX).
5. Click `[data-testid=checkout-submit]`.

**Expected**

- Navigates to `/orders/{number}/confirmed` (order number like `MRW-…`).
- Receipt shows `[data-testid=receipt-title]` (e.g. `Receipt`), `[data-testid=receipt-number]`, `[data-testid=receipt-total]`, and line items.
- `[data-testid=receipt-error]` is not shown.

### TC-2: Empty cart checkout shows an error

**Steps**

1. Ensure cart is empty (fresh session or remove all lines).
2. Open `/checkout` (or submit checkout if the form is reachable).
3. Attempt `[data-testid=checkout-submit]` if the form allows.

**Expected**

- Checkout does not create an order.
- `[data-testid=checkout-error]` (or API 400 empty-cart message) indicates the cart cannot be checked out empty.
- No successful navigation to a new receipt for this attempt.

### TC-3: Pickup checkout with store selection

**Steps**

1. Ensure cart has stock available at a store (or warehouse-backed seed item that can fulfill pickup).
2. Open `/checkout`, select `[data-testid=checkout-pickup]`.
3. Choose a store via `[data-testid=checkout-store]` / `[data-testid=checkout-store-austin-domain]`.
4. Confirm name in `[data-testid=checkout-name]`.
5. Click `[data-testid=checkout-submit]`.

**Expected**

- Order completes; receipt title may be `Pickup receipt`.
- Receipt / order reflects pickup fulfillment.
- Missing store or unavailable SKU at store surfaces `[data-testid=checkout-error]` (API may return 404 `{sku} is not at this store.`).

## Notes

- API: `POST /api/checkout` with `fulfillment: "ship" | "pickup"`.
- UI pricing: shipping under $75 and tax may appear in totals on receipt.
- **Automation map:** TC-1–3 → API checkout + e2e; stubbed UI for form defaults/errors and receipt rendering.
