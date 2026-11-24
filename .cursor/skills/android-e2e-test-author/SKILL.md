---
name: android-e2e-test-author
description: >-
  Creates Marlow Android Emulator e2e tests with Appium and WebDriverIO using screen
  objects and accessibility identifiers. Use when the user asks for an Android e2e
  test, Appium Android test, UiAutomator2 flow, or Jetpack Compose coverage.
---

# Android e2e test author

## Instructions

1. Follow [`.cursor/rules/android-e2e-tests.mdc`](../../rules/android-e2e-tests.mdc) and [`.cursor/rules/tests.mdc`](../../rules/tests.mdc) (logins, paths, run commands).
2. If the user points at a `docs/test-cases/*.md` (or says manual work is done), automate **Emulator-visible** customer flows; leave pure HTTP contracts to `api-test-author` (shared with web / iOS).
3. Study existing Appium layout:
   - Config: `appium/wdio.android.conf.ts`
   - Screens: `appium/screens/*.screen.ts` (shared with iOS)
   - Specs: `appium/specs/*.spec.ts` (shared)
   - Runner: `scripts/appium-android.sh` → `npm run appium:android`
4. **Always** add missing `Modifier.a11y("…")` values in Compose (`android/Marlow/.../ui/`) before writing selectors. Prefer ids that match iOS and web `data-testid`s (e.g. `login-email`). Keep iOS `.accessibilityIdentifier`s in sync when the screen exists there too.
5. Extend screen objects first (prefer `screen-object-author` / `screen-objects.mdc`); specs only call screen objects. Selectors: `$("~id")`, UiAutomator fallback OK with a comment, **never XPath**.
6. Compose `OutlinedTextField`: a11y id is often on a non-editable wrapper—reuse the Android fill pattern in `login.screen.ts` (click a11y node → focused `EditText` via UiAutomator).
7. Customer v1 scope: login, shop, product, cart, checkout, orders, account. Do not add staff/admin Appium flows unless asked.
8. Prerequisites: API via `npm run dev`, Android Studio SDK + running AVD (`adb devices`), `ANDROID_HOME` (default `~/Library/Android/sdk`), UiAutomator2 under `.appium/`. Emulator API host is `http://10.0.2.2:4000`.
9. Mention runs: `npm run appium:android` or `npm run appium:android:run` with optional `MARLOW_ANDROID_DEVICE` / `MARLOW_ANDROID_APP_PATH` / `MARLOW_ANDROID_UDID`.

## Spec shape

```ts
import { loginScreen } from "../screens/login.screen.js";
import { shopScreen } from "../screens/shop.screen.js";

describe("Marlow login", () => {
  it("signs in and opens the shop", async () => {
    await loginScreen.signIn("customer@marlow.test", "datalab");
    await shopScreen.waitForLoaded();
    await expect(shopScreen.search).toBeDisplayed();
  });
});
```

## Checklist

- [ ] Accessibility ids in Compose (match iOS / web)
- [ ] Screen object updated; spec uses the screen
- [ ] Android Compose text entry uses focused-EditText fill when needed
- [ ] Customer flow only (unless scope expanded)
- [ ] Documented `npm run appium:android` run
