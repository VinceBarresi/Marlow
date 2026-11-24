---
name: mock-component-test-author
description: >-
  Creates Marlow Jest mocked component / page tests with mocked API helpers.
  Use when the user asks for a mock component test, Jest page test, Testing
  Library component test, or empty/loading/error UI coverage without a real network.
---

# Mock component test author

## Instructions

1. Follow [`.cursor/rules/mock-component-tests.mdc`](../../rules/mock-component-tests.mdc) and [`.cursor/rules/tests.mdc`](../../rules/tests.mdc).
2. Co-locate `*.test.tsx` next to the page/component under test.
3. Study the package’s existing tests and `src/test` helpers (`web`, `frontends/catalog`, `frontends/orders`).
4. `jest.mock` the local `api` module; drive responses with `whenApi` / `mockApi` and render with `renderPage` / `render`.
5. Assert with `screen.getByTestId(...)`. No real HTTP.
6. Cover the states the user cares about (empty, loading, error, happy path)—mirror neighboring tests.
7. For browser `cy.intercept` / `page.route` stubs, use `mock-ui-test-author` (`e2e/mock-ui/`), not this skill.
8. Mention run: `npm run test:unit`.

## Spec shape

```ts
import { screen } from "@testing-library/react";
import { whenApi } from "../test/mockApi";
import { renderPage } from "../test/render";
import { Login } from "./Login";

jest.mock("../api", () => ({ api: jest.fn() }));

test("shows the sign-in form", async () => {
  whenApi();
  await renderPage(<Login />);
  expect(screen.getByTestId("login-title")).toHaveTextContent("Marlow");
});
```

## Checklist

- [ ] Co-located `*.test.tsx`
- [ ] API mocked; Testing Library + `data-testid`
- [ ] `npm run test:unit` noted
