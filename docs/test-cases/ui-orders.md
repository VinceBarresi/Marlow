# UI customer orders list

## Meta

- Area: orders
- Priority: P0
- Type: manual

## Preconditions

- App running with orders remote
- Signed in as customer: `customer@marlow.test` / `datalab`
- Seeded customer has existing orders (do not expect an unfiltered empty list)

## Cases

### TC-1: Orders list shows seeded orders

**Steps**

1. Open `/orders`.
2. Confirm `[data-testid=orders-title]` is `Your orders`.
3. Read `[data-testid=orders-count]` (should be > 0 on seed).
4. Confirm `[data-testid=orders-table]` and at least one `[data-testid^=orders-row-]`.

**Expected**

- Rows show link, status, placed date, and total test ids (`orders-link-{number}`, `orders-status-{number}`, `orders-placed-{number}`, `orders-total-{number}`).
- `[data-testid=orders-empty]` is not shown for the unfiltered seeded customer.
- `[data-testid=orders-error]` is not shown.

### TC-2: Status filter narrows the list

**Steps**

1. On `/orders`, use `[data-testid=orders-status]` and select a status option (e.g. `[data-testid=orders-status-shipped]` or `cancelled`).
2. Observe URL `?status=` and the table.

**Expected**

- Only orders with that status appear, or `[data-testid=orders-empty]` shows `No orders with that status.` when none match.
- Count updates to match filtered total.

### TC-3: Open order detail from the list

**Steps**

1. From `/orders`, click `[data-testid=orders-link-{number}]` for a visible order.
2. Confirm navigation to `/orders/{number}`.

**Expected**

- Order detail loads (`[data-testid=order-number]` matches the clicked order).
- Detail shows status and lines (covered further in `ui-order-detail.md`).

## Notes

- Status values: `paid`, `picking`, `shipped`, `out_for_delivery`, `delivered`, `cancelled`.
- Pager: `orders-pager`, `orders-previous`, `orders-page`, `orders-next` (pageSize 20).
- Empty unfiltered / API empty cases: see `empty-order-states.md`.
- **Automation map:** TC-1–3 → e2e + API `GET /api/orders`; filtered empty → stubbed UI / integ intercept.
