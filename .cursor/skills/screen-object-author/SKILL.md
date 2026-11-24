---
name: screen-object-author
description: >-
  Creates or extends Marlow Appium / WebDriverIO screen objects with accessibility
  id selectors. Use when the user asks for a screen object, Appium screen wrapper,
  or WDIO page object for iOS Simulator or Android Emulator tests.
---

# Screen object author

## Instructions

1. Follow [`.cursor/rules/screen-objects.mdc`](../../rules/screen-objects.mdc), [`.cursor/rules/ios-e2e-tests.mdc`](../../rules/ios-e2e-tests.mdc), [`.cursor/rules/android-e2e-tests.mdc`](../../rules/android-e2e-tests.mdc), and [`.cursor/rules/tests.mdc`](../../rules/tests.mdc).
2. Study existing screens in `appium/screens/*.screen.ts` and mirror their shape. Screens are **shared** across iOS and Android.
3. **Always** add missing accessibility ids before wiring selectors:
   - iOS: SwiftUI `.accessibilityIdentifier("…")` in `ios/Marlow/Marlow/Features/`
   - Android: Compose `Modifier.a11y("…")` in `android/Marlow/.../ui/`
     Prefer ids that match web `data-testid`s when the concept exists on both.
4. Selectors: `$("~id")` first; iOS predicate / Android UiAutomator only with a short comment; **never XPath**.
5. Specs stay in `appium/specs/` and only call the screen object.
6. For full native flows (not just the screen wrapper), prefer `ios-e2e-test-author` or `android-e2e-test-author`.
7. Compose text fields: a11y often lands on a non-EditText wrapper. Follow `login.screen.ts`—click the a11y node, then type into the focused `EditText` via UiAutomator when `driver.isAndroid`.

## Screen shape

```ts
export class LoginScreen {
  get email() {
    return $("~login-email");
  }

  get submit() {
    return $("~login-submit");
  }

  async waitForLoaded() {
    await this.email.waitForDisplayed({ timeout: 30000 });
  }

  async signIn(email: string, password: string) {
    await this.waitForLoaded();
    // Prefer platform-safe fill helpers (see login.screen.ts for Android Compose).
    await this.email.clearValue();
    await this.email.setValue(email);
    await this.submit.click();
  }
}

export const loginScreen = new LoginScreen();
```

## Checklist

- [ ] Accessibility ids in SwiftUI **and** Compose (or confirmed existing; same id string)
- [ ] `appium/screens/*.screen.ts` updated
- [ ] `$("~id")` (predicate / UiAutomator only if needed); no XPath
- [ ] Specs can use the screen without raw selectors
