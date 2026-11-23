# UI product detail

## Meta

- Area: shop
- Priority: P0
- Type: manual

## Preconditions

- App running at the shop origin
- Signed in as customer: `customer@marlow.test` / `datalab`
- Known in-stock SKU from seed (e.g. `KIT-10001`)

## Cases

### TC-1: Product detail loads and add to cart

**Steps**

1. Open `/products/KIT-10001` (or another in-stock seed SKU).
2. Confirm `[data-testid=product-name]`, `[data-testid=product-sku]`, `[data-testid=product-price]`, and `[data-testid=product-stock]` are visible.
3. Optionally adjust `[data-testid=product-quantity]`.
4. Click `[data-testid=product-add]`.

**Expected**

- Detail panel loads without `[data-testid=product-error]`.
- Add succeeds; browser navigates to `/cart`.
- Cart shows the line item for that SKU (`[data-testid=cart-item-KIT-10001]` or matching SKU).

### TC-2: Invalid SKU shows not-found error

**Steps**

1. Open `/products/NOT-A-REAL-SKU`.
2. Wait for load to finish (`[data-testid=product-loading]` clears).

**Expected**

- `[data-testid=product-error]` shows a not-found style message (API: `Product not found.`).
- Add form / `[data-testid=product-add]` is not usable for a missing product.
- `[data-testid=product-back]` (if present) can return toward shop.

### TC-3: Out-of-stock product disables add (edge)

**Steps**

1. If an out-of-stock SKU is known from shop (`Out of stock` on a card), open its `/products/:sku` page.
2. Inspect `[data-testid=product-add]`.

**Expected**

- `[data-testid=product-add]` is disabled when available stock is less than 1.
- Quantity form does not successfully add more than available (API would return 409 if forced).

## Notes

- Cart mutation: `PUT /api/cart/items` with `{ sku, quantity }`.
- Quantity validation errors may surface as cart/API messages (`Only {n} available.`).
- **Automation map:** TC-1–2 → e2e + API product GET / cart PUT; TC-3 → stubbed UI (mock low/zero stock) + optional e2e if a deterministic OOS SKU exists.
