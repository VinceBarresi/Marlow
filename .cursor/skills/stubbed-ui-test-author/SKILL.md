---
name: stubbed-ui-test-author
description: >-
  Creates stubbed Marlow UI unit tests with Jest and Testing Library (mocked
  API, co-located *.test.tsx). Use when the user asks for a unit test, stubbed
  UI test, Jest page test, Testing Library test, or component test without a
  real backend.
---

# Stubbed UI test author

## Instructions

1. Follow [`.cursor/rules/stubbed-ui-tests.mdc`](../../rules/stubbed-ui-tests.mdc) and [`.cursor/skills/_shared/marlow-test-conventions.md`](../_shared/marlow-test-conventions.md).
2. If the user points at a `docs/test-cases/*.md` (or says manual work is done), read it and automate **mocked UI** cases (empty lists, error copy, form defaults); leave live browser flows to `e2e-test-author` and HTTP contracts to `api-test-author`.
3. Identify the package (`web`, `frontends/catalog`, or `frontends/orders`) and its helpers under that package’s `src/test/` (`whenApi`, `renderPage`).
4. Copy the style of an existing neighbor test (e.g. `web/src/pages/Login.test.tsx`, `frontends/catalog/src/Shop.test.tsx`).
5. Co-locate `ComponentName.test.tsx` next to the source file.
6. Mock the local API module; stub responses with `whenApi({ "/api/...": ... })` before `renderPage`.
7. Assert with `screen.getByTestId(...)`. No real HTTP, Cypress, or Playwright.
8. Mention run: `npm run test:unit` or the package’s jest script.

## Shape (`web` example)

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

Adjust import paths for `frontends/*` (their `api` / `test` locations differ). Always `await renderPage(...)` so effects flush.

## Checklist

- [ ] Co-located `*.test.tsx`
- [ ] API mocked; `whenApi` covers paths the page calls
- [ ] Assertions use `data-testid`
- [ ] No network / e2e runners
