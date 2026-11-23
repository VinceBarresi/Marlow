# UI order detail and fulfillment actions

## Meta

- Area: orders
- Priority: P0
- Type: manual

## Preconditions

- App running with orders / commerce APIs
- Customer: `customer@marlow.test` / `datalab` for view + cancel
- Staff: `staff@marlow.test` / `datalab` for pick/ship/collect overview
- At least one cancellable order (`paid` or `picking`) and one shippable `paid` ship order when testing staff actions

## Cases

### TC-1: Customer views order detail

**Steps**

1. Sign in as customer and open `/orders/{number}` for a known seeded order (or from the list).
2. Confirm `[data-testid=order-number]`, `[data-testid=order-status]`, `[data-testid=order-fulfillment]`.
3. Confirm `[data-testid=order-lines]` and at least one `[data-testid^=order-line-]`.
4. Confirm `[data-testid=order-total]` / `[data-testid=order-breakdown]`.

**Expected**

- Detail loads without `[data-testid=order-error]`.
- Ship-to fields appear for ship orders (`order-ship-to`, `order-ship-name`, etc.).
- History/events may appear under `[data-testid=order-history]`.

### TC-2: Customer cancels when status allows

**Steps**

1. As customer, open an order in `paid` or `picking`.
2. Confirm `[data-testid=order-cancel]` is visible under `[data-testid=order-actions]`.
3. Click `[data-testid=order-cancel]` and confirm any prompt if present.

**Expected**

- Status becomes `cancelled` (`[data-testid=order-status]`).
- Cancel control no longer available (or further cancel returns conflict).
- Orders that are already shipped/delivered do not allow cancel (API 409)—negative check: cancel control absent or error if forced.

### TC-3: Staff pick and ship overview (ship fulfillment)

**Steps**

1. Sign in as staff; open `/staff/orders` then an order in `paid` with ship fulfillment (or go directly to `/orders/{number}`).
2. Click `[data-testid=order-pick]` when available.
3. After status is ready to ship, use `[data-testid=order-ship-form]`: set `[data-testid=order-carrier]` and `[data-testid=order-service]`, then `[data-testid=order-ship]`.

**Expected**

- Pick moves status toward `picking` / next allowed state per product rules.
- Ship succeeds with carrier/service; tracking UI may appear (`order-tracking`, `order-tracking-form`).
- Pickup `paid` orders show `[data-testid=order-collect]` instead of ship form.

### TC-4: Cancel not allowed for terminal statuses (edge)

**Steps**

1. As customer or staff, open a `delivered` or `cancelled` order.
2. Look for `[data-testid=order-cancel]`.

**Expected**

- Cancel action is not offered, or invoking cancel API returns 409.
- Detail still renders read-only history/tracking as applicable.

## Notes

- Staff list uses `fulfillment-*` test ids on `/staff/orders`; detail URL remains `/orders/:number`.
- Further staff actions: `order-out-for-delivery`, `order-deliver`, tracking submit (`order-tracking-input`, min length 6).
- **Automation map:** TC-1–2 → e2e + API get/cancel; TC-3 → staff e2e + API pick/ship; TC-4 → API negative + stubbed UI action visibility.
