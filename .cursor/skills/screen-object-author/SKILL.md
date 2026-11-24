---
name: screen-object-author
description: >-
  Creates or extends Marlow Appium / WebDriverIO screen objects with accessibility
  id selectors. Use when the user asks for a screen object, Appium screen wrapper,
  or WDIO page object for iOS Simulator tests.
---

# Screen object author

## Instructions

1. Follow [`.cursor/rules/screen-objects.mdc`](../../rules/screen-objects.mdc), [`.cursor/rules/ios-e2e-tests.mdc`](../../rules/ios-e2e-tests.mdc), and [`.cursor/rules/tests.mdc`](../../rules/tests.mdc).
2. Study existing screens in `appium/screens/*.screen.ts` and mirror their shape.
3. **Always** add missing SwiftUI `.accessibilityIdentifier`s before wiring selectors. Prefer ids that match web `data-testid`s when the concept exists on both.
4. Selectors: `$("~id")` first; predicate only with a comment; **never XPath**.
5. Specs stay in `appium/specs/` and only call the screen object.
6. For full Simulator flows (not just the screen wrapper), prefer `ios-e2e-test-author`.

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
    await this.email.clearValue();
    await this.email.setValue(email);
    // ...
    await this.submit.click();
  }
}

export const loginScreen = new LoginScreen();
```

## Checklist

- [ ] Accessibility ids in SwiftUI (or confirmed existing)
- [ ] `appium/screens/*.screen.ts` updated
- [ ] `$("~id")` (predicate only if needed); no XPath
- [ ] Specs can use the screen without raw selectors
