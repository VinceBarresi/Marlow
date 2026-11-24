---
name: ios-e2e-test-author
description: >-
  Creates Marlow iOS Simulator e2e tests with Appium and WebDriverIO using screen
  objects and accessibility identifiers. Use when the user asks for an iOS e2e
  test, Appium test, WDIO mobile spec, Simulator e2e, or SwiftUI flow coverage.
---

# iOS e2e test author

## Instructions

1. Follow [`.cursor/rules/ios-e2e-tests.mdc`](../../rules/ios-e2e-tests.mdc) and [`.cursor/rules/tests.mdc`](../../rules/tests.mdc) (logins, paths, run commands).
2. If the user points at a `docs/test-cases/*.md` (or says manual work is done), automate **Simulator-visible** customer flows; leave pure HTTP contracts to `api-test-author` (shared with web).
3. Study existing Appium layout:
   - Config: `appium/wdio.ios.conf.ts`
   - Screens: `appium/screens/*.screen.ts`
   - Specs: `appium/specs/*.spec.ts`
   - Runner: `scripts/appium-ios.sh` → `npm run appium:ios`
4. **Always** add missing `.accessibilityIdentifier` values in SwiftUI (`ios/Marlow/Marlow/Features/`, `App/`) before writing selectors. Prefer ids that match web `data-testid`s when the concept exists on both (e.g. `login-email`).
5. Extend screen objects first (prefer `screen-object-author` / `screen-objects.mdc`); specs only call screen objects. Selectors: `$("~id")`, predicate fallback OK, **never XPath**.
6. Customer v1 scope: login, shop, product, cart, checkout, orders, account. Do not add staff/admin Appium flows unless asked.
7. Prerequisites in the test plan/docs: API via `npm run dev`, Xcode Simulator, XCUITest driver under `.appium/`.
8. Mention runs: `npm run appium:ios` or `npm run appium:ios:run` with optional `MARLOW_IOS_DEVICE` / `MARLOW_APP_PATH`.

## Spec shape

```ts
import { loginScreen } from "../screens/login.screen.js";
import { shopScreen } from "../screens/shop.screen.js";

describe("Marlow shop", () => {
  it("signs in and opens the shop", async () => {
    await loginScreen.signIn("customer@marlow.test", "datalab");
    await shopScreen.waitForLoaded();
    await expect(shopScreen.search).toBeDisplayed();
  });
});
```

Shared specs also run under `npm run appium:android`; keep describe titles platform-neutral.

## Screen object shape

```ts
export class LoginScreen {
  get email() {
    return $("~login-email");
  }

  get submit() {
    return $("~login-submit");
  }

  async signIn(email: string, password: string) {
    await this.email.waitForDisplayed({ timeout: 30000 });
    await this.email.clearValue();
    await this.email.setValue(email);
    // ...
    await this.submit.click();
  }
}
```

## Checklist

- [ ] Accessibility ids in SwiftUI (or confirmed existing)
- [ ] Screen object updated; spec uses the screen
- [ ] Customer flow only (unless scope expanded)
- [ ] Documented `npm run appium:ios` run
