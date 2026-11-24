---
name: api-test-author
description: >-
  Creates Marlow API tests for both Cypress and Playwright, sharing
  fixtures/endpoints and fixtures/models. Use when the user asks for an API
  test, endpoint test, cy.request, Playwright request fixture, or HTTP
  contract coverage. Writes both frameworks unless the user names only one.
---

# API test author

## Instructions

1. Follow [`.cursor/rules/api-tests.mdc`](../../rules/api-tests.mdc) and [`.cursor/skills/_shared/marlow-test-conventions.md`](../_shared/marlow-test-conventions.md).
2. If the user points at a `docs/test-cases/*.md` (or says manual work is done), read it and automate only the **HTTP-checkable** cases; leave navigation/empty-UI visuals to e2e/stubbed skills.
3. Inspect the route under test (e.g. `server/src`, OpenAPI) and existing suites:
   - `cypress/tests/api/login.cy.ts`
   - `playwright/api/login.spec.ts`
   - `fixtures/endpoints/`, `fixtures/models/`
4. Extend shared fixtures first (endpoint constant + request/response model + Zod schema in `fixtures/schemas/`). Omit dynamic `id` from expected bodies via `Omit<..., "id">` / `satisfies`.
5. **Unless the user specifies a single framework, add both:**
   - `cypress/tests/api/<name>.cy.ts`
   - `playwright/api/<name>.spec.ts`
6. Mirror scenarios across frameworks (same requests and expectations). Call `assertSchema(...)` on response bodies.
7. Do not hardcode seed UUIDs; assert id is a non-empty string when present.
8. When adding a gateway endpoint, extend `postman/Marlow.API.postman_collection.json` with a matching request + JSON Schema test when practical.
9. Mention how to run: `npm run cypress:api`, `npm run playwright:api`, or docker scripts. Postman: import `postman/`.

## Cypress shape

- Import endpoints/models from `../../../fixtures/...`
- `cy.request(method, url, body)` then assert `response.status` and body
- Exact keys: `.to.have.all.keys(...)`
- Partial user/object: `.to.include(partial)`
- Prefer `.not.equal("")` over `.empty` (eslint unused-expressions)

## Playwright shape

- Import from `../../fixtures/...`
- `test` + `request` fixture; `request.post|get|...` with `{ data }` when needed
- Exact keys via sorted `Object.keys(...)`
- Partial match: `toMatchObject`
- Use `test.describe` for grouping

## Checklist

- [ ] Fixtures updated (not duplicated inline)
- [ ] Cypress + Playwright files (or only the framework the user named)
- [ ] Status codes and body shape covered
- [ ] No brittle hardcoded ids
