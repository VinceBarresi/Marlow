# UI staff customers

## Meta

- Area: staff
- Priority: P1
- Type: manual

## Preconditions

- App running at the shop origin
- Signed in as staff: `staff@marlow.test` / `datalab`
- Seed customers present (Mina Adler and others)

## Cases

### TC-1: Customers list loads and can search

**Steps**

1. Open `/staff/customers` (or `[data-testid=nav-customers]`).
2. Confirm `[data-testid=customers-title]`, `[data-testid=customers-count]`, `[data-testid=customers-table]`.
3. Search for `Mina` or `customer@marlow.test` via `[data-testid=customers-search]` / `[data-testid=customers-search-submit]`.

**Expected**

- Matching row appears with email, orders count, spent (`customers-email-{id}`, `customers-orders-{id}`, `customers-spent-{id}`).
- `[data-testid=customers-error]` is not shown.

### TC-2: Open customer detail

**Steps**

1. From the list, click `[data-testid=customers-link-{id}]` for Mina (or open `/staff/customers/{id}` for a known seed id).
2. Confirm `[data-testid=customer-name]`, `[data-testid=customer-email]`.
3. Confirm `[data-testid=customer-orders]` and order links (`customer-order-{number}`, `customer-order-link-{number}`).

**Expected**

- Detail matches the selected customer.
- Orders list is non-empty for the primary seed customer; empty copy uses `[data-testid=customer-orders-empty]` when none.
- `[data-testid=customer-back]` returns to the list.

### TC-3: Unknown customer id (edge)

**Steps**

1. As staff, open `/staff/customers/00000000-0000-0000-0000-000000000000` (or another non-existent UUID).

**Expected**

- `[data-testid=customer-error]` (or not-found messaging) appears.
- Orders table for that customer is not shown.

## Notes

- Do not hardcode UUIDs in automation assertions unless required; prefer lookup by email from list.
- Customer role should not access `/staff/customers` (redirect)—optional negative.
- **Automation map:** TC-1–2 → e2e + API customers list/detail; TC-3 → API/e2e not-found; stubbed UI for list/detail empty states.
