# UI admin hub

## Meta

- Area: admin
- Priority: P1
- Type: manual

## Preconditions

- App running at the shop origin
- Admin: `admin@marlow.test` / `datalab`
- Customer: `customer@marlow.test` / `datalab` for denial

## Cases

### TC-1: Admin hub shows identity and useful links

**Steps**

1. Sign in as admin.
2. Open `/admin` (or `[data-testid=nav-admin]`—admin-only nav).
3. Confirm `[data-testid=admin-title]`, `[data-testid=admin-lede]`, `[data-testid=admin-card]`.
4. Confirm `[data-testid=admin-name]` and `[data-testid=admin-access]`.
5. Confirm links: `[data-testid=admin-locations]`, `[data-testid=admin-jobs]`, and `[data-testid=admin-console]` (DB console URL).

**Expected**

- Name reflects Avery Chen / admin identity.
- Locations and jobs links navigate to `/locations` and `/careers` (admin forms available there).
- Console link points at the local DB console (e.g. `http://127.0.0.1:4003`).

### TC-2: Customer denied admin hub (negative)

**Steps**

1. Sign in as customer.
2. Confirm `[data-testid=nav-admin]` is not in the nav.
3. Navigate directly to `/admin`.

**Expected**

- Redirected to `/` (or non-admin home); admin card/links are not shown.
- Staff may also be denied `/admin` (admin-only)—verify staff redirect if in scope.

## Notes

- Admin create/delete for locations and jobs lives on those pages, not only on the hub.
- **Automation map:** TC-1 → e2e; TC-2 → e2e role redirect; stubbed UI for admin card content.
