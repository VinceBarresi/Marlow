# UI locations

## Meta
- Area: locations
- Priority: P1
- Type: manual

## Preconditions
- App running at the shop origin
- Customer or staff for browse; admin (`admin@marlow.test` / `datalab`) for add form
- Seed store slugs available (e.g. `austin-domain`)

## Cases

### TC-1: Locations list and map load
**Steps**
1. Sign in as customer and open `/locations`.
2. Confirm `[data-testid=locations-title]` and `[data-testid=locations-lede]`.
3. Confirm `[data-testid=locations-map]` and `[data-testid=locations-grid]`.
4. Confirm a card such as `[data-testid=location-card-austin-domain]` with name/city/hours/stock test ids.

**Expected**
- Multiple seeded stores appear.
- Map links (`map-link-{slug}`) correspond to listed stores.
- `[data-testid=locations-error]` is not shown.

### TC-2: Location detail shows inventory
**Steps**
1. Open `/locations/austin-domain` (or click a location card/name).
2. Confirm `[data-testid=location-name]`, `[data-testid=location-address]`, `[data-testid=location-map]`.
3. Confirm inventory table `[data-testid=location-inventory]` and rows (`location-row-{sku}`, `location-on-hand-{sku}`).
4. Optionally search via `[data-testid=location-search]` / category chips.

**Expected**
- Detail loads; inventory count `[data-testid=location-count]` is present.
- Empty search may show `[data-testid=location-empty]`.
- `[data-testid=location-back]` returns toward the list.

### TC-3: Admin add-location form is visible
**Steps**
1. Sign in as `admin@marlow.test` / `datalab`.
2. Open `/locations`.
3. Confirm `[data-testid=location-form]` with fields: name, line1, city, region, postal, phone, hours, latitude, longitude, submit.

**Expected**
- Admin sees the create form (`location-form-submit` available).
- Non-admin (customer) does not see `[data-testid=location-form]` (or cannot submit create)—negative check by switching roles.

### TC-4: Invalid location slug (edge)
**Steps**
1. Open `/locations/not-a-real-store`.

**Expected**
- `[data-testid=location-error]` (or not-found messaging) appears.
- Inventory table is not shown for a missing store.

## Notes
- Seed slugs include `austin-domain`, `dallas-bishop-arts`, `houston-heights`, etc.
- Admin can remove stores via `location-remove-{slug}` / confirm; 409 if store has orders.
- **Automation map:** TC-1–2 → e2e + API locations GET; TC-3 → e2e role gate + API POST (admin); TC-4 → e2e/stubbed error; customer denied create → API.
