#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ANDROID_DIR="$ROOT/android/Marlow"
APK="$ANDROID_DIR/app/build/outputs/apk/debug/app-debug.apk"

if [[ ! -d "$ANDROID_DIR" ]]; then
  echo "Missing $ANDROID_DIR" >&2
  exit 1
fi

if [[ -z "${ANDROID_HOME:-}${ANDROID_SDK_ROOT:-}" ]]; then
  DEFAULT_SDK="$HOME/Library/Android/sdk"
  if [[ -d "$DEFAULT_SDK" ]]; then
    export ANDROID_HOME="$DEFAULT_SDK"
    export ANDROID_SDK_ROOT="$DEFAULT_SDK"
  else
    echo "ANDROID_HOME / ANDROID_SDK_ROOT not set and $DEFAULT_SDK missing." >&2
    echo "Install Android Studio / SDK, then set ANDROID_HOME." >&2
    exit 1
  fi
fi

SDK="${ANDROID_HOME:-$ANDROID_SDK_ROOT}"
if [[ ! -f "$ANDROID_DIR/local.properties" ]]; then
  echo "sdk.dir=$SDK" >"$ANDROID_DIR/local.properties"
  echo "Wrote $ANDROID_DIR/local.properties"
fi

if ! command -v java >/dev/null 2>&1; then
  echo "Java not found on PATH. Install JDK 17+ (Android Studio embeds one)." >&2
  exit 1
fi

if ! command -v adb >/dev/null 2>&1; then
  export PATH="$SDK/platform-tools:$PATH"
fi

if ! command -v adb >/dev/null 2>&1; then
  echo "adb not found. Install Android platform-tools." >&2
  exit 1
fi

DEVICES="$(adb devices | awk 'NR>1 && $2=="device" {print $1}')"
if [[ -z "$DEVICES" ]]; then
  echo "No Android device/emulator online. Start an AVD (or plug in a device) and retry." >&2
  exit 1
fi

echo "Building Marlow debug APK…"
(
  cd "$ANDROID_DIR"
  ./gradlew assembleDebug --quiet
)

if [[ ! -f "$APK" ]]; then
  echo "Expected APK at $APK" >&2
  exit 1
fi

export MARLOW_ANDROID_APP_PATH="$APK"
export APPIUM_HOME="${APPIUM_HOME:-$ROOT/.appium}"
mkdir -p "$APPIUM_HOME"

if ! npx appium driver list --installed 2>/dev/null | grep -q uiautomator2; then
  echo "Installing Appium UiAutomator2 driver into APPIUM_HOME=${APPIUM_HOME}..."
  npx appium driver install uiautomator2
fi

cd "$ROOT"
npx wdio run appium/wdio.android.conf.ts "$@"
