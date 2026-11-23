# UI shop browse

## Meta

- Area: shop
- Priority: P0
- Type: manual

## Preconditions

- App running (`npm run dev` or e2e stack) at the shop origin
- Signed in as customer: `customer@marlow.test` / `datalab`
- Seed catalog loaded (categories and products available)

## Cases

### TC-1: Shop home shows products and count

**Steps**

1. Open `/` and confirm `[data-testid=shop-title]` shows `Shop`.
2. Wait for `[data-testid=shop-grid]` (or note `[data-testid=shop-empty]` if catalog is empty—should not be on seed).
3. Read `[data-testid=shop-count]` for the product total.
4. Confirm at least one `[data-testid^=product-card-]` card is visible with name, price, and stock test ids.

**Expected**

- Shop title and non-zero count appear.
- Product cards render with `product-name-{sku}`, `product-price-{sku}`, `product-stock-{sku}`.
- `[data-testid=shop-error]` is not shown.

### TC-2: Search finds matching products

**Steps**

1. On `/`, enter a known term (e.g. part of a seeded product name or `KIT`) in `[data-testid=shop-search]`.
2. Click `[data-testid=shop-search-submit]` (or submit `[data-testid=shop-search-form]`).
3. Observe URL query (`?q=...`) and the grid.

**Expected**

- Results update; `[data-testid=shop-count]` reflects filtered total.
- Cards shown match the search (or empty state if no match—see TC-4).

### TC-3: Category chip filters the catalog

**Steps**

1. On `/`, click a category chip such as `[data-testid=shop-category-Kitchen]` (or use `[data-testid=shop-category]` / `[data-testid=category-link-Kitchen]` if navigating via category links).
2. Confirm URL includes the category (`?category=Kitchen` and/or `/categories/Kitchen`).
3. Confirm cards show Kitchen products (e.g. SKUs with `KIT-` prefix when applicable).

**Expected**

- Filter applied; count and grid update.
- `[data-testid=shop-category-all]` (or equivalent) can clear back to all products.

### TC-4: Empty search shows no-match empty state

**Steps**

1. On `/`, set `[data-testid=shop-search]` to a nonsense string (e.g. `zzz-no-such-product-999`).
2. Submit `[data-testid=shop-search-form]`.

**Expected**

- `[data-testid=shop-empty]` shows `No products match.`
- `[data-testid=shop-grid]` is not shown (or has no cards).
- Count reflects zero matches.

## Notes

- Seed categories include Kitchen, Bath, Bedroom, Outdoor, Apparel, Office, Pantry, Lighting.
- Example seed SKU: `KIT-10001`.
- Pager controls: `shop-pager`, `shop-previous`, `shop-page`, `shop-next` (pageSize 12).
- **Automation map:** TC-1–4 → e2e (shop page object) + stubbed UI for empty/error; search/filter list contracts → API (`GET /api/products`, `GET /api/categories`).
