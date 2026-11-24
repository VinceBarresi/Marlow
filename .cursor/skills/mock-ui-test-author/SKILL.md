---
name: mock-ui-test-author
description: >-
  Creates Marlow Cypress and Playwright mock UI tests that drive the browser with
  cy.intercept or page.route. Use when the user asks for a mock UI test, intercepted
  browser test, route-stubbed UI, or empty/error UI coverage in Cypress/Playwright.
---

# Mock UI test author

## Instructions

1. Follow [`.cursor/rules/mock-ui-tests.mdc`](../../rules/mock-ui-tests.mdc), [`.cursor/rules/e2e-tests.mdc`](../../rules/e2e-tests.mdc) (page objects / auth), and [`.cursor/rules/tests.mdc`](../../rules/tests.mdc).
2. Write **both** Cypress and Playwright unless the user names one framework.
3. Specs under `cypress/tests/e2e/mock-ui/` and `playwright/e2e/mock-ui/`.
4. Stub APIs with `cy.intercept` / `page.route`; use page objects for UI (`cypress/pages/`, `playwright/pages/`).
5. Auth via `loginAsCustomer` / `loginAsAdmin`, then page-object navigate.
6. Assert visible UI and URL/path—not response JSON schemas (`api-tests`).
7. For Jest component mocks, use `mock-component-test-author`. For live API browser flows, use `e2e-test-author`.
8. Mention runs: `npm run cypress:e2e` / `npx playwright test --project=chromium` (specs under `e2e/mock-ui/`).

## Spec shape (Cypress)

```ts
loginAsCustomer();
cy.intercept("GET", "/api/orders*", { statusCode: 200, body: { orders: [], total: 0 } }).as(
  "empty",
);
Orders.visit();
cy.wait("@empty");
cy.get(Orders.empty).should("have.text", "You have no orders yet.");
```

## Spec shape (Playwright)

```ts
await loginAsCustomer(page);
await page.route("**/api/orders**", (route) =>
  route.fulfill({ status: 200, body: JSON.stringify({ orders: [], total: 0 }) }),
);
const orders = new OrdersPage(page);
await orders.goto();
await orders.expectEmpty();
```

## Checklist

- [ ] Specs under `e2e/mock-ui/` for both frameworks
- [ ] `cy.intercept` / `page.route` + page objects
- [ ] Not Jest (`mock-component`) and not live e2e
