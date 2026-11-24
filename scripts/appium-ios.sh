#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROJECT="$ROOT/ios/Marlow/Marlow.xcodeproj"
DERIVED="$ROOT/ios/Marlow/build"
APP="$DERIVED/Build/Products/Debug-iphonesimulator/Marlow.app"

if ! command -v xcodebuild >/dev/null 2>&1; then
  echo "xcodebuild not found. Install Xcode and select it with xcode-select." >&2
  exit 1
fi

echo "Building Marlow for iOS Simulator…"
xcodebuild \
  -project "$PROJECT" \
  -scheme Marlow \
  -configuration Debug \
  -sdk iphonesimulator \
  -destination "generic/platform=iOS Simulator" \
  -derivedDataPath "$DERIVED" \
  build \
  CODE_SIGNING_ALLOWED=NO

if [[ ! -d "$APP" ]]; then
  echo "Expected app at $APP" >&2
  exit 1
fi

export MARLOW_APP_PATH="$APP"
export APPIUM_HOME="${APPIUM_HOME:-$ROOT/.appium}"
mkdir -p "$APPIUM_HOME"

if ! npx appium driver list --installed 2>/dev/null | grep -q xcuitest; then
  echo "Installing Appium XCUITest driver into APPIUM_HOME=$APPIUM_HOME…"
  npx appium driver install xcuitest
fi

cd "$ROOT"
npx wdio run appium/wdio.conf.ts "$@"
