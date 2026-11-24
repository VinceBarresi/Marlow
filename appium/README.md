# Marlow Appium tests

WebDriverIO + Appium coverage for the native customer apps (iOS XCUITest, Android UiAutomator2). Screen objects and specs are shared; both platforms expose the same accessibility ids.

## Prerequisites

- Marlow API on `http://127.0.0.1:4000` (`npm run dev` from the repo root)
- Node deps installed at the repo root (`npm install`)

### iOS

- Xcode 15+ with an iOS Simulator

### Android

- JDK 17+, Android SDK, and a running emulator or device (`adb devices`)
- `ANDROID_HOME` (or the default `~/Library/Android/sdk`)

## Run

```bash
npm run appium:ios
npm run appium:android
```

Each script builds the platform app, installs the Appium driver into `.appium/` if needed, then runs the specs.

Prebuilt app only:

```bash
npm run appium:ios:run
npm run appium:android:run
```

## Layout

| Path                   | Role                          |
| ---------------------- | ----------------------------- |
| `wdio.ios.conf.ts`     | iOS capabilities + service    |
| `wdio.android.conf.ts` | Android capabilities + service |
| `screens/`             | Screen helpers (`$("~id")`)   |
| `specs/`               | Mocha specs (shared)          |

## Env overrides

| Variable                 | Default / notes                                      |
| ------------------------ | ---------------------------------------------------- |
| `MARLOW_APP_PATH`        | Built iOS `.app`                                     |
| `MARLOW_IOS_DEVICE`      | `iPhone 16`                                          |
| `MARLOW_ANDROID_APP_PATH`| Built debug APK                                      |
| `MARLOW_ANDROID_DEVICE`  | `Android Emulator`                                   |
| `MARLOW_ANDROID_UDID`    | Optional `adb` serial                                |
| `APPIUM_HOME`            | `$REPO/.appium`                                      |
