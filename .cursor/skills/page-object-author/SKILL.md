---
name: page-object-author
description: >-
  Creates or extends Marlow Cypress and Playwright page objects with data-testid
  selectors. Use when the user asks for a page object, POM, or screen wrapper for
  browser e2e or mock UI tests.
---

# Page object author

## Instructions

1. Follow [`.cursor/rules/page-objects.mdc`](../../rules/page-objects.mdc), [`.cursor/rules/e2e-tests.mdc`](../../rules/e2e-tests.mdc), and [`.cursor/rules/tests.mdc`](../../rules/tests.mdc).
2. Add **both** Cypress and Playwright page objects for the same screen unless the user names one framework.
3. Cypress: static class in `cypress/pages/` with selector constants + `visit` / actions.
4. Playwright: instance class in `playwright/pages/*.page.ts` with `constructor(page: Page)`, `goto`, actions, and `expect*` helpers.
5. Selectors: `data-testid` only. Add missing ids in product UI when the control is missing one.
6. Do not put assertions that belong in specs into Cypress static helpers unless mirroring an existing `expect*` Playwright pattern.

## Cypress shape

```ts
export class Shop {
  static shopTitle = "[data-testid=shop-title]";

  static visit() {
    cy.visit("/");
  }
}
```

## Playwright shape

```ts
import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

export class ShopPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto("/");
  }

  async expectLoaded() {
    await expect(this.page.getByTestId("shop-title")).toHaveText("Shop");
  }
}
```

## Checklist

- [ ] Cypress + Playwright POs aligned
- [ ] `data-testid` only; product UI updated if ids were missing
- [ ] Specs can call the new actions without inline selectors
