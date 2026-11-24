# UI category page

## Meta

- Area: shop
- Priority: P1
- Type: manual

## Preconditions

- App running at the shop origin
- Signed in as customer: `customer@marlow.test` / `datalab`
- Seed categories available (e.g. Kitchen)

## Cases

### TC-1: Category page lists products for that category

**Steps**

1. Open `/categories/Kitchen` (or navigate via `[data-testid=category-link-Kitchen]` / shop category chip).
2. Confirm `[data-testid=category-shop]` (or page shell) and `[data-testid=category-title]` reflect Kitchen.
3. Read `[data-testid=category-count]` and confirm `[data-testid=category-grid]` has product cards.

**Expected**

- Products for Kitchen appear (e.g. `KIT-*` SKUs).
- Cards expose `product-card-{sku}`, name, price, stock test ids.
- `[data-testid=category-error]` is not shown.

### TC-2: Unknown or empty category shows empty state

**Steps**

1. Open `/categories/NoSuchCategory` (or a category string with no products).
2. Wait for load.

**Expected**

- `[data-testid=category-empty]` shows `No products in this category.`
- No product grid/cards (or empty grid).
- Count reflects zero products.

## Notes

- Query params: `?page=` with pageSize 12; pager: `category-pager`, `category-previous`, `category-page`, `category-next`.
- API: `GET /api/products?category={category}&page=&pageSize=`.
- **Automation map:** TC-1 → e2e + API products-by-category; TC-2 → e2e + stubbed UI empty category.
