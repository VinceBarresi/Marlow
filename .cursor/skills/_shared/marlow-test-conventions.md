# Marlow test conventions

Shared reference for test-creation skills. Prefer existing patterns over inventing new ones.

## Seed logins

| Role     | Email                | Password |
| -------- | -------------------- | -------- |
| Customer | customer@marlow.test | datalab  |
| Staff    | staff@marlow.test    | datalab  |
| Admin    | admin@marlow.test    | datalab  |

Customer display name: Mina Adler. Admin: Avery Chen. Staff: Jordan Walsh.

Do **not** hardcode user UUIDs in assertions unless the test truly requires a fixed id; prefer “non-empty string id” or omit id from expected models.

## Selectors

- Prefer `data-testid` in UI, e2e, and manual steps.
- Avoid CSS class / text-only selectors unless no test id exists (then add a test id in the product code).

## Shared API fixtures

Framework-agnostic TypeScript under `fixtures/`:

- `fixtures/endpoints/` — path constants (e.g. `loginEndpoints.login`)
- `fixtures/models/` — request/response types and expected bodies (`satisfies` + `Omit<..., "id">` when id is dynamic)

Both Cypress and Playwright API tests import from here. Extend these files when adding endpoints; do not duplicate payload shapes in each suite.

## Cypress vs Playwright assertions (API)

**Cypress (Chai)**

- `expect(body).to.be.an("object").and.to.have.all.keys(...)` for exact keys
- `expect(user).to.include(expectedPartial)` for subset match
- Avoid property getters that trip `@typescript-eslint/no-unused-expressions` (e.g. prefer `.not.equal("")` over `.empty`)

**Playwright (expect)**

- `expect(Object.keys(body).sort()).toEqual([...])` for exact keys
- `expect(user).toMatchObject(expectedPartial)`
- `expect(user.id).toEqual(expect.any(String))` and `not.toEqual("")`

## Auth in browser tests

- Cypress: `loginAsCustomer()` / `loginAsAdmin()` from `cypress/support/login.ts`, then page-object `visit`
- Playwright: `loginAsCustomer(page)` / `loginAsAdmin(page)` from `playwright/support/login.ts`, then page-object `goto` (cookie jar is shared with the page)
- Do not hardcode URL hosts in assertions; prefer path checks (e.g. `/\/$/` or pathname)

## Page objects

- Cypress: static classes in `cypress/pages/` (selector constants + `visit` / actions)
- Playwright: instance classes in `playwright/pages/*.page.ts` (constructor `Page`, `goto` / actions / `expect*`)
- Specs must use page objects—no inline `data-testid` strings in e2e/integ specs
- See `.cursor/rules/page-objects.mdc` and the `page-object-author` skill

## Stubbed UI (Jest)

- Co-locate `*.test.tsx` next to the page/component
- `jest.mock` the local `api` module; use package `src/test/whenApi` + `renderPage` (`web`, `frontends/catalog`, `frontends/orders` each have their own)
- Assert with `screen.getByTestId(...)`; no real network

## How to run

| Suite             | Command                                  |
| ----------------- | ---------------------------------------- |
| Unit / stubbed    | `npm run test:unit`                      |
| Cypress API       | `npm run cypress:api`                    |
| Cypress e2e       | `npm run cypress:e2e`                    |
| Cypress Docker    | `npm run cypress:docker`                 |
| Playwright API    | `npm run playwright:api`                 |
| Playwright e2e    | `npx playwright test --project=chromium` |
| Playwright Docker | `npm run playwright:docker`              |

Docker runners boot the shop via `scripts/e2e-up.sh` and use `host.docker.internal`. Only change Vite `LISTEN_HOST` / `E2E_HOST` / `allowedHosts` when fixing Docker reachability—not for ordinary new tests.

## File placement

| Kind             | Location                                                         |
| ---------------- | ---------------------------------------------------------------- |
| Manual           | `docs/test-cases/*.md`                                           |
| Cypress API      | `cypress/tests/api/*.cy.ts`                                      |
| Cypress e2e      | `cypress/tests/e2e/*.cy.ts`                                      |
| Cypress integ    | `cypress/tests/e2e/integ/*.cy.ts` (`cy.intercept`)               |
| Cypress PO       | `cypress/pages/` (required for e2e/integ)                        |
| Playwright API   | `playwright/api/*.spec.ts`                                       |
| Playwright e2e   | `playwright/e2e/*.spec.ts`                                       |
| Playwright integ | `playwright/e2e/integ/*.spec.ts` (`page.route`)                  |
| Playwright PO    | `playwright/pages/*.page.ts` (required for e2e/integ)            |
| Playwright auth  | `playwright/support/login.ts`                                    |
| Stubbed UI       | next to source as `*.test.tsx` (every page already has coverage) |
