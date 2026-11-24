---
name: api-test-author
description: >-
  Creates Marlow Cypress and Playwright API tests with shared fixtures and
  response schema checks. Use when the user asks for an API test, endpoint
  coverage, cy.request, Playwright request, or HTTP contract assertions.
---

# API test author

## Instructions

1. Follow [`.cursor/rules/api-tests.mdc`](../../rules/api-tests.mdc) and [`.cursor/rules/tests.mdc`](../../rules/tests.mdc).
2. Write **both** Cypress (`cypress/tests/api/*.cy.ts`) and Playwright (`playwright/api/*.spec.ts`) unless the user names one framework.
3. Extend shared fixtures first:
   - `cypress/fixtures/endpoints/` — path constants
   - `cypress/fixtures/models/` — request/response types and expected partials (`satisfies` + `Omit<..., "id">` when id is dynamic)
   - Binary uploads under `fixtures/` when needed
4. Assert **status and schema** on every response under test (exact keys, types/formats, expected values)—not status alone.
5. Use seed logins from `tests.mdc`. Do not hardcode user UUIDs unless required.
6. Keep Cypress and Playwright assertions aligned on the same contract.
7. Mention runs: `npm run cypress:api` / `npm run playwright:api` (Docker: `cypress:docker` / `playwright:docker`).

## Spec shape (Cypress)

```ts
import { loginEndpoints } from "../../fixtures/endpoints/loginEndpoints";
import { loginResponseModel, type LoginResponseModel } from "../../fixtures/models/loginModel";

cy.request("POST", loginEndpoints.login, { email: "customer@marlow.test", password: "datalab" }).then(
  (response) => {
    expect(response.status).to.eq(200);
    expect(response.body).to.have.all.keys("user");
    expect(response.body.user).to.include(loginResponseModel.user);
  },
);
```

## Spec shape (Playwright)

```ts
const response = await request.post("/api/login", {
  data: { email: "customer@marlow.test", password: "datalab" },
});
expect(response.status()).toBe(200);
const body = await response.json();
expect(Object.keys(body).sort()).toEqual(["user"]);
expect(body.user).toMatchObject({ email: "customer@marlow.test", role: "customer" });
```

## Checklist

- [ ] Fixtures extended (endpoints/models) when shapes are new
- [ ] Cypress + Playwright (unless one framework requested)
- [ ] Schema asserts (keys + types + expected values)
- [ ] Run commands noted
