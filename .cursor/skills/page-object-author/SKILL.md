---
name: page-object-author
description: >-
  Creates and extends Marlow page objects for Cypress and Playwright e2e/integ
  tests. Use when the user asks for a page object, POM, page class, selector
  helper, or to refactor e2e specs onto page objects.
---

# Page object author

## Instructions

1. Follow [`.cursor/rules/page-objects.mdc`](../../rules/page-objects.mdc) and [`.cursor/skills/_shared/marlow-test-conventions.md`](../_shared/marlow-test-conventions.md).
2. Study existing objects before inventing new ones:
   - Cypress: `cypress/pages/login.ts`, `shell.ts`, `shop.ts`, `cart.ts`, `orders.ts`
   - Playwright: `playwright/pages/*.page.ts`, `playwright/support/login.ts`
3. **Unless the user names one framework, add/update both.**
4. Put only selectors, navigation, and reusable UI actions/assertions in the page object.
5. Leave API login in `cypress/support/login.ts` / `playwright/support/login.ts`.
6. Specs import the page object and auth helper—no raw `[data-testid=...]` in the spec.
7. Prefer extending an existing page over a new file for the same route/surface.

## Cypress shape

```ts
export class ShopPage {
  static path = "/";
  static title = "[data-testid=shop-title]";

  static visit() {
    cy.visit(ShopPage.path);
  }
}
```

## Playwright shape

```ts
import { expect, type Page } from "@playwright/test";

export class ShopPage {
  readonly path = "/";

  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto(this.path);
  }

  async expectLoaded() {
    await expect(this.page.getByTestId("shop-title")).toHaveText("Shop", {
      timeout: 20000,
    });
  }
}
```

## Spec usage

- Cypress: `ShopPage.visit(); cy.get(ShopPage.title).should(...)`
- Playwright: `const shop = new ShopPage(page); await shop.goto(); await shop.expectLoaded();`

## Checklist

- [ ] Cypress + Playwright page objects (or only the framework named)
- [ ] Specs use page objects, not inline test ids
- [ ] Auth via support helpers, not the login form (unless testing login UX)
- [ ] Selectors are `data-testid` only
