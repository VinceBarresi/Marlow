# Marlow iOS

Native SwiftUI customer app for the Marlow shop. Talks to the existing API at `http://127.0.0.1:4000` with the `datalab_session` cookie.

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

## v1 scope

Login, shop search/list, product detail, cart, ship checkout, orders, and account. Staff/admin screens stay on the web app.
