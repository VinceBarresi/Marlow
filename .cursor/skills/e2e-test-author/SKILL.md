---
name: e2e-test-author
description: >-
  Creates Marlow Cypress and Playwright browser UI e2e tests using page objects
  and data-testid selectors. Use when the user asks for an e2e test, browser
  flow, Cypress UI spec, or Playwright UI spec (not Appium / API-only).
---

# E2E test author

## Instructions

1. Follow [`.cursor/rules/e2e-tests.mdc`](../../rules/e2e-tests.mdc) and [`.cursor/rules/tests.mdc`](../../rules/tests.mdc). This layer is **browser UI only**—not `api-tests`, not `ios-e2e-tests`.
2. Write **both** Cypress and Playwright unless the user names one framework.
3. Specs: `cypress/tests/e2e/*.cy.ts`; `playwright/e2e/*.spec.ts` or top-level `playwright/*.spec.ts` until moved. For `cy.intercept` / `page.route`, use `mock-ui-test-author` (`e2e/mock-ui/`).
4. Use / extend page objects (`cypress/pages/`, `playwright/pages/`). Prefer `page-object-author` when adding POs. No raw `data-testid` strings in specs.
5. Auth via `loginAsCustomer` / `loginAsAdmin` from each framework’s `support/login.ts`, then navigate with the page object.
6. Assert visible UI and URL/path. Add missing `data-testid`s in product UI when needed.
7. Live API only in this skill—do not stub with intercept/route here.
8. Mention runs: `npm run cypress:e2e` / `npx playwright test --project=chromium` (Docker variants as needed).

## Spec shape (Cypress)

```ts
import { loginAsCustomer } from "../../support/login";
import { Shop } from "../../pages/shop";

it("opens the shop", () => {
  loginAsCustomer();
  Shop.visit();
  cy.get(Shop.shopTitle).should("have.text", "Shop");
});
```

## Spec shape (Playwright)

```ts
import { loginAsCustomer } from "../support/login";
import { ShopPage } from "../pages/shop.page";

test("opens the shop", async ({ page }) => {
  await loginAsCustomer(page);
  const shop = new ShopPage(page);
  await shop.goto();
  await shop.expectLoaded();
});
```

## Checklist

- [ ] Page objects used (and updated if needed)
- [ ] Cypress + Playwright (unless one framework requested)
- [ ] `data-testid` selectors; UI + path asserts
- [ ] Run commands noted
