# UI staff inventory

## Meta
- Area: staff
- Priority: P1
- Type: manual

## Preconditions
- App running at the shop origin
- Signed in as staff: `staff@marlow.test` / `datalab` (or admin)
- Customer role available for access-denied check

## Cases

### TC-1: Inventory list loads and search works
**Steps**
1. Open `/staff/inventory` (or `[data-testid=nav-inventory]`).
2. Confirm `[data-testid=inventory-title]` and `[data-testid=inventory-count]`.
3. Confirm `[data-testid=inventory-table]` with rows (`inventory-row-{sku}`, sku/name/bin/on-hand/reserved/available).
4. Enter a SKU prefix (e.g. `KIT`) in `[data-testid=inventory-search]` and submit `[data-testid=inventory-search-form]`.

**Expected**
- Table filters to matching SKUs.
- `[data-testid=inventory-error]` is not shown.
- Pager controls work when results span pages (`inventory-pager`, etc.).

### TC-2: Low stock filter
**Steps**
1. On `/staff/inventory`, enable `[data-testid=inventory-low-stock]` (checkbox/toggle as implemented).
2. Submit search if required (`[data-testid=inventory-search-submit]`).

**Expected**
- Results are limited to low-stock rows (API `lowStock=true`).
- Count updates; empty table is acceptable if none are low (note environment).

### TC-3: Customer denied staff inventory (negative)
**Steps**
1. Sign in as `customer@marlow.test` / `datalab`.
2. Navigate to `/staff/inventory`.

**Expected**
- Redirected away from staff inventory (typically to `/`); `[data-testid=inventory-table]` not shown for customer.
- Direct `GET /api/inventory` as customer returns 403 `Staff only.`

## Notes
- Staff UI pageSize often 25; API default pageSize 20.
- **Automation map:** TC-1–2 → e2e + API inventory GET; TC-3 → e2e role redirect + API 403; stubbed UI for table/search.
