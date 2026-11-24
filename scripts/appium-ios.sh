#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROJECT="$ROOT/ios/Marlow/Marlow.xcodeproj"
DERIVED="$ROOT/ios/Marlow/build"
APP="$DERIVED/Build/Products/Debug-iphonesimulator/Marlow.app"

XCODE_DEV="/Applications/Xcode.app/Contents/Developer"
if [[ -d "$XCODE_DEV" ]]; then
  # Prefer full Xcode even when xcode-select still points at Command Line Tools.
  export DEVELOPER_DIR="${DEVELOPER_DIR:-$XCODE_DEV}"
fi

if ! command -v xcodebuild >/dev/null 2>&1; then
  echo "xcodebuild not found. Install Xcode from the App Store." >&2
  exit 1
fi

if xcodebuild -version 2>&1 | grep -q "requires Xcode"; then
  echo "Active developer directory is Command Line Tools, not Xcode." >&2
  echo "Fix once with:" >&2
  echo "  sudo xcode-select -s /Applications/Xcode.app/Contents/Developer" >&2
  echo "Then open Xcode once to finish setup / accept the license." >&2
  exit 1
fi

if [[ ! -d "$PROJECT" ]]; then
  echo "Missing $PROJECT — check out feature/ios-marlow (or a branch that includes ios/Marlow)." >&2
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
npx wdio run appium/wdio.ios.conf.ts "$@"
