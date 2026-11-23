# UI cart (non-empty)

## Meta
- Area: cart
- Priority: P0
- Type: manual

## Preconditions
- App running at the shop origin
- Signed in as customer: `customer@marlow.test` / `datalab`
- Cart has at least one line item (add via product detail first; cart is session/Redis-scoped)
- Empty-cart UI is covered in `empty-order-states.md`—focus here on non-empty flows

## Cases

### TC-1: Cart shows line items, subtotal, and checkout link
**Steps**
1. Ensure a product is in the cart (e.g. add `KIT-10001` from `/products/KIT-10001`).
2. Open `/cart`.
3. Confirm `[data-testid=cart-title]` is `Cart`.
4. Confirm `[data-testid=cart-table]` and `[data-testid=cart-item-{sku}]` for the SKU.
5. Confirm `[data-testid=cart-subtotal]` and `[data-testid=cart-checkout]` are visible.

**Expected**
- Non-empty cart UI (no `[data-testid=cart-empty]`).
- Line shows link, qty, and line total (`cart-link-{sku}`, `cart-qty-{sku}`, `cart-line-total-{sku}`).
- Checkout control navigates toward `/checkout`.

### TC-2: Update quantity on a line item
**Steps**
1. On `/cart` with an item present, change `[data-testid=cart-qty-{sku}]` to a higher whole number within stock.
2. Blur/submit as the UI requires (or re-open cart after the update request).
3. Confirm `[data-testid=cart-line-total-{sku}]` and `[data-testid=cart-subtotal]` update.

**Expected**
- Quantity persists on reload of `/cart`.
- Subtotal reflects new qty × unit price.
- Exceeding stock should surface an error (`[data-testid=cart-error]` or API 409).

### TC-3: Remove a line item
**Steps**
1. On a non-empty cart, click `[data-testid=cart-remove-{sku}]` for one line.
2. Observe the table.

**Expected**
- That SKU’s row disappears.
- If it was the last item, empty state appears (`[data-testid=cart-empty]` / `[data-testid=cart-browse]`)—otherwise remaining lines stay.
- Subtotal recalculates.

## Notes
- API: `PUT /api/cart/items` (qty `0` removes), `DELETE /api/cart/items/:sku`, `GET /api/cart`.
- Pricing hint: shipping/tax rules apply at checkout, not necessarily in cart subtotal alone.
- **Automation map:** TC-1–3 → API cart mutations + e2e; stubbed UI for table/error rendering with mocked cart payload.
