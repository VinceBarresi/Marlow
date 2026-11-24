# Marlow iOS

Native SwiftUI customer app for the Marlow shop. Talks to the existing API at `http://127.0.0.1:4000` with the `datalab_session` cookie.

How the app, API client, screens, and tests fit together: [ARCHITECTURE.md](ARCHITECTURE.md).

## Prerequisites

- Xcode 15+ (iOS 17 SDK)
- Marlow API running locally (`npm run dev` from the repo root, or at least Postgres, Redis, API, catalog, and orders)

## Run

1. Start the backend from the repo root:

   ```bash
   npm run dev
   ```

2. Open the project:

   ```bash
   open ios/Marlow/Marlow.xcodeproj
   ```

3. Select an iPhone Simulator and press Run.

Default login fields use the seeded customer:

- Email: `customer@marlow.test`
- Password: `datalab`

## Configuration

`AppConfig.apiBaseURL` defaults to `http://127.0.0.1:4000` (Simulator loopback). Override with the `MARLOW_API_BASE` environment variable in the Xcode scheme for a physical device (use your Mac’s LAN IP).

`Info.plist` sets `NSAllowsLocalNetworking` so cleartext HTTP to localhost works in development.

## Appium (Simulator)

From the repo root, with the API running (`npm run dev`) and Xcode available:

```bash
npm run appium:ios
```

That builds `Marlow.app` for the Simulator, ensures the XCUITest driver is installed under `.appium/`, and runs WebDriverIO specs in [`appium/`](../../appium/).

Optional env:

| Variable             | Default                           | Purpose                                                           |
| -------------------- | --------------------------------- | ----------------------------------------------------------------- |
| `MARLOW_APP_PATH`    | `ios/Marlow/build/.../Marlow.app` | Prebuilt `.app` (skips rebuild only if you call `appium:ios:run`) |
| `MARLOW_IOS_DEVICE`  | `iPhone 16`                       | Simulator device name                                             |
| `MARLOW_IOS_VERSION` | (unset)                           | Pin iOS version when needed                                       |

If the app is already built:

```bash
npm run appium:ios:run
```

## v1 scope

Login, shop search/list, product detail, cart, ship checkout, orders, and account. Staff/admin screens stay on the web app.
