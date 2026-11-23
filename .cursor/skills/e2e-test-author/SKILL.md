---
name: e2e-test-author
description: >-
  Creates Marlow browser e2e tests for both Cypress and Playwright using
  page objects, data-testid selectors, and API login helpers. Use when the user
  asks for an e2e test, browser test, Cypress e2e, Playwright e2e, or UI flow
  coverage. Writes both frameworks unless the user names only one.
---

# E2E test author

## Instructions

1. Follow [`.cursor/rules/e2e-tests.mdc`](../../rules/e2e-tests.mdc), [`.cursor/rules/page-objects.mdc`](../../rules/page-objects.mdc), and [`.cursor/skills/_shared/marlow-test-conventions.md`](../_shared/marlow-test-conventions.md).
2. If the user points at a `docs/test-cases/*.md` (or says manual work is done), read it and automate **browser-visible** cases (empty states, redirects, nav); leave pure HTTP contracts to `api-test-author` and mocked component cases to `stubbed-ui-test-author`.
3. Study existing flows and page objects:
   - Cypress: `cypress/tests/e2e/`, `cypress/pages/`, `cypress/support/login.ts`
   - Playwright: `playwright/e2e/`, `playwright/pages/`, `playwright/support/login.ts`
4. Prefer asserting via page objects (`data-testid` inside the PO). Add test ids in product code if missing. For new surfaces, follow `page-object-author`.
5. **Unless the user specifies a single framework, add both:**
   - Live API e2e: `cypress/tests/e2e/<name>.cy.ts`, `playwright/e2e/<name>.spec.ts`
   - Integ (network stub) tests: `cypress/tests/e2e/integ/<name>.cy.ts`, `playwright/e2e/integ/<name>.spec.ts`
6. Sign in via API, then open the UI:
   - Cypress: `loginAsCustomer()` / `loginAsAdmin()` then page-object `visit`
   - Playwright: `loginAsCustomer(page)` / `loginAsAdmin(page)` then page-object `goto`
7. Assert pathname/path regex—not hardcoded `localhost` hosts.
8. Do not change Vite Docker host settings unless the user is fixing container reachability.
9. Mention runs: `npm run cypress:e2e`, `npx playwright test --project=chromium`, or `npm run cypress:docker` / `npm run playwright:docker`.

## Cypress shape

```ts
import { ShopPage } from "../../pages/shop";
import { Shell } from "../../pages/shell";
import { loginAsCustomer } from "../../support/login";

describe("shop", () => {
  it("opens the shop", () => {
    loginAsCustomer();
    ShopPage.visit();
    cy.get(Shell.navUser).should("contain", "customer@marlow.test");
    cy.get(ShopPage.title, { timeout: 20000 }).should("have.text", "Shop");
  });
});
```

## Playwright shape

```ts
import { test } from "@playwright/test";
import { ShellPage } from "../pages/shell.page";
import { ShopPage } from "../pages/shop.page";
import { loginAsCustomer } from "../support/login";

test("opens the shop", async ({ page }) => {
  await loginAsCustomer(page);
  const shop = new ShopPage(page);
  const shell = new ShellPage(page);
  await shop.goto();
  await shell.expectNavUserContains("customer@marlow.test");
  await shop.expectLoaded();
});
```

## Checklist

- [ ] Cypress + Playwright (or only the framework named)
- [ ] Page objects for selectors / navigation
- [ ] API login before UI assertions
- [ ] No host-hardcoded URL expects
