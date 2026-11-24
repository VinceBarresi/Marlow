# Marlow Android

Jetpack Compose customer app mirroring [`ios/Marlow`](../../ios/Marlow) (login, shop, product, cart, checkout, orders, account). Architecture notes: [ARCHITECTURE.md](ARCHITECTURE.md).

## Prerequisites

- JDK 17+ (Android Studio’s JBR is fine)
- Android SDK + emulator via Android Studio (`ANDROID_HOME`, usually `~/Library/Android/sdk`)
- Marlow API on the host (`npm run dev` from the repo root)

Emulator traffic uses `http://10.0.2.2:4000` by default (host loopback). Override at build time:

```bash
./gradlew assembleDebug -Pmarlow.apiBaseUrl=http://192.168.1.10:4000
```

## Open / build

```bash
# from android/Marlow
cp local.properties.example local.properties   # set sdk.dir
./gradlew assembleDebug
```

APK: `app/build/outputs/apk/debug/app-debug.apk`

Boot an AVD (Device Manager, or `emulator -avd <name>`), then confirm `adb devices`.

## Accessibility ids

Compose controls use `Modifier.a11y("…")` with the same ids as iOS `.accessibilityIdentifier` / web `data-testid` (e.g. `login-email`, `shop-search`, `tab-account`) so Appium `$("~id")` selectors stay shared.

## Appium

From the repo root, with the API and emulator up:

```bash
npm run appium:android
```

Shared specs/screens: [`appium/`](../../appium/). Details: [appium/README.md](../../appium/README.md).
