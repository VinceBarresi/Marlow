# Marlow Appium tests

WebDriverIO + Appium XCUITest coverage for the SwiftUI customer app.

## Prerequisites

- Xcode 15+ with an iOS Simulator
- Marlow API on `http://127.0.0.1:4000` (`npm run dev` from the repo root)
- Node deps installed at the repo root (`npm install`)

## Run

```bash
npm run appium:ios
```

Builds the Simulator app, installs the XCUITest driver into `.appium/` if needed, then runs the specs.

## Layout

| Path           | Role                               |
| -------------- | ---------------------------------- |
| `wdio.conf.ts` | Capabilities + Appium service      |
| `screens/`     | Screen helpers (accessibility ids) |
| `specs/`       | Mocha specs                        |

Selectors use the same accessibility identifiers as the SwiftUI views (for example `~login-email`, `~shop-search`).
