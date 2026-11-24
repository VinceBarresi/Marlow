# Manual test cases

Markdown test cases for Marlow. Each file covers one feature or flow.

Created with the `manual-test-cases` Cursor skill. Prefer `data-testid` in steps; include a happy path and at least one negative case. Seed logins: `customer@marlow.test`, `staff@marlow.test`, `admin@marlow.test` / password `datalab`.

## Index

| File                                                               | Description                                                                  |
| ------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| [ui-login.md](./ui-login.md)                                       | Login form happy path, wrong password, empty credentials, signed-in redirect |
| [empty-order-states.md](./empty-order-states.md)                   | Empty cart and filtered/empty orders (API + UI + stubbed)                    |
| [ui-shop.md](./ui-shop.md)                                         | Shop browse, search, category filter, empty search                           |
| [ui-product.md](./ui-product.md)                                   | Product detail, add to cart, invalid SKU                                     |
| [ui-category.md](./ui-category.md)                                 | Category page products and empty category                                    |
| [ui-cart.md](./ui-cart.md)                                         | Non-empty cart: line items, qty update, remove                               |
| [ui-checkout.md](./ui-checkout.md)                                 | Ship checkout → receipt, empty cart error, pickup                            |
| [ui-orders.md](./ui-orders.md)                                     | Customer orders list, status filter, open detail                             |
| [ui-order-detail.md](./ui-order-detail.md)                         | Order detail, cancel when allowed, staff pick/ship                           |
| [ui-account.md](./ui-account.md)                                   | Account page name, email, and role                                           |
| [ui-locations.md](./ui-locations.md)                               | Locations list/map, detail inventory, admin add form                         |
| [ui-careers.md](./ui-careers.md)                                   | Job board filters; apply happy path and missing resume                       |
| [ui-staff-inventory.md](./ui-staff-inventory.md)                   | Staff inventory search and low-stock filter                                  |
| [ui-staff-customers.md](./ui-staff-customers.md)                   | Staff customers list and customer detail                                     |
| [ui-staff-applications.md](./ui-staff-applications.md)             | Staff applications list and empty state                                      |
| [ui-admin.md](./ui-admin.md)                                       | Admin hub links; customer denied access                                      |
| [api-session-catalog.md](./api-session-catalog.md)                 | Health, me, logout, products, categories, inventory auth                     |
| [api-cart-orders-fulfillment.md](./api-cart-orders-fulfillment.md) | Cart mutations, checkout, order detail, pick/ship/cancel                     |
| [api-locations-careers.md](./api-locations-careers.md)             | Locations CRUD, jobs, applications                                           |

When a case is ready to automate, hand off per `.cursor/rules/test-creation.mdc` (API / e2e / stubbed).
